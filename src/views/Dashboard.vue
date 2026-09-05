<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">实验室工作台</h1>
        <div class="page-subtitle">华东食品检测中心 · {{ today }}</div>
      </div>
      <div class="page-actions">
        <el-button>导出报表</el-button>
        <el-button type="primary" @click="$router.push('/app/operations/requests')">
          新建委托
        </el-button>
      </div>
    </div>

    <div class="kpi-row">
      <div class="kpi-card" v-for="kpi in kpis" :key="kpi.label">
        <div class="kpi-label">{{ kpi.label }}</div>
        <div class="kpi-value">{{ kpi.value }}</div>
        <div class="kpi-change" :class="kpi.tone">{{ kpi.change }}</div>
      </div>
    </div>

    <div class="dashboard-grid">
      <section class="panel span-2">
        <div class="panel-header">
          <span class="panel-title">今日任务</span>
          <el-button link type="primary" size="small" @click="$router.push('/app/operations/tasks')">查看全部</el-button>
        </div>
        <el-table :data="todayTasks" size="small">
          <el-table-column prop="id" label="任务编号" width="138" />
          <el-table-column prop="name" label="检测项目" min-width="180" />
          <el-table-column prop="sample" label="检测对象 / 样品" width="140" />
          <el-table-column prop="assignee" label="执行人" width="90" />
          <el-table-column prop="deadline" label="截止时间" width="100" />
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="statusType(row.status)" size="small" effect="light">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </section>

      <section class="panel">
        <div class="panel-header">
          <span class="panel-title">待审核</span>
          <span class="count-text">5 项</span>
        </div>
        <div class="list-stack">
          <button
            class="review-item list-row-button"
            v-for="r in pendingReviews"
            :key="r.id"
            type="button"
            @click="$router.push('/app/operations/review')"
          >
            <div class="list-main">
              <div class="list-title">{{ r.name }}</div>
              <div class="list-meta">{{ r.type }} · {{ r.submitter }}</div>
            </div>
            <el-tag :type="r.urgency === '紧急' ? 'danger' : 'info'" size="small" effect="light">{{ r.urgency }}</el-tag>
          </button>
        </div>
      </section>

      <section class="panel">
        <div class="panel-header">
          <span class="panel-title">AI 推荐事项</span>
          <span class="ai-label"><el-icon><Cpu /></el-icon> AI 辅助</span>
        </div>
        <div class="list-stack">
          <div class="recommendation-row" v-for="a in aiRecs" :key="a.id">
            <el-icon class="recommendation-icon" size="16"><component :is="a.icon" /></el-icon>
            <div class="list-main">
              <div class="list-title">{{ a.title }}</div>
              <div class="list-meta">{{ a.desc }}</div>
            </div>
            <el-button link type="primary" size="small">处理</el-button>
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="panel-header">
          <span class="panel-title">交期风险</span>
          <span class="danger-count">3 条风险</span>
        </div>
        <div class="list-stack">
          <div class="risk-row" v-for="r in risks" :key="r.id">
            <div class="list-main">
              <div class="list-title">{{ r.name }}</div>
              <div class="list-meta">{{ r.client }} · 应交 {{ r.due }}</div>
            </div>
            <el-tag type="danger" size="small" effect="light">{{ r.delay }}</el-tag>
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="panel-header">
          <span class="panel-title">标准更新提醒</span>
          <el-button link type="primary" size="small" @click="$router.push('/app/assets/standards')">管理</el-button>
        </div>
        <div class="list-stack">
          <div class="standard-row" v-for="s in stdUpdates" :key="s.id">
            <span class="reference-tag">{{ s.code }}</span>
            <div class="list-main">
              <div class="list-title">{{ s.name }}</div>
              <div class="list-meta">新版 {{ s.newVersion }} · {{ s.date }} 生效</div>
            </div>
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="panel-header">
          <span class="panel-title">设备占用状态</span>
          <el-button link type="primary" size="small" @click="$router.push('/app/resources/equipment')">详情</el-button>
        </div>
        <div class="list-stack">
          <div class="equipment-row" v-for="e in equipment" :key="e.id">
            <div class="list-main">
              <div class="list-title">{{ e.name }}</div>
              <div class="list-meta">{{ e.model }}</div>
            </div>
            <div class="equipment-status">
              <el-tag :type="equipmentStatusType(e.status)" size="small" effect="light">{{ e.status }}</el-tag>
              <div class="util-text">使用率 {{ e.util }}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Calendar, DocumentChecked, TrendCharts } from '@element-plus/icons-vue'

const today = new Date().toLocaleDateString('zh-CN', {
  month: 'long',
  day: 'numeric',
  weekday: 'long',
})

const kpis = [
  { label: '今日委托', value: '12', change: '+3 较昨日', tone: 'positive' },
  { label: '在检任务', value: '47', change: '进行中' },
  { label: '待审核', value: '5', change: '需处理', tone: 'warning' },
  { label: '今日完成', value: '8', change: '+2 较昨日', tone: 'positive' },
  { label: '交期预警', value: '3', change: '高风险', tone: 'danger' },
  { label: '本月报告', value: '156', change: '已签发' },
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
  { id: 4, name: '新能源电池容量保持率测试', type: 'AI 辅助审核', submitter: '王芳', urgency: '普通' },
]

const aiRecs = [
  { id: 1, icon: DocumentChecked, title: '标准版本更新建议', desc: 'GB 5009.12-2023 已生效，3 个检测项方法需更新' },
  { id: 2, icon: Calendar, title: '任务调度优化', desc: 'ICP-MS 设备明日 10:00–14:00 建议集中安排重金属检测' },
  { id: 3, icon: TrendCharts, title: '结果异常识别', desc: 'TASK-1198 镉含量结果偏高，建议复检确认' },
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
  const map: Record<string, 'primary' | 'info' | 'success' | 'warning' | 'danger'> = {
    进行中: 'primary',
    待开始: 'info',
    已完成: 'success',
    暂停: 'warning',
  }
  return map[status] || 'info'
}

function equipmentStatusType(status: string) {
  const map: Record<string, 'primary' | 'info' | 'success' | 'warning' | 'danger'> = {
    使用中: 'primary',
    空闲: 'success',
    维护中: 'warning',
    离线: 'info',
  }
  return map[status] || 'info'
}
</script>

<style scoped>
.page {
  padding: 24px 32px 32px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}

.page-title {
  margin: 0 0 4px;
  font-size: 22px;
  line-height: 1.35;
  font-weight: 600;
  color: var(--ui-text);
}

.page-subtitle {
  font-size: 13px;
  color: var(--ui-text-secondary);
}

.page-actions {
  display: flex;
  gap: 8px;
}

.kpi-row {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.kpi-card,
.panel {
  background: var(--ui-surface);
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius-panel);
  box-shadow: none;
}

.kpi-card {
  padding: 14px 16px;
}

.kpi-label {
  font-size: 12px;
  color: var(--ui-text-secondary);
  margin-bottom: 6px;
}

.kpi-value {
  font-size: 24px;
  line-height: 1.2;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--ui-text);
  margin-bottom: 4px;
}

.kpi-change {
  font-size: 12px;
  color: var(--ui-text-tertiary);
}

.kpi-change.positive { color: var(--ui-success); }
.kpi-change.warning { color: var(--ui-warning); }
.kpi-change.danger { color: var(--ui-danger); }

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  align-items: start;
}

.panel {
  padding: 16px;
  min-width: 0;
}

.panel.span-2 {
  grid-column: span 2;
}

.panel-header {
  min-height: 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--ui-text);
}

.count-text,
.danger-count,
.ai-label {
  font-size: 12px;
  font-weight: 500;
}

.count-text {
  color: var(--ui-text-tertiary);
}

.danger-count {
  color: var(--ui-danger);
}

.ai-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--ui-action-text);
  background: var(--ui-selected-bg);
  border: 1px solid #D6E6FF;
  border-radius: var(--ui-radius-tag);
  padding: 2px 6px;
}

.list-stack {
  display: flex;
  flex-direction: column;
}

.review-item,
.recommendation-row,
.risk-row,
.standard-row,
.equipment-row {
  min-height: 52px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-top: 1px solid var(--ui-border-subtle);
}

.list-stack > :first-child {
  border-top: none;
}

.list-row-button {
  width: 100%;
  padding: 0;
  border-right: 0;
  border-bottom: 0;
  border-left: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.list-row-button:hover {
  background: var(--ui-surface-muted);
}

.list-row-button:focus-visible {
  outline: 2px solid var(--ui-action-text);
  outline-offset: -2px;
}

.list-main {
  flex: 1;
  min-width: 0;
}

.list-title {
  font-size: 13px;
  line-height: 1.45;
  color: var(--ui-text);
  margin-bottom: 2px;
}

.list-meta {
  font-size: 12px;
  line-height: 1.45;
  color: var(--ui-text-secondary);
}

.recommendation-icon {
  color: var(--ui-text-tertiary);
  flex-shrink: 0;
}

.reference-tag {
  min-width: 104px;
  max-width: 122px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 3px 7px;
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius-tag);
  background: var(--ui-surface-muted);
  color: var(--ui-text-secondary);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.equipment-status {
  text-align: right;
  flex-shrink: 0;
}

.util-text {
  margin-top: 3px;
  font-size: 11px;
  color: var(--ui-text-tertiary);
  font-variant-numeric: tabular-nums;
}

@media (max-width: 1366px) {
  .page {
    padding: 20px 24px 28px;
  }

  .kpi-row {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .dashboard-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .panel.span-2 {
    grid-column: span 1;
  }
}
</style>
