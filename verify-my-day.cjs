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
    await task('右键用例').locator('.title').click();
    await page.getByRole('button',{name:'已添加到“我的一天”'}).click();
    await task('右键用例').waitFor({state:'detached'});
    await page.reload();
    await task('右键用例').waitFor();
    await day.click();
    await task('详情用例').waitFor();
    assert.equal(await rows.count(), 1, '手动移出的任务刷新后被重新加入');
    console.log('详情、右键和刷新后的我的一天通过');
  } finally {
    await browser.close();
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
