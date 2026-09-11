<template>
  <div class="scenario-page">
    <div v-if="error || actionError" class="scenario-error" role="alert">
      {{ error || actionError }}
    </div>
    <template v-if="draft"
      ><header class="scenario-toolbar">
        <div>
          <el-button link @click="router.push('/app/scenarios')"
            >← 场景包</el-button
          >
          <h1>{{ draft.definition.name }}</h1>
          <p>
            {{ draft.definition.version }} ·
            {{ readonly ? '已发布 · 只读快照' : '草稿' }} ·
            {{ dirty ? '有未保存修改' : '已保存' }} ·
            {{ issues.length }} 项配置问题
          </p>
        </div>
        <div class="scenario-actions">
          <el-button @click="exportPack">导出</el-button
          ><el-button v-if="readonly" type="primary" @click="fork"
            >创建新版本</el-button
          ><template v-else
            ><el-button :loading="busy" @click="save">保存草稿</el-button
            ><el-button @click="step = 'preflight'">校验</el-button
            ><el-button
              type="primary"
              :loading="busy"
              :disabled="issues.length > 0"
              @click="publish"
              >发布</el-button
            ></template
          >
        </div>
      </header>
      <el-alert
        v-if="readonly"
        title="已发布版本不可直接修改；创建新版本后编辑，不影响历史委托。"
        type="info"
        :closable="false"
      />
      <div class="studio-layout">
        <nav class="scenario-panel studio-steps" aria-label="场景配置步骤">
          <button
            v-for="(s, i) in setupSteps"
            :key="s.key"
            :class="{ active: step === s.key }"
            @click="step = s.key"
          >
            <span>{{ String(i + 1).padStart(2, '0') }}</span
            >{{ s.name }}
          </button>
        </nav>
        <section class="scenario-panel studio-main">
          <template v-if="step === 'basic'"
            ><h2>基础信息</h2>
            <el-form
              label-position="top"
              :disabled="readonly"
              class="scenario-grid-form"
              ><el-form-item label="场景名称"
                ><el-input v-model="draft.definition.name" /></el-form-item
              ><el-form-item label="场景 Key"
                ><el-input
                  :model-value="draft.definition.key"
                  disabled /></el-form-item
              ><el-form-item label="版本号"
                ><el-input v-model="draft.definition.version" /></el-form-item
              ><el-form-item label="业务模式"
                ><el-select v-model="draft.definition.mode"
                  ><el-option
                    v-for="m in ['第三方委托', '企业内部', '高校科研']"
                    :key="m"
                    :value="m"
                    :label="m" /></el-select></el-form-item
              ><el-form-item label="检测领域"
                ><el-select
                  v-model="draft.definition.domain"
                  filterable
                  allow-create
                  ><el-option
                    v-for="d in [
                      '食品检测',
                      '环境检测',
                      '几何量',
                      '新能源',
                      '材料检测',
                    ]"
                    :key="d"
                    :value="d"
                    :label="d" /></el-select></el-form-item
              ><el-form-item label="默认实验室"
                ><el-input
                  v-model="
                    draft.definition.activationScope
                  " /></el-form-item></el-form></template
          ><template v-else-if="step === 'subjects'"
            ><el-form label-position="top"
              ><el-form-item label="检测对象名称（样品、零件、点位等）"
                ><el-input
                  v-model="draft.definition.subjectLabel"
                  :disabled="readonly" /></el-form-item></el-form
            ><FieldEditor
              v-model="draft.definition.subjectFields"
              title="检测对象表单"
              :readonly="readonly" /></template
          ><template v-else-if="step === 'test-items'"
            ><div class="scenario-toolbar">
              <h2>检测能力矩阵</h2>
              <el-button :disabled="readonly" @click="itemDialog = true"
                >从检测项库选择</el-button
              >
            </div>
            <el-table :data="draft.definition.testItems" border
              ><el-table-column
                prop="code"
                label="编码"
                min-width="130"
              /><el-table-column
                prop="name"
                label="检测项"
                min-width="140"
              /><el-table-column label="标准 / 法规" min-width="170"
                ><template #default="{ row }"
                  ><el-input
                    v-model="row.standard"
                    :disabled="readonly"
                    aria-label="标准法规" /></template></el-table-column
              ><el-table-column label="方法" min-width="150"
                ><template #default="{ row }"
                  ><el-input
                    v-model="row.method"
                    :disabled="readonly"
                    aria-label="检测方法" /></template></el-table-column
              ><el-table-column label="限值规则" min-width="150"
                ><template #default="{ row }"
                  ><el-input
                    v-model="row.limit"
                    :disabled="readonly"
                    aria-label="限值规则" /></template></el-table-column
              ><el-table-column v-if="!readonly" label="操作" width="70"
                ><template #default="{ $index }"
                  ><el-button
                    link
                    type="danger"
                    @click="draft.definition.testItems.splice($index, 1)"
                    >移除</el-button
                  ></template
                ></el-table-column
              ></el-table
            ><el-empty
              v-if="!draft.definition.testItems.length"
              description="从检测项库选择检测能力" /></template
          ><template v-else-if="step === 'workflow'"
            ><FlowEditor
              v-model="draft.definition.nodes"
              :readonly="readonly"
              :forms="formAssets"
              @bind-form="bindForm" /></template
          ><template v-else-if="step === 'forms'"
            ><div class="scenario-toolbar" v-if="!readonly">
              <el-select v-model="formAssetId" placeholder="选择动态表单资产"
                ><el-option
                  v-for="f in formAssets"
                  :key="f.id"
                  :value="f.id"
                  :label="f.name" /></el-select
              ><el-button :disabled="!formAssetId" @click="applyRequestForm"
                >套用到委托表单</el-button
              >
            </div>
            <FieldEditor
              v-model="draft.definition.requestFields"
              title="委托申请表单"
              :readonly="readonly"
            />
            <p>
              对象字段在“检测对象”配置，节点记录字段在流程节点属性配置。字段随发布快照锁定。
            </p></template
          ><template v-else-if="step === 'assets' || step === 'resources'"
            ><h2>
              {{ step === 'assets' ? '业务资产与报告配置' : '资源与资质配置' }}
            </h2>
            <p v-if="catalogError" class="scenario-error">{{ catalogError }}</p>
            <el-form label-position="top"
              ><el-form-item
                v-for="kind in bindingKinds"
                :key="kind.key"
                :label="kind.name"
                ><div class="binding-row">
                  <el-select
                    v-model="draft.bindings[kind.key]"
                    multiple
                    filterable
                    :disabled="readonly"
                    placeholder="选择已启用的资产版本"
                    ><el-option
                      v-for="a in records.filter(
                        (r) => r.kind === kind.key && r.status === 'ACTIVE',
                      )"
                      :key="a.id"
                      :value="a.id"
                      :label="`${a.name} · ${a.version}`" /></el-select
                  ><el-button @click="goAsset(kind.key)">进入管理</el-button>
                </div></el-form-item
              ></el-form
            ></template
          ><template v-else
            ><h2>发布检查</h2>
            <el-alert
              :title="
                issues.length
                  ? `${issues.length} 项问题阻止发布`
                  : '配置校验通过，可以发布新快照'
              "
              :type="issues.length ? 'error' : 'success'"
              :closable="false"
            />
            <ul v-if="issues.length">
              <li v-for="i in issues" :key="i">{{ i }}</li>
            </ul>
            <el-descriptions :column="1" border class="preflight-summary"
              ><el-descriptions-item label="检测对象">{{
                draft.definition.subjectLabel
              }}</el-descriptions-item
              ><el-descriptions-item label="检测项">{{
                draft.definition.testItems.length
              }}</el-descriptions-item
              ><el-descriptions-item label="流程节点">{{
                draft.definition.nodes.length
              }}</el-descriptions-item
              ><el-descriptions-item label="已绑定资产版本">{{
                Object.values(draft.bindings).flat().length
              }}</el-descriptions-item
              ><el-descriptions-item label="快照">{{
                draft.definition.snapshotRef || '发布时生成'
              }}</el-descriptions-item></el-descriptions
            >
            <p>
              发布后请到“场景激活”为实验室启用；只有已激活版本可创建新委托。
            </p></template
          >
        </section>
      </div>
      <el-dialog v-model="itemDialog" title="选择检测项" width="800px"
        ><el-input
          v-model="itemSearch"
          placeholder="搜索检测项"
          clearable
        /><el-table :data="availableItems" border
          ><el-table-column prop="code" label="编码" /><el-table-column
            prop="name"
            label="名称"
          /><el-table-column label="操作" width="100"
            ><template #default="{ row }"
              ><el-button
                link
                type="primary"
                :disabled="
                  draft.definition.testItems.some((t) => t.code === row.code)
                "
                @click="bindItem(row)"
                >绑定</el-button
              ></template
            ></el-table-column
          ></el-table
        ><el-button @click="goAsset('test-items')">进入检测项库管理</el-button
        ><template #footer
          ><el-button @click="itemDialog = false">完成</el-button></template
        ></el-dialog
      ></template
    ><el-empty v-else description="场景不存在或尚未加载"
      ><el-button @click="router.push('/app/scenarios')"
        >返回场景列表</el-button
      ></el-empty
    >
  </div>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  useRoute,
  useRouter,
  onBeforeRouteLeave,
  onBeforeRouteUpdate,
} from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useScenarioRepository } from '@/composables/useScenarioRepository'
import { useCatalog } from '@/composables/useCatalog'
import { clone } from '@/runtime/local-runtime'
import {
  setupSteps as defaultSteps,
  validateScenario,
  type ScenarioVersion,
} from '@/runtime/scenario-repository'
import FieldEditor from '@/components/scenario/FieldEditor.vue'
import FlowEditor from '@/components/scenario/FlowEditor.vue'
import { downloadJson } from '@/utils/download'
import { scenarioPackage } from '@/runtime/scenario-package'
import '@/styles/scenario-workspace.css'
const route = useRoute(),
  router = useRouter()
const { state, error, repository } = useScenarioRepository()
const catalog = useCatalog()
const catalogError = catalog.error
const records = computed(() => catalog.state.value.records)
const draft = ref<ScenarioVersion | null>(null),
  saved = ref(''),
  step = ref(String(route.query.step || 'basic')),
  busy = ref(false),
  actionError = ref(''),
  itemDialog = ref(false),
  itemSearch = ref('')
const setupSteps = computed(() => draft.value?.steps || defaultSteps)
const readonly = computed(() => draft.value?.status === 'PUBLISHED')
const dirty = computed(
  () =>
    !!draft.value &&
    !readonly.value &&
    JSON.stringify(draft.value) !== saved.value,
)
const issues = computed(() => {
  if (!draft.value) return []
  const list = validateScenario(draft.value)
  if (!readonly.value) {
    const missing = Object.values(draft.value.bindings)
      .flat()
      .filter(
        (id) =>
          !records.value.some((a) => a.id === id && a.status === 'ACTIVE'),
      )
    if (missing.length)
      list.push(`${missing.length} 个绑定资产版本不存在或已停用`)
  }
  return list
})
function load() {
  const id = String(route.query.id || '')
  const v =
    state.value.versions.find((v) => v.id === id) ||
    (!id ? state.value.versions[0] : undefined)
  if (v) {
    draft.value = clone(v)
    saved.value = JSON.stringify(draft.value)
  } else draft.value = null
}
watch(() => route.query.id, load)
watch(
  () => state.value,
  () => {
    if (!draft.value) load()
  },
  { immediate: true },
)
watch(
  () => route.query.step,
  (s) => {
    if (s) step.value = String(s)
  },
)
const formAssetId = ref('')
const formAssets = computed(() =>
  records.value.filter(
    (a) =>
      a.kind === 'forms' &&
      a.status === 'ACTIVE' &&
      Array.isArray(a.data.fields),
  ),
)
function bindForm(id: string) {
  if (draft.value)
    draft.value.bindings.forms = [
      ...new Set([...(draft.value.bindings.forms || []), id]),
    ]
}
function applyRequestForm() {
  const form = formAssets.value.find((f) => f.id === formAssetId.value)
  if (!form || !draft.value) return
  draft.value.definition.requestFields = clone(form.data.fields)
  draft.value.definition.requestSchema = `${form.code} · ${form.version}`
  bindForm(form.id)
}
const bindingKinds = computed(() =>
  step.value === 'resources'
    ? [
        { key: 'equipment', name: '设备' },
        { key: 'personnel', name: '人员资质' },
        { key: 'labs', name: '实验室' },
      ]
    : [
        { key: 'standards', name: '标准与法规' },
        { key: 'methods', name: '检测方法' },
        { key: 'limits', name: '限值与公式' },
        { key: 'forms', name: '动态表单资产' },
        { key: 'reports', name: '报告模板' },
        { key: 'ai-skills', name: 'AI 能力' },
      ],
)
const availableItems = computed(() =>
  records.value.filter(
    (a) =>
      a.kind === 'test-items' &&
      a.status === 'ACTIVE' &&
      `${a.name} ${a.code}`
        .toLowerCase()
        .includes(itemSearch.value.toLowerCase()),
  ),
)
async function run(job: () => Promise<void>) {
  if (busy.value) return
  busy.value = true
  actionError.value = ''
  try {
    await job()
  } catch (e) {
    actionError.value = (e as Error).message
  } finally {
    busy.value = false
  }
}
async function saveCurrent() {
  if (!draft.value) return
  draft.value = await repository.save(clone(draft.value))
  saved.value = JSON.stringify(draft.value)
}
const save = () =>
  run(async () => {
    await saveCurrent()
    ElMessage.success('草稿已保存')
  })
const publish = () =>
  run(async () => {
    if (!draft.value || issues.value.length) throw Error('请先修复发布检查问题')
    await saveCurrent()
    const ids = Object.values(draft.value!.bindings).flat()
    draft.value = await repository.publish(
      draft.value!.id,
      draft.value!.revision,
      records.value.filter((r) => ids.includes(r.id)),
    )
    saved.value = JSON.stringify(draft.value)
    step.value = 'preflight'
    ElMessage.success('已发布，请激活后创建委托')
  })
const fork = () =>
  run(async () => {
    if (!draft.value) return
    const v = await repository.fork(draft.value.id)
    await router.push({ path: '/app/scenarios/studio', query: { id: v.id } })
  })
function bindItem(a: any) {
  if (!draft.value) return
  draft.value.definition.testItems.push({
    code: a.code,
    name: a.name,
    standard: String(a.data.standard || a.data.standardRef || ''),
    method: String(a.data.method || a.data.methodRef || ''),
    limit: String(a.data.limit || a.data.limitRule || ''),
  })
  draft.value.bindings['test-items'] = [
    ...new Set([...(draft.value.bindings['test-items'] || []), a.id]),
  ]
  ElMessage.success('已绑定，请核对标准、方法与限值')
}
async function goAsset(kind: string) {
  await run(async () => {
    if (dirty.value) await saveCurrent()
    await router.push({
      path: `/app/${['equipment', 'personnel', 'labs'].includes(kind) ? 'resources' : kind === 'ai-skills' ? 'workflow' : 'assets'}/${kind}`,
      query: { scenarioId: draft.value?.id, returnStep: step.value },
    })
  })
}
const exportPack = () =>
  downloadJson(
    `${draft.value?.definition.key}.json`,
    draft.value ? scenarioPackage(draft.value) : null,
  )
async function guard() {
  if (!dirty.value) return true
  try {
    await ElMessageBox.confirm(
      '场景有未保存修改，离开将丢失这些修改。',
      '未保存修改',
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
onBeforeRouteLeave(guard)
onBeforeRouteUpdate(
  async (to, from) => to.query.id === from.query.id || (await guard()),
)
</script>
<style scoped>
.studio-layout {
  display: grid;
  grid-template-columns: 210px minmax(0, 1fr);
  gap: 16px;
  margin-top: 16px;
}
.studio-steps {
  padding: 8px;
}
.studio-steps button {
  display: flex;
  gap: 10px;
  width: 100%;
  text-align: left;
  border: 0;
  background: none;
  color: var(--ui-text-secondary);
  padding: 14px 10px;
  cursor: pointer;
}
.studio-steps button.active {
  background: var(--ui-selected-bg);
  color: var(--ui-action-text);
  border-left: 2px solid var(--ui-action-text);
}
.studio-main {
  overflow: auto;
}
.binding-row {
  display: flex;
  width: 100%;
  gap: 10px;
}
.binding-row .el-select {
  flex: 1;
}
.preflight-summary {
  margin-top: 20px;
}
li {
  padding: 6px 0;
  color: var(--ui-danger);
}
@media (max-width: 1000px) {
  .studio-layout {
    grid-template-columns: 1fr;
  }
  .studio-steps {
    display: flex;
    overflow: auto;
  }
  .studio-steps button {
    min-width: 140px;
  }
  .binding-row {
    flex-wrap: wrap;
  }
}
</style>
