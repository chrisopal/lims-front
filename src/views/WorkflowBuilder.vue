<template>
  <div class="scenario-page">
    <header class="scenario-toolbar">
      <div>
        <h1>流程设计器</h1>
        <p>选择场景版本，在场景草稿中维护节点、表单和执行顺序。</p>
      </div>
      <el-button v-if="version" type="primary" @click="open">{{
        version.status === 'PUBLISHED' ? '查看场景流程' : '编辑场景流程'
      }}</el-button>
    </header>
    <div class="scenario-filters">
      <el-select v-model="id" placeholder="选择场景版本" filterable
        ><el-option
          v-for="v in state.versions"
          :key="v.id"
          :label="`${v.definition.name} ${v.definition.version} ${v.status}`"
          :value="v.id"
      /></el-select>
    </div>
    <div class="scenario-error" v-if="error">{{ error }}</div>
    <FlowEditor
      v-if="version"
      :model-value="version.definition.nodes"
      readonly
    /><el-empty v-else description="选择场景查看其流程" />
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useScenarioRepository } from '@/composables/useScenarioRepository'
import FlowEditor from '@/components/scenario/FlowEditor.vue'
import '@/styles/scenario-workspace.css'
const router = useRouter(),
  route = useRoute()
const { state, error } = useScenarioRepository()
const id = ref(String(route.query.scenarioId || ''))
const version = computed(() =>
  state.value.versions.find((v) => v.id === id.value),
)
function open() {
  router.push({
    path: '/app/scenarios/studio',
    query: { id: id.value, step: 'workflow' },
  })
}
</script>
