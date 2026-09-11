<template>
  <div class="composer-shell">
    <LocalDemoNotice />
    <div
      v-if="runtimeError || scenarios.error.value || actionError"
      class="runtime-error"
      role="alert"
    >
      {{ runtimeError || scenarios.error.value || actionError }}
    </div>
    <section v-if="stage === 'select'" class="scenario-select-page">
      <header class="page-header">
        <h1>新建委托 / 申请</h1>
        <p>
          选择已激活的演示场景，创建独立草稿。提交后生成本浏览器中的委托和工作项。
        </p>
      </header>
      <section
        v-if="savedDrafts.length"
        class="saved-drafts"
        aria-label="已保存草稿"
      >
        <h2>
          继续填写草稿 <span>{{ savedDrafts.length }}</span>
        </h2>
        <div v-for="d in savedDrafts" :key="d.id" class="draft-row">
          <div>
            <strong>{{ d.snapshot.name }} {{ d.snapshot.version }}</strong
            ><small
              >{{ d.data.customer || d.data.department || '未填写委托方' }} ·
              {{ new Date(d.updatedAt).toLocaleString('zh-CN') }}</small
            >
          </div>
          <el-button
            size="small"
            @click="
              router.push({
                path: '/app/operations/requests',
                query: { draftId: d.id },
              })
            "
            >继续填写</el-button
          >
        </div>
      </section>
      <div class="catalog-layout">
        <div class="catalog-main">
          <div class="filter-bar">
            <el-input
              v-model="search"
              placeholder="搜索场景名称 / Key"
              clearable
              prefix-icon="Search"
            /><el-select v-model="domainFilter" placeholder="领域" clearable
              ><el-option
                v-for="domain in domains"
                :key="domain"
                :label="domain"
                :value="domain" /></el-select
            ><el-select v-model="modeFilter" placeholder="业务模式" clearable
              ><el-option
                v-for="mode in modes"
                :key="mode"
                :label="mode"
                :value="mode"
            /></el-select>
          </div>
          <div class="scenario-table">
            <div class="scenario-header scenario-grid">
              <span></span><span>场景</span><span>版本</span
              ><span>业务模式</span><span>领域</span>
            </div>
            <button
              v-for="scene in filteredScenes"
              :key="scene.snapshotRef"
              :aria-pressed="selectedScene?.snapshotRef === scene.snapshotRef"
              :class="[
                'scenario-row',
                'scenario-grid',
                { selected: selectedScene?.snapshotRef === scene.snapshotRef },
              ]"
              @click="selectedScene = scene"
            >
              <span class="radio-mark"
                ><span
                  v-if="selectedScene?.snapshotRef === scene.snapshotRef"
                ></span></span
              ><span class="scene-identity"
                ><strong>{{ scene.name }}</strong
                ><small>{{ scene.key }}</small></span
              ><span class="version-token">{{ scene.version }}</span
              ><span>{{ scene.mode }}</span
              ><span>{{ scene.domain }}</span>
            </button>
            <el-empty
              v-if="!filteredScenes.length"
              description="没有匹配的演示场景，请调整筛选"
              :image-size="48"
            />
          </div>
        </div>
        <aside class="scenario-inspector">
          <template v-if="selectedScene"
            ><h2>{{ selectedScene.name }}</h2>
            <p class="mono">{{ selectedScene.key }}</p>
            <dl>
              <dt>Published Version</dt>
              <dd>{{ selectedScene.version }}</dd>
              <dt>快照引用（演示）</dt>
              <dd class="mono">{{ selectedScene.snapshotRef }}</dd>
              <dt>激活范围（样例）</dt>
              <dd>{{ selectedScene.activationScope }}</dd>
              <dt>流程版本</dt>
              <dd>{{ selectedScene.workflowVersion }}</dd>
              <dt>检测项 / 流程节点</dt>
              <dd>
                {{ selectedScene.testItems.length }} /
                {{ selectedScene.nodes.length }}
              </dd>
            </dl>
            <h3>运行流程</h3>
            <div class="runtime-sequence">
              <span v-for="(node, i) in selectedScene.nodes" :key="node.key"
                >{{ i + 1 }}. {{ node.label }}</span
              >
            </div>
            <p class="snapshot-note">
              草稿保存当前场景的副本，不自动升级到新版本。该引用不是数字签名。
            </p></template
          ><el-empty
            v-else
            description="选择场景后查看配置摘要"
            :image-size="48"
          />
        </aside>
      </div>
      <div class="bottom-actions">
        <el-button @click="router.back()">取消</el-button
        ><el-button
          type="primary"
          :disabled="!selectedScene || !!runtimeError"
          :loading="busy"
          @click="startRequest"
          >使用此场景</el-button
        >
      </div>
    </section>
    <section v-else class="request-workspace">
      <header class="context-header">
        <div class="context-left">
          <button
            class="back-button"
            aria-label="返回场景选择"
            @click="chooseAnotherScene"
          >
            <el-icon><ArrowLeft /></el-icon>
          </button>
          <div>
            <div class="context-line">
              <strong>{{ selectedScene?.name }}</strong
              ><span class="version-token">{{ selectedScene?.version }}</span
              ><span>场景版本已绑定</span>
            </div>
            <div class="context-sub">
              {{ selectedScene?.snapshotRef }} ·
              {{ selectedScene?.workflowVersion }}
            </div>
          </div>
        </div>
        <div class="context-actions">
          <span class="save-state" role="status">{{
            dirty ? '有未保存修改' : '草稿已保存到本浏览器'
          }}</span
          ><el-button :loading="busy" @click="saveDraft">保存草稿</el-button>
        </div>
      </header>
      <div class="wizard-layout">
        <aside class="wizard-steps">
          <div class="steps-title">委托配置</div>
          <button
            v-for="(step, index) in wizardSteps"
            :key="step.key"
            :class="[
              'wizard-step',
              {
                active: currentStep === index + 1,
                done: currentStep > index + 1,
              },
            ]"
            @click="currentStep > index + 1 && (currentStep = index + 1)"
          >
            <span class="step-index">{{ index + 1 }}</span
            ><span
              ><strong>{{ step.name }}</strong
              ><small>{{ step.source }}</small></span
            >
          </button>
          <p class="steps-note">
            四步委托向导复用场景表单与节点定义。完整 Manifest
            运行时由后续后端提供。
          </p>
        </aside>
        <main class="wizard-main">
          <div
            v-if="issues.length"
            ref="errorSummary"
            class="validation-list"
            role="alert"
            tabindex="-1"
          >
            <strong>请先修正以下信息</strong>
            <div v-for="i in issues" :key="i.path">{{ i.message }}</div>
          </div>
          <section v-if="currentStep === 1" class="wizard-section">
            <div class="section-head">
              <div>
                <h2>委托基本信息</h2>
                <p>表单版本：{{ selectedScene?.requestSchema }}</p>
              </div>
            </div>
            <div class="schema-form">
              <SchemaFields
                :fields="selectedScene?.requestFields || []"
                v-model="requestData"
                prefix="request"
                :issues="issues"
              />
            </div>
          </section>
          <section v-else-if="currentStep === 2" class="wizard-section">
            <div class="section-head">
              <div>
                <h2>{{ selectedScene?.subjectLabel }}</h2>
                <p>对象表单：{{ selectedScene?.subjectSchema }}</p>
              </div>
              <el-button type="primary" @click="addSubject">添加对象</el-button>
            </div>
            <div class="table-container">
              <el-table :data="subjects" border
                ><el-table-column
                  type="index"
                  label="#"
                  width="45"
                /><el-table-column
                  v-for="field in selectedScene?.subjectFields"
                  :key="field.key"
                  :label="field.label"
                  :min-width="field.width || 130"
                  ><template #default="{ row, $index }"
                    ><el-input
                      v-if="field.type === 'text'"
                      v-model="row[field.key]"
                      :maxlength="4000"
                      :aria-label="field.label"
                    /><el-input
                      v-else-if="field.type === 'textarea'"
                      type="textarea"
                      v-model="row[field.key]"
                      :aria-label="field.label"
                    /><el-date-picker
                      v-else-if="field.type === 'date'"
                      v-model="row[field.key]"
                      value-format="YYYY-MM-DD"
                      :aria-label="field.label"
                    /><el-select
                      v-else
                      v-model="row[field.key]"
                      placeholder="请选择"
                      :aria-label="field.label"
                      ><el-option
                        v-for="option in field.options"
                        :key="option"
                        :label="option"
                        :value="option" /></el-select
                    ><small
                      v-if="subjectError($index, field.key)"
                      class="field-error"
                      >{{ subjectError($index, field.key) }}</small
                    ></template
                  ></el-table-column
                ><el-table-column label="操作" width="70"
                  ><template #default="{ $index }"
                    ><el-button
                      link
                      type="danger"
                      @click="subjects.splice($index, 1)"
                      >删除</el-button
                    ></template
                  ></el-table-column
                ></el-table
              >
            </div>
          </section>
          <section v-else-if="currentStep === 3" class="wizard-section">
            <div class="section-head">
              <div>
                <h2>检测项</h2>
                <p>
                  只从当前场景副本选择检测项。标准、方法标签为样例，未经法规核验。
                </p>
              </div>
            </div>
            <div class="table-container">
              <TestItemSelection
                :items="selectedScene?.testItems || []"
                v-model="selectedItems"
              />
            </div>
            <p class="table-help">
              已选 {{ selectedItems.length }} 项。取消全选不会自动恢复为全选。
            </p>
          </section>
          <section v-else class="wizard-section">
            <div class="section-head">
              <div>
                <h2>确认并启动流程</h2>
                <p>提交后保存本地委托并创建首个工作项；不调用后台流程引擎。</p>
              </div>
            </div>
            <div class="confirm-grid">
              <div class="confirm-block">
                <span>场景</span
                ><strong
                  >{{ selectedScene?.name }}
                  {{ selectedScene?.version }}</strong
                >
              </div>
              <div class="confirm-block">
                <span>快照引用</span
                ><strong class="mono">{{ selectedScene?.snapshotRef }}</strong
                ><small>场景副本 · 未签名</small>
              </div>
              <div class="confirm-block">
                <span>检测对象</span><strong>{{ subjects.length }} 个</strong>
              </div>
              <div class="confirm-block">
                <span>检测项</span
                ><strong>{{ selectedItems.length }} 项</strong>
              </div>
            </div>
            <div class="process-preview">
              <h3>运行流程（本地顺序演示）</h3>
              <div class="process-nodes">
                <div
                  v-for="(node, index) in selectedScene?.nodes"
                  :key="node.key"
                  class="process-node"
                >
                  <span>{{ index + 1 }}</span
                  ><strong>{{ node.label }}</strong>
                </div>
              </div>
            </div>
            <p class="submit-note">
              本地记录不代表实际检测、Java Executor
              执行、权限授权、质量放行或报告签发。
            </p>
          </section>
          <footer class="wizard-actions">
            <el-button @click="previousStep">上一步</el-button
            ><el-button
              v-if="currentStep < wizardSteps.length"
              type="primary"
              :loading="busy"
              @click="nextStep"
              >下一步</el-button
            ><el-button
              v-else
              type="primary"
              :loading="busy"
              @click="submitRequest"
              >提交并创建本地工作项</el-button
            >
          </footer>
        </main>
      </div>
    </section>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import {
  useRoute,
  useRouter,
  onBeforeRouteLeave,
  onBeforeRouteUpdate,
} from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import LocalDemoNotice from '@/components/runtime/LocalDemoNotice.vue'
import SchemaFields from '@/components/runtime/SchemaFields.vue'
import TestItemSelection from '@/components/runtime/TestItemSelection.vue'
import { useLocalRuntime } from '@/composables/useLocalRuntime'
import { clone, validateDraft } from '@/runtime/local-runtime'
import type {
  Draft,
  Values,
  TestItem,
  ScenarioDefinition,
  Issue,
} from '@/runtime/local-runtime'
import { useScenarioRepository } from '@/composables/useScenarioRepository'
import { useDemoSession } from '@/composables/useDemoSession'
const { session } = useDemoSession()
const scenarios = useScenarioRepository()
const demoScenarios = computed(() =>
  scenarios.state.value.versions
    .filter(
      (v) =>
        v.status === 'PUBLISHED' &&
        scenarios.state.value.activations[v.id]?.length &&
        (session.value.lab === '全部已激活实验室' ||
          scenarios.state.value.activations[v.id].includes(session.value.lab)),
    )
    .map((v) => ({
      ...clone(v.definition),
      active: true,
      activationScope: scenarios.state.value.activations[v.id].join('、'),
    })),
)
const domains = computed(() => [
  ...new Set(demoScenarios.value.map((s) => s.domain)),
])
const modes = computed(() => [
  ...new Set(demoScenarios.value.map((s) => s.mode)),
])
const router = useRouter()
const route = useRoute()
const { state, error: runtimeError, repository } = useLocalRuntime()
const stage = ref<'select' | 'wizard'>('select')
const currentStep = ref(1)
const search = ref('')
const domainFilter = ref('')
const modeFilter = ref('')
const selectedScene = ref<ScenarioDefinition | null>(null)
const draft = ref<Draft | null>(null)
const requestData = ref<Values>({})
const subjects = ref<Values[]>([])
const selectedItems = ref<TestItem[]>([])
const busy = ref(false)
const actionError = ref('')
const issues = ref<Issue[]>([])
const errorSummary = ref<HTMLElement | null>(null)
const savedSignature = ref('')
const signature = () =>
  JSON.stringify({
    data: requestData.value,
    subjects: subjects.value,
    itemCodes: selectedItems.value.map((i) => i.code),
  })
const dirty = computed(
  () => !!draft.value && signature() !== savedSignature.value,
)
const savedDrafts = computed(() =>
  state.value.drafts
    .filter((d) => d.status === 'DRAFT')
    .slice()
    .reverse(),
)
const filteredScenes = computed(() =>
  demoScenarios.value.filter(
    (s) =>
      s.active &&
      (!search.value ||
        `${s.name} ${s.key}`
          .toLowerCase()
          .includes(search.value.toLowerCase())) &&
      (!domainFilter.value || s.domain === domainFilter.value) &&
      (!modeFilter.value || s.mode === modeFilter.value),
  ),
)
const wizardSteps = computed(() => [
  {
    key: 'request',
    name: '基本信息',
    source: selectedScene.value?.requestSchema || '',
  },
  {
    key: 'subject',
    name: selectedScene.value?.subjectLabel || '检测对象',
    source: selectedScene.value?.subjectSchema || '',
  },
  { key: 'items', name: '检测项', source: 'Scenario Snapshot' },
  { key: 'confirm', name: '确认与启动', source: '本地运行演示' },
])
function currentDraft(): Draft {
  if (!draft.value) throw Error('请先选择场景')
  return {
    ...clone(draft.value),
    data: clone(requestData.value),
    subjects: clone(subjects.value),
    itemCodes: selectedItems.value.map((t) => t.code),
  }
}
function applyDraft(d: Draft) {
  draft.value = clone(d)
  selectedScene.value = clone(d.snapshot)
  requestData.value = clone(d.data)
  subjects.value = clone(d.subjects)
  selectedItems.value = d.snapshot.testItems.filter((t) =>
    d.itemCodes.includes(t.code),
  )
  savedSignature.value = signature()
  stage.value = 'wizard'
  currentStep.value = 1
  issues.value = []
}
async function perform(job: () => Promise<void>) {
  if (busy.value) return
  busy.value = true
  actionError.value = ''
  try {
    await job()
  } catch (e) {
    actionError.value = e instanceof Error ? e.message : '操作失败'
  } finally {
    busy.value = false
  }
}
async function startRequest() {
  if (!selectedScene.value) return
  await perform(async () => {
    const available = scenarios.repository
      .available()
      .find((s) => s.snapshotRef === selectedScene.value!.snapshotRef)
    if (!available) throw Error('此场景已停用，请重新选择')
    const d = await repository.createDraft(available)
    applyDraft(d)
    await router.replace({
      path: '/app/operations/requests',
      query: { draftId: d.id },
    })
  })
}
async function persistDraft() {
  const saved = await repository.saveDraft(currentDraft())
  draft.value = saved
  savedSignature.value = signature()
  return saved
}
async function saveDraft() {
  await perform(async () => {
    await persistDraft()
    ElMessage.success('草稿已保存到本浏览器')
  })
}
function addSubject() {
  subjects.value.push({})
}
function subjectError(index: number, key: string) {
  return issues.value.find((i) => i.path === `subjects.${index}.${key}`)
    ?.message
}
async function focusErrors() {
  await nextTick()
  errorSummary.value?.focus()
}
async function nextStep() {
  issues.value = validateDraft(currentDraft()).filter(
    (i) => i.step === currentStep.value,
  )
  if (issues.value.length) {
    await focusErrors()
    return
  }
  currentStep.value++
}
async function confirmLeave() {
  if (!dirty.value) return true
  try {
    await ElMessageBox.confirm(
      '尚有未保存内容。离开会丢失本次修改，已保存草稿仍保留。',
      '离开当前编辑？',
      {
        confirmButtonText: '离开',
        cancelButtonText: '继续编辑',
        type: 'warning',
      },
    )
    return true
  } catch {
    return false
  }
}
async function chooseAnotherScene() {
  if (!(await confirmLeave())) return
  draft.value = null
  selectedScene.value = null
  stage.value = 'select'
  issues.value = []
  savedSignature.value = ''
  await router.replace({ path: '/app/operations/requests', query: {} })
}
function previousStep() {
  if (currentStep.value === 1) void chooseAnotherScene()
  else {
    currentStep.value--
    issues.value = []
  }
}
async function submitRequest() {
  issues.value = validateDraft(currentDraft())
  if (issues.value.length) {
    currentStep.value = issues.value[0].step
    await focusErrors()
    return
  }
  await perform(async () => {
    const d = await persistDraft()
    const r = await repository.submitDraft(d.id, d.revision)
    draft.value = null
    ElMessage.success(`本地委托 ${r.number} 已创建`)
    await router.push({
      path: '/app/operations/my-work',
      query: { requestId: r.id },
    })
  })
}
watch(
  () => route.query.draftId,
  async (id) => {
    if (typeof id !== 'string' || id === draft.value?.id) return
    try {
      const s = repository.read()
      const d = s.drafts.find((d) => d.id === id)
      if (!d) throw Error('草稿不存在或已在其他浏览器创建')
      if (d.status === 'SUBMITTED') {
        const r = s.requests.find((r) => r.draftId === id)
        await router.replace({
          path: '/app/operations/my-work',
          query: { requestId: r?.id },
        })
        return
      }
      applyDraft(d)
    } catch (e) {
      actionError.value = e instanceof Error ? e.message : '读取失败'
    }
  },
  { immediate: true },
)
onBeforeRouteLeave(confirmLeave)
onBeforeRouteUpdate((to, from) =>
  to.query.draftId !== from.query.draftId ? confirmLeave() : true,
)
function beforeUnload(e: BeforeUnloadEvent) {
  if (dirty.value) {
    e.preventDefault()
    e.returnValue = ''
  }
}
onMounted(() => window.addEventListener('beforeunload', beforeUnload))
onUnmounted(() => window.removeEventListener('beforeunload', beforeUnload))
</script>
<style scoped>
.composer-shell {
  color: var(--ui-text);
  min-width: 0;
  min-height: 100%;
}
.scenario-select-page {
  padding: 24px 32px;
}
.page-header {
  margin-bottom: 20px;
}
.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}
.page-header p {
  font-size: 13px;
  color: var(--ui-text-secondary);
  margin: 6px 0 0;
}
.catalog-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 16px;
  align-items: start;
}
.catalog-main,
.scenario-inspector,
.saved-drafts {
  background: var(--ui-surface);
  border: 1px solid var(--ui-border);
  border-radius: 6px;
  min-width: 0;
}
.filter-bar {
  padding: 12px;
  display: flex;
  gap: 8px;
  border-bottom: 1px solid var(--ui-border);
  flex-wrap: wrap;
}
.filter-bar .el-input {
  flex: 1;
  min-width: 160px;
}
.filter-bar .el-select {
  width: 130px;
}
.scenario-grid {
  display: grid;
  grid-template-columns: 24px minmax(150px, 1fr) 76px 90px 75px;
  gap: 8px;
  align-items: center;
}
.scenario-header {
  padding: 10px 12px;
  font-size: 12px;
  color: var(--ui-text-secondary);
  background: var(--ui-surface-muted);
}
.scenario-row {
  width: 100%;
  padding: 12px;
  border: 0;
  border-top: 1px solid var(--ui-border-subtle);
  background: var(--ui-surface);
  text-align: left;
  font: inherit;
  font-size: 12px;
  color: var(--ui-text-secondary);
  cursor: pointer;
}
.scenario-row.selected {
  background: var(--ui-selected-bg);
}
.scenario-row:hover {
  background: var(--ui-surface-muted);
}
.scene-identity {
  min-width: 0;
}
.scene-identity strong {
  display: block;
  color: var(--ui-text);
  font-size: 14px;
  font-weight: 500;
}
.scene-identity small {
  display: block;
  font-size: 11px;
  overflow-wrap: anywhere;
  margin-top: 3px;
}
.radio-mark {
  width: 16px;
  height: 16px;
  border: 1px solid var(--ui-border-control);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.radio-mark span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--ui-brand);
}
.version-token,
.reference-token {
  display: inline-block;
  border: 1px solid var(--ui-border);
  border-radius: 3px;
  background: var(--ui-surface-muted);
  padding: 2px 6px;
  font-size: 12px;
  color: var(--ui-text-secondary);
  overflow-wrap: anywhere;
}
.scenario-inspector {
  padding: 16px;
}
.scenario-inspector h2 {
  font-size: 16px;
  margin: 0 0 6px;
}
.scenario-inspector h3 {
  font-size: 14px;
}
.scenario-inspector dt {
  font-size: 12px;
  color: var(--ui-text-secondary);
  margin-top: 12px;
}
.scenario-inspector dd {
  font-size: 13px;
  margin: 4px 0 0;
  overflow-wrap: anywhere;
}
.mono {
  font-family: var(--ui-font-mono);
  font-size: 12px;
  overflow-wrap: anywhere;
}
.runtime-sequence {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  color: var(--ui-text-secondary);
}
.snapshot-note,
.submit-note {
  font-size: 12px;
  color: var(--ui-text-secondary);
  line-height: 1.6;
}
.bottom-actions {
  padding: 16px 0;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.saved-drafts {
  padding: 12px 16px;
  margin-bottom: 16px;
}
.saved-drafts h2 {
  font-size: 14px;
  margin: 0 0 8px;
}
.saved-drafts h2 span {
  font-weight: 400;
  color: var(--ui-text-secondary);
}
.draft-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  padding: 8px 0;
  border-top: 1px solid var(--ui-border-subtle);
}
.draft-row > div {
  min-width: 0;
}
.draft-row strong {
  display: block;
  font-size: 13px;
  overflow-wrap: anywhere;
}
.draft-row small {
  display: block;
  font-size: 12px;
  color: var(--ui-text-secondary);
}
.context-header {
  background: var(--ui-surface);
  border-bottom: 1px solid var(--ui-border);
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.context-left,
.context-line,
.context-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.context-line,
.context-actions {
  flex-wrap: wrap;
}
.context-left > div {
  min-width: 0;
}
.context-line > span:last-child,
.save-state {
  color: var(--ui-text-secondary);
  font-size: 12px;
}
.context-sub {
  font-size: 12px;
  color: var(--ui-text-secondary);
  margin-top: 4px;
  overflow-wrap: anywhere;
}
.back-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border: 1px solid var(--ui-border);
  border-radius: 4px;
  background: var(--ui-surface);
  color: var(--ui-text-secondary);
  cursor: pointer;
}
.wizard-layout {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
}
.wizard-steps {
  background: var(--ui-surface);
  border-right: 1px solid var(--ui-border);
  padding: 16px 0;
}
.steps-title {
  font-size: 14px;
  font-weight: 600;
  padding: 0 16px 12px;
}
.wizard-step {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr);
  gap: 8px;
  width: 100%;
  border: 0;
  border-left: 2px solid transparent;
  background: transparent;
  padding: 12px 14px;
  text-align: left;
  font: inherit;
  cursor: pointer;
  color: var(--ui-text);
}
.wizard-step.active {
  background: var(--ui-selected-bg);
  border-left-color: var(--ui-brand);
}
.wizard-step strong {
  display: block;
  font-size: 14px;
  font-weight: 500;
}
.wizard-step small {
  display: block;
  font-size: 11px;
  color: var(--ui-text-secondary);
  overflow-wrap: anywhere;
  margin-top: 4px;
}
.step-index {
  width: 22px;
  height: 22px;
  border: 1px solid var(--ui-border);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}
.steps-note {
  padding: 0 16px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--ui-text-secondary);
}
.wizard-main {
  padding: 24px;
  min-width: 0;
}
.wizard-section {
  min-width: 0;
}
.section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.section-head h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}
.section-head p {
  font-size: 13px;
  color: var(--ui-text-secondary);
  margin: 6px 0 0;
}
.schema-form {
  background: var(--ui-surface);
  border: 1px solid var(--ui-border);
  border-radius: 6px;
  padding: 20px;
}
.table-container {
  overflow-x: auto;
  max-width: 100%;
}
.table-help {
  font-size: 12px;
  color: var(--ui-text-secondary);
}
.confirm-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  background: var(--ui-surface);
  border: 1px solid var(--ui-border);
  border-radius: 6px;
}
.confirm-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px;
  overflow-wrap: anywhere;
  border-bottom: 1px solid var(--ui-border-subtle);
}
.confirm-block > span,
.confirm-block small {
  font-size: 12px;
  color: var(--ui-text-secondary);
}
.confirm-block strong {
  font-size: 14px;
  font-weight: 500;
}
.process-preview {
  background: var(--ui-surface);
  border: 1px solid var(--ui-border);
  border-radius: 6px;
  padding: 16px;
  margin-top: 16px;
}
.process-preview h3 {
  font-size: 14px;
  margin: 0 0 12px;
}
.process-nodes {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 8px;
}
.process-node {
  min-width: 110px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
  border: 1px solid var(--ui-border);
  border-radius: 4px;
}
.process-node span {
  font-size: 12px;
  color: var(--ui-text-secondary);
}
.process-node strong {
  font-size: 13px;
  font-weight: 500;
}
.wizard-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
  padding: 12px;
  background: var(--ui-surface);
  border-top: 1px solid var(--ui-border);
  position: sticky;
  bottom: 0;
  z-index: 2;
}
.composer-shell :deep(.el-button + .el-button) {
  margin-left: 0;
}
.runtime-error,
.validation-list {
  padding: 12px 16px;
  border: 1px solid var(--ui-danger);
  background: var(--ui-danger-bg);
  color: var(--ui-danger);
  font-size: 13px;
  border-radius: 4px;
  margin: 16px;
}
.validation-list {
  margin: 0 0 16px;
}
.validation-list strong {
  display: block;
  margin-bottom: 6px;
}
.field-error {
  font-size: 12px;
  color: var(--ui-danger);
  display: block;
}
@media (max-width: 1300px) {
  .catalog-layout {
    grid-template-columns: minmax(0, 1fr);
  }
}
@media (max-width: 767px) {
  .scenario-select-page {
    padding: 16px;
  }
  .catalog-layout {
    grid-template-columns: minmax(0, 1fr);
  }
  .scenario-header {
    display: none;
  }
  .scenario-row {
    grid-template-columns: 24px minmax(0, 1fr);
  }
  .scenario-row > :nth-child(n + 3) {
    grid-column: 2;
  }
  .context-header {
    padding: 16px;
  }
  .wizard-layout {
    grid-template-columns: minmax(0, 1fr);
  }
  .wizard-steps {
    display: flex;
    overflow-x: auto;
    padding: 8px 0;
  }
  .wizard-step {
    flex: 0 0 180px;
    width: 180px;
  }
  .steps-title,
  .steps-note {
    display: none;
  }
  .wizard-main {
    padding: 16px;
  }
  .confirm-grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .filter-bar .el-input,
  .filter-bar .el-select {
    width: 100%;
    max-width: 100%;
  }
}
</style>
