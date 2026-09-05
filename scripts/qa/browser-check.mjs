import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Test tooling is isolated from application dependencies in .qa-tools.
const toolRoot = process.env.QA_TOOL_ROOT || '.qa-tools';
const { chromium } = await import(pathToFileURL(path.resolve(toolRoot, 'node_modules/playwright/index.mjs')).href);
const baseURL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const out = process.env.QA_OUTPUT || 'qa-artifacts';
await fs.mkdir(path.join(out, 'screenshots'), { recursive: true });
const browser = await chromium.launch({ headless: true });
const sizes = [{ width: 1366, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }, { width: 390, height: 844 }];
const routes = [
  ['login', '/login'],
  ['dashboard', '/app/dashboard'],
  ['scenarios', '/app/scenarios'],
  ['studio', '/app/scenarios/studio'],
  ['requests', '/app/operations/requests'],
  ['workflow', '/app/workflow/designer'],
  ['published', '/app/scenarios/published'],
  ['my-work', '/app/operations/my-work'],
  ['field-sampling', '/app/workbench/field-sampling'],
  ['metrology', '/app/workbench/metrology'],
];
const report = { commit: process.env.QA_COMMIT || 'local', browser: browser.version(), fixedTime: '2026-09-05T12:00:00Z', pages: [], interactions: [], scope: 'Chromium production preview, not backend E2E or an approved screenshot baseline' };

for (const viewport of sizes) {
  for (const [name, route] of routes) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, locale: 'zh-CN', timezoneId: 'Asia/Shanghai', colorScheme: 'light', reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.clock.setFixedTime(new Date(report.fixedTime));
    const errors = []; const warnings = []; const failedRequests = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); if (msg.type() === 'warning') warnings.push(msg.text()); });
    page.on('requestfailed', req => failedRequests.push({ url: req.url().split('?')[0], error: req.failure()?.errorText }));
    const entry = { name, route, viewport, errors, warnings, failedRequests };
    try {
      await page.goto(`${baseURL}/#${route}`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.locator('#app').waitFor({ state: 'visible' });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(200);
      entry.layout = await page.evaluate(() => {
        const main = document.querySelector('.main-content');
        const nav = document.querySelector('.sidebar');
        const rect = el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right }; };
        const visible = el => !!(el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
        const overflow = [...document.querySelectorAll('.main-content, .topbar, .studio-header, .workflow-header, .page-header, .header-actions')].filter(visible).map(el => ({ class: el.className, scrollWidth: el.scrollWidth, clientWidth: el.clientWidth, rect: rect(el) })).filter(el => el.scrollWidth > el.clientWidth + 2 || el.rect.right > innerWidth + 2);
        const headings = [...document.querySelectorAll('h1, .page-title, .panel-title, .title-row')].filter(visible).slice(0, 12).map(el => ({ text: el.textContent.trim(), fontSize: getComputedStyle(el).fontSize, color: getComputedStyle(el).color }));
        return { pageWidth: innerWidth, documentWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth, main: main && rect(main), nav: nav && { ...rect(nav), display: getComputedStyle(nav).display }, overflow, headings, textLength: document.querySelector('#app')?.innerText.trim().length || 0 };
      });
      entry.screenshot = `screenshots/${name}-${viewport.width}.png`;
      await page.screenshot({ path: path.join(out, entry.screenshot), fullPage: true, animations: 'disabled' });
      entry.passed = errors.length === 0 && failedRequests.length === 0 && entry.layout.textLength > 20 && entry.layout.documentWidth <= viewport.width + 2 && entry.layout.overflow.length === 0 && (viewport.width > 768 || !entry.layout.main || entry.layout.main.width >= viewport.width - 34);
    } catch (e) { entry.passed = false; entry.failure = e.message; }
    report.pages.push(entry);
    console.log(`${entry.passed ? 'PASS' : 'FAIL'} ${name} ${viewport.width}: errors=${errors.length}, overflow=${entry.layout?.overflow.length ?? 'unknown'}`);
    await context.close();
  }
}

// Verify actual page transitions without pretending mock save/publish buttons are backend E2E.
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'zh-CN', timezoneId: 'Asia/Shanghai' });
const page = await ctx.newPage();
await page.clock.setFixedTime(new Date(report.fixedTime));
async function check(name, fn) {
  try { await fn(); report.interactions.push({ name, passed: true }); console.log(`PASS interaction: ${name}`); }
  catch (e) { report.interactions.push({ name, passed: false, error: e.message }); console.log(`FAIL interaction: ${name}: ${e.message}`); }
}
await check('dashboard new request navigation', async () => {
  await page.goto(`${baseURL}/#/app/dashboard`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /新建委托/ }).click();
  await page.waitForURL('**/#/app/operations/requests');
});
await check('scenario search and selection', async () => {
  await page.goto(`${baseURL}/#/app/operations/requests`, { waitUntil: 'networkidle' });
  const search = page.getByPlaceholder('搜索场景名称 / Key');
  await search.fill('不存在的场景');
  if (await page.locator('button.scenario-row').count() !== 0) throw new Error('Search did not filter rows');
  await search.fill('');
  await page.locator('button.scenario-row').first().click();
  await page.screenshot({ path: path.join(out, 'screenshots/request-selected-1440.png'), fullPage: true });
});
await check('studio preflight navigation', async () => {
  await page.goto(`${baseURL}/#/app/scenarios/studio`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: '发布检查', exact: true }).first().click();
  if (!await page.locator('body').innerText().then(t => /Preflight|发布前检查|发布检查/.test(t))) throw new Error('Preflight not shown');
  await page.screenshot({ path: path.join(out, 'screenshots/studio-preflight-1440.png'), fullPage: true });
});
await check('published catalog drawer', async () => {
  await page.goto(`${baseURL}/#/app/scenarios/published`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: '查看', exact: true }).first().click();
  await page.locator('.el-drawer').waitFor({ state: 'visible' });
  await page.screenshot({ path: path.join(out, 'screenshots/published-drawer-1440.png'), fullPage: true });
  await page.keyboard.press('Escape');
  await page.locator('.el-drawer').waitFor({ state: 'hidden' });
});
await ctx.close(); await browser.close();
report.summary = { pages: report.pages.length, pagesPassed: report.pages.filter(x => x.passed).length, interactions: report.interactions.length, interactionsPassed: report.interactions.filter(x => x.passed).length };
await fs.writeFile(path.join(out, 'browser-report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.summary));
if (report.pages.some(x => !x.passed) || report.interactions.some(x => !x.passed)) process.exitCode = 1;
