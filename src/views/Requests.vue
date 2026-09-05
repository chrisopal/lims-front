<template>
  <div class="page">
    <div class="page-header">
      <div>
        <div class="page-title">委托 / 申请管理</div>
        <div class="page-subtitle">第三方委托 · 内部申请 · 统一受理</div>
      </div>
      <div style="display:flex;gap:8px">
        <el-button>批量导出</el-button>
        <el-button type="primary" @click="$router.push('/app/requests/new')">+ 新建委托</el-button>
      </div>
    </div>

    <!-- Mode tabs -->
    <el-tabs v-model="activeMode" style="margin-bottom:16px">
      <el-tab-pane label="全部" name="all" />
      <el-tab-pane name="third-party">
        <template #label><span>第三方委托</span><el-badge :value="28" type="primary" style="margin-left:8px" /></template>
      </el-tab-pane>
      <el-tab-pane name="internal">
        <template #label><span>内部申请</span><el-badge :value="14" style="margin-left:8px" /></template>
      </el-tab-pane>
    </el-tabs>

    <!-- Filters -->
    <div class="filter-bar">
      <el-input v-model="search" placeholder="搜索委托编号、客户名、样品名..." prefix-icon="Search" style="width:280px" clearable />
      <el-select v-model="filterStatus" placeholder="状态" clearable style="width:120px">
        <el-option label="待受理" value="pending" />
        <el-option label="检测中" value="testing" />
        <el-option label="待审核" value="reviewing" />
        <el-option label="已完成" value="done" />
      </el-select>
      <el-select v-model="filterDomain" placeholder="检测领域" clearable style="width:130px">
        <el-option label="食品检测" value="food" />
        <el-option label="理化检测" value="physchem" />
        <el-option label="环境检测" value="env" />
        <el-option label="新能源检测" value="battery" />
        <el-option label="几何量检测" value="metrology" />
      </el-select>
      <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" style="width:240px" />
      <el-button @click="search=''">重置</el-button>
    </div>

    <!-- Table -->
    <div class="panel">
      <el-table :data="requests" style="width:100%" @row-click="openDetail">
        <el-table-column type="selection" width="40" />
        <el-table-column prop="id" label="委托编号" width="150" fixed />
        <el-table-column prop="client" label="客户 / 申请部门" width="160" />
        <el-table-column prop="domain" label="检测领域" width="110">
          <template #default="{row}">
            <el-tag :type="domainTagType(row.domain)" size="small">{{ row.domain }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="items" label="检测项目" />
        <el-table-column prop="sampleCount" label="样品数" width="80" align="center" />
        <el-table-column prop="mode" label="模式" width="90">
          <template #default="{row}">
            <span style="font-size:12px;color:#526075">{{ row.mode }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{row}">
            <el-tag :type="statusType(row.status)" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="deadline" label="承诺交期" width="110" />
        <el-table-column prop="created" label="创建时间" width="110" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default>
            <el-button link type="primary" size="small">受理</el-button>
            <el-button link size="small">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div style="margin-top:16px;display:flex;justify-content:flex-end">
        <el-pagination layout="total, prev, pager, next" :total="42" :page-size="10" />
      </div>
    </div>

    <!-- Detail drawer -->
    <el-drawer v-model="showDetail" title="委托详情" size="600px" direction="rtl">
      <div v-if="selectedRequest">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="委托编号">{{ selectedRequest.id }}</el-descriptions-item>
          <el-descriptions-item label="客户单位">{{ selectedRequest.client }}</el-descriptions-item>
          <el-descriptions-item label="检测领域">{{ selectedRequest.domain }}</el-descriptions-item>
          <el-descriptions-item label="业务模式">{{ selectedRequest.mode }}</el-descriptions-item>
          <el-descriptions-item label="状态"><el-tag :type="statusType(selectedRequest.status)" size="small">{{ selectedRequest.status }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="样品数量">{{ selectedRequest.sampleCount }} 件</el-descriptions-item>
          <el-descriptions-item label="检测项目" :span="2">{{ selectedRequest.items }}</el-descriptions-item>
          <el-descriptions-item label="承诺交期">{{ selectedRequest.deadline }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ selectedRequest.created }}</el-descriptions-item>
        </el-descriptions>
        <div style="margin-top:16px;display:flex;gap:8px">
          <el-button type="primary">受理确认</el-button>
          <el-button>编辑</el-button>
          <el-button type="danger" plain>拒绝</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const activeMode = ref('all')
const search = ref('')
const filterStatus = ref('')
const filterDomain = ref('')
const dateRange = ref(null)
const showDetail = ref(false)
const selectedRequest = ref<any>(null)

const requests = [
  { id: 'ORD-2024-0501', client: '好食光食品有限公司', domain: '食品检测', items: '铅、镉、菌落总数、蛋白质', sampleCount: 6, mode: '第三方', status: '检测中', deadline: '2024-12-10', created: '2024-12-01' },
  { id: 'ORD-2024-0500', client: '绿园农业科技', domain: '食品检测', items: '农药残留、重金属（铅、砷、镉）', sampleCount: 4, mode: '第三方', status: '待受理', deadline: '2024-12-12', created: '2024-12-01' },
  { id: 'INT-2024-0188', client: '质量管理部', domain: '理化检测', items: 'pH 值、电导率、灰分、密度', sampleCount: 3, mode: '内部', status: '待审核', deadline: '2024-12-08', created: '2024-11-30' },
  { id: 'ORD-2024-0498', client: '环境监测中心', domain: '环境检测', items: 'COD、氨氮、总磷、颗粒物 PM2.5', sampleCount: 8, mode: '第三方', status: '已完成', deadline: '2024-12-05', created: '2024-11-28' },
  { id: 'ORD-2024-0495', client: '新能源科技有限公司', domain: '新能源检测', items: '容量保持率、内阻、循环寿命', sampleCount: 2, mode: '第三方', status: '检测中', deadline: '2024-12-15', created: '2024-11-27' },
  { id: 'INT-2024-0185', client: '研发部', domain: '理化检测', items: 'IR 光谱、纯度分析、熔点', sampleCount: 5, mode: '内部', status: '已完成', deadline: '2024-12-03', created: '2024-11-25' },
]

function statusType(s: string) {
  const map: Record<string, string> = { '检测中': 'primary', '待受理': 'info', '待审核': 'warning', '已完成': 'success', '拒绝': 'danger' }
  return map[s] || 'info'
}
function domainTagType(d: string) {
  const map: Record<string, string> = { '食品检测': '', '理化检测': 'success', '环境检测': 'warning', '新能源检测': 'danger', '几何量检测': 'info' }
  return map[d] || 'info'
}
function openDetail(row: any) {
  selectedRequest.value = row
  showDetail.value = true
}
</script>

<style scoped>
.page {}
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.page-title { font-size: 18px; font-weight: 600; color: #0B1220; margin-bottom: 4px; }
.page-subtitle { font-size: 13px; color: #526075; }
.filter-bar { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; align-items: center; }
.panel { background: #fff; border: 1px solid #D9DEE7; border-radius: 6px; padding: 16px; }
</style>
