<template>
  <div class="scenario-page">
    <header class="scenario-toolbar">
      <div>
        <h1>已发布场景</h1>
        <p>只读版本、完整快照与运行使用情况</p>
      </div>
      <el-button @click="router.push('/app/scenarios/activation')"
        >管理场景激活</el-button
      >
    </header>
    <div v-if="error || actionError" class="scenario-error">
      {{ error || actionError }}
    </div>
    <div class="scenario-filters">
      <el-input v-model="search" placeholder="搜索场景" clearable />
    </div>
    <el-table :data="rows" border
      ><el-table-column label="场景" min-width="230"
        ><template #default="{ row }"
          ><el-button link type="primary" @click="open(row.id)">{{
            row.definition.name
          }}</el-button></template
        ></el-table-column
      ><el-table-column label="版本" width="110"
        ><template #default="{ row }">{{
          row.definition.version
        }}</template></el-table-column
      ><el-table-column label="激活实验室" min-width="190"
        ><template #default="{ row }">{{
          state.activations[row.id]?.join('、') || '未激活'
        }}</template></el-table-column
      ><el-table-column label="运行实例" width="100"
        ><template #default="{ row }">{{
          runtime.state.value.requests.filter(
            (r) => r.snapshot.snapshotRef === row.definition.snapshotRef,
          ).length
        }}</template></el-table-column
      ><el-table-column
        prop="publishedAt"
        label="发布时间"
        min-width="190"
      /><el-table-column label="操作" min-width="200"
        ><template #default="{ row }"
          ><el-button link @click="open(row.id)">查看快照</el-button
          ><el-button link type="primary" @click="fork(row.id)"
            >创建新版本</el-button
          ></template
        ></el-table-column
      ></el-table
    ><el-empty v-if="!rows.length" description="暂无已发布场景" />
  </div>
</template>
<script setup lang="ts">
import { can } from '@/composables/useDemoSession'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useScenarioRepository } from '@/composables/useScenarioRepository'
import { useLocalRuntime } from '@/composables/useLocalRuntime'
import '@/styles/scenario-workspace.css'
const router = useRouter()
const { state, error, repository } = useScenarioRepository()
const runtime = useLocalRuntime()
const search = ref(''),
  actionError = ref('')
const rows = computed(() =>
  state.value.versions.filter(
    (v) => v.status === 'PUBLISHED' && v.definition.name.includes(search.value),
  ),
)
const open = (id: string) =>
  router.push({ path: '/app/scenarios/studio', query: { id } })
async function fork(id: string) {
  try {
    if (!can('catalog.write')) throw Error('当前角色没有场景配置权限')
    const v = await repository.fork(id)
    await open(v.id)
  } catch (e) {
    actionError.value = (e as Error).message
  }
}
</script>
