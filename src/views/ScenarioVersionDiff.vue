<template>
  <div class="page">
    <div class="page-header">
      <div>
        <div class="page-title">场景版本历史 · Diff</div>
        <div class="page-subtitle">第三方食品理化检测</div>
      </div>
      <el-button type="primary" @click="$router.push('/app/scenarios/studio')">创建新版本</el-button>
    </div>
    <div class="diff-layout">
      <!-- Version list -->
      <div class="ver-list">
        <div class="ver-list-title">版本列表</div>
        <div v-for="v in versions" :key="v.version" class="ver-item" :class="{ active: selectedA === v.version || selectedB === v.version }" @click="selectVer(v.version)">
          <div class="ver-top">
            <span class="ver-num">{{ v.version }}</span>
            <span :class="['ver-status', v.statusCls]">{{ v.status }}</span>
          </div>
          <div class="ver-info">{{ v.publishedAt }}</div>
          <div class="ver-note" v-if="v.note">{{ v.note }}</div>
        </div>
      </div>
      <!-- Diff view -->
      <div class="diff-main">
        <div class="diff-header">
          <span class="diff-from">{{ selectedA }}</span>
          <el-icon color="#B0B9C6"><ArrowRight /></el-icon>
          <span class="diff-to">{{ selectedB }}</span>
          <span class="diff-label">变更 Diff</span>
        </div>
        <div class="diff-list">
          <div v-for="d in diffs" :key="d.id" :class="['diff-row', d.type]">
            <div class="diff-type-icon">
              <span v-if="d.type === 'add'" class="diff-add-mark">+</span>
              <span v-else-if="d.type === 'change'" class="diff-chg-mark">~</span>
              <span v-else class="diff-del-mark">−</span>
            </div>
            <div class="diff-info">
              <div class="diff-title">{{ d.title }}</div>
              <div class="diff-detail" v-if="d.detail">{{ d.detail }}</div>
            </div>
            <div class="diff-category">{{ d.category }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
const selectedA = ref('v1.2.0')
const selectedB = ref('v1.3.0')

const versions = ref([
  { version: 'v1.3.0', status: 'Draft', statusCls: 'draft', publishedAt: '编辑中', note: '新增总砷检测项' },
  { version: 'v1.2.0', status: 'Published', statusCls: 'pub', publishedAt: '2026-08-12', note: '当前运行版本' },
  { version: 'v1.1.0', status: 'Deprecated', statusCls: 'dep', publishedAt: '2026-05-01', note: null },
  { version: 'v1.0.0', status: 'Retired', statusCls: 'ret', publishedAt: '2026-01-10', note: null },
])

const diffs = ref([
  { id: 1, type: 'add', title: '新增检测项：总砷 As', detail: 'GB 5009.11-2014 · HG-AFS As v1 · Food As Limit v2', category: '检测项' },
  { id: 2, type: 'change', title: 'GB 5009.12 版本升级', detail: 'GB 5009.12-2016 → GB 5009.12-2023', category: '法规 / 标准' },
  { id: 3, type: 'add', title: '流程新增"法规审核"节点', detail: '位于"技术审核"之前，类型 REGULATORY_REVIEW', category: 'Workflow' },
  { id: 4, type: 'change', title: '报告模板版本升级', detail: '食品理化报告 v3 → v4', category: 'Report' },
  { id: 5, type: 'change', title: 'AI Skill 版本升级', detail: 'report-review v1.2 → v1.4', category: 'AI Skill' },
  { id: 6, type: 'change', title: 'Food Cd Limit Rule 版本升级', detail: 'v1 → v2（限值从 0.1mg/kg 调整为 0.05mg/kg）', category: '限值规则' },
])

function selectVer(v: string) {
  if (selectedA.value === v) selectedA.value = ''
  else if (selectedB.value === v) selectedB.value = ''
  else if (!selectedA.value) selectedA.value = v
  else selectedB.value = v
}
</script>
<style scoped>
.page { padding: 24px 32px; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.page-title { font-size: 20px; font-weight: 600; color: #0B1220; }
.page-subtitle { font-size: 13px; color: #526075; }
.diff-layout { display: flex; gap: 16px; }
.ver-list { width: 220px; background: #fff; border: 1px solid #D9DEE7; border-radius: 6px; padding: 14px; flex-shrink: 0; }
.ver-list-title { font-size: 12px; color: #8A96A6; font-weight: 500; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
.ver-item { padding: 10px 10px; border: 1px solid #D9DEE7; border-radius: 4px; cursor: pointer; margin-bottom: 6px; }
.ver-item:hover { border-color: #1677FF; }
.ver-item.active { border-color: #1677FF; background: #EDF4FF; }
.ver-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
.ver-num { font-size: 13px; font-weight: 600; color: #0B1220; font-family: monospace; }
.ver-status { font-size: 10px; padding: 1px 5px; border-radius: 2px; font-weight: 500; }
.ver-status.draft { background: #FFF3E0; color: #A9650A; }
.ver-status.pub { background: #F0FFF4; color: #18794E; }
.ver-status.dep { background: #FFF1F0; color: #C32F3F; }
.ver-status.ret { background: #F5F7FA; color: #8A96A6; }
.ver-info { font-size: 11px; color: #8A96A6; }
.ver-note { font-size: 11px; color: #526075; margin-top: 4px; font-style: italic; }
.diff-main { flex: 1; background: #fff; border: 1px solid #D9DEE7; border-radius: 6px; padding: 16px; }
.diff-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #E7EAF0; }
.diff-from { font-size: 14px; font-family: monospace; font-weight: 600; color: #526075; }
.diff-to { font-size: 14px; font-family: monospace; font-weight: 600; color: #1677FF; }
.diff-label { font-size: 12px; color: #8A96A6; margin-left: 8px; }
.diff-list { display: flex; flex-direction: column; gap: 6px; }
.diff-row { display: flex; align-items: flex-start; gap: 12px; padding: 10px 12px; border-radius: 4px; border: 1px solid #E7EAF0; }
.diff-row.add { background: #F0FFF4; border-color: #B7E6CB; }
.diff-row.change { background: #EDF4FF; border-color: #91CAFF; }
.diff-row.del { background: #FFF1F0; border-color: #FFCCC7; }
.diff-type-icon { width: 20px; flex-shrink: 0; font-weight: 700; font-size: 16px; margin-top: 1px; }
.diff-add-mark { color: #18794E; }
.diff-chg-mark { color: #1677FF; }
.diff-del-mark { color: #C32F3F; }
.diff-info { flex: 1; }
.diff-title { font-size: 13px; font-weight: 500; color: #0B1220; margin-bottom: 2px; }
.diff-detail { font-size: 12px; color: #526075; font-family: monospace; }
.diff-category { font-size: 11px; color: #8A96A6; white-space: nowrap; }
</style>
