<template>
  <div class="page">
    <div class="page-header">
      <div>
        <div class="page-title">审计 · 流程时间线</div>
        <div class="page-subtitle">Audit Trail · 完整过程追溯</div>
      </div>
      <el-button size="small">导出审计记录</el-button>
    </div>

    <!-- Selector -->
    <div class="selector-bar">
      <span class="selector-label">委托 / 申请：</span>
      <el-select value="REQ-20260901-009" style="width:220px" size="small">
        <el-option label="REQ-20260901-009" value="REQ-20260901-009" />
        <el-option label="REQ-20260905-004" value="REQ-20260905-004" />
        <el-option label="REQ-20260903-018" value="REQ-20260903-018" />
      </el-select>
      <span class="selector-label" style="margin-left:16px">场景快照：</span>
      <span class="snapshot-tag">第三方食品理化检测 v1.2.0 · sha256:7fa3c2d...</span>
    </div>

    <div class="audit-layout">
      <!-- Timeline -->
      <div class="timeline-wrap">
        <div v-for="(event, i) in events" :key="event.id" class="tl-item">
          <div class="tl-left">
            <div :class="['tl-dot', event.type]"></div>
            <div class="tl-line" v-if="i < events.length - 1"></div>
          </div>
          <div class="tl-content">
            <div class="tl-header">
              <span class="tl-event">{{ event.event }}</span>
              <span :class="['tl-type-tag', event.type]">{{ event.typeLabel }}</span>
            </div>
            <div class="tl-meta">
              <span class="tl-time">{{ event.time }}</span>
              <span class="tl-sep">·</span>
              <span class="tl-actor">{{ event.actor }}</span>
              <span class="tl-sep">·</span>
              <span class="tl-node">{{ event.node }}</span>
            </div>
            <div class="tl-detail" v-if="event.detail">{{ event.detail }}</div>
            <div class="tl-trace">
              <span class="trace-label">Trace ID</span>
              <span class="trace-val">{{ event.traceId }}</span>
              <el-icon size="11" style="cursor:pointer;color:#B0B9C6" title="复制"><CopyDocument /></el-icon>
            </div>
            <div class="tl-snapshot" v-if="event.snapshot">
              <span class="snap-label">Snapshot</span>
              <span class="snap-val">{{ event.snapshot }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Summary stats -->
      <div class="audit-summary">
        <div class="summary-title">流程概要</div>
        <div class="summary-kv"><span class="sk">委托号</span><span class="sv mono">REQ-20260901-009</span></div>
        <div class="summary-kv"><span class="sk">场景</span><span class="sv">第三方食品理化检测</span></div>
        <div class="summary-kv"><span class="sk">版本快照</span><span class="sv mono small">v1.2.0 · sha256:7fa...</span></div>
        <div class="summary-kv"><span class="sk">创建时间</span><span class="sv">2026-09-01 09:12</span></div>
        <div class="summary-kv"><span class="sk">完成时间</span><span class="sv">2026-09-05 16:44</span></div>
        <div class="summary-kv"><span class="sk">总耗时</span><span class="sv">4d 7h 32m</span></div>
        <div class="summary-kv"><span class="sk">涉及人员</span><span class="sv">5 人</span></div>
        <el-divider />
        <div class="summary-title">AI 决策记录</div>
        <div v-for="ai in aiDecisions" :key="ai.id" class="ai-decision-row">
          <el-icon size="12" color="#526075"><MagicStick /></el-icon>
          <div>
            <div class="ai-skill">{{ ai.skill }}</div>
            <div class="ai-outcome">{{ ai.outcome }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
const events = ref([
  { id: 1, event: 'Request Created', time: '2026-09-01 09:12', actor: '王芳（受理员）', node: '委托受理', type: 'create', typeLabel: 'System', detail: '委托方：上海食品工业协会', traceId: 'tr-a1b2c3d4', snapshot: null },
  { id: 2, event: 'Scenario Snapshot Locked', time: '2026-09-01 09:13', actor: 'System', node: 'System', type: 'system', typeLabel: 'System', detail: '快照 sha256:7fa3c2d... 已锁定，流程将按此版本执行', traceId: 'tr-a1b2c3d5', snapshot: 'v1.2.0 · sha256:7fa3c2d...' },
  { id: 3, event: 'Process Started', time: '2026-09-01 09:13', actor: 'System', node: 'REQUEST_ACCEPTANCE', type: 'system', typeLabel: 'Process', detail: null, traceId: 'tr-b2c3d4e5', snapshot: null },
  { id: 4, event: 'REQUEST_ACCEPTANCE Completed', time: '2026-09-01 10:05', actor: '王芳（受理员）', node: 'REQUEST_ACCEPTANCE', type: 'human', typeLabel: 'Human', detail: '已确认检测项 12 项，标准版本已审核', traceId: 'tr-c3d4e5f6', snapshot: null },
  { id: 5, event: 'SAMPLE_RECEIPT Completed', time: '2026-09-01 15:30', actor: '刘强（收样员）', node: 'SAMPLE_RECEIPT', type: 'human', typeLabel: 'Human', detail: '样品 F010 已接收，编号已录入', traceId: 'tr-d4e5f6a7', snapshot: null },
  { id: 6, event: 'AI standard-match v1.2 Invoked', time: '2026-09-01 10:02', actor: 'AI · standard-match v1.2', node: 'REQUEST_ACCEPTANCE', type: 'ai', typeLabel: 'AI', detail: '推荐 GB 5009.12-2023（已采纳）', traceId: 'tr-e5f6a7b8', snapshot: null },
  { id: 7, event: 'LAB_TEST_EXECUTION Started', time: '2026-09-02 08:30', actor: '李明（理化检测员）', node: 'LAB_TEST_EXECUTION', type: 'human', typeLabel: 'Human', detail: null, traceId: 'tr-f6a7b8c9', snapshot: null },
  { id: 8, event: 'LAB_TEST_EXECUTION Completed', time: '2026-09-04 16:20', actor: '李明（理化检测员）', node: 'LAB_TEST_EXECUTION', type: 'human', typeLabel: 'Human', detail: '全部 12 项检测结果已录入', traceId: 'tr-g7b8c9d0', snapshot: null },
  { id: 9, event: 'AI report-review v1.4 Invoked', time: '2026-09-05 09:15', actor: 'AI · report-review v1.4', node: 'TECHNICAL_REVIEW', type: 'ai', typeLabel: 'AI', detail: '发现 1 个单位不一致问题（已标注，由审核员确认）', traceId: 'tr-h8c9d0e1', snapshot: null },
  { id: 10, event: 'TECHNICAL_REVIEW Approved', time: '2026-09-05 14:22', actor: '陈技术（技术负责人）', node: 'TECHNICAL_REVIEW', type: 'review', typeLabel: 'Review', detail: 'AI 标注问题已核实并更正', traceId: 'tr-i9d0e1f2', snapshot: null },
  { id: 11, event: 'Report Released', time: '2026-09-05 16:44', actor: '张授权（授权签字人）', node: 'REPORT_RELEASE', type: 'complete', typeLabel: 'Complete', detail: '报告号 RPT-20260905-009 已签发', traceId: 'tr-j0e1f2a3', snapshot: null },
])

const aiDecisions = ref([
  { id: 1, skill: 'standard-match v1.2', outcome: '推荐 GB 5009.12-2023 · 已采纳' },
  { id: 2, skill: 'report-draft v2.0', outcome: '生成报告草稿 · 已采纳' },
  { id: 3, skill: 'report-review v1.4', outcome: '识别 1 个问题 · 已采纳并修正' },
])
</script>
<style scoped>
.page { padding: 24px 32px; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.page-title { font-size: 20px; font-weight: 600; color: #0B1220; }
.page-subtitle { font-size: 12px; color: #526075; }
.selector-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; padding: 10px 14px; background: #fff; border: 1px solid #D9DEE7; border-radius: 4px; font-size: 13px; }
.selector-label { color: #526075; font-size: 12px; }
.snapshot-tag { font-family: monospace; font-size: 11px; color: #18794E; background: #F0FFF4; border: 1px solid #B7E6CB; padding: 2px 8px; border-radius: 3px; }
.audit-layout { display: flex; gap: 16px; }
.timeline-wrap { flex: 1; background: #fff; border: 1px solid #D9DEE7; border-radius: 6px; padding: 20px 24px; }
.tl-item { display: flex; gap: 0; }
.tl-left { display: flex; flex-direction: column; align-items: center; width: 20px; flex-shrink: 0; margin-right: 16px; }
.tl-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
.tl-dot.create { background: #1677FF; }
.tl-dot.system { background: #D9DEE7; }
.tl-dot.human { background: #18794E; }
.tl-dot.ai { background: #526075; }
.tl-dot.review { background: #A9650A; }
.tl-dot.complete { background: #1677FF; border: 2px solid #1677FF; }
.tl-line { flex: 1; width: 1px; background: #E7EAF0; min-height: 20px; margin: 4px 0; }
.tl-content { flex: 1; padding-bottom: 18px; }
.tl-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.tl-event { font-size: 13px; font-weight: 500; color: #0B1220; }
.tl-type-tag { font-size: 10px; padding: 1px 5px; border-radius: 2px; }
.tl-type-tag.system { background: #F5F7FA; color: #8A96A6; }
.tl-type-tag.create, .tl-type-tag.complete { background: #EDF4FF; color: #1677FF; }
.tl-type-tag.human { background: #F0FFF4; color: #18794E; }
.tl-type-tag.ai { background: #F5F0FF; color: #526075; }
.tl-type-tag.review { background: #FFF3E0; color: #A9650A; }
.tl-meta { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #8A96A6; margin-bottom: 4px; }
.tl-sep { color: #D9DEE7; }
.tl-node { font-family: monospace; font-size: 11px; }
.tl-detail { font-size: 12px; color: #526075; margin-bottom: 4px; }
.tl-trace { display: flex; align-items: center; gap: 6px; }
.trace-label { font-size: 11px; color: #B0B9C6; }
.trace-val { font-size: 11px; font-family: monospace; color: #8A96A6; }
.tl-snapshot { display: flex; align-items: center; gap: 6px; margin-top: 3px; }
.snap-label { font-size: 11px; color: #B0B9C6; }
.snap-val { font-size: 11px; font-family: monospace; color: #18794E; background: #F0FFF4; padding: 1px 5px; border-radius: 2px; }
/* Summary sidebar */
.audit-summary { width: 260px; flex-shrink: 0; background: #fff; border: 1px solid #D9DEE7; border-radius: 6px; padding: 16px; height: fit-content; }
.summary-title { font-size: 12px; font-weight: 600; color: #0B1220; margin-bottom: 10px; }
.summary-kv { display: flex; align-items: flex-start; gap: 0; margin-bottom: 7px; }
.sk { width: 80px; font-size: 12px; color: #8A96A6; flex-shrink: 0; }
.sv { font-size: 12px; color: #0B1220; }
.sv.mono { font-family: monospace; }
.sv.small { font-size: 11px; }
.ai-decision-row { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 8px; }
.ai-skill { font-size: 12px; font-family: monospace; color: #0B1220; }
.ai-outcome { font-size: 12px; color: #526075; }
</style>
