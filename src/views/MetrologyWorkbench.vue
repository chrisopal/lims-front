<template>
  <div class="ws-page">
    <div class="ws-header">
      <div class="ws-header-left">
        <el-button link size="small" @click="$router.push('/app/operations/my-work')"><el-icon><ArrowLeft /></el-icon> 返回</el-button>
        <div class="ws-title-group">
          <div class="ws-title">现场尺寸检测任务 <span class="ws-id">MT-02481</span></div>
          <div class="ws-meta">
            <span class="ws-meta-item"><el-icon size="11"><Grid /></el-icon> 客户现场尺寸检测 v1.0</span>
            <span class="ws-meta-sep">·</span>
            <span class="ws-meta-item"><el-icon size="11"><Document /></el-icon> REQ-20260905-002</span>
            <span class="ws-meta-sep">·</span>
            <span class="ws-status pending">待处理</span>
          </div>
        </div>
      </div>
      <div class="ws-header-right">
        <el-button size="small">保存草稿</el-button>
        <el-button type="primary" size="small">完成检测</el-button>
      </div>
    </div>

    <div class="ws-body">
      <!-- Left context -->
      <div class="ws-context">
        <div class="ctx-title">任务上下文</div>
        <div class="ctx-section">
          <div class="ctx-label">客户现场</div>
          <div class="ctx-val bold">杭州精工制造有限公司</div>
          <div class="ctx-val small">浙江省杭州市萧山区</div>
        </div>
        <div class="ctx-section">
          <div class="ctx-label">Part / 图号</div>
          <div class="ctx-val bold">A-2488</div>
          <div class="ctx-val small">DWG: JING-A2488-R3</div>
        </div>
        <div class="ctx-section">
          <div class="ctx-label">派遣人员</div>
          <div class="ctx-val">王伟（几何量工程师）</div>
        </div>
        <div class="ctx-section">
          <div class="ctx-label">测量设备</div>
          <div class="ctx-val">三坐标 CMM - Zeiss Contura</div>
          <div class="ctx-val small">校准有效期 2026-12-01</div>
        </div>
        <div class="ctx-section">
          <div class="ctx-label">量具</div>
          <div class="ctx-val">螺旋测微仪 M-25</div>
          <div class="ctx-val">游标卡尺 VC-200</div>
        </div>
        <div class="ctx-section">
          <div class="ctx-label">SOP</div>
          <div class="ctx-val" style="color:#1677FF;font-size:12px;cursor:pointer">SOP-MET-CMM-003</div>
        </div>
      </div>

      <!-- Main: Part tree + measurement table -->
      <div class="ws-main">
        <!-- Part feature tree header -->
        <div class="section-block">
          <div class="section-header">
            <div class="section-title">Part → Feature → Characteristic</div>
            <div style="display:flex;gap:6px">
              <el-button size="small">导入 CAD 数据</el-button>
              <el-button size="small" type="primary">+ 添加 Feature</el-button>
            </div>
          </div>
          <div class="pfc-layout">
            <!-- Tree column -->
            <div class="pfc-tree">
              <div v-for="feature in features" :key="feature.id" class="pfc-feature" :class="{ active: activeFeature === feature.id }" @click="activeFeature = feature.id">
                <div class="pfc-feat-name">{{ feature.name }}</div>
                <div class="pfc-feat-count">{{ feature.chars.length }} Chars</div>
              </div>
            </div>
            <!-- Measurement table -->
            <div class="pfc-table">
              <el-table :data="activeChars" border size="small">
                <el-table-column label="Characteristic" width="160" prop="name" />
                <el-table-column label="Nominal" width="100" prop="nominal" />
                <el-table-column label="−Tol" width="90" prop="lowerTol" />
                <el-table-column label="+Tol" width="90" prop="upperTol" />
                <el-table-column label="Measurement" width="130">
                  <template #default="{ row }">
                    <el-input v-model="row.measured" size="small" :class="{ 'input-fail': row.judgment === 'FAIL' }" />
                  </template>
                </el-table-column>
                <el-table-column label="Uncertainty" width="110" prop="uncertainty" />
                <el-table-column label="Judgment" width="90">
                  <template #default="{ row }">
                    <span v-if="row.judgment" :class="['judgment-tag', row.judgment === 'PASS' ? 'pass' : 'fail']">
                      {{ row.judgment }}
                    </span>
                    <span v-else class="judgment-na">—</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </div>

        <!-- Summary stats -->
        <div class="meas-summary">
          <div class="ms-card" v-for="s in summary" :key="s.label">
            <div class="ms-val" :class="s.cls">{{ s.val }}</div>
            <div class="ms-label">{{ s.label }}</div>
          </div>
        </div>

        <!-- Right-side info: method + person -->
        <div class="detail-cards">
          <div class="detail-card">
            <div class="dc-title">测量方法</div>
            <div class="dc-kv"><span class="dk">Method</span><span class="dv">三坐标 CMM 接触式测量</span></div>
            <div class="dc-kv"><span class="dk">SOP</span><span class="dv mono">SOP-MET-CMM-003</span></div>
            <div class="dc-kv"><span class="dk">测量温度</span><span class="dv">20 ± 1 °C</span></div>
            <div class="dc-kv"><span class="dk">测量力</span><span class="dv">0.5 N</span></div>
          </div>
          <div class="detail-card">
            <div class="dc-title">设备校准状态</div>
            <div class="dc-kv"><span class="dk">CMM</span><span class="dv ok-text">已校准 · 有效至 2026-12-01</span></div>
            <div class="dc-kv"><span class="dk">螺旋测微仪</span><span class="dv ok-text">已校准 · 有效至 2026-10-15</span></div>
            <div class="dc-kv"><span class="dk">游标卡尺</span><span class="dv warn-text">即将到期 · 2026-09-20</span></div>
          </div>
          <div class="detail-card">
            <div class="dc-title">人员资质</div>
            <div class="dc-kv"><span class="dk">检测员</span><span class="dv">王伟</span></div>
            <div class="dc-kv"><span class="dk">资质</span><span class="dv ok-text">几何量检测员 L3 · 有效</span></div>
            <div class="dc-kv"><span class="dk">CMM 资质</span><span class="dv ok-text">Zeiss CMM 认证 · 有效</span></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'

const activeFeature = ref(1)

const features = ref([
  {
    id: 1, name: 'F1 - 主孔径 Ø52',
    chars: [
      { id: 1, name: '内径', nominal: '52.000', lowerTol: '-0.025', upperTol: '+0.000', measured: '51.987', uncertainty: '±0.003', judgment: 'PASS' },
      { id: 2, name: '圆柱度', nominal: '0.000', lowerTol: '—', upperTol: '0.008', measured: '0.005', uncertainty: '±0.001', judgment: 'PASS' },
      { id: 3, name: '粗糙度 Ra', nominal: '—', lowerTol: '—', upperTol: '1.6 μm', measured: '1.8', uncertainty: '±0.1', judgment: 'FAIL' },
    ],
  },
  {
    id: 2, name: 'F2 - 端面平面度',
    chars: [
      { id: 4, name: '平面度', nominal: '0.000', lowerTol: '—', upperTol: '0.010', measured: '0.007', uncertainty: '±0.001', judgment: 'PASS' },
      { id: 5, name: '垂直度 / F1', nominal: '0.000', lowerTol: '—', upperTol: '0.015', measured: null, uncertainty: '', judgment: null },
    ],
  },
  {
    id: 3, name: 'F3 - 4× M8 螺孔位置度',
    chars: [
      { id: 6, name: '位置度 TP Ø0.2', nominal: '0.000', lowerTol: '—', upperTol: '0.200', measured: '0.143', uncertainty: '±0.005', judgment: 'PASS' },
    ],
  },
])

const activeChars = computed(() => features.value.find(f => f.id === activeFeature.value)?.chars || [])

const summary = ref([
  { label: '总 Characteristics', val: '6', cls: '' },
  { label: 'PASS', val: '4', cls: 'text-ok' },
  { label: 'FAIL', val: '1', cls: 'text-err' },
  { label: '待测', val: '1', cls: 'text-gray' },
])
</script>
<style scoped>
.ws-page { display: flex; flex-direction: column; height: 100%; overflow: hidden; background: #F5F7FA; }
.ws-header { background: #fff; border-bottom: 1px solid #D9DEE7; padding: 10px 24px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
.ws-header-left { display: flex; align-items: center; gap: 12px; }
.ws-title-group { display: flex; flex-direction: column; gap: 3px; }
.ws-title { font-size: 16px; font-weight: 600; color: #0B1220; }
.ws-id { font-family: monospace; font-weight: 400; color: #526075; font-size: 13px; margin-left: 6px; }
.ws-meta { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #526075; }
.ws-meta-item { display: flex; align-items: center; gap: 3px; }
.ws-meta-sep { color: #D9DEE7; }
.ws-status { font-size: 11px; padding: 2px 6px; border-radius: 3px; }
.ws-status.pending { background: #EDF4FF; color: #1677FF; }
.ws-header-right { display: flex; gap: 8px; }
.ws-body { display: flex; flex: 1; overflow: hidden; }
.ws-context { width: 220px; background: #fff; border-right: 1px solid #D9DEE7; padding: 16px; overflow-y: auto; flex-shrink: 0; }
.ctx-title { font-size: 12px; font-weight: 600; color: #0B1220; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
.ctx-section { margin-bottom: 10px; border-bottom: 1px solid #F5F7FA; padding-bottom: 8px; }
.ctx-label { font-size: 11px; color: #8A96A6; margin-bottom: 3px; }
.ctx-val { font-size: 13px; color: #0B1220; line-height: 1.5; }
.ctx-val.bold { font-weight: 600; }
.ctx-val.small { font-size: 11px; color: #526075; }
.ws-main { flex: 1; overflow-y: auto; padding: 16px 24px; display: flex; flex-direction: column; gap: 12px; }
.section-block { background: #fff; border: 1px solid #D9DEE7; border-radius: 6px; padding: 16px; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.section-title { font-size: 13px; font-weight: 600; color: #0B1220; border-left: 3px solid #1677FF; padding-left: 8px; }
.pfc-layout { display: flex; gap: 12px; }
.pfc-tree { width: 180px; flex-shrink: 0; display: flex; flex-direction: column; gap: 4px; }
.pfc-feature { padding: 8px 10px; border: 1px solid #D9DEE7; border-radius: 4px; cursor: pointer; }
.pfc-feature.active { border-color: #1677FF; background: #EDF4FF; }
.pfc-feat-name { font-size: 12px; font-weight: 500; color: #0B1220; }
.pfc-feat-count { font-size: 11px; color: #8A96A6; margin-top: 2px; }
.pfc-table { flex: 1; overflow-x: auto; }
.judgment-tag { font-size: 11px; padding: 2px 6px; border-radius: 3px; font-weight: 600; }
.judgment-tag.pass { background: #F0FFF4; color: #18794E; }
.judgment-tag.fail { background: #FFF1F0; color: #C32F3F; }
.judgment-na { color: #B0B9C6; }
.input-fail :deep(.el-input__inner) { border-color: #C32F3F; color: #C32F3F; }
.meas-summary { display: flex; gap: 12px; }
.ms-card { background: #fff; border: 1px solid #D9DEE7; border-radius: 6px; padding: 14px 20px; text-align: center; min-width: 100px; }
.ms-val { font-size: 24px; font-weight: 700; color: #0B1220; margin-bottom: 4px; }
.ms-val.text-ok { color: #18794E; }
.ms-val.text-err { color: #C32F3F; }
.ms-val.text-gray { color: #8A96A6; }
.ms-label { font-size: 12px; color: #526075; }
.detail-cards { display: flex; gap: 12px; }
.detail-card { flex: 1; background: #fff; border: 1px solid #D9DEE7; border-radius: 6px; padding: 14px; }
.dc-title { font-size: 13px; font-weight: 600; color: #0B1220; margin-bottom: 10px; border-left: 3px solid #1677FF; padding-left: 8px; }
.dc-kv { display: flex; align-items: flex-start; gap: 0; margin-bottom: 6px; }
.dk { width: 90px; font-size: 12px; color: #8A96A6; flex-shrink: 0; }
.dv { font-size: 12px; color: #0B1220; }
.dv.mono { font-family: monospace; font-size: 11px; }
.ok-text { color: #18794E; }
.warn-text { color: #A9650A; }
</style>
