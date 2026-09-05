<template>
  <div class="page">
    <div class="page-header">
      <div><div class="page-title">样品与对象管理</div><div class="page-subtitle">样品接收 · 流转 · 存储 · 处置全生命周期</div></div>
      <div style="display:flex;gap:8px"><el-button>打印标签</el-button><el-button type="primary">+ 样品接收</el-button></div>
    </div>
    <div class="filter-bar">
      <el-input placeholder="搜索样品编号、名称..." prefix-icon="Search" style="width:260px" />
      <el-select placeholder="状态" clearable style="width:110px">
        <el-option label="已接收" value="received" />
        <el-option label="检测中" value="testing" />
        <el-option label="已处置" value="disposed" />
      </el-select>
      <el-select placeholder="场景" clearable style="width:120px">
        <el-option label="食品检测" value="food" />
      </el-select>
    </div>
    <div class="panel">
      <el-table :data="samples" size="small">
        <el-table-column prop="id" label="样品编号" width="140" />
        <el-table-column prop="name" label="样品名称" />
        <el-table-column prop="requestId" label="来源委托" width="150" />
        <el-table-column prop="count" label="数量" width="70" align="center" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{row}"><el-tag :type="row.status==='检测中'?'primary':row.status==='已接收'?'info':'success'" size="small">{{ row.status }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="storage" label="存储位置" width="110" />
        <el-table-column prop="received" label="接收时间" width="130" />
        <el-table-column label="操作" width="100">
          <template #default><el-button link type="primary" size="small">详情</el-button><el-button link size="small">流转</el-button></template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>
<script setup lang="ts">
const samples = [
  { id: 'FS-2024-0891', name: '纯牛奶（全脂）', requestId: 'ORD-2024-0501', count: 3, status: '检测中', storage: 'A-3-冷藏', received: '2024-12-01 09:30' },
  { id: 'FS-2024-0892', name: '巴氏鲜奶', requestId: 'ORD-2024-0501', count: 2, status: '已接收', storage: 'A-3-冷藏', received: '2024-12-01 09:35' },
  { id: 'ENV-2024-0221', name: '工业废水样品', requestId: 'ORD-2024-0498', count: 8, status: '检测中', storage: 'B-1-常温', received: '2024-11-28 14:00' },
  { id: 'FS-2024-0885', name: '速冻饺子', requestId: 'INT-2024-0188', count: 5, status: '检测中', storage: 'A-5-冷冻', received: '2024-11-30 10:00' },
]
</script>
<style scoped>
.page {}
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.page-title { font-size: 18px; font-weight: 600; color: #0B1220; margin-bottom: 4px; }
.page-subtitle { font-size: 13px; color: #526075; }
.filter-bar { display: flex; gap: 10px; margin-bottom: 16px; }
.panel { background: #fff; border: 1px solid #D9DEE7; border-radius: 6px; padding: 16px; }
</style>
