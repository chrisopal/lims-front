<template>
  <div class="page">
    <div class="page-header">
      <div><div class="page-title">设备与资源</div><div class="page-subtitle">仪器设备 · 校准状态 · 人员资质 · 排程管理</div></div>
      <el-button type="primary">+ 新增设备</el-button>
    </div>
    <el-tabs v-model="tab">
      <el-tab-pane label="仪器设备" name="equipment" />
      <el-tab-pane label="人员资质" name="personnel" />
      <el-tab-pane label="排程日历" name="schedule" />
    </el-tabs>
    <div class="panel" style="margin-top:12px">
      <el-table :data="equipments" size="small">
        <el-table-column prop="name" label="设备名称" />
        <el-table-column prop="model" label="型号" width="160" />
        <el-table-column prop="id" label="设备编号" width="130" />
        <el-table-column prop="calibration" label="校准有效期" width="130" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{row}"><el-tag :type="row.status==='空闲'?'success':row.status==='使用中'?'warning':'danger'" size="small">{{ row.status }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="capability" label="检测能力" />
        <el-table-column label="操作" width="100">
          <template #default><el-button link type="primary" size="small">详情</el-button><el-button link size="small">预约</el-button></template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
const tab = ref('equipment')
const equipments = [
  { name: 'ICP-MS 电感耦合等离子体质谱仪', model: 'Agilent 7900', id: 'EQ-ICP-001', calibration: '2025-06-30', status: '使用中', capability: 'Pb, Cd, As, Hg, Cu, Zn' },
  { name: '气相色谱仪 GC-FID', model: 'Agilent 8890', id: 'EQ-GC-002', calibration: '2025-03-15', status: '空闲', capability: '农药残留, VOC, 脂肪酸' },
  { name: '液相色谱仪 HPLC', model: 'Waters e2695', id: 'EQ-HPLC-003', calibration: '2024-12-01', status: '维护中', capability: '食品添加剂, 维生素, 糖类' },
  { name: '原子吸收分光光度计', model: 'PerkinElmer AAS 800', id: 'EQ-AAS-004', calibration: '2025-04-20', status: '空闲', capability: 'Ca, Mg, Fe, Zn, Cu' },
  { name: '电化学分析仪', model: 'Metrohm 940', id: 'EQ-EC-005', calibration: '2025-01-10', status: '空闲', capability: 'pH, 电导率, 离子强度' },
]
</script>
<style scoped>
.page {}
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.page-title { font-size: 18px; font-weight: 600; color: #0B1220; margin-bottom: 4px; }
.page-subtitle { font-size: 13px; color: #526075; }
.panel { background: #fff; border: 1px solid #D9DEE7; border-radius: 6px; padding: 16px; }
</style>
