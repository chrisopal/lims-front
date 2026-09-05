<template>
  <div class="page">
    <div class="page-header">
      <div>
        <div class="page-title">节点类型 Node Type Catalog</div>
        <div class="page-subtitle">平台能力注册表 · 面向平台管理员 / 产品工程师 · 只读查看</div>
      </div>
    </div>
    <div class="filter-bar">
      <el-input placeholder="Node Type / 中文名" style="width:220px" size="small" clearable prefix-icon="Search" />
      <el-select placeholder="类别" clearable size="small" style="width:130px">
        <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
      </el-select>
      <el-select placeholder="Execution Mode" clearable size="small" style="width:160px">
        <el-option label="HUMAN_TASK" value="HUMAN_TASK" />
        <el-option label="SERVICE_TASK" value="SERVICE_TASK" />
        <el-option label="AI_TASK" value="AI_TASK" />
        <el-option label="RULE_TASK" value="RULE_TASK" />
      </el-select>
      <el-select placeholder="状态" clearable size="small" style="width:110px">
        <el-option label="Active" value="active" />
        <el-option label="Deprecated" value="deprecated" />
      </el-select>
    </div>
    <div class="table-wrap">
      <el-table :data="nodeTypes" border size="small" @row-click="openDetail">
        <el-table-column label="Node Type" width="200">
          <template #default="{ row }">
            <span class="node-type-key">{{ row.key }}</span>
          </template>
        </el-table-column>
        <el-table-column label="中文名称" width="140" prop="name" />
        <el-table-column label="类别" width="110">
          <template #default="{ row }">
            <span :class="['cat-tag', catClass(row.category)]">{{ row.category }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Execution Mode" width="130">
          <template #default="{ row }">
            <span :class="['mode-tag', modeClass(row.mode)]">{{ row.mode }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Backend Executor" width="200" prop="executor" />
        <el-table-column label="Runtime Renderer" min-width="180" prop="renderer" />
        <el-table-column label="Source Module" width="180" prop="module" />
        <el-table-column label="Version" width="80">
          <template #default="{ row }">
            <span class="ver-mono">{{ row.version }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <span :class="['status-dot', row.status === 'Active' ? 'active' : 'dep']">{{ row.status }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Detail drawer -->
    <el-drawer v-model="drawerVisible" title="Node Type Descriptor" size="520px">
      <div v-if="selectedNode" class="descriptor-wrap">
        <div class="desc-key">{{ selectedNode.key }}</div>
        <div class="desc-name">{{ selectedNode.name }}</div>
        <el-divider />
        <div class="desc-section">
          <div class="desc-row"><span class="dk">类别</span><span class="dv">{{ selectedNode.category }}</span></div>
          <div class="desc-row"><span class="dk">Execution Mode</span><span class="dv mono">{{ selectedNode.mode }}</span></div>
          <div class="desc-row"><span class="dk">Backend Executor</span><span class="dv mono">{{ selectedNode.executor }}</span></div>
          <div class="desc-row"><span class="dk">Config Renderer</span><span class="dv mono">{{ selectedNode.configRenderer }}</span></div>
          <div class="desc-row"><span class="dk">Runtime Renderer</span><span class="dv mono">{{ selectedNode.renderer }}</span></div>
          <div class="desc-row"><span class="dk">Source Module</span><span class="dv mono">{{ selectedNode.module }}</span></div>
          <div class="desc-row"><span class="dk">Version</span><span class="dv mono">{{ selectedNode.version }}</span></div>
        </div>
        <el-divider />
        <div class="desc-subtitle">Inspector Config Schema</div>
        <div class="desc-config-list">
          <div v-for="f in selectedNode.configFields" :key="f.key" class="cfg-row">
            <span class="cfg-key mono">{{ f.key }}</span>
            <span class="cfg-type">{{ f.type }}</span>
            <span class="cfg-req" v-if="f.required">必填</span>
          </div>
        </div>
        <div class="desc-notice">注：Backend Executor 为平台注册的 Java Bean，普通业务管理员不可自行修改。</div>
      </div>
    </el-drawer>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
const drawerVisible = ref(false)
const selectedNode = ref<any>(null)

const categories = ['Lab', 'Field', 'Specialized', 'FlowControl', 'AI', 'Integration', 'Review']

const nodeTypes = ref([
  { id: 1, key: 'REQUEST_ACCEPTANCE', name: '委托受理', category: 'Lab', mode: 'HUMAN_TASK', executor: 'requestAcceptanceExecutor', configRenderer: 'request-acceptance-config', renderer: 'request-acceptance-workbench', module: 'capability-lab-core', version: '1.2', status: 'Active', configFields: [{key:'requireClientSign',type:'Boolean',required:false},{key:'autoAssignTo',type:'String',required:false}] },
  { id: 2, key: 'SAMPLE_RECEIPT', name: '收样', category: 'Lab', mode: 'HUMAN_TASK', executor: 'sampleReceiptExecutor', configRenderer: 'sample-receipt-config', renderer: 'sample-receipt-workbench', module: 'capability-lab-core', version: '1.1', status: 'Active', configFields: [{key:'requireBarcode',type:'Boolean',required:true},{key:'storageTemp',type:'Enum',required:false}] },
  { id: 3, key: 'SAMPLE_PREPARATION', name: '样品前处理', category: 'Lab', mode: 'HUMAN_TASK', executor: 'samplePrepExecutor', configRenderer: 'sample-prep-config', renderer: 'sample-prep-workbench', module: 'capability-lab-core', version: '1.0', status: 'Active', configFields: [] },
  { id: 4, key: 'LAB_TEST_EXECUTION', name: '实验室检测', category: 'Lab', mode: 'HUMAN_TASK', executor: 'labTestExecutor', configRenderer: 'lab-test-config', renderer: 'lab-test-workbench', module: 'capability-lab-core', version: '2.0', status: 'Active', configFields: [{key:'requireEquipCalib',type:'Boolean',required:true},{key:'parallelSamples',type:'Integer',required:false}] },
  { id: 5, key: 'FIELD_SAMPLING', name: '现场采样', category: 'Field', mode: 'HUMAN_TASK', executor: 'fieldSamplingExecutor', configRenderer: 'field-sampling-node-config', renderer: 'field-sampling-workbench', module: 'capability-field-sampling', version: '1.0', status: 'Active', configFields: [{key:'requireGPS',type:'Boolean',required:false},{key:'requirePhotos',type:'Boolean',required:false},{key:'requireChainOfCustody',type:'Boolean',required:true}] },
  { id: 6, key: 'SAMPLING_PLAN', name: '采样方案', category: 'Field', mode: 'HUMAN_TASK', executor: 'samplingPlanExecutor', configRenderer: 'sampling-plan-config', renderer: 'sampling-plan-workbench', module: 'capability-field-sampling', version: '1.0', status: 'Active', configFields: [] },
  { id: 7, key: 'TECHNICAL_REVIEW', name: '技术审核', category: 'Review', mode: 'HUMAN_TASK', executor: 'technicalReviewExecutor', configRenderer: 'tech-review-config', renderer: 'review-center-workbench', module: 'capability-review', version: '1.3', status: 'Active', configFields: [{key:'requireAIAssist',type:'Boolean',required:false},{key:'minReviewerLevel',type:'Enum',required:true}] },
  { id: 8, key: 'REPORT_GENERATION', name: '报告生成', category: 'Lab', mode: 'SERVICE_TASK', executor: 'reportGenerationExecutor', configRenderer: 'report-gen-config', renderer: null, module: 'capability-report', version: '2.1', status: 'Active', configFields: [{key:'templateId',type:'String',required:true},{key:'autoPopulate',type:'Boolean',required:false}] },
  { id: 9, key: 'REPORT_RELEASE', name: '报告签发', category: 'Review', mode: 'HUMAN_TASK', executor: 'reportReleaseExecutor', configRenderer: 'report-release-config', renderer: 'report-release-workbench', module: 'capability-review', version: '1.0', status: 'Active', configFields: [] },
  { id: 10, key: 'METROLOGY_MEASUREMENT', name: '几何量测量', category: 'Specialized', mode: 'HUMAN_TASK', executor: 'metrologyExecutor', configRenderer: 'metrology-config', renderer: 'metrology-workbench', module: 'capability-metrology', version: '1.0', status: 'Active', configFields: [{key:'allowCMMInput',type:'Boolean',required:false}] },
  { id: 11, key: 'AI_NODE', name: 'AI 节点', category: 'AI', mode: 'AI_TASK', executor: 'aiNodeExecutor', configRenderer: 'ai-node-config', renderer: null, module: 'capability-ai', version: '1.0', status: 'Active', configFields: [{key:'skillId',type:'String',required:true},{key:'requireApproval',type:'Boolean',required:true}] },
  { id: 12, key: 'RULE_NODE', name: 'Rule 节点', category: 'FlowControl', mode: 'RULE_TASK', executor: 'ruleNodeExecutor', configRenderer: 'rule-node-config', renderer: null, module: 'capability-rule', version: '1.1', status: 'Active', configFields: [] },
  { id: 13, key: 'ONSITE_INSPECTION', name: '客户现场检测', category: 'Field', mode: 'HUMAN_TASK', executor: 'onsiteInspectionExecutor', configRenderer: 'onsite-inspection-config', renderer: 'onsite-inspection-workbench', module: 'capability-field-inspection', version: '1.0', status: 'Active', configFields: [] },
])

function openDetail(row: any) {
  selectedNode.value = row
  drawerVisible.value = true
}

function catClass(cat: string) {
  const map: Record<string, string> = { Lab: 'lab', Field: 'field', Specialized: 'spec', AI: 'ai', FlowControl: 'flow', Review: 'review', Integration: 'integ' }
  return map[cat] || ''
}

function modeClass(mode: string) {
  const map: Record<string, string> = { HUMAN_TASK: 'human', SERVICE_TASK: 'service', AI_TASK: 'ai', RULE_TASK: 'rule' }
  return map[mode] || ''
}
</script>
<style scoped>
.page { padding: 24px 32px; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.page-title { font-size: 20px; font-weight: 600; color: #0B1220; }
.page-subtitle { font-size: 12px; color: #526075; }
.filter-bar { display: flex; gap: 8px; padding: 10px 12px; background: #fff; border: 1px solid #D9DEE7; border-bottom: none; border-radius: 4px 4px 0 0; }
.table-wrap { background: #fff; border-radius: 0 0 4px 4px; overflow: hidden; cursor: pointer; }
.node-type-key { font-family: monospace; font-size: 12px; color: #0B1220; font-weight: 500; }
.cat-tag { font-size: 11px; padding: 2px 6px; border-radius: 3px; }
.cat-tag.lab { background: #EDF4FF; color: #1677FF; }
.cat-tag.field { background: #F0FFF4; color: #18794E; }
.cat-tag.spec { background: #F5F0FF; color: #526075; }
.cat-tag.ai { background: #F5F7FA; color: #526075; }
.cat-tag.flow { background: #FFF3E0; color: #A9650A; }
.cat-tag.review { background: #FFF8E1; color: #A9650A; }
.mode-tag { font-size: 11px; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
.mode-tag.human { background: #EDF4FF; color: #1677FF; }
.mode-tag.service { background: #F0FFF4; color: #18794E; }
.mode-tag.ai { background: #F5F0FF; color: #526075; }
.mode-tag.rule { background: #FFF3E0; color: #A9650A; }
.ver-mono { font-family: monospace; font-size: 11px; color: #526075; }
.status-dot { font-size: 11px; padding: 2px 6px; border-radius: 3px; }
.status-dot.active { background: #F0FFF4; color: #18794E; }
.status-dot.dep { background: #FFF1F0; color: #C32F3F; }
/* Drawer */
.descriptor-wrap { }
.desc-key { font-family: monospace; font-size: 14px; font-weight: 600; color: #0B1220; }
.desc-name { font-size: 13px; color: #526075; margin-top: 4px; }
.desc-section { display: flex; flex-direction: column; gap: 8px; }
.desc-row { display: flex; gap: 0; }
.dk { width: 140px; font-size: 12px; color: #8A96A6; flex-shrink: 0; }
.dv { font-size: 13px; color: #0B1220; }
.dv.mono { font-family: monospace; font-size: 11px; color: #526075; }
.desc-subtitle { font-size: 12px; font-weight: 600; color: #0B1220; margin-bottom: 8px; }
.desc-config-list { display: flex; flex-direction: column; gap: 4px; }
.cfg-row { display: flex; align-items: center; gap: 10px; padding: 6px 10px; background: #F8FAFB; border: 1px solid #E7EAF0; border-radius: 3px; }
.cfg-key { font-size: 12px; color: #0B1220; flex: 1; }
.cfg-type { font-size: 11px; color: #8A96A6; background: #E7EAF0; padding: 1px 5px; border-radius: 2px; }
.cfg-req { font-size: 11px; color: #C32F3F; }
.mono { font-family: monospace; }
.desc-notice { margin-top: 16px; font-size: 12px; color: #8A96A6; background: #F5F7FA; padding: 8px 10px; border-radius: 4px; }
</style>
