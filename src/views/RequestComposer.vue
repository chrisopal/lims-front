<template>
  <div class="composer-shell">
    <!-- Step 0: Scene selection -->
    <div v-if="step === 0" class="scene-select-page">
      <div class="ssp-header">
        <div class="ssp-title">新建检测委托</div>
        <div class="ssp-sub">第一步：选择已发布场景 · 场景版本决定后续表单和流程</div>
      </div>
      <div class="scene-filter">
        <el-input placeholder="搜索场景名称 / Key" style="width:240px" size="small" clearable prefix-icon="Search" />
        <el-select placeholder="领域" clearable size="small" style="width:120px">
          <el-option label="食品检测" value="food" />
          <el-option label="环境检测" value="env" />
          <el-option label="几何量" value="metrology" />
        </el-select>
        <el-select placeholder="实验室" clearable size="small" style="width:160px">
          <el-option label="上海食品检测实验室" value="sh" />
          <el-option label="深圳综合检测实验室" value="sz" />
        </el-select>
      </div>
      <div class="scene-cards">
        <div
          v-for="sc in publishedScenes"
          :key="sc.id"
          :class="['scene-card', { selected: selectedScene?.id === sc.id }]"
          @click="selectedScene = sc"
        >
          <div class="scard-head">
            <div class="scard-check"><div :class="['sc-radio', { on: selectedScene?.id === sc.id }]"></div></div>
            <div class="scard-name">{{ sc.name }}</div>
            <span class="scard-ver">{{ sc.version }}</span>
          </div>
          <div class="scard-key">{{ sc.key }}</div>
          <div class="scard-tags">
            <span class="scard-tag mode">{{ sc.mode }}</span>
            <span class="scard-tag domain">{{ sc.domain }}</span>
            <span class="scard-tag lab">{{ sc.lab }}</span>
          </div>
          <div class="scard-meta">
            <span>{{ sc.itemCount }} 检测项</span>
            <span>{{ sc.nodeCount }} 流程节点</span>
          </div>
          <div class="scard-steps">
            <div class="scard-steps-label">向导步骤</div>
            <div class="scard-step-list">
              <span v-for="(s, i) in sc.steps" :key="i" class="scard-step-item">{{ i+1 }}. {{ s }}</span>
            </div>
          </div>
          <div class="scard-hash">
            <el-icon size="10" color="#18794E"><Lock /></el-icon>
            sha256:{{ sc.hash }}
          </div>
        </div>
      </div>
      <div class="scene-select-actions">
        <el-button @click="$router.back()">取消</el-button>
        <el-button type="primary" :disabled="!selectedScene" @click="confirmScene">
          使用此场景，进入委托向导 <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- Steps 1+: Wizard driven by selected scene -->
    <template v-else>
      <!-- Fixed top context bar -->
      <div class="wizard-topbar">
        <div class="wtb-left">
          <div class="wtb-back" @click="step = 0">
            <el-icon size="13"><ArrowLeft /></el-icon>
          </div>
          <div class="wtb-scene-info">
            <span class="wtb-label">场景：</span>
            <span class="wtb-scene-name">{{ selectedScene?.name }}</span>
            <span class="wtb-ver">{{ selectedScene?.version }}</span>
            <span class="wtb-snap">
              <el-icon size="10" color="#18794E"><Lock /></el-icon>
              sha256:{{ selectedScene?.hash }}
            </span>
          </div>
        </div>
        <div class="wtb-actions">
          <el-button size="small">保存草稿</el-button>
          <el-button type="primary" size="small" :disabled="!canSubmit">提交委托</el-button>
        </div>
      </div>

      <!-- Steps progress -->
      <div class="wizard-stepper-row">
        <div
          v-for="(s, i) in currentSteps"
          :key="i"
          :class="['wiz-step', { active: step === i + 1, done: step > i + 1 }]"
          @click="step > i + 1 ? step = i+1 : null"
        >
          <div class="ws-circle">
            <el-icon v-if="step > i+1" size="11"><Check /></el-icon>
            <span v-else>{{ i+1 }}</span>
          </div>
          <span class="ws-label">{{ s }}</span>
          <div class="ws-connector" v-if="i < currentSteps.length - 1"></div>
        </div>
      </div>

      <!-- Wizard content -->
      <div class="wizard-body">
        <!-- Step 1: Basic info -->
        <template v-if="step === 1">
          <div class="wiz-step-header">
            <div class="wiz-step-title">委托基本信息</div>
            <div class="wiz-step-sub">由场景 <strong>{{ selectedScene?.name }}</strong> 的委托受理表单驱动</div>
          </div>
          <div class="wiz-form-wrap">
            <el-form label-position="top" size="small">
              <el-form-item label="委托方名称" required>
                <el-input placeholder="请输入委托方全称" />
              </el-form-item>
              <el-form-item label="委托方联系人">
                <el-input placeholder="姓名" />
              </el-form-item>
              <el-form-item label="委托方联系电话">
                <el-input placeholder="手机号" />
              </el-form-item>
              <el-form-item label="委托方地址">
                <el-input placeholder="地址" />
              </el-form-item>
              <el-form-item label="检测目的" required>
                <el-select placeholder="请选择" style="width:100%">
                  <el-option label="合规检测（监督备案）" value="compliance" />
                  <el-option label="出口认证" value="export" />
                  <el-option label="内部质控" value="internal" />
                  <el-option label="纠纷仲裁" value="dispute" />
                </el-select>
              </el-form-item>
              <el-form-item label="紧急程度">
                <el-radio-group value="normal">
                  <el-radio value="normal">正常</el-radio>
                  <el-radio value="urgent">加急</el-radio>
                  <el-radio value="very-urgent">特急</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="期望完成日期">
                <el-date-picker type="date" placeholder="选择日期" style="width:200px" />
              </el-form-item>
            </el-form>
          </div>
        </template>

        <!-- Step 2: Sample table (adapted per scene) -->
        <template v-else-if="step === 2">
          <div class="wiz-step-header">
            <div class="wiz-step-title">
              {{ selectedScene?.domain === '食品检测' ? '食品样品清单 · FOOD_SAMPLE' : selectedScene?.domain === '环境检测' ? '采样点位清单 · SAMPLING_POINT' : '检测对象清单' }}
            </div>
            <div class="wiz-step-sub">对象类型由场景配置驱动，字段来自场景绑定的动态表单</div>
            <el-button size="small" type="primary" style="margin-left:auto" @click="addSample">+ 添加样品</el-button>
          </div>
          <div class="sample-table-wrap">
            <el-table :data="samples" border size="small">
              <el-table-column label="#" width="40" type="index" />
              <el-table-column v-if="selectedScene?.domain === '食品检测'" label="样品名称" min-width="130">
                <template #default="{ row }">
                  <el-input v-model="row.name" size="small" placeholder="样品名称" />
                </template>
              </el-table-column>
              <el-table-column v-if="selectedScene?.domain === '食品检测'" label="食品类别" width="140">
                <template #default="{ row }">
                  <el-select v-model="row.category" size="small" style="width:100%">
                    <el-option label="粮食及制品" value="grain" />
                    <el-option label="肉及肉制品" value="meat" />
                    <el-option label="水产品" value="seafood" />
                    <el-option label="蔬菜" value="veg" />
                    <el-option label="饮料" value="drink" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column v-if="selectedScene?.domain === '环境检测'" label="点位编号" width="120">
                <template #default="{ row }">
                  <el-input v-model="row.pointId" size="small" />
                </template>
              </el-table-column>
              <el-table-column v-if="selectedScene?.domain === '环境检测'" label="点位类型" width="130">
                <template #default="{ row }">
                  <el-select v-model="row.pointType" size="small" style="width:100%">
                    <el-option label="地表水" value="surface" />
                    <el-option label="地下水" value="ground" />
                    <el-option label="废水排放口" value="discharge" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="数量" width="80">
                <template #default="{ row }">
                  <el-input-number v-model="row.qty" :min="1" size="small" style="width:70px" />
                </template>
              </el-table-column>
              <el-table-column label="备注" min-width="120">
                <template #default="{ row }">
                  <el-input v-model="row.note" size="small" placeholder="可选" />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="60">
                <template #default="{ $index }">
                  <el-button link size="small" type="danger" @click="samples.splice($index, 1)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </template>

        <!-- Step 3: Test items selection -->
        <template v-else-if="step === 3">
          <div class="wiz-step-header">
            <div class="wiz-step-title">检测项选择</div>
            <div class="wiz-step-sub">以下检测项来自场景 <strong>{{ selectedScene?.name }}</strong> 配置，含标准和限值均已锁定</div>
          </div>
          <div class="test-item-select-table">
            <el-table :data="sceneTestItems" border size="small">
              <el-table-column type="selection" width="44" />
              <el-table-column label="检测项" min-width="130">
                <template #default="{ row }">
                  <div class="ti-name">{{ row.name }}</div>
                  <div class="ti-en">{{ row.en }}</div>
                </template>
              </el-table-column>
              <el-table-column label="适用标准（快照锁定）" min-width="170">
                <template #default="{ row }">
                  <span class="ref-chip std">{{ row.standard }}</span>
                </template>
              </el-table-column>
              <el-table-column label="检测方法" min-width="150">
                <template #default="{ row }">
                  <span class="ref-chip method">{{ row.method }}</span>
                </template>
              </el-table-column>
              <el-table-column label="限值规则" width="150">
                <template #default="{ row }">
                  <span class="ref-chip limit">{{ row.limit }}</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </template>

        <!-- Step 4: Attachments -->
        <template v-else-if="step === 4">
          <div class="wiz-step-header">
            <div class="wiz-step-title">随附资料上传</div>
            <div class="wiz-step-sub">委托合同、样品来源证明、特殊要求说明等（可选）</div>
          </div>
          <div class="wiz-form-wrap">
            <el-upload drag multiple>
              <el-icon size="28" color="#B0B9C6"><UploadFilled /></el-icon>
              <div class="upload-text">拖拽文件至此，或<em>点击选择文件</em></div>
              <div class="upload-hint">支持 PDF、Word、Excel、图片；单文件 ≤ 50MB</div>
            </el-upload>
          </div>
        </template>

        <!-- Step 5: Confirm & Submit -->
        <template v-else-if="step === 5">
          <div class="wiz-step-header">
            <div class="wiz-step-title">确认委托信息</div>
            <div class="wiz-step-sub">提交后将创建委托，并按场景快照启动流程。</div>
          </div>
          <div class="confirm-section">
            <div class="confirm-snapshot">
              <el-icon size="12" color="#18794E"><Lock /></el-icon>
              快照将被锁定：<strong>{{ selectedScene?.name }} {{ selectedScene?.version }}</strong>
              · sha256:{{ selectedScene?.hash }}
            </div>
            <div class="confirm-block">
              <div class="cb-title">场景</div>
              <div class="cb-val">{{ selectedScene?.name }} · {{ selectedScene?.version }}</div>
            </div>
            <div class="confirm-block">
              <div class="cb-title">委托方</div>
              <div class="cb-val">—（已在步骤 1 填写）</div>
            </div>
            <div class="confirm-block">
              <div class="cb-title">样品数量</div>
              <div class="cb-val">{{ samples.length }} 件</div>
            </div>
            <div class="confirm-block">
              <div class="cb-title">检测项</div>
              <div class="cb-val">{{ sceneTestItems.length }} 项（按场景配置全选）</div>
            </div>
            <div class="submit-cta">
              <el-button @click="step--">上一步</el-button>
              <el-button type="primary" @click="canSubmit = true">提交委托</el-button>
            </div>
          </div>
        </template>

        <!-- Step navigation -->
        <div class="wiz-nav" v-if="step < currentSteps.length">
          <el-button @click="step > 1 ? step-- : step = 0">
            <el-icon><ArrowLeft /></el-icon> 上一步
          </el-button>
          <el-button type="primary" @click="step++">
            下一步 <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
      </div>
    </template>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'

const step = ref(0)
const selectedScene = ref<any>(null)
const canSubmit = ref(false)

const publishedScenes = ref([
  {
    id: 1, name: '第三方食品理化检测', key: 'third-party-food-physchem',
    version: 'v1.2.0', hash: '7fa3c2d', mode: '第三方委托', domain: '食品检测',
    lab: '上海食品检测实验室', itemCount: 18, nodeCount: 7,
    steps: ['委托信息', '食品样品', '检测项', '随附资料', '确认提交'],
  },
  {
    id: 2, name: '食品微生物检测', key: 'food-microbiology',
    version: 'v2.1.0', hash: 'a8b91ef', mode: '第三方委托', domain: '食品检测',
    lab: '上海食品检测实验室', itemCount: 12, nodeCount: 6,
    steps: ['委托信息', '食品样品', '检测项', '确认提交'],
  },
  {
    id: 3, name: '环境水质监测', key: 'env-water-quality',
    version: 'v1.0.0', hash: 'c3d45fe', mode: '政府委托', domain: '环境检测',
    lab: '深圳综合检测实验室', itemCount: 24, nodeCount: 9,
    steps: ['委托信息', '采样点位', '检测项', '现场采样计划', '确认提交'],
  },
  {
    id: 4, name: '工业零件几何量', key: 'industrial-part-metrology',
    version: 'v3.0.1', hash: 'e9f01ac', mode: '企业内部', domain: '几何量',
    lab: '北京计量实验室', itemCount: 8, nodeCount: 5,
    steps: ['委托信息', '零件清单', '检测项', '确认提交'],
  },
])

const currentSteps = computed(() => selectedScene.value?.steps || [])

const samples = ref([
  { name: '大米样品A', category: 'grain', qty: 1, note: '' },
  { name: '鱼肉样品B', category: 'seafood', qty: 2, note: '冷冻保存' },
])

function addSample() {
  samples.value.push({ name: '', category: '', qty: 1, note: '' })
}

const sceneTestItems = ref([
  { name: '铅', en: 'Lead Pb', standard: 'GB 5009.12-2023', method: 'ICP-MS Pb v2', limit: 'Food Pb Limit v3' },
  { name: '镉', en: 'Cadmium Cd', standard: 'GB 5009.15-2023', method: 'ICP-MS Cd v2', limit: 'Food Cd Limit v2' },
  { name: '总砷', en: 'Arsenic As', standard: 'GB 5009.11-2014', method: 'HG-AFS As v1', limit: 'Food As Limit v2' },
  { name: '汞', en: 'Mercury Hg', standard: 'GB 5009.17-2021', method: 'AFS Hg v2', limit: 'Food Hg Limit v1' },
  { name: '菌落总数', en: 'TPC', standard: 'GB 4789.2-2022', method: 'Plate Count v3', limit: 'TPC Limit v2' },
  { name: '苯甲酸', en: 'Benzoic Acid', standard: 'GB 5009.28-2016', method: 'HPLC BA v3', limit: 'Additive Limit v2' },
])

function confirmScene() {
  step.value = 1
}
</script>
<style scoped>
.composer-shell { display: flex; flex-direction: column; height: 100%; overflow: hidden; background: #F5F7FA; }

/* Scene select page */
.scene-select-page { flex: 1; overflow-y: auto; padding: 24px 32px; }
.ssp-header { margin-bottom: 20px; }
.ssp-title { font-size: 20px; font-weight: 600; color: #0B1220; }
.ssp-sub { font-size: 13px; color: #526075; margin-top: 4px; }
.scene-filter { display: flex; gap: 8px; margin-bottom: 16px; }
.scene-cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 24px; }
.scene-card { background: #fff; border: 2px solid #D9DEE7; border-radius: 6px; padding: 14px; cursor: pointer; }
.scene-card:hover { border-color: #91CAFF; }
.scene-card.selected { border-color: #1677FF; }
.scard-head { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
.sc-radio { width: 16px; height: 16px; border-radius: 50%; border: 2px solid #D9DEE7; flex-shrink: 0; }
.sc-radio.on { border-color: #1677FF; background: #1677FF; box-shadow: inset 0 0 0 3px #fff; }
.scard-name { font-size: 14px; font-weight: 600; color: #0B1220; flex: 1; }
.scard-ver { font-size: 10px; padding: 2px 6px; border-radius: 3px; background: #F0FFF4; color: #18794E; border: 1px solid #B7E6CB; font-weight: 600; }
.scard-key { font-size: 11px; font-family: monospace; color: #8A96A6; margin-bottom: 8px; margin-left: 26px; }
.scard-tags { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 8px; margin-left: 26px; }
.scard-tag { font-size: 10px; padding: 1px 6px; border-radius: 2px; }
.scard-tag.mode { background: #EDF4FF; color: #1677FF; }
.scard-tag.domain { background: #F0FFF4; color: #18794E; }
.scard-tag.lab { background: #F5F7FA; color: #526075; }
.scard-meta { display: flex; gap: 12px; font-size: 12px; color: #8A96A6; margin-bottom: 10px; margin-left: 26px; }
.scard-steps { margin-left: 26px; margin-bottom: 8px; }
.scard-steps-label { font-size: 10px; color: #B0B9C6; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
.scard-step-list { display: flex; flex-wrap: wrap; gap: 4px; }
.scard-step-item { font-size: 11px; color: #526075; background: #F5F7FA; padding: 2px 6px; border-radius: 2px; }
.scard-hash { font-size: 10px; font-family: monospace; color: #8A96A6; display: flex; align-items: center; gap: 4px; margin-left: 26px; }
.scene-select-actions { display: flex; justify-content: flex-end; gap: 8px; }

/* Wizard */
.wizard-topbar { background: #fff; border-bottom: 1px solid #D9DEE7; padding: 0 24px; height: 52px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
.wtb-left { display: flex; align-items: center; gap: 12px; }
.wtb-back { cursor: pointer; padding: 4px; color: #526075; display: flex; align-items: center; }
.wtb-back:hover { color: #1677FF; }
.wtb-scene-info { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.wtb-label { color: #8A96A6; font-size: 12px; }
.wtb-scene-name { font-weight: 600; color: #0B1220; }
.wtb-ver { font-size: 11px; padding: 1px 5px; background: #F0FFF4; color: #18794E; border-radius: 3px; font-weight: 600; }
.wtb-snap { font-size: 11px; font-family: monospace; color: #8A96A6; display: flex; align-items: center; gap: 3px; }
.wtb-actions { display: flex; gap: 8px; }

.wizard-stepper-row { background: #fff; border-bottom: 1px solid #D9DEE7; padding: 12px 32px; display: flex; align-items: center; flex-shrink: 0; }
.wiz-step { display: flex; align-items: center; gap: 8px; }
.ws-circle { width: 22px; height: 22px; border-radius: 50%; border: 1.5px solid #D9DEE7; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #8A96A6; background: #fff; flex-shrink: 0; }
.wiz-step.active .ws-circle { border-color: #1677FF; color: #1677FF; }
.wiz-step.done .ws-circle { background: #18794E; border-color: #18794E; color: #fff; }
.ws-label { font-size: 12px; color: #526075; white-space: nowrap; }
.wiz-step.active .ws-label { color: #1677FF; font-weight: 500; }
.ws-connector { width: 32px; height: 1px; background: #D9DEE7; margin: 0 6px; }
.wiz-step.done .ws-connector { background: #18794E; }

.wizard-body { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
.wiz-step-header { padding: 16px 32px 14px; background: #fff; border-bottom: 1px solid #D9DEE7; display: flex; align-items: flex-start; flex-wrap: wrap; gap: 4px; flex-shrink: 0; }
.wiz-step-title { font-size: 16px; font-weight: 600; color: #0B1220; }
.wiz-step-sub { font-size: 12px; color: #8A96A6; margin-top: 4px; width: 100%; }
.wiz-form-wrap { padding: 20px 32px; max-width: 560px; }
.sample-table-wrap { padding: 16px 32px; }
.test-item-select-table { padding: 16px 32px; }

.ref-chip { font-size: 10px; padding: 2px 6px; border-radius: 2px; font-family: monospace; }
.ref-chip.std { background: #EDF4FF; color: #1677FF; }
.ref-chip.method { background: #F0FFF4; color: #18794E; }
.ref-chip.limit { background: #FFF3E0; color: #A9650A; }
.ti-name { font-size: 13px; font-weight: 500; color: #0B1220; }
.ti-en { font-size: 11px; color: #8A96A6; font-family: monospace; }

.upload-text { font-size: 13px; color: #526075; margin-top: 8px; }
.upload-text em { color: #1677FF; font-style: normal; }
.upload-hint { font-size: 11px; color: #B0B9C6; margin-top: 4px; }

.confirm-section { padding: 20px 32px; max-width: 600px; }
.confirm-snapshot { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #18794E; background: #F0FFF4; border: 1px solid #B7E6CB; border-radius: 4px; padding: 10px 14px; margin-bottom: 20px; font-family: monospace; }
.confirm-block { margin-bottom: 14px; }
.cb-title { font-size: 11px; color: #B0B9C6; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
.cb-val { font-size: 13px; color: #0B1220; }
.submit-cta { display: flex; gap: 8px; margin-top: 24px; }

.wiz-nav { display: flex; justify-content: space-between; padding: 14px 32px; border-top: 1px solid #E7EAF0; background: #fff; margin-top: auto; }
</style>
