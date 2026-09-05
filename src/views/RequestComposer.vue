<template>
  <div class="composer-shell">
    <section v-if="stage === 'select'" class="scenario-select-page">
      <div class="page-header">
        <div>
          <h1>新建委托 / 申请</h1>
          <p>先选择一个已发布且已激活的场景。场景版本决定后续表单、对象模型、检测项与运行流程。</p>
        </div>
      </div>

      <div class="catalog-layout">
        <div class="catalog-main">
          <div class="filter-bar">
            <el-input v-model="search" placeholder="搜索场景名称 / Key" clearable size="small" style="width: 260px" prefix-icon="Search" />
            <el-select v-model="domainFilter" placeholder="领域" clearable size="small" style="width: 150px">
              <el-option label="食品检测" value="食品检测" />
              <el-option label="环境检测" value="环境检测" />
              <el-option label="几何量" value="几何量" />
            </el-select>
            <el-select v-model="modeFilter" placeholder="业务模式" clearable size="small" style="width: 160px">
              <el-option label="第三方委托" value="第三方委托" />
              <el-option label="企业内部" value="企业内部" />
            </el-select>
          </div>

          <div class="scenario-table">
            <div class="scenario-header scenario-grid">
              <span></span><span>场景</span><span>版本</span><span>业务模式</span><span>领域</span><span>激活范围</span><span>状态</span>
            </div>
            <button
              v-for="scene in filteredScenes"
              :key="scene.id"
              :class="['scenario-row', 'scenario-grid', { selected: selectedScene?.id === scene.id }]"
              @click="selectedScene = scene"
            >
              <span class="radio-mark"><span v-if="selectedScene?.id === scene.id"></span></span>
              <span class="scene-identity"><strong>{{ scene.name }}</strong><span>{{ scene.key }}</span></span>
              <span class="version-token">{{ scene.version }}</span>
              <span>{{ scene.mode }}</span>
              <span>{{ scene.domain }}</span>
              <span>{{ scene.activationScope }}</span>
              <span class="state-ok"><el-icon><CircleCheck /></el-icon>可用</span>
            </button>
          </div>
        </div>

        <aside class="scenario-inspector">
          <template v-if="selectedScene">
            <div class="inspector-title">场景快照</div>
            <h2>{{ selectedScene.name }}</h2>
            <div class="inspector-key">{{ selectedScene.key }}</div>
            <div class="snapshot-kv"><span>Published Version</span><strong>{{ selectedScene.version }}</strong></div>
            <div class="snapshot-kv"><span>Snapshot Hash</span><strong class="mono">sha256:{{ selectedScene.hash }}</strong></div>
            <div class="snapshot-kv"><span>检测项</span><strong>{{ selectedScene.testItems.length }} 项</strong></div>
            <div class="snapshot-kv"><span>流程版本</span><strong>{{ selectedScene.workflowVersion }}</strong></div>
            <div class="snapshot-kv"><span>运行步骤</span><strong>{{ selectedScene.runtimeSteps.length }} 步</strong></div>
            <div class="inspector-divider"></div>
            <div class="inspector-label">运行流程</div>
            <div class="runtime-sequence">
              <template v-for="(node, index) in selectedScene.runtimeSteps" :key="node">
                <span>{{ node }}</span><el-icon v-if="index < selectedScene.runtimeSteps.length - 1"><ArrowRight /></el-icon>
              </template>
            </div>
            <div class="snapshot-note"><el-icon><Lock /></el-icon>提交后将把该 Scenario Snapshot 绑定到业务记录，后续新版本不会影响本次委托。</div>
          </template>
          <div v-else class="inspector-empty">请选择一个场景查看快照信息。</div>
        </aside>
      </div>

      <div class="bottom-actions">
        <el-button @click="router.back()">取消</el-button>
        <el-button type="primary" :disabled="!selectedScene" @click="startRequest">使用此场景</el-button>
      </div>
    </section>

    <section v-else class="request-workspace">
      <header class="context-header">
        <div class="context-left">
          <button class="back-button" @click="stage = 'select'"><el-icon><ArrowLeft /></el-icon></button>
          <div>
            <div class="context-line"><span class="context-label">场景</span><strong>{{ selectedScene?.name }}</strong><span class="version-token">{{ selectedScene?.version }}</span><span class="readonly-state"><el-icon><Lock /></el-icon>Snapshot locked</span></div>
            <div class="context-sub">{{ selectedScene?.key }} · sha256:{{ selectedScene?.hash }} · Workflow {{ selectedScene?.workflowVersion }}</div>
          </div>
        </div>
        <div class="context-actions"><el-button size="small">保存草稿</el-button><el-button type="primary" size="small" :disabled="currentStep !== wizardSteps.length" @click="submitRequest">提交</el-button></div>
      </header>

      <div class="wizard-layout">
        <aside class="wizard-steps">
          <div class="steps-title">委托配置</div>
          <button v-for="(step, index) in wizardSteps" :key="step.key" :class="['wizard-step', { active: currentStep === index + 1, done: currentStep > index + 1 }]" @click="currentStep > index + 1 && (currentStep = index + 1)">
            <span class="step-index"><el-icon v-if="currentStep > index + 1"><Check /></el-icon><span v-else>{{ index + 1 }}</span></span>
            <span><strong>{{ step.name }}</strong><small>{{ step.source }}</small></span>
          </button>
          <div class="steps-note">向导来自当前场景的 runtime.request.setup 配置，通用前端不硬编码 Food / Environment / Metrology 字段。</div>
        </aside>

        <main class="wizard-main">
          <div v-if="currentStep === 1" class="wizard-section">
            <div class="section-head"><div><h2>委托基本信息</h2><p>由 <span class="mono-inline">{{ selectedScene?.requestSchema }}</span> 渲染。</p></div></div>
            <div class="schema-form">
              <el-form label-position="top" size="small">
                <div class="form-grid">
                  <el-form-item v-for="field in selectedScene?.requestFields" :key="field.key" :label="field.label" :required="field.required" :class="{ 'span-2': field.span === 2 }">
                    <el-input v-if="field.type === 'text'" v-model="requestData[field.key]" :placeholder="field.placeholder || ''" />
                    <el-input v-else-if="field.type === 'textarea'" v-model="requestData[field.key]" type="textarea" :rows="3" :placeholder="field.placeholder || ''" />
                    <el-select v-else-if="field.type === 'select'" v-model="requestData[field.key]" style="width:100%" placeholder="请选择"><el-option v-for="option in field.options" :key="option" :label="option" :value="option" /></el-select>
                    <el-date-picker v-else-if="field.type === 'date'" v-model="requestData[field.key]" type="date" style="width:100%" placeholder="选择日期" />
                  </el-form-item>
                </div>
              </el-form>
            </div>
          </div>

          <div v-else-if="currentStep === 2" class="wizard-section">
            <div class="section-head"><div><h2>{{ selectedScene?.subjectLabel }}</h2><p>对象结构来自 <span class="mono-inline">{{ selectedScene?.subjectSchema }}</span>。</p></div><el-button type="primary" size="small" @click="addSubject">添加对象</el-button></div>
            <el-table :data="subjects" border size="small">
              <el-table-column type="index" label="#" width="45" />
              <el-table-column v-for="field in selectedScene?.subjectFields" :key="field.key" :label="field.label" :min-width="field.width || 130">
                <template #default="{ row }">
                  <el-input v-if="field.type === 'text'" v-model="row[field.key]" size="small" :placeholder="field.placeholder || ''" />
                  <el-select v-else v-model="row[field.key]" size="small" style="width:100%" placeholder="请选择"><el-option v-for="option in field.options" :key="option" :label="option" :value="option" /></el-select>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="70"><template #default="{ $index }"><el-button link type="danger" size="small" @click="subjects.splice($index,1)">删除</el-button></template></el-table-column>
            </el-table>
          </div>

          <div v-else-if="currentStep === 3" class="wizard-section">
            <div class="section-head"><div><h2>检测项</h2><p>只展示当前 Scenario Snapshot 已发布的能力，标准、方法与限值版本不可在委托时随意替换。</p></div></div>
            <el-table :data="selectedScene?.testItems || []" border size="small" @selection-change="selectedItems = $event">
              <el-table-column type="selection" width="44" />
              <el-table-column prop="name" label="检测项" min-width="130"><template #default="{ row }"><strong>{{ row.name }}</strong><div class="mono-sub">{{ row.code }}</div></template></el-table-column>
              <el-table-column label="标准版本" min-width="170"><template #default="{ row }"><span class="reference-token">{{ row.standard }}</span></template></el-table-column>
              <el-table-column label="方法版本" min-width="160"><template #default="{ row }"><span class="reference-token">{{ row.method }}</span></template></el-table-column>
              <el-table-column label="限值规则" min-width="150"><template #default="{ row }"><span class="reference-token">{{ row.limit }}</span></template></el-table-column>
            </el-table>
            <div class="table-help">默认按场景预选常用检测项；用户只能在已发布能力范围内选择。</div>
          </div>

          <div v-else class="wizard-section">
            <div class="section-head"><div><h2>确认并启动流程</h2><p>提交后创建 TestRequest，并基于锁定的 Scenario Snapshot 创建 Process Instance。</p></div></div>
            <div class="confirm-grid">
              <div class="confirm-block"><span>场景</span><strong>{{ selectedScene?.name }} {{ selectedScene?.version }}</strong><small>{{ selectedScene?.key }}</small></div>
              <div class="confirm-block"><span>Snapshot</span><strong class="mono">sha256:{{ selectedScene?.hash }}</strong><small>不可变</small></div>
              <div class="confirm-block"><span>检测对象</span><strong>{{ subjects.length }} 个</strong><small>{{ selectedScene?.subjectLabel }}</small></div>
              <div class="confirm-block"><span>检测项</span><strong>{{ selectedItems.length || selectedScene?.testItems.length }} 项</strong><small>版本已锁定</small></div>
            </div>
            <div class="process-preview">
              <div class="preview-title">将启动的运行流程</div>
              <div class="process-nodes"><template v-for="(node,index) in selectedScene?.runtimeSteps" :key="node"><div class="process-node"><span>{{ index + 1 }}</span><strong>{{ node }}</strong></div><el-icon v-if="index < (selectedScene?.runtimeSteps.length || 0)-1"><ArrowRight /></el-icon></template></div>
            </div>
            <div class="submit-note"><el-icon><InfoFilled /></el-icon>运行时每个节点将通过 Node Type Registry 解析 Executor 与 Runtime Renderer；人工任务进入“我的工作”。</div>
          </div>

          <div class="wizard-actions">
            <el-button @click="currentStep === 1 ? stage = 'select' : currentStep--">上一步</el-button>
            <el-button v-if="currentStep < wizardSteps.length" type="primary" @click="currentStep++">下一步</el-button>
            <el-button v-else type="primary" @click="submitRequest">提交并启动流程</el-button>
          </div>
        </main>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const stage = ref<'select' | 'wizard'>('select')
const currentStep = ref(1)
const search = ref('')
const domainFilter = ref('')
const modeFilter = ref('')
const selectedScene = ref<any>(null)
const requestData = reactive<Record<string, any>>({})
const subjects = ref<any[]>([])
const selectedItems = ref<any[]>([])

const publishedScenes = ref([
  {
    id: 1, name: '第三方食品理化检测', key: 'third-party-food-physchem', version: 'v1.2.0', hash: '7fa3c2d9', mode: '第三方委托', domain: '食品检测', activationScope: '华东食品实验室', workflowVersion: 'food-flow v1.4',
    requestSchema: 'third-party-request-intake · v3', subjectSchema: 'food-sample-intake · v3', subjectLabel: '食品样品',
    requestFields: [
      { key: 'customer', label: '委托方名称', type: 'text', required: true, placeholder: '请输入委托方全称' },
      { key: 'contact', label: '联系人', type: 'text', required: true },
      { key: 'purpose', label: '检测目的', type: 'select', required: true, options: ['合规检测', '出口认证', '研发验证', '纠纷仲裁'] },
      { key: 'dueDate', label: '期望完成日期', type: 'date', required: true },
      { key: 'requirements', label: '特殊要求', type: 'textarea', span: 2, placeholder: '可选：报告语言、交付方式、特殊检测要求等' },
    ],
    subjectFields: [
      { key: 'name', label: '样品名称', type: 'text', width: 160 },
      { key: 'category', label: '食品类别', type: 'select', options: ['粮食及制品', '肉及肉制品', '水产品', '蔬菜', '饮料'], width: 150 },
      { key: 'batch', label: '批次 / Lot', type: 'text', width: 130 },
      { key: 'quantity', label: '数量', type: 'text', width: 90 },
    ],
    testItems: [
      { code: 'FOOD.PB', name: '铅 Pb', standard: 'GB 5009.12-2023', method: 'ICP-MS Pb v2.1', limit: 'Food Pb Limit v3' },
      { code: 'FOOD.CD', name: '镉 Cd', standard: 'GB 5009.15-2023', method: 'ICP-MS Cd v2.0', limit: 'Food Cd Limit v2' },
      { code: 'FOOD.MOISTURE', name: '水分', standard: 'GB 5009.3-2016', method: 'Drying v3', limit: 'Product Spec v5' },
    ],
    runtimeSteps: ['委托受理', '收样', '样品前处理', '实验室检测', '技术审核', '报告签发'],
  },
  {
    id: 2, name: '环境水质现场监测', key: 'environment-water-field', version: 'v2.0.1', hash: 'c3d45fe8', mode: '第三方委托', domain: '环境检测', activationScope: '深圳综合实验室', workflowVersion: 'env-field-flow v2.3',
    requestSchema: 'environment-project-request · v2', subjectSchema: 'sampling-point · v4', subjectLabel: '采样点位',
    requestFields: [
      { key: 'customer', label: '委托单位', type: 'text', required: true },
      { key: 'project', label: '监测项目', type: 'text', required: true },
      { key: 'monitoringType', label: '监测类型', type: 'select', required: true, options: ['地表水', '地下水', '工业废水', '生活污水'] },
      { key: 'dueDate', label: '计划完成日期', type: 'date', required: true },
      { key: 'requirements', label: '现场要求', type: 'textarea', span: 2 },
    ],
    subjectFields: [
      { key: 'pointCode', label: '点位编号', type: 'text', width: 120 },
      { key: 'pointName', label: '点位名称', type: 'text', width: 160 },
      { key: 'pointType', label: '点位类型', type: 'select', options: ['地表水', '地下水', '排放口'], width: 130 },
      { key: 'location', label: '位置描述', type: 'text', width: 180 },
    ],
    testItems: [
      { code: 'ENV.COD', name: 'COD', standard: 'HJ 828-2017', method: 'Dichromate v2', limit: 'Discharge COD v4' },
      { code: 'ENV.NH3N', name: '氨氮', standard: 'HJ 535-2009', method: 'Nessler v2', limit: 'Discharge NH3N v3' },
    ],
    runtimeSteps: ['监测方案', '现场采样', '样品运输', '实验室接收', '实验室检测', '技术审核', '报告签发'],
  },
  {
    id: 3, name: '企业内部几何量检测', key: 'internal-metrology', version: 'v2.1.0', hash: 'e9f01ac4', mode: '企业内部', domain: '几何量', activationScope: '北京计量实验室', workflowVersion: 'metrology-flow v2.1',
    requestSchema: 'internal-metrology-request · v2', subjectSchema: 'metrology-part · v3', subjectLabel: '零件 / Part',
    requestFields: [
      { key: 'department', label: '申请部门', type: 'text', required: true },
      { key: 'source', label: '来源业务', type: 'select', required: true, options: ['来料检验', '过程检验', '成品检验', '研发试验'] },
      { key: 'workOrder', label: '工单 / 项目号', type: 'text' },
      { key: 'dueDate', label: '要求完成日期', type: 'date', required: true },
      { key: 'requirements', label: '测量要求', type: 'textarea', span: 2 },
    ],
    subjectFields: [
      { key: 'partNo', label: '零件号', type: 'text', width: 130 },
      { key: 'partName', label: '零件名称', type: 'text', width: 160 },
      { key: 'serial', label: '序列号', type: 'text', width: 130 },
      { key: 'drawing', label: '图纸版本', type: 'text', width: 110 },
    ],
    testItems: [
      { code: 'MET.DIAMETER', name: '孔径', standard: 'Drawing Rev.C', method: 'CMM Dimension v4', limit: 'Tolerance Profile v7' },
      { code: 'MET.FLATNESS', name: '平面度', standard: 'ISO 1101:2017', method: 'CMM GD&T v3', limit: 'Drawing Tolerance v5' },
    ],
    runtimeSteps: ['内部申请', '任务策划', 'CMM 测量', '结果判定', '技术审核', '结果回写'],
  },
])

const filteredScenes = computed(() => publishedScenes.value.filter(scene => {
  const text = `${scene.name} ${scene.key}`.toLowerCase()
  return (!search.value || text.includes(search.value.toLowerCase())) && (!domainFilter.value || scene.domain === domainFilter.value) && (!modeFilter.value || scene.mode === modeFilter.value)
}))

const wizardSteps = computed(() => [
  { key: 'request', name: '基本信息', source: selectedScene.value?.requestSchema || '' },
  { key: 'subject', name: selectedScene.value?.subjectLabel || '检测对象', source: selectedScene.value?.subjectSchema || '' },
  { key: 'items', name: '检测项', source: 'Scenario Snapshot' },
  { key: 'confirm', name: '确认与启动', source: 'Process Runtime' },
])

function startRequest() {
  if (!selectedScene.value) return
  stage.value = 'wizard'
  currentStep.value = 1
  subjects.value = [{}]
  selectedItems.value = [...selectedScene.value.testItems]
}
function addSubject() { subjects.value.push({}) }
function submitRequest() { router.push('/app/operations/my-work') }
</script>

<style scoped>
.composer-shell { min-height: 100%; color: var(--ui-text); }
.scenario-select-page, .request-workspace { min-height: 100%; }
.scenario-select-page { padding: 24px 28px 90px; }
.page-header { margin-bottom: 18px; }
.page-header h1 { margin: 0; font-size: 20px; font-weight: 600; }
.page-header p { margin: 5px 0 0; color: var(--ui-text-secondary); font-size: 12px; }
.catalog-layout { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 16px; align-items: start; }
.catalog-main, .scenario-inspector { background: var(--ui-surface); border: 1px solid var(--ui-border); border-radius: var(--ui-radius-panel); }
.filter-bar { height: 52px; padding: 9px 12px; display: flex; gap: 8px; align-items: center; border-bottom: 1px solid var(--ui-border); }
.scenario-table { overflow: hidden; }
.scenario-grid { display: grid; grid-template-columns: 28px minmax(200px, 1.6fr) 90px 110px 90px minmax(130px,1fr) 78px; gap: 10px; align-items: center; }
.scenario-header { padding: 9px 12px; background: var(--ui-surface-muted); color: var(--ui-text-secondary); font-size: 12px; border-bottom: 1px solid var(--ui-border); }
.scenario-row { width: 100%; border: 0; border-bottom: 1px solid var(--ui-border-subtle); background: var(--ui-surface); padding: 11px 12px; text-align: left; color: var(--ui-text-secondary); font: inherit; font-size: 12px; cursor: pointer; }
.scenario-row:hover { background: var(--ui-surface-muted); }.scenario-row.selected { background: var(--ui-selected-bg); }
.radio-mark { width: 16px; height: 16px; border: 1px solid var(--ui-border-control); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.radio-mark span { width: 8px; height: 8px; background: var(--ui-brand); border-radius: 50%; }
.scene-identity { display: flex; flex-direction: column; min-width: 0; color: var(--ui-text); }.scene-identity strong { font-size: 13px; font-weight: 500; }.scene-identity span { color: var(--ui-text-tertiary); font-family: var(--ui-font-mono); font-size: 10px; margin-top: 2px; }
.version-token, .reference-token { display: inline-block; width: fit-content; background: var(--ui-surface-muted); border: 1px solid var(--ui-border); border-radius: 3px; color: var(--ui-text-secondary); padding: 2px 6px; font-family: var(--ui-font-mono); font-size: 11px; white-space: nowrap; }
.state-ok { color: var(--ui-success); display: inline-flex; align-items: center; gap: 3px; font-size: 11px; }
.scenario-inspector { padding: 16px; position: sticky; top: 16px; }
.inspector-title, .inspector-label { color: var(--ui-text-tertiary); font-size: 11px; text-transform: uppercase; letter-spacing: .04em; }
.scenario-inspector h2 { margin: 8px 0 3px; font-size: 16px; }.inspector-key { font-family: var(--ui-font-mono); color: var(--ui-text-tertiary); font-size: 10px; margin-bottom: 14px; }
.snapshot-kv { display: grid; grid-template-columns: 110px minmax(0,1fr); gap: 8px; padding: 7px 0; border-bottom: 1px solid var(--ui-border-subtle); font-size: 12px; }.snapshot-kv span { color: var(--ui-text-tertiary); }.snapshot-kv strong { font-weight: 500; overflow-wrap: anywhere; }
.mono { font-family: var(--ui-font-mono); font-size: 11px; }.inspector-divider { height: 1px; background: var(--ui-border); margin: 14px 0; }
.runtime-sequence { display: flex; align-items: center; flex-wrap: wrap; gap: 5px; margin-top: 8px; font-size: 11px; color: var(--ui-text-secondary); }.runtime-sequence .el-icon { color: var(--ui-text-tertiary); }
.snapshot-note, .submit-note { margin-top: 14px; padding: 10px; background: var(--ui-surface-muted); border: 1px solid var(--ui-border-subtle); border-radius: 4px; color: var(--ui-text-secondary); font-size: 11px; line-height: 1.5; display: flex; gap: 6px; }
.inspector-empty { color: var(--ui-text-tertiary); font-size: 12px; padding: 40px 10px; text-align: center; }
.bottom-actions { position: fixed; left: 220px; right: 0; bottom: 0; min-height: 56px; padding: 10px 28px; background: var(--ui-surface); border-top: 1px solid var(--ui-border); display: flex; align-items: center; justify-content: flex-end; gap: 8px; z-index: 3; }
.context-header { min-height: 62px; background: var(--ui-surface); border-bottom: 1px solid var(--ui-border); display: flex; justify-content: space-between; align-items: center; padding: 9px 20px; position: sticky; top: 0; z-index: 4; }
.context-left, .context-line, .context-actions { display: flex; align-items: center; }.context-left { gap: 10px; }.context-line { gap: 8px; font-size: 13px; }.context-label { color: var(--ui-text-tertiary); font-size: 11px; }.context-sub { color: var(--ui-text-tertiary); font-family: var(--ui-font-mono); font-size: 10px; margin-top: 3px; }.context-actions { gap: 8px; }
.back-button { width: 28px; height: 28px; border: 1px solid var(--ui-border); border-radius: 4px; background: var(--ui-surface); color: var(--ui-text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center; }.readonly-state { display: inline-flex; gap: 3px; align-items: center; color: var(--ui-text-tertiary); font-size: 10px; }
.wizard-layout { display: grid; grid-template-columns: 220px minmax(0,1fr); min-height: calc(100vh - 110px); }.wizard-steps { background: var(--ui-surface); border-right: 1px solid var(--ui-border); padding: 16px 0; }.steps-title { padding: 0 16px 10px; font-size: 12px; font-weight: 600; }
.wizard-step { width: 100%; border: 0; border-left: 2px solid transparent; background: transparent; padding: 9px 14px; display: grid; grid-template-columns: 24px minmax(0,1fr); gap: 8px; text-align: left; cursor: pointer; color: var(--ui-text); }.wizard-step.active { background: var(--ui-selected-bg); border-left-color: var(--ui-brand); }.wizard-step.done .step-index { color: var(--ui-success); }.wizard-step strong { display: block; font-size: 12px; font-weight: 500; }.wizard-step small { display: block; color: var(--ui-text-tertiary); font-size: 9px; font-family: var(--ui-font-mono); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.step-index { width: 20px; height: 20px; border: 1px solid var(--ui-border); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; color: var(--ui-text-tertiary); }.steps-note { margin: 14px; padding: 10px; border-top: 1px solid var(--ui-border-subtle); color: var(--ui-text-tertiary); font-size: 10px; line-height: 1.5; }
.wizard-main { min-width: 0; padding: 24px 28px 80px; }.wizard-section { max-width: 980px; margin: 0 auto; }.section-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }.section-head h2 { margin: 0; font-size: 18px; }.section-head p { margin: 4px 0 0; color: var(--ui-text-secondary); font-size: 12px; }.mono-inline { font-family: var(--ui-font-mono); color: var(--ui-text-secondary); }
.schema-form { max-width: 760px; padding: 18px 20px; background: var(--ui-surface); border: 1px solid var(--ui-border); border-radius: var(--ui-radius-panel); }.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }.span-2 { grid-column: span 2; }
.mono-sub { font-family: var(--ui-font-mono); font-size: 10px; color: var(--ui-text-tertiary); margin-top: 2px; }.table-help { margin-top: 8px; color: var(--ui-text-tertiary); font-size: 11px; }
.confirm-grid { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); border: 1px solid var(--ui-border); border-radius: var(--ui-radius-panel); background: var(--ui-surface); overflow: hidden; }.confirm-block { padding: 14px; border-right: 1px solid var(--ui-border-subtle); display: flex; flex-direction: column; gap: 4px; }.confirm-block:last-child { border-right: 0; }.confirm-block > span { color: var(--ui-text-tertiary); font-size: 11px; }.confirm-block strong { font-size: 12px; font-weight: 500; }.confirm-block small { color: var(--ui-text-tertiary); font-size: 10px; }
.process-preview { margin-top: 14px; background: var(--ui-surface); border: 1px solid var(--ui-border); border-radius: var(--ui-radius-panel); padding: 14px; }.preview-title { font-size: 12px; font-weight: 600; margin-bottom: 12px; }.process-nodes { display: flex; align-items: center; gap: 7px; overflow-x: auto; }.process-node { min-width: 120px; border: 1px solid var(--ui-border); border-radius: 4px; padding: 9px; display: flex; flex-direction: column; gap: 3px; }.process-node span { color: var(--ui-text-tertiary); font-size: 9px; }.process-node strong { font-size: 11px; font-weight: 500; }.process-nodes > .el-icon { color: var(--ui-text-tertiary); flex: 0 0 auto; }
.wizard-actions { position: fixed; left: 440px; right: 0; bottom: 0; min-height: 56px; background: var(--ui-surface); border-top: 1px solid var(--ui-border); padding: 10px 28px; display: flex; justify-content: flex-end; gap: 8px; z-index: 3; }
@media (max-width: 1180px) { .catalog-layout { grid-template-columns: 1fr; }.scenario-inspector { position: static; }.scenario-grid { grid-template-columns: 28px minmax(180px,1.5fr) 80px 100px 90px 1fr; }.scenario-grid > :last-child { display:none; }.confirm-grid { grid-template-columns: 1fr 1fr; }.confirm-block:nth-child(2) { border-right:0; }.wizard-actions { left: 440px; } }
</style>
