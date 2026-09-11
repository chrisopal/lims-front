import test from 'node:test';
import assert from 'node:assert/strict';
import { ScenarioRepository, validateScenario } from '../../.qa-domain/scenario-repository.js';
const fixture=()=>{let raw=null;return new ScenarioRepository({getItem:()=>raw,setItem:(_k,v)=>{raw=v}},async f=>f())};
test('publication is frozen, draft edit cannot alter history and activation controls availability',async()=>{const repo=fixture();const source=repo.read().versions[0];let draft=await repo.fork(source.id);draft.definition.name='changed';draft=await repo.save(draft);const published=await repo.publish(draft.id,draft.revision);assert.equal(published.status,'PUBLISHED');await assert.rejects(repo.save(published),/已发布/);assert.equal(repo.read().versions.find(v=>v.id===source.id).definition.name,source.definition.name);await repo.activate(published.id,['测试实验室']);assert(repo.available().some(s=>s.snapshotRef===published.definition.snapshotRef));await repo.activate(published.id,[]);assert(!repo.available().some(s=>s.snapshotRef===published.definition.snapshotRef))});
test('missing fields or invalid registered node block publication',async()=>{const repo=fixture();const draft=await repo.fork(repo.read().versions[0].id);draft.definition.nodes[0].nodeType='REMOTE_SCRIPT';assert(validateScenario(draft).length);await repo.save(draft);await assert.rejects(repo.publish(draft.id,draft.revision+1),/校验/)});
test('concurrent edits are rejected',async()=>{const repo=fixture();const draft=await repo.fork(repo.read().versions[0].id);await repo.save(draft);await assert.rejects(repo.save(draft),/其他窗口/)});
test('configuration offers send-in, sampling, onsite, battery and university scenes',()=>{const defs=fixture().available();assert(defs.length>=6);assert(defs.some(s=>s.mode==='高校科研'));assert(defs.some(s=>s.domain==='新能源'));assert(defs.some(s=>s.nodes.some(n=>n.nodeType==='ONSITE_INSPECTION')&&!s.nodes.some(n=>n.nodeType==='SAMPLE_RECEIPT')))});
test('corrupt storage is not silently replaced',()=>{const repo=new ScenarioRepository({getItem:()=>'{broken',setItem:()=>{}},async f=>f());assert.throws(()=>repo.read(),/存储/)});
test('bound assets are required and copied into the runtime definition',async()=>{
 const repo=fixture();let v=await repo.fork(repo.read().versions[0].id);v.bindings={reports:['report-v1']};v=await repo.save(v);
 await assert.rejects(repo.publish(v.id,v.revision),/绑定资产/);
 const asset={id:'report-v1',kind:'reports',name:'冻结报告模板',code:'RPT',version:'v1.0.0',status:'ACTIVE',data:{sections:['检测结果']}};
 const published=await repo.publish(v.id,v.revision,[asset]);asset.data.sections[0]='后来修改';
 assert.deepEqual(published.definition.assets[0].data.sections,['检测结果']);
});
