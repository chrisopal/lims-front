<template>
  <div class="page-shell">
    <div class="page-header">
      <div class="ph-left">
        <div class="page-title">已发布场景目录</div>
        <div class="page-sub">Published Scenario Catalog · 已发布场景为不可变快照，如需更改请创建新版本</div>
      </div>
      <div class="ph-right">
        <el-input placeholder="搜索场景名称 / Key" style="width:220px" size="small" clearable prefix-icon="Search" />
        <el-select placeholder="领域" clearable size="small" style="width:120px" value="">
          <el-option label="食品检测" value="food" />
          <el-option label="环境检测" value="env" />
          <el-option label="理化检测" value="physchem" />
          <el-option label="几何量" value="metrology" />
        </el-select>
      </div>
    </div>
    <div class="immutable-notice">
      <el-icon size="13" color="#1677FF"><InfoFilled /></el-icon>
      <span>已发布场景以不可变快照形式锁定，Snapshot Hash 由系统签名。所有正在运行的业务流程将使用其委托创建时绑定的快照版本，不受后续新版本发布影响。</span>
    </div>
    <div class="catalog-table-wrap">
      <el-table :data="scenarios" border size="small" @row-click="openDetail" style="cursor:pointer">
        <el-table-column label="场景名称" min-width="180">
          <template #default="{ row }">
            <div class="sc-name">{{ row.name }}</div>
            <div class="sc-key">{{ row.key }}</div>
          </template>
        </el-table-column>
        <el-table-column label="发布版本" width="120">
          <template #default="{ row }">
            <span class="ver-chip pub">{{ row.latestPublished }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Snapshot Hash" width="150">
          <template #default="{ row }">
            <span class="hash-val">sha256:{{ row.hash }}</span>
          </template>
        </el-table-column>
        <el-table-column label="业务模式" width="120" prop="mode" />
        <el-table-column label="领域" width="100" prop="domain" />
        <el-table-column label="实验室" width="140" prop="lab" />
        <el-table-column label="发布时间" width="130" prop="publishedAt" />
        <el-table-column label="激活状态" width="100">
          <template #default="{ row }">
            <span :class="['act-tag', row.activated ? 'on' : 'off']">
              <el-icon size="9"><component :is="row.activated ? 'CircleCheck' : 'Remove'" /></el-icon>
              {{ row.activated ? '已激活' : '未激活' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="本月使用" width="90" prop="usageCount" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link size="small" type="primary" @click.stop="openDetail(row)">查看</el-button>
            <el-button link size="small" @click.stop="createNewVersion(row)">创建新版本</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-drawer v-model="drawerVisible" size="600px" @close="activeTab = 'overview'">
      <template #header>
        <div class="drawer-header">
          <div>
            <div class="drawer-title">{{ selectedScenario?.name }}</div>
            <div class="drawer-sub">
              <span class="ver-chip pub small">{{ selectedScenario?.latestPublished }}</span>
              <span class="readonly-badge"><el-icon size="10"><Lock /></el-icon> 只读 · 不可编辑</span>
            </div>
          </div>
          <el-button type="primary" size="small" @click="createNewVersion(selectedScenario)">
            <el-icon><Plus /></el-icon> 创建新版本
          </el-button>
        </div>
      </template>
      <div v-if="selectedScenario" class="drawer-body">
        <div class="detail-tabs">
          <div v-for="t in tabs" :key="t.key" :class="['d-tab', { active: activeTab === t.key }]" @click="activeTab = t.key">{{ t.label }}</div>
        </div>
        <div v-if="activeTab === 'overview'" class="tab-body">
          <div class="snapshot-box">
            <div class="sb-title"><el-icon size="12" color="#18794E"><Lock /></el-icon> 不可变快照信息</div>
            <div class="kv-row"><span class="kl">Snapshot Hash</span><span class="hash-val-lg">sha256:{{ selectedScenario?.hash }}</span></div>
            <div class="kv-row"><span class="kl">签名时间</span><span class="kv">{{ selectedScenario?.publishedAt }}</span></div>
            <div class="kv-row"><span class="kl">签名人</span><span class="kv">{{ selectedScenario?.publisher }}</span></div>
            <div class="kv-row"><span class="kl">版本</span><span class="kv mono">{{ selectedScenario?.latestPublished }}</span></div>
          </div>
          <el-divider />
          <div class="kv-row"><span class="kl">场景 Key</span><span class="kv mono">{{ selectedScenario?.key }}</span></div>
          <div class="kv-row"><span class="kl">业务模式</span><span class="kv">{{ selectedScenario?.mode }}</span></div>
          <div class="kv-row"><span class="kl">领域</span><span class="kv">{{ selectedScenario?.domain }}</span></div>
          <div class="kv-row"><span class="kl">实验室</span><span class="kv">{{ selectedScenario?.lab }}</span></div>
          <div class="kv-row"><span class="kl">检测项数</span><span class="kv">{{ selectedScenario?.itemCount }} 项</span></div>
          <div class="kv-row"><span class="kl">关联标准</span><span class="kv">{{ selectedScenario?.stdCount }} 个</span></div>
          <div class="kv-row"><span class="kl">流程节点数</span><span class="kv">{{ selectedScenario?.nodeCount }} 个</span></div>
        </div>
        <div v-else-if="activeTab === 'versions'" class="tab-body">
          <div v-for="v in versionHistory" :key="v.ver" class="ver-hist-row">
            <div class="vhr-left">
              <span class="vhr-ver">{{ v.ver }}</span>
              <span :class="['ver-chip', v.statusCls, 'small']">{{ v.status }}</span>
            </div>
            <div class="vhr-right">
              <div class="vhr-time">{{ v.time }}</div>
              <div class="vhr-note">{{ v.note }}</div>
              <div class="vhr-hash" v-if="v.hash"><el-icon size="10" color="#18794E"><Lock /></el-icon>sha256:{{ v.hash }}</div>
            </div>
          </div>
          <div class="create-ver-cta">
            <el-button type="primary" @click="createNewVersion(selectedScenario)"><el-icon><Plus /></el-icon> 创建新版本（Draft）</el-button>
            <div class="cta-hint">新版本在发布前完全独立，不影响已在运行的流程。</div>
          </div>
        </div>
        <div v-else-if="activeTab === 'activation'" class="tab-body">
          <div class="act-row">
            <span class="kl">激活状态</span>
            <el-switch :model-value="selectedScenario?.activated" disabled />
            <span class="act-readonly">（激活配置请在场景激活管理页修改）</span>
          </div>
          <div class="kv-row"><span class="kl">激活实验室</span><span class="kv">{{ selectedScenario?.lab }}</span></div>
          <el-button style="margin-top:16px" @click="$router.push('/app/scenarios/activation')">
            <el-icon><Setting /></el-icon> 打开激活管理
          </el-button>
        </div>
        <div v-else-if="activeTab === 'deps'" class="tab-body">
          <div class="dep-group-title">检测方法版本</div>
          <div v-for="d in deps.methods" :key="d" class="dep-row"><el-icon size="10" color="#18794E"><Checked /></el-icon><span class="dep-val">{{ d }}</span></div>
          <div class="dep-group-title" style="margin-top:14px">法规标准</div>
          <div v-for="d in deps.standards" :key="d" class="dep-row"><el-icon size="10" color="#18794E"><Checked /></el-icon><span class="dep-val">{{ d }}</span></div>
          <div class="dep-group-title" style="margin-top:14px">AI Skills</div>
          <div v-for="d in deps.skills" :key="d" class="dep-row"><el-icon size="10" color="#526075"><MagicStick /></el-icon><span class="dep-val">{{ d }}</span></div>
        </div>
        <div v-else-if="activeTab === 'runtime'" class="tab-body">
          <div class="runtime-stats">
            <div class="rs-item"><div class="rs-val">{{ selectedScenario?.usageCount }}</div><div class="rs-label">本月委托使用</div></div>
            <div class="rs-item"><div class="rs-val">{{ selectedScenario?.activeReqs }}</div><div class="rs-label">进行中</div></div>
            <div class="rs-item"><div class="rs-val">{{ selectedScenario?.completedReqs }}</div><div class="rs-label">已完成</div></div>
          </div>
          <div class="runtime-notice"><el-icon size="12" color="#526075"><InfoFilled /></el-icon>所有进行中的流程均锁定于各自委托时的快照版本，发布新版本不会影响已有流程。</div>
          <div class="running-list">
            <div class="rl-header">进行中的委托</div>
            <div v-for="r in runningReqs" :key="r.id" class="rl-row">
              <span class="rl-id">{{ r.id }}</span>
              <span class="rl-snap">sha256:{{ r.snapHash }}</span>
              <span :class="['rl-node', r.nodeMode]">{{ r.currentNode }}</span>
              <span class="rl-time">{{ r.since }}</span>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()
const drawerVisible = ref(false)
const selectedScenario = ref<any>(null)
const activeTab = ref('overview')
const tabs = [
  { key: 'overview', label: '概览' },
  { key: 'versions', label: '版本历史' },
  { key: 'activation', label: '激活配置' },
  { key: 'deps', label: '依赖快照' },
  { key: 'runtime', label: '运行时使用' },
]
const scenarios = ref([
  { id: 1, name: '第三方食品理化检测', key: 'third-party-food-physchem', latestPublished: 'v1.2.0', hash: '7fa3c2d', mode: '第三方委托', domain: '食品检测', lab: '上海食品检测实验室', publishedAt: '2026-08-12 14:30', publisher: '张授权', activated: true, usageCount: 43, activeReqs: 7, completedReqs: 36, itemCount: 18, stdCount: 11, nodeCount: 7 },
  { id: 2, name: '食品微生物检测', key: 'food-microbiology', latestPublished: 'v2.1.0', hash: 'a8b91ef', mode: '第三方委托', domain: '食品检测', lab: '上海食品检测实验室', publishedAt: '2026-07-20 09:15', publisher: '李质量', activated: true, usageCount: 28, activeReqs: 3, completedReqs: 25, itemCount: 12, stdCount: 8, nodeCount: 6 },
  { id: 3, name: '环境水质监测', key: 'env-water-quality', latestPublished: 'v1.0.0', hash: 'c3d45fe', mode: '政府委托', domain: '环境检测', lab: '深圳综合检测实验室', publishedAt: '2026-06-01 16:00', publisher: '王授权', activated: false, usageCount: 5, activeReqs: 1, completedReqs: 4, itemCount: 24, stdCount: 15, nodeCount: 9 },
  { id: 4, name: '工业零件几何量', key: 'industrial-part-metrology', latestPublished: 'v3.0.1', hash: 'e9f01ac', mode: '企业内部', domain: '几何量', lab: '北京计量实验室', publishedAt: '2026-09-01 10:20', publisher: '赵计量', activated: true, usageCount: 61, activeReqs: 12, completedReqs: 49, itemCount: 8, stdCount: 5, nodeCount: 5 },
])
const versionHistory = ref([
  { ver: 'v1.3.0', status: 'Draft', statusCls: 'draft', time: '编辑中', note: '新增总砷、更新 GB 5009.12', hash: null },
  { ver: 'v1.2.0', status: 'Published', statusCls: 'pub', time: '2026-08-12 14:30', note: '当前激活版本', hash: '7fa3c2d...' },
  { ver: 'v1.1.0', status: 'Deprecated', statusCls: 'dep', time: '2026-05-01 11:00', note: '已被 v1.2 取代', hash: 'b4c56ef...' },
  { ver: 'v1.0.0', status: 'Retired', statusCls: 'ret', time: '2026-01-10 09:00', note: '首发版本', hash: 'd2e78fa...' },
])
const deps = ref({
  methods: ['ICP-MS Pb v2', 'ICP-MS Cd v2', 'HG-AFS As v1', 'HPLC BA v3', 'MPN法 v2'],
  standards: ['GB 5009.12-2023', 'GB 5009.15-2023', 'GB 5009.11-2014', 'GB 4789.2-2022'],
  skills: ['standard-match v1.2', 'report-draft v2.0', 'report-review v1.4'],
})
const runningReqs = ref([
  { id: 'REQ-20260901-009', snapHash: '7fa3c2d', currentNode: '实验室检测', nodeMode: 'HUMAN_TASK', since: '2026-09-01' },
  { id: 'REQ-20260904-015', snapHash: '7fa3c2d', currentNode: '技术审核', nodeMode: 'HUMAN_TASK', since: '2026-09-04' },
])
function openDetail(row: any) { selectedScenario.value = row; activeTab.value = 'overview'; drawerVisible.value = true }
function createNewVersion(_row: any) { router.push('/app/scenarios/studio') }
</script>
<style scoped>
.page-shell { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 18px 24px 14px; background: #fff; border-bottom: 1px solid #D9DEE7; flex-shrink: 0; }
.page-title { font-size: 18px; font-weight: 600; color: #0B1220; }
.page-sub { font-size: 12px; color: #8A96A6; margin-top: 3px; }
.ph-right { display: flex; gap: 8px; align-items: center; }
.immutable-notice { display: flex; align-items: center; gap: 8px; padding: 9px 24px; background: #EDF4FF; border-bottom: 1px solid #91CAFF; font-size: 12px; color: #1677FF; flex-shrink: 0; }
.catalog-table-wrap { flex: 1; overflow-y: auto; padding: 16px 24px; }
.sc-name { font-size: 13px; font-weight: 600; color: #0B1220; }
.sc-key { font-family: monospace; font-size: 11px; color: #8A96A6; }
.ver-chip { font-size: 10px; padding: 2px 7px; border-radius: 3px; font-weight: 600; display: inline-block; }
.ver-chip.pub { background: #F0FFF4; color: #18794E; border: 1px solid #B7E6CB; }
.ver-chip.pub.small, .ver-chip.draft.small, .ver-chip.dep.small, .ver-chip.ret.small { font-size: 10px; padding: 1px 5px; }
.ver-chip.draft { background: #FFF3E0; color: #A9650A; }
.ver-chip.dep { background: #FFF1F0; color: #C32F3F; }
.ver-chip.ret { background: #F5F7FA; color: #8A96A6; }
.hash-val { font-family: monospace; font-size: 11px; color: #8A96A6; }
.hash-val-lg { font-family: monospace; font-size: 11px; color: #18794E; background: #F0FFF4; padding: 3px 8px; border-radius: 3px; }
.act-tag { font-size: 11px; display: inline-flex; align-items: center; gap: 3px; padding: 2px 6px; border-radius: 3px; }
.act-tag.on { background: #F0FFF4; color: #18794E; }
.act-tag.off { background: #F5F7FA; color: #8A96A6; }
.drawer-header { display: flex; align-items: flex-start; justify-content: space-between; width: 100%; }
.drawer-title { font-size: 15px; font-weight: 600; color: #0B1220; }
.drawer-sub { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
.readonly-badge { font-size: 11px; background: #F5F7FA; border: 1px solid #D9DEE7; color: #8A96A6; padding: 2px 7px; border-radius: 3px; display: inline-flex; align-items: center; gap: 4px; }
.detail-tabs { display: flex; border-bottom: 1px solid #D9DEE7; margin-bottom: 16px; }
.d-tab { padding: 8px 12px; font-size: 12px; color: #526075; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; }
.d-tab.active { color: #1677FF; border-bottom-color: #1677FF; }
.tab-body { display: flex; flex-direction: column; gap: 10px; }
.snapshot-box { background: #F0FFF4; border: 1px solid #B7E6CB; border-radius: 4px; padding: 14px; }
.sb-title { font-size: 12px; font-weight: 600; color: #18794E; display: flex; align-items: center; gap: 6px; margin-bottom: 10px; }
.kv-row { display: flex; align-items: flex-start; gap: 0; }
.kl { width: 120px; font-size: 12px; color: #8A96A6; flex-shrink: 0; }
.kv { font-size: 12px; color: #0B1220; }
.kv.mono { font-family: monospace; font-size: 11px; color: #526075; }
.mono { font-family: monospace; font-size: 11px; color: #526075; }
.ver-hist-row { display: flex; align-items: flex-start; gap: 12px; padding: 10px 0; border-bottom: 1px solid #E7EAF0; }
.vhr-left { display: flex; flex-direction: column; gap: 4px; width: 80px; flex-shrink: 0; }
.vhr-ver { font-family: monospace; font-size: 13px; font-weight: 600; color: #0B1220; }
.vhr-right { flex: 1; }
.vhr-time { font-size: 12px; color: #8A96A6; }
.vhr-note { font-size: 12px; color: #526075; }
.vhr-hash { font-size: 11px; font-family: monospace; color: #18794E; display: flex; align-items: center; gap: 4px; margin-top: 2px; }
.create-ver-cta { margin-top: 20px; text-align: center; }
.cta-hint { font-size: 12px; color: #8A96A6; margin-top: 8px; }
.act-row { display: flex; align-items: center; gap: 10px; font-size: 12px; }
.act-readonly { font-size: 11px; color: #B0B9C6; }
.dep-group-title { font-size: 11px; font-weight: 600; color: #B0B9C6; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
.dep-row { display: flex; align-items: center; gap: 6px; padding: 5px 0; border-bottom: 1px solid #F5F7FA; }
.dep-val { font-size: 12px; font-family: monospace; color: #0B1220; }
.runtime-stats { display: flex; gap: 12px; }
.rs-item { background: #F5F7FA; border: 1px solid #D9DEE7; border-radius: 4px; padding: 12px 16px; text-align: center; flex: 1; }
.rs-val { font-size: 22px; font-weight: 700; color: #0B1220; }
.rs-label { font-size: 11px; color: #8A96A6; margin-top: 2px; }
.runtime-notice { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #526075; background: #F5F7FA; padding: 8px 10px; border-radius: 4px; }
.running-list { border: 1px solid #D9DEE7; border-radius: 4px; overflow: hidden; }
.rl-header { font-size: 11px; font-weight: 600; color: #526075; padding: 7px 12px; background: #F5F7FA; border-bottom: 1px solid #D9DEE7; }
.rl-row { display: flex; align-items: center; gap: 12px; padding: 8px 12px; border-bottom: 1px solid #F5F7FA; font-size: 12px; }
.rl-id { color: #1677FF; font-family: monospace; }
.rl-snap { font-family: monospace; font-size: 10px; color: #8A96A6; }
.rl-node { font-size: 11px; padding: 2px 6px; border-radius: 3px; }
.rl-node.HUMAN_TASK { background: #EDF4FF; color: #1677FF; }
.rl-time { color: #8A96A6; margin-left: auto; }
</style>
