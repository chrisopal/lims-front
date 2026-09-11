import test from 'node:test';
import assert from 'node:assert/strict';
import { CatalogRepository, decodeCatalogState, seedRecords } from '../../.qa-domain/catalog-repository.js';

function harness(initial = null, options = {}) {
  let value = initial;
  const storage = {
    getItem: () => value,
    setItem: (_key, next) => {
      if (options.failWrite) throw new Error('blocked');
      value = next;
    },
  };
  const repository = new CatalogRepository(storage, async job => job(), options.notify || (() => {}), () => `generated-${Date.now()}`);
  return { repository, storage };
}

test('seed records cover scenario assets and every catalog kind', () => {
  const records = seedRecords();
  assert.ok(records.length >= 35);
  for (const kind of ['test-items', 'standards', 'methods', 'limits', 'forms', 'reports', 'equipment', 'personnel', 'labs', 'orgs', 'roles', 'settings', 'integrations', 'ai-skills']) assert.ok(records.some(record => record.kind === kind), kind);
  const foodPb = records.find(record => record.code === 'FOOD.PB');
  assert.deepEqual(foodPb?.data, { standard: 'GB 5009.12-2023', method: 'ICP-MS Pb v2.1', limit: 'Food Pb Limit v3', category: 'FOOD', unit: 'mg/kg', description: '铅 Pb 的演示检测项，引用场景快照中的资产关系。' });
});

test('repository persists create, update, status and delete with readback', async () => {
  const { repository } = harness();
  const record = { id: 'catalog:test-items:custom', kind: 'test-items', name: '总磷', code: 'ENV.TP', version: 'v1.0.0', status: 'ACTIVE', data: { standard: 'HJ 91.1-2019', method: '钼酸铵法', limit: 'Discharge TP v1', category: 'ENV', unit: 'mg/L' } };
  const saved=await repository.save(record);
  assert.equal(repository.read().records.find(item => item.id === record.id)?.name, '总磷');
  await assert.rejects(repository.save({...saved,version:'v1.1.0'}),/资产编码与版本/);
  await repository.save({ ...saved, name: '总磷（修订）', status: 'INACTIVE' });
  const updated = repository.read().records.find(item => item.id === record.id);
  assert.equal(updated?.name, '总磷（修订）');
  assert.equal(updated?.version, 'v1.0.0');
  assert.equal(updated?.status, 'INACTIVE');
  await repository.remove(record.id);
  assert.equal(repository.read().records.some(item => item.id === record.id), false);
});

test('same code may have multiple versions, but duplicate version and missing domain fields fail', async () => {
  const { repository } = harness();
  const base = { id: 'catalog:methods:m', kind: 'methods', name: '方法', code: 'M-1', version: 'v1.0.0', status: 'ACTIVE', data: { principle: '原理', scope: '范围', equipment: '设备', qualification: '确认' } };
  await repository.save(base);
  await repository.save({ ...base, id: 'catalog:methods:m2', version: 'v2.0.0' });
  assert.equal(repository.read().records.filter(item => item.code === 'M-1').length, 2);
  await assert.rejects(() => repository.save({ ...base, id: 'catalog:methods:m3' }), /版本 v1.0.0 已存在/);
  await assert.rejects(() => repository.save({ ...base, id: 'catalog:methods:m4', code: 'M-2', data: { principle: '原理' } }), /必填业务字段/);
});

test('record revisions reject stale edits and form fields are validated structurally', async () => {
  const { repository } = harness();
  const form = { id: 'catalog:forms:f', kind: 'forms', name: '结构化表单', code: 'FORM-1', version: 'v1', status: 'ACTIVE', data: { category: '现场', scope: '采样', fields: [{ key: 'point', label: '点位', type: 'text', required: true }] } };
  const saved = await repository.save(form);
  assert.equal(saved.revision, 0);
  const updated = await repository.save({ ...saved, name: '结构化表单修订' });
  assert.equal(updated.revision, 1);
  await assert.rejects(() => repository.save({ ...saved, name: '过期修改' }), /已在其他窗口更新/);
  await assert.rejects(() => repository.save({ ...updated, data: { ...updated.data, fields: [{ key: 'bad-key', label: '无效', type: 'text' }] } }), /动态表单字段/);
});

test('malformed storage and writes fail visibly without replacing data', async () => {
  assert.throws(() => decodeCatalogState('{"schemaVersion":1,"revision":0,"records":[{"id":"x"}]}'), /本地目录数据格式异常/);
  const { repository } = harness(null, { failWrite: true });
  const record = { id: 'catalog:labs:l', kind: 'labs', name: '实验室', code: 'L-1', version: 'v1', status: 'ACTIVE', data: { capability: '检测', location: '上海', timezone: 'Asia/Shanghai', contact: '运营台', capacity: '中型' } };
  await assert.rejects(() => repository.save(record), /保存失败/);
  assert.equal(repository.read().records.some(item => item.id === record.id), false);
  assert.ok(repository.read().records.length >= 35);
});

test('the last administrative role cannot be disabled', async () => {
 const memory = new Map(); const repo = new CatalogRepository({ getItem: k => memory.get(k) || null, setItem: (k,v) => memory.set(k,v) }, async job => job());
 const admin=repo.read().records.find(r=>r.code==='ROLE-ADMIN');
 await assert.rejects(repo.save({...admin,status:'INACTIVE'}), /至少保留/);
 assert.equal(repo.read().records.find(r=>r.id===admin.id).status,'ACTIVE');
});

test('seed records also reject stale edits and record saved changes', async () => {
 const memory=new Map();const repo=new CatalogRepository({getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)},async f=>f());
 const original=repo.read().records.find(r=>r.kind==='test-items');const changed={...original,name:'第一次保存'};
 await repo.save(changed);await assert.rejects(repo.save({...original,name:'覆盖'}),/其他窗口/);
 assert.equal(repo.read().records.find(r=>r.id===original.id).name,'第一次保存');assert(repo.read().events.some(e=>e.targetId===original.id));
});
