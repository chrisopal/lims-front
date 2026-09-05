<template>
  <div class="app-layout">
    <header class="topbar">
      <div class="topbar-left">
        <button ref="menuButton" class="mobile-menu-toggle" aria-label="打开主导航" aria-controls="primary-navigation" :aria-expanded="mobileOpen" @click="toggleNavigation">
          <el-icon><Menu /></el-icon>
        </button>
        <div class="logo">
          <span class="logo-mark">LOP</span>
          <div class="logo-copy"><span class="logo-text">Laboratory Operations Platform</span><span class="logo-sub">Composable LIMS</span></div>
        </div>
      </div>
      <div class="topbar-right">
        <el-tooltip content="消息" placement="bottom">
          <el-badge :value="3" class="topbar-icon"><el-button text circle aria-label="消息"><el-icon size="17"><Bell /></el-icon></el-button></el-badge>
        </el-tooltip>
        <span class="topbar-divider"></span>
        <el-dropdown>
          <div class="user-info" tabindex="0" aria-label="用户菜单">
            <el-avatar :size="26" class="user-avatar">张</el-avatar><span class="user-name">张研究员</span><el-icon size="12"><ArrowDown /></el-icon>
          </div>
          <template #dropdown><el-dropdown-menu><el-dropdown-item>个人设置</el-dropdown-item><el-dropdown-item divided @click="router.push('/login')">退出登录</el-dropdown-item></el-dropdown-menu></template>
        </el-dropdown>
      </div>
    </header>
    <div class="app-body">
      <button v-if="isMobile && mobileOpen" class="nav-backdrop" aria-label="关闭主导航" tabindex="-1" @click="closeNavigation" />
      <nav id="primary-navigation" ref="navigation" class="sidebar" :class="{ 'is-open': mobileOpen }" :inert="isMobile && !mobileOpen" :role="isMobile ? 'dialog' : undefined" :aria-modal="isMobile && mobileOpen ? 'true' : undefined" aria-label="主导航">
        <el-menu :default-active="activeMenu" router :collapse="false" class="sidebar-menu">
          <el-menu-item index="/app/dashboard"><el-icon><Grid /></el-icon><span>工作台</span></el-menu-item>
          <template v-for="group in menuGroups" :key="group.label">
            <div class="nav-group-label">{{ group.label }}</div>
            <el-menu-item v-for="item in group.items" :key="item.path" :index="item.path"><el-icon><component :is="item.icon" /></el-icon><span>{{ item.label }}</span></el-menu-item>
          </template>
        </el-menu>
      </nav>
      <main class="main-content" :inert="isMobile && mobileOpen"><router-view /></main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
const route = useRoute()
const router = useRouter()
const isMobile = ref(false)
const mobileOpen = ref(false)
const menuButton = ref<HTMLButtonElement | null>(null)
const navigation = ref<HTMLElement | null>(null)
let mediaQuery: MediaQueryList | undefined
const activeMenu = computed(() => route.path === '/app/scenarios/studio' ? '/app/scenarios' : route.path)
const menuGroups = [
  { label: '业务运行', items: [
    { path: '/app/operations/requests', label: '委托 / 申请', icon: 'Document' },
    { path: '/app/operations/my-work', label: '我的工作', icon: 'User' },
    { path: '/app/operations/samples', label: '检测对象 / 样品', icon: 'Box' },
    { path: '/app/operations/tasks', label: '检测任务', icon: 'List' },
    { path: '/app/operations/review', label: '审核中心', icon: 'Finished' },
    { path: '/app/operations/reports', label: '报告', icon: 'Files' },
  ] },
  { label: '场景中心', items: [
    { path: '/app/scenarios', label: '场景包', icon: 'Menu' },
    { path: '/app/scenarios/published', label: '已发布场景', icon: 'CircleCheck' },
    { path: '/app/scenarios/activation', label: '场景激活', icon: 'Switch' },
    { path: '/app/scenarios/versions', label: '发布记录', icon: 'Clock' },
  ] },
  { label: '业务资产', items: [
    { path: '/app/assets/test-items', label: '检测项', icon: 'List' },
    { path: '/app/assets/standards', label: '法律法规与标准', icon: 'Reading' },
    { path: '/app/assets/methods', label: '检测方法', icon: 'Operation' },
    { path: '/app/assets/limits', label: '限值与公式', icon: 'DataAnalysis' },
    { path: '/app/assets/forms', label: '动态表单', icon: 'EditPen' },
    { path: '/app/assets/reports', label: '报告模板', icon: 'DocumentCopy' },
  ] },
  { label: '流程与能力', items: [
    { path: '/app/workflow/designer', label: '流程设计器', icon: 'Share' },
    { path: '/app/workflow/node-types', label: '节点类型', icon: 'Connection' },
    { path: '/app/workflow/ai-skills', label: 'AI Skills', icon: 'Cpu' },
    { path: '/app/workflow/integrations', label: '集成能力', icon: 'Link' },
  ] },
  { label: '资源', items: [
    { path: '/app/resources/equipment', label: '设备', icon: 'Monitor' },
    { path: '/app/resources/personnel', label: '人员资质', icon: 'User' },
    { path: '/app/resources/labs', label: '实验室资源', icon: 'OfficeBuilding' },
  ] },
  { label: '平台管理', items: [
    { path: '/app/admin/orgs', label: '组织与实验室', icon: 'OfficeBuilding' },
    { path: '/app/admin/roles', label: '角色权限', icon: 'Lock' },
    { path: '/app/admin/audit', label: '审计', icon: 'Memo' },
    { path: '/app/admin/settings', label: '系统设置', icon: 'Setting' },
  ] },
]
async function closeNavigation() {
  const restore = mobileOpen.value
  mobileOpen.value = false
  if (restore) { await nextTick(); menuButton.value?.focus() }
}
async function toggleNavigation() {
  if (mobileOpen.value) return closeNavigation()
  mobileOpen.value = true
  await nextTick()
  navigation.value?.querySelector<HTMLElement>('.el-menu-item')?.focus()
}
function syncViewport() {
  isMobile.value = mediaQuery?.matches ?? false
  if (!isMobile.value) mobileOpen.value = false
}
function trapNavigationFocus(event: KeyboardEvent) {
  if (!isMobile.value || !mobileOpen.value) return
  if (event.key === 'Escape') { event.preventDefault(); void closeNavigation(); return }
  if (event.key !== 'Tab') return
  const items = Array.from(navigation.value?.querySelectorAll<HTMLElement>('.el-menu-item') ?? [])
  if (!items.length) return
  const first = items[0]; const last = items[items.length - 1]
  if (event.shiftKey && (document.activeElement === first || !navigation.value?.contains(document.activeElement))) { event.preventDefault(); last.focus() }
  else if (!event.shiftKey && (document.activeElement === last || !navigation.value?.contains(document.activeElement))) { event.preventDefault(); first.focus() }
}
onMounted(() => {
  mediaQuery = window.matchMedia('(max-width: 767px)')
  syncViewport()
  mediaQuery.addEventListener('change', syncViewport)
  document.addEventListener('keydown', trapNavigationFocus)
})
onBeforeUnmount(() => {
  mediaQuery?.removeEventListener('change', syncViewport)
  document.removeEventListener('keydown', trapNavigationFocus)
})
watch(() => route.fullPath, () => { void closeNavigation() })
</script>

<style scoped>
.app-layout { display:flex; flex-direction:column; height:100vh; height:100dvh; overflow:hidden; background:var(--ui-canvas); }
.topbar { height:var(--ui-header-height); min-height:var(--ui-header-height); background:var(--ui-surface); border-bottom:1px solid var(--ui-border); display:flex; align-items:center; justify-content:space-between; padding:0 20px; flex-shrink:0; z-index:100; gap:12px; }
.topbar-left,.topbar-right,.logo,.user-info { display:flex; align-items:center; }
.topbar-left,.logo,.logo-copy { min-width:0; }
.topbar-left,.logo { gap:10px; }
.logo-mark { width:28px; height:28px; flex-shrink:0; background:var(--ui-brand); color:var(--ui-on-action); font-size:10px; font-weight:700; border-radius:var(--ui-radius-control); display:inline-flex; align-items:center; justify-content:center; letter-spacing:-.2px; }
.logo-copy { display:flex; align-items:baseline; gap:8px; }
.logo-text { font-size:13px; font-weight:600; color:var(--ui-text); }
.logo-sub { font-size:11px; color:var(--ui-text-tertiary); }
.topbar-right { gap:10px; flex-shrink:0; }
.topbar-icon { color:var(--ui-text-secondary); }
.topbar-icon :deep(.el-button) { width:30px; height:30px; min-height:30px; color:var(--ui-text-secondary); }
.topbar-divider { width:1px; height:16px; background:var(--ui-border); }
.user-info { gap:7px; cursor:pointer; color:var(--ui-text); font-size:13px; border-radius:var(--ui-radius-control); padding:2px 4px; }
.user-avatar { background:var(--ui-brand); color:var(--ui-on-action); font-size:11px; }
.user-name { font-size:13px; white-space:nowrap; }
.app-body { display:flex; flex:1; min-height:0; overflow:hidden; }
.sidebar { width:var(--ui-sidebar-width); background:var(--ui-surface); border-right:1px solid var(--ui-border); overflow-y:auto; flex-shrink:0; }
.sidebar-menu { border-right:none !important; padding:8px 0 16px; }
.nav-group-label { font-size:12px; color:var(--ui-text-tertiary); font-weight:500; letter-spacing:.2px; padding:14px 16px 5px; }
.sidebar :deep(.el-menu-item) { position:relative; height:36px; line-height:36px; font-size:14px; color:var(--ui-text-secondary); padding:0 16px !important; border-radius:0; margin:0; }
.sidebar :deep(.el-menu-item:hover) { background:var(--ui-surface-muted); color:var(--ui-text); }
.sidebar :deep(.el-menu-item.is-active) { background:var(--ui-selected-bg); color:var(--ui-action-text); font-weight:500; }
.sidebar :deep(.el-menu-item.is-active::before) { content:''; position:absolute; left:0; top:7px; bottom:7px; width:2px; background:var(--ui-brand); }
.sidebar :deep(.el-menu-item .el-icon) { width:16px; margin-right:8px; font-size:16px; color:var(--ui-text-tertiary); }
.sidebar :deep(.el-menu-item.is-active .el-icon) { color:var(--ui-brand); }
.main-content { flex:1; min-width:0; min-height:0; overflow:auto; background:var(--ui-canvas); }
.mobile-menu-toggle { display:none; }
.nav-backdrop { position:fixed; inset:48px 0 0; border:0; background:var(--ui-overlay); z-index:199; }
.user-info:focus-visible,.mobile-menu-toggle:focus-visible,.sidebar :deep(.el-menu-item:focus-visible) { outline:2px solid var(--ui-action-text); outline-offset:-2px; }
@media(max-width:1024px) { .logo-sub { display:none; } }
@media(max-width:767px) {
  .topbar { padding:0 12px; gap:8px; }
  .topbar-left { flex:1; gap:8px; }
  .logo { gap:6px; }
  .logo-text { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:12px; }
  .user-name,.topbar-divider { display:none; }
  .topbar-right { gap:6px; }
  .user-info { gap:3px; padding:0; }
  .mobile-menu-toggle { display:flex; align-items:center; justify-content:center; width:34px; height:34px; flex-shrink:0; padding:0; border:1px solid var(--ui-border-control); border-radius:var(--ui-radius-control); background:var(--ui-surface); color:var(--ui-text-secondary); cursor:pointer; }
  .sidebar { display:none; position:fixed; top:48px; bottom:0; left:0; width:min(280px, calc(100vw - 48px)); z-index:200; }
  .sidebar.is-open { display:block; }
}
</style>
