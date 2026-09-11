<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>检测任务</h1>
        <p>委托提交后按场景顺序生成的节点任务。</p>
      </div>
      <el-button @click="reload">刷新</el-button>
    </header>
    <LocalDemoNotice /><el-alert
      v-if="error"
      :title="error"
      type="error"
      :closable="false"
      show-icon
    />
    <section class="panel">
      <div class="filter-bar">
        <el-input
          v-model="search"
          clearable
          placeholder="搜索任务、委托号或场景"
          prefix-icon="Search"
        /><el-select v-model="status" clearable placeholder="任务状态"
          ><el-option label="待处理" value="READY" /><el-option
            label="进行中"
            value="IN_PROGRESS" /><el-option
            label="已完成"
            value="COMPLETED" /><el-option
            label="已退回"
            value="RETURNED" /></el-select
        ><el-select v-model="renderer" clearable placeholder="节点能力"
          ><el-option
            v-for="item in renderers"
            :key="item"
            :label="item"
            :value="item"
        /></el-select>
      </div>
      <el-table :data="filtered" border row-key="id"
        ><el-table-column label="任务 / 节点" min-width="210"
          ><template #default="{ row }"
            ><el-button link type="primary" @click="open(row.id)">{{
              row.node.label
            }}</el-button>
            <div class="meta mono">
              {{ row.id.slice(0, 12) }} · {{ row.node.nodeType }}
            </div></template
          ></el-table-column
        ><el-table-column label="委托" min-width="190"
          ><template #default="{ row }"
            ><span class="mono">{{ row.request.number }}</span>
            <div class="meta">{{ customer(row.request) }}</div></template
          ></el-table-column
        ><el-table-column label="场景 / 版本" min-width="190"
          ><template #default="{ row }"
            >{{ row.request.snapshot.name }}
            <div class="meta">{{ row.request.snapshot.version }}</div></template
          ></el-table-column
        ><el-table-column label="对象 / 检测项" width="120"
          ><template #default="{ row }"
            >{{ row.request.subjects.length }} /
            {{ row.request.itemCodes.length }}</template
          ></el-table-column
        ><el-table-column label="状态" width="110"
          ><template #default="{ row }"
            ><RuntimeStatus :status="row.status" /></template></el-table-column
        ><el-table-column prop="createdAt" label="创建时间" min-width="170"
          ><template #default="{ row }">{{
            format(row.createdAt)
          }}</template></el-table-column
        ><template #empty
          ><el-empty description="尚无任务，请先提交委托" /></template
      ></el-table>
    </section>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useLocalRuntime } from '@/composables/useLocalRuntime'
import LocalDemoNotice from '@/components/runtime/LocalDemoNotice.vue'
import RuntimeStatus from '@/components/runtime/RuntimeStatus.vue'
type RequestLike = { data: Readonly<Record<string, string>> }
const router = useRouter()
const { state, error, reload } = useLocalRuntime()
const search = ref('')
const status = ref('')
const renderer = ref('')
const tasks = computed(() =>
  state.value.workItems.map((work) => {
    const request = state.value.requests.find((r) => r.id === work.requestId)!
    return { ...work, request, node: request.snapshot.nodes[work.nodeIndex] }
  }),
)
const renderers = computed(() =>
  Array.from(new Set(tasks.value.map((t) => t.node.renderer))),
)
const customer = (r: RequestLike) =>
  r.data.customer || r.data.department || '本地演示委托'
const format = (s: string) => new Date(s).toLocaleString('zh-CN')
const filtered = computed(() =>
  tasks.value
    .filter(
      (t) =>
        (!status.value || t.status === status.value) &&
        (!renderer.value || t.node.renderer === renderer.value) &&
        (!search.value ||
          `${t.id} ${t.node.label} ${t.request.number} ${t.request.snapshot.name} ${customer(t.request)}`
            .toLowerCase()
            .includes(search.value.toLowerCase())),
    )
    .slice()
    .reverse(),
)
function open(id: string) {
  void router.push(`/app/operations/work-items/${encodeURIComponent(id)}`)
}
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
  margin-bottom: 16px;
}
.page-header h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
}
.page-header p {
  margin: 5px 0 0;
  color: var(--ui-text-secondary);
  font-size: 13px;
}
.panel {
  padding: 16px;
  background: var(--ui-surface);
  border: 1px solid var(--ui-border);
  border-radius: 6px;
}
.filter-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}
.filter-bar .el-input {
  width: 300px;
}
.filter-bar .el-select {
  width: 170px;
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
@media (max-width: 767px) {
  .page {
    padding: 16px;
  }
  .page-header {
    flex-direction: column;
    gap: 12px;
  }
  .filter-bar .el-input,
  .filter-bar .el-select {
    width: 100%;
  }
}
</style>
