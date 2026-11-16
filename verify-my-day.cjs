const {chromium} = require('playwright-core');
const {readFileSync} = require('node:fs');
const assert = require('node:assert/strict');

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
    await page.evaluate(async () => {
      const list = {id: crypto.randomUUID(), name: '验收清单'};
      const tasks = ['详情用例', '右键用例'].map(name => freshTask(name, list.id));
      const repo = 'fixture/my-day';
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
    await task('详情用例').locator('.title').click();
    await page.getByRole('button', {name:'添加截止日期',exact:true}).click();
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
    await task('右键用例').waitFor();
    await day.click();
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
