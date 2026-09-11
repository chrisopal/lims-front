<template>
  <div class="catalog-page">
    <div class="page-header">
      <div>
        <div class="page-title">节点类型 Node Type Catalog</div>
        <div class="page-subtitle">
          平台注册能力注册表 · 只读查看，场景配置只能引用已注册节点
        </div>
      </div>
    </div>
    <div class="catalog-panel">
      <div class="filter-bar">
        <el-input
          v-model="query"
          clearable
          size="small"
          placeholder="节点编码 / 名称 / 执行器"
          class="search-input"
          ><template #prefix
            ><el-icon><Search /></el-icon></template></el-input
        ><el-select
          v-model="rendererFilter"
          clearable
          size="small"
          placeholder="运行渲染器"
          class="renderer-filter"
          ><el-option
            v-for="renderer in renderers"
            :key="renderer"
            :label="renderer"
            :value="renderer" /></el-select
        ><span class="result-count"
          >共 {{ filteredNodes.length }} / {{ nodes.length }} 个节点</span
        >
      </div>
      <el-table
        :data="filteredNodes"
        border
        stripe
        size="small"
        @row-click="openDetail"
        class="node-table"
      >
        <el-table-column label="Node Type" min-width="210"
          ><template #default="{ row }"
            ><div class="node-identity">
              <strong>{{ row.key }}</strong
              ><span>{{ row.label }}</span>
            </div></template
          ></el-table-column
        >
        <el-table-column label="Backend Executor" min-width="210"
          ><template #default="{ row }"
            ><span class="mono">{{ row.executor }}</span></template
          ></el-table-column
        >
        <el-table-column label="Runtime Renderer" min-width="145"
          ><template #default="{ row }"
            ><span class="renderer">{{ row.renderer }}</span></template
          ></el-table-column
        >
        <el-table-column label="记录字段" width="100" prop="fieldCount" />
        <el-table-column label="需人工确认" width="110"
          ><template #default="{ row }"
            ><el-tag
              size="small"
              :type="row.requiresConfirmation ? 'warning' : 'info'"
              >{{ row.requiresConfirmation ? '是' : '否' }}</el-tag
            ></template
          ></el-table-column
        >
      </el-table>
      <el-empty
        v-if="!filteredNodes.length"
        description="没有匹配的节点类型"
        :image-size="72"
      />
    </div>
    <el-drawer v-model="drawerVisible" title="Node Type Descriptor" size="480px"
      ><template v-if="selectedNode"
        ><div class="drawer-key">{{ selectedNode.key }}</div>
        <div class="drawer-label">{{ selectedNode.label }}</div>
        <el-divider />
        <div class="detail-grid">
          <div>
            <span>执行器</span
            ><strong class="mono">{{ selectedNode.executor }}</strong>
          </div>
          <div>
            <span>运行渲染器</span><strong>{{ selectedNode.renderer }}</strong>
          </div>
          <div>
            <span>节点类别</span><strong>{{ selectedNode.nodeType }}</strong>
          </div>
          <div>
            <span>记录字段</span
            ><strong>{{ selectedNode.fieldCount }} 个</strong>
          </div>
        </div>
        <el-divider />
        <div class="field-title">运行字段</div>
        <div class="field-list">
          <div
            v-for="field in selectedNode.fields"
            :key="field.key"
            class="field-row"
          >
            <span class="mono">{{ field.key }}</span
            ><span>{{ field.label }}</span
            ><el-tag v-if="field.required" size="small" type="danger"
              >必填</el-tag
            >
          </div>
        </div>
        <div class="readonly-notice">
          节点描述来自前端内置
          nodeRegistry；业务管理员不能修改执行器或加载任意代码。
        </div></template
      ></el-drawer
    >
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { nodeRegistry } from '@/runtime/scenarios'
import type { RuntimeNode } from '@/runtime/local-runtime'

const query = ref('')
const rendererFilter = ref('')
const drawerVisible = ref(false)
const selectedNode = ref<(RuntimeNode & { fieldCount: number }) | null>(null)
const nodes = Object.values(nodeRegistry).map((node) => ({
  ...node,
  fieldCount: node.fields.length,
}))
const renderers = [...new Set(nodes.map((node) => node.renderer))]
const filteredNodes = computed(() =>
  nodes.filter((node) => {
    const haystack =
      `${node.key} ${node.label} ${node.executor} ${node.renderer}`.toLowerCase()
    return (
      (!query.value || haystack.includes(query.value.toLowerCase())) &&
      (!rendererFilter.value || node.renderer === rendererFilter.value)
    )
  }),
)
function openDetail(node: (typeof nodes)[number]) {
  selectedNode.value = node
  drawerVisible.value = true
}
</script>

<style scoped>
.catalog-page {
  padding: 24px 32px 40px;
  color: var(--ui-text);
}
.page-header {
  margin-bottom: 16px;
}
.page-title {
  font-size: 20px;
  font-weight: 600;
}
.page-subtitle {
  margin-top: 5px;
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
  width: 310px;
}
.renderer-filter {
  width: 190px;
}
.result-count {
  margin-left: auto;
  color: var(--ui-text-tertiary);
  font-size: 12px;
}
.node-table :deep(.el-table__row) {
  cursor: pointer;
}
.node-identity {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.node-identity strong,
.drawer-key {
  font-family: var(--ui-font-mono);
  font-size: 12px;
  font-weight: 600;
}
.node-identity span,
.drawer-label {
  color: var(--ui-text-secondary);
  font-size: 12px;
}
.mono {
  font-family: var(--ui-font-mono);
  font-size: 11px;
}
.renderer {
  color: var(--ui-text-secondary);
  font-size: 12px;
}
.drawer-key {
  font-size: 15px;
}
.drawer-label {
  margin-top: 5px;
  font-size: 14px;
}
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}
.detail-grid div {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.detail-grid span {
  color: var(--ui-text-tertiary);
  font-size: 12px;
}
.detail-grid strong {
  overflow-wrap: anywhere;
  font-size: 13px;
  font-weight: 500;
}
.field-title {
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
}
.field-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.field-row {
  display: grid;
  grid-template-columns: 1.2fr 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 7px 9px;
  border: 1px solid var(--ui-border-subtle);
  border-radius: 4px;
  background: var(--ui-surface-muted);
  font-size: 12px;
}
.readonly-notice {
  margin-top: 20px;
  padding: 9px 10px;
  border-radius: 4px;
  background: var(--ui-surface-muted);
  color: var(--ui-text-tertiary);
  font-size: 12px;
  line-height: 1.6;
}
@media (max-width: 700px) {
  .catalog-page {
    padding: 16px;
  }
  .filter-bar {
    flex-wrap: wrap;
  }
  .search-input,
  .renderer-filter {
    width: 100%;
  }
  .result-count {
    margin-left: 0;
  }
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
