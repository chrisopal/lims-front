<template>
  <div class="workflow-shell">
    <header class="workflow-header">
      <div class="header-context">
        <div class="breadcrumb"><button @click="router.push('/app/scenarios/studio')">第三方食品理化检测</button><span>/</span><strong>检测流程</strong></div>
        <div class="title-row"><h1>流程设计器</h1><span class="version-token">food-third-party-flow · v1.4 Draft</span><span class="status-token">由场景包发布时锁定</span></div>
      </div>
      <div class="header-actions">
        <el-button size="small"><el-icon><RefreshLeft /></el-icon>撤销</el-button>
        <el-button size="small" @click="showValidation = true">验证流程</el-button>
        <el-button size="small">保存流程版本</el-button>
        <el-button type="primary" size="small" @click="router.push('/app/scenarios/studio')">保存并返回场景</el-button>
      </div>
    </header>

    <div class="runtime-banner">
      <el-icon><InfoFilled /></el-icon>
      <span>Workflow Definition 只负责编排。每个节点必须解析到平台注册的 <strong>Node Type → Executor → Config Renderer / Runtime Renderer</strong>；场景发布时统一做 Preflight。</span>
    </div>

    <div class="workflow-body">
      <aside class="palette-panel">
        <div class="panel-title-row"><strong>节点库</strong><span>Node Type Registry</span></div>
        <el-input v-model="nodeSearch" size="small" placeholder="搜索节点类型" prefix-icon="Search" clearable />
        <div class="palette-groups">
          <div v-for="group in filteredPalette" :key="group.key" class="palette-group">
            <div class="group-label">{{ group.label }}</div>
            <button v-for="node in group.nodes" :key="node.type" class="palette-node">
              <el-icon><component :is="node.icon" /></el-icon>
              <span class="palette-copy"><strong>{{ node.name }}</strong><small>{{ node.type }}</small></span>
              <span class="mode-token">{{ modeShort(node.mode) }}</span>
            </button>
          </div>
        </div>
      </aside>

      <main class="canvas-panel">
        <div class="canvas-toolbar">
          <div class="toolbar-left"><el-button-group size="small"><el-button>−</el-button><el-button>100%</el-button><el-button>+</el-button></el-button-group><el-button size="small">适应画布</el-button></div>
          <div class="toolbar-right"><span class="validation-state ok"><el-icon><CircleCheck /></el-icon>Node Type 解析通过</span><span class="validation-state warn"><el-icon><Warning /></el-icon>1 个 SLA 警告</span></div>
        </div>

        <div class="canvas-scroll">
          <div class="process-canvas">
            <div class="lane" v-for="lane in lanes" :key="lane.key">
              <div class="lane-label"><strong>{{ lane.label }}</strong><span>{{ lane.description }}</span></div>
              <div class="lane-track">
                <template v-for="(node, index) in lane.nodes" :key="node.id">
                  <button :class="['process-node', { selected: selectedNode?.id === node.id }]" @click="selectNode(node)">
                    <div class="node-head"><el-icon><component :is="node.icon" /></el-icon><span class="mode-token">{{ modeShort(node.mode) }}</span></div>
                    <strong>{{ node.name }}</strong>
                    <small>{{ node.type }}</small>
                    <div class="node-foot"><span>{{ node.sla || 'SLA 未设置' }}</span><span v-if="node.aiSkill" class="ai-hook">AI 辅助</span></div>
                  </button>
                  <el-icon v-if="index < lane.nodes.length - 1" class="node-arrow"><ArrowRight /></el-icon>
                </template>
              </div>
            </div>
          </div>
        </div>
      </main>

      <aside class="inspector-panel">
        <template v-if="selectedNode">
          <div class="inspector-header"><div><strong>{{ selectedNode.name }}</strong><span>{{ selectedNode.type }}</span></div><span class="mode-token">{{ selectedNode.mode }}</span></div>

          <section class="inspector-section technical-section">
            <div class="section-label">节点类型描述符 <span>只读</span></div>
            <div class="kv"><span>Node Type</span><strong class="mono">{{ selectedNode.type }}</strong></div>
            <div class="kv"><span>Execution Mode</span><strong>{{ selectedNode.mode }}</strong></div>
            <div class="kv"><span>Backend Executor</span><strong class="mono">{{ selectedNode.executor }}</strong></div>
            <div class="kv"><span>Config Renderer</span><strong class="mono">{{ selectedNode.configRenderer }}</strong></div>
            <div class="kv"><span>Runtime Renderer</span><strong class="mono">{{ selectedNode.runtimeRenderer || '— automated —' }}</strong></div>
            <div class="kv"><span>Source Module</span><strong class="mono">{{ selectedNode.module }}</strong></div>
          </section>

          <section class="inspector-section">
            <div class="section-label">节点配置</div>
            <el-form label-position="top" size="small">
              <el-form-item label="显示名称"><el-input v-model="selectedNode.name" /></el-form-item>
              <el-form-item label="执行角色" v-if="selectedNode.mode === 'HUMAN_TASK'"><el-select v-model="selectedNode.role" style="width:100%" clearable placeholder="选择角色"><el-option v-for="role in roles" :key="role" :label="role" :value="role" /></el-select></el-form-item>
              <el-form-item label="SLA"><el-input v-model="selectedNode.sla" placeholder="例如 4h / 1d" /></el-form-item>
              <el-form-item label="进入条件"><el-input v-model="selectedNode.entryRule" type="textarea" :rows="2" placeholder="可选：Rule / Expression" /></el-form-item>
              <el-form-item label="完成条件"><el-input v-model="selectedNode.exitRule" type="textarea" :rows="2" placeholder="可选：Rule / Expression" /></el-form-item>
            </el-form>
          </section>

          <section class="inspector-section">
            <div class="section-label">运行策略</div>
            <div class="kv"><span>审计策略</span><el-select v-model="selectedNode.audit" size="small" style="width:150px"><el-option label="全量审计" value="FULL"/><el-option label="关键动作" value="KEY_ACTIONS"/></el-select></div>
            <div class="kv"><span>超时策略</span><el-select v-model="selectedNode.timeout" size="small" style="width:150px"><el-option label="上报并挂起" value="ESCALATE_HOLD"/><el-option label="自动重试" value="RETRY"/></el-select></div>
          </section>

          <section class="inspector-section">
            <div class="section-label">AI Skill Hook</div>
            <el-select v-model="selectedNode.aiSkill" size="small" clearable placeholder="不挂载 AI Skill" style="width:100%"><el-option label="standard-match v1.2" value="standard-match"/><el-option label="anomaly-detect v1.0" value="anomaly-detect"/><el-option label="report-draft v2.0" value="report-draft"/><el-option label="report-review v1.4" value="report-review"/></el-select>
            <div v-if="selectedNode.aiSkill" class="ai-policy"><el-icon><InfoFilled /></el-icon>AI 输出为建议或草稿；最终业务状态仍由规则与人工操作控制。</div>
          </section>
        </template>
        <div v-else class="inspector-empty"><el-icon><Connection /></el-icon><strong>选择一个流程节点</strong><span>查看 Node Type、Executor 与 Renderer，并配置该节点在当前场景中的参数。</span></div>
      </aside>
    </div>

    <el-drawer v-model="showValidation" title="流程验证" size="420px">
      <div class="validation-drawer">
        <div class="validation-summary"><strong>6 项通过</strong><span class="warning-text">1 项警告</span></div>
        <div v-for="item in validationItems" :key="item.name" class="validation-row"><span :class="['validation-icon', item.level]"><el-icon><component :is="item.level === 'ok' ? 'CircleCheck' : 'Warning'" /></el-icon></span><div><strong>{{ item.name }}</strong><span>{{ item.detail }}</span></div></div>
        <div class="validation-note">Workflow 只有在场景包 Preflight 解析全部资产、Executor 与 Runtime Renderer 后，才可进入 Scenario Snapshot。</div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const nodeSearch = ref('')
const showValidation = ref(false)
const selectedNode = ref<any>(null)

const roles = ['委托受理员', '收样员', '理化检测员 L1', '理化检测员 L2', '技术负责人', '授权签字人', '现场采样员']

const nodePalette = [
  { key: 'control', label: '流程控制', nodes: [
    { type: 'GATEWAY_CONDITION', name: '条件网关', icon: 'Share', mode: 'RULE' },
    { type: 'TIMER', name: '定时 / SLA', icon: 'Clock', mode: 'TIMER' },
    { type: 'SUBPROCESS', name: '子流程', icon: 'Connection', mode: 'SUBPROCESS' },
  ]},
  { key: 'lab', label: '实验室通用', nodes: [
    { type: 'REQUEST_ACCEPTANCE', name: '委托受理', icon: 'Document', mode: 'HUMAN_TASK' },
    { type: 'SAMPLE_RECEIPT', name: '收样', icon: 'Box', mode: 'HUMAN_TASK' },
    { type: 'LAB_TEST_EXECUTION', name: '实验室检测', icon: 'Monitor', mode: 'HUMAN_TASK' },
    { type: 'TECHNICAL_REVIEW', name: '技术审核', icon: 'Finished', mode: 'HUMAN_TASK' },
    { type: 'REPORT_GENERATION', name: '报告生成', icon: 'Files', mode: 'JAVA_SERVICE' },
  ]},
  { key: 'field', label: '现场作业', nodes: [
    { type: 'FIELD_SAMPLING', name: '现场采样', icon: 'Location', mode: 'HUMAN_TASK' },
    { type: 'ONSITE_INSPECTION', name: '客户现场检测', icon: 'Aim', mode: 'HUMAN_TASK' },
  ]},
  { key: 'automation', label: '自动化能力', nodes: [
    { type: 'RULE_EVALUATION', name: '规则判定', icon: 'DataAnalysis', mode: 'RULE' },
    { type: 'INTEGRATION_CALL', name: '系统集成', icon: 'Link', mode: 'INTEGRATION' },
    { type: 'AI_SKILL', name: 'AI Skill', icon: 'Cpu', mode: 'AI' },
  ]},
]

const filteredPalette = computed(() => {
  const q = nodeSearch.value.trim().toLowerCase()
  if (!q) return nodePalette
  return nodePalette.map(group => ({ ...group, nodes: group.nodes.filter(n => `${n.name} ${n.type}`.toLowerCase().includes(q)) })).filter(group => group.nodes.length)
})

const makeNode = (id: number, name: string, type: string, mode: string, icon: string, executor: string, runtimeRenderer: string | null, role = '', sla = '') => ({
  id, name, type, mode, icon, executor, configRenderer: `${type.toLowerCase().replaceAll('_','-')}-config`, runtimeRenderer, module: type.startsWith('FIELD_') ? 'domain-field-operation' : 'domain-laboratory', role, sla, entryRule: '', exitRule: '', audit: 'FULL', timeout: 'ESCALATE_HOLD', aiSkill: '',
})

const lanes = ref([
  { key: 'intake', label: '委托与收样', description: '客户 / 受理人员', nodes: [
    makeNode(1, '委托受理', 'REQUEST_ACCEPTANCE', 'HUMAN_TASK', 'Document', 'requestAcceptanceExecutor', 'request-acceptance-workbench', '委托受理员', '2h'),
    makeNode(2, '收样', 'SAMPLE_RECEIPT', 'HUMAN_TASK', 'Box', 'sampleReceiptExecutor', 'sample-receipt-workbench', '收样员', '4h'),
  ]},
  { key: 'execution', label: '检测执行', description: '检测人员 / 设备', nodes: [
    makeNode(3, '样品前处理', 'SAMPLE_PREPARATION', 'HUMAN_TASK', 'Operation', 'samplePreparationExecutor', 'sample-preparation-workbench', '理化检测员 L1', ''),
    makeNode(4, '实验室检测', 'LAB_TEST_EXECUTION', 'HUMAN_TASK', 'Monitor', 'labTestExecutor', 'test-execution-workbench', '理化检测员 L2', '1d'),
  ]},
  { key: 'review', label: '审核与交付', description: '技术负责人 / 授权签字人', nodes: [
    makeNode(5, '技术审核', 'TECHNICAL_REVIEW', 'HUMAN_TASK', 'Finished', 'technicalReviewExecutor', 'review-workbench', '技术负责人', '4h'),
    makeNode(6, '报告生成', 'REPORT_GENERATION', 'JAVA_SERVICE', 'Files', 'reportGenerationExecutor', null, '', '30m'),
    makeNode(7, '报告签发', 'REPORT_RELEASE', 'HUMAN_TASK', 'DocumentChecked', 'reportReleaseExecutor', 'report-release-workbench', '授权签字人', '4h'),
  ]},
])

selectedNode.value = lanes.value[1].nodes[0]

const validationItems = [
  { level: 'ok', name: '开始 / 结束路径', detail: '所有节点可从入口到达并可到达终点。' },
  { level: 'ok', name: 'Node Type Registry', detail: '7 个节点类型均已注册。' },
  { level: 'ok', name: 'Backend Executor', detail: '所有节点均解析到可用 Executor。' },
  { level: 'ok', name: 'Runtime Renderer', detail: '所有 HUMAN_TASK 均存在运行态工作台。' },
  { level: 'warn', name: 'SLA', detail: '样品前处理节点未设置 SLA。' },
  { level: 'ok', name: '角色权限', detail: '所有人工节点均配置执行角色。' },
  { level: 'ok', name: '循环与死锁', detail: '未发现非法循环或不可达节点。' },
]

function selectNode(node: any) { selectedNode.value = node }
function modeShort(mode: string) {
  const map: Record<string,string> = { HUMAN_TASK: 'Human', JAVA_SERVICE: 'Java', RULE: 'Rule', INTEGRATION: 'Integration', AI: 'AI', TIMER: 'Timer', SUBPROCESS: 'Subprocess' }
  return map[mode] || mode
}
</script>

<style scoped>
.workflow-shell { min-height: 100%; background: var(--ui-canvas); color: var(--ui-text); }
.workflow-header { min-height: 64px; background: var(--ui-surface); border-bottom: 1px solid var(--ui-border); display: flex; align-items: center; justify-content: space-between; padding: 8px 16px; gap: 16px; }
.breadcrumb { display: flex; gap: 6px; align-items: center; font-size: 11px; color: var(--ui-text-tertiary); }.breadcrumb button { border:0;background:transparent;color:var(--ui-action-text);cursor:pointer;font:inherit;padding:0; }.title-row { display:flex;align-items:center;gap:8px;margin-top:4px; }.title-row h1 { margin:0;font-size:16px;font-weight:600; }.version-token,.status-token,.mode-token { border:1px solid var(--ui-border);background:var(--ui-surface-muted);color:var(--ui-text-secondary);border-radius:3px;padding:2px 6px;font-size:10px;line-height:16px; }.version-token { font-family:var(--ui-font-mono); }.header-actions { display:flex;gap:8px;align-items:center; }
.runtime-banner { min-height:36px;padding:8px 16px;background:var(--ui-selected-bg);border-bottom:1px solid var(--ui-border);display:flex;align-items:center;gap:7px;color:var(--ui-text-secondary);font-size:11px; }
.workflow-body { display:grid;grid-template-columns:230px minmax(0,1fr) 310px;height:calc(100vh - 148px);min-height:560px; }
.palette-panel,.inspector-panel { background:var(--ui-surface);overflow:auto; }.palette-panel { border-right:1px solid var(--ui-border);padding:12px; }.inspector-panel { border-left:1px solid var(--ui-border); }.panel-title-row { display:flex;justify-content:space-between;align-items:center;margin-bottom:10px; }.panel-title-row strong { font-size:13px; }.panel-title-row span { font-size:9px;color:var(--ui-text-tertiary);font-family:var(--ui-font-mono); }.palette-groups { margin-top:12px; }.palette-group { margin-bottom:16px; }.group-label { font-size:10px;color:var(--ui-text-tertiary);font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:5px; }.palette-node { width:100%;border:1px solid transparent;background:transparent;border-radius:4px;padding:7px 6px;display:grid;grid-template-columns:18px minmax(0,1fr) auto;gap:6px;align-items:center;text-align:left;color:var(--ui-text-secondary);cursor:grab;font:inherit; }.palette-node:hover { background:var(--ui-surface-muted);border-color:var(--ui-border-subtle); }.palette-copy { min-width:0;display:flex;flex-direction:column; }.palette-copy strong { color:var(--ui-text);font-size:11px;font-weight:500; }.palette-copy small { font-size:8px;color:var(--ui-text-tertiary);font-family:var(--ui-font-mono);white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
.canvas-panel { min-width:0;display:flex;flex-direction:column;overflow:hidden; }.canvas-toolbar { min-height:46px;background:var(--ui-surface);border-bottom:1px solid var(--ui-border);display:flex;align-items:center;justify-content:space-between;padding:7px 10px; }.toolbar-left,.toolbar-right { display:flex;align-items:center;gap:8px; }.validation-state { display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:500; }.validation-state.ok { color:var(--ui-success); }.validation-state.warn,.warning-text { color:var(--ui-warning); }
.canvas-scroll { flex:1;overflow:auto;padding:24px; }.process-canvas { min-width:760px;background-image:linear-gradient(var(--ui-border-subtle) 1px,transparent 1px),linear-gradient(90deg,var(--ui-border-subtle) 1px,transparent 1px);background-size:24px 24px;border:1px solid var(--ui-border-subtle);border-radius:4px;padding:16px;background-color:var(--ui-surface); }.lane { display:grid;grid-template-columns:130px minmax(0,1fr);min-height:132px;border-bottom:1px solid var(--ui-border-subtle); }.lane:last-child { border-bottom:0; }.lane-label { border-right:1px solid var(--ui-border);padding:14px 12px;display:flex;flex-direction:column;gap:3px; }.lane-label strong { font-size:11px; }.lane-label span { color:var(--ui-text-tertiary);font-size:9px; }.lane-track { display:flex;align-items:center;gap:8px;padding:16px;overflow-x:auto; }.process-node { flex:0 0 156px;min-height:92px;background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:4px;padding:9px;text-align:left;color:var(--ui-text);cursor:pointer;font:inherit;box-shadow:none; }.process-node:hover { border-color:var(--ui-border-strong); }.process-node.selected { border-color:var(--ui-brand);box-shadow:0 0 0 1px var(--ui-brand) inset; }.node-head { display:flex;justify-content:space-between;align-items:center;color:var(--ui-text-secondary);margin-bottom:7px; }.process-node > strong { display:block;font-size:11px;font-weight:600;margin-bottom:3px; }.process-node > small { display:block;color:var(--ui-text-tertiary);font-size:8px;font-family:var(--ui-font-mono);white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }.node-foot { border-top:1px solid var(--ui-border-subtle);margin-top:8px;padding-top:6px;display:flex;align-items:center;justify-content:space-between;color:var(--ui-text-tertiary);font-size:9px; }.ai-hook { color:var(--ui-action-text); }.node-arrow { color:var(--ui-text-tertiary);flex:0 0 auto; }
.inspector-header { padding:13px 14px;border-bottom:1px solid var(--ui-border);display:flex;justify-content:space-between;align-items:flex-start;gap:8px; }.inspector-header > div { display:flex;flex-direction:column;gap:3px; }.inspector-header strong { font-size:13px; }.inspector-header span { font-size:9px;color:var(--ui-text-tertiary);font-family:var(--ui-font-mono); }.inspector-section { padding:13px 14px;border-bottom:1px solid var(--ui-border-subtle); }.technical-section { background:var(--ui-surface-muted); }.section-label { font-size:10px;font-weight:600;color:var(--ui-text-secondary);margin-bottom:10px;text-transform:uppercase;letter-spacing:.04em; }.section-label > span { font-weight:400;color:var(--ui-text-tertiary);text-transform:none;letter-spacing:0; }.kv { display:grid;grid-template-columns:105px minmax(0,1fr);gap:8px;align-items:center;min-height:27px;border-bottom:1px solid var(--ui-border-subtle);font-size:10px; }.kv:last-child { border-bottom:0; }.kv > span { color:var(--ui-text-tertiary); }.kv strong { font-weight:500;overflow-wrap:anywhere; }.mono { font-family:var(--ui-font-mono);font-size:9px; }.ai-policy { margin-top:8px;padding:8px;background:var(--ui-selected-bg);border:1px solid var(--ui-border-subtle);border-radius:4px;color:var(--ui-text-secondary);font-size:10px;line-height:1.45;display:flex;gap:5px; }.inspector-empty { height:100%;min-height:260px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px;color:var(--ui-text-tertiary);gap:7px; }.inspector-empty .el-icon { font-size:26px;color:var(--ui-border-strong); }.inspector-empty strong { color:var(--ui-text-secondary);font-size:12px; }.inspector-empty span { max-width:230px;font-size:10px;line-height:1.5; }
.validation-drawer { padding:0 4px; }.validation-summary { display:flex;gap:12px;padding:10px 12px;background:var(--ui-surface-muted);border:1px solid var(--ui-border);border-radius:4px;margin-bottom:12px;font-size:12px; }.validation-row { display:grid;grid-template-columns:20px minmax(0,1fr);gap:8px;padding:10px 2px;border-bottom:1px solid var(--ui-border-subtle); }.validation-icon.ok { color:var(--ui-success); }.validation-icon.warn { color:var(--ui-warning); }.validation-row div { display:flex;flex-direction:column;gap:2px; }.validation-row strong { font-size:11px; }.validation-row span { font-size:10px;color:var(--ui-text-secondary); }.validation-note { margin-top:14px;color:var(--ui-text-tertiary);font-size:10px;line-height:1.5; }
@media(max-width:1200px){.workflow-body{grid-template-columns:200px minmax(0,1fr) 280px}.workflow-header{align-items:flex-start;flex-direction:column}.workflow-body{height:calc(100vh - 190px)}}
</style>
