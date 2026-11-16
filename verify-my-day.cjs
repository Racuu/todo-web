const {chromium} = require('playwright-core');
const {readFileSync} = require('node:fs');
const assert = require('node:assert/strict');

async function verifyStorage(page) {
  const result = await page.evaluate(async () => {
    const list={id:crypto.randomUUID(),name:'布局验证'};
    const task={...freshTask('测试任务',list.id),note:'测试备注',steps:[{title:'第二步',done:true}]};
    const old={format:backupFormat,version:2,groups:[],lists:[list],tasks:[task]};
    const files=readBackup(old), path=taskKey(task.id);
    const backup=makeBackup(files);
    const versions=[1,2,3].map(version=>readBackup({...backup,version}).get(path)?.data);
    const stored=new Map();
    const originalApi=api;
    let rejected=false;
    try {
      api=async (url,options)=>{
        if(options?.method==='PUT'&&url==='/contents/'+path){
          stored.set('revision',JSON.parse(options.body).content);
          return {content:{sha:'revision'}};
        }
        if(url==='/git/blobs/revision')return {content:stored.get('revision')};
        throw Error('意外请求 '+url);
      };
      const edited={...task,note:'另一端应能读到的备注'};
      await pushTask({ref:'main'},path,{base:{data:task,sha:'original'},data:edited},{});
      const tree={tree:[{path,type:'blob',sha:'revision'}]};
      const other=await loadRecords('tree',new Map(),{},tree);
      if(!equal(other.get(path).data,edited))throw Error('分目录任务跨端回读失败');
      try{await loadRecords('tree',new Map(),{},{tree:[{path:'tasks/'+task.id+'.json',type:'blob'}]})}
      catch(e){rejected=e.message.includes('路径')}
    }finally{api=originalApi}
    async function seedOld(repo,pending){
      await new Promise((resolve,reject)=>{
        const req=indexedDB.open(key+':files:'+repo+':main',1);
        req.onupgradeneeded=()=>{
          req.result.createObjectStore('files').put({data:task},'tasks/'+task.id+'.json');
          const drafts=req.result.createObjectStore('drafts');
          if(pending)drafts.put({data:task},'tasks/'+task.id+'.json');
        };
        req.onerror=()=>reject(req.error);
        req.onsuccess=()=>{req.result.close();resolve()};
      });
    }
    await seedOld('fixture/clean',false);
    const clean=await openDevice('fixture/clean','main');await readDevice(clean);
    const empty=clean.confirmed.size===0;clean.db.close();
    await seedOld('fixture/pending',true);
    let preserved=false;
    try{await openDevice('fixture/pending','main')}catch(e){
      if(!e.message.includes('待同步'))throw e;
      preserved=await new Promise((resolve,reject)=>{
        const req=indexedDB.open(key+':files:fixture/pending:main',1);
        req.onerror=()=>reject(req.error);
        req.onsuccess=()=>{
          const db=req.result,tx=db.transaction(['drafts','files']);
          const d=tx.objectStore('drafts').count(),f=tx.objectStore('files').count();
          tx.oncomplete=()=>{db.close();resolve(d.result===1&&f.result===1)};
        };
      });
    }
    return {ok:empty&&preserved&&rejected&&versions.every(t=>equal(t,task))&&backup.version===3&&
      path==='tasks/'+task.id[0]+'/'+task.id+'.json',guide:backup.fields.restore,link:backup.fields.guide};
  });
  assert.ok(result.ok,'存储布局、缓存升级或备份恢复不一致');
  assert.ok(readFileSync('docs/data.md','utf8').includes(result.guide),'导出文件与恢复说明不同步');
  assert.ok(result.link.endsWith('/docs/data.md#备份与恢复'));
}

async function run() {
  const browser = await chromium.launch({channel: 'chrome'});
  try {
    const page = await browser.newPage({timezoneId: 'Asia/Shanghai'});
    const html = readFileSync('index.html', 'utf8');
    const url = 'http://localhost/todo-web/';
    await page.route('**/*', route => route.request().url() === url
      ? route.fulfill({contentType: 'text/html; charset=utf-8', body: html})
      : route.abort());
    await page.goto(url);
    await verifyStorage(page);
    await page.evaluate(async () => {
      const list = {id: crypto.randomUUID(), name: '验收清单'};
      const tasks = ['详情用例', '右键用例'].map(name => freshTask(name, list.id));
      const repo = 'fixture/my-day';
      localStorage.setItem(key+':last-list:'+repo,list.id);
      const dev = await openDevice(repo, 'main');
      await persistRemote(dev, new Map([
        [listKey(list.id), {data:list, sha:list.id}],
        ...tasks.map(t => [taskKey(t.id), {data:t, sha:t.id}])
      ]));
      dev.db.close();
      sessionStorage.setItem(key, JSON.stringify({repo, branch:'main'}));
    });
    await page.reload();
    const day = page.locator('#smart button').filter({hasText:'我的一天'});
    const rows = page.locator('#rows article');
    const task = name => rows.filter({hasText:name});
    const listLink=page.locator('#lists .listLink').filter({hasText:'验收清单'});
    async function checkHome(){
      await listLink.waitFor({state:'attached'});
      assert.equal(await page.locator('#heading').innerText(),'我的一天');
      assert.equal(await day.getAttribute('aria-current'),'page');
    }
    await checkHome();
    await listLink.click();
    await page.evaluate(()=>render());
    assert.equal(await page.locator('#heading').innerText(),'验收清单');
    await page.setViewportSize({width:390,height:844});
    await page.reload();
    await checkHome();
    assert.ok(await page.locator('#drawer').isVisible());
    await page.setViewportSize({width:1280,height:720});
    await listLink.click();
    await task('详情用例').locator('.title').click();
    const input=page.getByRole('textbox',{name:'添加步骤'});
    await input.fill('跨行显示的示例步骤，用于检查添加框与步骤文字的起始位置。');
    await input.press('Enter');
    await page.locator('#detail .stepLabel').first().waitFor();
    for(const width of [1280,390]){
      await page.setViewportSize({width,height:844});
      const offsets=await page.locator('#detail .taskCard').evaluate(card=>{
        const textLeft=e=>e.getBoundingClientRect().left+parseFloat(getComputedStyle(e).paddingLeft)+e.clientLeft;
        const center=e=>e.getBoundingClientRect().left+e.getBoundingClientRect().width/2;
        return [
          textLeft(card.querySelector('.stepLabel'))-textLeft(card.querySelector('.stepAdd input')),
          center(card.querySelector('.step input'))-center(card.querySelector('.stepAdd button'))
        ];
      });
      assert.ok(offsets.every(delta=>Math.abs(delta)<=1),'步骤与添加行未对齐 '+width+' '+offsets);
    }
    await page.setViewportSize({width:1280,height:720});
    await page.getByRole('button',{name:'添加到“我的一天”',exact:true}).click();
    await page.getByRole('button',{name:'已添加到“我的一天”'}).waitFor();
    await day.click();
    await task('详情用例').locator('.title').click();
    await page.getByRole('button',{name:'添加截止日期',exact:true}).click();
    await page.locator('#scheduleMenu button').filter({hasText:'明天'}).click();
    await task('详情用例').waitFor({state:'detached'});
    await page.getByRole('button',{name:'添加到“我的一天”',exact:true}).waitFor();
    await page.reload();
    await checkHome();
    await listLink.click();
    await task('详情用例').waitFor();
    assert.match(await task('详情用例').innerText(),/截止 明天/);
    await day.click();
    await task('详情用例').waitFor({state:'detached'});
    await page.locator('#lists button').filter({hasText:'验收清单'}).click();
    await task('详情用例').locator('.title').click();
    await page.getByRole('button',{name:'截止于 明天'}).click();
    await page.locator('#scheduleMenu button').filter({hasText:'今天'}).click();
    await page.getByRole('button',{name:'已添加到“我的一天”'}).waitFor();
    await page.getByRole('button',{name:'关闭任务详情'}).click();
    await task('右键用例').click({button:'right'});
    await page.getByRole('button',{name:'今天到期'}).click();
    await day.click();
    await task('详情用例').waitFor();
    const titles = rows.locator('.title > span');
    const before = await titles.allTextContents();
    const first = await rows.first().locator('.title').boundingBox();
    const last = await rows.last().locator('.title').boundingBox();
    const x = last.x + last.width / 2;
    await page.mouse.move(x, last.y + last.height / 2);
    await page.mouse.down();
    await page.mouse.move(x, first.y + 2, {steps:10});
    await page.mouse.up();
    const moved = before[1];
    await page.waitForFunction(name => document.querySelector('#rows .title > span')?.textContent === name,moved);
    await page.reload();
    await checkHome();
    await listLink.click();
    await task('右键用例').waitFor();
    assert.deepEqual(await titles.allTextContents(),before,'我的一天拖动影响原清单');
    await day.click();
    await task('右键用例').waitFor();
    assert.deepEqual(await titles.allTextContents(),before.slice().reverse(),'拖动位置没有保存');
    // A held touch must move the row without selecting text or opening the task.
    await page.setViewportSize({width:390,height:844});
    const touch = await page.context().newCDPSession(page);
    await touch.send('Emulation.setTouchEmulationEnabled',{enabled:true});
    const origin = await rows.last().locator('.title').boundingBox();
    const destination = await rows.first().boundingBox();
    const point = {x:origin.x+origin.width/2,y:origin.y+origin.height/2};
    await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});
    await page.locator('#rows article.stepLifted').waitFor({timeout:4000});
    await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:point.x,y:destination.y+3}]});
    await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await page.waitForFunction(name => document.querySelector('#rows .title > span')?.textContent === name,before[0]);
    assert.ok(await page.locator('#detail').isHidden());
    assert.equal(await page.evaluate(() => String(window.getSelection())), '');
    await touch.send('Emulation.setTouchEmulationEnabled',{enabled:false});
    await touch.detach();
    await page.setViewportSize({width:1280,height:720});
    await task('右键用例').locator('.title').click();
    await page.getByRole('button',{name:'已添加到“我的一天”'}).click();
    await task('右键用例').waitFor({state:'detached'});
    await page.reload();
    await checkHome();
    await task('详情用例').waitFor();
    assert.equal(await rows.count(), 1, '手动移出的任务刷新后被重新加入');
    await task('详情用例').locator('.title').click();
    // Match the narrow center pane between the sidebar and the open detail pane.
    await page.setViewportSize({width:1100,height:780});
    const widths = await task('详情用例').evaluate(row => ({
      row:row.clientWidth, title:row.querySelector('.title').clientWidth
    }));
    assert.ok(widths.row - widths.title <= 78,'操作按钮占用过多标题宽度');
    await page.getByRole('button',{name:'截止于 今天'}).click();
    await page.locator('#scheduleMenu button').filter({hasText:'明天'}).click();
    await task('详情用例').waitFor({state:'detached'});
    await page.getByRole('button',{name:'添加到“我的一天”',exact:true}).waitFor();
    await page.reload();
    await checkHome();
    await listLink.click();
    await task('详情用例').waitFor();
    assert.match(await task('详情用例').innerText(),/截止 明天/);
    await day.click();
    assert.equal(await rows.count(),0,'改期后刷新仍留在我的一天');
    console.log('日期联动、手动移出、任务拖动、刷新持久化和窄栏布局通过');
  } finally {
    await browser.close();
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
