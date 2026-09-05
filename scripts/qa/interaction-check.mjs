import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
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
      // Element Plus drawers are visible while still translated offscreen.
      // Wait for settled geometry instead of mistaking the opening transition
      // for a permanent layout failure. The size/bounds acceptance is unchanged.
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
    await page.locator('.schema-form input').first().fill('视觉回归演示委托方');
    await shot('basic');
    await page.locator('.wizard-actions').getByRole('button', { name: '下一步', exact: true }).click();
    await page.getByRole('button', { name: '添加对象', exact: true }).click();
    assert.equal(await page.locator('.wizard-main .el-table__body-wrapper tbody tr').count(), 2);
    await shot('subjects');
    await page.locator('.wizard-actions').getByRole('button', { name: '下一步', exact: true }).click();
    await shot('items');
    await page.locator('.wizard-actions').getByRole('button', { name: '下一步', exact: true }).click();
    await fits('.wizard-main');
    assert.match(await page.locator('.confirm-grid').innerText(), /v1\.2\.0/);
    await shot('confirm');
    // Deliberately do not claim this mock submit starts a real Process Instance.
  });
  await test('workflow-inspector', async ({ page, goto, shot, fits }) => {
    await goto('/app/workflow/designer');
    await page.locator('button.process-node').first().click();
    const input = page.locator('.inspector-panel .el-input input').first();
    await input.fill('委托受理-回归检查');
    assert.match(await page.locator('button.process-node').first().innerText(), /委托受理-回归检查/);
    assert.match(await page.locator('.technical-section').innerText(), /requestAcceptanceExecutor/);
    await input.scrollIntoViewIfNeeded(); await shot('properties');
    await page.getByRole('button', { name: '验证流程', exact: true }).click();
    await fits('.el-drawer'); await shot('validation');
    await page.keyboard.press('Escape');
    await page.locator('.el-drawer').waitFor({ state: 'hidden' });
    // Validation rows are prototype data, not execution-engine validation.
  });
  await test('published-drawer', async ({ page, goto, shot, fits }) => {
    await goto('/app/scenarios/published');
    await page.getByRole('button', { name: '查看', exact: true }).first().click();
    await fits('.el-drawer'); await shot('overview');
    for (const tab of ['版本历史', '激活范围', '运行实例']) {
      await page.locator('.drawer-tabs').getByRole('button', { name: tab, exact: true }).click();
      await fits('.el-drawer'); await shot(tab === '版本历史' ? 'versions' : tab === '激活范围' ? 'activation' : 'instances');
    }
    await page.keyboard.press('Escape');
    await page.locator('.el-drawer').waitFor({ state: 'hidden' });
  });
  await test('field-sampling-controls', async ({ page, goto, shot, fits }) => {
    await goto('/app/workbench/field-sampling');
    await fits('.fsw-main');
    if (width === 390) assert((await page.locator('.fsw-main').boundingBox()).width >= 358, 'Nested execution panel squeezed');
    await page.locator('.fsw-main').scrollIntoViewIfNeeded(); await shot('workspace');
    await page.getByRole('button', { name: '完成现场采样', exact: true }).click();
    await fits('.el-dialog');
    const complete = page.getByRole('button', { name: '确认完成，移交样品', exact: true });
    assert(await complete.isDisabled(), 'Required checklist must gate completion');
    await shot('required-checklist');
    await page.locator('.el-dialog').getByRole('button', { name: '取消', exact: true }).click();
    await page.locator('.fsh-bc-link').click();
    await page.waitForURL('**/#/app/operations/my-work');
  });
  await test('metrology-controls', async ({ page, goto, shot, fits }) => {
    await goto('/app/workbench/metrology');
    await fits('.ws-main');
    if (width === 390) assert((await page.locator('.ws-main').boundingBox()).width >= 358, 'Nested metrology panel squeezed');
    await page.locator('.pfc-feature').nth(1).click();
    assert.match(await page.locator('.pfc-table').innerText(), /平面度/);
    await page.locator('.pfc-table').scrollIntoViewIfNeeded(); await shot('feature');
    await page.getByRole('button', { name: '返回', exact: true }).click();
    await page.waitForURL('**/#/app/operations/my-work');
  });
}
await browser.close();
const report = { commit: process.env.QA_COMMIT || 'local', scope: 'UI-only interactions, light Chromium; no backend workflow, real authorization, signing or legal-standard validation', summary: { total: results.length, passed: results.filter(x => x.passed).length }, results };
await fs.writeFile(path.join(out, 'interaction-report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.summary));
if (results.some(x => !x.passed)) process.exitCode = 1;
