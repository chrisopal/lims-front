<template>
  <div class="scenario-page">
    <el-result
      icon="warning"
      title="当前角色没有此页面权限"
      sub-title="可切换演示身份，或由管理员在角色权限中调整能力策略。"
      ><template #extra
        ><el-button @click="$router.push('/app/dashboard')"
          >返回工作台</el-button
        ><el-button type="primary" @click="$router.push('/login')"
          >切换身份</el-button
        ></template
      ></el-result
    >
  </div>
</template>
