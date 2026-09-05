<template>
  <div class="page">
    <div class="page-header">
      <div>
        <div class="page-title">AI Skill Center</div>
        <div class="page-subtitle">平台 AI 能力注册与管理 · AI 是流程中的业务能力，不是悬浮聊天机器人</div>
      </div>
      <el-button type="primary">+ 注册 AI Skill</el-button>
    </div>
    <div class="filter-bar">
      <el-input placeholder="Skill 名称" style="width:200px" size="small" clearable prefix-icon="Search" />
      <el-select placeholder="类别" clearable size="small" style="width:130px">
        <el-option label="匹配推荐" value="match" />
        <el-option label="文档生成" value="gen" />
        <el-option label="审核辅助" value="review" />
        <el-option label="异常检测" value="anomaly" />
        <el-option label="调度优化" value="schedule" />
      </el-select>
      <el-select placeholder="状态" clearable size="small" style="width:110px">
        <el-option label="Active" value="active" />
        <el-option label="Disabled" value="disabled" />
        <el-option label="Beta" value="beta" />
      </el-select>
    </div>
    <div class="table-wrap">
      <el-table :data="skills" border size="small" @row-click="openDetail">
        <el-table-column label="Skill" width="180">
          <template #default="{ row }">
            <div class="skill-name">{{ row.name }}</div>
            <div class="skill-en">{{ row.en }}</div>
          </template>
        </el-table-column>
        <el-table-column label="Version" width="90">
          <template #default="{ row }">
            <span class="ver-mono">{{ row.version }}</span>
          </template>
        </el-table-column>
        <el-table-column label="类别" width="110">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ row.category }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Input Schema" min-width="160" prop="inputSchema" />
        <el-table-column label="Output Schema" min-width="140" prop="outputSchema" />
        <el-table-column label="Human Approval" width="120">
          <template #default="{ row }">
            <span :class="['approval-tag', row.approval === 'Required' ? 'req' : 'opt']">{{ row.approval }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Evidence" width="90">
          <template #default="{ row }">
            <span class="bool-tag">{{ row.evidenceRequired ? '必须' : '可选' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="本月调用" width="90" prop="callCount" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <span :class="['status-tag', row.status === 'Active' ? 'active' : row.status === 'Beta' ? 'beta' : 'disabled']">{{ row.status }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-drawer v-model="drawerVisible" title="AI Skill 详情" size="480px">
      <div v-if="selectedSkill" class="skill-detail">
        <div class="sd-name">{{ selectedSkill.name }}</div>
        <div class="sd-en">{{ selectedSkill.en }}</div>
        <div class="detail-tabs">
          <div v-for="t in detailTabs" :key="t" class="d-tab" :class="{ active: activeTab === t }" @click="activeTab = t">{{ t }}</div>
        </div>
        <div v-if="activeTab === '基本信息'" class="sd-body">
          <div class="kv"><span class="kl">版本</span><span class="kv2 mono">{{ selectedSkill.version }}</span></div>
          <div class="kv"><span class="kl">类别</span><span class="kv2">{{ selectedSkill.category }}</span></div>
          <div class="kv"><span class="kl">触发阶段</span><span class="kv2">{{ selectedSkill.trigger }}</span></div>
          <div class="kv"><span class="kl">Human Approval</span><span :class="['approval-tag', selectedSkill.approval === 'Required' ? 'req' : 'opt']" style="font-size:11px">{{ selectedSkill.approval }}</span></div>
          <div class="kv"><span class="kl">风险策略</span><span class="kv2">{{ selectedSkill.riskPolicy }}</span></div>
          <div class="kv"><span class="kl">Input Schema</span><span class="kv2 mono">{{ selectedSkill.inputSchema }}</span></div>
          <div class="kv"><span class="kl">Output Schema</span><span class="kv2 mono">{{ selectedSkill.outputSchema }}</span></div>
          <div class="kv"><span class="kl">本月调用</span><span class="kv2">{{ selectedSkill.callCount }}</span></div>
          <div class="kv"><span class="kl">采纳率</span><span class="kv2">{{ selectedSkill.adoptRate }}%</span></div>
        </div>
        <div v-else-if="activeTab === '调用历史'" class="sd-body">
          <div v-for="h in callHistory" :key="h.id" class="hist-row">
            <div class="hist-time">{{ h.time }}</div>
            <div class="hist-req">{{ h.req }}</div>
            <span :class="['hist-status', h.adopted ? 'adopted' : 'rejected']">{{ h.adopted ? '已采纳' : '已拒绝' }}</span>
          </div>
        </div>
        <div v-else class="sd-body">
          <div style="color:#8A96A6;font-size:13px">该内容在完整版展示</div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
const drawerVisible = ref(false)
const selectedSkill = ref<any>(null)
const activeTab = ref('基本信息')
const detailTabs = ['基本信息', 'Eval Results', '调用历史', 'Policy']

const skills = ref([
  { id: 1, name: 'standard-match', en: '标准智能匹配', version: 'v1.2', category: '匹配推荐', inputSchema: 'TestItem[] + SceneContext', outputSchema: 'StandardVersion[]', approval: 'Required', evidenceRequired: true, callCount: 312, status: 'Active', trigger: 'REQUEST_PLANNING', riskPolicy: '低风险自动确认', adoptRate: 94 },
  { id: 2, name: 'report-draft', en: '报告草稿生成', version: 'v2.0', category: '文档生成', inputSchema: 'Results[] + Template', outputSchema: 'ReportDraft', approval: 'Required', evidenceRequired: true, callCount: 248, status: 'Active', trigger: 'REPORT_GENERATION', riskPolicy: '高风险须人工确认', adoptRate: 91 },
  { id: 3, name: 'report-review', en: '报告审核辅助', version: 'v1.4', category: '审核辅助', inputSchema: 'ReportDraft + Evidence', outputSchema: 'ReviewIssues[]', approval: 'Required', evidenceRequired: true, callCount: 196, status: 'Active', trigger: 'TECHNICAL_REVIEW', riskPolicy: '所有输出须审核员确认', adoptRate: 88 },
  { id: 4, name: 'request-parse', en: '委托解析', version: 'v1.1', category: '文档生成', inputSchema: 'RequestDocument PDF', outputSchema: 'StructuredPlan', approval: 'Required', evidenceRequired: false, callCount: 186, status: 'Active', trigger: 'REQUEST_ACCEPTANCE', riskPolicy: '中风险须人工确认', adoptRate: 82 },
  { id: 5, name: 'anomaly-detect', en: '结果异常识别', version: 'v1.0', category: '异常检测', inputSchema: 'Measurement[]', outputSchema: 'AnomalyFlags[]', approval: 'Optional', evidenceRequired: false, callCount: 1024, status: 'Active', trigger: '结果录入时', riskPolicy: '低风险实时告警', adoptRate: 79 },
  { id: 6, name: 'smart-schedule', en: '智能任务调度', version: 'v0.8', category: '调度优化', inputSchema: 'TaskQueue + EquipStatus', outputSchema: 'Schedule', approval: 'Required', evidenceRequired: false, callCount: 82, status: 'Beta', trigger: '检测策划时', riskPolicy: '须调度员确认', adoptRate: 85 },
])

const callHistory = ref([
  { id: 1, time: '2026-09-05 14:32', req: 'REQ-20260905-031', adopted: true },
  { id: 2, time: '2026-09-05 11:18', req: 'REQ-20260905-028', adopted: true },
  { id: 3, time: '2026-09-04 16:44', req: 'REQ-20260904-019', adopted: false },
  { id: 4, time: '2026-09-04 09:10', req: 'REQ-20260904-012', adopted: true },
])

function openDetail(row: any) {
  selectedSkill.value = row
  activeTab.value = '基本信息'
  drawerVisible.value = true
}
</script>
<style scoped>
.page { padding: 24px 32px; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.page-title { font-size: 20px; font-weight: 600; color: #0B1220; }
.page-subtitle { font-size: 12px; color: #526075; }
.filter-bar { display: flex; gap: 8px; padding: 10px 12px; background: #fff; border: 1px solid #D9DEE7; border-bottom: none; border-radius: 4px 4px 0 0; }
.table-wrap { background: #fff; border-radius: 0 0 4px 4px; overflow: hidden; cursor: pointer; }
.skill-name { font-size: 13px; font-weight: 500; color: #0B1220; font-family: monospace; }
.skill-en { font-size: 12px; color: #8A96A6; }
.ver-mono { font-family: monospace; font-size: 11px; color: #526075; }
.approval-tag { font-size: 11px; padding: 2px 6px; border-radius: 3px; }
.approval-tag.req { background: #FFF1F0; color: #C32F3F; }
.approval-tag.opt { background: #F5F7FA; color: #8A96A6; }
.bool-tag { font-size: 11px; color: #526075; }
.status-tag { font-size: 11px; padding: 2px 6px; border-radius: 3px; }
.status-tag.active { background: #F0FFF4; color: #18794E; }
.status-tag.beta { background: #FFF3E0; color: #A9650A; }
.status-tag.disabled { background: #F5F7FA; color: #8A96A6; }
/* Drawer */
.skill-detail { }
.sd-name { font-size: 15px; font-weight: 600; color: #0B1220; font-family: monospace; }
.sd-en { font-size: 13px; color: #526075; margin-bottom: 12px; }
.detail-tabs { display: flex; border-bottom: 1px solid #D9DEE7; margin-bottom: 14px; }
.d-tab { padding: 7px 12px; font-size: 12px; color: #526075; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; }
.d-tab.active { color: #1677FF; border-bottom-color: #1677FF; }
.sd-body { display: flex; flex-direction: column; gap: 8px; }
.kv { display: flex; align-items: flex-start; gap: 0; }
.kl { width: 120px; font-size: 12px; color: #8A96A6; flex-shrink: 0; }
.kv2 { font-size: 13px; color: #0B1220; }
.kv2.mono { font-family: monospace; font-size: 11px; color: #526075; }
.hist-row { display: flex; align-items: center; gap: 10px; padding: 7px 0; border-bottom: 1px solid #E7EAF0; }
.hist-time { font-size: 11px; color: #8A96A6; font-family: monospace; width: 130px; flex-shrink: 0; }
.hist-req { flex: 1; font-size: 12px; color: #526075; font-family: monospace; }
.hist-status { font-size: 11px; padding: 1px 5px; border-radius: 3px; }
.hist-status.adopted { background: #F0FFF4; color: #18794E; }
.hist-status.rejected { background: #FFF1F0; color: #C32F3F; }
</style>
