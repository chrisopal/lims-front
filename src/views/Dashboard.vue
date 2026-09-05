<template>
  <div class="page">
    <div class="page-header">
      <div>
        <div class="page-title">实验室工作台</div>
        <div class="page-subtitle">华东食品检测中心 · 今日 {{ today }}</div>
      </div>
      <div style="display:flex;gap:8px">
        <el-button>导出报表</el-button>
        <el-button type="primary" @click="$router.push('/app/requests/new')">+ 新建委托</el-button>
      </div>
    </div>

    <!-- KPI row -->
    <div class="kpi-row">
      <div class="kpi-card" v-for="kpi in kpis" :key="kpi.label">
        <div class="kpi-label">{{ kpi.label }}</div>
        <div class="kpi-value" :style="{color: kpi.color || '#0B1220'}">{{ kpi.value }}</div>
        <div class="kpi-change" :class="kpi.trend">{{ kpi.change }}</div>
      </div>
    </div>

    <!-- Main grid -->
    <div class="dashboard-grid">
      <!-- Today tasks -->
      <div class="panel span-2">
        <div class="panel-header">
          <span class="panel-title">今日任务</span>
          <el-button link type="primary" size="small" @click="$router.push('/app/test-tasks')">查看全部</el-button>
        </div>
        <el-table :data="todayTasks" size="small" :show-header="true">
          <el-table-column prop="id" label="任务编号" width="130" />
          <el-table-column prop="name" label="检测项目" />
          <el-table-column prop="sample" label="样品" width="120" />
          <el-table-column prop="assignee" label="执行人" width="90" />
          <el-table-column prop="deadline" label="截止时间" width="110" />
          <el-table-column prop="status" label="状态" width="90">
            <template #default="{row}">
              <el-tag :type="statusType(row.status)" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- Pending review -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">待审核</span>
          <el-badge :value="5" type="danger" />
        </div>
        <div class="review-list">
          <div class="review-item" v-for="r in pendingReviews" :key="r.id" @click="$router.push('/app/review')">
            <div class="review-main">
              <div class="review-name">{{ r.name }}</div>
              <div class="review-meta">{{ r.type }} · {{ r.submitter }}</div>
            </div>
            <div>
              <el-tag :type="r.urgency === '紧急' ? 'danger' : 'warning'" size="small">{{ r.urgency }}</el-tag>
            </div>
          </div>
        </div>
      </div>

      <!-- AI recommendations -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">AI 推荐事项</span>
          <el-tag type="info" size="small">AI 生成</el-tag>
        </div>
        <div class="ai-list">
          <div class="ai-item" v-for="a in aiRecs" :key="a.id">
            <div class="ai-icon" :style="{background: a.color}">{{ a.icon }}</div>
            <div class="ai-content">
              <div class="ai-title">{{ a.title }}</div>
              <div class="ai-desc">{{ a.desc }}</div>
            </div>
            <el-button link type="primary" size="small">处理</el-button>
          </div>
        </div>
      </div>

      <!-- Delivery risk -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">交期风险</span>
          <el-tag type="danger" size="small">3 条风险</el-tag>
        </div>
        <div class="risk-list">
          <div class="risk-item" v-for="r in risks" :key="r.id">
            <div style="flex:1">
              <div class="risk-name">{{ r.name }}</div>
              <div class="risk-meta">{{ r.client }} · 应交 {{ r.due }}</div>
            </div>
            <el-tag type="danger" size="small">{{ r.delay }}</el-tag>
          </div>
        </div>
      </div>

      <!-- Standard updates -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">标准更新提醒</span>
          <el-button link type="primary" size="small" @click="$router.push('/app/standards')">管理</el-button>
        </div>
        <div class="std-list">
          <div class="std-item" v-for="s in stdUpdates" :key="s.id">
            <el-tag type="warning" size="small" style="min-width:100px">{{ s.code }}</el-tag>
            <div style="flex:1;margin-left:10px">
              <div class="std-name">{{ s.name }}</div>
              <div class="std-meta">新版 {{ s.newVersion }} · {{ s.date }} 生效</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Equipment status -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">设备占用状态</span>
          <el-button link type="primary" size="small" @click="$router.push('/app/equipment')">详情</el-button>
        </div>
        <div class="equip-list">
          <div class="equip-item" v-for="e in equipment" :key="e.id">
            <div style="flex:1">
              <div class="equip-name">{{ e.name }}</div>
              <div class="equip-meta">{{ e.model }}</div>
            </div>
            <div style="text-align:right">
              <el-tag :type="e.status === '空闲' ? 'success' : e.status === '使用中' ? 'warning' : 'danger'" size="small">{{ e.status }}</el-tag>
              <div class="equip-util">使用率 {{ e.util }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const today = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })

const kpis = [
  { label: '今日委托', value: '12', change: '+3 较昨日', trend: 'up' },
  { label: '在检任务', value: '47', change: '进行中', color: '#1677FF' },
  { label: '待审核', value: '5', change: '需处理', color: '#A9650A' },
  { label: '今日完成', value: '8', change: '+2 较昨日', trend: 'up' },
  { label: '交期预警', value: '3', change: '高风险', color: '#C32F3F' },
  { label: '本月报告', value: '156', change: '已签发', color: '#18794E' },
]

const todayTasks = [
  { id: 'TASK-2024-1201', name: '铅（Pb）检测 / ICP-MS', sample: 'FS-2024-0891', assignee: '李明', deadline: '17:00', status: '进行中' },
  { id: 'TASK-2024-1202', name: '菌落总数检测', sample: 'FS-2024-0892', assignee: '王芳', deadline: '16:30', status: '待开始' },
  { id: 'TASK-2024-1203', name: '水分含量测定', sample: 'FS-2024-0885', assignee: '赵磊', deadline: '15:00', status: '已完成' },
  { id: 'TASK-2024-1204', name: '蛋白质含量检测', sample: 'FS-2024-0886', assignee: '张研', deadline: '18:00', status: '进行中' },
  { id: 'TASK-2024-1205', name: 'pH 值测定', sample: 'ENV-2024-0221', assignee: '陈华', deadline: '14:30', status: '已完成' },
]

const pendingReviews = [
  { id: 1, name: '牛奶铅镉重金属检测报告', type: '技术审核', submitter: '李明', urgency: '紧急' },
  { id: 2, name: '食品添加剂综合检测报告', type: '质量审核', submitter: '王芳', urgency: '普通' },
  { id: 3, name: '环境水质 COD 检测报告', type: '技术审核', submitter: '陈华', urgency: '紧急' },
  { id: 4, name: '新能源电池容量保持率测试', type: 'AI 审核', submitter: 'AI 系统', urgency: '普通' },
]

const aiRecs = [
  { id: 1, icon: '🎯', color: '#EDF4FF', title: '标准版本更新建议', desc: 'GB 5009.12-2023 已生效，3 个检测项方法需更新' },
  { id: 2, icon: '⚡', color: '#FFF3E0', title: '任务调度优化', desc: 'ICP-MS 设备明日 10:00-14:00 建议集中安排重金属检测' },
  { id: 3, icon: '📊', color: '#E8F5E9', title: '结果异常识别', desc: 'TASK-1198 镉含量结果偏高，建议复检确认' },
]

const risks = [
  { id: 1, name: 'ORD-2024-0445 食品综合检测', client: '好食光食品公司', due: '12-05', delay: '延迟 2 天' },
  { id: 2, name: 'ORD-2024-0448 环境水质监测', client: '绿环监测站', due: '12-06', delay: '延迟 1 天' },
  { id: 3, name: 'ORD-2024-0451 重金属批量检测', client: '华泰农业', due: '12-07', delay: '风险' },
]

const stdUpdates = [
  { id: 1, code: 'GB 5009.12-2023', name: '食品中铅的测定', newVersion: '2023', date: '2024-03-01' },
  { id: 2, code: 'HJ 828-2017', name: '水质 化学需氧量', newVersion: 'Amendment 1', date: '2024-06-01' },
  { id: 3, code: 'GB/T 5750-2023', name: '生活饮用水检验方法', newVersion: '2023', date: '2024-07-01' },
]

const equipment = [
  { id: 1, name: 'ICP-MS 电感耦合等离子体质谱仪', model: 'Agilent 7900', status: '使用中', util: '78%' },
  { id: 2, name: '气相色谱仪 GC-FID', model: 'Agilent 8890', status: '空闲', util: '45%' },
  { id: 3, name: '液相色谱仪 HPLC', model: 'Waters e2695', status: '维护中', util: '0%' },
  { id: 4, name: '原子吸收分光光度计', model: 'PerkinElmer AAS 800', status: '使用中', util: '62%' },
]

function statusType(status: string) {
  const map: Record<string, string> = { '进行中': 'primary', '待开始': 'info', '已完成': 'success', '暂停': 'warning' }
  return map[status] || 'info'
}
</script>

<style scoped>
.page { }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.page-title { font-size: 18px; font-weight: 600; color: #0B1220; margin-bottom: 4px; }
.page-subtitle { font-size: 13px; color: #526075; }

.kpi-row { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; margin-bottom: 20px; }
.kpi-card { background: #fff; border: 1px solid #D9DEE7; border-radius: 6px; padding: 16px; }
.kpi-label { font-size: 12px; color: #526075; margin-bottom: 8px; }
.kpi-value { font-size: 24px; font-weight: 600; color: #0B1220; margin-bottom: 4px; }
.kpi-change { font-size: 12px; color: #526075; }
.kpi-change.up { color: #18794E; }

.dashboard-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.panel { background: #fff; border: 1px solid #D9DEE7; border-radius: 6px; padding: 16px; }
.panel.span-2 { grid-column: span 2; }

.panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.panel-title { font-size: 14px; font-weight: 500; color: #0B1220; }

.review-list { display: flex; flex-direction: column; gap: 10px; }
.review-item { display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: 4px; cursor: pointer; }
.review-item:hover { background: #F5F7FA; }
.review-name { font-size: 13px; color: #0B1220; margin-bottom: 2px; }
.review-meta { font-size: 12px; color: #526075; }

.ai-list { display: flex; flex-direction: column; gap: 10px; }
.ai-item { display: flex; align-items: center; gap: 10px; }
.ai-icon { width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
.ai-title { font-size: 13px; font-weight: 500; color: #0B1220; margin-bottom: 2px; }
.ai-desc { font-size: 12px; color: #526075; }

.risk-list { display: flex; flex-direction: column; gap: 10px; }
.risk-item { display: flex; align-items: center; gap: 10px; }
.risk-name { font-size: 13px; color: #0B1220; margin-bottom: 2px; }
.risk-meta { font-size: 12px; color: #526075; }

.std-list { display: flex; flex-direction: column; gap: 10px; }
.std-item { display: flex; align-items: flex-start; }
.std-name { font-size: 13px; color: #0B1220; margin-bottom: 2px; }
.std-meta { font-size: 12px; color: #526075; }

.equip-list { display: flex; flex-direction: column; gap: 10px; }
.equip-item { display: flex; align-items: center; }
.equip-name { font-size: 13px; color: #0B1220; margin-bottom: 2px; }
.equip-meta { font-size: 12px; color: #526075; }
.equip-util { font-size: 11px; color: #526075; margin-top: 3px; }
</style>
