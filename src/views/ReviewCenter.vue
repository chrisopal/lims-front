<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>审核中心</h1>
        <p>从本地运行时读取待审核节点；决定会留下可追溯的审核记录。</p>
      </div>
      <el-button @click="reload">刷新</el-button>
    </header>
    <LocalDemoNotice /><el-alert
      v-if="error || actionError"
      :title="error || actionError"
      type="error"
      :closable="false"
      show-icon
    />
    <div class="review-layout">
      <section class="queue panel">
        <div class="section-title">
          待处理审核 <span>{{ queue.length }}</span>
        </div>
        <button
          v-for="item in queue"
          :key="item.work.id"
          type="button"
          class="queue-item"
          :class="{ selected: selectedId === item.work.id }"
          @click="select(item.work.id)"
        >
          <div>
            <strong>{{ item.node.label }}</strong>
            <div class="meta mono">{{ item.request.number }}</div>
            <div class="meta">
              {{ item.request.snapshot.name }} · {{ customer(item.request) }}
            </div>
          </div>
          <RuntimeStatus :status="item.work.status" /></button
        ><el-empty
          v-if="!queue.length"
          description="当前没有待审核节点；完成检测节点后会在这里出现"
          :image-size="70"
        />
      </section>
      <section class="review-main panel" v-if="selected">
        <div class="report-toolbar">
          <div>
            <h2>{{ selected.node.label }}</h2>
            <p class="meta">
              {{ selected.request.number }} ·
              {{ selected.request.snapshot.name }}
              {{ selected.request.snapshot.version }}
            </p>
          </div>
          <RuntimeStatus :status="selected.work.status" />
        </div>
        <el-descriptions :column="2" border size="small"
          ><el-descriptions-item
            v-for="field in selected.request.snapshot.requestFields"
            :key="field.key"
            :label="field.label"
            >{{ selected.request.data[field.key] || '—' }}</el-descriptions-item
          ><el-descriptions-item label="对象数量">{{
            selected.request.subjects.length
          }}</el-descriptions-item
          ><el-descriptions-item label="检测项">{{
            selected.request.itemCodes.join('、')
          }}</el-descriptions-item></el-descriptions
        >
        <div class="record-section">
          <h3>审核节点记录</h3>
          <SchemaFields
            :fields="selected.node.fields"
            v-model="reviewValues"
            prefix="review"
            :disabled="selected.work.status !== 'IN_PROGRESS' || busy"
          /><el-checkbox
            v-if="selected.node.requiresConfirmation"
            v-model="confirmed"
            :disabled="selected.work.status !== 'IN_PROGRESS' || busy"
            >我已核对当前节点记录（本地演示，不代表授权签字）</el-checkbox
          >
        </div>
        <el-input
          v-model="comment"
          type="textarea"
          :rows="3"
          maxlength="4000"
          show-word-limit
          placeholder="填写审核意见；退回或驳回时请说明原因"
        />
        <div class="actions">
          <el-button
            v-if="selected.work.status === 'READY'"
            type="primary"
            :loading="busy"
            @click="start"
            >开始审核</el-button
          ><template v-else-if="selected.work.status === 'IN_PROGRESS'"
            ><el-button
              type="success"
              :loading="busy"
              @click="decide('APPROVE')"
              >审核通过并推进</el-button
            ><el-button
              type="warning"
              plain
              :loading="busy"
              @click="decide('RETURN')"
              >退回返工</el-button
            ><el-button
              type="danger"
              plain
              :loading="busy"
              @click="decide('REJECT')"
              >驳回</el-button
            ></template
          ><el-button v-else @click="openWork(selected.work.id)"
            >查看节点记录</el-button
          >
        </div>
      </section>
      <section v-else class="review-main panel">
        <el-empty description="从左侧选择审核节点" />
      </section>
    </div>
    <section class="panel history">
      <div class="section-title">最近审核记录</div>
      <el-table :data="recentReviews" border size="small"
        ><el-table-column prop="at" label="时间" width="180"
          ><template #default="{ row }">{{
            format(row.at)
          }}</template></el-table-column
        ><el-table-column label="委托" min-width="180"
          ><template #default="{ row }">{{
            requestOf(row.requestId)?.number || row.requestId
          }}</template></el-table-column
        ><el-table-column prop="decision" label="决定" width="110"
          ><template #default="{ row }"
            ><el-tag :type="decisionType(row.decision)" size="small">{{
              decisionLabel(row.decision)
            }}</el-tag></template
          ></el-table-column
        ><el-table-column
          prop="comment"
          label="意见"
          min-width="240" /><template #empty
          ><el-empty description="暂无审核记录" /></template
      ></el-table>
    </section>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useLocalRuntime } from '@/composables/useLocalRuntime'
import { clone, validateFields } from '@/runtime/local-runtime'
import type { ReviewDecision, Values } from '@/runtime/local-runtime'
import { can } from '@/composables/useDemoSession'
import LocalDemoNotice from '@/components/runtime/LocalDemoNotice.vue'
import RuntimeStatus from '@/components/runtime/RuntimeStatus.vue'
import SchemaFields from '@/components/runtime/SchemaFields.vue'
type RequestLike = { data: Readonly<Record<string, string>> }
const router = useRouter()
const { state, error, reload, repository } = useLocalRuntime()
const selectedId = ref('')
const reviewValues = ref<Values>({})
const comment = ref('')
const confirmed = ref(false)
const busy = ref(false)
const actionError = ref('')
const customer = (r: RequestLike) =>
  r.data.customer || r.data.department || '本地演示委托'
const tasks = computed(() =>
  state.value.workItems.map((work) => {
    const request = state.value.requests.find((r) => r.id === work.requestId)!
    return { work, request, node: request.snapshot.nodes[work.nodeIndex] }
  }),
)
const queue = computed(() =>
  tasks.value.filter(
    (item) =>
      (item.work.status === 'READY' || item.work.status === 'IN_PROGRESS') &&
      item.node.renderer === 'review',
  ),
)
const selected = computed(
  () =>
    queue.value.find((item) => item.work.id === selectedId.value) ||
    queue.value[0],
)
const recentReviews = computed(() =>
  state.value.reviews.slice().reverse().slice(0, 20),
)
watch(
  selected,
  (item) => {
    const changed = !!item && item.work.id !== selectedId.value
    if (!item) {
      selectedId.value = ''
      reviewValues.value = {}
      confirmed.value = false
      comment.value = ''
      return
    }
    selectedId.value = item.work.id
    if (changed) {
      reviewValues.value = clone(item.work.values)
      confirmed.value = item.work.confirmed
      comment.value = ''
    }
  },
  { immediate: true },
)
function select(id: string) {
  selectedId.value = id
  const item = queue.value.find((x) => x.work.id === id)
  if (item) {
    reviewValues.value = clone(item.work.values)
    confirmed.value = item.work.confirmed
    comment.value = ''
  }
}
function requestOf(id: string) {
  return state.value.requests.find((r) => r.id === id)
}
function format(s: string) {
  return new Date(s).toLocaleString('zh-CN')
}
function decisionLabel(d: string) {
  return d === 'APPROVE' ? '通过' : d === 'RETURN' ? '退回' : '驳回'
}
function decisionType(d: string) {
  return d === 'APPROVE' ? 'success' : d === 'RETURN' ? 'warning' : 'danger'
}
function openWork(id: string) {
  void router.push(`/app/operations/work-items/${encodeURIComponent(id)}`)
}
async function run(fn: () => Promise<void>) {
  if (busy.value) return
  busy.value = true
  actionError.value = ''
  try {
    await fn()
    reload()
  } catch (e) {
    actionError.value = e instanceof Error ? e.message : '操作失败'
  } finally {
    busy.value = false
  }
}
async function start() {
  const item = selected.value
  if (item && !can('review.execute')) {
    actionError.value = '当前演示角色没有审核权限'
    return
  }
  if (item)
    await run(async () => {
      const updated = await repository.startWork(
        item.work.id,
        item.work.revision,
      )
      reviewValues.value = clone(updated.values)
      confirmed.value = updated.confirmed
    })
}
async function decide(decision: ReviewDecision) {
  const item = selected.value
  if (!item) return
  if (!can('review.execute')) {
    actionError.value = '当前演示角色没有审核权限'
    return
  }
  const issues = validateFields(
    item.node.fields,
    reviewValues.value,
    'review',
    1,
  )
  if (
    decision === 'APPROVE' &&
    (issues.length || (item.node.requiresConfirmation && !confirmed.value))
  ) {
    actionError.value = issues[0]?.message || '请确认已核对当前节点记录'
    return
  }
  const decisionComment = comment.value
  await run(async () => {
    const revision = item.work.revision
    if (item.work.status !== 'IN_PROGRESS') return
    const saved = await repository.saveWork(
      item.work.id,
      revision,
      reviewValues.value,
      confirmed.value,
      false,
    )
    await repository.reviewWork(
      item.work.id,
      saved.revision,
      decision,
      decisionComment,
    )
    comment.value = ''
    reviewValues.value = {}
    confirmed.value = false
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
.review-layout {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}
.panel {
  background: var(--ui-surface);
  border: 1px solid var(--ui-border);
  border-radius: 6px;
  padding: 16px;
}
.queue {
  min-height: 420px;
}
.section-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
}
.section-title span {
  color: var(--ui-action-text);
  margin-left: 6px;
}
.queue-item {
  width: 100%;
  display: flex;
  justify-content: space-between;
  gap: 8px;
  text-align: left;
  padding: 12px 8px;
  border: 0;
  border-top: 1px solid var(--ui-border-subtle);
  background: transparent;
  color: inherit;
  cursor: pointer;
}
.queue-item:hover,
.queue-item.selected {
  background: var(--ui-selected-bg);
}
.meta {
  font-size: 12px;
  color: var(--ui-text-secondary);
  margin-top: 4px;
}
.mono {
  font-family: var(--ui-font-mono);
}
.review-main {
  min-width: 0;
}
.report-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}
.report-toolbar h2 {
  margin: 0;
  font-size: 18px;
}
.record-section {
  margin: 20px 0;
}
.record-section h3 {
  font-size: 14px;
  margin: 0 0 10px;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 16px;
}
.history {
  padding-bottom: 10px;
}
@media (max-width: 900px) {
  .review-layout {
    grid-template-columns: 1fr;
  }
  .queue {
    min-height: auto;
    max-height: 330px;
    overflow: auto;
  }
}
@media (max-width: 767px) {
  .page {
    padding: 16px;
  }
  .page-header {
    flex-direction: column;
    gap: 12px;
  }
}
</style>
