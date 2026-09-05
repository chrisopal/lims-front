<template>
  <div class="studio-shell">
    <!-- Fixed top bar -->
    <div class="studio-topbar">
      <div class="stb-breadcrumb">
        <span class="bc-link" @click="$router.push('/app/scenarios')">场景包</span>
        <el-icon size="11" color="#B0B9C6"><ArrowRight /></el-icon>
        <span class="bc-current">第三方食品理化检测</span>
      </div>
      <div class="stb-center">
        <div class="stb-name">第三方食品理化检测</div>
        <div class="stb-meta">
          <span class="stb-ver">v1.3.0</span>
          <span class="stb-status draft">Draft</span>
          <span class="stb-divider">·</span>
          <span class="stb-completeness">完整度</span>
          <div class="stb-progress-bar"><div class="stb-progress-fill" style="width:72%"></div></div>
          <span class="stb-pct">72%</span>
          <span class="stb-divider">·</span>
          <el-icon size="11" color="#A9650A"><Warning /></el-icon>
          <span class="stb-warn">2 个警告</span>
          <span class="stb-divider">·</span>
          <span class="stb-saved">上次保存 15:26</span>
        </div>
      </div>
      <div class="stb-actions">
        <el-dropdown size="small">
          <el-button size="small">更多 <el-icon><ArrowDown /></el-icon></el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>创建新版本</el-dropdown-item>
              <el-dropdown-item>导出配置</el-dropdown-item>
              <el-dropdown-item divided>废弃此草稿</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button size="small">保存草稿</el-button>
        <el-button size="small" @click="jumpToStep(11)">校验 (Preflight)</el-button>
        <el-button type="primary" size="small" :disabled="hasError">
          <el-icon v-if="hasError"><Lock /></el-icon>
          发布
        </el-button>
      </div>
    </div>

    <div class="studio-body">
      <!-- Left: Lifecycle Stepper -->
      <div class="studio-stepper">
        <div class="stepper-header">
          配置生命周期
          <span class="stepper-driven-hint">由场景定义驱动</span>
        </div>

        <div class="stepper-list">
          <div
            v-for="(step, idx) in steps"
            :key="step.id"
            class="step-row"
            :class="{
              active: currentStep === step.id,
              completed: step.status === 'done',
              warning: step.status === 'warn',
              error: step.status === 'error',
              pending: step.status === 'todo',
            }"
            @click="currentStep = step.id"
          >
            <!-- Status indicator -->
            <div class="step-indicator">
              <div class="step-num-circle">
                <el-icon v-if="step.status === 'done'" size="10"><Check /></el-icon>
                <el-icon v-else-if="step.status === 'warn'" size="10"><Warning /></el-icon>
                <el-icon v-else-if="step.status === 'error'" size="10"><Close /></el-icon>
                <span v-else class="step-num-text">{{ idx + 1 }}</span>
              </div>
              <div class="step-connector" v-if="idx < steps.length - 1"></div>
            </div>
            <!-- Step info -->
            <div class="step-info">
              <div class="step-label-row">
                <span class="step-name">{{ step.name }}</span>
                <span class="step-badge" v-if="step.hint" :class="step.status">{{ step.hint }}</span>
              </div>
              <div class="step-sublabel" v-if="step.sublabel">{{ step.sublabel }}</div>
            </div>
          </div>
        </div>

        <div class="stepper-footer">
          <div class="sf-stat ok"><el-icon size="10"><Check /></el-icon> {{ doneCount }} 完成</div>
          <div class="sf-stat warn"><el-icon size="10"><Warning /></el-icon> {{ warnCount }} 警告</div>
          <div class="sf-stat err" v-if="errorCount"><el-icon size="10"><Close /></el-icon> {{ errorCount }} 错误</div>
        </div>
      </div>

      <!-- Main content area -->
      <div class="studio-main" :key="currentStep">

        <!-- ===== Step 1: 基础信息 ===== -->
        <template v-if="currentStep === 1">
          <div class="step-header">
            <div class="step-page-title">基础信息</div>
            <div class="step-page-sub">定义场景名称、Key、业务类型与领域</div>
          </div>
          <div class="step-body">
            <el-form label-position="top" size="small" class="single-col-form">
              <el-form-item label="场景名称" required>
                <el-input value="第三方食品理化检测" />
              </el-form-item>
              <el-form-item label="场景 Key" required>
                <el-input value="third-party-food-physchem" />
                <div class="field-hint">创建后不可更改 · 用于系统内唯一标识</div>
              </el-form-item>
              <el-form-item label="场景说明">
                <el-input type="textarea" :rows="3" value="面向第三方检测实验室的食品理化检测场景，支持重金属、农残、添加剂等多类检测项目。" />
              </el-form-item>
              <el-form-item label="业务模式" required>
                <el-radio-group value="third-party">
                  <el-radio value="third-party">第三方（收费委托检测）</el-radio>
                  <el-radio value="internal">企业内部（生产/来料检验）</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="领域" required>
                <el-select value="food" style="width:320px">
                  <el-option label="食品检测 · Food" value="food" />
                  <el-option label="环境检测 · Environment" value="env" />
                  <el-option label="理化检测 · PhysChem" value="physchem" />
                  <el-option label="几何量 · Metrology" value="metrology" />
                  <el-option label="新能源 · Battery" value="battery" />
                </el-select>
              </el-form-item>
              <el-form-item label="所属实验室">
                <el-select value="lab-sh" style="width:320px">
                  <el-option label="上海食品检测实验室" value="lab-sh" />
                  <el-option label="深圳综合检测实验室" value="lab-sz" />
                </el-select>
              </el-form-item>
              <el-form-item label="场景从现有场景复制">
                <el-select placeholder="（可选）从已发布场景初始化" style="width:320px" clearable>
                  <el-option label="食品微生物检测 v1.0" value="micro" />
                  <el-option label="第三方食品理化检测 v1.2（自身旧版）" value="old" />
                </el-select>
              </el-form-item>
            </el-form>
          </div>
        </template>

        <!-- ===== Step 2: 检测对象 ===== -->
        <template v-else-if="currentStep === 2">
          <div class="step-header">
            <div class="step-page-title">检测对象 · Test Subject</div>
            <div class="step-page-sub">定义该场景可处理的对象类型，并为各类型绑定动态表单</div>
          </div>
          <div class="step-body">
            <div class="subject-grid">
              <div
                v-for="s in subjects"
                :key="s.key"
                class="subject-card"
                :class="{ selected: s.selected }"
                @click="s.selected = !s.selected"
              >
                <div class="sc-check">
                  <div class="sc-check-box" :class="{ checked: s.selected }">
                    <el-icon v-if="s.selected" size="10" color="#fff"><Check /></el-icon>
                  </div>
                </div>
                <div class="sc-key">{{ s.key }}</div>
                <div class="sc-cn">{{ s.cn }}</div>
                <div class="sc-desc">{{ s.desc }}</div>
                <div class="sc-form" v-if="s.selected">
                  <el-icon size="11" color="#1677FF"><EditPen /></el-icon>
                  <span>{{ s.formBound || '绑定表单' }}</span>
                </div>
              </div>
            </div>
            <div class="selection-summary">
              已选 <strong>{{ subjects.filter(s=>s.selected).length }}</strong> 种对象类型 ·
              点击已选对象可进入表单绑定配置
            </div>
          </div>
        </template>

        <!-- ===== Step 3: 检测项矩阵 ===== -->
        <template v-else-if="currentStep === 3">
          <div class="step-header">
            <div class="step-page-title">检测项与能力矩阵</div>
            <div class="step-page-sub">为每个检测项绑定标准、方法、限值、设备能力、人员资质、报告模板和 AI Skill</div>
            <el-button size="small" type="primary" style="margin-top:0;margin-left:auto">从检测项库添加</el-button>
          </div>
          <div class="matrix-stats">
            <span class="ms-item ok"><el-icon size="11"><CircleCheck /></el-icon> 完整 {{ completeCount }}</span>
            <span class="ms-item err"><el-icon size="11"><Warning /></el-icon> 不完整 {{ incompleteCount }}</span>
            <span class="ms-item total">共 {{ testItems.length }} 项</span>
          </div>
          <div class="matrix-wrap">
            <el-table :data="testItems" border size="small" style="width:100%" :row-class-name="rowClass">
              <el-table-column label="检测项" min-width="130" fixed>
                <template #default="{ row }">
                  <div class="ti-name">{{ row.name }}</div>
                  <div class="ti-en">{{ row.en }}</div>
                  <div class="ti-subject">{{ row.subject }}</div>
                </template>
              </el-table-column>
              <el-table-column label="法规 / 标准" min-width="170">
                <template #default="{ row }">
                  <span v-if="row.standard" class="ref-chip std">{{ row.standard }}</span>
                  <span v-else class="ref-missing">— 未绑定</span>
                </template>
              </el-table-column>
              <el-table-column label="检测方法" min-width="150">
                <template #default="{ row }">
                  <span v-if="row.method" class="ref-chip method">{{ row.method }}</span>
                  <span v-else class="ref-missing">— 未绑定</span>
                </template>
              </el-table-column>
              <el-table-column label="限值规则" min-width="150">
                <template #default="{ row }">
                  <span v-if="row.limit" class="ref-chip limit">{{ row.limit }}</span>
                  <span v-else class="ref-na">—</span>
                </template>
              </el-table-column>
              <el-table-column label="设备能力" min-width="100">
                <template #default="{ row }">
                  <span class="cap-chip">{{ row.equip }}</span>
                </template>
              </el-table-column>
              <el-table-column label="人员资质" min-width="120">
                <template #default="{ row }">
                  <span class="cap-chip">{{ row.qual }}</span>
                </template>
              </el-table-column>
              <el-table-column label="报告模板" min-width="150">
                <template #default="{ row }">
                  <span v-if="row.report" class="ref-chip report">{{ row.report }}</span>
                  <span v-else class="ref-na">—</span>
                </template>
              </el-table-column>
              <el-table-column label="AI Skill" min-width="150">
                <template #default="{ row }">
                  <span v-if="row.aiSkill" class="ref-chip ai">{{ row.aiSkill }}</span>
                  <span v-else class="ref-na">—</span>
                </template>
              </el-table-column>
              <el-table-column label="完整性" width="90" fixed="right">
                <template #default="{ row }">
                  <span v-if="row.complete" class="integrity ok"><el-icon size="10"><Check /></el-icon> 完整</span>
                  <span v-else class="integrity err"><el-icon size="10"><Warning /></el-icon> {{ row.missing }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="60" fixed="right">
                <template>
                  <el-button link size="small" type="primary">编辑</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </template>

        <!-- ===== Step 4: 法规与标准 ===== -->
        <template v-else-if="currentStep === 4">
          <div class="step-header">
            <div class="step-page-title">法律法规与标准</div>
            <div class="step-page-sub">绑定场景适用的法规标准版本，版本须为当前有效版本</div>
            <div style="display:flex;gap:8px;margin-left:auto">
              <el-button size="small">绑定现有法规 / 标准</el-button>
              <el-button size="small" @click="$router.push('/app/assets/standards')">
                进入标准库 <el-icon><TopRight /></el-icon>
              </el-button>
            </div>
          </div>
          <div class="warn-notice" v-if="standards.some(s => !s.active)">
            <el-icon size="13" color="#A9650A"><Warning /></el-icon>
            {{ standards.filter(s=>!s.active).length }} 项标准版本需要确认（版本较旧或状态待确认）
          </div>
          <div class="step-body">
            <el-table :data="standards" border size="small">
              <el-table-column label="编号" width="200">
                <template #default="{ row }">
                  <span class="std-code">{{ row.code }}</span>
                </template>
              </el-table-column>
              <el-table-column label="名称" min-width="220" prop="name" />
              <el-table-column label="类型" width="90" prop="type" />
              <el-table-column label="绑定版本" width="110">
                <template #default="{ row }">
                  <span class="ref-chip std">{{ row.version }}</span>
                </template>
              </el-table-column>
              <el-table-column label="生效日期" width="110" prop="effectDate" />
              <el-table-column label="适用检测项" width="90" prop="itemCount" />
              <el-table-column label="状态" width="110">
                <template #default="{ row }">
                  <span :class="['std-status', row.active ? 'active' : 'stale']">
                    <el-icon size="10"><component :is="row.active ? 'CircleCheck' : 'Warning'" /></el-icon>
                    {{ row.active ? '当前有效' : '版本待确认' }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="120">
                <template #default="{ row }">
                  <el-button link size="small" type="primary">详情</el-button>
                  <el-button link size="small" v-if="!row.active" type="warning">更新版本</el-button>
                  <el-button link size="small" type="danger" v-else>解绑</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </template>

        <!-- ===== Step 5: 方法与限值 ===== -->
        <template v-else-if="currentStep === 5">
          <div class="step-header">
            <div class="step-page-title">检测方法与限值</div>
            <div class="step-page-sub">为每项检测配置 Method Version、SOP、设备要求和限值规则</div>
            <el-button size="small" style="margin-left:auto">批量配置</el-button>
          </div>
          <div class="step-body">
            <el-table :data="methods" border size="small">
              <el-table-column label="检测项" width="120" prop="item" />
              <el-table-column label="Method Version" width="150">
                <template #default="{ row }">
                  <span v-if="row.method" class="ref-chip method">{{ row.method }}</span>
                  <span v-else class="ref-missing">未配置</span>
                </template>
              </el-table-column>
              <el-table-column label="SOP" width="130" prop="sop" />
              <el-table-column label="设备能力" width="120" prop="equip" />
              <el-table-column label="人员资质" width="120" prop="qual" />
              <el-table-column label="Limit Rule" width="150">
                <template #default="{ row }">
                  <span v-if="row.limit" class="ref-chip limit">{{ row.limit }}</span>
                  <span v-else class="ref-na">—</span>
                </template>
              </el-table-column>
              <el-table-column label="公式" width="100" prop="formula" />
              <el-table-column label="状态" width="90">
                <template #default="{ row }">
                  <span :class="['integrity', row.ready ? 'ok' : 'err']">{{ row.ready ? '完整' : '缺失' }}</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </template>

        <!-- ===== Step 6: 检测流程 ===== -->
        <template v-else-if="currentStep === 6">
          <div class="step-header">
            <div class="step-page-title">检测流程</div>
            <div class="step-page-sub">在流程设计器中可视化配置流程节点与连接，节点执行能力来自平台 Node Type 注册</div>
            <el-button size="small" type="primary" @click="$router.push('/app/workflow/designer')" style="margin-left:auto">
              <el-icon><Share /></el-icon> 打开流程设计器
            </el-button>
          </div>
          <div class="step-body">
            <div class="flow-summary-card">
              <div class="fsc-title">当前流程快照预览 · 第三方食品理化检测</div>
              <div class="fsc-stats">
                <span class="fsc-stat">共 {{ flowNodes.length }} 个节点</span>
                <span class="fsc-stat">
                  <el-icon size="11" color="#1677FF"><User /></el-icon>
                  Human Task {{ flowNodes.filter(n=>n.mode==='HUMAN_TASK').length }}
                </span>
                <span class="fsc-stat">
                  <el-icon size="11" color="#18794E"><Monitor /></el-icon>
                  Service Task {{ flowNodes.filter(n=>n.mode==='SERVICE_TASK').length }}
                </span>
                <span class="fsc-stat">
                  <el-icon size="11" color="#526075"><MagicStick /></el-icon>
                  AI 挂载 {{ flowNodes.filter(n=>n.aiSkill).length }}
                </span>
              </div>
              <div class="flow-preview-row">
                <div class="fpr-start">START</div>
                <template v-for="(node, i) in flowNodes" :key="node.id">
                  <el-icon size="11" color="#B0B9C6"><ArrowRight /></el-icon>
                  <div :class="['fpr-node', `mode-${node.mode}`]">
                    <el-icon size="10"><component :is="node.icon" /></el-icon>
                    <span>{{ node.name }}</span>
                    <span :class="['fpr-mode', node.mode]">{{ modeShort(node.mode) }}</span>
                  </div>
                </template>
                <el-icon size="11" color="#B0B9C6"><ArrowRight /></el-icon>
                <div class="fpr-end">END</div>
              </div>
            </div>
          </div>
        </template>

        <!-- ===== Steps 7-10: simplified ===== -->
        <template v-else-if="[7,8,9,10].includes(currentStep)">
          <div class="step-header">
            <div class="step-page-title">{{ steps[currentStep-1].name }}</div>
            <div class="step-page-sub">{{ stepDescs[currentStep] }}</div>
          </div>
          <div class="step-body">
            <div class="todo-placeholder">
              <el-icon size="24" color="#D9DEE7"><Setting /></el-icon>
              <div class="tp-text">此步骤配置面板</div>
              <div class="tp-hint">{{ stepDescs[currentStep] }}</div>
              <el-button size="small" style="margin-top:12px">开始配置</el-button>
            </div>
          </div>
        </template>

        <!-- ===== Step 11: Preflight ===== -->
        <template v-else-if="currentStep === 11">
          <div class="step-header">
            <div class="step-page-title">发布检查 · Preflight</div>
            <div class="step-page-sub">系统自动校验所有配置项。Error = 0 时方可发布。</div>
            <el-button size="small" style="margin-left:auto">重新校验</el-button>
          </div>
          <div class="preflight-summary">
            <div class="pf-sum-item pass">
              <div class="pf-sum-val">{{ preflightChecks.filter(c=>c.level==='pass').length }}</div>
              <div class="pf-sum-label">通过</div>
            </div>
            <div class="pf-sum-item error">
              <div class="pf-sum-val">{{ preflightChecks.filter(c=>c.level==='error').length }}</div>
              <div class="pf-sum-label">Error</div>
            </div>
            <div class="pf-sum-item warn">
              <div class="pf-sum-val">{{ preflightChecks.filter(c=>c.level==='warn').length }}</div>
              <div class="pf-sum-label">Warning</div>
            </div>
          </div>
          <div class="pf-group" v-for="grp in preflightGroups" :key="grp">
            <div class="pf-group-label">{{ grp }}</div>
            <div v-for="c in preflightChecks.filter(x=>x.group===grp)" :key="c.id" :class="['pf-row', c.level]">
              <el-icon size="13" v-if="c.level === 'pass'" color="#18794E"><CircleCheck /></el-icon>
              <el-icon size="13" v-else-if="c.level === 'error'" color="#C32F3F"><CircleClose /></el-icon>
              <el-icon size="13" v-else color="#A9650A"><Warning /></el-icon>
              <div class="pf-row-body">
                <div class="pf-msg">{{ c.msg }}</div>
                <div class="pf-meta" v-if="c.affected">受影响：{{ c.affected }}</div>
              </div>
              <el-button v-if="c.level !== 'pass'" link size="small" type="primary" @click="currentStep = c.targetStep">去修复</el-button>
            </div>
          </div>
          <div class="pf-actions">
            <el-button @click="currentStep = 10">上一步</el-button>
            <el-tooltip :content="hasError ? '存在 Error，无法发布' : ''">
              <el-button type="primary" :disabled="hasError">确认发布</el-button>
            </el-tooltip>
          </div>
        </template>

      </div>

      <!-- Right aside (contextual, only on certain steps) -->
      <div class="studio-aside" v-if="showAside">
        <div class="aside-header">步骤说明</div>
        <div class="aside-desc">{{ currentStepObj?.desc }}</div>
        <div class="aside-section" v-if="currentStepObj?.requires?.length">
          <div class="aside-sec-title">完成条件</div>
          <div class="aside-req-row" v-for="r in currentStepObj.requires" :key="r">
            <el-icon size="10" color="#1677FF"><Right /></el-icon>
            <span>{{ r }}</span>
          </div>
        </div>
        <div class="aside-section" v-if="currentStep === 4">
          <div class="aside-sec-title">依赖步骤</div>
          <div class="aside-dep">
            <el-icon size="10"><ArrowLeft /></el-icon> 检测项（步骤 03）必须先配置
          </div>
        </div>
        <div class="aside-section" v-if="currentStep === 6">
          <div class="aside-sec-title">关键说明</div>
          <div class="aside-notice">流程节点的 Executor 和 Renderer 来自 Node Type 注册表，配置仅修改参数与连接。</div>
        </div>
        <div class="aside-section" v-if="currentStep === 11">
          <div class="aside-sec-title">发布约束</div>
          <div class="aside-notice warn">发布后该版本不可直接编辑。如需修改，请创建新版本。</div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'

const currentStep = ref(3)

const steps = ref([
  { id: 1, name: '基础信息', status: 'done', hint: null, sublabel: null, desc: '填写场景名称、Key、业务模式和领域。', requires: ['场景名称不为空', '场景 Key 格式合法', '业务模式已选择', '领域已选择'] },
  { id: 2, name: '检测对象', status: 'done', hint: null, sublabel: 'FOOD_SAMPLE 已选', desc: '定义场景允许处理的检测对象类型，并绑定动态表单。', requires: ['至少选择一种对象类型'] },
  { id: 3, name: '检测项', status: 'warn', hint: '16 / 18', sublabel: '2 项不完整', desc: '为所有检测项绑定标准、方法、限值、设备、人员、报告、AI Skill。', requires: ['所有检测项已绑定标准', '所有检测项已绑定方法'] },
  { id: 4, name: '法律法规与标准', status: 'warn', hint: '2 项待确认', sublabel: null, desc: '绑定场景适用的法规标准，确认版本为当前有效版本。', requires: ['所有绑定标准为当前有效版本'] },
  { id: 5, name: '检测方法与限值', status: 'todo', hint: null, sublabel: null, desc: '为每检测项配置 Method Version、SOP 和限值规则。', requires: [] },
  { id: 6, name: '检测流程', status: 'todo', hint: null, sublabel: null, desc: '在流程设计器中配置流程节点与连接关系。', requires: [] },
  { id: 7, name: '动态表单', status: 'todo', hint: null, sublabel: null, desc: '为各流程节点绑定动态表单，定义字段和校验规则。', requires: [] },
  { id: 8, name: '资源与资质', status: 'todo', hint: null, sublabel: null, desc: '配置各节点所需人员资质和设备能力要求。', requires: [] },
  { id: 9, name: '报告模板', status: 'todo', hint: null, sublabel: null, desc: '绑定报告模板，配置生成条件和输出格式。', requires: [] },
  { id: 10, name: 'AI 能力', status: 'todo', hint: null, sublabel: null, desc: '配置场景内启用的 AI Skill 及触发策略。', requires: [] },
  { id: 11, name: '发布检查', status: 'todo', hint: null, sublabel: null, desc: '系统自动校验所有配置项，通过后方可发布。', requires: ['所有 Error 已解决'] },
])

const doneCount = computed(() => steps.value.filter(s => s.status === 'done').length)
const warnCount = computed(() => steps.value.filter(s => s.status === 'warn').length)
const errorCount = computed(() => steps.value.filter(s => s.status === 'error').length)
const currentStepObj = computed(() => steps.value.find(s => s.id === currentStep.value))
const showAside = computed(() => [3, 4, 6, 11].includes(currentStep.value))
const hasError = computed(() => preflightChecks.value.some(c => c.level === 'error'))

function jumpToStep(n: number) { currentStep.value = n }

const subjects = ref([
  { key: 'FOOD_SAMPLE', cn: '食品样品', desc: '固体/液体食品检测样品', selected: true, formBound: '食品收样表单 v2' },
  { key: 'ENVIRONMENTAL_SAMPLE', cn: '环境样品', desc: '水体、土壤、空气等', selected: false, formBound: '' },
  { key: 'SAMPLING_POINT', cn: '采样点位', desc: '用于现场多点位采样', selected: false, formBound: '' },
  { key: 'PART', cn: '零部件', desc: '工业零件/几何量', selected: false, formBound: '' },
  { key: 'DUT', cn: '被测设备', desc: 'Device Under Test', selected: false, formBound: '' },
  { key: 'CELL', cn: '电芯/模组', desc: '新能源电池测试', selected: false, formBound: '' },
])

const testItems = ref([
  { id: 1, name: '铅', en: 'Lead Pb', subject: 'FOOD_SAMPLE', standard: 'GB 5009.12-2023', method: 'ICP-MS Pb v2', limit: 'Food Pb Limit v3', equip: 'ICP-MS', qual: '理化-L2', report: '食品理化报告 v4', aiSkill: 'standard-match v1.2', complete: true, missing: '' },
  { id: 2, name: '镉', en: 'Cadmium Cd', subject: 'FOOD_SAMPLE', standard: 'GB 5009.15-2023', method: 'ICP-MS Cd v2', limit: 'Food Cd Limit v2', equip: 'ICP-MS', qual: '理化-L2', report: '食品理化报告 v4', aiSkill: null, complete: true, missing: '' },
  { id: 3, name: '总砷', en: 'Arsenic As', subject: 'FOOD_SAMPLE', standard: 'GB 5009.11-2014', method: 'HG-AFS As v1', limit: 'Food As Limit v2', equip: 'AFS', qual: '理化-L2', report: '食品理化报告 v4', aiSkill: null, complete: true, missing: '' },
  { id: 4, name: '汞', en: 'Mercury Hg', subject: 'FOOD_SAMPLE', standard: 'GB 5009.17-2021', method: null, limit: 'Food Hg Limit v1', equip: 'AFS', qual: '理化-L2', report: '食品理化报告 v4', aiSkill: null, complete: false, missing: '缺方法' },
  { id: 5, name: '菌落总数', en: 'TPC', subject: 'FOOD_SAMPLE', standard: 'GB 4789.2-2022', method: null, limit: null, equip: '微生物培养', qual: '微生物检测员', report: '食品微生物报告', aiSkill: null, complete: false, missing: '缺方法' },
  { id: 6, name: '大肠杆菌', en: 'E.coli', subject: 'FOOD_SAMPLE', standard: 'GB 4789.3-2016', method: 'MPN法 v2', limit: 'Ecoli Limit v1', equip: '微生物培养', qual: '微生物检测员', report: '食品微生物报告', aiSkill: null, complete: true, missing: '' },
  { id: 7, name: '苯甲酸', en: 'Benzoic Acid', subject: 'FOOD_SAMPLE', standard: 'GB 5009.28-2016', method: 'HPLC BA v3', limit: 'Additive Limit v2', equip: 'HPLC', qual: '理化-L1', report: '食品添加剂报告 v2', aiSkill: null, complete: true, missing: '' },
])

const completeCount = computed(() => testItems.value.filter(t => t.complete).length)
const incompleteCount = computed(() => testItems.value.filter(t => !t.complete).length)

const standards = ref([
  { id: 1, code: 'GB 5009.12-2023', name: '食品安全国家标准 食品中铅的测定', type: '国家标准', version: '2023版', effectDate: '2023-09-01', itemCount: 1, active: true },
  { id: 2, code: 'GB 5009.15-2023', name: '食品安全国家标准 食品中镉的测定', type: '国家标准', version: '2023版', effectDate: '2023-09-01', itemCount: 1, active: true },
  { id: 3, code: 'GB 5009.11-2014', name: '食品安全国家标准 食品中总砷及无机砷的测定', type: '国家标准', version: '2014版', effectDate: '2015-09-01', itemCount: 1, active: false },
  { id: 4, code: 'GB 4789.2-2022', name: '食品安全国家标准 食品微生物学检验 菌落总数测定', type: '国家标准', version: '2022版', effectDate: '2022-11-01', itemCount: 2, active: true },
  { id: 5, code: 'GB 5009.17-2021', name: '食品安全国家标准 食品中总汞及有机汞的测定', type: '国家标准', version: '2021版', effectDate: '2022-03-15', itemCount: 1, active: false },
])

const methods = ref([
  { item: '铅 Pb', method: 'ICP-MS Pb v2', sop: 'SOP-ICP-001', equip: 'ICP-MS', qual: '理化-L2', limit: 'Food Pb Limit v3', formula: '—', ready: true },
  { item: '镉 Cd', method: 'ICP-MS Cd v2', sop: 'SOP-ICP-001', equip: 'ICP-MS', qual: '理化-L2', limit: 'Food Cd Limit v2', formula: '—', ready: true },
  { item: '汞 Hg', method: null, sop: '—', equip: 'AFS', qual: '理化-L2', limit: 'Food Hg Limit v1', formula: '—', ready: false },
  { item: '菌落总数', method: null, sop: '—', equip: '微生物培养', qual: '微生物', limit: '—', formula: '—', ready: false },
])

const flowNodes = ref([
  { id: 1, name: '委托受理', mode: 'HUMAN_TASK', icon: 'Document', aiSkill: 'standard-match' },
  { id: 2, name: '收样', mode: 'HUMAN_TASK', icon: 'Box', aiSkill: null },
  { id: 3, name: '样品前处理', mode: 'HUMAN_TASK', icon: 'Operation', aiSkill: null },
  { id: 4, name: '实验室检测', mode: 'HUMAN_TASK', icon: 'Monitor', aiSkill: 'anomaly-detect' },
  { id: 5, name: '技术审核', mode: 'HUMAN_TASK', icon: 'Finished', aiSkill: 'report-review' },
  { id: 6, name: '报告生成', mode: 'SERVICE_TASK', icon: 'Printer', aiSkill: 'report-draft' },
  { id: 7, name: '报告签发', mode: 'HUMAN_TASK', icon: 'Upload', aiSkill: null },
])

const stepDescs: Record<number, string> = {
  7: '为委托表单、收样表单、检测原始记录表单等各节点绑定动态表单定义。',
  8: '配置各流程节点所需的人员资质等级和设备能力要求。',
  9: '绑定报告模板，配置模板触发条件、数据字段映射和输出格式。',
  10: '配置场景内启用的 AI Skill，设置触发阶段和 Human Approval 策略。',
}

const preflightChecks = ref([
  { id: 1, level: 'pass', msg: '基础信息完整', group: '基础信息', affected: '', targetStep: 1 },
  { id: 2, level: 'pass', msg: '检测对象已选择（FOOD_SAMPLE）', group: '检测对象', affected: '', targetStep: 2 },
  { id: 3, level: 'error', msg: '菌落总数未绑定 MethodVersion', group: '检测项', affected: '菌落总数', targetStep: 3 },
  { id: 4, level: 'error', msg: '汞 Hg 检测方法未配置', group: '检测项', affected: '汞 Hg', targetStep: 3 },
  { id: 5, level: 'warn', msg: 'GB 5009.11-2014 版本较旧，建议确认是否有新版', group: '法规 / 标准', affected: 'GB 5009.11-2014', targetStep: 4 },
  { id: 6, level: 'warn', msg: 'GB 5009.17-2021 状态待确认', group: '法规 / 标准', affected: 'GB 5009.17-2021', targetStep: 4 },
  { id: 7, level: 'pass', msg: '检测流程已配置（7 节点）', group: 'Workflow', affected: '', targetStep: 6 },
  { id: 8, level: 'pass', msg: '所有 Node Executor 已在注册表中找到', group: 'Node Executor', affected: '', targetStep: 6 },
  { id: 9, level: 'warn', msg: '技术审核节点未配置执行角色', group: '资源 / 资质', affected: 'TECHNICAL_REVIEW', targetStep: 8 },
  { id: 10, level: 'pass', msg: '报告模板已绑定', group: 'Report', affected: '', targetStep: 9 },
  { id: 11, level: 'pass', msg: 'AI Skill 均已配置 Human Approval 策略', group: 'AI Policy', affected: '', targetStep: 10 },
])

const preflightGroups = computed(() => [...new Set(preflightChecks.value.map(c => c.group))])

function rowClass({ row }: any) { return row.complete ? '' : 'row-incomplete' }
function modeShort(m: string) {
  const map: Record<string, string> = { HUMAN_TASK: 'H', SERVICE_TASK: 'S', AI_TASK: 'AI', RULE_TASK: 'R' }
  return map[m] || m
}
</script>
<style scoped>
.studio-shell { display: flex; flex-direction: column; height: 100%; overflow: hidden; background: #F5F7FA; }

/* Topbar */
.studio-topbar {
  background: #fff; border-bottom: 1px solid #D9DEE7; padding: 0 20px;
  display: flex; align-items: center; gap: 16px; height: 56px; flex-shrink: 0;
}
.stb-breadcrumb { font-size: 12px; color: #8A96A6; display: flex; align-items: center; gap: 5px; white-space: nowrap; }
.bc-link { color: #1677FF; cursor: pointer; }
.bc-link:hover { text-decoration: underline; }
.stb-center { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.stb-name { font-size: 15px; font-weight: 600; color: #0B1220; }
.stb-meta { display: flex; align-items: center; gap: 6px; font-size: 12px; }
.stb-ver { font-family: monospace; font-size: 11px; background: #F5F7FA; color: #526075; padding: 1px 6px; border-radius: 3px; }
.stb-status { font-size: 11px; padding: 1px 7px; border-radius: 3px; font-weight: 500; }
.stb-status.draft { background: #FFF3E0; color: #A9650A; border: 1px solid #FFD591; }
.stb-divider { color: #D9DEE7; }
.stb-completeness { font-size: 11px; color: #8A96A6; }
.stb-progress-bar { width: 60px; height: 4px; background: #E7EAF0; border-radius: 2px; }
.stb-progress-fill { height: 100%; background: #1677FF; border-radius: 2px; }
.stb-pct { font-size: 11px; color: #0B1220; font-weight: 500; }
.stb-warn { font-size: 11px; color: #A9650A; }
.stb-saved { font-size: 11px; color: #B0B9C6; }
.stb-actions { display: flex; gap: 6px; white-space: nowrap; }

.studio-body { display: flex; flex: 1; overflow: hidden; }

/* Stepper */
.studio-stepper {
  width: 220px; background: #fff; border-right: 1px solid #D9DEE7;
  display: flex; flex-direction: column; flex-shrink: 0; overflow: hidden;
}
.stepper-header {
  font-size: 11px; font-weight: 600; color: #526075; text-transform: uppercase; letter-spacing: 0.5px;
  padding: 14px 16px 8px; border-bottom: 1px solid #E7EAF0; display: flex; align-items: center; justify-content: space-between;
}
.stepper-driven-hint { font-size: 9px; color: #B0B9C6; text-transform: none; letter-spacing: 0; font-weight: 400; }
.stepper-list { flex: 1; overflow-y: auto; padding: 8px 0; }
.step-row {
  display: flex; gap: 0; cursor: pointer; padding: 0 12px 0 12px;
  transition: background 0.1s;
}
.step-row:hover .step-info { background: #F5F7FA; }
.step-row.active .step-info { background: #EDF4FF; }
.step-indicator { display: flex; flex-direction: column; align-items: center; width: 24px; margin-right: 8px; flex-shrink: 0; }
.step-num-circle {
  width: 20px; height: 20px; border-radius: 50%; border: 1.5px solid #D9DEE7;
  display: flex; align-items: center; justify-content: center; background: #fff;
  flex-shrink: 0; margin-top: 10px;
}
.step-row.completed .step-num-circle { background: #18794E; border-color: #18794E; color: #fff; }
.step-row.warning .step-num-circle { background: #A9650A; border-color: #A9650A; color: #fff; }
.step-row.error .step-num-circle { background: #C32F3F; border-color: #C32F3F; color: #fff; }
.step-row.active:not(.completed):not(.warning):not(.error) .step-num-circle { border-color: #1677FF; }
.step-num-text { font-size: 9px; color: #8A96A6; font-weight: 600; }
.step-connector { flex: 1; width: 1px; background: #E7EAF0; min-height: 14px; margin: 2px 0; }
.step-info { flex: 1; padding: 8px 8px 8px 0; border-radius: 4px; }
.step-label-row { display: flex; align-items: center; justify-content: space-between; gap: 4px; }
.step-name { font-size: 13px; color: #0B1220; font-weight: 500; }
.step-row.active .step-name { color: #1677FF; }
.step-row.pending .step-name { font-weight: 400; color: #526075; }
.step-badge { font-size: 10px; padding: 1px 5px; border-radius: 2px; white-space: nowrap; }
.step-badge.warn { background: #FFF3E0; color: #A9650A; }
.step-badge.error { background: #FFF1F0; color: #C32F3F; }
.step-sublabel { font-size: 11px; color: #8A96A6; margin-top: 1px; }
.stepper-footer {
  padding: 10px 16px; border-top: 1px solid #E7EAF0;
  display: flex; gap: 10px; flex-shrink: 0;
}
.sf-stat { font-size: 11px; display: flex; align-items: center; gap: 3px; }
.sf-stat.ok { color: #18794E; }
.sf-stat.warn { color: #A9650A; }
.sf-stat.err { color: #C32F3F; }

/* Main content */
.studio-main { flex: 1; overflow-y: auto; padding: 0; display: flex; flex-direction: column; }
.step-header {
  display: flex; align-items: flex-start; flex-wrap: wrap; gap: 6px;
  padding: 16px 24px 14px; background: #fff; border-bottom: 1px solid #D9DEE7; flex-shrink: 0;
}
.step-page-title { font-size: 16px; font-weight: 600; color: #0B1220; }
.step-page-sub { font-size: 12px; color: #8A96A6; margin-top: 4px; width: 100%; }
.step-body { padding: 16px 24px; flex: 1; }

/* Forms */
.single-col-form { max-width: 520px; }
.field-hint { font-size: 11px; color: #8A96A6; margin-top: 4px; }

/* Subject cards */
.subject-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 12px; }
.subject-card { border: 1.5px solid #D9DEE7; border-radius: 4px; padding: 12px; cursor: pointer; position: relative; }
.subject-card:hover { border-color: #1677FF; }
.subject-card.selected { border-color: #1677FF; background: #EDF4FF; }
.sc-check { position: absolute; top: 8px; right: 8px; }
.sc-check-box { width: 16px; height: 16px; border: 1.5px solid #D9DEE7; border-radius: 3px; display: flex; align-items: center; justify-content: center; background: #fff; }
.sc-check-box.checked { background: #1677FF; border-color: #1677FF; }
.sc-key { font-size: 10px; font-family: monospace; color: #8A96A6; margin-bottom: 4px; }
.sc-cn { font-size: 13px; font-weight: 600; color: #0B1220; margin-bottom: 2px; }
.sc-desc { font-size: 11px; color: #8A96A6; }
.sc-form { font-size: 11px; color: #1677FF; display: flex; align-items: center; gap: 4px; margin-top: 8px; }
.selection-summary { font-size: 12px; color: #526075; }

/* Matrix */
.matrix-stats { display: flex; gap: 12px; padding: 0 24px 10px; align-items: center; }
.ms-item { font-size: 12px; display: flex; align-items: center; gap: 4px; }
.ms-item.ok { color: #18794E; }
.ms-item.err { color: #C32F3F; }
.ms-item.total { color: #526075; }
.matrix-wrap { padding: 0 24px 16px; overflow-x: auto; }
.ti-name { font-size: 13px; font-weight: 600; color: #0B1220; }
.ti-en { font-size: 11px; color: #8A96A6; font-family: monospace; }
.ti-subject { font-size: 10px; color: #B0B9C6; font-family: monospace; }
.ref-chip { font-size: 10px; padding: 2px 6px; border-radius: 2px; font-family: monospace; display: inline-block; }
.ref-chip.std { background: #EDF4FF; color: #1677FF; }
.ref-chip.method { background: #F0FFF4; color: #18794E; }
.ref-chip.limit { background: #FFF3E0; color: #A9650A; }
.ref-chip.report { background: #F5F7FA; color: #526075; }
.ref-chip.ai { background: #F5F0FF; color: #526075; }
.ref-missing { font-size: 11px; color: #C32F3F; font-style: italic; }
.ref-na { font-size: 12px; color: #D9DEE7; }
.cap-chip { font-size: 11px; color: #526075; }
.integrity { font-size: 11px; padding: 2px 5px; border-radius: 2px; display: inline-flex; align-items: center; gap: 3px; }
.integrity.ok { background: #F0FFF4; color: #18794E; }
.integrity.err { background: #FFF1F0; color: #C32F3F; }
:deep(.row-incomplete td) { background: #FFFBF8 !important; }

/* Standards */
.warn-notice { display: flex; align-items: center; gap: 8px; margin: 0 24px 10px; padding: 8px 12px; background: #FFF8E1; border: 1px solid #FFE58F; border-radius: 4px; font-size: 12px; color: #A9650A; }
.std-code { font-family: monospace; font-size: 12px; color: #0B1220; }
.std-status { font-size: 11px; display: flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 3px; }
.std-status.active { background: #F0FFF4; color: #18794E; }
.std-status.stale { background: #FFF3E0; color: #A9650A; }

/* Flow preview */
.flow-summary-card { background: #fff; border: 1px solid #D9DEE7; border-radius: 4px; padding: 16px; }
.fsc-title { font-size: 13px; font-weight: 600; color: #0B1220; margin-bottom: 10px; }
.fsc-stats { display: flex; gap: 16px; margin-bottom: 14px; }
.fsc-stat { font-size: 12px; color: #526075; display: flex; align-items: center; gap: 4px; }
.flow-preview-row { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; overflow-x: auto; }
.fpr-start, .fpr-end { font-size: 10px; font-weight: 700; padding: 5px 8px; border-radius: 50%; background: #0B1220; color: #fff; }
.fpr-node { display: flex; align-items: center; gap: 4px; padding: 5px 8px; border: 1.5px solid #D9DEE7; border-radius: 4px; font-size: 11px; color: #0B1220; background: #fff; }
.fpr-node.mode-HUMAN_TASK { border-top: 2px solid #1677FF; }
.fpr-node.mode-SERVICE_TASK { border-top: 2px solid #18794E; }
.fpr-mode { font-size: 9px; padding: 1px 3px; border-radius: 2px; background: #F5F7FA; color: #8A96A6; }

/* Placeholder */
.todo-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px; text-align: center; background: #fff; border: 1px solid #D9DEE7; border-radius: 4px; }
.tp-text { font-size: 14px; font-weight: 500; color: #526075; margin-top: 12px; }
.tp-hint { font-size: 12px; color: #B0B9C6; margin-top: 6px; max-width: 360px; }

/* Preflight */
.preflight-summary { display: flex; gap: 12px; padding: 16px 24px; }
.pf-sum-item { background: #fff; border: 1px solid #D9DEE7; border-radius: 6px; padding: 14px 20px; text-align: center; min-width: 80px; }
.pf-sum-item.pass { border-top: 3px solid #18794E; }
.pf-sum-item.error { border-top: 3px solid #C32F3F; }
.pf-sum-item.warn { border-top: 3px solid #A9650A; }
.pf-sum-val { font-size: 28px; font-weight: 700; color: #0B1220; }
.pf-sum-label { font-size: 11px; color: #526075; margin-top: 2px; }
.pf-group { padding: 0 24px 12px; }
.pf-group-label { font-size: 11px; font-weight: 600; color: #B0B9C6; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
.pf-row { display: flex; align-items: flex-start; gap: 10px; padding: 9px 12px; border: 1px solid #E7EAF0; border-radius: 4px; margin-bottom: 4px; background: #fff; }
.pf-row.error { background: #FFF1F0; border-color: #FFCCC7; }
.pf-row.warn { background: #FFF8E1; border-color: #FFE58F; }
.pf-row-body { flex: 1; }
.pf-msg { font-size: 13px; color: #0B1220; }
.pf-meta { font-size: 11px; color: #8A96A6; margin-top: 2px; }
.pf-actions { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 24px; border-top: 1px solid #E7EAF0; background: #fff; }

/* Right aside */
.studio-aside {
  width: 220px; background: #fff; border-left: 1px solid #D9DEE7;
  padding: 14px; overflow-y: auto; flex-shrink: 0;
}
.aside-header { font-size: 11px; font-weight: 600; color: #526075; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
.aside-desc { font-size: 12px; color: #526075; line-height: 1.6; margin-bottom: 14px; }
.aside-section { margin-bottom: 14px; }
.aside-sec-title { font-size: 11px; color: #B0B9C6; font-weight: 500; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
.aside-req-row { display: flex; align-items: flex-start; gap: 5px; font-size: 12px; color: #526075; margin-bottom: 4px; line-height: 1.4; }
.aside-dep { font-size: 12px; color: #526075; display: flex; align-items: center; gap: 4px; }
.aside-notice { font-size: 12px; color: #526075; background: #F5F7FA; border: 1px solid #D9DEE7; padding: 8px 10px; border-radius: 4px; line-height: 1.5; }
.aside-notice.warn { background: #FFF3E0; border-color: #FFD591; color: #A9650A; }
</style>
