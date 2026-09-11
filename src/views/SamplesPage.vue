<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>检测对象 / 样品</h1>
        <p>从已提交委托读取对象记录；样品编号与场景字段保持原始快照。</p>
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
          placeholder="搜索样品、委托号或委托方"
          prefix-icon="Search"
        /><el-select v-model="domain" clearable placeholder="检测领域"
          ><el-option v-for="d in domains" :key="d" :label="d" :value="d"
        /></el-select>
      </div>
      <el-table :data="filtered" border row-key="id"
        ><el-table-column
          prop="sampleId"
          label="对象 / 样品编号"
          min-width="190"
          ><template #default="{ row }"
            ><strong>{{ row.sampleId }}</strong>
            <div class="meta">{{ row.name }}</div></template
          ></el-table-column
        ><el-table-column label="委托 / 申请" min-width="180"
          ><template #default="{ row }"
            ><span class="mono">{{ row.request.number }}</span>
            <div class="meta">{{ customer(row.request) }}</div></template
          ></el-table-column
        ><el-table-column label="类型" width="120"
          ><template #default="{ row }">{{
            row.request.snapshot.subjectLabel
          }}</template></el-table-column
        ><el-table-column label="场景" min-width="170"
          ><template #default="{ row }"
            >{{ row.request.snapshot.name }}
            <div class="meta">
              {{ row.request.snapshot.domain }} ·
              {{ row.request.snapshot.version }}
            </div></template
          ></el-table-column
        ><el-table-column label="检测项" width="100"
          ><template #default="{ row }"
            >{{ row.request.itemCodes.length }} 项</template
          ></el-table-column
        ><el-table-column label="状态" width="110"
          ><template #default="{ row }"
            ><RuntimeStatus
              :status="row.request.status" /></template></el-table-column
        ><el-table-column label="操作" width="110"
          ><template #default="{ row }"
            ><el-button link type="primary" @click="open(row.request.id)"
              >查看委托</el-button
            ></template
          ></el-table-column
        ><template #empty
          ><el-empty
            :description="
              state.requests.length
                ? '没有匹配的检测对象'
                : '尚无样品记录，请先提交委托'
            " /></template
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
const domain = ref('')
const domains = computed(() =>
  Array.from(new Set(state.value.requests.map((r) => r.snapshot.domain))),
)
const customer = (r: RequestLike) =>
  r.data.customer || r.data.department || '本地演示委托'
const rows = computed(() =>
  state.value.requests.flatMap((request) =>
    request.subjects.map((subject, index) => ({
      id: `${request.id}-${index}`,
      request,
      sampleId:
        subject.sampleCode ||
        subject.pointCode ||
        subject.partNo ||
        subject.name ||
        `${request.number}-${index + 1}`,
      name:
        subject.name || subject.pointName || subject.partName || '未命名对象',
    })),
  ),
)
const filtered = computed(() =>
  rows.value.filter(
    (row) =>
      (!domain.value || row.request.snapshot.domain === domain.value) &&
      (!search.value ||
        `${row.sampleId} ${row.name} ${row.request.number} ${customer(row.request)}`
          .toLowerCase()
          .includes(search.value.toLowerCase())),
  ),
)
function open(id: string) {
  void router.push({
    path: '/app/operations/my-work',
    query: { requestId: id },
  })
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
  background: var(--ui-surface);
  border: 1px solid var(--ui-border);
  border-radius: 6px;
  padding: 16px;
}
.filter-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}
.filter-bar .el-input {
  max-width: 320px;
}
.filter-bar .el-select {
  width: 180px;
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
  .filter-bar {
    flex-wrap: wrap;
  }
  .filter-bar .el-input,
  .filter-bar .el-select {
    width: 100%;
    max-width: none;
  }
}
</style>
