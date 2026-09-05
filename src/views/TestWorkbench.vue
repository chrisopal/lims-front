<template>
  <div class="page workbench-page">
    <div class="page-header">
      <div><div class="page-title">检测执行工作台</div><div class="page-subtitle">Test Workbench · 专业检测工作面</div></div>
      <div style="display:flex;gap:8px">
        <el-tag>食品检测 · 华东中心</el-tag>
        <el-button type="primary">开始检测</el-button>
      </div>
    </div>

    <div class="workbench-layout">
      <!-- Left: Task queue -->
      <div class="task-queue">
        <div class="queue-header">
          <span style="font-size:13px;font-weight:500;color:#0B1220">任务队列</span>
          <el-badge :value="12" type="primary" />
        </div>
        <el-input placeholder="搜索任务..." prefix-icon="Search" size="small" style="margin-bottom:10px" />
        <div class="task-list">
          <div class="task-item" v-for="t in taskQueue" :key="t.id" :class="{active: activeTask === t.id}" @click="activeTask = t.id">
            <div class="task-header-row">
              <span class="task-id">{{ t.id }}</span>
              <el-tag :type="t.priority === '高' ? 'danger' : 'info'" size="small">{{ t.priority }}</el-tag>
            </div>
            <div class="task-name">{{ t.name }}</div>
            <div class="task-meta">{{ t.sample }} · {{ t.assignee }}</div>
            <el-progress :percentage="t.progress" :stroke-width="4" style="margin-top:6px" />
          </div>
        </div>
      </div>

      <!-- Center: Execution area -->
      <div class="execution-area">
        <div class="exec-header">
          <div>
            <div style="font-size:15px;font-weight:600;color:#0B1220">铅（Pb）检测 · ICP-MS 方法</div>
            <div style="font-size:12px;color:#526075;margin-top:4px">TASK-2024-1201 · 样品 FS-2024-0891</div>
          </div>
          <el-tag type="primary">进行中</el-tag>
        </div>
        <el-tabs v-model="execTab" style="margin-top:12px">
          <el-tab-pane label="检测步骤" name="steps">
            <div class="steps-list">
              <div class="exec-step" v-for="s in execSteps" :key="s.id" :class="s.status">
                <div class="step-indicator">{{ s.status === 'done' ? '✓' : s.status === 'active' ? '●' : '○' }}</div>
                <div class="step-body">
                  <div class="step-name">{{ s.name }}</div>
                  <div class="step-desc">{{ s.desc }}</div>
                </div>
                <el-button size="small" v-if="s.status === 'active'" type="primary">完成</el-button>
              </div>
            </div>
          </el-tab-pane>
          <el-tab-pane label="原始记录" name="record">
            <el-form label-width="120px" size="default" style="margin-top:12px;max-width:500px">
              <el-form-item label="测定次数"><el-input-number :value="3" :min="1" /></el-form-item>
              <el-form-item label="测定值 1"><el-input value="0.0182" /><span style="margin-left:8px;color:#526075">mg/kg</span></el-form-item>
              <el-form-item label="测定值 2"><el-input value="0.0179" /></el-form-item>
              <el-form-item label="测定值 3"><el-input value="0.0184" /></el-form-item>
              <el-form-item label="平均值"><el-input value="0.0182" disabled /></el-form-item>
              <el-form-item label="空白值"><el-input value="0.0003" /></el-form-item>
              <el-form-item label="最终结果"><el-input value="0.018" /><span style="margin-left:8px;color:#18794E;font-weight:500">符合 ≤0.05</span></el-form-item>
              <el-form-item><el-button type="primary">保存记录</el-button></el-form-item>
            </el-form>
          </el-tab-pane>
        </el-tabs>
      </div>

      <!-- Right: Context panel -->
      <div class="context-panel">
        <div class="ctx-section">
          <div class="ctx-title">样品信息</div>
          <div class="ctx-row"><span class="ctx-key">名称</span><span class="ctx-val">纯牛奶（全脂）</span></div>
          <div class="ctx-row"><span class="ctx-key">编号</span><span class="ctx-val">FS-2024-0891</span></div>
          <div class="ctx-row"><span class="ctx-key">状态</span><el-tag size="small" type="success">已接收</el-tag></div>
        </div>
        <el-divider />
        <div class="ctx-section">
          <div class="ctx-title">检测方法</div>
          <div class="ctx-row"><span class="ctx-key">方法</span><span class="ctx-val">ICP-MS</span></div>
          <div class="ctx-row"><span class="ctx-key">标准</span><el-tag size="small" type="primary" effect="plain">GB 5009.12-2023</el-tag></div>
          <div class="ctx-row"><span class="ctx-key">限值</span><span class="ctx-val">≤0.05 mg/kg</span></div>
        </div>
        <el-divider />
        <div class="ctx-section">
          <div class="ctx-title">使用仪器</div>
          <div class="ctx-row"><span class="ctx-key">仪器</span><span class="ctx-val">Agilent 7900</span></div>
          <div class="ctx-row"><span class="ctx-key">校准</span><el-tag size="small" type="success">有效期内</el-tag></div>
        </div>
        <el-divider />
        <div class="ctx-section">
          <div class="ctx-title">AI 辅助</div>
          <div class="ai-assist-item">
            <el-icon color="#18794E"><MagicStick /></el-icon>
            <span style="font-size:12px;color:#526075">结果正常，与历史数据一致</span>
          </div>
          <div class="ai-assist-item">
            <el-icon color="#A9650A"><Warning /></el-icon>
            <span style="font-size:12px;color:#526075">建议确认仪器校准记录</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const activeTask = ref('TASK-2024-1201')
const execTab = ref('steps')

const taskQueue = [
  { id: 'TASK-2024-1201', name: '铅（Pb）检测 / ICP-MS', sample: 'FS-2024-0891', assignee: '李明', priority: '高', progress: 60 },
  { id: 'TASK-2024-1202', name: '菌落总数检测', sample: 'FS-2024-0892', assignee: '王芳', priority: '中', progress: 0 },
  { id: 'TASK-2024-1203', name: '蛋白质含量测定', sample: 'FS-2024-0885', assignee: '张研', priority: '中', progress: 30 },
  { id: 'TASK-2024-1204', name: '镉（Cd）检测', sample: 'FS-2024-0891', assignee: '李明', priority: '高', progress: 0 },
]

const execSteps = [
  { id: 1, name: '样品前处理', desc: '微波消解 - HNO₃/H₂O₂ 体系', status: 'done' },
  { id: 2, name: '标准曲线配制', desc: '配制 0、0.5、1、5、10 μg/L 标准系列', status: 'done' },
  { id: 3, name: '仪器调谐', desc: '调谐参数确认，灵敏度检查', status: 'active' },
  { id: 4, name: '样品测定', desc: '顺序测定空白、标准、样品', status: 'pending' },
  { id: 5, name: '结果计算', desc: '扣除空白，换算浓度', status: 'pending' },
]
</script>

<style scoped>
.page { display: flex; flex-direction: column; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.page-title { font-size: 18px; font-weight: 600; color: #0B1220; margin-bottom: 4px; }
.page-subtitle { font-size: 13px; color: #526075; }

.workbench-layout { display: flex; gap: 0; border: 1px solid #D9DEE7; border-radius: 6px; background: #fff; overflow: hidden; min-height: 600px; }

.task-queue { width: 220px; border-right: 1px solid #D9DEE7; padding: 12px; overflow-y: auto; flex-shrink: 0; }
.queue-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.task-list { display: flex; flex-direction: column; gap: 8px; }
.task-item { padding: 10px; border: 1px solid #D9DEE7; border-radius: 4px; cursor: pointer; }
.task-item:hover { border-color: #1677FF; background: #F8FBFF; }
.task-item.active { border-color: #1677FF; background: #EDF4FF; }
.task-header-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
.task-id { font-size: 11px; color: #8A96A6; }
.task-name { font-size: 12px; font-weight: 500; color: #0B1220; margin-bottom: 3px; }
.task-meta { font-size: 11px; color: #526075; }

.execution-area { flex: 1; padding: 16px; overflow-y: auto; border-right: 1px solid #D9DEE7; }
.exec-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 12px; border-bottom: 1px solid #D9DEE7; }

.steps-list { display: flex; flex-direction: column; gap: 12px; margin-top: 12px; }
.exec-step { display: flex; gap: 12px; align-items: flex-start; }
.step-indicator { width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600; flex-shrink: 0; }
.exec-step.done .step-indicator { color: #18794E; }
.exec-step.active .step-indicator { color: #1677FF; }
.exec-step.pending .step-indicator { color: #B0B9C6; }
.step-body { flex: 1; }
.step-name { font-size: 13px; font-weight: 500; color: #0B1220; margin-bottom: 2px; }
.step-desc { font-size: 12px; color: #526075; }

.context-panel { width: 220px; flex-shrink: 0; padding: 14px; overflow-y: auto; background: #F8FAFB; }
.ctx-section { margin-bottom: 4px; }
.ctx-title { font-size: 12px; font-weight: 600; color: #526075; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
.ctx-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.ctx-key { font-size: 12px; color: #8A96A6; }
.ctx-val { font-size: 12px; color: #0B1220; }
.ai-assist-item { display: flex; align-items: flex-start; gap: 6px; margin-bottom: 8px; }
</style>
