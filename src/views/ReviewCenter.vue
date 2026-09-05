<template>
  <div class="page review-page">
    <div class="page-header">
      <div>
        <div class="page-title">审核中心</div>
        <div class="page-subtitle">技术审核 · 质量审核 · AI 审核 · 最终人工决策</div>
      </div>
    </div>

    <div class="review-layout">
      <!-- Report content left -->
      <div class="report-panel">
        <div class="report-toolbar">
          <el-select value="RPT-2024-0812" style="width:220px" size="small">
            <el-option label="RPT-2024-0812 牛奶重金属检测" value="1" />
            <el-option label="RPT-2024-0810 食品添加剂检测" value="2" />
          </el-select>
          <el-tag type="warning" size="small">待审核</el-tag>
        </div>
        <div class="report-content">
          <div class="report-section">
            <div class="rs-title">检验报告</div>
            <div class="rs-meta">报告编号：RPT-2024-0812 · 发布日期：待签发 · CMA 认证</div>
          </div>
          <div class="report-section">
            <div class="rs-label">样品信息</div>
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="样品名称">纯牛奶（全脂）</el-descriptions-item>
              <el-descriptions-item label="样品编号">FS-2024-0891</el-descriptions-item>
              <el-descriptions-item label="委托单位">好食光食品有限公司</el-descriptions-item>
              <el-descriptions-item label="接样日期">2024-12-01</el-descriptions-item>
            </el-descriptions>
          </div>
          <div class="report-section">
            <div class="rs-label">检测结果</div>
            <el-table :data="testResults" border size="small">
              <el-table-column prop="item" label="检测项目" width="100" />
              <el-table-column prop="method" label="检测方法" width="150" />
              <el-table-column prop="result" label="检测结果" width="110">
                <template #default="{row}">
                  <span :style="{color: row.pass ? '#18794E' : '#C32F3F', fontWeight: '500'}">{{ row.result }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="unit" label="单位" width="70" />
              <el-table-column prop="limit" label="标准限值" width="110" />
              <el-table-column prop="verdict" label="判定" width="80">
                <template #default="{row}">
                  <el-tag :type="row.pass ? 'success' : 'danger'" size="small">{{ row.pass ? '符合' : '不符合' }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div class="report-section">
            <div class="rs-label">检验结论</div>
            <div class="report-conclusion">
              经检验，该批次纯牛奶样品中铅、镉含量符合 GB 2762-2022 《食品安全国家标准 食品中污染物限量》规定，菌落总数符合 GB 19301-2010 要求，蛋白质含量符合 GB 25190-2010 标准要求。综合判定：<strong style="color:#18794E">符合标准</strong>。
            </div>
          </div>
        </div>
      </div>

      <!-- Review panel right -->
      <div class="checklist-panel">
        <div class="checklist-section">
          <div class="cl-title">AI 审核结果</div>
          <div class="ai-audit-summary">
            <el-progress type="circle" :percentage="94" :width="64" color="#18794E" />
            <div>
              <div style="font-size:14px;font-weight:600;color:#0B1220">整体置信度 94%</div>
              <div style="font-size:12px;color:#526075;margin-top:2px">5 项通过 · 1 项提示</div>
            </div>
          </div>
          <div class="ai-findings">
            <div class="ai-finding ok" v-for="f in aiFindings.filter(f => !f.warn)" :key="f.id">
              <el-icon color="#18794E"><CircleCheck /></el-icon>
              <span>{{ f.text }}</span>
            </div>
            <div class="ai-finding warn" v-for="f in aiFindings.filter(f => f.warn)" :key="f.id">
              <el-icon color="#A9650A"><Warning /></el-icon>
              <span>{{ f.text }}</span>
            </div>
          </div>
        </div>

        <el-divider />

        <div class="checklist-section">
          <div class="cl-title">技术审核清单</div>
          <div class="tech-checklist">
            <div class="check-item" v-for="c in techChecklist" :key="c.id">
              <el-checkbox v-model="c.checked">{{ c.name }}</el-checkbox>
            </div>
          </div>
        </div>

        <el-divider />

        <div class="checklist-section">
          <div class="cl-title">审核意见</div>
          <el-input type="textarea" :rows="3" placeholder="填写审核意见..." value="检测数据完整，方法符合，结论准确，建议签发。" />
        </div>

        <div class="review-actions">
          <el-button type="success" style="width:100%;margin-bottom:8px">
            <el-icon><Check /></el-icon> 审核通过 · 签发报告
          </el-button>
          <el-button type="warning" plain style="width:100%;margin-bottom:8px">退回修改</el-button>
          <el-button type="danger" plain style="width:100%">驳回</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const testResults = [
  { item: '铅 (Pb)', method: 'GB 5009.12-2023 ICP-MS', result: '0.018', unit: 'mg/kg', limit: '≤0.05', pass: true },
  { item: '镉 (Cd)', method: 'GB 5009.15-2014 ICP-MS', result: '0.003', unit: 'mg/kg', limit: '≤0.01', pass: true },
  { item: '菌落总数', method: 'GB 4789.2-2022', result: '3.2×10³', unit: 'CFU/mL', limit: '≤2×10⁵', pass: true },
  { item: '蛋白质', method: 'GB 5009.5-2016 凯氏定氮', result: '3.12', unit: 'g/100g', limit: '≥2.9', pass: true },
]

const aiFindings = ref([
  { id: 1, text: '标准版本匹配正确 (GB 5009.12-2023)', warn: false },
  { id: 2, text: '铅含量结果与历史数据一致', warn: false },
  { id: 3, text: '菌落总数判定符合乳品标准', warn: false },
  { id: 4, text: '蛋白质含量符合要求', warn: false },
  { id: 5, text: '报告格式符合 CMA 规范', warn: false },
  { id: 6, text: '镉检测值偏低，建议确认仪器校准状态', warn: true },
])

const techChecklist = ref([
  { id: 1, name: '样品接收记录完整', checked: true },
  { id: 2, name: '检测方法符合标准要求', checked: true },
  { id: 3, name: '仪器校准在有效期内', checked: true },
  { id: 4, name: '原始记录数据可追溯', checked: true },
  { id: 5, name: '结果计算和单位正确', checked: true },
  { id: 6, name: '报告结论与数据一致', checked: true },
  { id: 7, name: '电子签章规则符合要求', checked: false },
])
</script>

<style scoped>
.page {}
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.page-title { font-size: 18px; font-weight: 600; color: #0B1220; margin-bottom: 4px; }
.page-subtitle { font-size: 13px; color: #526075; }

.review-layout { display: flex; gap: 0; border: 1px solid #D9DEE7; border-radius: 6px; overflow: hidden; background: #fff; min-height: 600px; }

.report-panel { flex: 1; border-right: 1px solid #D9DEE7; overflow-y: auto; }
.report-toolbar { padding: 10px 16px; border-bottom: 1px solid #D9DEE7; display: flex; align-items: center; gap: 10px; background: #F8FAFB; }
.report-content { padding: 24px; }
.report-section { margin-bottom: 24px; }
.rs-title { font-size: 20px; font-weight: 600; color: #0B1220; margin-bottom: 4px; text-align: center; }
.rs-meta { font-size: 12px; color: #526075; text-align: center; margin-bottom: 16px; }
.rs-label { font-size: 13px; font-weight: 600; color: #0B1220; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #D9DEE7; }
.report-conclusion { font-size: 13px; color: #0B1220; line-height: 1.8; padding: 12px 16px; background: #F8FAFB; border-left: 3px solid #1677FF; border-radius: 0 4px 4px 0; }

.checklist-panel { width: 320px; flex-shrink: 0; padding: 16px; overflow-y: auto; }
.cl-title { font-size: 13px; font-weight: 600; color: #0B1220; margin-bottom: 12px; }
.checklist-section {}

.ai-audit-summary { display: flex; gap: 16px; align-items: center; margin-bottom: 14px; padding: 12px; background: #F0FFF4; border: 1px solid #84D996; border-radius: 4px; }
.ai-findings { display: flex; flex-direction: column; gap: 8px; }
.ai-finding { display: flex; align-items: flex-start; gap: 6px; font-size: 12px; color: #526075; }
.ai-finding.warn { color: #A9650A; }

.tech-checklist { display: flex; flex-direction: column; gap: 8px; }
.check-item { font-size: 13px; }

.review-actions { margin-top: 16px; }
</style>
