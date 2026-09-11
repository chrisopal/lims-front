/** Local prototype only. No authorization, server persistence or workflow-engine guarantee. */
export interface FieldDefinition {
  key: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'date'
  required?: boolean
  options?: readonly string[]
  placeholder?: string
  span?: number
  width?: number
}
export interface TestItem {
  code: string
  name: string
  standard: string
  method: string
  limit: string
}
/** Immutable catalog bindings copied into a published scenario snapshot. */
export interface ScenarioAssetBinding {
  id: string
  kind: string
  name: string
  code: string
  version: string
  status: string
  data: Record<string, unknown>
}
export interface RuntimeNode {
  key: string
  label: string
  nodeType: string
  executor: string
  renderer: 'record' | 'sampling' | 'measurement' | 'review'
  fields: FieldDefinition[]
  requiresConfirmation?: boolean
}
export interface ScenarioDefinition {
  id: number
  key: string
  name: string
  version: string
  mode: string
  domain: string
  activationScope: string
  workflowVersion: string
  active: boolean
  snapshotRef: string
  requestSchema: string
  subjectSchema: string
  subjectLabel: string
  requestFields: FieldDefinition[]
  subjectFields: FieldDefinition[]
  testItems: TestItem[]
  nodes: RuntimeNode[]
  assets?: readonly ScenarioAssetBinding[]
}
export type Values = Record<string, string>
export interface Draft {
  id: string
  revision: number
  status: 'DRAFT' | 'SUBMITTED'
  snapshot: ScenarioDefinition
  data: Values
  subjects: Values[]
  itemCodes: string[]
  createdAt: string
  updatedAt: string
}
export interface LocalRequest {
  id: string
  number: string
  draftId: string
  snapshot: ScenarioDefinition
  data: Values
  subjects: Values[]
  itemCodes: string[]
  status: 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED'
  createdAt: string
}
export interface WorkItem {
  id: string
  requestId: string
  nodeIndex: number
  revision: number
  status: 'READY' | 'IN_PROGRESS' | 'COMPLETED' | 'RETURNED'
  values: Values
  confirmed: boolean
  createdAt: string
  startedAt?: string
  completedAt?: string
  reworkOf?: string
}
export interface LocalEvent {
  id: string
  at: string
  action: string
  targetId: string
  message: string
}
export type ReviewDecision = 'APPROVE' | 'RETURN' | 'REJECT'
export interface ReviewRecord {
  id: string
  requestId: string
  workItemId: string
  decision: ReviewDecision
  comment: string
  at: string
}
export interface ReportRecord {
  id: string
  requestId: string
  number: string
  sourceWorkItemId: string
  generatedAt: string
  title: string
  status: 'DRAFT'
  preview: string
}
export const escapeHtml = (value: string): string =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        char
      ] || char,
  )
type ReportRequestView = {
  id: string
  number: string
  data: Readonly<Record<string, string>>
  subjects: ReadonlyArray<Readonly<Record<string, string>>>
  itemCodes: ReadonlyArray<string>
  snapshot: {
    name: string
    version: string
    requestFields: ReadonlyArray<FieldDefinition>
    subjectFields: ReadonlyArray<FieldDefinition>
    testItems: ReadonlyArray<TestItem>
    nodes: ReadonlyArray<{ label: string; nodeType: string }>
    assets?: readonly ScenarioAssetBinding[]
  }
}
type ReportWorkItemView = {
  id: string
  requestId: string
  nodeIndex: number
  status: string
  values: Readonly<Record<string, string>>
}
type ReportReviewView = {
  requestId: string
  at: string
  decision: string
  comment: string
}
/** Builds the downloadable artifact from the request snapshot and persisted evidence only. */
export function renderReportHtml(
  request: ReportRequestView,
  report: ReportRecord,
  workItems: ReadonlyArray<ReportWorkItemView>,
  reviews: ReadonlyArray<ReportReviewView>,
): string {
  const metadata = Object.entries(request.data)
    .map(
      ([key, value]) =>
        `<tr><th>${escapeHtml(key)}</th><td>${escapeHtml(value)}</td></tr>`,
    )
    .join('')
  const subjects = request.subjects
    .map(
      (subject) =>
        `<tr>${request.snapshot.subjectFields.map((field) => `<td>${escapeHtml(subject[field.key] || '—')}</td>`).join('')}</tr>`,
    )
    .join('')
  const tests = request.snapshot.testItems
    .filter((item) => request.itemCodes.includes(item.code))
    .map(
      (item) =>
        `<tr><td>${escapeHtml(item.code)} · ${escapeHtml(item.name)}</td><td>${escapeHtml(item.standard)}</td><td>${escapeHtml(item.method)}</td><td>${escapeHtml(item.limit)}</td></tr>`,
    )
    .join('')
  const records = workItems
    .filter(
      (item) => item.requestId === request.id && item.status === 'COMPLETED',
    )
    .map((item) => {
      const node = request.snapshot.nodes[item.nodeIndex]
      return `<tr><td>${escapeHtml(node?.label || '节点')} <span class="note">(${escapeHtml(node?.nodeType || 'NODE')})</span></td><td>${Object.entries(
        item.values,
      )
        .map(([key, value]) => `${escapeHtml(key)}: ${escapeHtml(value)}`)
        .join('<br>')}</td></tr>`
    })
    .join('')
  const reviewRows = reviews
    .filter((review) => review.requestId === request.id)
    .map(
      (review) =>
        `<tr><td>${escapeHtml(review.at)}</td><td>${escapeHtml(review.decision)}</td><td>${escapeHtml(review.comment || '—')}</td></tr>`,
    )
    .join('')
  const template = request.snapshot.assets?.find(
    (asset) =>
      asset.kind === 'reports' ||
      asset.kind === 'report-template' ||
      asset.kind === 'report_template',
  )
  const templateNote = template
    ? `<p class="note">报告模板快照：${escapeHtml(template.name)} ${escapeHtml(template.version)} · ${escapeHtml(template.code)}</p>`
    : ''
  const subjectHead = request.snapshot.subjectFields
    .map((field) => `<th>${escapeHtml(field.label)}</th>`)
    .join('')
  return `<!doctype html><meta charset="utf-8"><title>${escapeHtml(report.number)}</title><style>body{font:14px system-ui;max-width:980px;margin:40px auto;color:#172033}h1{font-size:24px;border-bottom:2px solid #1677ff;padding-bottom:10px}h2{font-size:17px;margin-top:28px}table{width:100%;border-collapse:collapse;margin:12px 0}th,td{border:1px solid #d9dee7;padding:8px;text-align:left;vertical-align:top}th{background:#f5f7fa}.note{color:#526075}.status{padding:10px;background:#f5f7fa}</style><h1>${escapeHtml(request.snapshot.name)}</h1><p>委托号 ${escapeHtml(request.number)} · 报告号 ${escapeHtml(report.number)} · 生成于 ${escapeHtml(report.generatedAt)} · 场景快照 ${escapeHtml(request.snapshot.version)}</p><p class="status">本地报告预览 · 未签名</p><h2>委托信息</h2><table>${metadata}</table><h2>检测对象</h2><table><thead><tr>${subjectHead}</tr></thead><tbody>${subjects}</tbody></table><h2>检测项目</h2><table><thead><tr><th>项目</th><th>标准</th><th>方法</th><th>限值引用</th></tr></thead><tbody>${tests}</tbody></table>${templateNote}<h2>节点记录</h2><table><thead><tr><th>节点</th><th>记录</th></tr></thead><tbody>${records}</tbody></table><h2>审核记录</h2><table><thead><tr><th>时间</th><th>决定</th><th>意见</th></tr></thead><tbody>${reviewRows || '<tr><td colspan="3">暂无独立审核记录</td></tr>'}</tbody></table>`
}
export interface RuntimeState {
  schemaVersion: 1
  revision: number
  drafts: Draft[]
  requests: LocalRequest[]
  workItems: WorkItem[]
  events: LocalEvent[]
  reviews: ReviewRecord[]
  reports: ReportRecord[]
}
export interface Issue {
  path: string
  message: string
  step: number
}
export class RuntimeError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message)
    this.name = 'RuntimeError'
  }
}
export const STORAGE_KEY = 'lims.demo.runtime.v1'
export const CHANGE_EVENT = 'lims-demo-runtime-change'
export const emptyState = (): RuntimeState => ({
  schemaVersion: 1,
  revision: 0,
  drafts: [],
  requests: [],
  workItems: [],
  events: [],
  reviews: [],
  reports: [],
})
export const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const fail = (code: string, message: string): never => {
  throw new RuntimeError(code, message)
}
const integer = (v: unknown): v is number =>
  Number.isInteger(v) && Number(v) >= 0
const textMap = (v: unknown): v is Values =>
  !!v &&
  typeof v === 'object' &&
  !Array.isArray(v) &&
  Object.entries(v).every(
    ([k, x]) =>
      !['__proto__', 'constructor', 'prototype'].includes(k) &&
      typeof x === 'string' &&
      x.length <= 4000,
  )
function validFields(fields: unknown): fields is FieldDefinition[] {
  return (
    Array.isArray(fields) &&
    fields.length < 100 &&
    fields.every(
      (f) =>
        f &&
        typeof f.key === 'string' &&
        /^[a-zA-Z][a-zA-Z0-9_]*$/.test(f.key) &&
        typeof f.label === 'string' &&
        ['text', 'textarea', 'select', 'date'].includes(f.type) &&
        (f.type !== 'select' ||
          (Array.isArray(f.options) &&
            f.options.every((v: unknown) => typeof v === 'string'))),
    )
  )
}
function validAssets(assets: unknown): assets is ScenarioAssetBinding[] {
  return (
    assets === undefined ||
    (Array.isArray(assets) &&
      assets.length < 100 &&
      assets.every(
        (a) =>
          a &&
          typeof a.id === 'string' &&
          typeof a.kind === 'string' &&
          typeof a.name === 'string' &&
          typeof a.code === 'string' &&
          typeof a.version === 'string' &&
          typeof a.status === 'string' &&
          !!a.data &&
          typeof a.data === 'object' &&
          !Array.isArray(a.data),
      ))
  )
}
function validScenario(s: ScenarioDefinition): boolean {
  return (
    !!s &&
    typeof s.key === 'string' &&
    typeof s.version === 'string' &&
    typeof s.name === 'string' &&
    typeof s.snapshotRef === 'string' &&
    validFields(s.requestFields) &&
    validFields(s.subjectFields) &&
    Array.isArray(s.testItems) &&
    s.testItems.length > 0 &&
    s.testItems.every(
      (t) => t && typeof t.code === 'string' && typeof t.name === 'string',
    ) &&
    Array.isArray(s.nodes) &&
    s.nodes.length > 0 &&
    s.nodes.every(
      (n) =>
        n &&
        typeof n.key === 'string' &&
        typeof n.label === 'string' &&
        validFields(n.fields) &&
        ['record', 'sampling', 'measurement', 'review'].includes(n.renderer),
    ) &&
    validAssets(s.assets)
  )
}
/** Reject malformed or incompatible persisted data. Never replace it with an empty successful state. */
export function decodeState(raw: string | null): RuntimeState {
  if (raw === null) return emptyState()
  try {
    const s = JSON.parse(raw) as RuntimeState
    // reviews/reports were added after the first local runtime release. Default missing arrays so existing browser data remains readable.
    if (
      s.schemaVersion !== 1 ||
      !integer(s.revision) ||
      ![s.drafts, s.requests, s.workItems, s.events].every(Array.isArray)
    )
      throw Error()
    s.reviews = Array.isArray(s.reviews) ? s.reviews : []
    s.reports = Array.isArray(s.reports) ? s.reports : []
    if (
      !s.drafts.every(
        (d) =>
          d &&
          typeof d.id === 'string' &&
          integer(d.revision) &&
          ['DRAFT', 'SUBMITTED'].includes(d.status) &&
          validScenario(d.snapshot) &&
          textMap(d.data) &&
          Array.isArray(d.subjects) &&
          d.subjects.every(textMap) &&
          Array.isArray(d.itemCodes) &&
          d.itemCodes.every((c) => typeof c === 'string'),
      )
    )
      throw Error()
    if (
      !s.requests.every(
        (r) =>
          r &&
          typeof r.id === 'string' &&
          typeof r.number === 'string' &&
          typeof r.draftId === 'string' &&
          ['IN_PROGRESS', 'COMPLETED', 'REJECTED'].includes(r.status) &&
          validScenario(r.snapshot) &&
          textMap(r.data) &&
          Array.isArray(r.subjects) &&
          r.subjects.every(textMap) &&
          Array.isArray(r.itemCodes),
      )
    )
      throw Error()
    if (
      !s.workItems.every(
        (w) =>
          w &&
          typeof w.id === 'string' &&
          integer(w.revision) &&
          integer(w.nodeIndex) &&
          ['READY', 'IN_PROGRESS', 'COMPLETED', 'RETURNED'].includes(
            w.status,
          ) &&
          textMap(w.values) &&
          typeof w.confirmed === 'boolean' &&
          s.requests.some(
            (r) =>
              r.id === w.requestId && w.nodeIndex < r.snapshot.nodes.length,
          ),
      )
    )
      throw Error()
    if (
      !s.events.every(
        (e) =>
          e &&
          typeof e.id === 'string' &&
          typeof e.at === 'string' &&
          typeof e.message === 'string',
      )
    )
      throw Error()
    if (
      !s.reviews.every(
        (v) =>
          v &&
          typeof v.id === 'string' &&
          typeof v.requestId === 'string' &&
          typeof v.workItemId === 'string' &&
          ['APPROVE', 'RETURN', 'REJECT'].includes(v.decision) &&
          typeof v.comment === 'string' &&
          typeof v.at === 'string',
      )
    )
      throw Error()
    if (
      !s.reports.every(
        (v) =>
          v &&
          typeof v.id === 'string' &&
          typeof v.requestId === 'string' &&
          typeof v.number === 'string' &&
          typeof v.sourceWorkItemId === 'string' &&
          typeof v.generatedAt === 'string' &&
          typeof v.title === 'string' &&
          v.status === 'DRAFT' &&
          typeof v.preview === 'string',
      )
    )
      throw Error()
    for (const rows of [
      s.drafts,
      s.requests,
      s.workItems,
      s.reviews,
      s.reports,
    ])
      if (new Set(rows.map((r) => r.id)).size !== rows.length) throw Error()
    if (new Set(s.requests.map((r) => r.draftId)).size !== s.requests.length)
      throw Error()
    return s
  } catch {
    return fail(
      'STORAGE_INVALID',
      '本地演示数据格式异常或版本不兼容。原数据未覆盖，请先导出备份后检查。',
    )
  }
}
export function validateFields(
  fields: ReadonlyArray<FieldDefinition>,
  values: Values,
  prefix: string,
  step: number,
): Issue[] {
  const issues: Issue[] = []
  for (const f of fields) {
    const value = values[f.key] || ''
    if (f.required && !value.trim())
      issues.push({
        path: `${prefix}.${f.key}`,
        message: `请填写${f.label}`,
        step,
      })
    else if (value && f.type === 'select' && !f.options?.includes(value))
      issues.push({
        path: `${prefix}.${f.key}`,
        message: `${f.label}不在允许选项中`,
        step,
      })
    else if (
      value &&
      f.type === 'date' &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        Number.isNaN(Date.parse(value)) ||
        new Date(value).toISOString().slice(0, 10) !== value)
    )
      issues.push({
        path: `${prefix}.${f.key}`,
        message: `${f.label}格式无效`,
        step,
      })
    if (value.length > 4000)
      issues.push({
        path: `${prefix}.${f.key}`,
        message: `${f.label}超过长度限制`,
        step,
      })
  }
  return issues
}
export function validateDraft(d: Draft): Issue[] {
  const issues = validateFields(d.snapshot.requestFields, d.data, 'request', 1)
  if (!d.subjects.length)
    issues.push({ path: 'subjects', message: '至少添加一个检测对象', step: 2 })
  d.subjects.forEach((s, i) =>
    issues.push(
      ...validateFields(d.snapshot.subjectFields, s, `subjects.${i}`, 2).map(
        (e) => ({ ...e, message: `对象 ${i + 1}：${e.message}` }),
      ),
    ),
  )
  if (!d.itemCodes.length)
    issues.push({
      path: 'items',
      message: '至少选择一个检测项；取消全选不会自动恢复为全选',
      step: 3,
    })
  if (
    new Set(d.itemCodes).size !== d.itemCodes.length ||
    d.itemCodes.some((c) => !d.snapshot.testItems.some((t) => t.code === c))
  )
    issues.push({
      path: 'items',
      message: '检测项不属于当前场景快照或存在重复项',
      step: 3,
    })
  return issues
}
export interface StoragePort {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}
export type LockPort = <T>(job: () => T) => Promise<T>
/** API seam: replace this local repository with a server adapter when API contracts are implemented. */
export class LocalRuntimeRepository {
  constructor(
    private storage: StoragePort,
    private lock: LockPort,
    private notify: () => void = () => {},
    private now: () => string = () => new Date().toISOString(),
    private uid: () => string = () => crypto.randomUUID(),
  ) {}
  read(): RuntimeState {
    try {
      return decodeState(this.storage.getItem(STORAGE_KEY))
    } catch (e) {
      if (e instanceof RuntimeError) throw e
      return fail(
        'STORAGE_UNAVAILABLE',
        '无法读取浏览器存储；没有切换为临时成功模式。',
      )
    }
  }
  private async transaction<T>(change: (state: RuntimeState) => T): Promise<T> {
    return this.lock(() => {
      const state = this.read()
      const result = change(state)
      state.revision++
      const encoded = JSON.stringify(state)
      decodeState(encoded)
      try {
        this.storage.setItem(STORAGE_KEY, encoded)
      } catch {
        return fail(
          'STORAGE_WRITE_FAILED',
          '保存失败：浏览器存储被禁用或空间不足。页面输入仍保留，请勿关闭。',
        )
      }
      this.notify()
      return clone(result)
    })
  }
  private log(
    s: RuntimeState,
    action: string,
    targetId: string,
    message: string,
  ) {
    s.events.push({ id: this.uid(), at: this.now(), action, targetId, message })
  }
  createDraft(scenario: ScenarioDefinition): Promise<Draft> {
    return this.transaction((s) => {
      if (!validScenario(scenario) || !scenario.active)
        return fail('SCENARIO_UNAVAILABLE', '场景未激活或缺少运行定义')
      const d: Draft = {
        id: this.uid(),
        revision: 0,
        status: 'DRAFT',
        snapshot: clone(scenario),
        data: {},
        subjects: [{}],
        itemCodes: scenario.testItems.map((t) => t.code),
        createdAt: this.now(),
        updatedAt: this.now(),
      }
      s.drafts.push(d)
      return d
    })
  }
  saveDraft(input: Draft): Promise<Draft> {
    return this.transaction((s) => {
      const d = s.drafts.find((d) => d.id === input.id)
      if (!d) return fail('NOT_FOUND', '未找到草稿')
      if (d.status !== 'DRAFT')
        return fail('DRAFT_READONLY', '已提交委托不可作为草稿覆盖')
      if (d.revision !== input.revision)
        return fail(
          'VERSION_CONFLICT',
          '草稿已由其他窗口更新。请先保留当前输入，再重新打开最新草稿。',
        )
      if (JSON.stringify(d.snapshot) !== JSON.stringify(input.snapshot))
        return fail(
          'SNAPSHOT_LOCKED',
          '不能在已有草稿上静默替换场景版本，请新建草稿',
        )
      if (!textMap(input.data) || !input.subjects.every(textMap))
        return fail('INVALID_INPUT', '输入格式或长度不正确')
      d.data = clone(input.data)
      d.subjects = clone(input.subjects)
      d.itemCodes = [...input.itemCodes]
      d.revision++
      d.updatedAt = this.now()
      return d
    })
  }
  submitDraft(id: string, revision: number): Promise<LocalRequest> {
    return this.transaction((s) => {
      const existing = s.requests.find((r) => r.draftId === id)
      if (existing) return existing
      const d = s.drafts.find((d) => d.id === id)
      if (!d) return fail('NOT_FOUND', '未找到草稿')
      if (d.revision !== revision)
        return fail('VERSION_CONFLICT', '草稿已更新，请重新加载后提交')
      const issues = validateDraft(d)
      if (issues.length) return fail('VALIDATION_FAILED', issues[0].message)
      const requestId = this.uid()
      const request: LocalRequest = {
        id: requestId,
        number: `DEMO-${requestId.slice(0, 8).toUpperCase()}`,
        draftId: id,
        snapshot: clone(d.snapshot),
        data: clone(d.data),
        subjects: clone(d.subjects),
        itemCodes: [...d.itemCodes],
        status: 'IN_PROGRESS',
        createdAt: this.now(),
      }
      d.status = 'SUBMITTED'
      d.revision++
      d.updatedAt = this.now()
      s.requests.push(request)
      s.workItems.push(this.newWork(requestId, 0))
      this.log(
        s,
        'REQUEST_SUBMITTED',
        requestId,
        `本地提交 ${request.number}，锁定 ${request.snapshot.name} ${request.snapshot.version}`,
      )
      return request
    })
  }
  private newWork(requestId: string, nodeIndex: number): WorkItem {
    return {
      id: this.uid(),
      requestId,
      nodeIndex,
      revision: 0,
      status: 'READY',
      values: {},
      confirmed: false,
      createdAt: this.now(),
    }
  }
  startWork(id: string, revision: number): Promise<WorkItem> {
    return this.transaction((s) => {
      const w = s.workItems.find((w) => w.id === id)
      if (!w) return fail('NOT_FOUND', '工作项不存在')
      if (w.status === 'RETURNED')
        return fail(
          'WORK_READONLY',
          '已退回工作项不可重新执行，请打开生成的返工工作项',
        )
      if (w.status === 'IN_PROGRESS') return w
      if (w.status !== 'READY')
        return fail('WORK_READONLY', '已完成工作项不可重新执行')
      if (w.revision !== revision)
        return fail('VERSION_CONFLICT', '工作项已更新，请刷新')
      w.status = 'IN_PROGRESS'
      w.startedAt = this.now()
      w.revision++
      this.log(s, 'WORK_STARTED', id, '开始本地节点记录')
      return w
    })
  }
  saveWork(
    id: string,
    revision: number,
    values: Values,
    confirmed: boolean,
    complete = false,
  ): Promise<WorkItem> {
    return this.transaction((s) => {
      const w = s.workItems.find((w) => w.id === id)
      if (!w) return fail('NOT_FOUND', '工作项不存在')
      if (complete && w.status === 'COMPLETED') return w
      if (w.status !== 'IN_PROGRESS')
        return fail('WORK_READONLY', '请先开始工作；已完成记录不可覆盖')
      if (w.revision !== revision)
        return fail('VERSION_CONFLICT', '工作项已在其他窗口更新，请刷新后重试')
      if (!textMap(values)) return fail('INVALID_INPUT', '记录格式或长度不正确')
      const r = s.requests.find((r) => r.id === w.requestId)!
      const node = r.snapshot.nodes[w.nodeIndex]
      if (complete) {
        const issues = validateFields(node.fields, values, 'record', 1)
        if (issues.length) return fail('VALIDATION_FAILED', issues[0].message)
        if (node.requiresConfirmation && !confirmed)
          return fail(
            'CONFIRMATION_REQUIRED',
            '请确认已核对当前节点记录（本地演示）',
          )
      }
      w.values = clone(values)
      w.confirmed = confirmed
      w.revision++
      if (complete) {
        w.status = 'COMPLETED'
        w.completedAt = this.now()
        if (w.nodeIndex + 1 < r.snapshot.nodes.length)
          s.workItems.push(this.newWork(r.id, w.nodeIndex + 1))
        else {
          r.status = 'COMPLETED'
          this.ensureReport(s, r, w)
        }
        this.log(
          s,
          'WORK_COMPLETED',
          id,
          `完成本地节点：${node.label}；不代表真实签发、质量放行或后台执行`,
        )
      }
      return w
    })
  }
  private ensureReport(
    s: RuntimeState,
    request: LocalRequest,
    source: WorkItem,
  ): ReportRecord {
    const existing = s.reports.find((report) => report.requestId === request.id)
    if (existing) return existing
    const reportTemplate = request.snapshot.assets?.find(
      (asset) =>
        asset.kind === 'reports' ||
        asset.kind === 'report-template' ||
        asset.kind === 'report_template',
    )
    const reportBinding = reportTemplate
      ? `\n报告模板快照：${reportTemplate.name} ${reportTemplate.version}（${reportTemplate.code}）`
      : ''
    const report: ReportRecord = {
      id: this.uid(),
      requestId: request.id,
      sourceWorkItemId: source.id,
      number: `DEMO-RPT-${request.id.slice(0, 8).toUpperCase()}`,
      generatedAt: this.now(),
      title: `${request.snapshot.name} · ${request.number}`,
      status: 'DRAFT',
      preview: `本地演示报告\n委托号：${request.number}\n场景：${request.snapshot.name} ${request.snapshot.version}${reportBinding}\n对象：${request.subjects.length} 个\n检测项：${request.itemCodes.join('、')}\n\n来源：已完成的本地流程节点 ${source.id}\n说明：此报告由浏览器记录生成，不代表真实签发、质量放行或合规结论。`,
    }
    s.reports.push(report)
    this.log(
      s,
      'REPORT_GENERATED',
      report.id,
      `生成本地报告草稿 ${report.number}；不代表正式签发`,
    )
    return report
  }
  generateReport(requestId: string): Promise<ReportRecord> {
    return this.transaction((s) => {
      const request = s.requests.find((item) => item.id === requestId)
      if (!request) return fail('NOT_FOUND', '委托不存在')
      if (request.status !== 'COMPLETED')
        return fail('REPORT_NOT_READY', '委托尚未完成，不能生成报告预览')
      const source = s.workItems
        .filter(
          (item) =>
            item.requestId === request.id && item.status === 'COMPLETED',
        )
        .sort((a, b) => b.nodeIndex - a.nodeIndex)
        .at(0)
      if (!source) return fail('REPORT_NOT_READY', '没有可用的已完成节点记录')
      return this.ensureReport(s, request, source)
    })
  }
  listReviewQueue(): Array<{
    work: WorkItem
    request: LocalRequest
    node: RuntimeNode
  }> {
    const state = this.read()
    return state.workItems
      .filter((w) => w.status === 'READY' || w.status === 'IN_PROGRESS')
      .map((work) => {
        const request = state.requests.find(
          (item) => item.id === work.requestId,
        )!
        return { work, request, node: request.snapshot.nodes[work.nodeIndex] }
      })
      .filter((item) => item.node.renderer === 'review')
  }
  reviewWork(
    id: string,
    revision: number,
    decision: ReviewDecision,
    comment: string,
  ): Promise<ReviewRecord> {
    return this.transaction((s) => {
      if (
        !['APPROVE', 'RETURN', 'REJECT'].includes(decision) ||
        comment.length > 4000
      )
        return fail('INVALID_INPUT', '审核决定或意见格式不正确')
      const w = s.workItems.find((item) => item.id === id)
      if (!w) return fail('NOT_FOUND', '审核工作项不存在')
      if (w.status !== 'IN_PROGRESS')
        return fail('WORK_READONLY', '请先开始审核；已处理审核不可重复操作')
      if (w.revision !== revision)
        return fail('VERSION_CONFLICT', '审核工作项已更新，请刷新')
      const request = s.requests.find((item) => item.id === w.requestId)!
      const record: ReviewRecord = {
        id: this.uid(),
        requestId: request.id,
        workItemId: w.id,
        decision,
        comment: comment.trim(),
        at: this.now(),
      }
      s.reviews.push(record)
      w.revision++
      if (decision === 'RETURN') {
        w.status = 'RETURNED'
        const previousIndex = Math.max(0, w.nodeIndex - 1)
        const rework = this.newWork(request.id, previousIndex)
        rework.reworkOf = w.id
        s.workItems.push(rework)
        request.status = 'IN_PROGRESS'
        this.log(
          s,
          'REVIEW_RETURNED',
          w.id,
          `审核退回，已生成第 ${previousIndex + 1} 个节点返工项：${comment.trim() || '请补充记录后重新提交'}`,
        )
      } else if (decision === 'REJECT') {
        w.status = 'RETURNED'
        request.status = 'REJECTED'
        this.log(
          s,
          'REVIEW_REJECTED',
          w.id,
          `审核驳回：${comment.trim() || '未填写原因'}`,
        )
      } else {
        const node = request.snapshot.nodes[w.nodeIndex]
        const issues = validateFields(node.fields, w.values, 'record', 1)
        if (issues.length || (node.requiresConfirmation && !w.confirmed))
          return fail(
            'VALIDATION_FAILED',
            issues[0]?.message || '请确认已核对当前节点记录',
          )
        w.status = 'COMPLETED'
        w.completedAt = this.now()
        if (w.nodeIndex + 1 < request.snapshot.nodes.length)
          s.workItems.push(this.newWork(request.id, w.nodeIndex + 1))
        else {
          request.status = 'COMPLETED'
          this.ensureReport(s, request, w)
        }
        this.log(
          s,
          'REVIEW_APPROVED',
          w.id,
          `审核通过：${comment.trim() || '已完成人工核对'}`,
        )
      }
      return record
    })
  }
}
