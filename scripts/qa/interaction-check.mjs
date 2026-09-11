import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { chooseOption } from './element-controls.mjs';
const { chromium } = await import(pathToFileURL(path.resolve(process.env.QA_TOOL_ROOT || '.qa-tools', 'node_modules/playwright/index.mjs')).href);
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const out = process.env.QA_OUTPUT || 'qa-artifacts';
await fs.mkdir(path.join(out, 'screenshots'), { recursive: true });
const browser = await chromium.launch();
const results = [];
for (const width of [1440, 390]) {
  async function test(name, fn) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 }, locale: 'zh-CN', timezoneId: 'Asia/Shanghai', reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.setDefaultTimeout(7000);
    await page.clock.setFixedTime(new Date('2026-09-05T12:00:00Z'));
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    const entry = { name, width, passed: false, errors, screenshots: [] };
    const goto = async route => { await page.goto(`${base}/#${route}`, { waitUntil: 'networkidle' }); await page.evaluate(() => document.fonts.ready); };
    const shot = async suffix => { const file = `screenshots/${name}-${suffix}-${width}.png`; await page.screenshot({ path: path.join(out, file), fullPage: true, animations: 'disabled' }); entry.screenshots.push(file); };
    const fits = async selector => {
      const el = page.locator(selector).first();
      await el.waitFor({ state: 'visible' });
      await page.waitForFunction(sel => {
        const element = document.querySelector(sel);
        if (!element) return false;
        const r = element.getBoundingClientRect();
        return r.width >= 200 && r.x >= -2 && r.right <= innerWidth + 2;
      }, selector, { timeout: 4000 });
      const r = await el.boundingBox();
      assert(r && r.width >= 200 && r.x >= -2 && r.x + r.width <= width + 2, `${selector} does not fit viewport: ${JSON.stringify(r)}`);
    };
    try { await fn({ page, goto, shot, fits }); assert.equal(errors.length, 0, errors.join('\n')); entry.passed = true; }
    catch (e) { entry.error = e.message; await shot('failure').catch(() => {}); }
    results.push(entry); console.log(`${entry.passed ? 'PASS' : 'FAIL'} ${name} ${width}${entry.error ? ': '+entry.error : ''}`);
    await context.close();
  }
  if (width === 390) await test('mobile-navigation', async ({ page, goto, shot }) => {
    await goto('/app/dashboard');
    const toggle = page.getByRole('button', { name: '打开主导航', exact: true });
    const nav = page.locator('#primary-navigation');
    assert(await nav.evaluate(el => el.inert), 'Closed navigation must be inert');
    await toggle.click();
    assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
    assert(await nav.evaluate(el => el.contains(document.activeElement)), 'Focus not moved into navigation');
    assert(await page.locator('.main-content').evaluate(el => el.inert), 'Background must be inert');
    await page.keyboard.press('Shift+Tab');
    assert(await nav.locator('.el-menu-item').last().evaluate(el => el === document.activeElement), 'Reverse focus trap failed');
    await page.keyboard.press('Tab');
    assert(await nav.locator('.el-menu-item').first().evaluate(el => el === document.activeElement), 'Forward focus trap failed');
    await shot('open');
    await page.keyboard.press('Escape');
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
    assert(await toggle.evaluate(el => el === document.activeElement), 'Focus not restored');
    await toggle.click();
    await nav.getByRole('menuitem', { name: '我的工作', exact: true }).click();
    await page.waitForURL('**/#/app/operations/my-work');
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
  });
  await test('request-wizard', async ({ page, goto, shot, fits }) => {
    await goto('/app/operations/requests');
    await page.locator('button.scenario-row').first().click();
    await page.getByRole('button', { name: '使用此场景', exact: true }).click();
    await fits('.wizard-main');
    assert.match(await page.locator('.context-header').innerText(), /v1\.2\.0/);
    await page.locator('#request-customer').fill('视觉回归演示委托方');
    await page.locator('#request-contact').fill('演示联系人');
    await chooseOption(page, page.locator('.el-select:has(#request-purpose)'), '合规检测');
    await page.locator('#request-dueDate').fill('2026-09-10');
    await page.locator('.section-head h2').click();
    await shot('basic');
    await page.locator('.wizard-actions').getByRole('button', { name: '下一步', exact: true }).click();
    await page.getByRole('button', { name: '添加对象', exact: true }).click();
    assert.equal(await page.locator('.wizard-main .el-table__body-wrapper tbody tr').count(), 2);
    for (const row of await page.locator('.wizard-main .el-table__body-wrapper tbody tr').all()) {
      await row.getByRole('textbox', {name:'样品名称',exact:true}).fill('演示样品');
      await chooseOption(page, row.locator('.el-select'), '粮食及制品');
      await row.getByRole('textbox', {name:'批次 / Lot',exact:true}).fill('DEMO-LOT');
      await row.getByRole('textbox', {name:'数量',exact:true}).fill('1');
    }
    await shot('subjects');
    await page.locator('.wizard-actions').getByRole('button', { name: '下一步', exact: true }).click();
    await shot('items');
    await page.locator('.wizard-actions').getByRole('button', { name: '下一步', exact: true }).click();
    await fits('.wizard-main');
    assert.match(await page.locator('.confirm-grid').innerText(), /v1\.2\.0/);
    await shot('confirm');
  });
  await test('workflow-inspector', async ({ page, goto, shot }) => {
    await goto('/app/scenarios/studio');
    await page.getByRole('button',{name:'创建新版本',exact:true}).click();
    await page.getByRole('button',{name:'05 检测流程',exact:true}).click();
    await page.locator('.flow-node > button').first().click();
    const input=page.locator('.flow-layout > aside').last().getByRole('textbox').first();
    await input.fill('委托受理-回归检查');
    await page.getByRole('button',{name:'保存草稿',exact:true}).click();
    await page.getByText('草稿已保存',{exact:true}).waitFor();
    await page.reload();await page.getByRole('button',{name:'05 检测流程',exact:true}).click();
    assert.match(await page.locator('.flow-node').first().innerText(),/委托受理-回归检查/);
    await shot('persisted-properties');
    await page.getByRole('button',{name:'校验',exact:true}).click();
    await page.getByText('配置校验通过，可以发布新快照',{exact:true}).waitFor();
  });
  await test('published-readonly', async ({ page, goto, shot }) => {
    await goto('/app/scenarios/published');
    await page.getByRole('button',{name:'查看快照',exact:true}).first().click();
    await page.getByText('已发布版本不可直接修改；创建新版本后编辑，不影响历史委托。',{exact:true}).waitFor();
    assert.equal(await page.getByRole('button',{name:'保存草稿',exact:true}).count(),0);
    assert(await page.locator('.studio-main input').first().isDisabled());
    await shot('immutable');
  });
  for(const [name,route] of [['field-sampling-controls','field-sampling'],['metrology-controls','metrology']])await test(name, async ({page,goto,shot})=>{
    await goto('/app/workbench/'+route);
    await page.getByText('当前没有该类型工作项。创建相应场景委托并推进到此节点后即可操作。',{exact:true}).waitFor();
    assert.equal(await page.getByRole('button',{name:'打开工作台',exact:true}).count(),0);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
    await shot('real-empty-queue');
    await page.getByRole('button',{name:'新建委托',exact:true}).click();
    await page.waitForURL('**/#/app/operations/requests');
  });
}
await browser.close();
const report = { commit: process.env.QA_COMMIT || 'local', scope: 'UI-only interactions, light Chromium; no backend workflow, real authorization, signing or legal-standard validation', summary: { total: results.length, passed: results.filter(x => x.passed).length }, results };
await fs.writeFile(path.join(out, 'interaction-report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.summary));
if (results.some(x => !x.passed)) process.exitCode = 1;
