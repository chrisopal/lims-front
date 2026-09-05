<template>
  <div class="page std-page">
    <!-- Scenario context bar if coming from studio -->
    <div class="context-bar" v-if="fromScenario">
      <el-icon size="14" color="#1677FF"><Grid /></el-icon>
      <span>场景上下文：第三方食品理化检测 v1.3.0 / 法律法规与标准</span>
      <el-button size="small" type="primary" style="margin-left:auto" @click="$router.push('/app/scenarios/studio')">保存绑定并返回场景</el-button>
    </div>
    <div class="page-header">
      <div>
        <div class="page-title">法律法规与标准库</div>
        <div class="page-subtitle">Regulation & Standard Library · 独立专业资产管理</div>
      </div>
      <el-button type="primary">+ 新增标准</el-button>
    </div>
    <div class="std-layout">
      <!-- Left category tree -->
      <div class="std-tree">
        <div class="tree-title">分类</div>
        <div v-for="cat in categories" :key="cat.key" class="cat-item" :class="{ active: activeCategory === cat.key }" @click="activeCategory = cat.key">
          <span class="cat-name">{{ cat.name }}</span>
          <span class="cat-count">{{ cat.count }}</span>
        </div>
      </div>
      <!-- Main list + search -->
      <div class="std-main">
        <div class="filter-bar">
          <el-input placeholder="编号 / 名称" style="width:240px" size="small" clearable prefix-icon="Search" />
          <el-select placeholder="状态" size="small" style="width:110px" clearable>
            <el-option label="现行有效" value="active" />
            <el-option label="已废止" value="obsolete" />
          </el-select>
        </div>
        <div class="table-wrap">
          <el-table :data="filteredStandards" border size="small" @row-click="openDetail" style="cursor:pointer">
            <el-table-column label="编号" width="200" prop="code" />
            <el-table-column label="名称" min-width="260" prop="name" />
            <el-table-column label="类型" width="100" prop="type" />
            <el-table-column label="当前有效版本" width="130">
              <template #default="{ row }">
                <span class="ver-ref">{{ row.version }}</span>
              </template>
            </el-table-column>
            <el-table-column label="生效日期" width="110" prop="effectDate" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <span :class="['std-status', row.active ? 'active' : 'obsolete']">{{ row.active ? '现行有效' : '已废止' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="关联检测项" width="90" prop="itemCount" />
            <el-table-column label="操作" width="130">
              <template #default>
                <el-button link size="small" type="primary">详情</el-button>
                <el-button link size="small" v-if="fromScenario" type="primary">绑定</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      <!-- Right detail drawer (inline) -->
      <div class="std-detail" v-if="selectedStd">
        <div class="detail-title">{{ selectedStd.code }}</div>
        <div class="detail-name">{{ selectedStd.name }}</div>
        <div class="detail-tabs">
          <div v-for="t in stdDetailTabs" :key="t" class="d-tab" :class="{ active: activeStdTab === t }" @click="activeStdTab = t">{{ t }}</div>
        </div>
        <div class="detail-body" v-if="activeStdTab === '基本信息'">
          <div class="kv"><span class="kl">类型</span><span class="kv2">{{ selectedStd.type }}</span></div>
          <div class="kv"><span class="kl">版本</span><span class="kv2 mono">{{ selectedStd.version }}</span></div>
          <div class="kv"><span class="kl">生效日期</span><span class="kv2">{{ selectedStd.effectDate }}</span></div>
          <div class="kv"><span class="kl">状态</span><span :class="['std-status', selectedStd.active ? 'active' : 'obsolete']" style="font-size:11px">{{ selectedStd.active ? '现行有效' : '已废止' }}</span></div>
          <div class="kv"><span class="kl">关联检测项</span><span class="kv2">{{ selectedStd.itemCount }} 项</span></div>
        </div>
        <div class="detail-body" v-else-if="activeStdTab === '版本历史'">
          <div v-for="v in stdVersionHistory" :key="v.ver" class="version-row">
            <span class="ver-ref">{{ v.ver }}</span>
            <span class="vh-date">{{ v.date }}</span>
            <span :class="['vh-status', v.current ? 'cur' : '']">{{ v.current ? '当前' : '历史' }}</span>
          </div>
        </div>
        <div class="detail-body" v-else>
          <div style="color:#8A96A6;font-size:13px">内容在完整版展示</div>
        </div>
        <el-button size="small" type="primary" v-if="fromScenario" style="margin-top:12px">绑定到场景</el-button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
const route = useRoute()
const fromScenario = ref(true) // Simulate context

const activeCategory = ref('gb')
const selectedStd = ref<any>(null)
const activeStdTab = ref('基本信息')
const stdDetailTabs = ['基本信息', '版本历史', '条款结构', '适用检测项']

const categories = ref([
  { key: 'law', name: '法律', count: 12 },
  { key: 'regulation', name: '行政法规', count: 8 },
  { key: 'gb', name: '国家标准 GB', count: 342 },
  { key: 'industry', name: '行业标准', count: 186 },
  { key: 'iso', name: 'ISO', count: 94 },
  { key: 'iec', name: 'IEC', count: 72 },
  { key: 'astm', name: 'ASTM', count: 45 },
  { key: 'enterprise', name: '企业标准', count: 28 },
  { key: 'method', name: '方法规范', count: 63 },
])

const standards = ref([
  { id: 1, code: 'GB 5009.12-2023', name: '食品安全国家标准 食品中铅的测定', type: '国家标准', version: '2023版', effectDate: '2023-09-01', active: true, itemCount: 3 },
  { id: 2, code: 'GB 5009.15-2023', name: '食品安全国家标准 食品中镉的测定', type: '国家标准', version: '2023版', effectDate: '2023-09-01', active: true, itemCount: 2 },
  { id: 3, code: 'GB 4789.2-2022', name: '食品安全国家标准 食品微生物学检验 菌落总数测定', type: '国家标准', version: '2022版', effectDate: '2022-11-01', active: true, itemCount: 1 },
  { id: 4, code: 'GB 5009.11-2014', name: '食品安全国家标准 食品中总砷及无机砷的测定', type: '国家标准', version: '2014版', effectDate: '2015-09-01', active: false, itemCount: 2 },
  { id: 5, code: 'GB 5009.28-2016', name: '食品安全国家标准 食品中苯甲酸、山梨酸和糖精钠的测定', type: '国家标准', version: '2016版', effectDate: '2017-06-23', active: true, itemCount: 1 },
  { id: 6, code: 'GB 5009.17-2021', name: '食品安全国家标准 食品中总汞及有机汞的测定', type: '国家标准', version: '2021版', effectDate: '2022-03-15', active: true, itemCount: 1 },
  { id: 7, code: 'GB 4789.3-2016', name: '食品安全国家标准 食品微生物学检验 大肠菌群测定', type: '国家标准', version: '2016版', effectDate: '2017-03-01', active: true, itemCount: 1 },
])

const filteredStandards = computed(() => standards.value)

const stdVersionHistory = ref([
  { ver: '2023版', date: '2023-09-01', current: true },
  { ver: '2016版', date: '2016-09-01', current: false },
  { ver: '2012版', date: '2012-03-01', current: false },
])

function openDetail(row: any) {
  selectedStd.value = row
  activeStdTab.value = '基本信息'
}
</script>
<style scoped>
.page { padding: 24px 32px; display: flex; flex-direction: column; height: 100%; box-sizing: border-box; }
.std-page { overflow: hidden; }
.context-bar {
  display: flex; align-items: center; gap: 8px; padding: 8px 14px;
  background: #EDF4FF; border: 1px solid #91CAFF; border-radius: 4px;
  font-size: 13px; color: #0B1220; margin-bottom: 12px;
}
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; flex-shrink: 0; }
.page-title { font-size: 20px; font-weight: 600; color: #0B1220; }
.page-subtitle { font-size: 12px; color: #526075; }
.std-layout { display: flex; gap: 12px; flex: 1; overflow: hidden; }
.std-tree { width: 180px; background: #fff; border: 1px solid #D9DEE7; border-radius: 6px; padding: 12px 0; flex-shrink: 0; overflow-y: auto; }
.tree-title { font-size: 11px; color: #8A96A6; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; padding: 0 14px 8px; }
.cat-item { display: flex; align-items: center; justify-content: space-between; padding: 7px 14px; cursor: pointer; font-size: 13px; color: #526075; }
.cat-item:hover { background: #F5F7FA; }
.cat-item.active { background: #EDF4FF; color: #1677FF; font-weight: 500; }
.cat-count { font-size: 11px; color: #B0B9C6; }
.std-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.filter-bar { display: flex; gap: 8px; padding: 10px 12px; background: #fff; border: 1px solid #D9DEE7; border-bottom: none; border-radius: 4px 4px 0 0; }
.table-wrap { flex: 1; overflow: auto; }
.ver-ref { font-family: monospace; font-size: 11px; color: #1677FF; background: #EDF4FF; padding: 1px 5px; border-radius: 2px; }
.std-status { font-size: 11px; padding: 2px 6px; border-radius: 3px; }
.std-status.active { background: #F0FFF4; color: #18794E; }
.std-status.obsolete { background: #FFF1F0; color: #C32F3F; }
.std-detail { width: 280px; background: #fff; border: 1px solid #D9DEE7; border-radius: 6px; padding: 14px; overflow-y: auto; flex-shrink: 0; }
.detail-title { font-size: 12px; font-family: monospace; color: #8A96A6; margin-bottom: 4px; }
.detail-name { font-size: 13px; font-weight: 600; color: #0B1220; margin-bottom: 12px; line-height: 1.5; }
.detail-tabs { display: flex; gap: 0; border-bottom: 1px solid #D9DEE7; margin-bottom: 12px; flex-wrap: wrap; }
.d-tab { padding: 6px 10px; font-size: 12px; color: #526075; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; }
.d-tab.active { color: #1677FF; border-bottom-color: #1677FF; }
.detail-body { display: flex; flex-direction: column; gap: 8px; }
.kv { display: flex; align-items: flex-start; gap: 0; }
.kl { width: 80px; font-size: 12px; color: #8A96A6; flex-shrink: 0; }
.kv2 { font-size: 13px; color: #0B1220; }
.kv2.mono { font-family: monospace; font-size: 11px; }
.version-row { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid #E7EAF0; }
.vh-date { font-size: 12px; color: #8A96A6; flex: 1; }
.vh-status { font-size: 11px; padding: 1px 5px; border-radius: 3px; background: #F5F7FA; color: #8A96A6; }
.vh-status.cur { background: #F0FFF4; color: #18794E; }
</style>
