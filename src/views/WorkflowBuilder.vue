<template>
  <div class="builder-shell">
    <!-- Top header -->
    <div class="builder-header">
      <div class="bh-left">
        <div class="bh-context">
          <span class="bh-scene-label">场景：</span>
          <el-select v-model="activeScenario" size="small" style="width:220px">
            <el-option label="第三方食品理化检测 v1.3 Draft" value="food" />
            <el-option label="环境水质监测 v0.9 Draft" value="env" />
            <el-option label="企业内部几何量检测 v2.2 Draft" value="metrology" />
          </el-select>
          <span class="bh-sep">·</span>
          <span class="bh-ver draft">Draft</span>
        </div>
        <div class="bh-title">流程设计器 <span class="bh-subtitle">Workflow Designer</span></div>
      </div>
      <div class="bh-actions">
        <el-button size="small" plain><el-icon><RefreshLeft /></el-icon> 撤销</el-button>
        <el-button size="small" plain>验证流程</el-button>
        <el-button size="small">保存草稿</el-button>
        <el-button type="primary" size="small">保存并发布</el-button>
      </div>
    </div>

    <div class="builder-body">
      <!-- Left: Node Palette -->
      <div class="palette">
        <div class="palette-header">节点库 <span class="palette-hint">拖拽到画布</span></div>
        <div v-for="grp in nodePalette" :key="grp.key" class="palette-group">
          <div class="pg-label">{{ grp.label }}</div>
          <div v-for="n in grp.nodes" :key="n.typeKey" class="palette-item" draggable="true">
            <div class="pi-left">
              <el-icon size="13"><component :is="n.icon" /></el-icon>
              <div class="pi-text">
                <div class="pi-name">{{ n.name }}</div>
                <div class="pi-key">{{ n.typeKey }}</div>
              </div>
            </div>
            <span :class="['pi-mode', modeClass(n.mode)]">{{ modeLabel(n.mode) }}</span>
          </div>
        </div>
      </div>

      <!-- Center: Canvas -->
      <div class="canvas-area" @click.self="selectedNodeId = null">
        <div class="canvas-toolbar">
          <div class="ct-left">
            <el-button-group size="small">
              <el-button size="small">100%</el-button>
              <el-button size="small">适应画布</el-button>
            </el-button-group>
            <el-divider direction="vertical" />
            <el-radio-group v-model="showMode" size="small">
              <el-radio-button value="swimlane">泳道</el-radio-button>
              <el-radio-button value="sequence">顺序</el-radio-button>
            </el-radio-group>
          </div>
          <div class="ct-right">
            <span class="ct-note">
              <el-icon size="11"><InfoFilled /></el-icon>
              节点执行能力由平台注册的 Node Type Executor 提供，流程设计仅配置参数与连接
            </span>
          </div>
        </div>

        <div class="canvas-scroll">
          <!-- Swimlane mode -->
          <div class="swimlane-canvas">
            <!-- Start node -->
            <div class="flow-row">
              <div class="start-end-node">
                <div class="se-circle start">START</div>
              </div>
              <div class="flow-arrow"><el-icon><ArrowRight /></el-icon></div>
            </div>

            <!-- Each lane -->
            <div v-for="lane in flowLanes" :key="lane.id" class="swimlane">
              <div class="sl-label-col">
                <div class="sl-label">
                  <span :class="['sl-dot', lane.color]"></span>
                  {{ lane.label }}
                </div>
              </div>
              <div class="sl-nodes">
                <template v-for="(node, i) in lane.nodes" :key="node.id">
                  <div
                    class="flow-node"
                    :class="[`mode-${node.mode}`, { selected: selectedNodeId === node.id }]"
                    @click.stop="selectNode(node)"
                  >
                    <div class="fn-top">
                      <el-icon size="12"><component :is="node.icon" /></el-icon>
                      <span :class="['fn-mode-badge', node.mode]">{{ modeLabel(node.mode) }}</span>
                    </div>
                    <div class="fn-name">{{ node.name }}</div>
                    <div class="fn-type">{{ node.typeKey }}</div>
                    <div class="fn-bottom">
                      <span class="fn-sla">{{ node.sla }}</span>
                      <span class="fn-ai-dot" v-if="node.aiSkill" title="AI Skill 已挂载">
                        <el-icon size="9" color="#526075"><MagicStick /></el-icon>
                      </span>
                    </div>
                  </div>
                  <div class="node-arrow" v-if="i < lane.nodes.length - 1">
                    <el-icon size="12" color="#B0B9C6"><ArrowRight /></el-icon>
                  </div>
                </template>
              </div>
            </div>

            <!-- End node -->
            <div class="flow-row end-row">
              <div class="flow-arrow"><el-icon><ArrowRight /></el-icon></div>
              <div class="start-end-node">
                <div class="se-circle end">END</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Inspector -->
      <div class="inspector">
        <div v-if="selectedNodeData" class="insp-content">
          <!-- Node identity (readonly) -->
          <div class="insp-section identity-section">
            <div class="insp-node-name">{{ selectedNodeData.name }}</div>
            <div class="insp-type-row">
              <span class="insp-type-key">{{ selectedNodeData.typeKey }}</span>
              <span :class="['fn-mode-badge', selectedNodeData.mode]">{{ modeLabel(selectedNodeData.mode) }}</span>
            </div>
          </div>

          <!-- Technical info (readonly) -->
          <div class="insp-section">
            <div class="insp-sec-title">节点类型描述符 <span class="readonly-badge">只读</span></div>
            <div class="insp-kv"><span class="ik">Node Type</span><span class="iv mono">{{ selectedNodeData.typeKey }}</span></div>
            <div class="insp-kv"><span class="ik">Execution Mode</span><span :class="['iv fn-mode-badge', selectedNodeData.mode]">{{ modeLabel(selectedNodeData.mode) }}</span></div>
            <div class="insp-kv"><span class="ik">Backend Executor</span><span class="iv mono muted">{{ selectedNodeData.executor }}</span></div>
            <div class="insp-kv"><span class="ik">Config Renderer</span><span class="iv mono muted">{{ selectedNodeData.configRenderer }}</span></div>
            <div class="insp-kv">
              <span class="ik">Runtime Renderer</span>
              <span class="iv mono" :class="selectedNodeData.renderer ? 'renderer-link' : 'muted'">
                {{ selectedNodeData.renderer || '— (automated)' }}
              </span>
            </div>
            <div class="insp-kv"><span class="ik">Source Module</span><span class="iv mono muted">{{ selectedNodeData.module }}</span></div>
          </div>

          <!-- Configuration -->
          <div class="insp-section">
            <div class="insp-sec-title">节点配置</div>
            <el-form label-position="top" size="small">
              <el-form-item label="节点显示名称">
                <el-input v-model="selectedNodeData.name" />
              </el-form-item>
              <el-form-item label="执行角色">
                <el-select v-model="selectedNodeData.role" style="width:100%" clearable placeholder="选择执行角色">
                  <el-option label="受理员" value="acceptor" />
                  <el-option label="收样员" value="receiver" />
                  <el-option label="理化检测员-L1" value="lab-l1" />
                  <el-option label="理化检测员-L2" value="lab-l2" />
                  <el-option label="微生物检测员" value="micro" />
                  <el-option label="技术负责人" value="tech-lead" />
                  <el-option label="授权签字人" value="auth-signer" />
                  <el-option label="现场采样员" value="field-sampler" />
                </el-select>
              </el-form-item>
              <el-form-item label="SLA">
                <el-input v-model="selectedNodeData.sla" placeholder="如：4h、1d、2h" />
              </el-form-item>
              <el-form-item label="进入条件">
                <el-input type="textarea" v-model="selectedNodeData.entryCondition" :rows="2" placeholder="条件表达式或留空" />
              </el-form-item>
              <el-form-item label="完成条件">
                <el-input type="textarea" v-model="selectedNodeData.exitCondition" :rows="2" placeholder="条件表达式或留空" />
              </el-form-item>
            </el-form>
          </div>

          <!-- Node-specific config -->
          <div class="insp-section" v-if="selectedNodeData.specificConfig?.length">
            <div class="insp-sec-title">节点特定参数</div>
            <el-form label-position="top" size="small">
              <div v-for="cfg in selectedNodeData.specificConfig" :key="cfg.key">
                <el-form-item :label="cfg.label">
                  <el-switch v-if="cfg.type === 'Boolean'" v-model="cfg.value" />
                  <el-select v-else-if="cfg.type === 'Enum'" v-model="cfg.value" style="width:100%">
                    <el-option v-for="opt in cfg.options" :key="opt" :label="opt" :value="opt" />
                  </el-select>
                  <el-input v-else v-model="cfg.value" />
                </el-form-item>
              </div>
            </el-form>
          </div>

          <!-- AI Skill attachment -->
          <div class="insp-section">
            <div class="insp-sec-title">AI Skill 挂载</div>
            <el-form label-position="top" size="small">
              <el-form-item label="挂载 AI Skill">
                <el-select v-model="selectedNodeData.aiSkill" style="width:100%" clearable placeholder="无">
                  <el-option label="standard-match v1.2" value="standard-match" />
                  <el-option label="report-draft v2.0" value="report-draft" />
                  <el-option label="report-review v1.4" value="report-review" />
                  <el-option label="anomaly-detect v1.0" value="anomaly-detect" />
                  <el-option label="smart-schedule v0.8" value="smart-schedule" />
                </el-select>
              </el-form-item>
              <el-form-item label="Human Approval Required" v-if="selectedNodeData.aiSkill">
                <el-switch v-model="selectedNodeData.aiConfirm" />
              </el-form-item>
            </el-form>
          </div>

          <!-- Fail strategy -->
          <div class="insp-section">
            <div class="insp-sec-title">失败 / 超时策略</div>
            <el-form label-position="top" size="small">
              <el-form-item label="超时处理">
                <el-select v-model="selectedNodeData.failStrategy" style="width:100%">
                  <el-option label="上报上级" value="escalate" />
                  <el-option label="挂起等待" value="hold" />
                  <el-option label="跳过（仅警告）" value="skip" />
                </el-select>
              </el-form-item>
              <el-form-item label="Audit Policy">
                <el-select v-model="selectedNodeData.auditPolicy" style="width:100%">
                  <el-option label="全量审计" value="full" />
                  <el-option label="异常时审计" value="on-error" />
                  <el-option label="不审计" value="none" />
                </el-select>
              </el-form-item>
            </el-form>
          </div>
        </div>

        <div v-else class="insp-empty">
          <el-icon size="28" color="#D9DEE7"><Share /></el-icon>
          <div class="insp-empty-text">点击画布节点<br>查看与配置属性</div>
          <div class="insp-empty-hint">节点的 Executor 和 Renderer 来自 Node Type 注册表，不可在此修改</div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'

const activeScenario = ref('food')
const selectedNodeId = ref<number | null>(null)
const showMode = ref('swimlane')

const nodePalette = [
  {
    key: 'flow-control', label: '流程控制',
    nodes: [
      { typeKey: 'START', name: '开始', icon: 'VideoPlay', mode: 'FLOW' },
      { typeKey: 'END', name: '结束', icon: 'VideoPause', mode: 'FLOW' },
      { typeKey: 'GATEWAY_CONDITION', name: '条件网关', icon: 'Share', mode: 'FLOW' },
      { typeKey: 'GATEWAY_PARALLEL', name: '并行网关', icon: 'Connection', mode: 'FLOW' },
      { typeKey: 'TIMER', name: '定时器', icon: 'Timer', mode: 'FLOW' },
    ]
  },
  {
    key: 'lab', label: '实验室通用',
    nodes: [
      { typeKey: 'REQUEST_ACCEPTANCE', name: '委托受理', icon: 'Document', mode: 'HUMAN_TASK' },
      { typeKey: 'SAMPLE_RECEIPT', name: '收样', icon: 'Box', mode: 'HUMAN_TASK' },
      { typeKey: 'SAMPLE_PREPARATION', name: '样品前处理', icon: 'Operation', mode: 'HUMAN_TASK' },
      { typeKey: 'LAB_TEST_EXECUTION', name: '实验室检测', icon: 'Monitor', mode: 'HUMAN_TASK' },
      { typeKey: 'TECHNICAL_REVIEW', name: '技术审核', icon: 'Finished', mode: 'HUMAN_TASK' },
      { typeKey: 'REPORT_GENERATION', name: '报告生成', icon: 'Printer', mode: 'SERVICE_TASK' },
      { typeKey: 'REPORT_REVIEW', name: '报告审核', icon: 'Reading', mode: 'HUMAN_TASK' },
      { typeKey: 'REPORT_RELEASE', name: '报告签发', icon: 'Upload', mode: 'HUMAN_TASK' },
    ]
  },
  {
    key: 'field', label: '现场作业',
    nodes: [
      { typeKey: 'SAMPLING_PLAN', name: '采样方案', icon: 'Calendar', mode: 'HUMAN_TASK' },
      { typeKey: 'FIELD_SAMPLING', name: '现场采样', icon: 'Location', mode: 'HUMAN_TASK' },
      { typeKey: 'ONSITE_INSPECTION', name: '客户现场检测', icon: 'Aim', mode: 'HUMAN_TASK' },
    ]
  },
  {
    key: 'specialized', label: '专业检测',
    nodes: [
      { typeKey: 'METROLOGY_MEASUREMENT', name: '几何量测量', icon: 'Aim', mode: 'HUMAN_TASK' },
      { typeKey: 'INSTRUMENT_DATA_COLLECT', name: '仪器数据采集', icon: 'DataLine', mode: 'SERVICE_TASK' },
    ]
  },
  {
    key: 'auto', label: '自动化',
    nodes: [
      { typeKey: 'RULE_NODE', name: 'Rule Node', icon: 'Setting', mode: 'RULE_TASK' },
      { typeKey: 'AI_NODE', name: 'AI Node', icon: 'MagicStick', mode: 'AI_TASK' },
      { typeKey: 'INTEGRATION_NODE', name: 'Integration Node', icon: 'Connection', mode: 'SERVICE_TASK' },
    ]
  },
]

const flowLanes = ref([
  {
    id: 1, label: '业务链路', color: 'blue',
    nodes: [
      {
        id: 1, name: '委托受理', typeKey: 'REQUEST_ACCEPTANCE', mode: 'HUMAN_TASK',
        icon: 'Document', executor: 'requestAcceptanceExecutor', configRenderer: 'request-acceptance-config',
        renderer: 'request-acceptance-workbench', module: 'capability-lab-core',
        sla: '4h', role: 'acceptor', entryCondition: '', exitCondition: '委托方信息完整 && 检测项已确认',
        aiSkill: 'standard-match', aiConfirm: true, failStrategy: 'escalate', auditPolicy: 'full',
        specificConfig: [
          { key: 'requireClientSign', label: '要求客户签字确认', type: 'Boolean', value: true },
        ]
      },
      {
        id: 2, name: '收样', typeKey: 'SAMPLE_RECEIPT', mode: 'HUMAN_TASK',
        icon: 'Box', executor: 'sampleReceiptExecutor', configRenderer: 'sample-receipt-config',
        renderer: 'sample-receipt-workbench', module: 'capability-lab-core',
        sla: '2h', role: 'receiver', entryCondition: '', exitCondition: '样品编号已登记 && 条形码已打印',
        aiSkill: null, aiConfirm: false, failStrategy: 'hold', auditPolicy: 'full',
        specificConfig: [
          { key: 'requireBarcode', label: '必须扫码入库', type: 'Boolean', value: true },
          { key: 'storageTemp', label: '样品存储要求', type: 'Enum', value: '0~4°C 冷藏', options: ['常温', '0~4°C 冷藏', '-20°C 冷冻', '避光'] },
        ]
      },
    ]
  },
  {
    id: 2, label: '专业检测', color: 'green',
    nodes: [
      {
        id: 3, name: '样品前处理', typeKey: 'SAMPLE_PREPARATION', mode: 'HUMAN_TASK',
        icon: 'Operation', executor: 'samplePrepExecutor', configRenderer: 'sample-prep-config',
        renderer: 'sample-prep-workbench', module: 'capability-lab-core',
        sla: '4h', role: 'lab-l1', entryCondition: '收样完成', exitCondition: '前处理记录已提交',
        aiSkill: null, aiConfirm: false, failStrategy: 'hold', auditPolicy: 'on-error',
        specificConfig: []
      },
      {
        id: 4, name: '实验室检测', typeKey: 'LAB_TEST_EXECUTION', mode: 'HUMAN_TASK',
        icon: 'Monitor', executor: 'labTestExecutor', configRenderer: 'lab-test-config',
        renderer: 'lab-test-workbench', module: 'capability-lab-core',
        sla: '2d', role: 'lab-l2', entryCondition: '前处理完成', exitCondition: '所有检测项结果已录入',
        aiSkill: 'anomaly-detect', aiConfirm: false, failStrategy: 'hold', auditPolicy: 'full',
        specificConfig: [
          { key: 'requireEquipCalib', label: '要求设备校准有效', type: 'Boolean', value: true },
        ]
      },
    ]
  },
  {
    id: 3, label: '审核与签发', color: 'orange',
    nodes: [
      {
        id: 5, name: '技术审核', typeKey: 'TECHNICAL_REVIEW', mode: 'HUMAN_TASK',
        icon: 'Finished', executor: 'technicalReviewExecutor', configRenderer: 'tech-review-config',
        renderer: 'review-center-workbench', module: 'capability-review',
        sla: '8h', role: 'tech-lead', entryCondition: '检测完成', exitCondition: '审核结论已提交',
        aiSkill: 'report-review', aiConfirm: true, failStrategy: 'escalate', auditPolicy: 'full',
        specificConfig: [
          { key: 'requireAIAssist', label: '启用 AI 审核辅助', type: 'Boolean', value: true },
          { key: 'minReviewerLevel', label: '最低审核人等级', type: 'Enum', value: 'L3', options: ['L2', 'L3', 'L4', '技术负责人'] },
        ]
      },
      {
        id: 6, name: '报告生成', typeKey: 'REPORT_GENERATION', mode: 'SERVICE_TASK',
        icon: 'Printer', executor: 'reportGenerationExecutor', configRenderer: 'report-gen-config',
        renderer: null, module: 'capability-report',
        sla: '0.5h', role: '', entryCondition: '技术审核通过', exitCondition: '报告草稿生成完毕',
        aiSkill: 'report-draft', aiConfirm: true, failStrategy: 'escalate', auditPolicy: 'full',
        specificConfig: [
          { key: 'autoPopulate', label: '自动填充检测数据', type: 'Boolean', value: true },
        ]
      },
      {
        id: 7, name: '报告签发', typeKey: 'REPORT_RELEASE', mode: 'HUMAN_TASK',
        icon: 'Upload', executor: 'reportReleaseExecutor', configRenderer: 'report-release-config',
        renderer: 'report-release-workbench', module: 'capability-review',
        sla: '2h', role: 'auth-signer', entryCondition: '报告草稿已生成', exitCondition: '授权签字完成',
        aiSkill: null, aiConfirm: false, failStrategy: 'escalate', auditPolicy: 'full',
        specificConfig: []
      },
    ]
  },
])

const selectedNodeData = computed(() => {
  if (selectedNodeId.value === null) return null
  for (const lane of flowLanes.value) {
    const n = lane.nodes.find(n => n.id === selectedNodeId.value)
    if (n) return n
  }
  return null
})

function selectNode(node: any) { selectedNodeId.value = node.id }

function modeLabel(mode: string) {
  const m: Record<string, string> = {
    HUMAN_TASK: 'Human', SERVICE_TASK: 'Service', AI_TASK: 'AI', RULE_TASK: 'Rule', FLOW: 'Flow'
  }
  return m[mode] || mode
}

function modeClass(mode: string) {
  const m: Record<string, string> = {
    HUMAN_TASK: 'human', SERVICE_TASK: 'service', AI_TASK: 'ai', RULE_TASK: 'rule', FLOW: 'flow'
  }
  return m[mode] || ''
}
</script>
<style scoped>
.builder-shell { display: flex; flex-direction: column; height: 100%; overflow: hidden; background: #F5F7FA; }

.builder-header {
  background: #fff; border-bottom: 1px solid #D9DEE7;
  padding: 8px 20px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
}
.bh-left { display: flex; flex-direction: column; gap: 3px; }
.bh-context { display: flex; align-items: center; gap: 8px; }
.bh-scene-label { font-size: 12px; color: #8A96A6; }
.bh-sep { color: #D9DEE7; }
.bh-ver { font-size: 11px; padding: 1px 7px; border-radius: 3px; font-family: monospace; font-weight: 500; }
.bh-ver.draft { background: #FFF3E0; color: #A9650A; border: 1px solid #FFD591; }
.bh-title { font-size: 15px; font-weight: 600; color: #0B1220; }
.bh-subtitle { font-size: 13px; font-weight: 400; color: #8A96A6; margin-left: 6px; }
.bh-actions { display: flex; gap: 6px; }

.builder-body { display: flex; flex: 1; overflow: hidden; }

/* Palette */
.palette {
  width: 240px; background: #fff; border-right: 1px solid #D9DEE7;
  overflow-y: auto; flex-shrink: 0; padding: 10px 0;
}
.palette-header { font-size: 11px; font-weight: 600; color: #526075; padding: 0 12px 8px; text-transform: uppercase; letter-spacing: 0.5px; display: flex; justify-content: space-between; align-items: center; }
.palette-hint { font-size: 10px; color: #B0B9C6; font-weight: 400; text-transform: none; letter-spacing: 0; }
.palette-group { margin-bottom: 12px; }
.pg-label { font-size: 10px; color: #B0B9C6; padding: 4px 12px 4px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500; }
.palette-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 12px; cursor: grab; margin: 0 6px; border-radius: 3px;
}
.palette-item:hover { background: #F5F7FA; }
.pi-left { display: flex; align-items: center; gap: 7px; flex: 1; min-width: 0; }
.pi-text { flex: 1; min-width: 0; }
.pi-name { font-size: 12px; color: #0B1220; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pi-key { font-size: 10px; font-family: monospace; color: #B0B9C6; }

/* Mode badges (shared) */
.fn-mode-badge, .pi-mode {
  font-size: 9px; padding: 1px 5px; border-radius: 2px; font-weight: 600;
  white-space: nowrap; flex-shrink: 0;
}
.fn-mode-badge.HUMAN_TASK, .pi-mode.human { background: #EDF4FF; color: #1677FF; }
.fn-mode-badge.SERVICE_TASK, .pi-mode.service { background: #F0FFF4; color: #18794E; }
.fn-mode-badge.AI_TASK, .pi-mode.ai { background: #F5F0FF; color: #526075; }
.fn-mode-badge.RULE_TASK, .pi-mode.rule { background: #FFF3E0; color: #A9650A; }
.fn-mode-badge.FLOW, .pi-mode.flow { background: #F5F7FA; color: #8A96A6; }

/* Canvas */
.canvas-area { flex: 1; display: flex; flex-direction: column; background: #F0F2F5; overflow: hidden; position: relative; }
.canvas-toolbar {
  height: 38px; background: #fff; border-bottom: 1px solid #D9DEE7;
  display: flex; align-items: center; justify-content: space-between; padding: 0 14px; flex-shrink: 0;
}
.ct-left { display: flex; align-items: center; gap: 10px; }
.ct-right { font-size: 11px; color: #B0B9C6; display: flex; align-items: center; gap: 4px; }
.ct-note { display: flex; align-items: center; gap: 4px; }
.canvas-scroll { flex: 1; overflow: auto; padding: 28px 32px; }
.swimlane-canvas { display: flex; flex-direction: column; gap: 0; min-width: 900px; }

.flow-row { display: flex; align-items: center; padding: 0 0 12px 0; }
.end-row { padding-top: 12px; padding-bottom: 0; }
.flow-arrow { color: #B0B9C6; display: flex; align-items: center; padding: 0 4px; }
.start-end-node { display: flex; align-items: center; }
.se-circle {
  width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center;
  justify-content: center; font-size: 9px; font-weight: 700; letter-spacing: 0.3px;
}
.se-circle.start { background: #1677FF; color: #fff; }
.se-circle.end { background: #0B1220; color: #fff; }

.swimlane { display: flex; border-left: 3px solid #E7EAF0; margin-left: 20px; margin-bottom: 4px; }
.sl-label-col { width: 120px; flex-shrink: 0; padding: 14px 10px 14px 12px; border-right: 1px solid #E7EAF0; }
.sl-label { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; color: #526075; text-transform: uppercase; letter-spacing: 0.5px; }
.sl-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.sl-dot.blue { background: #1677FF; }
.sl-dot.green { background: #18794E; }
.sl-dot.orange { background: #A9650A; }
.sl-nodes { display: flex; align-items: center; gap: 0; padding: 12px 16px; flex-wrap: wrap; }
.node-arrow { padding: 0 6px; color: #B0B9C6; display: flex; align-items: center; }

/* Canvas nodes */
.flow-node {
  width: 120px; min-height: 80px; border: 1.5px solid #D9DEE7; border-radius: 4px;
  background: #fff; padding: 9px 10px; cursor: pointer; display: flex; flex-direction: column;
  gap: 4px; transition: border-color 0.12s;
}
.flow-node:hover { border-color: #1677FF; }
.flow-node.selected { border-color: #1677FF; box-shadow: 0 0 0 3px rgba(22, 119, 255, 0.12); }
.flow-node.mode-HUMAN_TASK { border-top: 3px solid #1677FF; }
.flow-node.mode-SERVICE_TASK { border-top: 3px solid #18794E; }
.flow-node.mode-AI_TASK { border-top: 3px solid #526075; }
.flow-node.mode-RULE_TASK { border-top: 3px solid #A9650A; }
.fn-top { display: flex; align-items: center; justify-content: space-between; }
.fn-name { font-size: 12px; font-weight: 600; color: #0B1220; line-height: 1.3; }
.fn-type { font-size: 9px; font-family: monospace; color: #B0B9C6; }
.fn-bottom { display: flex; align-items: center; justify-content: space-between; margin-top: auto; }
.fn-sla { font-size: 10px; color: #8A96A6; background: #F5F7FA; padding: 1px 4px; border-radius: 2px; }
.fn-ai-dot { display: flex; align-items: center; }

/* Inspector */
.inspector {
  width: 300px; background: #fff; border-left: 1px solid #D9DEE7;
  overflow-y: auto; flex-shrink: 0;
}
.insp-content { padding: 0; }
.insp-section {
  padding: 14px 16px; border-bottom: 1px solid #E7EAF0;
}
.insp-section:last-child { border-bottom: none; }
.identity-section { background: #F8FAFB; }
.insp-node-name { font-size: 15px; font-weight: 600; color: #0B1220; margin-bottom: 6px; }
.insp-type-row { display: flex; align-items: center; gap: 8px; }
.insp-type-key { font-size: 11px; font-family: monospace; color: #526075; }
.insp-sec-title {
  font-size: 11px; font-weight: 600; color: #526075; text-transform: uppercase;
  letter-spacing: 0.5px; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;
}
.readonly-badge { font-size: 9px; color: #B0B9C6; background: #F5F7FA; padding: 1px 5px; border-radius: 2px; text-transform: none; letter-spacing: 0; font-weight: 400; }
.insp-kv { display: flex; align-items: flex-start; gap: 0; margin-bottom: 6px; }
.ik { width: 110px; font-size: 11px; color: #8A96A6; flex-shrink: 0; padding-top: 2px; }
.iv { font-size: 12px; color: #0B1220; flex: 1; }
.iv.mono { font-family: monospace; font-size: 10px; }
.iv.muted { color: #8A96A6; }
.renderer-link { color: #1677FF; cursor: pointer; }
.renderer-link:hover { text-decoration: underline; }

.insp-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 40px 20px; text-align: center; height: 100%;
}
.insp-empty-text { font-size: 13px; color: #8A96A6; margin: 12px 0 8px; line-height: 1.6; }
.insp-empty-hint { font-size: 11px; color: #B0B9C6; line-height: 1.5; }
</style>
