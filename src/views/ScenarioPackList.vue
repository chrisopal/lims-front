<template>
  <div class="scenario-page">
    <header class="scenario-toolbar">
      <div>
        <h1>场景包</h1>
        <p>配置、校验、发布可复用的实验室检测场景</p>
      </div>
      <el-button
        type="primary"
        :disabled="!can('catalog.write')"
        @click="creating = true"
        >新建场景包</el-button
      >
    </header>
    <el-alert
      title="本地交互环境 · 数据保存在当前浏览器"
      type="info"
      :closable="false"
    />
    <div v-if="error || message" role="alert" class="scenario-error">
      {{ error || message }}
    </div>
    <div class="scenario-filters">
      <el-input
        v-model="search"
        placeholder="场景名称 / Key"
        clearable
      /><el-select v-model="status" placeholder="状态" clearable
        ><el-option label="草稿" value="DRAFT" /><el-option
          label="已发布"
          value="PUBLISHED" /></el-select
      ><el-select v-model="domain" placeholder="领域" clearable
        ><el-option v-for="d in domains" :key="d" :value="d" :label="d"
      /></el-select>
    </div>
    <el-table :data="rows" border
      ><el-table-column label="场景名称" min-width="230"
        ><template #default="{ row }"
          ><el-button link type="primary" @click="open(row.id)">{{
            row.definition.name
          }}</el-button>
          <div class="scenario-muted">{{ row.definition.key }}</div></template
        ></el-table-column
      ><el-table-column label="版本" min-width="100"
        ><template #default="{ row }">{{
          row.definition.version
        }}</template></el-table-column
      ><el-table-column label="模式 / 领域" min-width="150"
        ><template #default="{ row }"
          >{{ row.definition.mode }} / {{ row.definition.domain }}</template
        ></el-table-column
      ><el-table-column label="状态" width="100"
        ><template #default="{ row }"
          ><el-tag :type="row.status === 'PUBLISHED' ? 'success' : 'info'">{{
            row.status === 'PUBLISHED' ? '已发布' : '草稿'
          }}</el-tag></template
        ></el-table-column
      ><el-table-column label="操作" min-width="240"
        ><template #default="{ row }"
          ><el-button link @click="open(row.id)">{{
            row.status === 'PUBLISHED' ? '查看' : '编辑'
          }}</el-button
          ><el-button link type="primary" @click="fork(row.id, false)"
            >新版本</el-button
          ><el-button link @click="fork(row.id, true)">复制</el-button
          ><el-button link @click="download(row)">导出</el-button></template
        ></el-table-column
      ></el-table
    ><el-empty v-if="!rows.length" description="没有匹配场景" /><el-dialog
      v-model="creating"
      title="新建场景包"
      width="500px"
      ><el-form label-position="top"
        ><el-form-item label="场景名称"
          ><el-input v-model="name" /></el-form-item
        ><el-form-item label="场景 Key（小写英文与连字符）"
          ><el-input v-model="key" /></el-form-item
      ></el-form>
      <p class="scenario-error" v-if="message">{{ message }}</p>
      <template #footer
        ><el-button @click="creating = false">取消</el-button
        ><el-button type="primary" :loading="busy" @click="create"
          >创建草稿</el-button
        ></template
      ></el-dialog
    >
  </div>
</template>
<script setup lang="ts">
import { can } from '@/composables/useDemoSession'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useScenarioRepository } from '@/composables/useScenarioRepository'
import { downloadJson } from '@/utils/download'
import { scenarioPackage } from '@/runtime/scenario-package'
import type { ScenarioVersion } from '@/runtime/scenario-repository'
import '@/styles/scenario-workspace.css'
const router = useRouter()
const { state, error, repository } = useScenarioRepository()
const search = ref(''),
  status = ref(''),
  domain = ref(''),
  message = ref(''),
  name = ref(''),
  key = ref('')
const creating = ref(false),
  busy = ref(false)
const domains = computed(() => [
  ...new Set(state.value.versions.map((v) => v.definition.domain)),
])
const rows = computed(() =>
  state.value.versions
    .filter(
      (v) =>
        (!status.value || v.status === status.value) &&
        (!domain.value || v.definition.domain === domain.value) &&
        `${v.definition.name} ${v.definition.key}`
          .toLowerCase()
          .includes(search.value.toLowerCase()),
    )
    .slice()
    .reverse(),
)
const open = (id: string) =>
  router.push({ path: '/app/scenarios/studio', query: { id } })
async function run(job: () => Promise<void>) {
  if (!can('catalog.write')) {
    message.value = '当前角色没有场景配置权限'
    return
  }
  busy.value = true
  message.value = ''
  try {
    await job()
  } catch (e) {
    message.value = (e as Error).message
  } finally {
    busy.value = false
  }
}
const create = () =>
  run(async () => {
    const v = await repository.create(name.value, key.value)
    creating.value = false
    await open(v.id)
  })
const fork = (id: string, copy: boolean) =>
  run(async () => {
    const v = await repository.fork(id, copy)
    await open(v.id)
  })
const download = (v: ScenarioVersion) =>
  downloadJson(
    `${v.definition.key}-${v.definition.version}.json`,
    scenarioPackage(v),
  )
</script>
