<template>
  <div class="flow-layout">
    <aside class="scenario-panel">
      <h2>节点库</h2>
      <el-input v-model="search" placeholder="搜索节点" clearable />
      <div v-for="n in available" :key="n.nodeType" class="palette-row">
        <span
          >{{ n.label }}<small>{{ n.renderer }}</small></span
        ><el-button
          :disabled="readonly"
          @click="add(n)"
          :aria-label="'添加' + n.label"
          >＋</el-button
        >
      </div>
    </aside>
    <section class="scenario-panel">
      <h2>
        检测流程
        <span class="scenario-muted"
          >按顺序执行 · 通过场景配置区分作业路径</span
        >
      </h2>
      <el-empty v-if="!modelValue.length" description="从左侧添加节点" />
      <div
        v-for="(n, i) in modelValue"
        :key="n.key"
        class="flow-node"
        :class="{ selected: selected === i }"
      >
        <button @click="selected = i">
          <span>{{ i + 1 }}</span
          ><strong>{{ n.label }}</strong
          ><small>{{ n.nodeType }}</small>
        </button>
        <div v-if="!readonly" class="scenario-actions">
          <el-button
            size="small"
            :disabled="i === 0"
            @click="move(i, -1)"
            aria-label="上移节点"
            >↑</el-button
          ><el-button
            size="small"
            :disabled="i === modelValue.length - 1"
            @click="move(i, 1)"
            aria-label="下移节点"
            >↓</el-button
          ><el-button size="small" type="danger" plain @click="remove(i)"
            >删除</el-button
          >
        </div>
      </div>
    </section>
    <aside class="scenario-panel" v-if="node">
      <h2>节点属性</h2>
      <el-form label-position="top"
        ><el-form-item label="节点名称"
          ><el-input v-model="node.label" :disabled="readonly" /></el-form-item
        ><el-form-item label="节点 Key"
          ><el-input v-model="node.key" :disabled="readonly" /></el-form-item
        ><el-form-item label="完成前需人工确认"
          ><el-switch
            v-model="node.requiresConfirmation"
            :disabled="readonly" /></el-form-item
      ></el-form>
      <p>执行器：{{ node.executor }}</p>
      <p>工作面：{{ node.renderer }}</p>
      <el-select
        v-if="!readonly && forms?.length"
        v-model="formId"
        placeholder="套用动态表单资产"
        aria-label="节点表单资产"
        ><el-option
          v-for="f in forms"
          :key="f.id"
          :value="f.id"
          :label="f.name" /></el-select
      ><el-button v-if="!readonly && formId" @click="applyForm"
        >套用表单</el-button
      ><el-button @click="editing = true"
        >记录字段（{{ node.fields.length }}）</el-button
      >
      <p class="scenario-muted">
        节点执行器由平台注册。此环境执行本地人工任务，不连接仪器、AI
        或外部服务。
      </p>
    </aside>
    <el-dialog v-model="editing" title="节点记录表单" width="950px"
      ><FieldEditor
        v-if="node"
        v-model="node.fields"
        title="原始记录字段"
        :readonly="readonly"
      /><template #footer
        ><el-button @click="editing = false">完成</el-button></template
      ></el-dialog
    >
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { nodeRegistry } from '@/runtime/scenarios'
import { clone, type RuntimeNode } from '@/runtime/local-runtime'
import FieldEditor from './FieldEditor.vue'
const props = defineProps<{
  modelValue: RuntimeNode[]
  readonly?: boolean
  forms?: { id: string; name: string; data: Record<string, any> }[]
}>()
const emit = defineEmits(['update:modelValue', 'bind-form'])
const formId = ref('')
const search = ref(''),
  selected = ref(0),
  editing = ref(false)
const available = computed(() =>
  Object.values(nodeRegistry).filter((n) =>
    `${n.label} ${n.nodeType}`
      .toLowerCase()
      .includes(search.value.toLowerCase()),
  ),
)
const node = computed(() => props.modelValue[selected.value])
function applyForm() {
  const form = props.forms?.find((f) => f.id === formId.value)
  if (!form || !node.value || !Array.isArray(form.data.fields)) return
  node.value.fields = clone(form.data.fields)
  emit('bind-form', form.id)
}
function add(n: RuntimeNode) {
  const next = clone(n)
  next.key = `${n.nodeType}_${Date.now()}`
  emit('update:modelValue', [...props.modelValue, next])
  selected.value = props.modelValue.length
}
function remove(i: number) {
  emit(
    'update:modelValue',
    props.modelValue.filter((_, j) => i !== j),
  )
  selected.value = 0
}
function move(i: number, delta: number) {
  const rows = [...props.modelValue]
  ;[rows[i], rows[i + delta]] = [rows[i + delta], rows[i]]
  emit('update:modelValue', rows)
  selected.value = i + delta
}
</script>
<style scoped>
.flow-layout {
  display: grid;
  grid-template-columns: 230px minmax(260px, 1fr) 260px;
  gap: 16px;
}
.palette-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border-bottom: 1px solid var(--ui-border);
  padding: 10px 0;
  font-size: 13px;
}
.palette-row small {
  display: block;
  color: var(--ui-text-secondary);
  font-size: 11px;
}
.flow-node {
  border: 1px solid var(--ui-border);
  border-radius: 4px;
  margin-bottom: 16px;
  padding: 12px;
}
.flow-node.selected {
  border-color: var(--ui-action-text);
}
.flow-node > button {
  background: none;
  border: 0;
  color: inherit;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
  cursor: pointer;
  width: 100%;
  text-align: left;
}
.flow-node small {
  color: var(--ui-text-secondary);
}
.flow-node .scenario-actions {
  margin-top: 12px;
}
.flow-layout p {
  overflow-wrap: anywhere;
}
@media (max-width: 1200px) {
  .flow-layout {
    grid-template-columns: 200px minmax(0, 1fr);
  }
  .flow-layout > aside:last-of-type {
    grid-column: 1/-1;
  }
}
@media (max-width: 767px) {
  .flow-layout {
    grid-template-columns: 1fr;
  }
  .flow-layout > aside:first-child {
    max-height: 280px;
    overflow: auto;
  }
}
</style>
