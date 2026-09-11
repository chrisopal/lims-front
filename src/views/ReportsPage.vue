<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>报告</h1>
        <p>
          报告预览取自已完成的本地委托记录；可下载演示文本，不代表正式签发。
        </p>
      </div>
      <el-button @click="refreshReports">刷新</el-button>
    </header>
    <LocalDemoNotice /><el-alert
      v-if="error || actionError"
      :title="error || actionError"
      type="error"
      :closable="false"
      show-icon
    />
    <section class="report-layout">
      <div class="panel report-list">
        <div class="section-title">
          本地报告记录 <span>{{ reports.length }}</span>
        </div>
        <button
          v-for="report in reports"
          :key="report.id"
          type="button"
          class="report-item"
          :class="{ selected: selected?.id === report.id }"
          @click="selectedId = report.id"
        >
          <strong>{{ report.number }}</strong
          ><span>{{ report.title }}</span
          ><small>{{ format(report.generatedAt) }}</small></button
        ><el-empty
          v-if="!reports.length"
          description="完成一条完整本地流程后会生成报告预览"
          :image-size="76"
        />
      </div>
      <article class="panel preview" v-if="selected && selectedRequest">
        <div class="preview-head">
          <div>
            <h2>{{ selected.title }}</h2>
            <p class="meta mono">
              {{ selected.number }} · 生成于 {{ format(selected.generatedAt) }}
            </p>
          </div>
          <el-button type="primary" @click="download(selected)"
            >下载 HTML 预览</el-button
          >
        </div>
        <el-alert title="本地报告预览 · 未签名" type="info" :closable="false" />
        <div class="report-document">
          <div class="document-heading">
            <div class="document-kicker">LABORATORY OPERATIONS PLATFORM</div>
            <h2>{{ selectedRequest.snapshot.name }}</h2>
            <p>
              {{ selected.number }} · 场景快照
              {{ selectedRequest.snapshot.version }}
            </p>
          </div>
          <div class="document-section">
            <h3>委托信息</h3>
            <dl class="metadata-grid">
              <template
                v-for="field in selectedRequest.snapshot.requestFields"
                :key="field.key"
                ><dt>{{ field.label }}</dt>
                <dd>{{ selectedRequest.data[field.key] || '—' }}</dd></template
              >
              <dt>对象数量</dt>
              <dd>{{ selectedRequest.subjects.length }}</dd>
              <dt>检测项数量</dt>
              <dd>{{ selectedRequest.itemCodes.length }}</dd>
            </dl>
          </div>
          <div class="document-section">
            <h3>检测对象</h3>
            <el-table :data="selectedRequest.subjects" border size="small"
              ><el-table-column
                v-for="field in selectedRequest.snapshot.subjectFields"
                :key="field.key"
                :prop="field.key"
                :label="field.label"
                min-width="120"
            /></el-table>
          </div>
          <div class="document-section">
            <h3>检测项目</h3>
            <el-table :data="testItems" border size="small"
              ><el-table-column
                prop="code"
                label="项目编码"
                width="140" /><el-table-column
                prop="name"
                label="项目" /><el-table-column
                prop="standard"
                label="标准" /><el-table-column
                prop="method"
                label="方法" /><el-table-column prop="limit" label="限值引用"
            /></el-table>
          </div>
          <div class="document-section">
            <h3>节点记录</h3>
            <el-table :data="recordRows" border size="small"
              ><el-table-column
                prop="node"
                label="节点"
                width="180" /><el-table-column
                prop="nodeType"
                label="类型"
                width="120" /><el-table-column prop="values" label="记录"
            /></el-table>
            <p v-if="!recordRows.length" class="meta">暂无已完成节点记录。</p>
          </div>
          <div v-if="template" class="template-note">
            报告模板快照：{{ template.name }} {{ template.version }} ·
            {{ template.code }}
          </div>
          <div class="document-section">
            <h3>审核记录</h3>
            <el-table :data="reviews" border size="small"
              ><el-table-column prop="at" label="时间" width="180"
                ><template #default="{ row }">{{
                  format(row.at)
                }}</template></el-table-column
              ><el-table-column
                prop="decision"
                label="决定"
                width="100" /><el-table-column prop="comment" label="意见"
            /></el-table>
            <p v-if="!reviews.length" class="meta">
              此报告由完整本地流程节点生成，暂无独立审核记录。
            </p>
          </div>
        </div>
      </article>
      <article class="panel preview" v-else>
        <el-empty description="选择一份报告查看预览" />
      </article>
    </section>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useLocalRuntime } from '@/composables/useLocalRuntime'
import { renderReportHtml } from '@/runtime/local-runtime'
import type { ReportRecord } from '@/runtime/local-runtime'
import LocalDemoNotice from '@/components/runtime/LocalDemoNotice.vue'
const { state, error, reload, repository } = useLocalRuntime()
const selectedId = ref('')
const actionError = ref('')
const reports = computed(() => state.value.reports.slice().reverse())
const selected = computed(
  () =>
    reports.value.find((r) => r.id === selectedId.value) || reports.value[0],
)
const selectedRequest = computed(() =>
  state.value.requests.find((r) => r.id === selected.value?.requestId),
)
const testItems = computed(
  () =>
    selectedRequest.value?.snapshot.testItems.filter((item) =>
      selectedRequest.value?.itemCodes.includes(item.code),
    ) || [],
)
const recordRows = computed(() => {
  const request = selectedRequest.value
  if (!request) return []
  return state.value.workItems
    .filter(
      (item) => item.requestId === request.id && item.status === 'COMPLETED',
    )
    .map((item) => ({
      node: request.snapshot.nodes[item.nodeIndex]?.label || '节点',
      nodeType: request.snapshot.nodes[item.nodeIndex]?.nodeType || 'NODE',
      values: Object.entries(item.values)
        .map(([key, value]) => `${key}: ${value}`)
        .join('；'),
    }))
})
const reviews = computed(() =>
  state.value.reviews
    .filter((review) => review.requestId === selected.value?.requestId)
    .slice()
    .reverse(),
)
const template = computed(() =>
  selectedRequest.value?.snapshot.assets?.find(
    (asset) =>
      asset.kind === 'reports' ||
      asset.kind === 'report-template' ||
      asset.kind === 'report_template',
  ),
)
const format = (s: string) => new Date(s).toLocaleString('zh-CN')
async function refreshReports() {
  actionError.value = ''
  try {
    for (const request of state.value.requests.filter(
      (r) =>
        r.status === 'COMPLETED' &&
        !state.value.reports.some((report) => report.requestId === r.id),
    ))
      await repository.generateReport(request.id)
    reload()
  } catch (e) {
    actionError.value = e instanceof Error ? e.message : '报告读取失败'
  }
}
function download(report: ReportRecord) {
  const request = state.value.requests.find(
    (item) => item.id === report.requestId,
  )
  if (!request) return
  const html = renderReportHtml(
    request,
    report,
    state.value.workItems,
    state.value.reviews,
  )
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${report.number}.html`
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('HTML 报告预览已下载到本地')
}
onMounted(refreshReports)
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
.report-layout {
  display: grid;
  grid-template-columns: 310px minmax(0, 1fr);
  gap: 16px;
}
.panel {
  background: var(--ui-surface);
  border: 1px solid var(--ui-border);
  border-radius: 6px;
  padding: 16px;
}
.section-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 12px;
}
.section-title span {
  margin-left: 5px;
  color: var(--ui-action-text);
}
.report-list {
  min-height: 430px;
}
.report-item {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 12px 8px;
  border: 0;
  border-top: 1px solid var(--ui-border-subtle);
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}
.report-item:hover,
.report-item.selected {
  background: var(--ui-selected-bg);
}
.report-item strong {
  font-family: var(--ui-font-mono);
  font-size: 12px;
}
.report-item span {
  font-size: 13px;
}
.report-item small,
.meta {
  font-size: 12px;
  color: var(--ui-text-secondary);
}
.mono {
  font-family: var(--ui-font-mono);
}
.preview {
  min-width: 0;
}
.preview-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}
.preview h2 {
  margin: 0 0 4px;
  font-size: 18px;
}
.report-text {
  white-space: pre-wrap;
  overflow: auto;
  margin: 16px 0 0;
  padding: 18px;
  background: var(--ui-surface-muted);
  border: 1px solid var(--ui-border);
  font: 13px/1.8 var(--ui-font-mono);
  min-height: 300px;
}
@media (max-width: 800px) {
  .report-layout {
    grid-template-columns: 1fr;
  }
  .report-list {
    min-height: auto;
    max-height: 300px;
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
  .preview-head {
    flex-direction: column;
  }
}
.report-document {
  margin-top: 16px;
  border: 1px solid var(--ui-border);
  padding: 24px;
  background: #fff;
  min-width: 0;
  overflow: hidden;
}
.document-heading {
  text-align: center;
  border-bottom: 1px solid var(--ui-border);
  padding-bottom: 16px;
}
.document-heading h2 {
  margin: 5px 0;
  font-size: 21px;
}
.document-kicker {
  font: 11px var(--ui-font-mono);
  letter-spacing: 1px;
  color: var(--ui-text-secondary);
}
.document-heading p {
  margin: 0;
  font-size: 12px;
  color: var(--ui-text-secondary);
  overflow-wrap: anywhere;
}
.document-section {
  margin-top: 22px;
  min-width: 0;
}
.document-section h3 {
  font-size: 14px;
  border-left: 3px solid var(--ui-brand);
  padding-left: 8px;
  margin: 0 0 10px;
}
.metadata-grid {
  display: grid;
  grid-template-columns: 130px 1fr 130px 1fr;
  margin: 0;
}
.metadata-grid dt,
.metadata-grid dd {
  padding: 7px 9px;
  border-bottom: 1px solid var(--ui-border-subtle);
  font-size: 12px;
  overflow-wrap: anywhere;
}
.metadata-grid dt {
  color: var(--ui-text-secondary);
}
.metadata-grid dd {
  margin: 0;
}
.template-note {
  margin-top: 16px;
  padding: 9px;
  background: var(--ui-surface-muted);
  font-size: 12px;
  color: var(--ui-text-secondary);
  overflow-wrap: anywhere;
}
@media (max-width: 767px) {
  .report-document {
    padding: 16px;
  }
  .metadata-grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .metadata-grid dt {
    padding-bottom: 3px;
  }
  .metadata-grid dd {
    padding-top: 3px;
  }
  .document-section :deep(.el-table) {
    max-width: 100%;
  }
}
</style>
