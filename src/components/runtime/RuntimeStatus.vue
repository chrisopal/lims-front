<script setup lang="ts">
import { computed } from 'vue';
const props = defineProps<{ status: string }>();
const statuses: Record<string, { label: string; tone: string }> = {
  DRAFT:{label:'草稿',tone:'neutral'}, SUBMITTED:{label:'已提交',tone:'info'},
  READY:{label:'待处理',tone:'neutral'}, IN_PROGRESS:{label:'进行中',tone:'info'}, COMPLETED:{label:'已完成',tone:'success'},
};
const value = computed(() => statuses[props.status] || {label:props.status,tone:'neutral'});
</script>
<template><span class="runtime-status" :class="value.tone"><span aria-hidden="true">●</span>{{ value.label }}</span></template>
<style scoped>
.runtime-status { display:inline-flex;align-items:center;gap:5px;white-space:nowrap;border:1px solid var(--ui-border);background:var(--ui-surface-muted);border-radius:3px;padding:2px 7px;font-size:12px;color:var(--ui-text-secondary); }
.runtime-status > span { font-size:8px; }.runtime-status.info { color:var(--ui-action-text);background:var(--ui-selected-bg); }.runtime-status.success { color:var(--ui-success); }
</style>
