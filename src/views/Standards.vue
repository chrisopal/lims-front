<template>
  <div class="page">
    <div class="page-header">
      <div><div class="page-title">标准法规与方法库</div><div class="page-subtitle">Standard &amp; Method Library · 知识配置中心</div></div>
      <div style="display:flex;gap:8px"><el-button>导入标准</el-button><el-button type="primary">+ 新增标准</el-button></div>
    </div>
    <div class="std-layout">
      <div class="std-tree-panel">
        <el-input placeholder="搜索标准..." prefix-icon="Search" size="small" style="margin-bottom:10px" />
        <el-tree :data="stdTree" node-key="id" default-expand-all :props="{label: 'name'}" @node-click="handleTreeClick" highlight-current />
      </div>
      <div class="std-main">
        <div class="std-list-header">
          <el-tabs v-model="stdTab">
            <el-tab-pane label="标准列表" name="list" />
            <el-tab-pane label="方法库" name="method" />
            <el-tab-pane label="限值规则" name="limit" />
          </el-tabs>
        </div>
        <el-table :data="standards" size="small" style="margin-top:12px">
          <el-table-column prop="code" label="标准编号" width="170">
            <template #default="{row}"><el-tag type="primary" effect="plain" size="small">{{ row.code }}</el-tag></template>
          </el-table-column>
          <el-table-column prop="name" label="标准名称" />
          <el-table-column prop="version" label="版本" width="100" />
          <el-table-column prop="status" label="状态" width="90">
            <template #default="{row}"><el-tag :type="row.status === '现行' ? 'success' : 'info'" size="small">{{ row.status }}</el-tag></template>
          </el-table-column>
          <el-table-column prop="testItems" label="关联检测项" width="100" align="center" />
          <el-table-column prop="effectDate" label="生效日期" width="110" />
          <el-table-column label="操作" width="120">
            <template #default><el-button link type="primary" size="small">查看</el-button><el-button link size="small">关联配置</el-button></template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const stdTab = ref('list')
const stdTree = [
  { id: 1, name: '食品检测标准', children: [{ id: 11, name: '重金属' }, { id: 12, name: '微生物' }, { id: 13, name: '营养成分' }] },
  { id: 2, name: '环境检测标准', children: [{ id: 21, name: '水质' }, { id: 22, name: '大气' }] },
  { id: 3, name: '新能源标准', children: [{ id: 31, name: '电池性能' }, { id: 32, name: '安全' }] },
  { id: 4, name: 'ISO 国际标准', children: [] },
]
const standards = [
  { code: 'GB 5009.12-2023', name: '食品安全国家标准 食品中铅的测定', version: '2023', status: '现行', testItems: 3, effectDate: '2024-03-01' },
  { code: 'GB 5009.15-2014', name: '食品安全国家标准 食品中镉的测定', version: '2014', status: '现行', testItems: 2, effectDate: '2016-03-01' },
  { code: 'GB 4789.2-2022', name: '食品安全国家标准 食品微生物学检验 菌落总数测定', version: '2022', status: '现行', testItems: 1, effectDate: '2023-02-01' },
  { code: 'HJ 828-2017', name: '水质 化学需氧量的测定 重铬酸盐法', version: '2017', status: '现行', testItems: 1, effectDate: '2017-09-01' },
  { code: 'GB 5009.5-2016', name: '食品安全国家标准 食品中蛋白质的测定', version: '2016', status: '现行', testItems: 1, effectDate: '2017-03-01' },
  { code: 'IEC 62660-1:2018', name: '电动道路车辆用蓄电池单体 第1部分：性能测试', version: '2018', status: '现行', testItems: 5, effectDate: '2018-06-01' },
]
function handleTreeClick() {}
</script>

<style scoped>
.page {}
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.page-title { font-size: 18px; font-weight: 600; color: #0B1220; margin-bottom: 4px; }
.page-subtitle { font-size: 13px; color: #526075; }
.std-layout { display: flex; gap: 0; border: 1px solid #D9DEE7; border-radius: 6px; background: #fff; overflow: hidden; }
.std-tree-panel { width: 220px; border-right: 1px solid #D9DEE7; padding: 14px; overflow-y: auto; }
.std-main { flex: 1; padding: 16px; }
</style>
