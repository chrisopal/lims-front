<template>
  <div class="page template-page">
    <div class="page-header">
      <div><div class="page-title">报告模板设计器</div><div class="page-subtitle">Report Template Designer · 动态字段 · 条件显示 · 电子签章</div></div>
      <div style="display:flex;gap:8px"><el-button>导入模板</el-button><el-button type="primary">+ 新建模板</el-button></div>
    </div>
    <div class="template-layout">
      <!-- Left structure -->
      <div class="tpl-structure">
        <div class="tpl-sel-label">当前模板</div>
        <el-select value="食品检测报告 v4" style="width:100%;margin-bottom:12px" size="small">
          <el-option label="食品检测报告 v4" value="1" />
          <el-option label="微生物检测报告 v2" value="2" />
          <el-option label="环境检测报告 v3" value="3" />
        </el-select>
        <div class="tpl-tree">
          <div class="tpl-node" v-for="s in tplSections" :key="s.id" :class="{active: activeSection === s.id}" @click="activeSection = s.id">
            <el-icon style="margin-right:4px"><Document /></el-icon>
            {{ s.name }}
          </div>
        </div>
      </div>
      <!-- Center preview -->
      <div class="tpl-preview">
        <div class="preview-canvas">
          <div class="a4-page">
            <div class="rpt-header">
              <div class="rpt-logo">⚗ 华东食品检测中心</div>
              <div class="rpt-marks"><span class="rpt-mark cma">CMA</span><span class="rpt-mark cnas">CNAS</span></div>
            </div>
            <div class="rpt-title">食品检验报告</div>
            <div class="rpt-subtitle">FOOD INSPECTION REPORT</div>
            <div class="rpt-divider"></div>
            <table class="rpt-info-table" v-pre>
              <tr><td>报告编号</td><td><span class="field-placeholder">{{报告编号}}</span></td><td>报告日期</td><td><span class="field-placeholder">{{报告日期}}</span></td></tr>
              <tr><td>委托单位</td><td colspan="3"><span class="field-placeholder">{{委托单位}}</span></td></tr>
              <tr><td>样品名称</td><td><span class="field-placeholder">{{样品名称}}</span></td><td>样品编号</td><td><span class="field-placeholder">{{样品编号}}</span></td></tr>
            </table>
            <div class="rpt-section-title">检测结果</div>
            <table class="rpt-result-table" v-pre>
              <thead><tr><th>检测项目</th><th>检测方法</th><th>检测结果</th><th>标准限值</th><th>判定</th></tr></thead>
              <tbody>
                <tr><td class="field-placeholder">{{检测项目}}</td><td class="field-placeholder">{{方法}}</td><td class="field-placeholder">{{结果}}</td><td class="field-placeholder">{{限值}}</td><td class="field-placeholder">{{判定}}</td></tr>
                <tr style="color:#B0B9C6;font-style:italic"><td colspan="5" style="text-align:center">Repeat 区块（按检测项目数量重复）</td></tr>
              </tbody>
            </table>
            <div class="rpt-conclusion" v-pre>
              <strong>检验结论：</strong><span class="field-placeholder">{{检验结论}}</span>
            </div>
            <div class="rpt-sign" v-pre>
              <div class="sign-item"><div>检测人员</div><div class="sign-line"></div><span class="field-placeholder">{{签名}}</span></div>
              <div class="sign-item"><div>技术审核</div><div class="sign-line"></div><span class="field-placeholder">{{签名}}</span></div>
              <div class="sign-item"><div>授权签字人</div><div class="sign-line"></div><div class="seal-placeholder">【电子签章】</div></div>
            </div>
          </div>
        </div>
      </div>
      <!-- Right properties -->
      <div class="tpl-props">
        <div class="props-title">字段绑定与属性</div>
        <el-form label-position="top" size="small">
          <el-form-item label="模板名称"><el-input value="食品检测报告" /></el-form-item>
          <el-form-item label="版本"><el-input value="v4.0" /></el-form-item>
          <el-form-item label="适用场景">
            <el-select value="food" style="width:100%"><el-option label="食品检测" value="food" /></el-select>
          </el-form-item>
          <el-form-item label="语言">
            <el-radio-group value="zh"><el-radio value="zh">中文</el-radio><el-radio value="en">英文</el-radio><el-radio value="zh-en">双语</el-radio></el-radio-group>
          </el-form-item>
          <el-divider>签章配置</el-divider>
          <el-form-item label="CMA 标识"><el-switch :value="true" /></el-form-item>
          <el-form-item label="CNAS 标识"><el-switch :value="true" /></el-form-item>
          <el-form-item label="电子签章"><el-switch :value="true" /></el-form-item>
          <el-divider>动态配置</el-divider>
          <el-form-item label="Repeat 检测项"><el-switch :value="true" /></el-form-item>
          <el-form-item label="条件显示结论"><el-switch :value="true" /></el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
const activeSection = ref(1)
const tplSections = [
  { id: 1, name: '页眉 / 机构信息' },
  { id: 2, name: '报告基础信息' },
  { id: 3, name: '样品信息表' },
  { id: 4, name: '检测结果表（Repeat）' },
  { id: 5, name: '检验结论' },
  { id: 6, name: '签名签章区' },
  { id: 7, name: '附件说明' },
]
</script>
<style scoped>
.page {}
.template-page { display: flex; flex-direction: column; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.page-title { font-size: 18px; font-weight: 600; color: #0B1220; margin-bottom: 4px; }
.page-subtitle { font-size: 13px; color: #526075; }
.template-layout { display: flex; gap: 0; border: 1px solid #D9DEE7; border-radius: 6px; overflow: hidden; background: #fff; min-height: 600px; }
.tpl-structure { width: 200px; border-right: 1px solid #D9DEE7; padding: 14px; }
.tpl-sel-label { font-size: 12px; color: #526075; margin-bottom: 6px; font-weight: 500; }
.tpl-tree { display: flex; flex-direction: column; gap: 2px; }
.tpl-node { display: flex; align-items: center; padding: 7px 8px; font-size: 12px; color: #526075; border-radius: 4px; cursor: pointer; }
.tpl-node:hover { background: #F5F7FA; }
.tpl-node.active { background: #EDF4FF; color: #1677FF; }
.tpl-preview { flex: 1; background: #E8EBF0; display: flex; align-items: flex-start; justify-content: center; padding: 24px; overflow-y: auto; }
.a4-page { width: 595px; background: #fff; padding: 40px; box-shadow: 0 2px 12px rgba(0,0,0,0.1); min-height: 800px; }
.rpt-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.rpt-logo { font-size: 14px; font-weight: 600; color: #0B1220; }
.rpt-marks { display: flex; gap: 4px; }
.rpt-mark { font-size: 10px; padding: 2px 5px; border-radius: 2px; font-weight: 700; border: 2px solid; }
.rpt-mark.cma { color: #1677FF; border-color: #1677FF; }
.rpt-mark.cnas { color: #C32F3F; border-color: #C32F3F; }
.rpt-title { font-size: 18px; font-weight: 700; text-align: center; color: #0B1220; margin-bottom: 4px; }
.rpt-subtitle { font-size: 11px; text-align: center; color: #8A96A6; letter-spacing: 1px; margin-bottom: 12px; }
.rpt-divider { height: 2px; background: #0B1220; margin-bottom: 12px; }
.rpt-info-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 16px; }
.rpt-info-table td { border: 1px solid #D9DEE7; padding: 6px 10px; color: #526075; }
.rpt-info-table td:nth-child(odd) { background: #F8FAFB; width: 90px; font-weight: 500; }
.field-placeholder { color: #1677FF; font-style: italic; }
.rpt-section-title { font-size: 13px; font-weight: 600; color: #0B1220; margin-bottom: 8px; border-left: 3px solid #1677FF; padding-left: 8px; }
.rpt-result-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 16px; }
.rpt-result-table th { background: #F8FAFB; border: 1px solid #D9DEE7; padding: 6px; color: #526075; font-weight: 500; }
.rpt-result-table td { border: 1px solid #D9DEE7; padding: 6px; }
.rpt-conclusion { font-size: 12px; margin-bottom: 24px; color: #0B1220; padding: 10px; border: 1px solid #D9DEE7; border-radius: 4px; background: #F8FAFB; }
.rpt-sign { display: flex; gap: 24px; justify-content: flex-end; margin-top: 24px; }
.sign-item { display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 11px; color: #526075; }
.sign-line { width: 80px; height: 1px; background: #0B1220; }
.seal-placeholder { font-size: 11px; color: #C32F3F; border: 1px dashed #C32F3F; padding: 4px 8px; border-radius: 50%; }
.tpl-props { width: 240px; border-left: 1px solid #D9DEE7; padding: 16px; overflow-y: auto; }
.props-title { font-size: 13px; font-weight: 600; color: #0B1220; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid #D9DEE7; }
</style>
