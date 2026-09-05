<template>
  <div class="page">
    <div class="page-header">
      <div>
        <div class="page-title">场景激活</div>
        <div class="page-subtitle">控制已发布场景在各实验室的可用状态</div>
      </div>
      <el-button type="primary">新建激活配置</el-button>
    </div>
    <div class="filter-bar">
      <el-select placeholder="场景版本" size="small" style="width:220px" clearable>
        <el-option label="第三方食品理化检测 v1.2" value="1" />
        <el-option label="企业内部几何量检测 v2.1" value="2" />
      </el-select>
      <el-select placeholder="实验室" size="small" style="width:180px" clearable>
        <el-option label="上海食品实验室" value="sh" />
        <el-option label="深圳实验室" value="sz" />
      </el-select>
    </div>
    <div class="table-wrap">
      <el-table :data="activations" border size="small">
        <el-table-column label="场景" min-width="200">
          <template #default="{ row }">
            <div class="scene-name">{{ row.scenario }}</div>
            <span class="ver-chip">{{ row.version }}</span>
          </template>
        </el-table-column>
        <el-table-column label="实验室" width="180" prop="lab" />
        <el-table-column label="生效时间" width="140" prop="from" />
        <el-table-column label="失效时间" width="140" prop="to" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <span :class="['act-tag', row.enabled ? 'on' : 'off']">{{ row.enabled ? 'Active' : 'Inactive' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="当前运行" width="90" prop="runCount" />
        <el-table-column label="操作" width="130">
          <template #default="{ row }">
            <el-switch v-model="row.enabled" size="small" />
            <el-button link size="small" type="primary" style="margin-left:8px">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
const activations = ref([
  { id: 1, scenario: '第三方食品理化检测', version: 'v1.2', lab: '上海食品实验室', from: '2026-08-12', to: '永久', enabled: true, runCount: 189 },
  { id: 2, scenario: '第三方食品理化检测', version: 'v1.2', lab: '深圳综合检测实验室', from: '2026-08-20', to: '永久', enabled: true, runCount: 123 },
  { id: 3, scenario: '企业内部几何量检测', version: 'v2.1', lab: '精密测量室', from: '2026-07-20', to: '永久', enabled: true, runCount: 87 },
  { id: 4, scenario: '食品微生物检测', version: 'v1.0', lab: '微生物实验室', from: '2026-06-15', to: '2026-12-31', enabled: true, runCount: 56 },
])
</script>
<style scoped>
.page { padding: 24px 32px; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.page-title { font-size: 20px; font-weight: 600; color: #0B1220; }
.page-subtitle { font-size: 12px; color: #526075; }
.filter-bar { display: flex; gap: 8px; padding: 10px 12px; background: #fff; border: 1px solid #D9DEE7; border-bottom: none; border-radius: 4px 4px 0 0; }
.table-wrap { background: #fff; border-radius: 0 0 4px 4px; }
.scene-name { font-size: 13px; font-weight: 500; color: #0B1220; }
.ver-chip { font-size: 11px; font-family: monospace; color: #18794E; background: #F0FFF4; border: 1px solid #B7E6CB; padding: 1px 5px; border-radius: 3px; }
.act-tag { font-size: 11px; padding: 2px 7px; border-radius: 3px; }
.act-tag.on { background: #F0FFF4; color: #18794E; }
.act-tag.off { background: #F5F7FA; color: #8A96A6; }
</style>
