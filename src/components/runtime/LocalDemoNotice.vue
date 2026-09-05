<template>
  <div class="local-demo-notice" role="note">
    <el-icon aria-hidden="true"><InfoFilled /></el-icon>
    <span><strong>本地交互演示</strong> · 数据仅保存在本浏览器，请勿录入真实客户或检测数据。未连接后端、真实仪器或电子签章。</span>
  </div>
</template>
<style scoped>
.local-demo-notice { display:flex; align-items:flex-start; gap:8px; padding:10px 16px; background:var(--ui-surface-muted); color:var(--ui-text-secondary); border-bottom:1px solid var(--ui-border); font-size:12px; line-height:1.6; }
.local-demo-notice .el-icon { flex-shrink:0; margin-top:3px; }
.local-demo-notice strong { font-weight:600; }
</style>
