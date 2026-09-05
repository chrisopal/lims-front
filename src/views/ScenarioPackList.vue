<template>
  <div class="page">
    <div class="page-header">
      <div>
        <div class="page-title">场景包</div>
        <div class="page-subtitle">配置、校验、发布可复用的实验室检测场景 · Scenario Pack Management</div>
      </div>
      <el-button type="primary" @click="$router.push('/app/scenarios/studio')">+ 新建场景包</el-button>
    </div>

    <!-- Filter bar -->
    <div class="filter-bar">
      <el-input v-model="keyword" placeholder="场景名称 / Key" prefix-icon="Search" style="width:200px" clearable size="small" />
      <el-select v-model="filterStatus" placeholder="状态" clearable size="small" style="width:120px">
        <el-option label="Draft" value="Draft" />
        <el-option label="Validating" value="Validating" />
        <el-option label="Ready" value="Ready" />
        <el-option label="Published" value="Published" />
        <el-option label="Deprecated" value="Deprecated" />
      </el-select>
      <el-select v-model="filterDomain" placeholder="领域" clearable size="small" style="width:120px">
        <el-option label="Food" value="Food" />
        <el-option label="Environment" value="Environment" />
        <el-option label="Metrology" value="Metrology" />
        <el-option label="Battery" value="Battery" />
      </el-select>
      <el-select v-model="filterMode" placeholder="业务模式" clearable size="small" style="width:120px">
        <el-option label="第三方" value="第三方" />
        <el-option label="内部" value="内部" />
      </el-select>
    </div>

    <!-- Table -->
    <div class="table-wrap">
      <el-table :data="filteredPacks" border size="small" style="width:100%">
        <el-table-column type="index" width="40" />
        <el-table-column label="场景名称" min-width="200">
          <template #default="{ row }">
            <div class="scene-name-cell">
              <span class="scene-name" @click="openStudio(row)">{{ row.name }}</span>
              <span class="scene-key">{{ row.key }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="编辑版本" width="130">
          <template #default="{ row }">
            <span class="ver-chip draft">{{ row.draftVer }}</span>
          </template>
        </el-table-column>
        <el-table-column label="发布版本" width="130">
          <template #default="{ row }">
            <span v-if="row.publishedVer" class="ver-chip published">{{ row.publishedVer }}</span>
            <span v-else class="ver-none">—</span>
          </template>
        </el-table-column>
        <el-table-column label="业务模式" width="90">
          <template #default="{ row }">
            <span :class="['mode-tag', row.mode === '第三方' ? 'third' : 'internal']">{{ row.mode }}</span>
          </template>
        </el-table-column>
        <el-table-column label="领域" width="110">
          <template #default="{ row }">
            <el-tag type="info" size="small" style="border-radius:3px">{{ row.domain }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="完整度" width="120">
          <template #default="{ row }">
            <div class="completeness-cell">
              <el-progress :percentage="row.completeness" :stroke-width="4" :show-text="false"
                :color="row.completeness === 100 ? '#18794E' : row.completeness >= 80 ? '#1677FF' : '#A9650A'"
                style="flex:1" />
              <span class="completeness-num">{{ row.completeness }}%</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <span :class="['status-tag', `status-${row.status.toLowerCase()}`]">{{ row.status }}</span>
          </template>
        </el-table-column>
        <el-table-column label="所属实验室" width="120" prop="lab" />
        <el-table-column label="最近修改" width="120" prop="updatedAt" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link size="small" type="primary" @click="openStudio(row)">配置</el-button>
            <el-button link size="small" @click="$router.push('/app/scenarios/versions')">版本</el-button>
            <el-button link size="small" v-if="row.status === 'Ready'">发布</el-button>
            <el-button link size="small" type="danger" v-if="row.status === 'Draft'">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()
const keyword = ref('')
const filterStatus = ref('')
const filterDomain = ref('')
const filterMode = ref('')

const packs = ref([
  { id: 1, name: '第三方食品理化检测', key: 'third-party-food-physchem', draftVer: 'v1.3 Draft', publishedVer: 'v1.2', mode: '第三方', domain: 'Food', completeness: 72, status: 'Draft', lab: '上海食品实验室', updatedAt: '2026-09-05 15:26' },
  { id: 2, name: '环境水质检测', key: 'environment-water', draftVer: 'v0.9 Draft', publishedVer: null, mode: '第三方', domain: 'Environment', completeness: 58, status: 'Draft', lab: '环境监测中心', updatedAt: '2026-09-04 11:12' },
  { id: 3, name: '企业内部几何量检测', key: 'internal-metrology', draftVer: 'v2.2 Draft', publishedVer: 'v2.1', mode: '内部', domain: 'Metrology', completeness: 91, status: 'Validating', lab: '精密测量室', updatedAt: '2026-09-03 16:40' },
  { id: 4, name: '客户现场尺寸检测', key: 'onsite-metrology', draftVer: 'v1.0 Ready', publishedVer: null, mode: '第三方', domain: 'Metrology', completeness: 100, status: 'Ready', lab: '现场检测组', updatedAt: '2026-09-02 09:30' },
  { id: 5, name: '食品微生物检测', key: 'food-microbiology', draftVer: 'v1.1 Draft', publishedVer: 'v1.0', mode: '第三方', domain: 'Food', completeness: 84, status: 'Draft', lab: '微生物实验室', updatedAt: '2026-09-01 14:22' },
  { id: 6, name: '新能源电池循环测试', key: 'battery-cycle-test', draftVer: 'v0.4 Draft', publishedVer: null, mode: '内部', domain: 'Battery', completeness: 41, status: 'Draft', lab: '新能源测试室', updatedAt: '2026-08-30 17:05' },
])

const filteredPacks = computed(() => packs.value.filter(p => {
  if (keyword.value && !p.name.includes(keyword.value) && !p.key.includes(keyword.value)) return false
  if (filterStatus.value && !p.status.includes(filterStatus.value)) return false
  if (filterDomain.value && p.domain !== filterDomain.value) return false
  if (filterMode.value && p.mode !== filterMode.value) return false
  return true
}))

function openStudio(row: any) {
  router.push('/app/scenarios/studio')
}
</script>
<style scoped>
.page { padding: 24px 32px; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.page-title { font-size: 20px; font-weight: 600; color: #0B1220; margin-bottom: 2px; }
.page-subtitle { font-size: 12px; color: #526075; }
.filter-bar { display: flex; gap: 8px; margin-bottom: 0; padding: 10px 12px; background: #fff; border: 1px solid #D9DEE7; border-bottom: none; border-radius: 4px 4px 0 0; }
.table-wrap { background: #fff; border-radius: 0 0 4px 4px; overflow: hidden; }
.scene-name-cell { display: flex; flex-direction: column; gap: 2px; }
.scene-name { font-size: 13px; color: #1677FF; font-weight: 500; cursor: pointer; }
.scene-name:hover { text-decoration: underline; }
.scene-key { font-size: 11px; color: #8A96A6; font-family: monospace; }
.ver-chip { font-size: 11px; padding: 2px 7px; border-radius: 3px; font-family: monospace; font-weight: 500; }
.ver-chip.draft { background: #FFF3E0; color: #A9650A; border: 1px solid #FFD591; }
.ver-chip.published { background: #F0FFF4; color: #18794E; border: 1px solid #B7E6CB; }
.ver-none { color: #B0B9C6; font-size: 13px; }
.mode-tag { font-size: 11px; padding: 2px 6px; border-radius: 3px; font-weight: 500; }
.mode-tag.third { background: #EDF4FF; color: #1677FF; }
.mode-tag.internal { background: #F5F7FA; color: #526075; }
.completeness-cell { display: flex; align-items: center; gap: 6px; }
.completeness-num { font-size: 11px; color: #526075; width: 30px; text-align: right; }
.status-tag { font-size: 11px; padding: 2px 7px; border-radius: 3px; font-weight: 500; }
.status-draft { background: #F5F7FA; color: #526075; border: 1px solid #D9DEE7; }
.status-validating { background: #FFF3E0; color: #A9650A; border: 1px solid #FFD591; }
.status-ready { background: #EDF4FF; color: #1677FF; border: 1px solid #91CAFF; }
.status-published { background: #F0FFF4; color: #18794E; border: 1px solid #B7E6CB; }
.status-deprecated { background: #FFF1F0; color: #C32F3F; border: 1px solid #FFCCC7; }
</style>
