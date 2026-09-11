<template>
  <div class="scenario-page">
    <header class="scenario-toolbar">
      <div>
        <h1>{{ title }}</h1>
        <p>
          从真实委托工作项进入专业记录。任务与委托、场景快照和检测对象保持关联。
        </p>
      </div>
      <el-button
        type="primary"
        @click="$router.push('/app/operations/requests')"
        >新建委托</el-button
      >
    </header>
    <LocalDemoNotice />
    <div v-if="error" class="scenario-error">{{ error }}</div>
    <el-table :data="rows" border
      ><el-table-column label="工作项" min-width="190"
        ><template #default="{ row }">{{
          row.node.label
        }}</template></el-table-column
      ><el-table-column label="委托号" min-width="150"
        ><template #default="{ row }">{{
          row.request.number
        }}</template></el-table-column
      ><el-table-column label="场景" min-width="190"
        ><template #default="{ row }">{{
          row.request.snapshot.name
        }}</template></el-table-column
      ><el-table-column
        prop="work.status"
        label="状态"
        min-width="120"
      /><el-table-column label="操作" width="120"
        ><template #default="{ row }"
          ><el-button
            type="primary"
            link
            @click="$router.push(`/app/operations/work-items/${row.work.id}`)"
            >打开工作台</el-button
          ></template
        ></el-table-column
      ></el-table
    ><el-empty
      v-if="!rows.length"
      description="当前没有该类型工作项。创建相应场景委托并推进到此节点后即可操作。"
    />
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useLocalRuntime } from '@/composables/useLocalRuntime'
import LocalDemoNotice from './LocalDemoNotice.vue'
import '@/styles/scenario-workspace.css'
const props = defineProps<{ title: string; renderers: string[] }>()
const { state, error } = useLocalRuntime()
const rows = computed(() =>
  state.value.workItems.flatMap((work) => {
    const request = state.value.requests.find((r) => r.id === work.requestId)
    const node = request?.snapshot.nodes[work.nodeIndex]
    return request && node && props.renderers.includes(node.renderer)
      ? [{ work, request, node }]
      : []
  }),
)
</script>
