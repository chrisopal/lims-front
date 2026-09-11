<template>
  <div>
    <div class="scenario-toolbar">
      <h2>{{ title }}</h2>
      <el-button v-if="!readonly" @click="add">添加字段</el-button>
    </div>
    <el-table :data="modelValue" border
      ><el-table-column label="字段 Key" min-width="135"
        ><template #default="{ row }"
          ><el-input
            v-model="row.key"
            :disabled="readonly"
            aria-label="字段 Key" /></template></el-table-column
      ><el-table-column label="显示名称" min-width="135"
        ><template #default="{ row }"
          ><el-input
            v-model="row.label"
            :disabled="readonly"
            aria-label="显示名称" /></template></el-table-column
      ><el-table-column label="类型" min-width="130"
        ><template #default="{ row }"
          ><el-select
            v-model="row.type"
            :disabled="readonly"
            aria-label="字段类型"
            ><el-option
              v-for="t in types"
              :key="t.value"
              :label="t.label"
              :value="t.value" /></el-select></template></el-table-column
      ><el-table-column label="必填" width="70"
        ><template #default="{ row }"
          ><el-checkbox
            v-model="row.required"
            :disabled="readonly"
            aria-label="必填" /></template></el-table-column
      ><el-table-column label="选项（逗号分隔）" min-width="160"
        ><template #default="{ row }"
          ><el-input
            v-if="row.type === 'select'"
            :model-value="row.options?.join(',')"
            @update:model-value="
              row.options = $event
                .split(/[,，]/)
                .map((s: string) => s.trim())
                .filter(Boolean)
            "
            :disabled="readonly"
            aria-label="字段选项"
          /><span v-else>—</span></template
        ></el-table-column
      ><el-table-column v-if="!readonly" label="操作" width="75"
        ><template #default="{ $index }"
          ><el-button link type="danger" @click="remove($index)"
            >删除</el-button
          ></template
        ></el-table-column
      ></el-table
    ><el-empty v-if="!modelValue.length" description="请添加字段" />
  </div>
</template>
<script setup lang="ts">
import type { FieldDefinition } from '@/runtime/local-runtime'
const props = defineProps<{
  modelValue: FieldDefinition[]
  title: string
  readonly?: boolean
}>()
const emit = defineEmits(['update:modelValue'])
const types = [
  { value: 'text', label: '单行文本' },
  { value: 'textarea', label: '多行文本' },
  { value: 'select', label: '下拉选择' },
  { value: 'date', label: '日期' },
]
function add() {
  emit('update:modelValue', [
    ...props.modelValue,
    {
      key: `field${Date.now()}`,
      label: '新字段',
      type: 'text',
      required: true,
    },
  ])
}
function remove(index: number) {
  emit(
    'update:modelValue',
    props.modelValue.filter((_, i) => i !== index),
  )
}
</script>
