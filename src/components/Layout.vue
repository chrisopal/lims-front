<template>
  <div class="app-layout">
    <header class="topbar">
      <div class="topbar-left">
        <div class="logo">
          <span class="logo-abbr">LOP</span>
          <span class="logo-text">Laboratory Operations Platform</span>
          <span class="logo-badge">LIMS</span>
        </div>
      </div>
      <div class="topbar-right">
        <el-badge :value="3" class="topbar-icon"><el-icon size="18"><Bell /></el-icon></el-badge>
        <span class="topbar-divider"></span>
        <el-dropdown>
          <div class="user-info" tabindex="0">
            <el-avatar :size="26" class="user-avatar">张</el-avatar>
            <span class="user-name">张研究员</span>
            <el-icon size="12"><ArrowDown /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>个人设置</el-dropdown-item>
              <el-dropdown-item divided @click="$router.push('/login')">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <div class="app-body">
      <nav class="sidebar" aria-label="主导航">
        <el-menu :default-active="$route.path" router :collapse="false" class="sidebar-menu">
          <el-menu-item index="/app/dashboard">
            <el-icon><Grid /></el-icon><span>工作台</span>
          </el-menu-item>

          <div class="nav-group-label">业务运行</div>
          <el-menu-item index="/app/operations/requests"><el-icon><Document /></el-icon><span>委托 / 申请</span></el-menu-item>
          <el-menu-item index="/app/operations/my-work"><el-icon><User /></el-icon><span>我的工作</span></el-menu-item>
          <el-menu-item index="/app/operations/samples"><el-icon><Box /></el-icon><span>检测对象 / 样品</span></el-menu-item>
          <el-menu-item index="/app/operations/tasks"><el-icon><Operation /></el-icon><span>检测任务</span></el-menu-item>
          <el-menu-item index="/app/operations/review"><el-icon><Finished /></el-icon><span>审核中心</span></el-menu-item>
          <el-menu-item index="/app/operations/reports"><el-icon><Files /></el-icon><span>报告</span></el-menu-item>

          <div class="nav-group-label">场景中心</div>
          <el-menu-item index="/app/scenarios"><el-icon><Menu /></el-icon><span>场景包</span></el-menu-item>
          <el-menu-item index="/app/scenarios/published"><el-icon><CircleCheck /></el-icon><span>已发布场景</span></el-menu-item>
          <el-menu-item index="/app/scenarios/activation"><el-icon><Switch /></el-icon><span>场景激活</span></el-menu-item>
          <el-menu-item index="/app/scenarios/versions"><el-icon><Clock /></el-icon><span>发布记录</span></el-menu-item>

          <div class="nav-group-label">业务资产</div>
          <el-menu-item index="/app/assets/test-items"><el-icon><List /></el-icon><span>检测项</span></el-menu-item>
          <el-menu-item index="/app/assets/standards"><el-icon><Reading /></el-icon><span>法律法规与标准</span></el-menu-item>
          <el-menu-item index="/app/assets/methods"><el-icon><SetUp /></el-icon><span>检测方法</span></el-menu-item>
          <el-menu-item index="/app/assets/limits"><el-icon><DataLine /></el-icon><span>限值与公式</span></el-menu-item>
          <el-menu-item index="/app/assets/forms"><el-icon><EditPen /></el-icon><span>动态表单</span></el-menu-item>
          <el-menu-item index="/app/assets/reports"><el-icon><DocumentCopy /></el-icon><span>报告模板</span></el-menu-item>

          <div class="nav-group-label">流程与能力</div>
          <el-menu-item index="/app/workflow/designer"><el-icon><Share /></el-icon><span>流程设计器</span></el-menu-item>
          <el-menu-item index="/app/workflow/node-types"><el-icon><Connection /></el-icon><span>节点类型</span></el-menu-item>
          <el-menu-item index="/app/workflow/ai-skills"><el-icon><DataAnalysis /></el-icon><span>AI Skills</span></el-menu-item>
          <el-menu-item index="/app/workflow/integrations"><el-icon><Link /></el-icon><span>集成能力</span></el-menu-item>

          <div class="nav-group-label">资源</div>
          <el-menu-item index="/app/resources/equipment"><el-icon><Monitor /></el-icon><span>设备</span></el-menu-item>
          <el-menu-item index="/app/resources/personnel"><el-icon><User /></el-icon><span>人员资质</span></el-menu-item>
          <el-menu-item index="/app/resources/labs"><el-icon><OfficeBuilding /></el-icon><span>实验室资源</span></el-menu-item>

          <div class="nav-group-label">平台管理</div>
          <el-menu-item index="/app/admin/orgs"><el-icon><OfficeBuilding /></el-icon><span>组织与实验室</span></el-menu-item>
          <el-menu-item index="/app/admin/roles"><el-icon><Lock /></el-icon><span>角色权限</span></el-menu-item>
          <el-menu-item index="/app/admin/audit"><el-icon><Memo /></el-icon><span>审计</span></el-menu-item>
          <el-menu-item index="/app/admin/settings"><el-icon><Setting /></el-icon><span>系统设置</span></el-menu-item>
        </el-menu>
      </nav>

      <main class="main-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.app-layout { display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
.topbar {
  height: var(--ui-header-height); background: var(--ui-surface); border-bottom: 1px solid var(--ui-border);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 20px; flex-shrink: 0; z-index: 100;
}
.topbar-left { display: flex; align-items: center; min-width: 0; }
.logo { display: flex; align-items: center; gap: 8px; min-width: 0; }
.logo-abbr {
  width: 28px; height: 28px; background: var(--ui-brand); color: var(--ui-on-action);
  font-size: 10px; font-weight: 700; border-radius: var(--ui-radius-control);
  display: flex; align-items: center; justify-content: center; letter-spacing: -0.5px; flex-shrink: 0;
}
.logo-text { font-size: 13px; font-weight: 600; color: var(--ui-text); white-space: nowrap; }
.logo-badge {
  font-size: 10px; color: var(--ui-text-secondary); background: var(--ui-surface-muted);
  border: 1px solid var(--ui-border); padding: 1px 6px; border-radius: var(--ui-radius-tag);
}
.topbar-right { display: flex; align-items: center; gap: 12px; }
.topbar-icon { cursor: pointer; color: var(--ui-text-secondary); }
.topbar-divider { width: 1px; height: 16px; background: var(--ui-border); }
.user-info { display: flex; align-items: center; gap: 6px; cursor: pointer; color: var(--ui-text); font-size: 13px; border-radius: var(--ui-radius-control); }
.user-avatar { background: var(--ui-brand); font-size: 11px; }
.user-name { font-size: 13px; }

.app-body { display: flex; flex: 1; min-height: 0; overflow: hidden; }
.sidebar {
  width: var(--ui-sidebar-width); background: var(--ui-surface); border-right: 1px solid var(--ui-border);
  overflow-y: auto; flex-shrink: 0;
}
.sidebar-menu { border-right: none !important; padding: 8px 0 16px; }
.nav-group-label {
  font-size: 12px; color: var(--ui-text-muted); font-weight: 500;
  padding: 14px 16px 4px; letter-spacing: 0;
}
.sidebar :deep(.el-menu-item) {
  position: relative; height: 36px; line-height: 36px; font-size: 14px; color: var(--ui-text-secondary);
  padding: 0 16px !important; border-radius: 0; margin: 0;
}
.sidebar :deep(.el-menu-item:hover) { background: var(--ui-surface-muted); color: var(--ui-text); }
.sidebar :deep(.el-menu-item.is-active) { background: var(--ui-selected-bg); color: var(--ui-action-text); font-weight: 500; }
.sidebar :deep(.el-menu-item.is-active::before) {
  content: ''; position: absolute; left: 0; top: 6px; bottom: 6px; width: 2px; background: var(--ui-brand);
}
.sidebar :deep(.el-menu-item .el-icon) { margin-right: 8px; font-size: 16px; color: var(--ui-text-tertiary); }
.sidebar :deep(.el-menu-item.is-active .el-icon) { color: var(--ui-brand); }

.main-content { flex: 1; min-width: 0; min-height: 0; overflow-y: auto; background: var(--ui-canvas); }

@media (max-width: 1024px) {
  .logo-text { display: none; }
}
</style>
