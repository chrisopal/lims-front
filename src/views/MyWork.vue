<template>
  <div class="page">
    <div class="page-header">
      <div>
        <div class="page-title">我的工作</div>
        <div class="page-subtitle">My Work · 所有 Human Task 的统一工作入口</div>
      </div>
      <div style="display:flex;gap:8px">
        <el-badge :value="urgentCount" type="danger">
          <el-button size="small">超时任务</el-button>
        </el-badge>
      </div>
    </div>

    <!-- Quick tabs -->
    <div class="work-tabs">
      <div v-for="t in tabs" :key="t.key" class="work-tab" :class="{ active: activeTab === t.key }" @click="activeTab = t.key">
        {{ t.label }}
        <span class="tab-count" v-if="t.count">{{ t.count }}</span>
      </div>
    </div>

    <!-- Filter bar -->
    <div class="filter-bar">
      <el-input placeholder="委托号 / 工作项" style="width:200px" size="small" clearable prefix-icon="Search" />
      <el-select placeholder="流程节点" clearable size="small" style="width:160px">
        <el-option label="现场采样" value="FIELD_SAMPLING" />
        <el-option label="实验室检测" value="LAB_TEST" />
        <el-option label="技术审核" value="TECHNICAL_REVIEW" />
        <el-option label="报告签发" value="REPORT_RELEASE" />
      </el-select>
      <el-select placeholder="场景" clearable size="small" style="width:180px">
        <el-option label="第三方食品理化检测" value="food" />
        <el-option label="环境水质监测" value="env" />
      </el-select>
    </div>

    <!-- Task table -->
    <div class="table-wrap">
      <el-table :data="filteredTasks" border size="small">
        <el-table-column label="工作项" min-width="200">
          <template #default="{ row }">
            <div class="work-item-name" @click="openWorkbench(row)">{{ row.taskName }}</div>
            <div class="work-item-id">{{ row.taskId }}</div>
          </template>
        </el-table-column>
        <el-table-column label="流程节点" width="140">
          <template #default="{ row }">
            <span :class="['node-tag', nodeClass(row.nodeType)]">{{ row.nodeLabel }}</span>
          </template>
        </el-table-column>
        <el-table-column label="场景" width="180" prop="scenario" />
        <el-table-column label="委托号" width="140">
          <template #default="{ row }">
            <span class="req-id">{{ row.reqId }}</span>
          </template>
        </el-table-column>
        <el-table-column label="检测对象" width="140" prop="subject" />
        <el-table-column label="地点" width="110" prop="location" />
        <el-table-column label="截止时间" width="140">
          <template #default="{ row }">
            <span :class="['deadline', row.overdue ? 'overdue' : row.urgent ? 'urgent' : '']">
              <el-icon v-if="row.overdue" size="11"><Warning /></el-icon>
              {{ row.deadline }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <span :class="['task-status', row.statusCls]">{{ row.status }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="130" fixed="right">
          <template #default="{ row }">
            <el-button link size="small" type="primary" @click="openWorkbench(row)">打开工作台</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()
const activeTab = ref('all')

const tabs = ref([
  { key: 'all', label: '全部', count: 12 },
  { key: 'today', label: '今日', count: 7 },
  { key: 'overdue', label: '超时', count: 2 },
  { key: 'field', label: '现场', count: 3 },
  { key: 'lab', label: '实验室', count: 5 },
  { key: 'review', label: '审核', count: 2 },
])

const urgentCount = 2

const tasks = ref([
  { id: 1, taskName: '现场采样', taskId: 'WT-20260905-011', nodeType: 'FIELD_SAMPLING', nodeLabel: '现场采样', scenario: '环境水质监测 v2.0', reqId: 'REQ-20260905-004', subject: 'A-03 排口', location: '青岛', deadline: '今日 16:00', overdue: false, urgent: true, status: '待处理', statusCls: 'pending' },
  { id: 2, taskName: '技术审核', taskId: 'WT-20260905-009', nodeType: 'TECHNICAL_REVIEW', nodeLabel: '技术审核', scenario: '第三方食品理化检测 v1.2', reqId: 'REQ-20260903-018', subject: '食品样品 F019', location: '—', deadline: '今日 18:00', overdue: false, urgent: true, status: '待审核', statusCls: 'review' },
  { id: 3, taskName: '实验室检测', taskId: 'WT-20260905-007', nodeType: 'LAB_TEST_EXECUTION', nodeLabel: '实验室检测', scenario: '第三方食品理化检测 v1.2', reqId: 'REQ-20260904-022', subject: '食品样品 F021', location: '上海食品实验室', deadline: '明日 09:00', overdue: false, urgent: false, status: '进行中', statusCls: 'running' },
  { id: 4, taskName: '收样登记', taskId: 'WT-20260905-006', nodeType: 'SAMPLE_RECEIPT', nodeLabel: '收样', scenario: '第三方食品理化检测 v1.2', reqId: 'REQ-20260905-031', subject: '食品样品批 F026-F031', location: '上海食品实验室', deadline: '今日 14:00', overdue: true, urgent: false, status: '超时', statusCls: 'overdue' },
  { id: 5, taskName: '现场采样', taskId: 'WT-20260904-015', nodeType: 'FIELD_SAMPLING', nodeLabel: '现场采样', scenario: '环境水质监测 v2.0', reqId: 'REQ-20260904-008', subject: 'B-01 进水口', location: '上海', deadline: '昨日 17:00', overdue: true, urgent: false, status: '超时', statusCls: 'overdue' },
  { id: 6, taskName: '几何量测量', taskId: 'WT-20260905-003', nodeType: 'METROLOGY_MEASUREMENT', nodeLabel: '几何量测量', scenario: '客户现场尺寸检测 v1.0', reqId: 'REQ-20260905-002', subject: 'Part A-2488', location: '客户工厂 杭州', deadline: '明日 12:00', overdue: false, urgent: false, status: '待处理', statusCls: 'pending' },
  { id: 7, taskName: '报告签发', taskId: 'WT-20260905-001', nodeType: 'REPORT_RELEASE', nodeLabel: '报告签发', scenario: '第三方食品理化检测 v1.2', reqId: 'REQ-20260901-009', subject: '食品样品 F010', location: '—', deadline: '今日 17:30', overdue: false, urgent: true, status: '待签发', statusCls: 'review' },
])

const filteredTasks = computed(() => {
  if (activeTab.value === 'all') return tasks.value
  if (activeTab.value === 'today') return tasks.value.filter(t => t.deadline.startsWith('今日'))
  if (activeTab.value === 'overdue') return tasks.value.filter(t => t.overdue)
  if (activeTab.value === 'field') return tasks.value.filter(t => t.nodeType === 'FIELD_SAMPLING')
  if (activeTab.value === 'lab') return tasks.value.filter(t => t.nodeType === 'LAB_TEST_EXECUTION' || t.nodeType === 'SAMPLE_RECEIPT')
  if (activeTab.value === 'review') return tasks.value.filter(t => t.nodeType === 'TECHNICAL_REVIEW' || t.nodeType === 'REPORT_RELEASE')
  return tasks.value
})

function nodeClass(type: string) {
  const m: Record<string, string> = {
    FIELD_SAMPLING: 'field', SAMPLE_RECEIPT: 'lab', LAB_TEST_EXECUTION: 'lab',
    TECHNICAL_REVIEW: 'review', REPORT_RELEASE: 'review', METROLOGY_MEASUREMENT: 'spec',
  }
  return m[type] || ''
}

function openWorkbench(row: any) {
  if (row.nodeType === 'FIELD_SAMPLING') router.push('/app/workbench/field-sampling')
  else if (row.nodeType === 'METROLOGY_MEASUREMENT') router.push('/app/workbench/metrology')
  else if (row.nodeType === 'TECHNICAL_REVIEW' || row.nodeType === 'REPORT_RELEASE') router.push('/app/operations/review')
}
</script>
<style scoped>
.page { padding: 24px 32px; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.page-title { font-size: 20px; font-weight: 600; color: #0B1220; }
.page-subtitle { font-size: 12px; color: #526075; }
.work-tabs { display: flex; gap: 0; border-bottom: 1px solid #D9DEE7; margin-bottom: 0; background: #fff; padding: 0 12px; }
.work-tab { padding: 10px 14px; font-size: 13px; color: #526075; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; display: flex; align-items: center; gap: 5px; }
.work-tab.active { color: #1677FF; border-bottom-color: #1677FF; }
.tab-count { font-size: 11px; background: #EDF4FF; color: #1677FF; padding: 1px 5px; border-radius: 8px; }
.filter-bar { display: flex; gap: 8px; padding: 10px 12px; background: #fff; border: 1px solid #D9DEE7; border-top: none; border-bottom: none; }
.table-wrap { background: #fff; border-radius: 0 0 4px 4px; }
.work-item-name { font-size: 13px; color: #1677FF; font-weight: 500; cursor: pointer; }
.work-item-name:hover { text-decoration: underline; }
.work-item-id { font-size: 11px; color: #8A96A6; font-family: monospace; }
.node-tag { font-size: 11px; padding: 2px 6px; border-radius: 3px; font-weight: 500; }
.node-tag.field { background: #F0FFF4; color: #18794E; }
.node-tag.lab { background: #EDF4FF; color: #1677FF; }
.node-tag.review { background: #FFF3E0; color: #A9650A; }
.node-tag.spec { background: #F5F0FF; color: #526075; }
.req-id { font-family: monospace; font-size: 11px; color: #526075; }
.deadline { font-size: 13px; color: #0B1220; display: flex; align-items: center; gap: 3px; }
.deadline.overdue { color: #C32F3F; font-weight: 500; }
.deadline.urgent { color: #A9650A; }
.task-status { font-size: 11px; padding: 2px 6px; border-radius: 3px; }
.task-status.pending { background: #EDF4FF; color: #1677FF; }
.task-status.running { background: #F0FFF4; color: #18794E; }
.task-status.review { background: #FFF3E0; color: #A9650A; }
.task-status.overdue { background: #FFF1F0; color: #C32F3F; }
</style>
