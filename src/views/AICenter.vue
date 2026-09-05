<template>
  <div class="page">
    <div class="page-header">
      <div><div class="page-title">AI 能力中心</div><div class="page-subtitle">AI Skill Pack · 已嵌入业务流程的 AI 能力管理</div></div>
      <el-button type="primary">+ 接入新 Skill</el-button>
    </div>
    <div class="kpi-row">
      <div class="kpi-card" v-for="k in kpis" :key="k.label">
        <div style="font-size:12px;color:#526075;margin-bottom:6px">{{ k.label }}</div>
        <div style="font-size:24px;font-weight:600;color:#0B1220">{{ k.value }}</div>
      </div>
    </div>
    <div class="panel">
      <el-table :data="aiSkills" size="small">
        <el-table-column prop="name" label="AI Skill 名称" width="160" />
        <el-table-column prop="trigger" label="触发阶段" width="110" />
        <el-table-column prop="input" label="输入来源" width="140" />
        <el-table-column prop="output" label="输出对象" width="130" />
        <el-table-column prop="confirm" label="人工确认" width="90">
          <template #default="{row}"><el-tag :type="row.confirm?'warning':'success'" size="small">{{ row.confirm?'需确认':'自动' }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="callCount" label="本月调用" width="90" align="center" />
        <el-table-column prop="adoptRate" label="采纳率" width="90">
          <template #default="{row}"><el-progress :percentage="row.adoptRate" :stroke-width="6" style="width:70px" /></template>
        </el-table-column>
        <el-table-column prop="enabled" label="状态" width="80">
          <template #default="{row}"><el-switch v-model="row.enabled" size="small" /></template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
const kpis = [
  { label: '已启用 AI Skill', value: '6' },
  { label: '本月总调用次数', value: '1,248' },
  { label: '平均采纳率', value: '87%' },
  { label: 'AI 节省工时', value: '126h' },
]
const aiSkills = ref([
  { name: '标准智能匹配', trigger: '委托受理', input: '检测项目', output: '推荐标准', confirm: true, callCount: 312, adoptRate: 94, enabled: true },
  { name: '委托解析', trigger: '受理阶段', input: '委托文件', output: '检测计划', confirm: true, callCount: 186, adoptRate: 82, enabled: true },
  { name: '报告草稿生成', trigger: '结果处理', input: '检测数据', output: '报告草稿', confirm: true, callCount: 248, adoptRate: 91, enabled: true },
  { name: '报告审核', trigger: '技术审核', input: '报告草稿', output: '审核意见', confirm: true, callCount: 196, adoptRate: 88, enabled: true },
  { name: '结果异常识别', trigger: '结果录入', input: '检测结果', output: '异常提示', confirm: false, callCount: 1024, adoptRate: 79, enabled: true },
  { name: '智能任务调度', trigger: '检测策划', input: '任务队列', output: '调度建议', confirm: true, callCount: 82, adoptRate: 85, enabled: false },
])
</script>
<style scoped>
.page {}
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.page-title { font-size: 18px; font-weight: 600; color: #0B1220; margin-bottom: 4px; }
.page-subtitle { font-size: 13px; color: #526075; }
.kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
.kpi-card { background: #fff; border: 1px solid #D9DEE7; border-radius: 6px; padding: 16px; }
.panel { background: #fff; border: 1px solid #D9DEE7; border-radius: 6px; padding: 16px; }
</style>
