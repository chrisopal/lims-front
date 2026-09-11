<template>
  <div class="page runtime-work-list">
    <header class="page-header">
      <div>
        <h1>我的工作</h1>
        <p>由本地委托生成的工作项 · 不是静态任务计数</p>
      </div>
      <el-button type="primary" @click="router.push('/app/operations/requests')"
        >新建委托 / 申请</el-button
      >
    </header>
    <LocalDemoNotice />
    <el-alert
      v-if="error"
      :title="error"
      type="error"
      :closable="false"
      show-icon
    />
    <template v-else>
      <div class="work-summary">
        <span
          >委托 <strong>{{ state.requests.length }}</strong></span
        ><span
          >待处理 <strong>{{ counts.READY }}</strong></span
        ><span
          >进行中 <strong>{{ counts.IN_PROGRESS }}</strong></span
        ><span
          >已完成节点 <strong>{{ counts.COMPLETED }}</strong></span
        ><span
          >已退回 <strong>{{ counts.RETURNED }}</strong></span
        >
      </div>
      <div v-if="requestId" class="scope-note">
        仅显示当前委托的节点。<el-button
          link
          type="primary"
          @click="router.replace('/app/operations/my-work')"
          >查看全部委托</el-button
        >
      </div>
      <div class="work-tabs" role="tablist" aria-label="工作状态">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="work-tab"
          :class="{ active: activeTab === tab.key }"
          role="tab"
          :aria-selected="activeTab === tab.key"
          @click="activeTab = tab.key"
        >
          {{ tab.label }} <span>{{ tabCount(tab.key) }}</span>
        </button>
      </div>
      <div class="filter-bar">
        <el-input
          v-model="search"
          placeholder="搜索委托号 / 节点 / 场景"
          clearable
          prefix-icon="Search"
          aria-label="搜索工作项"
        /><el-select
          v-model="nodeFilter"
          placeholder="全部节点类型"
          clearable
          aria-label="节点类型"
          ><el-option
            v-for="node in nodeTypes"
            :key="node.type"
            :label="node.label"
            :value="node.type" /></el-select
        ><el-button @click="reload">刷新</el-button>
      </div>
      <div class="table-wrap">
        <el-table
          :data="filteredTasks"
          border
          row-key="id"
          class="runtime-work-table"
        >
          <el-table-column label="工作项" min-width="190"
            ><template #default="{ row }"
              ><el-button link type="primary" @click="openWork(row.id)">{{
                row.node.label
              }}</el-button>
              <div class="meta mono">{{ row.id.slice(0, 8) }}</div></template
            ></el-table-column
          >
          <el-table-column label="委托 / 申请" min-width="190"
            ><template #default="{ row }"
              ><strong class="mono">{{ row.request.number }}</strong>
              <div class="meta">
                {{
                  row.request.data.customer ||
                  row.request.data.department ||
                  '演示委托'
                }}
              </div></template
            ></el-table-column
          >
          <el-table-column label="场景 / 绑定版本" min-width="210"
            ><template #default="{ row }"
              ><div>{{ row.request.snapshot.name }}</div>
              <span class="version-ref">{{
                row.request.snapshot.version
              }}</span></template
            ></el-table-column
          >
          <el-table-column label="对象 / 检测项" width="115"
            ><template #default="{ row }"
              >{{ row.request.subjects.length }} /
              {{ row.request.itemCodes.length }}</template
            ></el-table-column
          >
          <el-table-column label="状态" width="120"
            ><template #default="{ row }"
              ><RuntimeStatus :status="row.status" /></template
          ></el-table-column>
          <el-table-column label="创建时间" min-width="160"
            ><template #default="{ row }">{{
              new Date(row.createdAt).toLocaleString('zh-CN')
            }}</template></el-table-column
          >
          <el-table-column label="操作" width="125" fixed="right"
            ><template #default="{ row }"
              ><el-button link type="primary" @click="openWork(row.id)">{{
                row.status === 'COMPLETED' ? '查看记录' : '打开工作台'
              }}</el-button></template
            ></el-table-column
          >
          <template #empty
            ><el-empty
              :description="
                state.workItems.length
                  ? '没有符合筛选条件的工作项'
                  : '尚无本地工作项。请先创建并提交一份演示委托。'
              "
              :image-size="56"
          /></template>
        </el-table>
      </div>
    </template>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLocalRuntime } from '@/composables/useLocalRuntime'
import RuntimeStatus from '@/components/runtime/RuntimeStatus.vue'
import LocalDemoNotice from '@/components/runtime/LocalDemoNotice.vue'
const router = useRouter()
const route = useRoute()
const { state, error, reload } = useLocalRuntime()
const activeTab = ref('open')
const search = ref('')
const nodeFilter = ref('')
const requestId = computed(() =>
  typeof route.query.requestId === 'string' ? route.query.requestId : '',
)
const tasks = computed(() =>
  state.value.workItems.map((w) => {
    const request = state.value.requests.find((r) => r.id === w.requestId)!
    return { ...w, request, node: request.snapshot.nodes[w.nodeIndex] }
  }),
)
const scoped = computed(() =>
  tasks.value.filter(
    (w) => !requestId.value || w.requestId === requestId.value,
  ),
)
const counts = computed(() => ({
  READY: tasks.value.filter((w) => w.status === 'READY').length,
  IN_PROGRESS: tasks.value.filter((w) => w.status === 'IN_PROGRESS').length,
  COMPLETED: tasks.value.filter((w) => w.status === 'COMPLETED').length,
  RETURNED: tasks.value.filter((w) => w.status === 'RETURNED').length,
}))
const tabs = [
  { key: 'open', label: '待办与进行中' },
  { key: 'completed', label: '已完成' },
  { key: 'all', label: '全部' },
]
const matchesTab = (status: string, key: string) =>
  key === 'all' ||
  (key === 'completed' ? status === 'COMPLETED' : status !== 'COMPLETED')
const tabCount = (key: string) =>
  scoped.value.filter((w) => matchesTab(w.status, key)).length
const nodeTypes = computed(() =>
  Array.from(
    new Map(
      tasks.value.map((w) => [
        w.node.nodeType,
        { type: w.node.nodeType, label: w.node.label },
      ]),
    ).values(),
  ),
)
const filteredTasks = computed(() =>
  scoped.value
    .filter(
      (w) =>
        matchesTab(w.status, activeTab.value) &&
        (!nodeFilter.value || nodeFilter.value === w.node.nodeType) &&
        (!search.value ||
          `${w.request.number} ${w.node.label} ${w.request.snapshot.name} ${w.request.data.customer || ''}`
            .toLowerCase()
            .includes(search.value.toLowerCase())),
    )
    .slice()
    .reverse(),
)
function openWork(id: string) {
  void router.push(`/app/operations/work-items/${encodeURIComponent(id)}`)
}
</script>
<style scoped>
.page {
  padding: 24px 32px;
  min-width: 0;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}
.page-header h1 {
  font-size: 24px;
  margin: 0;
  font-weight: 600;
}
.page-header p {
  font-size: 13px;
  color: var(--ui-text-secondary);
  margin: 4px 0 0;
}
.work-summary {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  padding: 16px 0;
  color: var(--ui-text-secondary);
  font-size: 13px;
}
.work-summary strong {
  color: var(--ui-text);
  font-size: 20px;
  margin-left: 8px;
  font-variant-numeric: tabular-nums;
}
.scope-note {
  font-size: 13px;
  margin-bottom: 12px;
}
.work-tabs {
  display: flex;
  gap: 0;
  border: 1px solid var(--ui-border);
  border-bottom: 0;
  background: var(--ui-surface);
  padding: 0 12px;
  overflow-x: auto;
}
.work-tab {
  padding: 12px 16px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: none;
  color: var(--ui-text-secondary);
  font: inherit;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
}
.work-tab.active {
  color: var(--ui-action-text);
  border-bottom-color: var(--ui-brand);
}
.work-tab span {
  margin-left: 6px;
  font-variant-numeric: tabular-nums;
}
.filter-bar {
  display: flex;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--ui-border);
  background: var(--ui-surface);
}
.filter-bar .el-input {
  max-width: 300px;
}
.filter-bar .el-select {
  max-width: 200px;
}
.table-wrap {
  max-width: 100%;
  overflow-x: auto;
}
.meta {
  font-size: 12px;
  color: var(--ui-text-secondary);
  margin-top: 3px;
}
.mono {
  font-family: var(--ui-font-mono);
  font-size: 12px;
}
.version-ref {
  display: inline-block;
  font-size: 12px;
  background: var(--ui-surface-muted);
  border: 1px solid var(--ui-border);
  border-radius: 3px;
  padding: 1px 6px;
  margin-top: 4px;
  color: var(--ui-text-secondary);
}
@media (max-width: 767px) {
  .page {
    padding: 16px;
  }
  .page-header {
    flex-direction: column;
  }
  .filter-bar {
    flex-wrap: wrap;
  }
  .filter-bar .el-input,
  .filter-bar .el-select {
    max-width: 100%;
    width: 100%;
  }
  .work-summary {
    gap: 12px;
  }
  .work-summary strong {
    font-size: 18px;
  }
}
</style>
