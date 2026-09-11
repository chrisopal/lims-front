<template>
  <div class="scenario-page">
    <header class="scenario-toolbar">
      <div>
        <h1>场景激活</h1>
        <p>指定可使用该版本的实验室；停用不改变已创建委托。</p>
      </div>
    </header>
    <div v-if="error || actionError" class="scenario-error" role="alert">
      {{ error || actionError }}
    </div>
    <el-table :data="rows" border
      ><el-table-column label="场景" min-width="240"
        ><template #default="{ row }"
          >{{ row.definition.name }} {{ row.definition.version }}</template
        ></el-table-column
      ><el-table-column label="当前范围" min-width="260"
        ><template #default="{ row }">{{
          state.activations[row.id]?.join('、') || '未激活'
        }}</template></el-table-column
      ><el-table-column label="操作" min-width="170"
        ><template #default="{ row }"
          ><el-button link type="primary" @click="edit(row.id)"
            >配置范围</el-button
          ><el-button
            link
            type="danger"
            :disabled="!state.activations[row.id]?.length"
            @click="disable(row.id)"
            >停用</el-button
          ></template
        ></el-table-column
      ></el-table
    ><el-dialog v-model="dialog" title="配置激活范围" width="520px"
      ><el-form label-position="top"
        ><el-form-item label="可用实验室"
          ><el-select
            v-model="labs"
            multiple
            filterable
            placeholder="选择实验室"
            ><el-option
              v-for="lab in options"
              :key="lab"
              :value="lab"
              :label="lab" /></el-select></el-form-item
      ></el-form>
      <p>保存后，委托申请将读取最新已激活场景。</p>
      <template #footer
        ><el-button @click="dialog = false">取消</el-button
        ><el-button type="primary" :loading="busy" @click="save"
          >保存范围</el-button
        ></template
      ></el-dialog
    >
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useScenarioRepository } from '@/composables/useScenarioRepository'
import { useCatalog } from '@/composables/useCatalog'
import '@/styles/scenario-workspace.css'
const { state, error, repository } = useScenarioRepository()
const catalog = useCatalog()
const dialog = ref(false),
  busy = ref(false),
  id = ref(''),
  labs = ref<string[]>([]),
  actionError = ref('')
const rows = computed(() =>
  state.value.versions.filter((v) => v.status === 'PUBLISHED'),
)
const options = computed(() => [
  ...new Set([
    ...catalog.state.value.records
      .filter((r) => r.kind === 'labs' && r.status === 'ACTIVE')
      .map((r) => r.name),
    ...Object.values(state.value.activations).flat(),
  ]),
])
function edit(key: string) {
  id.value = key
  labs.value = [...(state.value.activations[key] || [])]
  dialog.value = true
}
async function save() {
  busy.value = true
  try {
    await repository.activate(id.value, labs.value)
    dialog.value = false
    ElMessage.success('激活范围已保存')
  } catch (e) {
    actionError.value = (e as Error).message
  } finally {
    busy.value = false
  }
}
async function disable(key: string) {
  try {
    await ElMessageBox.confirm(
      '停用后不能通过此版本新建委托，历史委托可继续执行。',
      '停用场景',
      { type: 'warning' },
    )
    await repository.activate(key, [])
    ElMessage.success('场景已停用')
  } catch (e) {
    if (e instanceof Error) actionError.value = e.message
  }
}
</script>
