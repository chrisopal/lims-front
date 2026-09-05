import { createRouter, createWebHashHistory } from 'vue-router'
import Layout from '@/components/Layout.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', component: () => import('@/views/Login.vue') },
    {
      path: '/app',
      component: Layout,
      redirect: '/app/dashboard',
      children: [
        { path: 'dashboard', component: () => import('@/views/Dashboard.vue') },
        // 业务运行
        { path: 'operations/requests', component: () => import('@/views/RequestComposer.vue') },
        { path: 'operations/my-work', component: () => import('@/views/MyWork.vue') },
        { path: 'operations/samples', component: () => import('@/views/SamplesPage.vue') },
        { path: 'operations/tasks', component: () => import('@/views/TasksPage.vue') },
        { path: 'operations/review', component: () => import('@/views/ReviewCenter.vue') },
        { path: 'operations/reports', component: () => import('@/views/ReportsPage.vue') },
        // 场景中心
        { path: 'scenarios', component: () => import('@/views/ScenarioPackList.vue') },
        { path: 'scenarios/studio', component: () => import('@/views/ScenarioPackStudio.vue') },
        { path: 'scenarios/published', component: () => import('@/views/PublishedScenarios.vue') },
        { path: 'scenarios/activation', component: () => import('@/views/ScenarioActivation.vue') },
        { path: 'scenarios/versions', component: () => import('@/views/ScenarioVersionDiff.vue') },
        // 业务资产
        { path: 'assets/test-items', component: () => import('@/views/TestItemsPage.vue') },
        { path: 'assets/standards', component: () => import('@/views/StandardsLibrary.vue') },
        { path: 'assets/methods', component: () => import('@/views/MethodsPage.vue') },
        { path: 'assets/limits', component: () => import('@/views/LimitsPage.vue') },
        { path: 'assets/forms', component: () => import('@/views/FormDesigner.vue') },
        { path: 'assets/reports', component: () => import('@/views/ReportTemplates.vue') },
        // 流程与能力
        { path: 'workflow/designer', component: () => import('@/views/WorkflowBuilder.vue') },
        { path: 'workflow/node-types', component: () => import('@/views/NodeTypeCatalog.vue') },
        { path: 'workflow/ai-skills', component: () => import('@/views/AISkillCenter.vue') },
        { path: 'workflow/integrations', component: () => import('@/views/IntegrationsPage.vue') },
        // 资源
        { path: 'resources/equipment', component: () => import('@/views/EquipmentPage.vue') },
        { path: 'resources/personnel', component: () => import('@/views/PersonnelPage.vue') },
        { path: 'resources/labs', component: () => import('@/views/LabsPage.vue') },
        // 专业工作台；保留已有采样页的旧深链接，统一回到正式“我的工作”路由。
        { path: 'workbench/my-work', redirect: '/app/operations/my-work' },
        { path: 'workbench/field-sampling', component: () => import('@/views/FieldSamplingWorkbench.vue') },
        { path: 'workbench/metrology', component: () => import('@/views/MetrologyWorkbench.vue') },
        // 平台管理
        { path: 'admin/orgs', component: () => import('@/views/OrgAdmin.vue') },
        { path: 'admin/roles', component: () => import('@/views/RolesAdmin.vue') },
        { path: 'admin/audit', component: () => import('@/views/AuditTimeline.vue') },
        { path: 'admin/settings', component: () => import('@/views/SystemSettings.vue') },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/app/dashboard' },
  ],
})

export default router
