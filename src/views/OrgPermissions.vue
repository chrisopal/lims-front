<template>
  <div class="page">
    <div class="page-header">
      <div><div class="page-title">组织、角色与权限</div><div class="page-subtitle">租户管理 · 组织架构 · 角色 · 数据权限 · 场景授权</div></div>
      <el-button type="primary">+ 新增角色</el-button>
    </div>
    <el-tabs v-model="tab">
      <el-tab-pane label="组织架构" name="org" />
      <el-tab-pane label="角色管理" name="role" />
      <el-tab-pane label="场景授权" name="scene" />
    </el-tabs>
    <div style="display:flex;gap:16px;margin-top:12px">
      <div class="panel" style="width:240px">
        <el-tree :data="orgTree" node-key="id" default-expand-all :props="{label:'name'}" />
      </div>
      <div class="panel" style="flex:1">
        <el-table :data="roles" size="small">
          <el-table-column prop="name" label="角色名称" />
          <el-table-column prop="code" label="角色编码" width="140" />
          <el-table-column prop="users" label="人数" width="80" align="center" />
          <el-table-column prop="scenes" label="授权场景" />
          <el-table-column label="操作" width="120">
            <template #default><el-button link type="primary" size="small">权限配置</el-button><el-button link size="small">成员</el-button></template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
const tab = ref('role')
const orgTree = [
  { id: 1, name: '华东食品检测中心', children: [
    { id: 11, name: '理化检测室' },
    { id: 12, name: '微生物检测室' },
    { id: 13, name: '质量管理部' },
    { id: 14, name: '样品管理部' },
  ]}
]
const roles = [
  { name: '实验室主任', code: 'LAB_DIRECTOR', users: 2, scenes: '全部场景' },
  { name: '检测人员', code: 'TESTER', users: 18, scenes: '食品检测、理化检测' },
  { name: '技术审核员', code: 'TECH_REVIEWER', users: 5, scenes: '食品检测、环境检测' },
  { name: '质量审核员', code: 'QUALITY_REVIEWER', users: 3, scenes: '全部场景' },
  { name: '样品管理员', code: 'SAMPLE_MGR', users: 4, scenes: '全部场景' },
  { name: '客户服务员', code: 'CS_STAFF', users: 6, scenes: '第三方委托' },
]
</script>
<style scoped>
.page {}
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.page-title { font-size: 18px; font-weight: 600; color: #0B1220; margin-bottom: 4px; }
.page-subtitle { font-size: 13px; color: #526075; }
.panel { background: #fff; border: 1px solid #D9DEE7; border-radius: 6px; padding: 16px; }
</style>
