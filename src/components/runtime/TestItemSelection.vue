<script setup lang="ts">
import { computed } from 'vue';
import type { TestItem } from '@/runtime/local-runtime';
const props = defineProps<{ items: TestItem[]; modelValue: TestItem[] }>();
const emit = defineEmits<{ 'update:modelValue': [value: TestItem[]] }>();
const codes = computed(() => new Set(props.modelValue.map(item => item.code)));
const selectedCount = computed(() => props.items.filter(item => codes.value.has(item.code)).length);
const allSelected = computed(() => props.items.length > 0 && selectedCount.value === props.items.length);
// Selection belongs to the request, not to el-table's debounced internal selection store.
// Both actions synchronously emit the exact selected codes before a wizard can advance.
function toggleAll(checked: unknown) { emit('update:modelValue', checked === true ? [...props.items] : []) }
function toggleItem(item: TestItem, checked: unknown) {
  const next = new Set(codes.value);
  if (checked === true) next.add(item.code); else next.delete(item.code);
  emit('update:modelValue', props.items.filter(candidate => next.has(candidate.code)));
}
</script>
<template>
  <el-table :data="items" row-key="code" border>
    <el-table-column width="44">
      <template #header><el-checkbox :model-value="allSelected" :indeterminate="selectedCount > 0 && !allSelected" :disabled="items.length === 0" aria-label="全选检测项" @update:model-value="toggleAll" /></template>
      <template #default="{row}"><el-checkbox :model-value="codes.has(row.code)" :aria-label="`选择${row.name}`" @update:model-value="toggleItem(row,$event)" /></template>
    </el-table-column>
    <el-table-column prop="name" label="检测项" min-width="130" />
    <el-table-column label="标准版本" min-width="170"><template #default="{row}"><span class="reference-token">{{row.standard}}</span></template></el-table-column>
    <el-table-column label="方法版本" min-width="150"><template #default="{row}"><span class="reference-token">{{row.method}}</span></template></el-table-column>
    <el-table-column label="限值规则" min-width="150"><template #default="{row}"><span class="reference-token">{{row.limit}}</span></template></el-table-column>
  </el-table>
</template>
<style scoped>
.reference-token {display:inline-block;border:1px solid var(--ui-border);border-radius:3px;background:var(--ui-surface-muted);padding:2px 6px;font-size:12px;color:var(--ui-text-secondary);overflow-wrap:anywhere;}
</style>
