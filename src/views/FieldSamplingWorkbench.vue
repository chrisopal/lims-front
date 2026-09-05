<template>
  <div class="fsw-shell">
    <!-- Header -->
    <div class="fsw-header">
      <div class="fsh-left">
        <div class="fsh-breadcrumb">
          <span class="fsh-bc-link" @click="$router.push('/app/workbench/my-work')">我的工作</span>
          <el-icon size="10" color="#B0B9C6"><ArrowRight /></el-icon>
          <span>现场采样工作台</span>
        </div>
        <div class="fsh-title">现场采样 · REQ-20260905-004</div>
        <div class="fsh-meta">
          <span class="fsh-meta-scene">第三方食品理化检测 v1.2.0</span>
          <span class="fsh-sep">·</span>
          <span class="fsh-meta-node">FIELD_SAMPLING</span>
          <span class="fsh-sep">·</span>
          <span class="fsh-meta-assignee">张采样员</span>
          <span class="fsh-sep">·</span>
          <el-icon size="11" color="#C32F3F"><AlarmClock /></el-icon>
          <span class="fsh-meta-due urgent">截止 2026-09-06 17:00</span>
        </div>
      </div>
      <div class="fsh-right">
        <div class="fsh-status">
          <span class="status-dot in-progress"></span>
          <span class="status-text">进行中</span>
        </div>
        <el-button size="small">保存</el-button>
        <el-button type="primary" size="small" @click="completeDialogVisible = true">
          完成现场采样
        </el-button>
      </div>
    </div>

    <!-- Body: left context + main -->
    <div class="fsw-body">
      <!-- Left context panel -->
      <div class="fsw-context">
        <div class="ctx-section">
          <div class="ctx-section-title">委托信息</div>
          <div class="ctx-kv"><span class="ctx-k">委托号</span><span class="ctx-v mono">REQ-20260905-004</span></div>
          <div class="ctx-kv"><span class="ctx-k">委托方</span><span class="ctx-v">上海食品协会</span></div>
          <div class="ctx-kv"><span class="ctx-k">检测目的</span><span class="ctx-v">合规检测</span></div>
          <div class="ctx-kv"><span class="ctx-k">样品数量</span><span class="ctx-v">3 件</span></div>
        </div>
        <div class="ctx-divider"></div>
        <div class="ctx-section">
          <div class="ctx-section-title">采样点位</div>
          <div v-for="pt in samplingPoints" :key="pt.id" :class="['ctx-point-row', { active: activePoint === pt.id }]" @click="activePoint = pt.id">
            <div class="cpr-dot" :class="pt.status"></div>
            <div class="cpr-body">
              <div class="cpr-name">{{ pt.name }}</div>
              <div class="cpr-desc">{{ pt.desc }}</div>
            </div>
            <el-icon v-if="pt.status === 'done'" size="10" color="#18794E"><CircleCheck /></el-icon>
          </div>
        </div>
        <div class="ctx-divider"></div>
        <div class="ctx-section">
          <div class="ctx-section-title">节点信息</div>
          <div class="ctx-kv"><span class="ctx-k">节点</span><span class="ctx-v mono">FIELD_SAMPLING</span></div>
          <div class="ctx-kv"><span class="ctx-k">执行模式</span><span class="ctx-v"><span class="mode-badge HUMAN_TASK">HUMAN_TASK</span></span></div>
          <div class="ctx-kv"><span class="ctx-k">Renderer</span><span class="ctx-v mono small">FieldSamplingRenderer</span></div>
          <div class="ctx-kv"><span class="ctx-k">SLA</span><span class="ctx-v urgent">8h (超时预警)</span></div>
        </div>
        <div class="ctx-divider"></div>
        <div class="ctx-section">
          <div class="ctx-section-title">完成进度</div>
          <div class="ctx-progress-label">{{ completedSections }}/5 节 完成</div>
          <div class="ctx-progress-bar"><div class="ctx-progress-fill" :style="`width:${completedSections/5*100}%`"></div></div>
          <div v-for="sec in sections" :key="sec.key" class="ctx-sec-row">
            <el-icon size="10" :color="sec.done ? '#18794E' : '#D9DEE7'"><component :is="sec.done ? 'CircleCheck' : 'CirclePlus'" /></el-icon>
            <span :class="['ctx-sec-name', { done: sec.done }]">{{ sec.label }}</span>
          </div>
        </div>
      </div>

      <!-- Main workbench area -->
      <div class="fsw-main">
        <!-- Section A: 现场环境 -->
        <div class="wb-section" :class="{ completed: sections[0].done }">
          <div class="wbs-header" @click="toggleSection(0)">
            <div class="wbs-indicator">
              <el-icon v-if="sections[0].done" size="12" color="#18794E"><CircleCheck /></el-icon>
              <span v-else class="wbs-letter">A</span>
            </div>
            <div class="wbs-title">现场环境记录</div>
            <div class="wbs-meta" v-if="sections[0].done">已完成</div>
            <el-icon size="12" color="#8A96A6" style="margin-left:auto"><component :is="openSections.includes(0) ? 'ArrowUp' : 'ArrowDown'" /></el-icon>
          </div>
          <div class="wbs-body" v-if="openSections.includes(0)">
            <el-form label-position="top" size="small" inline>
              <el-form-item label="采样日期" required>
                <el-date-picker type="date" style="width:160px" value="2026-09-05" />
              </el-form-item>
              <el-form-item label="采样开始时间" required>
                <el-time-picker style="width:130px" value="09:30:00" />
              </el-form-item>
              <el-form-item label="采样结束时间">
                <el-time-picker style="width:130px" />
              </el-form-item>
              <el-form-item label="环境温度 (°C)" required>
                <el-input-number :min="-30" :max="60" :precision="1" style="width:110px" value="24.5" />
              </el-form-item>
              <el-form-item label="相对湿度 (%)">
                <el-input-number :min="0" :max="100" :precision="0" style="width:110px" value="68" />
              </el-form-item>
              <el-form-item label="天气状况">
                <el-select style="width:120px" value="sunny">
                  <el-option label="晴" value="sunny" />
                  <el-option label="多云" value="cloudy" />
                  <el-option label="阴" value="overcast" />
                  <el-option label="雨" value="rainy" />
                </el-select>
              </el-form-item>
              <el-form-item label="现场异常" class="full-width-item">
                <el-input type="textarea" :rows="2" placeholder="无异常 / 描述现场异常情况" style="width:480px" />
              </el-form-item>
            </el-form>
            <div class="wbs-actions">
              <el-button size="small" type="primary" @click="markDone(0)">标记完成</el-button>
            </div>
          </div>
        </div>

        <!-- Section B: 采样记录 -->
        <div class="wb-section" :class="{ completed: sections[1].done }">
          <div class="wbs-header" @click="toggleSection(1)">
            <div class="wbs-indicator">
              <el-icon v-if="sections[1].done" size="12" color="#18794E"><CircleCheck /></el-icon>
              <span v-else class="wbs-letter">B</span>
            </div>
            <div class="wbs-title">采样记录</div>
            <div class="wbs-meta">{{ samplingRecords.length }} 件样品</div>
            <el-icon size="12" color="#8A96A6" style="margin-left:auto"><component :is="openSections.includes(1) ? 'ArrowUp' : 'ArrowDown'" /></el-icon>
          </div>
          <div class="wbs-body" v-if="openSections.includes(1)">
            <el-table :data="samplingRecords" border size="small">
              <el-table-column label="样品编号" width="120">
                <template #default="{ row }">
                  <span class="sample-id">{{ row.id }}</span>
                </template>
              </el-table-column>
              <el-table-column label="样品名称" min-width="130">
                <template #default="{ row }">
                  <el-input v-model="row.name" size="small" />
                </template>
              </el-table-column>
              <el-table-column label="采样点位" width="120" prop="point" />
              <el-table-column label="采样方式" width="120">
                <template #default="{ row }">
                  <el-select v-model="row.method" size="small" style="width:100%">
                    <el-option label="随机抽取" value="random" />
                    <el-option label="四分法" value="quarter" />
                    <el-option label="混合采样" value="mixed" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="数量/重量" width="130">
                <template #default="{ row }">
                  <el-input v-model="row.quantity" size="small" placeholder="如：500g" />
                </template>
              </el-table-column>
              <el-table-column label="容器类型" width="120">
                <template #default="{ row }">
                  <el-select v-model="row.container" size="small" style="width:100%">
                    <el-option label="PE 密封袋" value="pe" />
                    <el-option label="玻璃瓶" value="glass" />
                    <el-option label="聚乙烯瓶" value="bottle" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="保存条件" width="120">
                <template #default="{ row }">
                  <el-select v-model="row.storage" size="small" style="width:100%">
                    <el-option label="常温" value="ambient" />
                    <el-option label="冷藏 4°C" value="cold" />
                    <el-option label="冷冻 -20°C" value="frozen" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="采样人" width="100">
                <template #default="{ row }">
                  <el-input v-model="row.sampler" size="small" />
                </template>
              </el-table-column>
            </el-table>
            <div class="wbs-actions">
              <el-button size="small" @click="addRecord">+ 添加样品行</el-button>
              <el-button size="small" type="primary" @click="markDone(1)">标记完成</el-button>
            </div>
          </div>
        </div>

        <!-- Section C: 现场仪器读数 -->
        <div class="wb-section" :class="{ completed: sections[2].done }">
          <div class="wbs-header" @click="toggleSection(2)">
            <div class="wbs-indicator">
              <el-icon v-if="sections[2].done" size="12" color="#18794E"><CircleCheck /></el-icon>
              <span v-else class="wbs-letter">C</span>
            </div>
            <div class="wbs-title">现场仪器读数</div>
            <div class="wbs-meta">快速检测仪器记录</div>
            <el-icon size="12" color="#8A96A6" style="margin-left:auto"><component :is="openSections.includes(2) ? 'ArrowUp' : 'ArrowDown'" /></el-icon>
          </div>
          <div class="wbs-body" v-if="openSections.includes(2)">
            <el-table :data="instruments" border size="small">
              <el-table-column label="仪器名称" min-width="140" prop="name" />
              <el-table-column label="仪器编号" width="120">
                <template #default="{ row }">
                  <span class="mono-sm">{{ row.equipId }}</span>
                </template>
              </el-table-column>
              <el-table-column label="参数" width="120" prop="param" />
              <el-table-column label="读数值" width="110">
                <template #default="{ row }">
                  <el-input v-model="row.reading" size="small" />
                </template>
              </el-table-column>
              <el-table-column label="单位" width="80" prop="unit" />
              <el-table-column label="校准状态" width="110">
                <template #default="{ row }">
                  <span :class="['calib-status', row.calibrated ? 'ok' : 'warn']">
                    <el-icon size="10"><component :is="row.calibrated ? 'CircleCheck' : 'Warning'" /></el-icon>
                    {{ row.calibrated ? '已校准' : '待校准' }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="备注" min-width="120">
                <template #default="{ row }">
                  <el-input v-model="row.note" size="small" placeholder="可选" />
                </template>
              </el-table-column>
            </el-table>
            <div class="wbs-actions">
              <el-button size="small" type="primary" @click="markDone(2)">标记完成</el-button>
            </div>
          </div>
        </div>

        <!-- Section D: 照片附件 -->
        <div class="wb-section" :class="{ completed: sections[3].done }">
          <div class="wbs-header" @click="toggleSection(3)">
            <div class="wbs-indicator">
              <el-icon v-if="sections[3].done" size="12" color="#18794E"><CircleCheck /></el-icon>
              <span v-else class="wbs-letter">D</span>
            </div>
            <div class="wbs-title">照片附件</div>
            <div class="wbs-meta">{{ photos.length }} 张已上传</div>
            <el-icon size="12" color="#8A96A6" style="margin-left:auto"><component :is="openSections.includes(3) ? 'ArrowUp' : 'ArrowDown'" /></el-icon>
          </div>
          <div class="wbs-body" v-if="openSections.includes(3)">
            <div class="photo-grid">
              <div v-for="p in photos" :key="p.id" class="photo-item">
                <div class="photo-thumb">
                  <el-icon size="22" color="#D9DEE7"><Picture /></el-icon>
                </div>
                <div class="photo-label">{{ p.label }}</div>
                <div class="photo-time">{{ p.time }}</div>
              </div>
              <div class="photo-add" @click="addPhoto">
                <el-icon size="20" color="#B0B9C6"><Plus /></el-icon>
                <span>添加照片</span>
              </div>
            </div>
            <div class="photo-types">
              <div class="pt-label">建议拍摄：</div>
              <span class="pt-req">采样现场全景</span>
              <span class="pt-req">样品标签特写</span>
              <span class="pt-req">采样操作过程</span>
              <span class="pt-opt">封存前样品状态</span>
              <span class="pt-opt">现场环境</span>
            </div>
            <div class="wbs-actions">
              <el-button size="small" type="primary" @click="markDone(3)">标记完成</el-button>
            </div>
          </div>
        </div>

        <!-- Section E: Chain of Custody -->
        <div class="wb-section" :class="{ completed: sections[4].done }">
          <div class="wbs-header" @click="toggleSection(4)">
            <div class="wbs-indicator">
              <el-icon v-if="sections[4].done" size="12" color="#18794E"><CircleCheck /></el-icon>
              <span v-else class="wbs-letter">E</span>
            </div>
            <div class="wbs-title">监管链 · Chain of Custody</div>
            <div class="wbs-meta">样品流转记录</div>
            <el-icon size="12" color="#8A96A6" style="margin-left:auto"><component :is="openSections.includes(4) ? 'ArrowUp' : 'ArrowDown'" /></el-icon>
          </div>
          <div class="wbs-body" v-if="openSections.includes(4)">
            <div class="coc-table">
              <div class="coc-header-row">
                <span class="coc-col stage">阶段</span>
                <span class="coc-col person">经手人</span>
                <span class="coc-col time">时间</span>
                <span class="coc-col sign">签名</span>
                <span class="coc-col seal">封条号</span>
              </div>
              <div v-for="coc in cocRecords" :key="coc.id" class="coc-data-row">
                <span class="coc-col stage">{{ coc.stage }}</span>
                <span class="coc-col person">{{ coc.person }}</span>
                <span class="coc-col time"><el-input v-model="coc.time" size="small" /></span>
                <span class="coc-col sign">
                  <div class="sign-box" v-if="!coc.signed" @click="coc.signed = true">点击签名</div>
                  <div class="sign-box signed" v-else>
                    <el-icon size="10" color="#18794E"><Check /></el-icon>
                    {{ coc.person }}
                  </div>
                </span>
                <span class="coc-col seal"><el-input v-model="coc.seal" size="small" placeholder="封条号" /></span>
              </div>
            </div>
            <div class="wbs-actions">
              <el-button size="small" type="primary" @click="markDone(4)">标记完成</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Complete dialog -->
    <el-dialog v-model="completeDialogVisible" title="完成现场采样" width="480px">
      <div class="complete-checklist">
        <div class="ccl-intro">提交前请确认以下事项已完成：</div>
        <div v-for="item in completionChecks" :key="item.id" class="ccl-row">
          <el-checkbox v-model="item.checked">{{ item.label }}</el-checkbox>
          <span v-if="item.required && !item.checked" class="ccl-required">必填</span>
        </div>
      </div>
      <div v-if="!allChecked" class="ccl-warn">
        <el-icon size="13" color="#A9650A"><Warning /></el-icon>
        仍有必填项未确认，请完成所有必填项后再提交。
      </div>
      <template #footer>
        <el-button @click="completeDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!allChecked" @click="completeDialogVisible = false; $router.push('/app/workbench/my-work')">
          确认完成，移交样品
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'

const completeDialogVisible = ref(false)
const activePoint = ref(1)
const openSections = ref([0, 1])

const sections = ref([
  { key: 'env', label: '现场环境', done: false },
  { key: 'sample', label: '采样记录', done: false },
  { key: 'instrument', label: '仪器读数', done: false },
  { key: 'photo', label: '照片附件', done: false },
  { key: 'coc', label: '监管链', done: false },
])

const completedSections = computed(() => sections.value.filter(s => s.done).length)

function toggleSection(idx: number) {
  const i = openSections.value.indexOf(idx)
  if (i >= 0) openSections.value.splice(i, 1)
  else openSections.value.push(idx)
}

function markDone(idx: number) {
  sections.value[idx].done = true
}

const samplingPoints = ref([
  { id: 1, name: '点位 SP-001', desc: '食品货架 A 区', status: 'done' },
  { id: 2, name: '点位 SP-002', desc: '食品仓储 B 区', status: 'active' },
  { id: 3, name: '点位 SP-003', desc: '生产线末端', status: 'pending' },
])

const samplingRecords = ref([
  { id: 'FS-001', name: '大米样品A', point: 'SP-001', method: 'quarter', quantity: '500g', container: 'pe', storage: 'ambient', sampler: '张采样员' },
  { id: 'FS-002', name: '鱼肉样品B', point: 'SP-002', method: 'random', quantity: '300g', container: 'pe', storage: 'cold', sampler: '张采样员' },
  { id: 'FS-003', name: '蔬菜样品C', point: 'SP-003', method: 'mixed', quantity: '400g', container: 'pe', storage: 'cold', sampler: '张采样员' },
])

function addRecord() {
  const n = samplingRecords.value.length + 1
  samplingRecords.value.push({ id: `FS-00${n}`, name: '', point: '', method: 'random', quantity: '', container: 'pe', storage: 'ambient', sampler: '张采样员' })
}

const instruments = ref([
  { name: 'pH 计', equipId: 'EQ-PH-003', param: 'pH 值', reading: '7.2', unit: 'pH', calibrated: true, note: '' },
  { name: '电导率仪', equipId: 'EQ-COND-001', param: '电导率', reading: '452', unit: 'μS/cm', calibrated: true, note: '' },
  { name: '溶解氧仪', equipId: 'EQ-DO-002', param: '溶解氧', reading: '', unit: 'mg/L', calibrated: false, note: '待校准后使用' },
])

const photos = ref([
  { id: 1, label: '采样现场全景', time: '09:32' },
  { id: 2, label: '样品标签特写', time: '09:45' },
  { id: 3, label: '采样操作过程', time: '10:02' },
])

function addPhoto() {
  photos.value.push({ id: Date.now(), label: '新照片', time: '--:--' })
}

const cocRecords = ref([
  { id: 1, stage: '现场采集', person: '张采样员', time: '2026-09-05 09:30', signed: true, seal: 'SEAL-001' },
  { id: 2, stage: '样品交接', person: '李收样员', time: '', signed: false, seal: '' },
  { id: 3, stage: '实验室接收', person: '—', time: '', signed: false, seal: '' },
])

const completionChecks = ref([
  { id: 1, label: '现场环境记录已填写完整', required: true, checked: false },
  { id: 2, label: '所有样品已登记采样记录', required: true, checked: false },
  { id: 3, label: '样品已贴标签并编号', required: true, checked: false },
  { id: 4, label: '现场照片已上传（至少 3 张）', required: true, checked: false },
  { id: 5, label: '采样人已在监管链上签名', required: true, checked: false },
  { id: 6, label: '样品已妥善封存', required: false, checked: false },
  { id: 7, label: '样品已按要求冷藏/冷冻', required: false, checked: false },
])

const allChecked = computed(() => completionChecks.value.filter(c => c.required).every(c => c.checked))
</script>
<style scoped>
.fsw-shell { display: flex; flex-direction: column; height: 100%; overflow: hidden; background: #F5F7FA; }

/* Header */
.fsw-header { background: #fff; border-bottom: 1px solid #D9DEE7; padding: 12px 20px; display: flex; align-items: flex-start; justify-content: space-between; flex-shrink: 0; }
.fsh-left {}
.fsh-breadcrumb { font-size: 12px; color: #8A96A6; display: flex; align-items: center; gap: 4px; margin-bottom: 4px; }
.fsh-bc-link { cursor: pointer; color: #1677FF; }
.fsh-bc-link:hover { text-decoration: underline; }
.fsh-title { font-size: 16px; font-weight: 600; color: #0B1220; margin-bottom: 4px; }
.fsh-meta { display: flex; align-items: center; gap: 6px; font-size: 12px; flex-wrap: wrap; }
.fsh-meta-scene { color: #526075; }
.fsh-sep { color: #D9DEE7; }
.fsh-meta-node { font-family: monospace; font-size: 11px; color: #8A96A6; background: #F5F7FA; padding: 1px 5px; border-radius: 2px; }
.fsh-meta-assignee { color: #526075; }
.fsh-meta-due { font-size: 12px; }
.fsh-meta-due.urgent { color: #C32F3F; }
.fsh-right { display: flex; align-items: center; gap: 8px; }
.fsh-status { display: flex; align-items: center; gap: 6px; padding: 4px 10px; border: 1px solid #D9DEE7; border-radius: 4px; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; }
.status-dot.in-progress { background: #1677FF; }
.status-text { font-size: 12px; color: #526075; }

/* Body layout */
.fsw-body { display: flex; flex: 1; overflow: hidden; }

/* Context panel */
.fsw-context { width: 220px; background: #fff; border-right: 1px solid #D9DEE7; overflow-y: auto; flex-shrink: 0; }
.ctx-section { padding: 14px 14px 10px; }
.ctx-section-title { font-size: 10px; font-weight: 600; color: #B0B9C6; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
.ctx-kv { display: flex; align-items: flex-start; gap: 0; margin-bottom: 5px; }
.ctx-k { width: 70px; font-size: 12px; color: #8A96A6; flex-shrink: 0; }
.ctx-v { font-size: 12px; color: #0B1220; }
.ctx-v.mono { font-family: monospace; font-size: 11px; }
.ctx-v.small { font-size: 10px; font-family: monospace; }
.ctx-v.urgent { color: #C32F3F; }
.ctx-divider { height: 1px; background: #E7EAF0; margin: 0; }
.ctx-point-row { display: flex; align-items: flex-start; gap: 8px; padding: 7px 0; cursor: pointer; border-radius: 4px; }
.ctx-point-row:hover { background: #F5F7FA; }
.ctx-point-row.active { background: #EDF4FF; }
.cpr-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 3px; flex-shrink: 0; }
.cpr-dot.done { background: #18794E; }
.cpr-dot.active { background: #1677FF; }
.cpr-dot.pending { background: #D9DEE7; }
.cpr-body { flex: 1; }
.cpr-name { font-size: 12px; font-weight: 500; color: #0B1220; }
.cpr-desc { font-size: 11px; color: #8A96A6; }
.mode-badge { font-size: 10px; padding: 1px 5px; border-radius: 2px; }
.mode-badge.HUMAN_TASK { background: #EDF4FF; color: #1677FF; }
.ctx-progress-label { font-size: 12px; color: #0B1220; font-weight: 500; margin-bottom: 6px; }
.ctx-progress-bar { height: 4px; background: #E7EAF0; border-radius: 2px; margin-bottom: 10px; }
.ctx-progress-fill { height: 100%; background: #1677FF; border-radius: 2px; transition: width 0.3s; }
.ctx-sec-row { display: flex; align-items: center; gap: 6px; padding: 4px 0; }
.ctx-sec-name { font-size: 12px; color: #526075; }
.ctx-sec-name.done { color: #18794E; }

/* Main area */
.fsw-main { flex: 1; overflow-y: auto; padding: 12px 16px; display: flex; flex-direction: column; gap: 8px; }

/* Sections */
.wb-section { background: #fff; border: 1px solid #D9DEE7; border-radius: 4px; overflow: hidden; }
.wb-section.completed { border-left: 3px solid #18794E; }
.wbs-header { display: flex; align-items: center; gap: 10px; padding: 12px 14px; cursor: pointer; user-select: none; }
.wbs-header:hover { background: #FAFBFC; }
.wbs-indicator { width: 22px; height: 22px; border-radius: 50%; border: 1.5px solid #D9DEE7; display: flex; align-items: center; justify-content: center; background: #fff; flex-shrink: 0; }
.wb-section.completed .wbs-indicator { border-color: #18794E; background: #F0FFF4; }
.wbs-letter { font-size: 11px; font-weight: 700; color: #8A96A6; }
.wbs-title { font-size: 14px; font-weight: 600; color: #0B1220; }
.wbs-meta { font-size: 12px; color: #8A96A6; }
.wbs-body { padding: 14px 14px 10px; border-top: 1px solid #E7EAF0; }
.wbs-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 10px; }

/* Misc */
.sample-id { font-family: monospace; font-size: 11px; color: #1677FF; }
.mono-sm { font-family: monospace; font-size: 11px; color: #526075; }
.calib-status { font-size: 11px; display: flex; align-items: center; gap: 3px; }
.calib-status.ok { color: #18794E; }
.calib-status.warn { color: #A9650A; }

/* Photos */
.photo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 8px; margin-bottom: 12px; }
.photo-item { border: 1px solid #D9DEE7; border-radius: 4px; overflow: hidden; }
.photo-thumb { height: 70px; background: #F5F7FA; display: flex; align-items: center; justify-content: center; }
.photo-label { font-size: 11px; color: #526075; padding: 4px 6px; }
.photo-time { font-size: 10px; color: #B0B9C6; padding: 0 6px 4px; }
.photo-add { border: 1.5px dashed #D9DEE7; border-radius: 4px; height: 100px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; cursor: pointer; font-size: 11px; color: #8A96A6; }
.photo-add:hover { border-color: #1677FF; color: #1677FF; }
.photo-types { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.pt-label { font-size: 11px; color: #B0B9C6; }
.pt-req { font-size: 11px; background: #FFF3E0; color: #A9650A; padding: 2px 6px; border-radius: 2px; }
.pt-opt { font-size: 11px; background: #F5F7FA; color: #8A96A6; padding: 2px 6px; border-radius: 2px; }

/* CoC */
.coc-table { border: 1px solid #D9DEE7; border-radius: 4px; overflow: hidden; }
.coc-header-row, .coc-data-row { display: flex; align-items: center; }
.coc-header-row { background: #F5F7FA; padding: 7px 12px; border-bottom: 1px solid #D9DEE7; }
.coc-data-row { padding: 8px 12px; border-bottom: 1px solid #F5F7FA; }
.coc-data-row:last-child { border-bottom: none; }
.coc-col { font-size: 12px; }
.coc-col.stage { width: 120px; flex-shrink: 0; font-weight: 500; color: #0B1220; }
.coc-header-row .coc-col.stage { color: #8A96A6; font-size: 11px; font-weight: 400; }
.coc-col.person { width: 100px; flex-shrink: 0; color: #526075; }
.coc-header-row .coc-col.person { color: #8A96A6; font-size: 11px; }
.coc-col.time { width: 160px; flex-shrink: 0; }
.coc-col.sign { width: 120px; flex-shrink: 0; }
.coc-col.seal { flex: 1; }
.coc-header-row .coc-col.time, .coc-header-row .coc-col.sign, .coc-header-row .coc-col.seal { color: #8A96A6; font-size: 11px; }
.sign-box { border: 1.5px dashed #D9DEE7; border-radius: 3px; padding: 5px 10px; font-size: 12px; color: #B0B9C6; cursor: pointer; text-align: center; width: fit-content; }
.sign-box:hover { border-color: #1677FF; color: #1677FF; }
.sign-box.signed { border: 1.5px solid #B7E6CB; background: #F0FFF4; color: #18794E; cursor: default; display: flex; align-items: center; gap: 4px; }

/* Completion dialog */
.complete-checklist { display: flex; flex-direction: column; gap: 8px; }
.ccl-intro { font-size: 13px; color: #526075; margin-bottom: 8px; }
.ccl-row { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid #F5F7FA; }
.ccl-required { font-size: 11px; color: #C32F3F; background: #FFF1F0; padding: 1px 5px; border-radius: 2px; margin-left: auto; }
.ccl-warn { display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: #FFF8E1; border: 1px solid #FFE58F; border-radius: 4px; font-size: 12px; color: #A9650A; margin-top: 14px; }
</style>
