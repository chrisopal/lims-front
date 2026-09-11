<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>审计 · 流程时间线</h1>
        <p>当前浏览器运行时的操作记录，便于演示追溯。</p>
      </div>
      <el-button size="small" :disabled="!selectedRequest" @click="download"
        >导出审计记录</el-button
      >
    </header>
    <LocalDemoNotice /><el-alert
      v-if="error"
      :title="error"
      type="error"
      :closable="false"
      show-icon
    />
    <div class="selector-bar">
      <span class="selector-label">委托 / 申请：</span
      ><el-select
        v-model="selectedId"
        placeholder="选择委托"
        size="small"
        style="width: 260px"
        ><el-option
          v-for="request in state.requests"
          :key="request.id"
          :label="`${request.number} · ${request.snapshot.name}`"
          :value="request.id" /></el-select
      ><span v-if="selectedRequest" class="snapshot-tag"
        >{{ selectedRequest.snapshot.version }} ·
        {{ selectedRequest.snapshot.snapshotRef }}</span
      >
    </div>
    <div v-if="selectedRequest" class="audit-layout">
      <section class="timeline-wrap">
        <div
          v-if="events.length"
          v-for="(event, i) in events"
          :key="event.id"
          class="tl-item"
        >
          <div class="tl-left">
            <div :class="['tl-dot', event.type]"></div>
            <div v-if="i < events.length - 1" class="tl-line"></div>
          </div>
          <div class="tl-content">
            <div class="tl-header">
              <span class="tl-event">{{ event.action }}</span
              ><span :class="['tl-type-tag', event.type]">{{
                event.typeLabel
              }}</span>
            </div>
            <div class="tl-meta">
              <span>{{ format(event.at) }}</span
              ><span class="tl-sep">·</span><span>{{ event.targetLabel }}</span>
            </div>
            <div class="tl-detail">{{ event.message }}</div>
            <div class="tl-trace">
              <span class="trace-label">记录 ID</span
              ><span class="trace-val">{{ event.id }}</span>
            </div>
          </div>
        </div>
        <el-empty v-else description="该委托暂无操作记录" />
      </section>
      <aside class="audit-summary">
        <div class="summary-title">流程概要</div>
        <div class="summary-kv">
          <span class="sk">委托号</span
          ><span class="sv mono">{{ selectedRequest.number }}</span>
        </div>
        <div class="summary-kv">
          <span class="sk">场景</span
          ><span class="sv">{{ selectedRequest.snapshot.name }}</span>
        </div>
        <div class="summary-kv">
          <span class="sk">版本快照</span
          ><span class="sv mono small">{{
            selectedRequest.snapshot.version
          }}</span>
        </div>
        <div class="summary-kv">
          <span class="sk">对象 / 检测项</span
          ><span class="sv"
            >{{ selectedRequest.subjects.length }} /
            {{ selectedRequest.itemCodes.length }}</span
          >
        </div>
        <div class="summary-kv">
          <span class="sk">当前状态</span
          ><span class="sv"
            ><RuntimeStatus :status="selectedRequest.status"
          /></span>
        </div>
        <div class="summary-kv">
          <span class="sk">记录数量</span
          ><span class="sv">{{ events.length }}</span>
        </div>
      </aside>
    </div>
    <el-empty v-else description="完成并提交委托后，这里会显示本地流程记录" />
    <section class="configuration-log">
      <header class="page-header">
        <div>
          <h2>配置操作记录</h2>
          <p>场景发布、激活和业务资产维护的本地记录</p>
        </div>
        <el-button
          :disabled="!configurationEvents.length"
          @click="downloadJson('configuration-audit.json', configurationEvents)"
          >导出配置记录</el-button
        >
      </header>
      <el-table :data="configurationEvents" border
        ><el-table-column
          prop="at"
          label="时间"
          min-width="190" /><el-table-column
          prop="action"
          label="动作"
          min-width="190" /><el-table-column
          prop="message"
          label="记录"
          min-width="280" /></el-table
      ><el-empty
        v-if="!configurationEvents.length"
        description="尚未发生配置变更"
      />
    </section>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useScenarioRepository } from '@/composables/useScenarioRepository'
import { useCatalog } from '@/composables/useCatalog'
import { downloadJson } from '@/utils/download'
const scenario = useScenarioRepository()
const catalog = useCatalog()
const configurationEvents = computed(() =>
  [...scenario.state.value.events, ...catalog.state.value.events].sort((a, b) =>
    b.at.localeCompare(a.at),
  ),
)
import { useLocalRuntime } from '@/composables/useLocalRuntime'
import type { LocalEvent } from '@/runtime/local-runtime'
import LocalDemoNotice from '@/components/runtime/LocalDemoNotice.vue'
import RuntimeStatus from '@/components/runtime/RuntimeStatus.vue'
const { state, error } = useLocalRuntime()
const selectedId = ref('')
const selectedRequest = computed(
  () =>
    state.value.requests.find((r) => r.id === selectedId.value) ||
    state.value.requests[0],
)
watch(
  () => state.value.requests,
  (requests) => {
    if (!selectedId.value && requests[0]) selectedId.value = requests[0].id
  },
  { immediate: true },
)
const relatedIds = computed(
  () =>
    new Set(
      state.value.workItems
        .filter((w) => w.requestId === selectedRequest.value?.id)
        .map((w) => w.id),
    ),
)
const events = computed(() =>
  state.value.events
    .filter(
      (e) =>
        e.targetId === selectedRequest.value?.id ||
        relatedIds.value.has(e.targetId),
    )
    .slice()
    .sort((a, b) => a.at.localeCompare(b.at))
    .map((event) => ({
      ...event,
      type: typeOf(event),
      typeLabel: labelOf(event),
      targetLabel: targetOf(event),
    })),
)
function typeOf(e: LocalEvent) {
  if (e.action.includes('REVIEW'))
    return e.action.includes('RETURN') || e.action.includes('REJECT')
      ? 'review'
      : 'complete'
  if (e.action.includes('REPORT')) return 'complete'
  if (e.action.includes('WORK')) return 'human'
  if (e.action.includes('REQUEST')) return 'create'
  return 'system'
}
function labelOf(e: LocalEvent) {
  return typeOf(e) === 'review'
    ? '审核'
    : typeOf(e) === 'complete'
      ? '完成'
      : typeOf(e) === 'human'
        ? '操作'
        : typeOf(e) === 'create'
          ? '委托'
          : '系统'
}
function targetOf(e: LocalEvent) {
  const work = state.value.workItems.find((w) => w.id === e.targetId)
  if (work && selectedRequest.value)
    return (
      selectedRequest.value.snapshot.nodes[work.nodeIndex]?.label || e.targetId
    )
  return e.targetId === selectedRequest.value?.id ? '委托' : e.targetId
}
function format(s: string) {
  return new Date(s).toLocaleString('zh-CN')
}
function download() {
  if (!selectedRequest.value) return
  const body = events.value
    .map((e) => `${format(e.at)}\t${e.action}\t${e.targetLabel}\t${e.message}`)
    .join('\n')
  const blob = new Blob(
    [
      `委托：${selectedRequest.value.number}\n场景：${selectedRequest.value.snapshot.name} ${selectedRequest.value.snapshot.version}\n\n${body}`,
    ],
    { type: 'text/plain;charset=utf-8' },
  )
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${selectedRequest.value.number}-audit.txt`
  a.click()
  URL.revokeObjectURL(url)
}
</script>
<style scoped>
.configuration-log {
  margin-top: 24px;
}
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
  font-size: 13px;
  color: var(--ui-text-secondary);
  margin: 5px 0;
}
.selector-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 16px;
  padding: 10px 14px;
  background: var(--ui-surface);
  border: 1px solid var(--ui-border);
  border-radius: 5px;
}
.selector-label {
  color: var(--ui-text-secondary);
  font-size: 12px;
}
.snapshot-tag {
  font: 11px var(--ui-font-mono);
  color: var(--ui-success);
  background: var(--ui-success-bg);
  border: 1px solid var(--ui-border);
  padding: 3px 8px;
  border-radius: 3px;
  overflow-wrap: anywhere;
}
.audit-layout {
  display: flex;
  gap: 16px;
}
.timeline-wrap,
.audit-summary {
  background: var(--ui-surface);
  border: 1px solid var(--ui-border);
  border-radius: 6px;
}
.timeline-wrap {
  flex: 1;
  padding: 20px 24px;
  min-width: 0;
}
.tl-item {
  display: flex;
}
.tl-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 20px;
  flex-shrink: 0;
  margin-right: 16px;
}
.tl-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-top: 4px;
  flex-shrink: 0;
  background: var(--ui-text-tertiary);
}
.tl-dot.create {
  background: var(--ui-brand);
}
.tl-dot.human {
  background: var(--ui-success);
}
.tl-dot.review {
  background: var(--ui-warning);
}
.tl-dot.complete {
  background: var(--ui-brand);
}
.tl-line {
  width: 1px;
  flex: 1;
  background: var(--ui-border);
  margin: 4px 0;
}
.tl-content {
  flex: 1;
  padding-bottom: 18px;
}
.tl-header {
  display: flex;
  gap: 8px;
  align-items: center;
}
.tl-event {
  font-size: 13px;
  font-weight: 600;
}
.tl-type-tag {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 2px;
  background: var(--ui-surface-muted);
  color: var(--ui-text-secondary);
}
.tl-type-tag.create,
.tl-type-tag.complete {
  color: var(--ui-action-text);
}
.tl-type-tag.human {
  color: var(--ui-success);
}
.tl-type-tag.review {
  color: var(--ui-warning);
}
.tl-meta {
  display: flex;
  gap: 6px;
  margin-top: 4px;
  font-size: 12px;
  color: var(--ui-text-secondary);
}
.tl-sep {
  color: var(--ui-border);
}
.tl-detail {
  font-size: 13px;
  margin-top: 5px;
  line-height: 1.6;
}
.tl-trace {
  margin-top: 4px;
  display: flex;
  gap: 6px;
}
.trace-label {
  font-size: 11px;
  color: var(--ui-text-tertiary);
}
.trace-val {
  font: 11px var(--ui-font-mono);
  color: var(--ui-text-secondary);
}
.audit-summary {
  width: 270px;
  height: max-content;
  padding: 16px;
  flex-shrink: 0;
}
.summary-title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 10px;
}
.summary-kv {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.sk {
  width: 88px;
  flex-shrink: 0;
  color: var(--ui-text-secondary);
  font-size: 12px;
}
.sv {
  font-size: 12px;
  overflow-wrap: anywhere;
}
.mono {
  font-family: var(--ui-font-mono);
}
.small {
  font-size: 11px;
}
@media (max-width: 900px) {
  .audit-layout {
    flex-direction: column;
  }
  .audit-summary {
    width: auto;
  }
}
@media (max-width: 767px) {
  .configuration-log {
    margin-top: 24px;
  }
  .page {
    padding: 16px;
  }
  .page-header {
    flex-direction: column;
    gap: 12px;
  }
  .timeline-wrap {
    padding: 16px 12px;
  }
}
</style>
