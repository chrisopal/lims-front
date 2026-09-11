<template>
  <div class="scenario-page">
    <h1>版本差异与发布记录</h1>
    <p>比较两份实际场景定义；发布和激活记录取自本地操作。</p>
    <div v-if="error" class="scenario-error">{{ error }}</div>
    <div class="scenario-filters">
      <el-select v-model="leftId" placeholder="基准版本" filterable
        ><el-option
          v-for="v in state.versions"
          :key="v.id"
          :label="`${v.definition.name} ${v.definition.version}`"
          :value="v.id" /></el-select
      ><span>→</span
      ><el-select v-model="rightId" placeholder="目标版本" filterable
        ><el-option
          v-for="v in state.versions"
          :key="v.id"
          :label="`${v.definition.name} ${v.definition.version}`"
          :value="v.id" /></el-select
      ><el-button
        :disabled="!left || !right"
        @click="downloadJson('scenario-diff.json', diff)"
        >导出差异</el-button
      >
    </div>
    <el-table :data="diff" border
      ><el-table-column prop="field" label="配置" width="160" /><el-table-column
        label="基准值"
        min-width="250"
        ><template #default="{ row }">
          <pre>{{ row.before }}</pre>
        </template></el-table-column
      ><el-table-column label="目标值" min-width="250"
        ><template #default="{ row }">
          <pre>{{ row.after }}</pre>
        </template></el-table-column
      ></el-table
    ><el-empty
      v-if="!diff.length"
      :description="left && right ? '两个版本没有配置差异' : '请选择两个版本'"
    />
    <h2>发布与激活历史</h2>
    <el-table :data="state.events.slice().reverse()" border
      ><el-table-column
        prop="at"
        label="时间"
        min-width="190" /><el-table-column
        prop="action"
        label="动作"
        min-width="190" /><el-table-column
        prop="message"
        label="记录"
        min-width="300"
    /></el-table>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useScenarioRepository } from '@/composables/useScenarioRepository'
import { downloadJson } from '@/utils/download'
import '@/styles/scenario-workspace.css'
const { state, error } = useScenarioRepository()
const leftId = ref(''),
  rightId = ref('')
const left = computed(() =>
  state.value.versions.find((v) => v.id === leftId.value),
)
const right = computed(() =>
  state.value.versions.find((v) => v.id === rightId.value),
)
const diff = computed(() => {
  if (!left.value || !right.value) return []
  const a = { ...left.value.definition, bindings: left.value.bindings },
    b = { ...right.value.definition, bindings: right.value.bindings }
  return Object.keys(a)
    .filter(
      (k) => JSON.stringify((a as any)[k]) !== JSON.stringify((b as any)[k]),
    )
    .map((k) => ({
      field: k,
      before: JSON.stringify((a as any)[k], null, 2),
      after: JSON.stringify((b as any)[k], null, 2),
    }))
})
</script>
<style scoped>
pre {
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 12px;
  max-height: 220px;
  overflow: auto;
}
h2 {
  margin-top: 24px;
}
</style>
