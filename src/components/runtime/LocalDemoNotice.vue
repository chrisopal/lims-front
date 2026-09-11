<template>
  <div class="local-demo-notice" role="note">
    <el-icon aria-hidden="true"><InfoFilled /></el-icon
    ><span
      ><strong>本地交互环境</strong> ·
      数据保存在当前浏览器，可配置、保存和导出。仪器连接与正式签章使用模拟状态。</span
    >
  </div>
</template>
<style scoped>
.local-demo-notice {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 16px;
  background: var(--ui-surface-muted);
  color: var(--ui-text-secondary);
  border-bottom: 1px solid var(--ui-border);
  font-size: 12px;
  line-height: 1.6;
}
.local-demo-notice .el-icon {
  flex-shrink: 0;
  margin-top: 3px;
}
.local-demo-notice strong {
  font-weight: 600;
}
</style>
