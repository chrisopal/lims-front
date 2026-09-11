/** Local catalog repository. It is deliberately an adapter seam for a future API. */
import { demoScenarios } from './scenarios.js'

export type CatalogStatus = 'ACTIVE' | 'INACTIVE'

export interface CatalogRecord {
  id: string
  kind: string
  name: string
  code: string
  version: string
  status: CatalogStatus
  data: Record<string, any>
  /** Optimistic concurrency token; omitted only for seed/legacy records. */
  revision?: number
}

export interface CatalogEvent { id: string; at: string; action: string; targetId: string; message: string }

export interface CatalogState {
  schemaVersion: 1
  revision: number
  records: CatalogRecord[]
  events?: CatalogEvent[]
}

export interface CatalogStoragePort {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem?(key: string): void
}

export type CatalogLockPort = <T>(job: () => T) => Promise<T>

export const CATALOG_STORAGE_KEY = 'lims.demo.catalog.v1'
export const CATALOG_CHANGE_EVENT = 'lims-demo-catalog-change'

const clone = <T>(value: T): T =>
  value === undefined ? value : (JSON.parse(JSON.stringify(value)) as T)
const fail = (code: string, message: string): never => {
  const error = new Error(message)
  error.name = 'CatalogError'
  Object.assign(error, { code })
  throw error
}

export function emptyCatalogState(): CatalogState {
  return { schemaVersion: 1, revision: 0, records: [] }
}

function validRecord(value: unknown): value is CatalogRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const record = value as CatalogRecord
  return (
    typeof record.id === 'string' &&
    record.id.length > 0 &&
    record.id.length <= 160 &&
    typeof record.kind === 'string' &&
    /^[a-z][a-z0-9-]*$/.test(record.kind) &&
    typeof record.name === 'string' &&
    record.name.trim().length > 0 &&
    record.name.length <= 240 &&
    typeof record.code === 'string' &&
    record.code.trim().length > 0 &&
    record.code.length <= 160 &&
    typeof record.version === 'string' &&
    record.version.trim().length > 0 &&
    record.version.length <= 80 &&
    (record.status === 'ACTIVE' || record.status === 'INACTIVE') &&
    (record.revision === undefined ||
      (Number.isInteger(record.revision) && record.revision >= 0)) &&
    !!record.data &&
    typeof record.data === 'object' &&
    !Array.isArray(record.data) &&
    Object.keys(record.data).every(
      (key) => !['__proto__', 'constructor', 'prototype'].includes(key),
    )
  )
}

function validFormFields(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.length < 100 &&
    value.every((field) => {
      if (!field || typeof field !== 'object') return false
      const item = field as {
        key?: unknown
        label?: unknown
        type?: unknown
        options?: unknown
      }
      return (
        typeof item.key === 'string' &&
        /^[a-zA-Z][a-zA-Z0-9_]*$/.test(item.key) &&
        typeof item.label === 'string' &&
        item.label.trim().length > 0 &&
        ['text', 'textarea', 'select', 'date'].includes(String(item.type)) &&
        (item.type !== 'select' ||
          (Array.isArray(item.options) &&
            item.options.length > 0 &&
            item.options.every(
              (option) => typeof option === 'string' && option.trim(),
            )))
      )
    })
  )
}

export function validateCatalogRecord(record: CatalogRecord): void {
  if (!validRecord(record))
    return fail(
      'INVALID_RECORD',
      '目录记录缺少有效的名称、编码、版本、状态或扩展数据。',
    )
  if (record.kind === 'node-types')
    return fail('READ_ONLY', '节点类型来自平台注册表，不允许写入目录。')
  const required = REQUIRED_DATA_FIELDS[record.kind] || []
  if (
    required.some(
      (key) =>
        record.data[key] === undefined ||
        record.data[key] === null ||
        (typeof record.data[key] === 'string' && !record.data[key].trim()) ||
        (Array.isArray(record.data[key]) && record.data[key].length === 0),
    )
  )
    return fail(
      'INVALID_RECORD',
      `目录记录缺少必填业务字段：${required.join('、')}。`,
    )
  if (record.kind === 'forms' && !validFormFields(record.data.fields))
    return fail(
      'INVALID_FORM_FIELDS',
      '动态表单字段必须包含合法的 key、名称、类型和下拉选项。',
    )
}

const REQUIRED_DATA_FIELDS: Record<string, string[]> = {
  'test-items': ['standard', 'method', 'limit'],
  standards: ['category', 'effectiveDate', 'domain'],
  methods: ['principle', 'scope', 'equipment', 'qualification'],
  limits: ['itemCode', 'unit', 'expression', 'parameters'],
  forms: ['category', 'scope', 'fields'],
  reports: ['category', 'outputFormat', 'sections', 'signPolicy'],
  equipment: [
    'category',
    'lab',
    'manufacturer',
    'calibrationDue',
    'state',
    'responsible',
  ],
  personnel: ['role', 'lab', 'qualifications', 'certificate', 'validUntil'],
  labs: ['capability', 'location', 'timezone', 'contact', 'capacity'],
  orgs: ['type', 'region', 'manager'],
  roles: ['description', 'policies'],
  settings: ['key', 'value', 'category', 'editable'],
  integrations: ['provider', 'direction', 'endpoint', 'authMode'],
  'ai-skills': [
    'category',
    'trigger',
    'inputSchema',
    'outputSchema',
    'approval',
    'riskPolicy',
    'owner',
  ],
}

export function decodeCatalogState(raw: string | null): CatalogState {
  if (raw === null) return emptyCatalogState()
  try {
    const state = JSON.parse(raw) as CatalogState
    if (
      state.schemaVersion !== 1 ||
      !Number.isInteger(state.revision) ||
      state.revision < 0 ||
      !Array.isArray(state.records)
    )
      throw Error()
    if (
      !state.records.every((record) => {
        if (!validRecord(record)) return false
        try {
          validateCatalogRecord(record)
          return true
        } catch {
          return false
        }
      })
    )
      throw Error()
    if (
      new Set(state.records.map((record) => record.id)).size !==
      state.records.length
    )
      throw Error()
    if (
      new Set(
        state.records.map(
          (record) => `${record.kind}:${record.code}:${record.version}`,
        ),
      ).size !== state.records.length
    )
      throw Error()
    return clone(state)
  } catch {
    return fail(
      'STORAGE_INVALID',
      '本地目录数据格式异常或版本不兼容。原数据未覆盖，请先检查浏览器存储。',
    )
  }
}

const seed = (record: CatalogRecord): CatalogRecord => record

function seedRecords(): CatalogRecord[] {
  const records: CatalogRecord[] = []
  const add = (record: CatalogRecord) => records.push(seed(record))
  const now = (
    kind: string,
    code: string,
    name: string,
    data: Record<string, any>,
    version = 'v1.0.0',
    status: CatalogStatus = 'ACTIVE',
  ): CatalogRecord => ({
    id: `seed:${kind}:${code}`,
    kind,
    code,
    name,
    version,
    status,
    data,
  })

  const itemMap = new Map<
    string,
    {
      code: string
      name: string
      standard: string
      method: string
      limit: string
    }
  >()
  demoScenarios.forEach((scenario) =>
    scenario.testItems.forEach((item) => itemMap.set(item.code, item)),
  )
  itemMap.forEach((item) =>
    add(
      now(
        'test-items',
        item.code,
        item.name,
        {
          standard: item.standard,
          method: item.method,
          limit: item.limit,
          category: item.code.split('.')[0],
          unit: item.name.includes('水分') ? '%' : 'mg/kg',
          description: `${item.name} 的演示检测项，引用场景快照中的资产关系。`,
        },
        'v1.0.0',
      ),
    ),
  )
  ;[
    ['GB 5009.12-2023', '食品中铅的测定', '国家标准', '2023-09-06', '食品理化'],
    ['GB 5009.15-2023', '食品中镉的测定', '国家标准', '2023-09-06', '食品理化'],
    [
      'HJ 828-2017',
      '水质 化学需氧量的测定',
      '环境标准',
      '2017-03-01',
      '环境水质',
    ],
    [
      'ISO 1101:2017',
      'Geometrical product specifications — Geometrical tolerancing',
      '国际标准',
      '2017-05-01',
      '几何量',
    ],
  ].forEach(([code, name, category, effectiveDate, domain]) =>
    add(
      now(
        'standards',
        code,
        name,
        {
          category,
          effectiveDate,
          domain,
          publisher: category === '国际标准' ? 'ISO' : '演示标准发布机构',
          itemCount: 1,
        },
        'v1.0.0',
      ),
    ),
  )
  ;[
    ['ICP-MS-PB', 'ICP-MS 铅元素测定', 'ICP-MS', '食品铅'],
    ['ICP-MS-CD', 'ICP-MS 镉元素测定', 'ICP-MS', '食品镉'],
    ['COD-DICHROMATE', '重铬酸盐法 COD', '分光光度法', '环境水质'],
    ['CMM-GDT', 'CMM 几何公差测量', '三坐标测量', '几何量'],
  ].forEach(([code, name, principle, scope]) =>
    add(
      now(
        'methods',
        code,
        name,
        {
          principle,
          scope,
          equipment: principle === '三坐标测量' ? 'CMM-01' : 'ICP-MS-01',
          qualification: '方法确认记录（演示）',
          steps: ['样品准备', '仪器测量', '原始记录复核'],
        },
        'v1.1.0',
      ),
    ),
  )
  ;[
    ['FOOD-PB-LIMIT', '食品铅限值规则', 'FOOD.PB', 'mg/kg'],
    ['FOOD-CD-LIMIT', '食品镉限值规则', 'FOOD.CD', 'mg/kg'],
    ['ENV-COD-LIMIT', '排放水 COD 限值规则', 'ENV.COD', 'mg/L'],
    ['MET-TOLERANCE', '几何公差判定规则', 'MET.DIAMETER', 'mm'],
  ].forEach(([code, name, itemCode, unit]) =>
    add(
      now(
        'limits',
        code,
        name,
        {
          itemCode,
          unit,
          expression: itemCode.startsWith('MET')
            ? 'abs(measured - nominal) <= tolerance'
            : 'measured <= limit',
          parameters: itemCode.startsWith('MET')
            ? 'nominal,tolerance'
            : 'category,limit',
        },
        'v2.0.0',
      ),
    ),
  )

  add(
    now(
      'forms',
      'FORM-SAMPLE-RECEIPT',
      '收样记录表',
      {
        category: '样品管理',
        scope: '收样节点',
        fields: [
          {
            key: 'sampleCode',
            label: '样品编号',
            type: 'text',
            required: true,
          },
          {
            key: 'condition',
            label: '接收状况',
            type: 'select',
            required: true,
            options: ['完好', '已记录偏差'],
          },
        ],
      },
      'v1.2.0',
    ),
  )
  add(
    now(
      'forms',
      'FORM-FIELD-SAMPLING',
      '现场采样记录表',
      {
        category: '现场作业',
        scope: '现场采样节点',
        fields: [
          { key: 'point', label: '采样点位', type: 'text', required: true },
          {
            key: 'sampleDate',
            label: '采样日期',
            type: 'date',
            required: true,
          },
          { key: 'notes', label: '现场记录', type: 'textarea', required: true },
        ],
      },
      'v1.0.0',
    ),
  )
  add(
    now(
      'forms',
      'FORM-METROLOGY',
      '几何量测量记录表',
      {
        category: '专业检测',
        scope: '几何量测量节点',
        fields: [
          { key: 'feature', label: '被测特征', type: 'text', required: true },
          { key: 'value', label: '测量值', type: 'text', required: true },
          {
            key: 'unit',
            label: '单位',
            type: 'select',
            required: true,
            options: ['mm', 'μm', '°'],
          },
        ],
      },
      'v1.0.0',
    ),
  )

  add(
    now(
      'reports',
      'RPT-FOOD-COA',
      '食品检测结果报告',
      {
        category: '合规报告',
        outputFormat: 'PDF',
        sections: ['委托信息', '样品信息', '检测结果', '标准依据', '审核签发'],
        signPolicy: '技术审核后签发',
      },
      'v3.0.0',
    ),
  )
  add(
    now(
      'reports',
      'RPT-ENV-MONITOR',
      '环境监测报告',
      {
        category: '环境报告',
        outputFormat: 'PDF',
        sections: ['监测任务', '采样点位', '检测结果', '质量控制'],
        signPolicy: '报告审核后签发',
      },
      'v2.1.0',
    ),
  )
  add(
    now(
      'reports',
      'RPT-METROLOGY',
      '几何量检测报告',
      {
        category: '计量报告',
        outputFormat: 'PDF',
        sections: ['零件信息', '测量特征', '公差判定', '原始记录'],
        signPolicy: '结果核对后签发',
      },
      'v1.4.0',
    ),
  )
  ;[
    ['CMM-01', '桥式三坐标测量机', '三坐标', '北京计量实验室', '2027-05-20'],
    [
      'ICP-MS-01',
      '电感耦合等离子体质谱仪',
      '元素分析',
      '华东食品实验室',
      '2027-01-15',
    ],
    ['COD-UV-01', 'COD 消解测定仪', '环境分析', '深圳综合实验室', '2026-12-01'],
  ].forEach(([code, name, category, lab, calibrationDue]) =>
    add(
      now(
        'equipment',
        code,
        name,
        {
          category,
          lab,
          manufacturer: '演示设备厂商',
          model: 'Demo-1000',
          calibrationDue,
          state: '在用',
          responsible: '张研究员',
        },
        'v2.0.0',
      ),
    ),
  )
  ;[
    ['PER-001', '张研究员', '检测工程师', '北京计量实验室', '几何量,样品管理'],
    ['PER-002', '李质控', '质量负责人', '华东食品实验室', '审核,食品理化'],
    ['PER-003', '王采样', '现场采样员', '深圳综合实验室', '现场采样,环境水质'],
  ].forEach(([code, name, role, lab, qualifications]) =>
    add(
      now(
        'personnel',
        code,
        name,
        {
          role,
          lab,
          qualifications: qualifications.split(','),
          certificate: `CERT-${code}`,
          validUntil: '2027-12-31',
        },
        'v1.0.0',
      ),
    ),
  )
  ;[
    ['LAB-BJ', '北京计量实验室', '几何量', '北京市'],
    ['LAB-SZ', '深圳综合实验室', '环境检测', '深圳市'],
    ['LAB-HD', '华东食品实验室', '食品检测', '上海市'],
  ].forEach(([code, name, capability, location]) =>
    add(
      now(
        'labs',
        code,
        name,
        {
          capability,
          location,
          timezone: 'Asia/Shanghai',
          contact: '实验室运营台',
          capacity: '中型',
        },
        'v1.0.0',
      ),
    ),
  )
  ;[
    ['ORG-HQ', '实验室运营平台总部', '平台组织', '全国'],
    ['ORG-FOOD', '华东食品实验室事业部', '业务组织', '华东'],
    ['ORG-FIELD', '深圳现场检测中心', '业务组织', '华南'],
  ].forEach(([code, name, type, region]) =>
    add(
      now(
        'orgs',
        code,
        name,
        {
          type,
          region,
          parent: code === 'ORG-HQ' ? '' : 'ORG-HQ',
          manager: '运营管理员',
        },
        'v1.0.0',
      ),
    ),
  )
  ;[
    ['ROLE-ADMIN', '平台管理员', '平台配置与审计', ['*']],
    [
      'ROLE-LAB',
      '实验室负责人',
      '资产、人员和报告管理',
      ['catalog.read', 'report.write', 'review.execute'],
    ],
    [
      'ROLE-TECH',
      '检测工程师',
      '检测任务与原始记录',
      ['catalog.read', 'work.execute'],
    ],
    [
      'ROLE-REVIEWER',
      '审核员',
      '审核与报告签发',
      ['catalog.read', 'review.execute', 'report.release'],
    ],
  ].forEach(([code, name, description, policies]) =>
    add(
      now(
        'roles',
        String(code),
        String(name),
        { description, policies },
        'v1.0.0',
      ),
    ),
  )
  ;[
    ['SETTING-RETENTION', '本地数据保留期', 'retentionDays', '90', '运行数据'],
    ['SETTING-TIMEZONE', '默认时区', 'timezone', 'Asia/Shanghai', '平台基础'],
    ['SETTING-AUDIT', '审计事件记录', 'auditEnabled', 'true', '治理策略'],
    ['SETTING-EXPORT', '导出文件格式', 'exportFormat', 'JSON', '平台基础'],
  ].forEach(([code, name, key, value, category]) =>
    add(
      now(
        'settings',
        code,
        name,
        {
          key,
          value,
          category,
          editable: key !== 'auditEnabled' ? '管理员可编辑' : '策略锁定',
        },
        'v1.0.0',
      ),
    ),
  )

  add(
    now(
      'integrations',
      'INT-LIMS-ERP',
      'ERP 委托同步',
      {
        provider: 'ERP Adapter',
        direction: '双向',
        endpoint: '未配置（本地演示）',
        authMode: 'API Key',
        lastSync: '从未同步',
      },
      'v0.9.0',
      'INACTIVE',
    ),
  )
  add(
    now(
      'integrations',
      'INT-QMS-REVIEW',
      'QMS 审核回写',
      {
        provider: 'QMS Adapter',
        direction: '单向回写',
        endpoint: '未配置（本地演示）',
        authMode: 'OAuth2',
        lastSync: '从未同步',
      },
      '0.1.0',
      'INACTIVE',
    ),
  )
  add(
    now(
      'integrations',
      'INT-SMTP',
      '报告邮件通知',
      {
        provider: 'SMTP',
        direction: '出站通知',
        endpoint: '未配置（本地演示）',
        authMode: '用户名密码',
        lastSync: '从未发送',
      },
      'v1.0.0',
      'INACTIVE',
    ),
  )
  ;[
    [
      'standard-match',
      '标准智能匹配',
      '匹配推荐',
      'REQUEST_PLANNING',
      'TestItem[] + SceneContext',
      'StandardVersion[]',
    ],
    [
      'report-draft',
      '报告草稿生成',
      '文档生成',
      'REPORT_GENERATION',
      'Results[] + Template',
      'ReportDraft',
    ],
    [
      'report-review',
      '报告审核辅助',
      '审核辅助',
      'TECHNICAL_REVIEW',
      'ReportDraft + Evidence',
      'ReviewIssues[]',
    ],
    [
      'anomaly-detect',
      '结果异常识别',
      '异常检测',
      'RESULT_ENTRY',
      'Measurement[]',
      'AnomalyFlags[]',
    ],
    [
      'smart-schedule',
      '智能任务调度',
      '调度优化',
      'TASK_PLANNING',
      'TaskQueue + EquipStatus',
      'Schedule',
    ],
  ].forEach(([code, name, category, trigger, inputSchema, outputSchema]) =>
    add(
      now(
        'ai-skills',
        code,
        name,
        {
          category,
          trigger,
          inputSchema,
          outputSchema,
          approval: 'Required',
          riskPolicy: '须人工确认',
          callCount: 0,
          owner: 'AI 能力中心',
        },
        'v1.0.0',
      ),
    ),
  )
  return records
}

function ensureAdministrator(records: CatalogRecord[]) {
  if (
    !records.some(
      (r) =>
        r.kind === 'roles' &&
        r.status === 'ACTIVE' &&
        Array.isArray(r.data.policies) &&
        (r.data.policies.includes('*') ||
          r.data.policies.includes('role.manage')),
    )
  )
    fail('LAST_ADMINISTRATOR', '至少保留一个启用且具有角色管理权限的角色。')
}

export class CatalogRepository {
  constructor(
    private readonly storage: CatalogStoragePort,
    private readonly lock: CatalogLockPort,
    private readonly notify: () => void = () => {},
    private readonly uid: () => string = () => crypto.randomUUID(),
  ) {}

  read(): { records: CatalogRecord[]; events: CatalogEvent[] } {
    try {
      const raw = this.storage.getItem(CATALOG_STORAGE_KEY)
      const state =
        raw === null
          ? ({
              schemaVersion: 1,
              revision: 0,
              records: seedRecords(),
            } satisfies CatalogState)
          : decodeCatalogState(raw)
      return { records: clone(state.records), events: clone((state as CatalogState).events || []) }
    } catch (cause) {
      if (cause instanceof Error && cause.name === 'CatalogError') throw cause
      return fail(
        'STORAGE_UNAVAILABLE',
        '无法读取浏览器存储；没有切换为临时成功模式。',
      )
    }
  }

  private async transaction<T>(change: (state: CatalogState) => T): Promise<T> {
    return this.lock(() => {
      let raw: string | null
      try {
        raw = this.storage.getItem(CATALOG_STORAGE_KEY)
      } catch {
        return fail(
          'STORAGE_UNAVAILABLE',
          '无法读取浏览器存储；没有切换为临时成功模式。',
        )
      }
      const state =
        raw === null
          ? ({
              schemaVersion: 1,
              revision: 0,
              records: seedRecords(),
            } satisfies CatalogState)
          : decodeCatalogState(raw)
      const result = change(state)
      state.revision += 1
      const encoded = JSON.stringify(state)
      decodeCatalogState(encoded)
      try {
        this.storage.setItem(CATALOG_STORAGE_KEY, encoded)
      } catch {
        return fail(
          'STORAGE_WRITE_FAILED',
          '保存失败：浏览器存储被禁用或空间不足。当前输入仍保留，请勿关闭。',
        )
      }
      this.notify()
      return clone(result)
    })
  }

  async save(record: CatalogRecord): Promise<CatalogRecord> {
    validateCatalogRecord(record)
    return this.transaction((state) => {
      const duplicate = state.records.find(
        (item) =>
          item.kind === record.kind &&
          item.code === record.code &&
          item.version === record.version &&
          item.id !== record.id,
      )
      if (duplicate)
        return fail(
          'DUPLICATE_CODE',
          `编码 ${record.code} 的版本 ${record.version} 已存在，请使用唯一版本。`,
        )
      const index = state.records.findIndex((item) => item.id === record.id)
      const current = state.records[index]
      if(current && (current.kind!==record.kind||current.code!==record.code||current.version!==record.version))return fail('IDENTITY_LOCKED','资产编码与版本不可直接修改，请创建新版本。')
      if (
        current && (current.revision ?? -1) !== (record.revision ?? -1)
      )
        return fail(
          'VERSION_CONFLICT',
          '目录记录已在其他窗口更新，请刷新后重试。',
        )
      const persisted = {
        ...clone(record),
        id: record.id || this.uid(),
        revision: (current?.revision ?? -1) + 1,
      }
      if (record.kind === 'roles')
        ensureAdministrator([
          ...state.records.filter((r) => r.id !== persisted.id),
          persisted,
        ])
      if (index < 0) state.records.push(persisted)
      else state.records[index] = persisted
      state.events ??= []
      state.events.push({id:this.uid(),at:new Date().toISOString(),action:current?'CATALOG_UPDATED':'CATALOG_CREATED',targetId:persisted.id,message:`${persisted.name} ${persisted.version} · ${persisted.status}`})
      return persisted
    })
  }

  async remove(id: string): Promise<void> {
    if (!id) return fail('INVALID_ID', '缺少要删除的目录记录。')
    await this.transaction((state) => {
      const index = state.records.findIndex((item) => item.id === id)
      if (index < 0) return fail('NOT_FOUND', '目录记录不存在或已被删除。')
      if (state.records[index].kind === 'roles')
        ensureAdministrator(state.records.filter((r) => r.id !== id))
      const removed=state.records[index]
      state.records.splice(index, 1)
      state.events ??= []
      state.events.push({id:this.uid(),at:new Date().toISOString(),action:'CATALOG_DELETED',targetId:id,message:`删除 ${removed.name} ${removed.version}`})
    })
  }
}

const browserStorage: CatalogStoragePort = {
  getItem: (key) => localStorage.getItem(key),
  setItem: (key, value) => localStorage.setItem(key, value),
}
const browserLock: CatalogLockPort = async (job) => {
  if (typeof navigator === 'undefined' || !navigator.locks)
    return fail(
      'LOCK_UNAVAILABLE',
      '此浏览器不支持安全的本地多窗口写入，请在受支持的浏览器中使用演示。',
    )
  return navigator.locks.request(CATALOG_STORAGE_KEY, () => job())
}

export const catalogRepository: CatalogRepository = new CatalogRepository(
  browserStorage,
  browserLock,
  () => {
    if (typeof window !== 'undefined')
      window.dispatchEvent(new Event(CATALOG_CHANGE_EVENT))
  },
)

export { seedRecords }
