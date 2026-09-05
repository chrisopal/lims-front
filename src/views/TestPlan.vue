<template>
  <div class="page">
    <div class="page-header">
      <div><div class="page-title">检测计划</div><div class="page-subtitle">资源分配 · 任务排期 · 优先级管理</div></div>
      <div style="display:flex;gap:8px"><el-button>AI 调度建议</el-button><el-button type="primary">+ 创建计划</el-button></div>
    </div>
    <div class="panel">
      <el-table :data="plans" size="small">
        <el-table-column prop="id" label="计划编号" width="150" />
        <el-table-column prop="requestId" label="来源委托" width="150" />
        <el-table-column prop="domain" label="检测领域" width="110">
          <template #default="{row}"><el-tag size="small">{{ row.domain }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="tasks" label="任务数" width="80" align="center" />
        <el-table-column prop="assignee" label="负责人" width="90" />
        <el-table-column prop="equipment" label="计划设备" width="180" />
        <el-table-column prop="startDate" label="开始日期" width="120" />
        <el-table-column prop="endDate" label="结束日期" width="120" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{row}"><el-tag :type="row.status==='进行中'?'primary':row.status==='待开始'?'info':'success'" size="small">{{ row.status }}</el-tag></template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>
<script setup lang="ts">
const plans = [
  { id: 'PLAN-2024-0215', requestId: 'ORD-2024-0501', domain: '食品检测', tasks: 8, assignee: '李明', equipment: 'ICP-MS, 菌落计数仪', startDate: '2024-12-02', endDate: '2024-12-07', status: '进行中' },
  { id: 'PLAN-2024-0214', requestId: 'ORD-2024-0498', domain: '环境检测', tasks: 5, assignee: '陈华', equipment: '分光光度计', startDate: '2024-12-01', endDate: '2024-12-05', status: '进行中' },
  { id: 'PLAN-2024-0213', requestId: 'INT-2024-0188', domain: '理化检测', tasks: 4, assignee: '张研', equipment: 'pH计, 密度计', startDate: '2024-12-03', endDate: '2024-12-06', status: '待开始' },
]
</script>
<style scoped>
.page {}
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.page-title { font-size: 18px; font-weight: 600; color: #0B1220; margin-bottom: 4px; }
.page-subtitle { font-size: 13px; color: #526075; }
.panel { background: #fff; border: 1px solid #D9DEE7; border-radius: 6px; padding: 16px; }
</style>
