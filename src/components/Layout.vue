<template>
  <div class="app-layout">
    <header class="topbar">
      <div class="topbar-left">
        <div class="logo">
          <span class="logo-abbr">LOP</span>
          <span class="logo-text">Laboratory Operations Platform</span>
          <span class="logo-badge">AI-Native LIMS</span>
        </div>
      </div>
      <div class="topbar-right">
        <el-badge :value="3" class="topbar-icon"><el-icon size="18"><Bell /></el-icon></el-badge>
        <span class="topbar-divider"></span>
        <el-dropdown>
          <div class="user-info">
            <el-avatar :size="26" style="background:#1677FF;font-size:11px">张</el-avatar>
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
      <nav class="sidebar">
        <el-menu :default-active="$route.path" router :collapse="false" class="sidebar-menu">
          <el-menu-item index="/app/dashboard">
            <el-icon><HomeFilled /></el-icon><span>工作台</span>
          </el-menu-item>

          <div class="nav-group-label">业务运行</div>
          <el-menu-item index="/app/operations/requests">
            <el-icon><Document /></el-icon><span>委托 / 申请</span>
          </el-menu-item>
          <el-menu-item index="/app/operations/my-work">
            <el-icon><User /></el-icon><span>我的工作</span>
          </el-menu-item>
          <el-menu-item index="/app/operations/samples">
            <el-icon><Box /></el-icon><span>检测对象 / 样品</span>
          </el-menu-item>
          <el-menu-item index="/app/operations/tasks">
            <el-icon><Operation /></el-icon><span>检测任务</span>
          </el-menu-item>
          <el-menu-item index="/app/operations/review">
            <el-icon><Finished /></el-icon><span>审核中心</span>
          </el-menu-item>
          <el-menu-item index="/app/operations/reports">
            <el-icon><Printer /></el-icon><span>报告</span>
          </el-menu-item>

          <div class="nav-group-label">场景中心</div>
          <el-menu-item index="/app/scenarios">
            <el-icon><Grid /></el-icon><span>场景包</span>
          </el-menu-item>
          <el-menu-item index="/app/scenarios/published">
            <el-icon><Select /></el-icon><span>已发布场景</span>
          </el-menu-item>
          <el-menu-item index="/app/scenarios/activation">
            <el-icon><Switch /></el-icon><span>场景激活</span>
          </el-menu-item>
          <el-menu-item index="/app/scenarios/versions">
            <el-icon><Timer /></el-icon><span>发布记录</span>
          </el-menu-item>

          <div class="nav-group-label">业务资产</div>
          <el-menu-item index="/app/assets/test-items">
            <el-icon><DataAnalysis /></el-icon><span>检测项</span>
          </el-menu-item>
          <el-menu-item index="/app/assets/standards">
            <el-icon><Reading /></el-icon><span>法律法规与标准</span>
          </el-menu-item>
          <el-menu-item index="/app/assets/methods">
            <el-icon><Cpu /></el-icon><span>检测方法</span>
          </el-menu-item>
          <el-menu-item index="/app/assets/limits">
            <el-icon><Aim /></el-icon><span>限值与公式</span>
          </el-menu-item>
          <el-menu-item index="/app/assets/forms">
            <el-icon><EditPen /></el-icon><span>动态表单</span>
          </el-menu-item>
          <el-menu-item index="/app/assets/reports">
            <el-icon><Files /></el-icon><span>报告模板</span>
          </el-menu-item>

          <div class="nav-group-label">流程与能力</div>
          <el-menu-item index="/app/workflow/designer">
            <el-icon><Share /></el-icon><span>流程设计器</span>
          </el-menu-item>
          <el-menu-item index="/app/workflow/node-types">
            <el-icon><Setting /></el-icon><span>节点类型</span>
          </el-menu-item>
          <el-menu-item index="/app/workflow/ai-skills">
            <el-icon><MagicStick /></el-icon><span>AI Skills</span>
          </el-menu-item>
          <el-menu-item index="/app/workflow/integrations">
            <el-icon><Connection /></el-icon><span>集成能力</span>
          </el-menu-item>

          <div class="nav-group-label">资源</div>
          <el-menu-item index="/app/resources/equipment">
            <el-icon><Monitor /></el-icon><span>设备</span>
          </el-menu-item>
          <el-menu-item index="/app/resources/personnel">
            <el-icon><UserFilled /></el-icon><span>人员资质</span>
          </el-menu-item>
          <el-menu-item index="/app/resources/labs">
            <el-icon><OfficeBuilding /></el-icon><span>实验室资源</span>
          </el-menu-item>

          <div class="nav-group-label">平台管理</div>
          <el-menu-item index="/app/admin/orgs">
            <el-icon><OfficeBuilding /></el-icon><span>组织与实验室</span>
          </el-menu-item>
          <el-menu-item index="/app/admin/roles">
            <el-icon><Lock /></el-icon><span>角色权限</span>
          </el-menu-item>
          <el-menu-item index="/app/admin/audit">
            <el-icon><Memo /></el-icon><span>审计</span>
          </el-menu-item>
          <el-menu-item index="/app/admin/settings">
            <el-icon><Tools /></el-icon><span>系统设置</span>
          </el-menu-item>
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
  height: 48px; background: #fff; border-bottom: 1px solid #D9DEE7;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 20px; flex-shrink: 0; z-index: 100;
}
.topbar-left { display: flex; align-items: center; }
.logo { display: flex; align-items: center; gap: 8px; }
.logo-abbr {
  width: 28px; height: 28px; background: #1677FF; color: #fff;
  font-size: 10px; font-weight: 700; border-radius: 4px;
  display: flex; align-items: center; justify-content: center; letter-spacing: -0.5px;
}
.logo-text { font-size: 13px; font-weight: 600; color: #0B1220; }
.logo-badge {
  font-size: 10px; color: #526075; background: #F5F7FA;
  border: 1px solid #D9DEE7; padding: 1px 6px; border-radius: 3px;
}
.topbar-right { display: flex; align-items: center; gap: 12px; }
.topbar-icon { cursor: pointer; color: #526075; }
.topbar-divider { width: 1px; height: 16px; background: #D9DEE7; }
.user-info { display: flex; align-items: center; gap: 6px; cursor: pointer; color: #0B1220; font-size: 13px; }
.user-name { font-size: 13px; }

.app-body { display: flex; flex: 1; overflow: hidden; }
.sidebar {
  width: 220px; background: #fff; border-right: 1px solid #D9DEE7;
  overflow-y: auto; flex-shrink: 0;
}
.sidebar-menu { border-right: none !important; padding: 8px 0; }
.nav-group-label {
  font-size: 11px; color: #B0B9C6; font-weight: 500; letter-spacing: 0.5px;
  padding: 12px 16px 4px; text-transform: uppercase;
}
.sidebar :deep(.el-menu-item) {
  height: 34px; line-height: 34px; font-size: 13px; color: #526075;
  padding: 0 16px !important; border-radius: 0; margin: 0;
}
.sidebar :deep(.el-menu-item:hover) { background: #F5F7FA; color: #0B1220; }
.sidebar :deep(.el-menu-item.is-active) { background: #EDF4FF; color: #1677FF; font-weight: 500; }
.sidebar :deep(.el-menu-item .el-icon) { margin-right: 8px; font-size: 14px; }

.main-content { flex: 1; overflow-y: auto; background: #F5F7FA; }
</style>
