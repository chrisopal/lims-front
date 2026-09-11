import {
  clone,
  type ScenarioDefinition,
  type ScenarioAssetBinding,
  type StoragePort,
  type LockPort,
} from './local-runtime.js'
import { demoScenarios, nodeRegistry } from './scenarios.js'
export interface ScenarioVersion {
  id: string
  revision: number
  status: 'DRAFT' | 'PUBLISHED'
  definition: ScenarioDefinition
  bindings: Record<string, string[]>
  steps?: { key: string; name: string }[]
  assetSnapshots?: ScenarioAssetBinding[]
  publishedAt?: string
  updatedAt: string
}
export interface ScenarioEvent {
  at: string
  action: string
  versionId: string
  message: string
}
export interface ScenarioState {
  schemaVersion: 1
  revision: number
  versions: ScenarioVersion[]
  activations: Record<string, string[]>
  events: ScenarioEvent[]
}
export const SCENARIO_KEY = 'lims.demo.scenarios.v1'
export const SCENARIO_EVENT = 'lims-scenarios-change'
export const setupSteps = [
  { key: 'basic', name: '基础信息' },
  { key: 'subjects', name: '检测对象' },
  { key: 'test-items', name: '检测项与方法' },
  { key: 'assets', name: '业务资产绑定' },
  { key: 'workflow', name: '检测流程' },
  { key: 'forms', name: '动态表单' },
  { key: 'resources', name: '资源与资质' },
  { key: 'preflight', name: '发布检查' },
]
export const scenarioSeed = (): ScenarioState => ({
  schemaVersion: 1,
  revision: 0,
  versions: demoScenarios.map((s) => ({
    id: `${s.key}@${s.version}`,
    revision: 0,
    status: 'PUBLISHED',
    definition: clone(s),
    bindings: {},
    steps: clone(setupSteps),
    publishedAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-09-01T08:00:00.000Z',
  })),
  activations: Object.fromEntries(
    demoScenarios.map((s) => [`${s.key}@${s.version}`, [s.activationScope]]),
  ),
  events: [],
})
export function validateScenario(v: ScenarioVersion): string[] {
  const d = v.definition
  const issues: string[] = []
  if (!d.name.trim() || !d.key.trim() || !d.domain.trim() || !d.mode.trim())
    issues.push('基础信息：名称、Key、领域和业务模式必填')
  if (!/^[a-z][a-z0-9-]*$/.test(d.key))
    issues.push('场景 Key 必须为小写字母、数字和连字符')
  if (!/^v?\d+\.\d+\.\d+$/.test(d.version)) issues.push('版本必须为 x.y.z')
  if (
    !d.subjectLabel.trim() ||
    !d.subjectFields.length ||
    !d.requestFields.length
  )
    issues.push('检测对象与委托表单不能为空')
  for (const fields of [
    d.subjectFields,
    d.requestFields,
    ...d.nodes.map((n) => n.fields),
  ]) {
    if (fields.length >= 100) issues.push('单份表单最多支持 99 个字段')
    if (new Set(fields.map((f) => f.key)).size !== fields.length)
      issues.push('表单字段 Key 不可重复')
    if (
      fields.some(
        (f) =>
          !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(f.key) ||
          !f.label.trim() ||
          !['text', 'textarea', 'select', 'date'].includes(f.type) ||
          (f.type === 'select' && !f.options?.length),
      )
    )
      issues.push('表单字段必须有合法 Key、名称、类型和选项')
  }
  if (!d.testItems.length) issues.push('至少绑定一个检测项')
  if (new Set(d.testItems.map((t) => t.code)).size !== d.testItems.length)
    issues.push('检测项编码不可重复')
  if (
    d.testItems.some(
      (t) =>
        !t.code.trim() ||
        !t.name.trim() ||
        !t.standard.trim() ||
        !t.method.trim() ||
        !t.limit.trim(),
    )
  )
    issues.push('检测项必须配置编码、名称、标准、方法与限值')
  if (!d.nodes.length) issues.push('流程至少包含一个节点')
  if (
    d.nodes.some(
      (n, i) => n.nodeType === 'REPORT_RELEASE' && i !== d.nodes.length - 1,
    )
  )
    issues.push('报告签发必须位于流程末尾，请调整节点顺序')
  if (new Set(d.nodes.map((n) => n.key)).size !== d.nodes.length)
    issues.push('流程节点 Key 不可重复')
  for (const n of d.nodes) {
    const registered = nodeRegistry[n.nodeType]
    if (
      !registered ||
      registered.executor !== n.executor ||
      registered.renderer !== n.renderer
    )
      issues.push(`未注册的执行器或界面：${n.label}`)
  }
  return [...new Set(issues)]
}
export class ScenarioRepository {
  constructor(
    private storage: StoragePort,
    private lock: LockPort,
    private notify: () => void = () => {},
  ) {}
  read(): ScenarioState {
    try {
      const raw = this.storage.getItem(SCENARIO_KEY)
      if (raw === null) return scenarioSeed()
      const s = JSON.parse(raw) as ScenarioState
      if (
        s.schemaVersion !== 1 ||
        !Number.isInteger(s.revision) ||
        !Array.isArray(s.versions) ||
        !s.activations ||
        !Array.isArray(s.events) ||
        s.versions.some(
          (v) =>
            !v.id ||
            !Number.isInteger(v.revision) ||
            !['DRAFT', 'PUBLISHED'].includes(v.status) ||
            !v.definition ||
            !Array.isArray(v.definition.nodes) ||
            !Array.isArray(v.definition.testItems) ||
            !v.bindings,
        )
      )
        throw Error()
      return s
    } catch {
      throw Error('场景存储读取失败或格式不兼容；原数据未覆盖')
    }
  }
  private async mutate<T>(job: (s: ScenarioState) => T): Promise<T> {
    return this.lock(() => {
      const s = this.read()
      const result = job(s)
      s.revision++
      try {
        this.storage.setItem(SCENARIO_KEY, JSON.stringify(s))
      } catch {
        throw Error('保存失败：浏览器存储不可用或容量不足')
      }
      this.notify()
      return clone(result)
    })
  }
  available(): ScenarioDefinition[] {
    const s = this.read()
    return s.versions
      .filter((v) => v.status === 'PUBLISHED' && s.activations[v.id]?.length)
      .map((v) => ({
        ...clone(v.definition),
        active: true,
        activationScope: s.activations[v.id].join('、'),
      }))
  }
  create(name: string, key: string): Promise<ScenarioVersion> {
    return this.mutate((s) => {
      if (
        !name.trim() ||
        !/^[a-z][a-z0-9-]*$/.test(key) ||
        s.versions.some((v) => v.definition.key === key)
      )
        throw Error('名称必填，Key 须唯一且为小写英文与连字符')
      const d: ScenarioDefinition = {
        id: Date.now(),
        name,
        key,
        version: 'v1.0.0',
        mode: '第三方委托',
        domain: '通用检测',
        activationScope: '',
        workflowVersion: `${key}-flow v1.0.0`,
        active: false,
        snapshotRef: '',
        requestSchema: `${key}-request v1`,
        subjectSchema: `${key}-subject v1`,
        subjectLabel: '检测对象',
        requestFields: [
          { key: 'customer', label: '申请单位', type: 'text', required: true },
          { key: 'contact', label: '联系人', type: 'text', required: true },
          {
            key: 'dueDate',
            label: '期望完成日期',
            type: 'date',
            required: true,
          },
        ],
        subjectFields: [
          { key: 'name', label: '对象名称', type: 'text', required: true },
          { key: 'code', label: '对象编号', type: 'text', required: true },
        ],
        testItems: [],
        nodes: clone([
          nodeRegistry.REQUEST_ACCEPTANCE,
          nodeRegistry.LAB_TEST_EXECUTION,
          nodeRegistry.TECHNICAL_REVIEW,
          nodeRegistry.REPORT_RELEASE,
        ]),
      }
      const v: ScenarioVersion = {
        id: crypto.randomUUID(),
        revision: 0,
        status: 'DRAFT',
        definition: d,
        bindings: {},
        steps: clone(setupSteps),
        updatedAt: new Date().toISOString(),
      }
      s.versions.push(v)
      return v
    })
  }
  fork(id: string, copy = false): Promise<ScenarioVersion> {
    return this.mutate((s) => {
      const old = s.versions.find((v) => v.id === id)
      if (!old) throw Error('场景不存在')
      const v = clone(old)
      v.id = crypto.randomUUID()
      v.revision = 0
      v.status = 'DRAFT'
      v.publishedAt = undefined
      v.assetSnapshots = undefined
      v.definition.active = false
      v.definition.snapshotRef = ''
      if (copy) {
        v.definition.key += '-copy-' + v.id.slice(0, 4)
        v.definition.name += '（副本）'
        v.definition.version = 'v1.0.0'
        v.definition.id = Date.now()
      } else {
        const versions = s.versions
          .filter((x) => x.definition.key === v.definition.key)
          .map(
            (x) =>
              Number(x.definition.version.replace(/^v/, '').split('.')[2]) || 0,
          )
        const parts = v.definition.version.replace(/^v/, '').split('.')
        v.definition.version = `v${parts[0]}.${parts[1]}.${Math.max(...versions) + 1}`
      }
      v.updatedAt = new Date().toISOString()
      s.versions.push(v)
      return v
    })
  }
  save(input: ScenarioVersion): Promise<ScenarioVersion> {
    return this.mutate((s) => {
      const v = s.versions.find((v) => v.id === input.id)
      if (!v) throw Error('场景不存在')
      if (v.status === 'PUBLISHED')
        throw Error('已发布版本不可编辑，请创建新版本')
      if (v.revision !== input.revision)
        throw Error('其他窗口已更新此草稿，请保留输入并重新加载')
      if (v.definition.key !== input.definition.key)
        throw Error('场景 Key 不可修改')
      if (
        s.versions.some(
          (x) =>
            x.id !== v.id &&
            x.definition.key === input.definition.key &&
            x.definition.version === input.definition.version,
        )
      )
        throw Error('版本号已存在')
      v.definition = clone(input.definition)
      v.bindings = clone(input.bindings)
      v.revision++
      v.updatedAt = new Date().toISOString()
      return v
    })
  }
  publish(
    id: string,
    revision: number,
    assets: ScenarioAssetBinding[] = [],
  ): Promise<ScenarioVersion> {
    return this.mutate((s) => {
      const v = s.versions.find((v) => v.id === id)
      if (!v || v.status !== 'DRAFT') throw Error('只能发布草稿')
      if (v.revision !== revision) throw Error('其他窗口已更新此草稿')
      const issues = validateScenario(v)
      if (
        Object.values(v.bindings)
          .flat()
          .some(
            (id) => !assets.some((a) => a.id === id && a.status === 'ACTIVE'),
          )
      )
        issues.push('绑定资产版本不存在或已停用')
      if (issues.length) throw Error('校验未通过：' + issues.join('；'))
      v.status = 'PUBLISHED'
      v.revision++
      v.publishedAt = new Date().toISOString()
      v.updatedAt = v.publishedAt
      v.definition.snapshotRef = `DEMO-SNAPSHOT/${v.definition.key}@${v.definition.version}/${v.id}`
      v.assetSnapshots = clone(assets)
      v.definition.assets = clone(assets)
      s.events.push({
        at: v.publishedAt,
        action: 'SCENARIO_PUBLISHED',
        versionId: v.id,
        message: `发布 ${v.definition.name} ${v.definition.version}`,
      })
      return v
    })
  }
  activate(id: string, labs: string[]): Promise<string[]> {
    return this.mutate((s) => {
      const v = s.versions.find((v) => v.id === id)
      if (v?.status !== 'PUBLISHED') throw Error('只能激活已发布版本')
      s.activations[id] = [...new Set(labs.filter((x) => x.trim()))]
      s.events.push({
        at: new Date().toISOString(),
        action: labs.length ? 'SCENARIO_ACTIVATED' : 'SCENARIO_DEACTIVATED',
        versionId: id,
        message: `${v.definition.name}：${labs.join('、') || '停用'}`,
      })
      return s.activations[id]
    })
  }
}
