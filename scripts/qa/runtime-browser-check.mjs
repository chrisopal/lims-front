import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {demoScenarios} from '../../.qa-domain/scenarios.js';
const {chromium}=await import(pathToFileURL(path.resolve(process.env.QA_TOOL_ROOT||'.qa-tools','node_modules/playwright/index.mjs')).href);
const base=process.env.QA_BASE_URL||'http://127.0.0.1:4173';const out=process.env.QA_OUTPUT||'qa-artifacts';const key='lims.demo.runtime.v1';
await fs.mkdir(path.join(out,'screenshots'),{recursive:true});const browser=await chromium.launch();const results=[];
async function run(name,width,fn){
 const context=await browser.newContext({viewport:{width,height:width===390?844:900},locale:'zh-CN',timezoneId:'Asia/Shanghai',reducedMotion:'reduce'});
 const page=await context.newPage();page.setDefaultTimeout(7000);await page.clock.setFixedTime(new Date('2026-09-05T13:00:00Z'));
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 const entry={name,width,passed:false,errors,screenshots:[]};
 const goto=async route=>{await page.goto(`${base}/#${route}`,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready)};
 const shot=async suffix=>{const file=`screenshots/runtime-${name}-${suffix}-${width}.png`;await page.screenshot({path:path.join(out,file),fullPage:true,animations:'disabled'});entry.screenshots.push(file)};
 const read=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
 const next=()=>page.locator('.wizard-actions').getByRole('button',{name:'下一步',exact:true}).click();
 async function start(index=0){await goto('/app/operations/requests');await page.locator('button.scenario-row').nth(index).click();await page.getByRole('button',{name:'使用此场景',exact:true}).click();await page.locator('.wizard-main').waitFor({state:'visible'})}
 async function fillFields(fields,prefix='request',target=page){for(const field of fields){const input=target.locator(`#${prefix}-${field.key}`);if(field.type==='select'){await input.click();await target.getByRole('option',{name:field.options[0],exact:true}).click()}else{await input.fill(field.type==='date'?'2026-09-10':field.key==='value'?'20.005':`演示-${field.key}`)}}await target.locator('h1').first().click()}
 async function fillSubjects(scene){const row=page.locator('.wizard-main .el-table__body-wrapper tbody tr').first();for(const f of scene.subjectFields){if(f.type==='select'){await row.locator('.el-select').click();await page.getByRole('option',{name:f.options[0],exact:true}).click()}else await row.getByRole('textbox',{name:f.label,exact:true}).fill(f.key==='quantity'?'1':`DEMO-${f.key}`)}}
 async function ready(index=0){const scene=demoScenarios[index];await start(index);await fillFields(scene.requestFields);await next();await fillSubjects(scene);await next();return scene}
 async function fits(selector){const r=await page.locator(selector).boundingBox();assert(r&&r.width>=Math.min(300,width-32)&&r.x>=-2&&r.x+r.width<=width+2,`${selector}: ${JSON.stringify(r)}`);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'page overflow')}
 try{await fn({page,context,goto,shot,read,next,start,fillFields,fillSubjects,ready,fits});assert.equal(errors.length,0,errors.join('\n'));entry.passed=true}catch(e){entry.error=e.message;await shot('failure').catch(()=>{})}
 results.push(entry);console.log(`${entry.passed?'PASS':'FAIL'} runtime ${name} ${width}${entry.error?': '+entry.error:''}`);await context.close();
}
for(const width of [1440,390]){
 for(const index of [0,1,2])await run(`sequence-${index}`,width,async({page,shot,read,next,ready,fillFields,fits})=>{
   const scene=await ready(index);await next();await page.getByRole('button',{name:'提交并创建本地工作项',exact:true}).click();await page.waitForURL('**/#/app/operations/my-work?requestId=*');
   let data=await read();assert.equal(data.requests.length,1);assert.equal(data.workItems.length,1);const bound=JSON.stringify(data.requests[0].snapshot);assert.equal(data.requests[0].snapshot.version,scene.version);
   await page.getByRole('button',{name:'打开工作台',exact:true}).first().click();await page.locator('.record-panel').waitFor({state:'visible'});
   for(let n=0;n<scene.nodes.length;n++){
     await page.getByRole('button',{name:'开始处理',exact:true}).click();await page.locator('.record-panel input, .record-panel textarea').first().waitFor({state:'visible'});
     await fillFields(scene.nodes[n].fields,'record');
     if(scene.nodes[n].requiresConfirmation){await page.getByRole('button',{name:'完成当前节点（演示）',exact:true}).click();assert.match(await page.locator('.record-errors').innerText(),/请确认/);await page.getByRole('checkbox').check()}
     if(n===0){await page.getByRole('button',{name:'保存节点记录',exact:true}).click();await page.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).workItems[0].revision===2,key);await page.reload({waitUntil:'networkidle'});const input=page.locator(`#record-${scene.nodes[0].fields[0].key}`);assert((await input.inputValue()).length>0);await fits('.runtime-main');await shot('record-saved')}
     await page.getByRole('button',{name:'完成当前节点（演示）',exact:true}).click();await page.waitForFunction(({k,n})=>JSON.parse(localStorage.getItem(k)).workItems[n].status==='COMPLETED',{k:key,n});
     data=await read();assert.equal(data.workItems.length,Math.min(scene.nodes.length,n+2));assert.equal(JSON.stringify(data.requests[0].snapshot),bound);
     if(n<scene.nodes.length-1){await page.getByRole('button',{name:'打开下一工作项',exact:true}).click();await page.getByRole('button',{name:'开始处理',exact:true}).waitFor({state:'visible'})}
   }
   data=await read();assert.equal(data.requests[0].status,'COMPLETED');assert(data.workItems.every(w=>w.status==='COMPLETED'));assert.equal(await page.getByRole('button',{name:'保存节点记录',exact:true}).count(),0);await shot('completed');
 });
 await run('draft-and-selection',width,async({page,shot,start,next,fillFields,fillSubjects,read,goto})=>{
   const scene=demoScenarios[0];await start();await next();assert.match(await page.locator('.validation-list').innerText(),/请填写/);assert.equal(await page.locator('#request-customer').count(),1);
   await fillFields(scene.requestFields);await next();await fillSubjects(scene);await next();
   assert.equal(await page.locator('.el-table__body-wrapper input[type="checkbox"]:checked').count(),3);
   await page.locator('.el-table__header-wrapper input[type="checkbox"]').uncheck();await next();assert.match(await page.locator('.validation-list').innerText(),/至少选择一个检测项/);
   await page.locator('.el-table__body-wrapper input[type="checkbox"]').first().check();await page.getByRole('button',{name:'保存草稿',exact:true}).click();await page.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).drafts[0].revision===1,key);
   const id=(await read()).drafts[0].id;await page.reload({waitUntil:'networkidle'});assert.equal(await page.locator('#request-customer').inputValue(),'演示-customer');await next();await next();assert.equal(await page.locator('.el-table__body-wrapper input[type="checkbox"]:checked').count(),1);
   await next();assert.match(await page.locator('.confirm-grid').innerText(),/1 项/);await shot('one-item');await page.getByRole('button',{name:'提交并创建本地工作项',exact:true}).click();await page.waitForURL('**/my-work?requestId=*');
   const s=await read();assert.equal(s.requests[0].itemCodes.length,1);await goto(`/app/operations/requests?draftId=${id}`);await page.waitForURL('**/my-work?requestId=*');assert.equal((await read()).requests.length,1);
 });
}
await run('unsaved-navigation',1440,async({page,start,shot})=>{
 await start();await page.locator('#request-customer').fill('尚未保存');await page.getByRole('button',{name:'返回场景选择',exact:true}).click();await page.getByRole('button',{name:'继续编辑',exact:true}).click();assert.equal(await page.locator('#request-customer').inputValue(),'尚未保存');await shot('guard');
});
await run('cross-tab-conflict',1440,async({page,context,start,read,shot})=>{
 await start();const other=await context.newPage();await other.goto(page.url(),{waitUntil:'networkidle'});await other.locator('#request-customer').fill('第二窗口未保存');
 await page.locator('#request-customer').fill('第一窗口已保存');await page.getByRole('button',{name:'保存草稿',exact:true}).click();await page.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).drafts[0].revision===1,key);
 await other.getByRole('button',{name:'保存草稿',exact:true}).click();await other.getByRole('alert').filter({hasText:'草稿已由其他窗口更新'}).waitFor({state:'visible'});assert.equal((await read()).drafts[0].data.customer,'第一窗口已保存');assert.equal(await other.locator('#request-customer').inputValue(),'第二窗口未保存');await other.close();await shot('first-write-retained');
});
await run('storage-write-failure',390,async({page,start,read,shot})=>{
 await start();await page.locator('#request-customer').fill('不能丢失的演示输入');const before=await read();await page.evaluate(k=>{const old=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key===k)throw new DOMException('Full','QuotaExceededError');return old.call(this,key,value)}},key);
 await page.getByRole('button',{name:'保存草稿',exact:true}).click();await page.getByRole('alert').filter({hasText:'保存失败'}).waitFor({state:'visible'});assert.equal(await page.locator('#request-customer').inputValue(),'不能丢失的演示输入');assert.deepEqual(await read(),before);await shot('error');
});
await run('corrupted-state',390,async({page,goto,shot})=>{
 await page.addInitScript(k=>localStorage.setItem(k,'{broken'),key);await goto('/app/operations/requests');await page.getByRole('alert').filter({hasText:'原数据未覆盖'}).waitFor({state:'visible'});assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),'{broken');await page.locator('button.scenario-row').first().click();assert(await page.getByRole('button',{name:'使用此场景',exact:true}).isDisabled());await shot('preserved');
});
await run('unknown-work-item',390,async({page,goto,shot})=>{await goto('/app/operations/work-items/not-a-task');assert.match(await page.locator('.runtime-workbench').innerText(),/工作项不存在/);await page.getByRole('button',{name:'返回我的工作',exact:true}).click();await page.waitForURL('**/#/app/operations/my-work');await shot('empty');});
await browser.close();const report={commit:process.env.QA_COMMIT||'local',scope:'LOCAL FRONTEND ONLY: no server APIs, authenticity checks, legal validation or physical test execution',summary:{total:results.length,passed:results.filter(r=>r.passed).length},results};await fs.writeFile(path.join(out,'runtime-browser-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report.summary));if(results.some(r=>!r.passed))process.exitCode=1;
