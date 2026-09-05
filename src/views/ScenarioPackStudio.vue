<template>
  <div class="studio-shell">
    <header class="studio-header">
      <div class="header-left">
        <button class="back-link" @click="router.push('/app/scenarios')">
          <el-icon><ArrowLeft /></el-icon>
          场景包
        </button>
        <span class="header-sep">/</span>
        <div>
          <div class="title-row">
            <h1>第三方食品理化检测</h1>
            <span class="version-token">v1.3.0</span>
            <span class="status-token draft">Draft</span>
          </div>
          <div class="header-meta">
            <span>third-party-food-physchem</span>
            <span>·</span>
            <span>配置完整度 72%</span>
            <span>·</span>
            <span class="warning-text">2 个发布前问题</span>
            <span>·</span>
            <span>上次保存 15:26</span>
          </div>
        </div>
      </div>
      <div class="header-actions">
        <el-button size="small">导出 Manifest</el-button>
        <el-button size="small">保存草稿</el-button>
        <el-button size="small" @click="currentStep = 'preflight'">发布检查</el-button>
        <el-button type="primary" size="small" :disabled="publishBlockers > 0" @click="currentStep = 'preflight'">
          发布场景
        </el-button>
      </div>
    </header>

    <div class="studio-body">
      <aside class="lifecycle-panel">
        <div class="lifecycle-title-row">
          <div>
            <div class="lifecycle-title">配置生命周期</div>
            <div class="lifecycle-subtitle">由 Scenario Manifest 的 setup.steps 驱动</div>
          </div>
          <span class="manifest-badge">YAML</span>
        </div>

        <div class="step-list">
          <button
            v-for="(step, index) in setupSteps"
            :key="step.key"
            :class="['step-row', { active: currentStep === step.key }]"
            @click="currentStep = step.key"
          >
            <span :class="['step-state', step.status]">
              <el-icon v-if="step.status === 'done'"><Check /></el-icon>
              <el-icon v-else-if="step.status === 'warn'"><Warning /></el-icon>
              <el-icon v-else-if="step.status === 'error'"><Close /></el-icon>
              <span v-else>{{ String(index + 1).padStart(2, '0') }}</span>
            </span>
            <span class="step-copy">
              <span class="step-name">{{ step.name }}</span>
              <span class="step-desc">{{ step.description }}</span>
            </span>
            <span v-if="step.issueCount" class="issue-count">{{ step.issueCount }}</span>
          </button>
        </div>

        <div class="lifecycle-footnote">
          <el-icon><InfoFilled /></el-icon>
          场景包只引用已版本化资产；发布后生成不可变 Snapshot，历史委托不受新版本影响。
        </div>
      </aside>

      <main class="studio-main">
        <section v-if="currentStep === 'basic'" class="workspace-section">
          <div class="section-head">
            <div>
              <h2>基础信息</h2>
              <p>定义场景身份、业务模式和适用范围。场景 Key 发布后不可变更。</p>
            </div>
          </div>
          <div class="form-panel narrow">
            <el-form label-position="top" size="small">
              <el-form-item label="场景名称" required><el-input model-value="第三方食品理化检测" /></el-form-item>
              <el-form-item label="场景 Key" required>
                <el-input model-value="third-party-food-physchem" disabled />
                <div class="field-help">系统唯一标识；创建后锁定。</div>
              </el-form-item>
              <el-form-item label="业务模式" required>
                <el-select model-value="third-party" style="width: 320px">
                  <el-option label="第三方检测实验室" value="third-party" />
                  <el-option label="企业内部实验室" value="internal" />
                </el-select>
              </el-form-item>
              <el-form-item label="领域能力" required>
                <el-select multiple :model-value="['physchem','food']" style="width: 420px">
                  <el-option label="PhysChem · 理化检测" value="physchem" />
                  <el-option label="Food · 食品检测" value="food" />
                  <el-option label="Environment · 环境检测" value="environment" />
                  <el-option label="Metrology · 几何量" value="metrology" />
                </el-select>
              </el-form-item>
              <el-form-item label="场景说明">
                <el-input type="textarea" :rows="4" model-value="面向第三方实验室的食品理化检测场景，覆盖委托受理、收样、样品前处理、实验室检测、技术审核和报告签发。" />
              </el-form-item>
            </el-form>
          </div>
        </section>

        <section v-else-if="currentStep === 'subjects'" class="workspace-section">
          <div class="section-head">
            <div><h2>检测对象</h2><p>绑定该场景支持的 Test Subject 类型以及对应动态表单。</p></div>
            <el-button size="small" @click="router.push('/app/assets/forms')">管理动态表单</el-button>
          </div>
          <div class="plain-table">
            <div class="table-header subject-columns">
              <span>对象类型</span><span>用途</span><span>绑定表单</span><span>状态</span><span></span>
            </div>
            <div v-for="subject in subjects" :key="subject.key" class="table-row subject-columns">
              <div><strong>{{ subject.name }}</strong><div class="mono-sub">{{ subject.key }}</div></div>
              <span>{{ subject.usage }}</span>
              <span class="reference-token">{{ subject.form }}</span>
              <span class="validation-state ok"><el-icon><CircleCheck /></el-icon>有效</span>
              <el-button link type="primary" size="small">配置</el-button>
            </div>
          </div>
        </section>

        <section v-else-if="currentStep === 'test-items'" class="workspace-section wide-section">
          <div class="section-head">
            <div><h2>检测项与能力矩阵</h2><p>这里只做资产引用与完整性检查。标准、方法、限值、报告模板均保持独立版本生命周期。</p></div>
            <el-button type="primary" size="small" @click="router.push('/app/assets/test-items')">从检测项库添加</el-button>
          </div>
          <div class="summary-line">
            <span><strong>18</strong> 个检测项</span><span>·</span><span class="success-text">16 项完整</span><span>·</span><span class="danger-text">2 项缺少绑定</span>
          </div>
          <el-table :data="testItems" border size="small" class="asset-matrix">
            <el-table-column label="检测项" min-width="150" fixed>
              <template #default="{ row }"><strong>{{ row.name }}</strong><div class="mono-sub">{{ row.code }}</div></template>
            </el-table-column>
            <el-table-column label="法规 / 标准" min-width="170"><template #default="{ row }"><span :class="['reference-token', { missing: !row.standard }]">{{ row.standard || '未绑定' }}</span></template></el-table-column>
            <el-table-column label="方法" min-width="150"><template #default="{ row }"><span :class="['reference-token', { missing: !row.method }]">{{ row.method || '未绑定' }}</span></template></el-table-column>
            <el-table-column label="限值规则" min-width="140"><template #default="{ row }"><span class="reference-token">{{ row.limit || '不适用' }}</span></template></el-table-column>
            <el-table-column label="资源要求" min-width="130"><template #default="{ row }"><span class="plain-ref">{{ row.resource }}</span></template></el-table-column>
            <el-table-column label="报告模板" min-width="140"><template #default="{ row }"><span class="reference-token">{{ row.report }}</span></template></el-table-column>
            <el-table-column label="完整性" width="105" fixed="right">
              <template #default="{ row }"><span :class="['validation-state', row.complete ? 'ok' : 'error']"><el-icon><component :is="row.complete ? 'CircleCheck' : 'Warning'" /></el-icon>{{ row.complete ? '完整' : row.issue }}</span></template>
            </el-table-column>
            <el-table-column label="操作" width="70" fixed="right"><template #default><el-button link type="primary" size="small">编辑</el-button></template></el-table-column>
          </el-table>
        </section>

        <section v-else-if="currentStep === 'standards'" class="workspace-section">
          <AssetBindingPanel
            title="法律法规与标准"
            description="从标准资产库选择适用标准并锁定版本。场景发布只记录引用，不复制标准正文。"
            route="/app/assets/standards"
            action-label="打开标准库"
            :items="standardBindings"
            @open="router.push('/app/assets/standards')"
          />
        </section>

        <section v-else-if="currentStep === 'methods'" class="workspace-section">
          <div class="section-head">
            <div><h2>检测方法与限值</h2><p>检测方法、公式与限值是独立受控资产；场景发布时锁定精确版本。</p></div>
            <div class="head-actions"><el-button size="small" @click="router.push('/app/assets/limits')">限值与公式</el-button><el-button type="primary" size="small" @click="router.push('/app/assets/methods')">检测方法库</el-button></div>
          </div>
          <div class="binding-grid">
            <div class="binding-card"><div class="binding-label">方法版本</div><strong>ICP-MS Pb v2.1</strong><span class="reference-token">METHOD-ICPMS-PB-2.1</span><span class="validation-state ok"><el-icon><CircleCheck /></el-icon>已验证</span></div>
            <div class="binding-card"><div class="binding-label">限值规则</div><strong>食品污染物 Pb 限值</strong><span class="reference-token">LIMIT-FOOD-PB-v3</span><span class="validation-state ok"><el-icon><CircleCheck /></el-icon>已验证</span></div>
            <div class="binding-card"><div class="binding-label">公式版本</div><strong>ICP-MS 定量计算</strong><span class="reference-token">FORMULA-ICPMS-v4</span><span class="validation-state ok"><el-icon><CircleCheck /></el-icon>已验证</span></div>
          </div>
        </section>

        <section v-else-if="currentStep === 'workflow'" class="workspace-section">
          <div class="section-head">
            <div><h2>检测流程</h2><p>场景只绑定 Workflow Definition Version。节点执行能力来自 Node Type Registry。</p></div>
            <el-button type="primary" size="small" @click="router.push('/app/workflow/designer')">打开流程设计器</el-button>
          </div>
          <div class="workflow-binding">
            <div class="workflow-identity">
              <div class="workflow-icon"><el-icon><Share /></el-icon></div>
              <div><strong>第三方食品理化检测流程</strong><div class="mono-sub">food-third-party-flow · v1.4 Draft</div></div>
            </div>
            <div class="workflow-kpis">
              <div><span>节点</span><strong>8</strong></div><div><span>人工任务</span><strong>5</strong></div><div><span>服务节点</span><strong>2</strong></div><div><span>AI Hook</span><strong>2</strong></div>
            </div>
            <div class="workflow-validation"><span class="validation-state warn"><el-icon><Warning /></el-icon>1 个节点缺少 SLA</span><span class="plain-ref">发布场景前必须通过 Workflow Validation</span></div>
          </div>
          <div class="node-sequence">
            <template v-for="(node, index) in workflowNodes" :key="node.name">
              <div class="sequence-node"><span class="node-kind">{{ node.kind }}</span><strong>{{ node.name }}</strong><span class="mono-sub">{{ node.executor }}</span></div>
              <el-icon v-if="index < workflowNodes.length - 1" class="sequence-arrow"><ArrowRight /></el-icon>
            </template>
          </div>
        </section>

        <section v-else-if="currentStep === 'forms'" class="workspace-section">
          <div class="section-head"><div><h2>动态表单</h2><p>按场景节点绑定受控 Form Schema Version；运行态由 Schema Renderer 加载。</p></div><el-button type="primary" size="small" @click="router.push('/app/assets/forms')">打开表单设计器</el-button></div>
          <el-table :data="formBindings" border size="small"><el-table-column prop="scope" label="使用位置" min-width="150"/><el-table-column prop="schema" label="Form Schema" min-width="220"><template #default="{ row }"><span class="reference-token">{{ row.schema }}</span></template></el-table-column><el-table-column prop="version" label="版本" width="100"/><el-table-column label="状态" width="100"><template #default><span class="validation-state ok"><el-icon><CircleCheck /></el-icon>有效</span></template></el-table-column></el-table>
        </section>

        <section v-else-if="currentStep === 'resources'" class="workspace-section">
          <div class="section-head"><div><h2>资源与资质</h2><p>绑定人员、设备和实验室能力约束。运行时由确定性 Eligibility Rule 校验。</p></div><el-button size="small" @click="router.push('/app/resources/equipment')">资源管理</el-button></div>
          <el-table :data="resourceRules" border size="small"><el-table-column prop="scope" label="适用范围"/><el-table-column prop="requirement" label="能力要求" min-width="220"/><el-table-column prop="source" label="来源" min-width="180"><template #default="{ row }"><span class="reference-token">{{ row.source }}</span></template></el-table-column><el-table-column label="校验" width="100"><template #default><span class="validation-state ok"><el-icon><CircleCheck /></el-icon>通过</span></template></el-table-column></el-table>
        </section>

        <section v-else-if="currentStep === 'reports'" class="workspace-section">
          <div class="section-head"><div><h2>报告模板</h2><p>业务数据通过 ReportDocumentModel 输入模板；发布时锁定 Template Version。</p></div><el-button type="primary" size="small" @click="router.push('/app/assets/reports')">打开报告模板</el-button></div>
          <div class="report-binding"><div><div class="binding-label">默认报告</div><strong>食品理化检测报告</strong><div class="reference-token block-token">food-physchem-report · v4.2</div></div><div><div class="binding-label">适用输出</div><span>PDF / DOCX · 中文</span></div><div><div class="binding-label">签章策略</div><span>技术审核 → 授权签字 → 电子签章</span></div><span class="validation-state ok"><el-icon><CircleCheck /></el-icon>模板有效</span></div>
        </section>

        <section v-else-if="currentStep === 'ai'" class="workspace-section">
          <div class="section-head"><div><h2>AI 能力</h2><p>AI Skill 作为业务节点辅助能力。确定性判定、版本锁定和最终批准不由 AI 替代。</p></div><el-button size="small" @click="router.push('/app/workflow/ai-skills')">AI Skill Registry</el-button></div>
          <el-table :data="aiSkills" border size="small"><el-table-column prop="name" label="Skill" min-width="160"/><el-table-column prop="version" label="版本" width="100"/><el-table-column prop="trigger" label="触发位置" min-width="180"/><el-table-column label="人工确认" width="110"><template #default="{ row }">{{ row.human ? '必须' : '按策略' }}</template></el-table-column><el-table-column label="状态" width="100"><template #default><span class="validation-state ok"><el-icon><CircleCheck /></el-icon>已绑定</span></template></el-table-column></el-table>
        </section>

        <section v-else class="workspace-section preflight-section">
          <div class="section-head"><div><h2>发布检查 · Preflight</h2><p>系统解析所有资产、能力、版本与 Renderer，成功后才生成不可变 Scenario Snapshot。</p></div><el-button size="small"><el-icon><Refresh /></el-icon>重新校验</el-button></div>
          <div class="preflight-summary"><div><span class="summary-label">检查结果</span><strong class="danger-text">2 个阻塞项</strong></div><div><span class="summary-label">已通过</span><strong>18 项</strong></div><div><span class="summary-label">Snapshot</span><strong class="mono-sub">发布成功后生成 SHA-256</strong></div></div>
          <div class="validation-list">
            <div v-for="item in validations" :key="item.name" class="validation-row"><span :class="['validation-icon', item.level]"><el-icon><component :is="item.level === 'ok' ? 'CircleCheck' : item.level === 'warn' ? 'Warning' : 'Close'" /></el-icon></span><div class="validation-copy"><strong>{{ item.name }}</strong><span>{{ item.detail }}</span></div><el-button v-if="item.action" link type="primary" size="small" @click="item.route && router.push(item.route)">{{ item.action }}</el-button></div>
          </div>
          <div class="publish-bar"><div><strong>发布后不可直接编辑</strong><span>需要调整时，从已发布版本创建新的 Draft Version。</span></div><el-button type="primary" :disabled="publishBlockers > 0">发布 v1.3.0</el-button></div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const currentStep = ref('test-items')

const setupSteps = ref([
  { key: 'basic', name: '基础信息', description: '身份、模式与领域', status: 'done' },
  { key: 'subjects', name: '检测对象', description: 'Test Subject 与表单', status: 'done' },
  { key: 'test-items', name: '检测项', description: '能力矩阵与资产引用', status: 'warn', issueCount: 2 },
  { key: 'standards', name: '法律法规与标准', description: '版本化标准绑定', status: 'done' },
  { key: 'methods', name: '方法与限值', description: 'Method / Rule / Formula', status: 'done' },
  { key: 'workflow', name: '检测流程', description: 'Workflow Definition', status: 'warn', issueCount: 1 },
  { key: 'forms', name: '动态表单', description: 'Form Schema Version', status: 'done' },
  { key: 'resources', name: '资源与资质', description: 'Eligibility Rules', status: 'done' },
  { key: 'reports', name: '报告', description: 'Report Template Version', status: 'done' },
  { key: 'ai', name: 'AI 能力', description: 'Governed AI Skills', status: 'done' },
  { key: 'preflight', name: '发布检查', description: 'Resolve / Validate / Snapshot', status: 'error', issueCount: 2 },
])

const subjects = [
  { key: 'FOOD_SAMPLE', name: '食品样品', usage: '主检测对象', form: 'food-sample-intake · v3' },
  { key: 'ALIQUOT', name: '子样 / 分样', usage: '样品拆分与留样', form: 'food-aliquot · v2' },
]

const testItems = ref([
  { name: '铅 Pb', code: 'FOOD.PB', standard: 'GB 5009.12-2023', method: 'ICP-MS Pb v2.1', limit: 'Food Pb Limit v3', resource: 'ICP-MS / L2', report: 'Food Report v4.2', complete: true },
  { name: '镉 Cd', code: 'FOOD.CD', standard: 'GB 5009.15-2023', method: 'ICP-MS Cd v2.0', limit: 'Food Cd Limit v2', resource: 'ICP-MS / L2', report: 'Food Report v4.2', complete: true },
  { name: '总砷 As', code: 'FOOD.AS', standard: 'GB 5009.11-2014', method: '', limit: 'Food As Limit v2', resource: 'AFS / L2', report: 'Food Report v4.2', complete: false, issue: '缺方法' },
  { name: '苯甲酸', code: 'FOOD.BA', standard: '', method: 'HPLC BA v3.0', limit: 'Additive Limit v5', resource: 'HPLC / L1', report: 'Food Report v4.2', complete: false, issue: '缺标准' },
])

const standardBindings = [
  { code: 'GB 5009.12-2023', name: '食品中铅的测定', version: '2023', status: '有效' },
  { code: 'GB 5009.15-2023', name: '食品中镉的测定', version: '2023', status: '有效' },
  { code: 'GB 5009.11-2014', name: '食品中总砷及无机砷的测定', version: '2014', status: '有效' },
]

const workflowNodes = [
  { kind: 'HUMAN', name: '委托受理', executor: 'requestAcceptanceExecutor' },
  { kind: 'HUMAN', name: '收样', executor: 'sampleReceiptExecutor' },
  { kind: 'HUMAN', name: '样品前处理', executor: 'samplePreparationExecutor' },
  { kind: 'HUMAN', name: '实验室检测', executor: 'labTestExecutor' },
  { kind: 'HUMAN', name: '技术审核', executor: 'technicalReviewExecutor' },
  { kind: 'JAVA', name: '报告生成', executor: 'reportGenerationExecutor' },
]

const formBindings = [
  { scope: '委托受理', schema: 'third-party-request-intake', version: 'v3' },
  { scope: '食品样品', schema: 'food-sample-intake', version: 'v3' },
  { scope: '原始记录', schema: 'physchem-raw-record', version: 'v5' },
]

const resourceRules = [
  { scope: 'ICP-MS 检测项', requirement: '设备具备 ICP-MS 能力且校准有效', source: 'equipment.eligibility.v2' },
  { scope: '重金属检测', requirement: '检测人员资质等级 ≥ L2', source: 'person.qualification.v3' },
  { scope: '技术审核', requirement: '技术负责人且方法授权有效', source: 'reviewer.eligibility.v2' },
]

const aiSkills = [
  { name: 'standard-match', version: 'v1.2', trigger: '检测项 / 标准绑定', human: true },
  { name: 'anomaly-detect', version: 'v1.0', trigger: '结果提交后', human: true },
  { name: 'report-draft', version: 'v2.0', trigger: '报告生成', human: true },
]

const validations = ref([
  { level: 'ok', name: 'Manifest Schema', detail: 'ScenarioPack v2 schema 校验通过。' },
  { level: 'ok', name: '标准与方法版本', detail: '已引用资产均存在可解析版本。' },
  { level: 'error', name: '检测项完整性', detail: 'FOOD.AS 缺少检测方法；FOOD.BA 缺少适用标准。', action: '修复检测项', route: '/app/assets/test-items' },
  { level: 'warn', name: 'Workflow SLA', detail: '样品前处理节点未设置 SLA。', action: '打开流程', route: '/app/workflow/designer' },
  { level: 'ok', name: 'Node Type / Executor', detail: '所有流程节点均可解析 Backend Executor。' },
  { level: 'ok', name: 'Runtime Renderer', detail: '所有 HUMAN_TASK 节点均存在运行态 Renderer。' },
  { level: 'ok', name: 'Report Template', detail: 'food-physchem-report v4.2 可用。' },
])

const publishBlockers = computed(() => validations.value.filter(v => v.level === 'error').length)

const AssetBindingPanel = defineComponent({
  props: { title: String, description: String, actionLabel: String, items: { type: Array, default: () => [] } },
  emits: ['open'],
  setup(props, { emit }) {
    return () => h('div', { class: 'asset-binding-panel' }, [
      h('div', { class: 'section-head' }, [
        h('div', [h('h2', props.title), h('p', props.description)]),
        h('button', { class: 'native-primary', onClick: () => emit('open') }, props.actionLabel),
      ]),
      h('div', { class: 'asset-list' }, (props.items as any[]).map(item =>
        h('div', { class: 'asset-list-row' }, [
          h('span', { class: 'reference-token' }, item.code),
          h('div', { class: 'asset-main' }, [h('strong', item.name), h('span', `版本 ${item.version}`)]),
          h('span', { class: 'validation-state ok' }, '有效'),
        ])
      )),
    ])
  },
})
</script>

<style scoped>
.studio-shell { min-height: 100%; background: var(--ui-canvas); color: var(--ui-text); }
.studio-header { height: 64px; background: var(--ui-surface); border-bottom: 1px solid var(--ui-border); display: flex; align-items: center; justify-content: space-between; padding: 0 20px; position: sticky; top: 0; z-index: 5; }
.header-left, .header-actions, .title-row, .header-meta, .head-actions { display: flex; align-items: center; }
.header-left { gap: 10px; min-width: 0; }
.back-link { border: 0; background: transparent; color: var(--ui-action-text); display: inline-flex; align-items: center; gap: 4px; cursor: pointer; font: inherit; }
.header-sep { color: var(--ui-text-tertiary); }
.title-row { gap: 8px; }
h1 { font-size: 16px; margin: 0; font-weight: 600; }
.header-meta { gap: 6px; margin-top: 3px; color: var(--ui-text-tertiary); font-size: 11px; }
.header-actions { gap: 8px; }
.version-token, .status-token, .manifest-badge, .reference-token { border: 1px solid var(--ui-border); background: var(--ui-surface-muted); color: var(--ui-text-secondary); border-radius: 3px; padding: 2px 6px; font-size: 11px; line-height: 18px; }
.status-token.draft { background: var(--ui-surface-muted); }
.warning-text { color: var(--ui-warning); }
.danger-text { color: var(--ui-danger); }
.success-text { color: var(--ui-success); }
.studio-body { display: grid; grid-template-columns: 248px minmax(0, 1fr); min-height: calc(100vh - 112px); }
.lifecycle-panel { background: var(--ui-surface); border-right: 1px solid var(--ui-border); padding: 16px 0; }
.lifecycle-title-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 0 16px 12px; border-bottom: 1px solid var(--ui-border-subtle); }
.lifecycle-title { font-size: 14px; font-weight: 600; }
.lifecycle-subtitle { font-size: 11px; color: var(--ui-text-tertiary); margin-top: 3px; line-height: 1.4; }
.manifest-badge { font-family: var(--ui-font-mono); }
.step-list { padding: 8px 0; }
.step-row { width: 100%; border: 0; border-left: 2px solid transparent; background: transparent; display: grid; grid-template-columns: 24px minmax(0,1fr) auto; gap: 8px; align-items: flex-start; padding: 8px 14px; text-align: left; cursor: pointer; color: var(--ui-text); }
.step-row:hover { background: var(--ui-surface-muted); }
.step-row.active { background: var(--ui-selected-bg); border-left-color: var(--ui-brand); }
.step-state { width: 20px; height: 20px; border: 1px solid var(--ui-border); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; color: var(--ui-text-tertiary); margin-top: 1px; }
.step-state.done { color: var(--ui-success); border-color: color-mix(in srgb, var(--ui-success) 35%, var(--ui-border)); }
.step-state.warn { color: var(--ui-warning); }
.step-state.error { color: var(--ui-danger); }
.step-copy { min-width: 0; display: flex; flex-direction: column; }
.step-name { font-size: 13px; font-weight: 500; }
.step-desc { font-size: 11px; color: var(--ui-text-tertiary); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.issue-count { min-width: 18px; height: 18px; border-radius: 9px; background: var(--ui-danger-bg); color: var(--ui-danger); font-size: 10px; display: inline-flex; align-items: center; justify-content: center; }
.lifecycle-footnote { margin: 12px 14px 0; padding: 10px; border-top: 1px solid var(--ui-border-subtle); color: var(--ui-text-tertiary); font-size: 11px; line-height: 1.5; display: flex; gap: 6px; }
.studio-main { min-width: 0; padding: 22px 28px 40px; }
.workspace-section { max-width: 1080px; margin: 0 auto; }
.wide-section { max-width: none; }
.section-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 16px; }
.section-head h2 { margin: 0; font-size: 18px; font-weight: 600; }
.section-head p { margin: 4px 0 0; color: var(--ui-text-secondary); font-size: 12px; line-height: 1.5; }
.head-actions { gap: 8px; }
.form-panel { background: var(--ui-surface); border: 1px solid var(--ui-border); border-radius: var(--ui-radius-panel); padding: 18px 20px; }
.narrow { max-width: 680px; }
.field-help { color: var(--ui-text-tertiary); font-size: 11px; margin-top: 4px; }
.plain-table { border: 1px solid var(--ui-border); border-radius: var(--ui-radius-panel); background: var(--ui-surface); overflow: hidden; }
.table-header, .table-row { display: grid; align-items: center; gap: 12px; padding: 10px 14px; }
.table-header { background: var(--ui-surface-muted); color: var(--ui-text-secondary); font-size: 12px; border-bottom: 1px solid var(--ui-border); }
.table-row { font-size: 13px; border-bottom: 1px solid var(--ui-border-subtle); }
.table-row:last-child { border-bottom: 0; }
.subject-columns { grid-template-columns: 1.2fr 1.2fr 1.4fr 90px 60px; }
.mono-sub { font-family: var(--ui-font-mono); font-size: 11px; color: var(--ui-text-tertiary); margin-top: 2px; }
.reference-token { display: inline-block; width: fit-content; font-family: var(--ui-font-mono); white-space: nowrap; }
.reference-token.missing { color: var(--ui-danger); background: var(--ui-danger-bg); border-color: var(--ui-danger-border); }
.plain-ref { color: var(--ui-text-secondary); font-size: 12px; }
.validation-state { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 500; white-space: nowrap; }
.validation-state.ok { color: var(--ui-success); }
.validation-state.warn { color: var(--ui-warning); }
.validation-state.error { color: var(--ui-danger); }
.summary-line { display: flex; gap: 8px; align-items: center; font-size: 12px; color: var(--ui-text-secondary); margin-bottom: 10px; }
.asset-matrix :deep(.el-table__cell) { vertical-align: top; }
.asset-binding-panel { min-height: 400px; }
.asset-list { border: 1px solid var(--ui-border); border-radius: var(--ui-radius-panel); background: var(--ui-surface); }
.asset-list-row { display: grid; grid-template-columns: 180px minmax(0,1fr) 90px; gap: 14px; align-items: center; padding: 12px 14px; border-bottom: 1px solid var(--ui-border-subtle); }
.asset-list-row:last-child { border-bottom: 0; }
.asset-main { display: flex; flex-direction: column; gap: 2px; }
.asset-main span { font-size: 11px; color: var(--ui-text-tertiary); }
.native-primary { min-height: 28px; padding: 4px 10px; border: 1px solid var(--ui-action-solid); border-radius: var(--ui-radius-control); background: var(--ui-action-solid); color: var(--ui-on-action); cursor: pointer; font: inherit; font-size: 12px; }
.binding-grid { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 12px; }
.binding-card { background: var(--ui-surface); border: 1px solid var(--ui-border); border-radius: var(--ui-radius-panel); padding: 16px; display: flex; flex-direction: column; gap: 8px; }
.binding-label { color: var(--ui-text-tertiary); font-size: 11px; }
.workflow-binding, .report-binding { background: var(--ui-surface); border: 1px solid var(--ui-border); border-radius: var(--ui-radius-panel); padding: 16px; }
.workflow-identity { display: flex; align-items: center; gap: 10px; }
.workflow-icon { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--ui-border); border-radius: 4px; color: var(--ui-text-secondary); }
.workflow-kpis { display: grid; grid-template-columns: repeat(4, 1fr); margin-top: 16px; border-top: 1px solid var(--ui-border-subtle); border-bottom: 1px solid var(--ui-border-subtle); }
.workflow-kpis div { padding: 10px 12px; border-right: 1px solid var(--ui-border-subtle); display: flex; flex-direction: column; gap: 3px; }
.workflow-kpis div:last-child { border-right: 0; }
.workflow-kpis span { color: var(--ui-text-tertiary); font-size: 11px; }
.workflow-validation { display: flex; align-items: center; gap: 12px; padding-top: 12px; }
.node-sequence { margin-top: 16px; display: flex; align-items: center; gap: 8px; overflow-x: auto; padding-bottom: 6px; }
.sequence-node { flex: 0 0 150px; background: var(--ui-surface); border: 1px solid var(--ui-border); border-radius: 4px; padding: 10px; display: flex; flex-direction: column; gap: 4px; }
.node-kind { font-size: 10px; color: var(--ui-text-tertiary); letter-spacing: .04em; }
.sequence-arrow { color: var(--ui-text-tertiary); flex: 0 0 auto; }
.report-binding { display: grid; grid-template-columns: 1.4fr 1fr 1.4fr auto; gap: 20px; align-items: center; }
.block-token { margin-top: 6px; }
.preflight-summary { background: var(--ui-surface); border: 1px solid var(--ui-border); border-radius: var(--ui-radius-panel); display: grid; grid-template-columns: repeat(3,1fr); margin-bottom: 12px; }
.preflight-summary > div { padding: 14px 16px; border-right: 1px solid var(--ui-border-subtle); display: flex; flex-direction: column; gap: 3px; }
.preflight-summary > div:last-child { border-right: 0; }
.summary-label { color: var(--ui-text-tertiary); font-size: 11px; }
.validation-list { background: var(--ui-surface); border: 1px solid var(--ui-border); border-radius: var(--ui-radius-panel); }
.validation-row { display: grid; grid-template-columns: 24px minmax(0,1fr) auto; align-items: center; gap: 10px; padding: 11px 14px; border-bottom: 1px solid var(--ui-border-subtle); }
.validation-row:last-child { border-bottom: 0; }
.validation-icon { display: flex; align-items: center; justify-content: center; }
.validation-icon.ok { color: var(--ui-success); }.validation-icon.warn { color: var(--ui-warning); }.validation-icon.error { color: var(--ui-danger); }
.validation-copy { display: flex; flex-direction: column; gap: 2px; }
.validation-copy span { color: var(--ui-text-secondary); font-size: 11px; }
.publish-bar { margin-top: 16px; background: var(--ui-surface); border: 1px solid var(--ui-border); border-radius: var(--ui-radius-panel); padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; }
.publish-bar > div { display: flex; flex-direction: column; gap: 2px; }
.publish-bar span { color: var(--ui-text-secondary); font-size: 11px; }
@media (max-width: 1100px) { .studio-body { grid-template-columns: 220px minmax(0,1fr); }.studio-main { padding: 20px; }.binding-grid { grid-template-columns: 1fr; }.report-binding { grid-template-columns: 1fr 1fr; } }
</style>
