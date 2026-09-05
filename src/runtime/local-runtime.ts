/** Local prototype only. No authorization, server persistence or workflow-engine guarantee. */
export interface FieldDefinition {
  key: string; label: string; type: 'text' | 'textarea' | 'select' | 'date';
  required?: boolean; options?: string[]; placeholder?: string; span?: number; width?: number;
}
export interface TestItem { code: string; name: string; standard: string; method: string; limit: string }
export interface RuntimeNode {
  key: string; label: string; nodeType: string; executor: string;
  renderer: 'record' | 'sampling' | 'measurement' | 'review'; fields: FieldDefinition[];
  requiresConfirmation?: boolean;
}
export interface ScenarioDefinition {
  id: number; key: string; name: string; version: string; mode: string; domain: string;
  activationScope: string; workflowVersion: string; active: boolean;
  snapshotRef: string; requestSchema: string; subjectSchema: string; subjectLabel: string;
  requestFields: FieldDefinition[]; subjectFields: FieldDefinition[]; testItems: TestItem[];
  nodes: RuntimeNode[];
}
export type Values = Record<string, string>;
export interface Draft {
  id: string; revision: number; status: 'DRAFT' | 'SUBMITTED'; snapshot: ScenarioDefinition;
  data: Values; subjects: Values[]; itemCodes: string[]; createdAt: string; updatedAt: string;
}
export interface LocalRequest {
  id: string; number: string; draftId: string; snapshot: ScenarioDefinition; data: Values;
  subjects: Values[]; itemCodes: string[]; status: 'IN_PROGRESS' | 'COMPLETED'; createdAt: string;
}
export interface WorkItem {
  id: string; requestId: string; nodeIndex: number; revision: number;
  status: 'READY' | 'IN_PROGRESS' | 'COMPLETED'; values: Values; confirmed: boolean;
  createdAt: string; startedAt?: string; completedAt?: string;
}
export interface LocalEvent { id: string; at: string; action: string; targetId: string; message: string }
export interface RuntimeState {
  schemaVersion: 1; revision: number; drafts: Draft[]; requests: LocalRequest[];
  workItems: WorkItem[]; events: LocalEvent[];
}
export interface Issue { path: string; message: string; step: number }
export class RuntimeError extends Error {
  constructor(public code: string, message: string) { super(message); this.name = 'RuntimeError' }
}
export const STORAGE_KEY = 'lims.demo.runtime.v1';
export const CHANGE_EVENT = 'lims-demo-runtime-change';
export const emptyState = (): RuntimeState => ({ schemaVersion: 1, revision: 0, drafts: [], requests: [], workItems: [], events: [] });
export const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const fail = (code: string, message: string): never => { throw new RuntimeError(code, message) };
const integer = (v: unknown): v is number => Number.isInteger(v) && Number(v) >= 0;
const textMap = (v: unknown): v is Values => !!v && typeof v === 'object' && !Array.isArray(v) && Object.entries(v).every(([k, x]) => !['__proto__', 'constructor', 'prototype'].includes(k) && typeof x === 'string' && x.length <= 4000);
function validFields(fields: unknown): fields is FieldDefinition[] {
  return Array.isArray(fields) && fields.length < 100 && fields.every(f => f && typeof f.key === 'string' && /^[a-zA-Z][a-zA-Z0-9_]*$/.test(f.key) && typeof f.label === 'string' && ['text','textarea','select','date'].includes(f.type) && (f.type !== 'select' || (Array.isArray(f.options) && f.options.every((v: unknown) => typeof v === 'string'))));
}
function validScenario(s: ScenarioDefinition): boolean {
  return !!s && typeof s.key === 'string' && typeof s.version === 'string' && typeof s.name === 'string' && typeof s.snapshotRef === 'string' && validFields(s.requestFields) && validFields(s.subjectFields) && Array.isArray(s.testItems) && s.testItems.length > 0 && s.testItems.every(t => t && typeof t.code === 'string' && typeof t.name === 'string') && Array.isArray(s.nodes) && s.nodes.length > 0 && s.nodes.every(n => n && typeof n.key === 'string' && typeof n.label === 'string' && validFields(n.fields) && ['record','sampling','measurement','review'].includes(n.renderer));
}
/** Reject malformed or incompatible persisted data. Never replace it with an empty successful state. */
export function decodeState(raw: string | null): RuntimeState {
  if (raw === null) return emptyState();
  try {
    const s = JSON.parse(raw) as RuntimeState;
    if (s.schemaVersion !== 1 || !integer(s.revision) || ![s.drafts,s.requests,s.workItems,s.events].every(Array.isArray)) throw Error();
    if (!s.drafts.every(d => d && typeof d.id === 'string' && integer(d.revision) && ['DRAFT','SUBMITTED'].includes(d.status) && validScenario(d.snapshot) && textMap(d.data) && Array.isArray(d.subjects) && d.subjects.every(textMap) && Array.isArray(d.itemCodes) && d.itemCodes.every(c => typeof c === 'string'))) throw Error();
    if (!s.requests.every(r => r && typeof r.id === 'string' && typeof r.number === 'string' && typeof r.draftId === 'string' && ['IN_PROGRESS','COMPLETED'].includes(r.status) && validScenario(r.snapshot) && textMap(r.data) && Array.isArray(r.subjects) && r.subjects.every(textMap) && Array.isArray(r.itemCodes))) throw Error();
    if (!s.workItems.every(w => w && typeof w.id === 'string' && integer(w.revision) && integer(w.nodeIndex) && ['READY','IN_PROGRESS','COMPLETED'].includes(w.status) && textMap(w.values) && typeof w.confirmed === 'boolean' && s.requests.some(r => r.id === w.requestId && w.nodeIndex < r.snapshot.nodes.length))) throw Error();
    if (!s.events.every(e => e && typeof e.id === 'string' && typeof e.at === 'string' && typeof e.message === 'string')) throw Error();
    for (const rows of [s.drafts,s.requests,s.workItems]) if (new Set(rows.map(r => r.id)).size !== rows.length) throw Error();
    if (new Set(s.requests.map(r => r.draftId)).size !== s.requests.length) throw Error();
    return s;
  } catch { return fail('STORAGE_INVALID', '本地演示数据格式异常或版本不兼容。原数据未覆盖，请先导出备份后检查。') }
}
export function validateFields(fields: FieldDefinition[], values: Values, prefix: string, step: number): Issue[] {
  const issues: Issue[] = [];
  for (const f of fields) {
    const value = values[f.key] || '';
    if (f.required && !value.trim()) issues.push({ path: `${prefix}.${f.key}`, message: `请填写${f.label}`, step });
    else if (value && f.type === 'select' && !f.options?.includes(value)) issues.push({ path: `${prefix}.${f.key}`, message: `${f.label}不在允许选项中`, step });
    else if (value && f.type === 'date' && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value)) || new Date(value).toISOString().slice(0,10) !== value)) issues.push({ path: `${prefix}.${f.key}`, message: `${f.label}格式无效`, step });
    if (value.length > 4000) issues.push({ path: `${prefix}.${f.key}`, message: `${f.label}超过长度限制`, step });
  }
  return issues;
}
export function validateDraft(d: Draft): Issue[] {
  const issues = validateFields(d.snapshot.requestFields, d.data, 'request', 1);
  if (!d.subjects.length) issues.push({ path: 'subjects', message: '至少添加一个检测对象', step: 2 });
  d.subjects.forEach((s,i) => issues.push(...validateFields(d.snapshot.subjectFields, s, `subjects.${i}`, 2).map(e => ({ ...e, message: `对象 ${i+1}：${e.message}` }))));
  if (!d.itemCodes.length) issues.push({ path: 'items', message: '至少选择一个检测项；取消全选不会自动恢复为全选', step: 3 });
  if (new Set(d.itemCodes).size !== d.itemCodes.length || d.itemCodes.some(c => !d.snapshot.testItems.some(t => t.code === c))) issues.push({ path: 'items', message: '检测项不属于当前场景快照或存在重复项', step: 3 });
  return issues;
}
export interface StoragePort { getItem(key: string): string | null; setItem(key: string, value: string): void }
export type LockPort = <T>(job: () => T) => Promise<T>;
/** API seam: replace this local repository with a server adapter when API contracts are implemented. */
export class LocalRuntimeRepository {
  constructor(private storage: StoragePort, private lock: LockPort, private notify: () => void = () => {}, private now: () => string = () => new Date().toISOString(), private uid: () => string = () => crypto.randomUUID()) {}
  read(): RuntimeState {
    try { return decodeState(this.storage.getItem(STORAGE_KEY)) }
    catch (e) { if (e instanceof RuntimeError) throw e; return fail('STORAGE_UNAVAILABLE', '无法读取浏览器存储；没有切换为临时成功模式。') }
  }
  private async transaction<T>(change: (state: RuntimeState) => T): Promise<T> {
    return this.lock(() => {
      const state = this.read(); const result = change(state); state.revision++;
      const encoded = JSON.stringify(state); decodeState(encoded);
      try { this.storage.setItem(STORAGE_KEY, encoded) }
      catch { return fail('STORAGE_WRITE_FAILED', '保存失败：浏览器存储被禁用或空间不足。页面输入仍保留，请勿关闭。') }
      this.notify(); return clone(result);
    });
  }
  private log(s: RuntimeState, action: string, targetId: string, message: string) {
    s.events.push({ id: this.uid(), at: this.now(), action, targetId, message });
  }
  createDraft(scenario: ScenarioDefinition): Promise<Draft> {
    return this.transaction(s => {
      if (!validScenario(scenario) || !scenario.active) return fail('SCENARIO_UNAVAILABLE', '场景未激活或缺少运行定义');
      const d: Draft = { id: this.uid(), revision: 0, status: 'DRAFT', snapshot: clone(scenario), data: {}, subjects: [{}], itemCodes: scenario.testItems.map(t => t.code), createdAt: this.now(), updatedAt: this.now() };
      s.drafts.push(d); return d;
    });
  }
  saveDraft(input: Draft): Promise<Draft> {
    return this.transaction(s => {
      const d = s.drafts.find(d => d.id === input.id);
      if (!d) return fail('NOT_FOUND', '未找到草稿');
      if (d.status !== 'DRAFT') return fail('DRAFT_READONLY', '已提交委托不可作为草稿覆盖');
      if (d.revision !== input.revision) return fail('VERSION_CONFLICT', '草稿已由其他窗口更新。请先保留当前输入，再重新打开最新草稿。');
      if (JSON.stringify(d.snapshot) !== JSON.stringify(input.snapshot)) return fail('SNAPSHOT_LOCKED', '不能在已有草稿上静默替换场景版本，请新建草稿');
      if (!textMap(input.data) || !input.subjects.every(textMap)) return fail('INVALID_INPUT', '输入格式或长度不正确');
      d.data = clone(input.data); d.subjects = clone(input.subjects); d.itemCodes = [...input.itemCodes]; d.revision++; d.updatedAt = this.now();
      return d;
    });
  }
  submitDraft(id: string, revision: number): Promise<LocalRequest> {
    return this.transaction(s => {
      const existing = s.requests.find(r => r.draftId === id);
      if (existing) return existing;
      const d = s.drafts.find(d => d.id === id);
      if (!d) return fail('NOT_FOUND', '未找到草稿');
      if (d.revision !== revision) return fail('VERSION_CONFLICT', '草稿已更新，请重新加载后提交');
      const issues = validateDraft(d);
      if (issues.length) return fail('VALIDATION_FAILED', issues[0].message);
      const requestId = this.uid();
      const request: LocalRequest = { id: requestId, number: `DEMO-${requestId.slice(0,8).toUpperCase()}`, draftId: id, snapshot: clone(d.snapshot), data: clone(d.data), subjects: clone(d.subjects), itemCodes: [...d.itemCodes], status: 'IN_PROGRESS', createdAt: this.now() };
      d.status = 'SUBMITTED'; d.revision++; d.updatedAt = this.now(); s.requests.push(request);
      s.workItems.push(this.newWork(requestId, 0));
      this.log(s, 'REQUEST_SUBMITTED', requestId, `本地提交 ${request.number}，锁定 ${request.snapshot.name} ${request.snapshot.version}`);
      return request;
    });
  }
  private newWork(requestId: string, nodeIndex: number): WorkItem {
    return { id: this.uid(), requestId, nodeIndex, revision: 0, status: 'READY', values: {}, confirmed: false, createdAt: this.now() };
  }
  startWork(id: string, revision: number): Promise<WorkItem> {
    return this.transaction(s => {
      const w = s.workItems.find(w => w.id === id);
      if (!w) return fail('NOT_FOUND', '工作项不存在');
      if (w.status === 'IN_PROGRESS') return w;
      if (w.status !== 'READY') return fail('WORK_READONLY', '已完成工作项不可重新执行');
      if (w.revision !== revision) return fail('VERSION_CONFLICT', '工作项已更新，请刷新');
      w.status = 'IN_PROGRESS'; w.startedAt = this.now(); w.revision++;
      this.log(s, 'WORK_STARTED', id, '开始本地节点记录'); return w;
    });
  }
  saveWork(id: string, revision: number, values: Values, confirmed: boolean, complete = false): Promise<WorkItem> {
    return this.transaction(s => {
      const w = s.workItems.find(w => w.id === id);
      if (!w) return fail('NOT_FOUND', '工作项不存在');
      if (complete && w.status === 'COMPLETED') return w;
      if (w.status !== 'IN_PROGRESS') return fail('WORK_READONLY', '请先开始工作；已完成记录不可覆盖');
      if (w.revision !== revision) return fail('VERSION_CONFLICT', '工作项已在其他窗口更新，请刷新后重试');
      if (!textMap(values)) return fail('INVALID_INPUT', '记录格式或长度不正确');
      const r = s.requests.find(r => r.id === w.requestId)!;
      const node = r.snapshot.nodes[w.nodeIndex];
      if (complete) {
        const issues = validateFields(node.fields, values, 'record', 1);
        if (issues.length) return fail('VALIDATION_FAILED', issues[0].message);
        if (node.requiresConfirmation && !confirmed) return fail('CONFIRMATION_REQUIRED', '请确认已核对当前节点记录（本地演示）');
      }
      w.values = clone(values); w.confirmed = confirmed; w.revision++;
      if (complete) {
        w.status = 'COMPLETED'; w.completedAt = this.now();
        if (w.nodeIndex + 1 < r.snapshot.nodes.length) s.workItems.push(this.newWork(r.id, w.nodeIndex + 1));
        else r.status = 'COMPLETED';
        this.log(s, 'WORK_COMPLETED', id, `完成本地节点：${node.label}；不代表真实签发、质量放行或后台执行`);
      }
      return w;
    });
  }
}
