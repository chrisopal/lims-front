<script setup lang="ts">
import type { FieldDefinition, Values, Issue } from '@/runtime/local-runtime'
defineProps<{
  fields: ReadonlyArray<FieldDefinition>
  modelValue: Values
  prefix: string
  disabled?: boolean
  issues?: Issue[]
}>()
const emit = defineEmits<{ 'update:modelValue': [value: Values] }>()
function update(values: Values, key: string, value: unknown) {
  emit('update:modelValue', {
    ...values,
    [key]: value == null ? '' : String(value),
  })
}
</script>
<template>
  <el-form
    label-position="top"
    class="runtime-schema-form"
    :disabled="disabled"
  >
    <el-form-item
      v-for="field in fields"
      :key="field.key"
      :class="{ 'wide-field': field.span === 2 }"
      :label="field.label"
      :required="field.required"
      :for="`${prefix}-${field.key}`"
      :error="issues?.find((i) => i.path === `${prefix}.${field.key}`)?.message"
    >
      <el-select
        v-if="field.type === 'select'"
        :id="`${prefix}-${field.key}`"
        :model-value="modelValue[field.key]"
        placeholder="请选择"
        :aria-label="field.label"
        @update:model-value="update(modelValue, field.key, $event)"
      >
        <el-option
          v-for="option in field.options"
          :key="option"
          :value="option"
          :label="option"
        />
      </el-select>
      <el-date-picker
        v-else-if="field.type === 'date'"
        :id="`${prefix}-${field.key}`"
        :model-value="modelValue[field.key] || ''"
        type="date"
        value-format="YYYY-MM-DD"
        format="YYYY-MM-DD"
        placeholder="选择日期"
        :aria-label="field.label"
        @update:model-value="update(modelValue, field.key, $event)"
      />
      <el-input
        v-else
        :id="`${prefix}-${field.key}`"
        :type="field.type === 'textarea' ? 'textarea' : 'text'"
        :rows="3"
        :maxlength="4000"
        :model-value="modelValue[field.key] || ''"
        :placeholder="field.placeholder"
        :aria-label="field.label"
        @update:model-value="update(modelValue, field.key, $event)"
      />
    </el-form-item>
  </el-form>
</template>
<style scoped>
.runtime-schema-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}
.runtime-schema-form .wide-field {
  grid-column: span 2;
}
.runtime-schema-form :deep(.el-form-item) {
  scroll-margin-block: 80px;
}
.runtime-schema-form :deep(.el-select),
.runtime-schema-form :deep(.el-date-editor) {
  width: 100%;
  min-width: 0;
}
@media (max-width: 767px) {
  .runtime-schema-form {
    grid-template-columns: minmax(0, 1fr);
  }
  .runtime-schema-form .wide-field {
    grid-column: auto;
  }
}
</style>
