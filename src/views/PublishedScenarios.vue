<template>
  <div class="catalog-page">
    <header class="page-header">
      <div>
        <h1>已发布场景</h1>
        <p>Published Scenario Catalog · 每个发布版本都是不可变业务快照，可被委托 / 申请在运行时引用。</p>
      </div>
      <div class="header-actions">
        <el-button size="small" @click="router.push('/app/scenarios/activation')">场景激活</el-button>
        <el-button type="primary" size="small" @click="router.push('/app/scenarios')">场景包管理</el-button>
      </div>
    </header>

    <div class="governance-notice">
      <el-icon><Lock /></el-icon>
      <div><strong>Published Version 不可直接编辑。</strong><span>新委托绑定当时的 Scenario Snapshot；已有运行实例不会被后续版本升级或场景停用静默改变。</span></div>
    </div>

    <div class="catalog-panel">
      <div class="filter-bar">
        <el-input v-model="search" placeholder="搜索场景名称 / Key / Snapshot" size="small" clearable prefix-icon="Search" style="width:280px" />
        <el-select v-model="domainFilter" placeholder="领域" clearable size="small" style="width:140px"><el-option label="食品检测" value="食品检测"/><el-option label="环境检测" value="环境检测"/><el-option label="几何量" value="几何量"/></el-select>
        <el-select v-model="activationFilter" placeholder="激活状态" clearable size="small" style="width:130px"><el-option label="已激活" value="active"/><el-option label="未激活" value="inactive"/></el-select>
        <span class="result-count">{{ filteredScenarios.length }} 个已发布场景</span>
      </div>

      <el-table :data="filteredScenarios" border size="small" @row-click="openScenario" class="catalog-table">
        <el-table-column label="场景" min-width="210" fixed>
          <template #default="{ row }"><div class="scene-cell"><strong>{{ row.name }}</strong><span>{{ row.key }}</span></div></template>
        </el-table-column>
        <el-table-column label="当前发布版本" width="125"><template #default="{ row }"><span class="reference-token">{{ row.version }}</span></template></el-table-column>
        <el-table-column label="业务模式" width="110" prop="mode" />
        <el-table-column label="领域" width="95" prop="domain" />
        <el-table-column label="激活范围" min-width="150"><template #default="{ row }"><div>{{ row.activationScope }}</div><div class="sub-text">{{ row.activeLabs }} 个 LabEntity</div></template></el-table-column>
        <el-table-column label="运行实例" width="105"><template #default="{ row }"><strong>{{ row.running }}</strong><span class="sub-inline"> / {{ row.monthly }}</span></template></el-table-column>
        <el-table-column label="Snapshot" min-width="145"><template #default="{ row }"><span class="hash-text">{{ row.hash }}</span></template></el-table-column>
        <el-table-column label="发布时间" width="145" prop="publishedAt" />
        <el-table-column label="状态" width="95"><template #default="{ row }"><span :class="['activation-state', row.active ? 'active' : 'inactive']"><el-icon><component :is="row.active ? 'CircleCheck' : 'Remove'" /></el-icon>{{ row.active ? '已激活' : '未激活' }}</span></template></el-table-column>
        <el-table-column label="操作" width="125" fixed="right"><template #default="{ row }"><el-button link type="primary" size="small" @click.stop="openScenario(row)">查看</el-button><el-button link size="small" @click.stop="newVersion(row)">新版本</el-button></template></el-table-column>
      </el-table>
    </div>

    <el-drawer v-model="drawerOpen" size="640px" :with-header="false">
      <div v-if="selected" class="drawer-shell">
        <header class="drawer-header">
          <div>
            <div class="drawer-title-row"><h2>{{ selected.name }}</h2><span class="reference-token">{{ selected.version }}</span><span class="immutable-token"><el-icon><Lock /></el-icon>Immutable</span></div>
            <div class="drawer-key">{{ selected.key }}</div>
          </div>
          <el-button type="primary" size="small" @click="newVersion(selected)"><el-icon><Plus /></el-icon>创建新版本</el-button>
        </header>

        <nav class="drawer-tabs">
          <button v-for="tab in tabs" :key="tab.key" :class="{ active: activeTab === tab.key }" @click="activeTab = tab.key">{{ tab.label }}</button>
        </nav>

        <section v-if="activeTab === 'overview'" class="drawer-content">
          <div class="snapshot-panel">
            <div class="snapshot-head"><strong>Scenario Snapshot</strong><span class="validation-state ok"><el-icon><CircleCheck /></el-icon>签名有效</span></div>
            <div class="snapshot-hash">sha256:{{ selected.hashFull }}</div>
            <div class="snapshot-meta"><span>发布时间 {{ selected.publishedAt }}</span><span>发布人 {{ selected.publisher }}</span><span>Platform {{ selected.platformVersion }}</span></div>
          </div>
          <div class="detail-grid">
            <div><span>业务模式</span><strong>{{ selected.mode }}</strong></div><div><span>领域</span><strong>{{ selected.domain }}</strong></div><div><span>Workflow</span><strong>{{ selected.workflowVersion }}</strong></div><div><span>检测项</span><strong>{{ selected.itemCount }} 项</strong></div><div><span>标准 / 方法</span><strong>{{ selected.standardCount }} / {{ selected.methodCount }}</strong></div><div><span>报告模板</span><strong>{{ selected.reportVersion }}</strong></div>
          </div>
          <div class="section-title">依赖快照</div>
          <div class="dependency-list"><div v-for="dep in selected.dependencies" :key="dep.type + dep.ref" class="dependency-row"><span class="dep-type">{{ dep.type }}</span><span class="reference-token">{{ dep.ref }}</span><span class="validation-state ok"><el-icon><CircleCheck /></el-icon>resolved</span></div></div>
        </section>

        <section v-else-if="activeTab === 'versions'" class="drawer-content">
          <div class="section-title">版本链</div>
          <div class="version-list">
            <div v-for="version in selected.versions" :key="version.version" class="version-row">
              <div class="version-line"><span class="reference-token">{{ version.version }}</span><span :class="['version-status', version.status.toLowerCase()]">{{ version.status }}</span></div>
              <div class="version-copy"><strong>{{ version.note }}</strong><span>{{ version.time }}</span><span v-if="version.hash" class="hash-text">sha256:{{ version.hash }}</span></div>
            </div>
          </div>
          <div class="version-note"><el-icon><InfoFilled /></el-icon>Draft 可以反复编辑；Published 只读；Deprecated / Retired 仍保留历史运行追溯。</div>
        </section>

        <section v-else-if="activeTab === 'activation'" class="drawer-content">
          <div class="section-title">激活范围</div>
          <div class="activation-card"><div><span>当前状态</span><strong :class="selected.active ? 'success-text' : ''">{{ selected.active ? '已激活' : '未激活' }}</strong></div><div><span>作用域</span><strong>{{ selected.activationScope }}</strong></div><div><span>LabEntity</span><strong>{{ selected.activeLabs }} 个</strong></div></div>
          <el-table :data="selected.labs" border size="small"><el-table-column prop="name" label="实验室"/><el-table-column prop="tenant" label="Tenant" width="120"/><el-table-column label="状态" width="100"><template #default="{ row }"><span :class="['activation-state', row.active ? 'active' : 'inactive']">{{ row.active ? '已激活' : '未激活' }}</span></template></el-table-column></el-table>
          <el-button size="small" style="margin-top:14px" @click="router.push('/app/scenarios/activation')">打开场景激活管理</el-button>
        </section>

        <section v-else class="drawer-content">
          <div class="runtime-summary"><div><span>本月使用</span><strong>{{ selected.monthly }}</strong></div><div><span>进行中</span><strong>{{ selected.running }}</strong></div><div><span>已完成</span><strong>{{ selected.completed }}</strong></div><div><span>异常流程</span><strong class="danger-text">{{ selected.exceptions }}</strong></div></div>
          <div class="runtime-note"><el-icon><Lock /></el-icon>每个 Process Instance 保存 scenarioVersionId + snapshotHash，不通过“当前最新版本”回查配置。</div>
          <el-table :data="selected.instances" border size="small"><el-table-column prop="request" label="委托 / 申请" min-width="150"/><el-table-column prop="node" label="当前节点" min-width="130"/><el-table-column label="Snapshot" min-width="130"><template #default="{ row }"><span class="hash-text">{{ row.hash }}</span></template></el-table-column><el-table-column prop="since" label="进入时间" width="130"/></el-table>
        </section>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const search = ref('')
const domainFilter = ref('')
const activationFilter = ref('')
const drawerOpen = ref(false)
const selected = ref<any>(null)
const activeTab = ref('overview')
const tabs = [{ key: 'overview', label: '快照概览' }, { key: 'versions', label: '版本历史' }, { key: 'activation', label: '激活范围' }, { key: 'runtime', label: '运行实例' }]

const baseDependencies = [
  { type: 'STANDARD', ref: 'GB 5009.12-2023' },
  { type: 'METHOD', ref: 'ICP-MS Pb v2.1' },
  { type: 'REPORT', ref: 'food-physchem-report v4.2' },
  { type: 'AI_SKILL', ref: 'report-draft v2.0' },
]

const scenarios = ref([
  {
    id: 1, name: '第三方食品理化检测', key: 'third-party-food-physchem', version: 'v1.2.0', mode: '第三方委托', domain: '食品检测', activationScope: '华东食品实验室', activeLabs: 3, running: 7, monthly: 43, completed: 36, exceptions: 0, hash: '7fa3c2d9', hashFull: '7fa3c2d9b7e41bca22c61e17924d8f4047c2d89a2ac9f47be91d5a77e83a012f', publishedAt: '2026-08-12 14:30', publisher: '张授权', platformVersion: '2.0.0', active: true, workflowVersion: 'food-flow v1.4', itemCount: 18, standardCount: 11, methodCount: 9, reportVersion: 'Food Report v4.2', dependencies: baseDependencies,
    versions: [{ version: 'v1.3.0', status: 'Draft', note: '新增总砷，升级两个检测方法', time: '编辑中', hash: '' }, { version: 'v1.2.0', status: 'Published', note: '当前运行版本', time: '2026-08-12 14:30', hash: '7fa3c2d9' }, { version: 'v1.1.0', status: 'Deprecated', note: '由 v1.2.0 取代', time: '2026-05-01', hash: 'b4c56ef1' }, { version: 'v1.0.0', status: 'Retired', note: '首发版本', time: '2026-01-10', hash: 'd2e78fa0' }],
    labs: [{ name: '上海食品检测实验室', tenant: '华东区', active: true }, { name: '苏州食品实验室', tenant: '华东区', active: true }, { name: '杭州检测中心', tenant: '华东区', active: true }],
    instances: [{ request: 'REQ-20260905-021', node: '实验室检测', hash: '7fa3c2d9', since: '09-05 10:20' }, { request: 'REQ-20260904-118', node: '技术审核', hash: '7fa3c2d9', since: '09-05 08:42' }, { request: 'REQ-20260903-087', node: '报告签发', hash: '7fa3c2d9', since: '09-04 17:15' }],
  },
  {
    id: 2, name: '环境水质现场监测', key: 'environment-water-field', version: 'v2.0.1', mode: '第三方委托', domain: '环境检测', activationScope: '深圳综合实验室', activeLabs: 1, running: 2, monthly: 12, completed: 10, exceptions: 1, hash: 'c3d45fe8', hashFull: 'c3d45fe8a10f9404b916ef6749432667fc7c002d75318ee5c7fba81327f46311', publishedAt: '2026-08-28 09:10', publisher: '王授权', platformVersion: '2.0.0', active: true, workflowVersion: 'env-field-flow v2.3', itemCount: 24, standardCount: 15, methodCount: 12, reportVersion: 'Env Water Report v3.1', dependencies: [{ type:'STANDARD',ref:'HJ 828-2017'},{ type:'NODE_TYPE',ref:'FIELD_SAMPLING v2'},{ type:'FORM',ref:'sampling-point v4'},{ type:'REPORT',ref:'env-water-report v3.1'}],
    versions: [{ version:'v2.0.1',status:'Published',note:'当前运行版本',time:'2026-08-28',hash:'c3d45fe8'},{version:'v2.0.0',status:'Deprecated',note:'修复现场采样表单',time:'2026-08-10',hash:'aa87122f'}],
    labs:[{name:'深圳综合检测实验室',tenant:'华南区',active:true}], instances:[{request:'REQ-20260905-009',node:'现场采样',hash:'c3d45fe8',since:'09-05 07:30'},{request:'REQ-20260904-074',node:'实验室接收',hash:'c3d45fe8',since:'09-05 11:05'}],
  },
  {
    id: 3, name: '企业内部几何量检测', key: 'internal-metrology', version: 'v2.1.0', mode: '企业内部', domain: '几何量', activationScope: '北京计量实验室', activeLabs: 2, running: 12, monthly: 61, completed: 49, exceptions: 0, hash: 'e9f01ac4', hashFull: 'e9f01ac42a9e121bb564041325c31df13b2f7bd09f8eed9468158f95c6fb1e88', publishedAt: '2026-09-01 10:20', publisher: '赵计量', platformVersion: '2.0.0', active: true, workflowVersion: 'metrology-flow v2.1', itemCount: 8, standardCount: 5, methodCount: 6, reportVersion: 'Measurement Report v5.0', dependencies:[{type:'METHOD',ref:'CMM GD&T v3'},{type:'ADAPTER',ref:'generic-cmm-import v2'},{type:'REPORT',ref:'measurement-report v5.0'}],
    versions:[{version:'v2.1.0',status:'Published',note:'当前运行版本',time:'2026-09-01',hash:'e9f01ac4'},{version:'v2.0.0',status:'Deprecated',note:'升级测量不确定度模型',time:'2026-06-12',hash:'44129bc0'}],
    labs:[{name:'北京计量实验室',tenant:'制造事业群',active:true},{name:'天津精密测量中心',tenant:'制造事业群',active:true}],instances:[{request:'INT-20260905-031',node:'CMM 测量',hash:'e9f01ac4',since:'09-05 13:20'}],
  },
  {
    id: 4, name: '食品微生物检测', key: 'food-microbiology', version: 'v2.1.0', mode: '第三方委托', domain: '食品检测', activationScope: '未配置', activeLabs: 0, running: 0, monthly: 0, completed: 0, exceptions: 0, hash: 'a8b91ef2', hashFull: 'a8b91ef2f150189f8b3b746ab941d0ae8f23ac0ebbe1d80d9bb2816a90ef9912', publishedAt: '2026-07-20 09:15', publisher: '李质量', platformVersion: '2.0.0', active: false, workflowVersion: 'microbiology-flow v2.0', itemCount: 12, standardCount: 8, methodCount: 6, reportVersion: 'Micro Report v3.0', dependencies:baseDependencies,versions:[{version:'v2.1.0',status:'Published',note:'待激活',time:'2026-07-20',hash:'a8b91ef2'}],labs:[],instances:[],
  },
])

const filteredScenarios = computed(() => scenarios.value.filter(scene => {
  const q = search.value.trim().toLowerCase()
  const text = `${scene.name} ${scene.key} ${scene.hash}`.toLowerCase()
  const activationMatches = !activationFilter.value || (activationFilter.value === 'active' ? scene.active : !scene.active)
  return (!q || text.includes(q)) && (!domainFilter.value || scene.domain === domainFilter.value) && activationMatches
}))

function openScenario(row: any) { selected.value = row; activeTab.value = 'overview'; drawerOpen.value = true }
function newVersion(row: any) { router.push({ path: '/app/scenarios/studio', query: { from: row.key, version: row.version } }) }
</script>

<style scoped>
.catalog-page { padding:24px 28px 40px;color:var(--ui-text); }.page-header { display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:14px; }.page-header h1 { margin:0;font-size:20px;font-weight:600; }.page-header p { margin:5px 0 0;color:var(--ui-text-secondary);font-size:12px; }.header-actions { display:flex;gap:8px; }.governance-notice { display:flex;align-items:flex-start;gap:8px;background:var(--ui-selected-bg);border:1px solid var(--ui-border);border-radius:var(--ui-radius-panel);padding:10px 12px;margin-bottom:14px;color:var(--ui-text-secondary);font-size:11px; }.governance-notice > div { display:flex;flex-direction:column;gap:2px; }.governance-notice strong { color:var(--ui-text);font-size:11px; }.catalog-panel { background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius-panel);overflow:hidden; }.filter-bar { min-height:52px;padding:9px 12px;border-bottom:1px solid var(--ui-border);display:flex;align-items:center;gap:8px; }.result-count { margin-left:auto;color:var(--ui-text-tertiary);font-size:11px; }.catalog-table :deep(.el-table__row) { cursor:pointer; }.scene-cell { display:flex;flex-direction:column;gap:2px; }.scene-cell strong { color:var(--ui-text);font-size:12px;font-weight:500; }.scene-cell span { color:var(--ui-text-tertiary);font-family:var(--ui-font-mono);font-size:9px; }.reference-token { display:inline-block;width:fit-content;border:1px solid var(--ui-border);background:var(--ui-surface-muted);border-radius:3px;color:var(--ui-text-secondary);padding:2px 6px;font-family:var(--ui-font-mono);font-size:10px;white-space:nowrap; }.sub-text { color:var(--ui-text-tertiary);font-size:9px;margin-top:2px; }.sub-inline { color:var(--ui-text-tertiary);font-size:10px; }.hash-text { color:var(--ui-text-secondary);font-family:var(--ui-font-mono);font-size:9px; }.activation-state { display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:500; }.activation-state.active { color:var(--ui-success); }.activation-state.inactive { color:var(--ui-text-tertiary); }
.drawer-shell { min-height:100%;background:var(--ui-surface); }.drawer-header { min-height:76px;padding:14px 18px;border-bottom:1px solid var(--ui-border);display:flex;align-items:center;justify-content:space-between;gap:12px; }.drawer-title-row { display:flex;align-items:center;gap:7px; }.drawer-title-row h2 { margin:0;font-size:16px; }.drawer-key { margin-top:4px;color:var(--ui-text-tertiary);font-family:var(--ui-font-mono);font-size:9px; }.immutable-token { display:inline-flex;align-items:center;gap:3px;color:var(--ui-text-tertiary);font-size:9px; }.drawer-tabs { height:40px;display:flex;align-items:flex-end;gap:18px;padding:0 18px;border-bottom:1px solid var(--ui-border); }.drawer-tabs button { height:40px;border:0;border-bottom:2px solid transparent;background:transparent;color:var(--ui-text-secondary);font:inherit;font-size:11px;cursor:pointer;padding:0 2px; }.drawer-tabs button.active { color:var(--ui-action-text);border-bottom-color:var(--ui-brand); }.drawer-content { padding:18px; }.snapshot-panel { border:1px solid var(--ui-border);border-radius:var(--ui-radius-panel);background:var(--ui-surface-muted);padding:13px; }.snapshot-head { display:flex;align-items:center;justify-content:space-between;margin-bottom:8px; }.snapshot-head strong { font-size:11px; }.snapshot-hash { font-family:var(--ui-font-mono);font-size:10px;color:var(--ui-text-secondary);overflow-wrap:anywhere;padding:8px;background:var(--ui-surface);border:1px solid var(--ui-border-subtle);border-radius:3px; }.snapshot-meta { display:flex;gap:12px;flex-wrap:wrap;margin-top:8px;color:var(--ui-text-tertiary);font-size:9px; }.validation-state { display:inline-flex;align-items:center;gap:3px;font-size:9px; }.validation-state.ok,.success-text { color:var(--ui-success); }.detail-grid { display:grid;grid-template-columns:1fr 1fr 1fr;border:1px solid var(--ui-border);border-radius:var(--ui-radius-panel);margin-top:12px;overflow:hidden; }.detail-grid > div { padding:10px 12px;border-right:1px solid var(--ui-border-subtle);border-bottom:1px solid var(--ui-border-subtle);display:flex;flex-direction:column;gap:3px; }.detail-grid > div:nth-child(3n) { border-right:0; }.detail-grid span { color:var(--ui-text-tertiary);font-size:9px; }.detail-grid strong { font-size:11px;font-weight:500; }.section-title { margin:18px 0 8px;font-size:11px;font-weight:600; }.dependency-list { border:1px solid var(--ui-border);border-radius:var(--ui-radius-panel); }.dependency-row { display:grid;grid-template-columns:90px minmax(0,1fr) 80px;gap:8px;align-items:center;padding:8px 10px;border-bottom:1px solid var(--ui-border-subtle); }.dependency-row:last-child { border-bottom:0; }.dep-type { color:var(--ui-text-tertiary);font-size:9px; }.version-list { border-top:1px solid var(--ui-border-subtle); }.version-row { display:grid;grid-template-columns:120px minmax(0,1fr);gap:12px;padding:12px 0;border-bottom:1px solid var(--ui-border-subtle); }.version-line { display:flex;align-items:flex-start;gap:6px; }.version-status { font-size:9px;color:var(--ui-text-secondary); }.version-status.published { color:var(--ui-success); }.version-status.deprecated,.version-status.retired { color:var(--ui-text-tertiary); }.version-copy { display:flex;flex-direction:column;gap:3px; }.version-copy strong { font-size:10px;font-weight:500; }.version-copy span { color:var(--ui-text-tertiary);font-size:9px; }.version-note,.runtime-note { margin-top:14px;padding:9px 10px;background:var(--ui-surface-muted);border:1px solid var(--ui-border-subtle);border-radius:4px;color:var(--ui-text-secondary);font-size:10px;line-height:1.5;display:flex;gap:5px; }.activation-card,.runtime-summary { display:grid;grid-template-columns:repeat(3,1fr);border:1px solid var(--ui-border);border-radius:var(--ui-radius-panel);margin-bottom:14px;overflow:hidden; }.activation-card > div,.runtime-summary > div { padding:12px;border-right:1px solid var(--ui-border-subtle);display:flex;flex-direction:column;gap:3px; }.activation-card > div:last-child,.runtime-summary > div:last-child { border-right:0; }.activation-card span,.runtime-summary span { color:var(--ui-text-tertiary);font-size:9px; }.activation-card strong,.runtime-summary strong { font-size:12px;font-weight:500; }.runtime-summary { grid-template-columns:repeat(4,1fr); }.danger-text { color:var(--ui-danger); }
@media(max-width:1180px){.catalog-page{padding:20px}.detail-grid{grid-template-columns:1fr 1fr}.detail-grid>div:nth-child(3n){border-right:1px solid var(--ui-border-subtle)}.detail-grid>div:nth-child(2n){border-right:0}}
</style>
