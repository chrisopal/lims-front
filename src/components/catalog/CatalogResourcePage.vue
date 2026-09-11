<template>
  <div class="catalog-page">
    <div class="page-header">
      <div>
        <div class="page-title">{{ title }}</div>
        <div class="page-subtitle">{{ subtitle }}</div>
      </div>
      <div class="header-actions">
        <el-button size="small" @click="reload"
          ><el-icon><Refresh /></el-icon>刷新</el-button
        >
        <el-button
          size="small"
          @click="exportRecords"
          :disabled="!filteredRecords.length"
          ><el-icon><Download /></el-icon>导出</el-button
        >
        <el-button
          v-if="canWrite"
          size="small"
          type="primary"
          @click="openCreate"
          ><el-icon><Plus /></el-icon>新增{{ resourceLabel }}</el-button
        >
      </div>
    </div>

    <div v-if="scenarioContext" class="context-bar">
      <span>场景资产配置：当前目录的启用记录会被场景编辑器读取</span
      ><el-button
        size="small"
        type="primary"
        @click="router.push(scenarioContext.path)"
        >返回场景配置</el-button
      >
    </div>
    <el-alert
      v-if="error"
      type="error"
      :closable="false"
      show-icon
      class="storage-error"
      >{{ error }}</el-alert
    >
    <div class="catalog-panel">
      <div class="filter-bar">
        <el-input
          v-model="query"
          size="small"
          clearable
          placeholder="编码 / 名称 / 业务字段"
          class="search-input"
        >
          <template #prefix
            ><el-icon><Search /></el-icon
          ></template>
        </el-input>
        <el-select
          v-model="statusFilter"
          size="small"
          clearable
          placeholder="状态"
          class="status-filter"
        >
          <el-option label="启用" value="ACTIVE" />
          <el-option label="停用" value="INACTIVE" />
        </el-select>
        <span class="result-count"
          >共 {{ filteredRecords.length }} / {{ records.length }} 条</span
        >
      </div>
      <el-table
        :data="filteredRecords"
        border
        stripe
        size="small"
        class="catalog-table"
        @row-click="openDetail"
      >
        <el-table-column label="名称" min-width="190">
          <template #default="{ row }"
            ><div class="identity-cell">
              <strong>{{ row.name }}</strong
              ><span>{{
                row.data.description || row.data.category || resourceLabel
              }}</span>
            </div></template
          >
        </el-table-column>
        <el-table-column label="编码" prop="code" min-width="145"
          ><template #default="{ row }"
            ><span class="mono">{{ row.code }}</span></template
          ></el-table-column
        >
        <el-table-column
          v-for="field in visibleFields"
          :key="field.key"
          :label="field.label"
          :min-width="field.width || 120"
        >
          <template #default="{ row }"
            ><span class="table-value">{{
              displayValue(row.data[field.key])
            }}</span></template
          >
        </el-table-column>
        <el-table-column label="版本" width="100"
          ><template #default="{ row }"
            ><span class="version">{{ row.version }}</span></template
          ></el-table-column
        >
        <el-table-column label="状态" width="82"
          ><template #default="{ row }"
            ><el-tag
              size="small"
              :type="row.status === 'ACTIVE' ? 'success' : 'info'"
              >{{ statusLabel(row.status) }}</el-tag
            ></template
          ></el-table-column
        >
        <el-table-column label="操作" width="178" fixed="right">
          <template #default="{ row }">
            <template v-if="canWrite"
              ><el-button
                link
                type="primary"
                size="small"
                @click.stop="openEdit(row)"
                >编辑</el-button
              ><el-button link size="small" @click.stop="toggleStatus(row)">{{
                row.status === 'ACTIVE' ? '停用' : '启用'
              }}</el-button
              ><el-button
                link
                type="danger"
                size="small"
                @click.stop="removeRecord(row)"
                >删除</el-button
              ></template
            ><span v-else class="readonly-text">只读</span>
          </template>
        </el-table-column>
      </el-table>
      <el-empty
        v-if="!filteredRecords.length"
        description="没有匹配的目录记录"
        :image-size="72"
      />
    </div>

    <el-drawer
      v-model="detailVisible"
      :title="`${resourceLabel}详情`"
      size="460px"
    >
      <template v-if="selectedRecord">
        <div class="drawer-identity">
          <div class="drawer-title">{{ selectedRecord.name }}</div>
          <span class="mono">{{ selectedRecord.code }}</span
          ><el-tag
            size="small"
            :type="selectedRecord.status === 'ACTIVE' ? 'success' : 'info'"
            >{{ statusLabel(selectedRecord.status) }}</el-tag
          >
        </div>
        <div class="detail-grid">
          <div>
            <span>版本</span><strong>{{ selectedRecord.version }}</strong>
          </div>
          <div>
            <span>资源类型</span><strong>{{ resourceLabel }}</strong>
          </div>
        </div>
        <el-divider />
        <div class="detail-fields">
          <div v-for="field in fields" :key="field.key" class="detail-row">
            <span>{{ field.label }}</span
            ><strong>{{ displayValue(selectedRecord.data[field.key]) }}</strong>
          </div>
        </div>
        <div v-if="canWrite" class="drawer-actions">
          <el-button
            size="small"
            type="primary"
            @click="openEdit(selectedRecord)"
            >编辑记录</el-button
          ><el-button size="small" @click="createVersion(selectedRecord)"
            >创建新版本</el-button
          ><el-button size="small" @click="toggleStatus(selectedRecord)">{{
            selectedRecord.status === 'ACTIVE' ? '停用' : '启用'
          }}</el-button>
        </div>
        <div v-else class="readonly-text">当前角色仅可查看目录记录</div>
      </template>
    </el-drawer>

    <el-dialog
      v-model="editorVisible"
      :title="
        versioning
          ? `创建${resourceLabel}新版本`
          : editing
            ? `编辑${resourceLabel}`
            : `新增${resourceLabel}`
      "
      width="620px"
      destroy-on-close
    >
      <el-form v-if="draft" label-position="top" @submit.prevent="saveRecord">
        <div class="identity-form">
          <el-form-item label="名称" required
            ><el-input
              v-model="draft.name"
              maxlength="240"
              show-word-limit /></el-form-item
          ><el-form-item label="编码" required
            ><el-input
              v-model="draft.code"
              maxlength="160"
              :disabled="editing || versioning" /></el-form-item
          ><el-form-item label="版本" required
            ><el-input
              v-model="draft.version"
              maxlength="80"
              :disabled="editing" /></el-form-item
          ><el-form-item label="状态"
            ><el-select v-model="draft.status" style="width: 100%"
              ><el-option label="启用" value="ACTIVE" /><el-option
                label="停用"
                value="INACTIVE" /></el-select
          ></el-form-item>
        </div>
        <div class="data-form">
          <template v-for="field in fields" :key="field.key"
            ><el-form-item
              v-if="isStructuredFormField(field)"
              :label="field.label"
              :required="field.required"
              class="structured-field"
              ><FieldEditor v-model="draft.data.fields" title="表单字段结构" />
              <div class="schema-preview-title">实时预览</div>
              <SchemaFields
                :fields="formFields"
                :model-value="formPreviewValues"
                prefix="catalog-preview"
                disabled /></el-form-item
            ><el-form-item
              v-else
              :label="field.label"
              :required="field.required"
            >
              <el-input
                v-if="field.type === 'textarea' && isArrayField(field.key)"
                :model-value="arrayToText(draft.data[field.key])"
                type="textarea"
                :rows="3"
                :placeholder="field.placeholder"
                @update:model-value="draft.data[field.key] = parseLines($event)"
              />
              <el-input
                v-else-if="field.type === 'textarea'"
                v-model="draft.data[field.key]"
                type="textarea"
                :rows="3"
                :placeholder="field.placeholder"
              />
              <el-select
                v-else-if="field.type === 'select'"
                v-model="draft.data[field.key]"
                clearable
                :placeholder="field.placeholder"
                style="width: 100%"
                ><el-option
                  v-for="option in field.options || []"
                  :key="option"
                  :label="option"
                  :value="option"
              /></el-select>
              <el-switch
                v-else-if="field.type === 'boolean'"
                v-model="draft.data[field.key]"
              />
              <el-input
                v-else
                v-model="draft.data[field.key]"
                :placeholder="field.placeholder"
                :type="field.type === 'number' ? 'number' : 'text'"
              /> </el-form-item
          ></template>
        </div>
      </el-form>
      <template #footer
        ><el-button @click="editorVisible = false">取消</el-button
        ><el-button type="primary" :loading="saving" @click="saveRecord"
          >保存</el-button
        ></template
      >
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, Plus, Refresh, Search } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { useCatalog } from '@/composables/useCatalog'
import { can, useDemoSession } from '@/composables/useDemoSession'
import type { CatalogRecord, CatalogStatus } from '@/runtime/catalog-repository'
import type { FieldDefinition, Values } from '@/runtime/local-runtime'
import FieldEditor from '@/components/scenario/FieldEditor.vue'
import SchemaFields from '@/components/runtime/SchemaFields.vue'

export type CatalogFieldType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'number'
  | 'boolean'
export interface CatalogField {
  key: string
  label: string
  type?: CatalogFieldType
  required?: boolean
  options?: string[]
  placeholder?: string
  width?: number
}

const props = defineProps<{
  title: string
  subtitle: string
  kind: string
  resourceLabel: string
  fields: CatalogField[]
  writePermission?: string
}>()
const { state, error, repository, reload } = useCatalog()
const { session } = useDemoSession()
const route = useRoute()
const router = useRouter()
const query = ref('')
const statusFilter = ref<CatalogStatus | ''>('')
const selectedRecord = ref<CatalogRecord | null>(null)
const detailVisible = ref(false)
const editorVisible = ref(false)
const editing = ref(false)
const versioning = ref(false)
const saving = ref(false)
const draft = ref<CatalogRecord | null>(null)
const canWrite = computed(() => {
  session.value.roleCode
  return can(props.writePermission || 'catalog.write')
})

const records = computed(() =>
  state.value.records.filter((record) => record.kind === props.kind),
)
const visibleFields = computed(() => props.fields.slice(0, 3))
const filteredRecords = computed(() =>
  records.value.filter((record) => {
    const text =
      `${record.name} ${record.code} ${record.version} ${JSON.stringify(record.data)}`.toLowerCase()
    return (
      (!query.value || text.includes(query.value.toLowerCase())) &&
      (!statusFilter.value || record.status === statusFilter.value)
    )
  }),
)
const scenarioContext = computed(() => {
  const scenarioId =
    typeof route.query.scenarioId === 'string' ? route.query.scenarioId : ''
  if (!scenarioId) return null
  const returnStep =
    typeof route.query.returnStep === 'string'
      ? route.query.returnStep
      : `assets/${props.kind}`
  return {
    path: `/app/scenarios/studio?id=${encodeURIComponent(scenarioId)}&step=${encodeURIComponent(returnStep)}`,
  }
})

function displayValue(value: unknown): string {
  if (value === undefined || value === null || value === '') return '—'
  if (Array.isArray(value)) return value.join('、')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
function statusLabel(status: CatalogStatus) {
  return status === 'ACTIVE' ? '启用' : '停用'
}
function blankData() {
  return Object.fromEntries(
    props.fields.map((field) => [
      field.key,
      field.type === 'boolean' ? false : '',
    ]),
  )
}
function copyRecord(record: CatalogRecord): CatalogRecord {
  return JSON.parse(JSON.stringify(record)) as CatalogRecord
}
const arrayFieldKeys = new Set([
  'steps',
  'sections',
  'policies',
  'qualifications',
])
function isArrayField(key: string) {
  return arrayFieldKeys.has(key)
}
function isStructuredFormField(field: CatalogField) {
  return props.kind === 'forms' && field.key === 'fields'
}
function arrayToText(value: unknown) {
  return Array.isArray(value) ? value.join('\n') : String(value ?? '')
}
function parseLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}
const formFields = computed<FieldDefinition[]>(() =>
  draft.value && Array.isArray(draft.value.data.fields)
    ? (draft.value.data.fields as FieldDefinition[])
    : [],
)
const formPreviewValues = computed<Values>(() =>
  Object.fromEntries(formFields.value.map((field) => [field.key, ''])),
)

function openCreate() {
  editing.value = false
  versioning.value = false
  draft.value = {
    id: `catalog:${props.kind}:${crypto.randomUUID()}`,
    kind: props.kind,
    name: '',
    code: '',
    version: 'v1.0.0',
    status: 'ACTIVE',
    data: blankData(),
  }
  editorVisible.value = true
}
function openEdit(record: CatalogRecord) {
  editing.value = true
  versioning.value = false
  draft.value = copyRecord(record)
  editorVisible.value = true
  detailVisible.value = false
}
function nextVersion(version: string) {
  const match = version.match(/^(.*?)(\d+)(?:\.?(\d+))?$/)
  if (!match) return `${version}.1`
  return `${match[1]}${match[2]}.${Number(match[3] || 0) + 1}`
}
function createVersion(record: CatalogRecord) {
  if (!canWrite.value) {
    ElMessage.warning('当前演示角色没有目录写入权限')
    return
  }
  editing.value = false
  versioning.value = true
  const copied = copyRecord(record)
  draft.value = {
    ...copied,
    id: `catalog:${props.kind}:${crypto.randomUUID()}`,
    version: nextVersion(record.version),
    revision: undefined,
    data: JSON.parse(JSON.stringify(record.data)),
  }
  editorVisible.value = true
  detailVisible.value = false
}
function openDetail(record: CatalogRecord) {
  selectedRecord.value = record
  detailVisible.value = true
}

function validateDraft(record: CatalogRecord): string | null {
  if (!record.name.trim()) return '请填写名称'
  if (!record.code.trim()) return '请填写编码'
  if (!record.version.trim()) return '请填写版本'
  for (const field of props.fields)
    if (
      field.required &&
      (record.data[field.key] === undefined ||
        record.data[field.key] === null ||
        (Array.isArray(record.data[field.key])
          ? record.data[field.key].length === 0
          : String(record.data[field.key]).trim() === ''))
    )
      return `请填写${field.label}`
  return null
}
async function saveRecord() {
  if (!canWrite.value) {
    ElMessage.warning('当前演示角色没有目录写入权限')
    return
  }
  if (!draft.value) return
  const issue = validateDraft(draft.value)
  if (issue) {
    ElMessage.warning(issue)
    return
  }
  saving.value = true
  try {
    const persisted = await repository.save(draft.value)
    reload()
    const readback = repository
      .read()
      .records.find((record) => record.id === persisted.id)
    if (!readback) throw new Error('保存后未读回目录记录')
    selectedRecord.value = readback
    editorVisible.value = false
    detailVisible.value = true
    ElMessage.success('目录记录已保存并读回')
  } catch (cause) {
    ElMessage.error(cause instanceof Error ? cause.message : '保存失败')
  } finally {
    saving.value = false
  }
}
async function toggleStatus(record: CatalogRecord) {
  if (!canWrite.value) {
    ElMessage.warning('当前演示角色没有目录写入权限')
    return
  }
  try {
    const persisted = await repository.save({
      ...copyRecord(record),
      status: record.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
    })
    reload()
    selectedRecord.value =
      repository.read().records.find((item) => item.id === persisted.id) || null
    ElMessage.success(
      `已${persisted.status === 'ACTIVE' ? '启用' : '停用'}，并完成读回`,
    )
  } catch (cause) {
    ElMessage.error(cause instanceof Error ? cause.message : '状态更新失败')
  }
}
async function removeRecord(record: CatalogRecord) {
  if (!canWrite.value) {
    ElMessage.warning('当前演示角色没有目录写入权限')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确认删除“${record.name}”吗？该操作会从本浏览器目录中移除。`,
      '删除目录记录',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
    )
    await repository.remove(record.id)
    reload()
    if (selectedRecord.value?.id === record.id) {
      selectedRecord.value = null
      detailVisible.value = false
    }
    if (repository.read().records.some((item) => item.id === record.id))
      throw new Error('删除后仍读到目录记录')
    ElMessage.success('目录记录已删除并确认读回')
  } catch (cause) {
    if (cause !== 'cancel' && cause !== 'close')
      ElMessage.error(cause instanceof Error ? cause.message : '删除失败')
  }
}
function exportRecords() {
  const payload = JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      kind: props.kind,
      records: filteredRecords.value,
    },
    null,
    2,
  )
  const url = URL.createObjectURL(
    new Blob([payload], { type: 'application/json;charset=utf-8' }),
  )
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${props.kind}-catalog.json`
  anchor.click()
  URL.revokeObjectURL(url)
  ElMessage.success(`已导出 ${filteredRecords.value.length} 条记录`)
}
</script>

<style scoped>
.catalog-page {
  padding: 24px 32px 40px;
  color: var(--ui-text);
  min-width: 0;
}
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}
.page-title {
  font-size: 20px;
  font-weight: 600;
}
.page-subtitle {
  margin-top: 5px;
  font-size: 12px;
  color: var(--ui-text-secondary);
}
.header-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.storage-error {
  margin-bottom: 12px;
}
.context-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  padding: 9px 12px;
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius-panel);
  background: var(--ui-selected-bg);
  color: var(--ui-text-secondary);
  font-size: 12px;
}
.catalog-panel {
  overflow: hidden;
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius-panel);
  background: var(--ui-surface);
}
.filter-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 54px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--ui-border);
}
.search-input {
  width: 300px;
}
.status-filter {
  width: 120px;
}
.result-count {
  margin-left: auto;
  color: var(--ui-text-tertiary);
  font-size: 12px;
}
.catalog-table :deep(.el-table__row) {
  cursor: pointer;
}
.identity-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.identity-cell strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}
.identity-cell span,
.table-value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--ui-text-secondary);
  font-size: 12px;
}
.mono,
.version {
  font-family: var(--ui-font-mono);
  font-size: 11px;
}
.version {
  color: var(--ui-text-secondary);
}
.drawer-identity {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.drawer-title {
  width: 100%;
  font-size: 18px;
  font-weight: 600;
}
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 18px;
}
.detail-grid div,
.detail-row {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.detail-grid span,
.detail-row span {
  color: var(--ui-text-tertiary);
  font-size: 12px;
}
.detail-grid strong,
.detail-row strong {
  overflow-wrap: anywhere;
  font-size: 13px;
  font-weight: 500;
}
.detail-fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.drawer-actions {
  display: flex;
  gap: 8px;
  margin-top: 24px;
}
.readonly-text {
  color: var(--ui-text-tertiary);
  font-size: 12px;
}
.identity-form {
  display: grid;
  grid-template-columns: 2fr 1.5fr 1fr 1fr;
  gap: 10px;
}
.data-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 14px;
}
.data-form :deep(.el-form-item:first-child:last-child) {
  grid-column: 1 / -1;
}
.structured-field {
  grid-column: 1 / -1;
}
.structured-field :deep(.el-table) {
  margin-bottom: 10px;
}
.schema-preview-title {
  margin: 12px 0 6px;
  color: var(--ui-text-secondary);
  font-size: 12px;
}
@media (max-width: 900px) {
  .catalog-page {
    padding: 20px;
  }
  .identity-form {
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 640px) {
  .catalog-page {
    padding: 16px;
  }
  .page-header {
    flex-direction: column;
  }
  .header-actions {
    width: 100%;
  }
  .filter-bar {
    flex-wrap: wrap;
  }
  .search-input,
  .status-filter {
    width: 100%;
  }
  .result-count {
    margin-left: 0;
  }
  .data-form {
    grid-template-columns: 1fr;
  }
}
</style>
