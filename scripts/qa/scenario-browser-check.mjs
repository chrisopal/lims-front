import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from '../../.qa-tools/node_modules/playwright/index.mjs';
import {chooseOption} from './element-controls.mjs';
const base=process.env.QA_BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch();const results=[];await fs.mkdir('qa-artifacts/screenshots',{recursive:true});
for(const width of [1440,390]){
 const context=await browser.newContext({viewport:{width,height:900},locale:'zh-CN'});const page=await context.newPage();page.setDefaultTimeout(8000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const entry={name:'scenario-publish-activate-runtime',width,passed:false};
 try{
 await page.goto(base+'/#/app/scenarios');await page.getByRole('button',{name:'新建场景包',exact:true}).click();const dialog=page.getByRole('dialog');await dialog.getByRole('textbox').nth(0).fill('浏览器验收现场检测');await dialog.getByRole('textbox').nth(1).fill('qa-onsite');await dialog.getByRole('button',{name:'创建草稿'}).click();await page.getByRole('heading',{name:'浏览器验收现场检测',exact:true}).waitFor();
 const studioUrl=page.url();const read=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('lims.demo.scenarios.v1')));
 let s=await read();let v=s.versions.find(v=>v.definition.key==='qa-onsite');assert(v&&v.status==='DRAFT');
 await page.getByRole('button',{name:'03 检测项与方法'}).click();await page.getByRole('button',{name:'从检测项库选择'}).click();await page.getByRole('dialog').getByRole('button',{name:'绑定',exact:true}).first().click();await page.getByRole('dialog').getByRole('button',{name:'完成',exact:true}).click();
 await page.getByRole('button',{name:'保存草稿',exact:true}).click();await page.getByText('草稿已保存',{exact:true}).waitFor();await page.reload();await page.getByRole('button',{name:'03 检测项与方法'}).click();assert.equal(await page.locator('.studio-main .el-table__body-wrapper tbody tr').count(),1);
 await page.getByRole('button',{name:'05 检测流程'}).click();await page.getByRole('button',{name:'添加现场检测准备',exact:true}).click();await page.locator('.flow-node').last().getByRole('button',{name:'上移节点',exact:true}).click();await page.locator('.flow-node').nth(3).getByRole('button',{name:'上移节点',exact:true}).click();await page.getByRole('button',{name:'保存草稿',exact:true}).click();await page.getByText('草稿已保存',{exact:true}).waitFor();s=await read();v=s.versions.find(v=>v.definition.key==='qa-onsite');assert(v.definition.nodes.some(n=>n.nodeType==='ONSITE_INSPECTION'));
 await page.getByRole('button',{name:'校验',exact:true}).click();await page.getByText('配置校验通过，可以发布新快照',{exact:true}).waitFor();await page.getByRole('button',{name:'发布',exact:true}).click();await page.getByRole('button',{name:'创建新版本',exact:true}).waitFor();s=await read();v=s.versions.find(x=>x.definition.key==='qa-onsite');assert.equal(v.status,'PUBLISHED');assert(!s.activations[v.id]?.length);
 await page.goto(base+'/#/app/scenarios/activation');const row=page.getByRole('row').filter({hasText:'浏览器验收现场检测'});await row.getByRole('button',{name:'配置范围'}).click();await chooseOption(page,page.getByRole('dialog').locator('.el-select'),'华东食品实验室');await page.getByRole('dialog').getByText('配置激活范围',{exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'保存范围'}).click();await page.getByText('激活范围已保存',{exact:true}).waitFor();s=await read();assert(s.activations[v.id].includes('华东食品实验室'));
 await page.goto(base+'/#/app/operations/requests');await page.getByRole('button').filter({has:page.getByText('浏览器验收现场检测',{exact:true})}).click();await page.getByRole('button',{name:'使用此场景',exact:true}).click();await page.locator('.wizard-main').waitFor();const runtime=await page.evaluate(()=>JSON.parse(localStorage.getItem('lims.demo.runtime.v1')));assert.equal(runtime.drafts[0].snapshot.snapshotRef,v.definition.snapshotRef);
 await page.goto(studioUrl);await page.getByRole('button',{name:'创建新版本',exact:true}).click();await page.locator('.studio-main').waitFor();await page.getByRole('textbox').first().fill('新版本名称');await page.getByRole('button',{name:'保存草稿',exact:true}).click();await page.getByText('草稿已保存',{exact:true}).waitFor();s=await read();assert.equal(s.versions.find(x=>x.id===v.id).definition.name,'浏览器验收现场检测');const r=await page.evaluate(()=>JSON.parse(localStorage.getItem('lims.demo.runtime.v1')));assert.equal(r.drafts[0].snapshot.name,'浏览器验收现场检测');
 assert.equal(errors.length,0,errors.join('\n'));entry.passed=true;await page.screenshot({path:`qa-artifacts/screenshots/scenario-cycle-${width}.png`,fullPage:true});
 }catch(e){entry.error=e.message;await page.screenshot({path:`qa-artifacts/screenshots/scenario-fail-${width}.png`,fullPage:true}).catch(()=>{})}
 results.push(entry);console.log(JSON.stringify(entry));await context.close();
}
await browser.close();await fs.writeFile('qa-artifacts/scenario-browser.json',JSON.stringify(results,null,2));if(results.some(r=>!r.passed))process.exitCode=1;
