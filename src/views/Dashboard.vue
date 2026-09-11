<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>实验室工作台</h1>
        <div class="page-subtitle">本地运行时概览 · {{ today }}</div>
      </div>
      <div class="page-actions">
        <el-button @click="reload">刷新</el-button
        ><el-button
          type="primary"
          @click="$router.push('/app/operations/requests')"
          >新建委托</el-button
        >
      </div>
    </header>
    <LocalDemoNotice /><el-alert
      v-if="error"
      :title="error"
      type="error"
      :closable="false"
      show-icon
    />
    <div class="kpi-row">
      <div v-for="kpi in kpis" :key="kpi.label" class="kpi-card">
        <div class="kpi-label">{{ kpi.label }}</div>
        <div class="kpi-value">{{ kpi.value }}</div>
        <div class="kpi-change" :class="kpi.tone">{{ kpi.detail }}</div>
      </div>
    </div>
    <div class="dashboard-grid">
      <section class="panel span-2">
        <div class="panel-header">
          <span class="panel-title">最近任务</span
          ><el-button
            link
            type="primary"
            size="small"
            @click="$router.push('/app/operations/tasks')"
            >查看全部</el-button
          >
        </div>
        <el-table :data="tasks.slice(0, 6)" size="small"
          ><el-table-column label="任务编号" min-width="150"
            ><template #default="{ row }"
              ><span class="mono">{{ row.id.slice(0, 12) }}</span></template
            ></el-table-column
          ><el-table-column
            prop="node.label"
            label="节点"
            min-width="150" /><el-table-column label="委托" min-width="170"
            ><template #default="{ row }"
              >{{ row.request.number }}
              <div class="meta">{{ customer(row.request) }}</div></template
            ></el-table-column
          ><el-table-column label="状态" width="100"
            ><template #default="{ row }"
              ><RuntimeStatus
                :status="row.status" /></template></el-table-column
          ><template #empty><el-empty description="尚无本地任务" /></template
        ></el-table>
      </section>
      <section class="panel">
        <div class="panel-header">
          <span class="panel-title">待审核</span
          ><span class="count-text">{{ reviewQueue.length }} 项</span>
        </div>
        <button
          v-for="item in reviewQueue.slice(0, 5)"
          :key="item.work.id"
          class="list-row-button review-item"
          type="button"
          @click="$router.push('/app/operations/review')"
        >
          <div class="list-main">
            <div class="list-title">{{ item.node.label }}</div>
            <div class="list-meta">
              {{ item.request.number }} · {{ customer(item.request) }}
            </div>
          </div>
          <RuntimeStatus :status="item.work.status" /></button
        ><el-empty
          v-if="!reviewQueue.length"
          description="暂无待审核节点"
          :image-size="60"
        />
      </section>
      <section class="panel">
        <div class="panel-header">
          <span class="panel-title">交期风险</span
          ><span class="danger-count">{{ overdue.length }} 条</span>
        </div>
        <div v-for="r in overdue" :key="r.id" class="risk-row">
          <div class="list-main">
            <div class="list-title">{{ r.number }}</div>
            <div class="list-meta">
              {{ customer(r) }} · 应交 {{ r.data.dueDate }}
            </div>
          </div>
          <el-tag type="danger" size="small" effect="light">已超期</el-tag>
        </div>
        <el-empty
          v-if="!overdue.length"
          description="暂无逾期委托"
          :image-size="60"
        />
      </section>
      <section class="panel">
        <div class="panel-header">
          <span class="panel-title">本地报告</span
          ><el-button
            link
            type="primary"
            size="small"
            @click="$router.push('/app/operations/reports')"
            >查看</el-button
          >
        </div>
        <div class="report-summary">
          <div class="report-number">{{ state.reports.length }}</div>
          <div>
            <div class="list-title">已生成报告预览</div>
            <div class="list-meta">源自已完成本地流程</div>
          </div>
        </div>
        <el-alert title="不代表正式签发" type="info" :closable="false" />
      </section>
      <section class="panel">
        <div class="panel-header">
          <span class="panel-title">流程状态</span
          ><el-button
            link
            type="primary"
            size="small"
            @click="$router.push('/app/admin/audit')"
            >审计</el-button
          >
        </div>
        <div class="status-lines">
          <div>
            <span>委托总数</span><strong>{{ state.requests.length }}</strong>
          </div>
          <div>
            <span>已完成委托</span><strong>{{ completedRequests }}</strong>
          </div>
          <div>
            <span>操作记录</span><strong>{{ state.events.length }}</strong>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useLocalRuntime } from '@/composables/useLocalRuntime'
import LocalDemoNotice from '@/components/runtime/LocalDemoNotice.vue'
import RuntimeStatus from '@/components/runtime/RuntimeStatus.vue'
type RequestLike = { data: Readonly<Record<string, string>> }
const { state, error, reload } = useLocalRuntime()
const today = new Date().toLocaleDateString('zh-CN', {
  month: 'long',
  day: 'numeric',
  weekday: 'long',
})
const customer = (r: RequestLike) =>
  r.data.customer || r.data.department || '本地演示委托'
const tasks = computed(() =>
  state.value.workItems.map((work) => {
    const request = state.value.requests.find((r) => r.id === work.requestId)!
    return {
      work,
      request,
      node: request.snapshot.nodes[work.nodeIndex],
      id: work.id,
      status: work.status,
    }
  }),
)
const reviewQueue = computed(() =>
  tasks.value.filter(
    (item) =>
      (item.status === 'READY' || item.status === 'IN_PROGRESS') &&
      item.node.renderer === 'review',
  ),
)
const completedRequests = computed(
  () => state.value.requests.filter((r) => r.status === 'COMPLETED').length,
)
const overdue = computed(() =>
  state.value.requests.filter(
    (r) =>
      r.status === 'IN_PROGRESS' &&
      r.data.dueDate &&
      r.data.dueDate < new Date().toISOString().slice(0, 10),
  ),
)
const kpis = computed(() => [
  {
    label: '委托总数',
    value: state.value.requests.length,
    detail: '本地已提交记录',
  },
  {
    label: '待处理任务',
    value: tasks.value.filter((t) => t.status === 'READY').length,
    detail: '等待开始',
  },
  {
    label: '进行中任务',
    value: tasks.value.filter((t) => t.status === 'IN_PROGRESS').length,
    detail: '正在处理',
  },
  {
    label: '待审核',
    value: reviewQueue.value.length,
    detail: '需要人工决定',
    tone: 'warning',
  },
  {
    label: '逾期委托',
    value: overdue.value.length,
    detail: '根据期望完成日期',
    tone: 'danger',
  },
  {
    label: '报告预览',
    value: state.value.reports.length,
    detail: '本地草稿记录',
  },
])
</script>
<style scoped>
.page {
  padding: 24px 32px;
  color: var(--ui-text);
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 18px;
}
.page-header h1 {
  margin: 0 0 4px;
  font-size: 22px;
  font-weight: 600;
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
  font-weight: 600;
  line-height: 1.2;
  margin-bottom: 4px;
}
.kpi-change {
  font-size: 12px;
  color: var(--ui-text-secondary);
}
.kpi-change.warning,
.count-text {
  color: var(--ui-warning);
}
.kpi-change.danger,
.danger-count {
  color: var(--ui-danger);
}
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}
.panel {
  padding: 16px;
}
.span-2 {
  grid-column: span 2;
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.panel-title {
  font-size: 14px;
  font-weight: 600;
}
.list-row-button {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  text-align: left;
  padding: 11px 0;
  border: 0;
  border-top: 1px solid var(--ui-border-subtle);
  background: transparent;
  color: inherit;
  cursor: pointer;
}
.list-row-button:hover {
  background: var(--ui-selected-bg);
}
.list-main {
  min-width: 0;
}
.list-title {
  font-size: 13px;
}
.list-meta,
.meta {
  font-size: 12px;
  color: var(--ui-text-secondary);
  margin-top: 4px;
}
.risk-row,
.report-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 0;
  border-top: 1px solid var(--ui-border-subtle);
}
.report-summary {
  justify-content: flex-start;
  gap: 14px;
}
.report-number {
  font-size: 28px;
  font-weight: 600;
  color: var(--ui-brand);
}
.status-lines > div {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-top: 1px solid var(--ui-border-subtle);
  font-size: 13px;
}
.status-lines span {
  color: var(--ui-text-secondary);
}
.status-lines strong,
.mono {
  font-family: var(--ui-font-mono);
}
.mono {
  font-size: 12px;
}
@media (max-width: 1150px) {
  .kpi-row {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (max-width: 850px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  .span-2 {
    grid-column: auto;
  }
}
@media (max-width: 767px) {
  .page {
    padding: 16px;
  }
  .page-header {
    flex-direction: column;
  }
  .kpi-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
.kpi-card,
.panel {
  min-width: 0;
  overflow: hidden;
}
.panel :deep(.el-table) {
  max-width: 100%;
}
</style>
