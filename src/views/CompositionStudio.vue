<template>
  <div class="studio-root">
    <!-- Page header -->
    <div class="studio-topbar">
      <div class="studio-topbar-left">
        <div class="studio-title">场景配置中心</div>
        <div class="studio-subtitle">Composition Studio · 组合不同领域包、标准、方法、报告、AI Skill，构建完整实验室场景解决方案</div>
      </div>
      <div class="studio-topbar-actions">
        <el-button size="small">导入场景</el-button>
        <el-button size="small" type="primary" @click="showNewScene = true">+ 新建场景</el-button>
      </div>
    </div>

    <div class="studio-body">
      <!-- ===== LEFT: Scene Tree ===== -->
      <aside class="scene-sidebar">
        <div class="sidebar-search">
          <el-input v-model="treeSearch" placeholder="搜索场景..." prefix-icon="Search" size="small" clearable />
        </div>

        <div class="sidebar-stats">
          <span class="stat-item"><span class="stat-num">{{ scenes.length }}</span> 场景</span>
          <span class="stat-dot">·</span>
          <span class="stat-item"><span class="stat-num">{{ scenes.filter(s => s.status === 'active').length }}</span> 启用</span>
          <span class="stat-dot">·</span>
          <span class="stat-item"><span class="stat-num">{{ scenes.filter(s => s.status === 'draft').length }}</span> 草稿</span>
        </div>

        <div class="scene-group" v-for="group in groupedScenes" :key="group.mode">
          <div class="group-header">
            <span class="group-label">{{ group.mode }}</span>
            <span class="group-count">{{ group.items.length }}</span>
          </div>
          <div
            class="scene-node"
            v-for="s in group.items"
            :key="s.id"
            :class="{ active: activeSceneId === s.id }"
            @click="selectScene(s.id)"
          >
            <div class="scene-node-top">
              <span class="scene-node-status" :class="s.status"></span>
              <span class="scene-node-name">{{ s.name }}</span>
            </div>
            <div class="scene-node-meta">
              <el-tag size="small" effect="plain" :type="domainColor(s.domain)">{{ s.domain }}</el-tag>
              <span class="scene-node-ver">v{{ s.version }}</span>
              <el-tag size="small" :type="statusTagType(s.status)" class="scene-node-status-tag">{{ statusLabel(s.status) }}</el-tag>
            </div>
          </div>
        </div>
      </aside>

      <!-- ===== RIGHT: Scene Detail ===== -->
      <div class="scene-detail">

        <!-- Scene detail header -->
        <div class="detail-header">
          <div class="detail-header-left">
            <div class="detail-name">{{ currentScene.name }}</div>
            <div class="detail-meta">
              <span class="meta-code">{{ currentScene.code }}</span>
              <span class="meta-sep">·</span>
              <span>{{ currentScene.lab }}</span>
              <span class="meta-sep">·</span>
              <span>最后修改 {{ currentScene.updatedAt }}</span>
              <span class="meta-sep">·</span>
              <span class="meta-version">版本 v{{ currentScene.version }}</span>
            </div>
          </div>
          <div class="detail-header-right">
            <el-tag :type="statusTagType(currentScene.status)" size="default" style="margin-right:4px">
              {{ statusLabel(currentScene.status) }}
            </el-tag>
            <el-button size="small" @click="currentScene.status = 'draft'" v-if="currentScene.status === 'active'">下线为草稿</el-button>
            <el-button size="small" type="warning" v-if="currentScene.status === 'draft'">审核发布</el-button>
            <el-button size="small" @click="currentScene.status = 'active'" v-if="currentScene.status === 'reviewing'">发布上线</el-button>
            <el-button size="small">另存为版本</el-button>
            <el-button size="small" type="primary">保存</el-button>
          </div>
        </div>

        <!-- Pack composition overview -->
        <div class="pack-overview">
          <div class="pack-overview-label">
            <el-icon style="color:#1677FF"><Grid /></el-icon>
            场景包组合
          </div>
          <div class="pack-rail">
            <div class="pack-block" v-for="(pack, i) in currentSceneWithPacks.packs" :key="pack.id">
              <div class="pack-card">
                <div class="pack-card-icon"><el-icon :size="16"><component :is="pack.icon" /></el-icon></div>
                <div class="pack-card-body">
                  <div class="pack-card-name">{{ pack.name }}</div>
                  <div class="pack-card-en">{{ pack.en }}</div>
                  <div class="pack-card-ver">v{{ pack.version }}</div>
                </div>
                <div class="pack-card-status" :class="pack.enabled ? 'on' : 'off'">{{ pack.enabled ? '✓' : '—' }}</div>
              </div>
              <div class="pack-plus" v-if="i < currentSceneWithPacks.packs.length - 1">+</div>
            </div>
            <div class="pack-result">
              <div class="pack-result-label">= 场景解决方案</div>
              <div class="pack-result-stats">
                <span>{{ matrixRows.length }} 检测项</span>
                <span>{{ currentSceneWithPacks.packs.filter(p => p.type === 'standard').length }} 标准包</span>
                <span>{{ aiSkills.filter(a => a.enabled).length }} AI Skill</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <el-tabs v-model="activeTab" class="detail-tabs">

          <!-- Tab: 基本信息 -->
          <el-tab-pane label="基本信息" name="basic">
            <div class="tab-content">
              <div class="form-section">
                <div class="form-section-title">场景标识</div>
                <div class="form-grid-2">
                  <el-form-item label="场景名称">
                    <el-input v-model="currentScene.name" />
                  </el-form-item>
                  <el-form-item label="场景编码">
                    <el-input v-model="currentScene.code" />
                  </el-form-item>
                  <el-form-item label="所属实验室">
                    <el-select v-model="currentScene.lab" style="width:100%">
                      <el-option label="华东食品检测中心" value="华东食品检测中心" />
                      <el-option label="新能源电池测试实验室" value="新能源电池测试实验室" />
                      <el-option label="环境监测站" value="环境监测站" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="当前版本">
                    <el-input :value="'v' + currentScene.version" disabled>
                      <template #append><el-button size="small">升版本</el-button></template>
                    </el-input>
                  </el-form-item>
                </div>
              </div>
              <div class="form-section">
                <div class="form-section-title">业务模式与领域</div>
                <div class="mode-domain-selector">
                  <div>
                    <div class="selector-label">业务模式 · Business Mode Pack</div>
                    <el-radio-group v-model="currentScene.businessMode" class="mode-radios">
                      <el-radio value="third-party" border>
                        <span class="mode-radio-label">第三方检测实验室</span>
                        <span class="mode-radio-sub">Third-party Lab Pack</span>
                      </el-radio>
                      <el-radio value="internal" border>
                        <span class="mode-radio-label">企业内部实验室</span>
                        <span class="mode-radio-sub">Internal Lab Pack</span>
                      </el-radio>
                    </el-radio-group>
                  </div>
                  <div>
                    <div class="selector-label">检测领域 · Domain Pack</div>
                    <div class="domain-chips">
                      <div
                        class="domain-chip"
                        v-for="d in allDomains"
                        :key="d.id"
                        :class="{ active: currentScene.domain === d.id }"
                        @click="currentScene.domain = d.id"
                      >
                        <el-icon class="domain-chip-icon"><component :is="d.icon" /></el-icon>
                        <span class="domain-chip-name">{{ d.name }}</span>
                        <span class="domain-chip-en">{{ d.en }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="form-section">
                <div class="form-section-title">适用对象 · Applicable Object</div>
                <div class="object-selector">
                  <div class="object-chip" v-for="o in applicableObjects" :key="o.id" :class="{active: o.selected}" @click="o.selected = !o.selected">
                    {{ o.name }}
                    <el-tag size="small" type="info" style="margin-left:4px">{{ o.type }}</el-tag>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- Tab: 流程配置 -->
          <el-tab-pane name="workflow">
            <template #label>
              <span>流程配置</span>
              <span class="tab-badge">{{ flowLanes.reduce((s, l) => s + l.nodes.length, 0) }}</span>
            </template>
            <div class="tab-content">
              <!-- Flow diagram -->
              <div class="flow-diagram">
                <div class="flow-lane-wrap" v-for="lane in flowLanes" :key="lane.name">
                  <div class="flow-lane-label">{{ lane.label }}</div>
                  <div class="flow-lane-track">
                    <template v-for="(node, i) in lane.nodes" :key="node.id">
                      <div
                        class="flow-step"
                        :class="[node.type, { selected: selectedNode === node.id }]"
                        @click="selectedNode = node.id"
                      >
                        <div class="flow-step-icon"><el-icon><component :is="node.icon" /></el-icon></div>
                        <div class="flow-step-name">{{ node.name }}</div>
                        <div class="flow-step-badges">
                          <span class="flow-badge ai" v-if="node.hasAi">AI</span>
                          <span class="flow-badge sla">{{ node.sla }}</span>
                        </div>
                        <div class="flow-step-required" v-if="!node.required">选</div>
                      </div>
                      <div class="flow-arrow" v-if="i < lane.nodes.length - 1">
                        <span>→</span>
                      </div>
                    </template>
                  </div>
                </div>
              </div>

              <!-- Node table -->
              <div class="flow-table-wrap">
                <div class="flow-table-header">
                  <span style="font-size:13px;font-weight:500;color:#0B1220">节点清单</span>
                  <el-button size="small" type="primary" link @click="$router.push('/app/workflow-builder')">在流程设计器中编辑 →</el-button>
                </div>
                <el-table :data="allFlowNodes" border size="small">
                  <el-table-column prop="name" label="节点名称" width="120" />
                  <el-table-column prop="lane" label="所属泳道" width="110" />
                  <el-table-column prop="type" label="类型" width="90">
                    <template #default="{row}">
                      <el-tag type="info" size="small">{{ row.typeLabel }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="role" label="负责角色" width="110" />
                  <el-table-column label="必经" width="70" align="center">
                    <template #default="{row}">
                      <el-switch v-model="row.required" size="small" />
                    </template>
                  </el-table-column>
                  <el-table-column label="AI 节点" width="80" align="center">
                    <template #default="{row}">
                      <el-switch v-model="row.hasAi" size="small" />
                    </template>
                  </el-table-column>
                  <el-table-column prop="sla" label="SLA 时限" width="90" />
                  <el-table-column prop="aiSkill" label="挂载 AI Skill" >
                    <template #default="{row}">
                      <el-tag type="primary" size="small" effect="plain" v-if="row.aiSkill">{{ row.aiSkill }}</el-tag>
                      <span v-else style="color:#B0B9C6;font-size:12px">—</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="70" fixed="right">
                    <template #default>
                      <el-button link type="primary" size="small">配置</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
          </el-tab-pane>

          <!-- Tab: 检测项与标准（矩阵） -->
          <el-tab-pane name="matrix">
            <template #label>
              <span>检测项与标准</span>
              <span class="tab-badge">{{ matrixRows.length }}</span>
            </template>
            <div class="tab-content">
              <div class="matrix-toolbar">
                <el-input v-model="matrixSearch" placeholder="搜索检测项..." prefix-icon="Search" size="small" style="width:220px" clearable />
                <el-select v-model="matrixCategory" size="small" placeholder="分类筛选" clearable style="width:130px">
                  <el-option label="重金属" value="heavy-metal" />
                  <el-option label="微生物" value="micro" />
                  <el-option label="营养成分" value="nutrition" />
                  <el-option label="理化指标" value="physchem" />
                </el-select>
                <el-tag type="success" size="small" style="margin-left:auto">
                  <el-icon><MagicStick /></el-icon> AI 标准推荐已开启
                </el-tag>
                <el-button size="small" type="primary">+ 添加检测项</el-button>
                <el-button size="small">批量导入</el-button>
              </div>

              <!-- Column legend -->
              <div class="matrix-legend">
                <div class="legend-item"><span class="legend-dot std"></span>标准版本</div>
                <div class="legend-item"><span class="legend-dot method"></span>方法版本</div>
                <div class="legend-item"><span class="legend-dot limit"></span>限值规则</div>
                <div class="legend-item"><span class="legend-dot report"></span>报告模板</div>
                <div class="legend-item"><span class="legend-dot ai"></span>AI Skill</div>
                <div class="legend-item warn"><el-icon><Warning /></el-icon>版本冲突</div>
                <div class="legend-item upd"><el-icon><Bell /></el-icon>有新版本</div>
              </div>

              <!-- Matrix table -->
              <div class="matrix-table-wrap">
                <table class="matrix-table">
                  <thead>
                    <tr>
                      <th class="col-item">检测项目</th>
                      <th class="col-obj">适用对象</th>
                      <th class="col-std">
                        <div class="th-inner"><span class="col-dot std"></span>适用标准</div>
                        <div class="th-sub">Standard</div>
                      </th>
                      <th class="col-method">
                        <div class="th-inner"><span class="col-dot method"></span>检测方法</div>
                        <div class="th-sub">Method</div>
                      </th>
                      <th class="col-limit">
                        <div class="th-inner"><span class="col-dot limit"></span>限值规则</div>
                        <div class="th-sub">Limit Rule</div>
                      </th>
                      <th class="col-report">
                        <div class="th-inner"><span class="col-dot report"></span>报告模板</div>
                        <div class="th-sub">Report Template</div>
                      </th>
                      <th class="col-ai">
                        <div class="th-inner"><span class="col-dot ai"></span>AI Skill</div>
                        <div class="th-sub">AI Skill</div>
                      </th>
                      <th class="col-ops">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <template v-for="group in matrixGroups" :key="group.category">
                      <tr class="matrix-group-row">
                        <td colspan="8">
                          <span class="matrix-group-label">{{ group.category }}</span>
                          <span class="matrix-group-count">{{ group.rows.length }} 项</span>
                        </td>
                      </tr>
                      <tr
                        v-for="row in group.rows"
                        :key="row.id"
                        class="matrix-data-row"
                        :class="{ 'has-warn': row.warn, 'has-update': row.hasUpdate }"
                      >
                        <td class="cell-item">
                          <div class="item-name">{{ row.item }}</div>
                          <div class="item-formula" v-if="row.formula">{{ row.formula }}</div>
                        </td>
                        <td class="cell-obj">
                          <el-tag size="small" type="info" effect="plain">{{ row.object }}</el-tag>
                        </td>
                        <td class="cell-std">
                          <div class="ver-chip std">
                            <span class="ver-code">{{ row.stdCode }}</span>
                            <span class="ver-ver">{{ row.stdVer }}</span>
                          </div>
                          <div class="upd-hint" v-if="row.hasUpdate">
                            <el-icon size="11"><Bell /></el-icon> 有新版 {{ row.stdNextVer }}
                          </div>
                        </td>
                        <td class="cell-method">
                          <div class="ver-chip method">
                            <span class="ver-code">{{ row.method }}</span>
                            <span class="ver-ver">{{ row.methodVer }}</span>
                          </div>
                        </td>
                        <td class="cell-limit">
                          <div class="ver-chip limit">
                            <span class="ver-code">{{ row.limitRule }}</span>
                            <span class="ver-ver">{{ row.limitVer }}</span>
                          </div>
                        </td>
                        <td class="cell-report">
                          <div class="ver-chip report">
                            <span class="ver-code">{{ row.reportTpl }}</span>
                            <span class="ver-ver">{{ row.reportVer }}</span>
                          </div>
                        </td>
                        <td class="cell-ai">
                          <div class="ai-skill-cell" v-if="row.aiSkill">
                            <span class="ai-dot"></span>
                            <span class="ai-name">{{ row.aiSkill }}</span>
                          </div>
                          <span v-else class="cell-empty">—</span>
                        </td>
                        <td class="cell-ops">
                          <el-button link type="primary" size="small" @click="openMatrixEdit(row)">编辑</el-button>
                          <el-button link size="small">移除</el-button>
                        </td>
                      </tr>
                    </template>
                  </tbody>
                </table>
              </div>
            </div>
          </el-tab-pane>

          <!-- Tab: 报告模板 -->
          <el-tab-pane name="report">
            <template #label>
              <span>报告模板</span>
              <span class="tab-badge">{{ reportTemplates.length }}</span>
            </template>
            <div class="tab-content">
              <div class="matrix-toolbar">
                <span style="font-size:13px;color:#526075">已挂载 {{ reportTemplates.length }} 个模板 · 适配当前场景</span>
                <el-button size="small" type="primary" style="margin-left:auto">+ 挂载模板</el-button>
                <el-button size="small" @click="$router.push('/app/report-templates')">模板设计器 →</el-button>
              </div>
              <div class="report-tpl-list">
                <div class="report-tpl-card" v-for="tpl in reportTemplates" :key="tpl.id">
                  <div class="rtpl-header">
                    <div class="rtpl-icon"><el-icon size="22" color="#526075"><Printer /></el-icon></div>
                    <div class="rtpl-info">
                      <div class="rtpl-name">{{ tpl.name }}</div>
                      <div class="rtpl-code">{{ tpl.code }}</div>
                    </div>
                    <div class="rtpl-status">
                      <el-switch v-model="tpl.enabled" size="small" />
                    </div>
                  </div>
                  <div class="rtpl-meta">
                    <el-tag size="small" type="primary" effect="plain">v{{ tpl.version }}</el-tag>
                    <el-tag size="small" v-if="tpl.cma" style="margin-left:4px;color:#1677FF;border-color:#1677FF">CMA</el-tag>
                    <el-tag size="small" v-if="tpl.cnas" style="margin-left:4px;color:#C32F3F;border-color:#C32F3F">CNAS</el-tag>
                    <span class="rtpl-lang">{{ tpl.lang }}</span>
                  </div>
                  <div class="rtpl-scenes">
                    <span class="rtpl-scene-label">适用场景：</span>
                    <el-tag size="small" type="info" v-for="s in tpl.scenes" :key="s" style="margin-right:4px">{{ s }}</el-tag>
                  </div>
                  <div class="rtpl-sign">
                    <span class="sign-label">签章规则：</span>
                    <span class="sign-value">{{ tpl.signRule }}</span>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- Tab: AI Skill -->
          <el-tab-pane name="ai">
            <template #label>
              <span>AI Skill 配置</span>
              <span class="tab-badge">{{ aiSkills.filter(a => a.enabled).length }}/{{ aiSkills.length }}</span>
            </template>
            <div class="tab-content">
              <!-- Pipeline overview -->
              <div class="ai-pipeline">
                <div class="ai-pipeline-label">AI Skill 在业务流程中的挂载位置</div>
                <div class="ai-pipeline-track">
                  <div class="pipe-stage" v-for="stage in pipelineStages" :key="stage.name">
                    <div class="pipe-stage-name">{{ stage.name }}</div>
                    <div class="pipe-skills">
                      <div class="pipe-skill" v-for="sk in stage.skills" :key="sk" :class="{disabled: !aiSkills.find(a => a.name === sk)?.enabled}">
                        <el-icon size="10"><MagicStick /></el-icon> {{ sk }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- AI Skill cards -->
              <div class="ai-skill-grid">
                <div class="ai-skill-card" v-for="skill in aiSkills" :key="skill.id" :class="{ disabled: !skill.enabled }">
                  <div class="ask-header">
                    <div class="ask-icon"><el-icon size="16"><component :is="skill.icon" /></el-icon></div>
                    <div class="ask-info">
                      <div class="ask-name">{{ skill.name }}</div>
                      <div class="ask-en">{{ skill.en }}</div>
                    </div>
                    <el-switch v-model="skill.enabled" size="small" />
                  </div>
                  <div class="ask-flow">
                    <div class="ask-io">
                      <span class="io-label">触发</span>
                      <span class="io-val">{{ skill.trigger }}</span>
                    </div>
                    <span class="ask-arrow">→</span>
                    <div class="ask-io">
                      <span class="io-label">输入</span>
                      <span class="io-val">{{ skill.input }}</span>
                    </div>
                    <span class="ask-arrow">→</span>
                    <div class="ask-io">
                      <span class="io-label">输出</span>
                      <span class="io-val">{{ skill.output }}</span>
                    </div>
                  </div>
                  <div class="ask-footer">
                    <el-tag type="info" size="small">风险 {{ skill.risk }}</el-tag>
                    <el-tag type="info" size="small" v-if="skill.confirm">需人工确认</el-tag>
                    <el-tag type="primary" size="small" effect="plain" v-else>自动执行</el-tag>
                    <span class="ask-stat">本月 {{ skill.callCount }} 次 · 采纳率 {{ skill.adoptRate }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- Tab: 动态表单 -->
          <el-tab-pane label="动态表单" name="forms">
            <div class="tab-content">
              <div class="forms-layout">
                <div class="forms-nav">
                  <div
                    class="form-nav-item"
                    v-for="f in formModules"
                    :key="f.id"
                    :class="{ active: activeForm === f.id }"
                    @click="activeForm = f.id"
                  >
                    {{ f.label }}
                    <span class="form-nav-count">{{ f.fields.length }}</span>
                  </div>
                </div>
                <div class="forms-fields">
                  <div class="fields-header">
                    <span style="font-size:13px;font-weight:500">{{ currentFormModule.label }} · 字段配置</span>
                    <el-button size="small" type="primary">+ 添加字段</el-button>
                  </div>
                  <table class="fields-table">
                    <thead>
                      <tr>
                        <th>字段名称</th>
                        <th>字段类型</th>
                        <th>必填</th>
                        <th>可见</th>
                        <th>默认值</th>
                        <th>条件显示</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="field in currentFormModule.fields" :key="field.id">
                        <td class="field-name-cell">{{ field.name }}</td>
                        <td><el-tag size="small" type="info">{{ field.type }}</el-tag></td>
                        <td><el-switch v-model="field.required" size="small" /></td>
                        <td><el-switch v-model="field.visible" size="small" /></td>
                        <td style="font-size:12px;color:#526075">{{ field.defaultVal || '—' }}</td>
                        <td style="font-size:12px;color:#526075">{{ field.condition || '—' }}</td>
                        <td><el-button link type="primary" size="small">编辑</el-button></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </el-tab-pane>

        </el-tabs>
      </div>
    </div>

    <!-- Matrix edit dialog -->
    <el-dialog v-model="showMatrixEdit" title="编辑检测项配置" width="640px" :append-to-body="true">
      <div v-if="editingRow">
        <el-descriptions :column="1" border size="small" style="margin-bottom:16px">
          <el-descriptions-item label="检测项">{{ editingRow.item }}</el-descriptions-item>
          <el-descriptions-item label="适用对象">{{ editingRow.object }}</el-descriptions-item>
        </el-descriptions>
        <el-form label-width="100px" size="small">
          <el-form-item label="适用标准">
            <el-select v-model="editingRow.stdCode" style="width:260px">
              <el-option label="GB 5009.12-2023（当前）" value="GB 5009.12-2023" />
              <el-option label="GB 5009.12-2016（旧版）" value="GB 5009.12-2016" />
              <el-option label="ISO 17294-2:2016" value="ISO 17294-2:2016" />
            </el-select>
            <el-tag type="success" size="small" style="margin-left:8px">最新版本</el-tag>
          </el-form-item>
          <el-form-item label="检测方法">
            <el-select v-model="editingRow.method" style="width:260px">
              <el-option label="ICP-MS Pb v2.1" value="ICP-MS Pb v2" />
              <el-option label="ICP-MS Pb v1.5（旧）" value="ICP-MS Pb v1" />
              <el-option label="AAS Pb v3.0" value="AAS Pb v3" />
            </el-select>
          </el-form-item>
          <el-form-item label="限值规则">
            <el-select v-model="editingRow.limitRule" style="width:260px">
              <el-option label="Pb Limit v3（乳品）" value="Pb Limit v3" />
              <el-option label="Pb Limit v2（通用）" value="Pb Limit v2" />
            </el-select>
          </el-form-item>
          <el-form-item label="报告模板">
            <el-select v-model="editingRow.reportTpl" style="width:260px">
              <el-option label="食品报告 v4（推荐）" value="食品报告" />
              <el-option label="食品报告 v3" value="食品报告v3" />
            </el-select>
          </el-form-item>
          <el-form-item label="AI Skill">
            <el-select v-model="editingRow.aiSkill" style="width:260px" clearable>
              <el-option label="标准智能匹配" value="标准智能匹配" />
              <el-option label="报告草稿生成" value="报告草稿生成" />
              <el-option label="结果异常识别" value="结果异常识别" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showMatrixEdit = false">取消</el-button>
        <el-button type="primary" @click="showMatrixEdit = false">保存配置</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// ── State ──────────────────────────────────────────
const treeSearch = ref('')
const activeSceneId = ref(1)
const activeTab = ref('matrix')
const selectedNode = ref<number | null>(null)
const matrixSearch = ref('')
const matrixCategory = ref('')
const activeForm = ref('apply')
const showNewScene = ref(false)
const showMatrixEdit = ref(false)
const editingRow = ref<any>(null)

// ── Scene list ─────────────────────────────────────
const scenes = ref([
  { id: 1, name: '食品第三方检测', domain: 'Food', version: '4.2', status: 'active', mode: '第三方', lab: '华东食品检测中心', code: 'SCENE-FOOD-3P-001', updatedAt: '2024-12-01', businessMode: 'third-party' },
  { id: 2, name: '内部理化质控', domain: 'PhysChem', version: '2.0', status: 'active', mode: '内部', lab: '质量管理部', code: 'SCENE-PC-INT-001', updatedAt: '2024-11-20', businessMode: 'internal' },
  { id: 3, name: '环境监测委托', domain: 'Environment', version: '1.8', status: 'active', mode: '第三方', lab: '环境监测站', code: 'SCENE-ENV-3P-001', updatedAt: '2024-11-15', businessMode: 'third-party' },
  { id: 4, name: '新能源电池检测', domain: 'Battery', version: '0.9', status: 'draft', mode: '第三方', lab: '新能源实验室', code: 'SCENE-BAT-3P-001', updatedAt: '2024-12-02', businessMode: 'third-party' },
  { id: 5, name: '计量检定服务', domain: 'Metrology', version: '3.1', status: 'active', mode: '第三方', lab: '计量检定中心', code: 'SCENE-MET-3P-001', updatedAt: '2024-10-30', businessMode: 'third-party' },
  { id: 6, name: '核电材料检测（试运行）', domain: 'Nuclear', version: '0.3', status: 'reviewing', mode: '第三方', lab: '核电检测部', code: 'SCENE-NUC-3P-001', updatedAt: '2024-12-03', businessMode: 'third-party' },
])

const currentScene = computed(() => scenes.value.find(s => s.id === activeSceneId.value) || scenes.value[0])

const groupedScenes = computed(() => {
  const filtered = scenes.value.filter(s => !treeSearch.value || s.name.includes(treeSearch.value))
  const groups: Record<string, any[]> = {}
  filtered.forEach(s => {
    if (!groups[s.mode]) groups[s.mode] = []
    groups[s.mode].push(s)
  })
  return Object.entries(groups).map(([mode, items]) => ({ mode: mode === '第三方' ? '第三方检测实验室' : '企业内部实验室', items }))
})

function selectScene(id: number) { activeSceneId.value = id }

// ── Pack composition ────────────────────────────────
const packsMap: Record<number, any[]> = {
  1: [
    { id: 'biz', icon: 'OfficeBuilding', name: 'Third-party Lab Pack', en: '第三方实验室', version: '2.1', type: 'biz', enabled: true },
    { id: 'domain', icon: 'Grid', name: 'Food Domain Pack', en: '食品检测领域', version: '3.0', type: 'domain', enabled: true },
    { id: 'std', icon: 'Reading', name: 'Food Standard Pack', en: '食品标准法规', version: '2023', type: 'standard', enabled: true },
    { id: 'report', icon: 'Printer', name: 'Food Report Pack', en: '食品报告模板', version: '4.0', type: 'report', enabled: true },
    { id: 'ai', icon: 'MagicStick', name: 'AI Skill Pack', en: '6 Skills 已启用', version: '1.5', type: 'ai', enabled: true },
  ],
  2: [
    { id: 'biz', icon: 'Monitor', name: 'Internal Lab Pack', en: '内部实验室', version: '1.5', type: 'biz', enabled: true },
    { id: 'domain', icon: 'Operation', name: 'PhysChem Domain Pack', en: '理化检测领域', version: '2.2', type: 'domain', enabled: true },
    { id: 'std', icon: 'Reading', name: 'PhysChem Standard Pack', en: '理化标准', version: '2022', type: 'standard', enabled: true },
    { id: 'report', icon: 'Printer', name: 'Internal Report Pack', en: '内部结果单', version: '2.0', type: 'report', enabled: true },
    { id: 'ai', icon: 'MagicStick', name: 'AI Skill Pack', en: '3 Skills 已启用', version: '1.5', type: 'ai', enabled: true },
  ],
}
const defaultPacks = packsMap[1]
const currentPacks = computed(() => packsMap[activeSceneId.value] || defaultPacks)

// Inject packs into currentScene
const currentSceneWithPacks = computed(() => ({
  ...currentScene.value,
  packs: currentPacks.value,
}))

// ── Helpers ─────────────────────────────────────────
const allDomains = [
  { id: 'food', icon: 'Grid', name: '食品检测', en: 'Food' },
  { id: 'physchem', icon: 'Operation', name: '理化检测', en: 'PhysChem' },
  { id: 'env', icon: 'Location', name: '环境检测', en: 'Environment' },
  { id: 'battery', icon: 'Cpu', name: '新能源', en: 'Battery' },
  { id: 'metrology', icon: 'Aim', name: '几何量', en: 'Metrology' },
  { id: 'nuclear', icon: 'Setting', name: '核电', en: 'Nuclear' },
]

const applicableObjects = ref([
  { id: 1, name: '食品样品', type: '样品', selected: true },
  { id: 2, name: '食品添加剂', type: '样品', selected: true },
  { id: 3, name: '食品接触材料', type: '样品', selected: false },
  { id: 4, name: '进出口食品', type: '特殊', selected: false },
])

function domainColor(d: string) {
  const m: Record<string, string> = { Food: '', PhysChem: 'success', Environment: 'warning', Battery: 'danger', Metrology: 'info', Nuclear: '' }
  return m[d] || 'info'
}
function statusLabel(s: string) {
  return { active: '已启用', draft: '草稿', reviewing: '审核中', disabled: '已停用' }[s] || s
}
function statusTagType(s: string) {
  return { active: 'success', draft: 'info', reviewing: 'warning', disabled: 'danger' }[s] || 'info'
}

// ── Flow ─────────────────────────────────────────────
const flowLanes = [
  {
    name: 'business',
    label: '业务主链 · Third-party Lab Pack',
    nodes: [
      { id: 1, name: '委托受理', icon: 'Document', type: 'business', required: true, hasAi: true, sla: '4h' },
      { id: 2, name: '样品接收', icon: 'Box', type: 'business', required: true, hasAi: false, sla: '2h' },
      { id: 3, name: '检测策划', icon: 'Calendar', type: 'business', required: true, hasAi: true, sla: '8h' },
    ]
  },
  {
    name: 'domain',
    label: '专业检测 · Food Domain Pack',
    nodes: [
      { id: 4, name: '样品前处理', icon: 'Operation', type: 'domain', required: true, hasAi: false, sla: '4h' },
      { id: 5, name: '仪器检测', icon: 'Monitor', type: 'domain', required: true, hasAi: true, sla: '2d' },
      { id: 6, name: '结果处理', icon: 'DataAnalysis', type: 'domain', required: true, hasAi: true, sla: '4h' },
    ]
  },
  {
    name: 'review',
    label: '审核交付',
    nodes: [
      { id: 7, name: 'AI 结果审核', icon: 'MagicStick', type: 'ai', required: false, hasAi: true, sla: '1h' },
      { id: 8, name: '技术审核', icon: 'Finished', type: 'review', required: true, hasAi: false, sla: '8h' },
      { id: 9, name: '报告签发', icon: 'Upload', type: 'business', required: true, hasAi: true, sla: '2h' },
    ]
  }
]

const allFlowNodes = computed(() => flowLanes.flatMap(lane =>
  lane.nodes.map(n => ({
    ...n,
    required: n.required,
    hasAi: n.hasAi,
    lane: lane.label.split('·')[0].trim(),
    typeLabel: { business: '业务节点', domain: '专业节点', ai: 'AI 节点', review: '审核节点' }[n.type] || '',
    role: { 1: '样品管理员', 2: '样品管理员', 3: '检测人员', 4: '检测人员', 5: '检测人员', 6: '检测人员', 7: 'AI 系统', 8: '技术审核员', 9: '样品管理员' }[n.id] || '',
    aiSkill: { 1: '标准智能匹配', 3: '智能任务调度', 5: '结果异常识别', 6: '报告草稿生成', 7: '报告审核 AI', 9: '报告草稿生成' }[n.id] || null,
  }))
))

// ── Matrix ───────────────────────────────────────────
const matrixRows = ref([
  { id: 1, item: '铅 Pb', formula: 'Pb²⁺', object: '食品样品', category: '重金属', stdCode: 'GB 5009.12-2023', stdVer: '2023版', stdNextVer: null, method: 'ICP-MS Pb', methodVer: 'v2.1', limitRule: 'Pb Limit', limitVer: 'v3', reportTpl: '食品报告', reportVer: 'v4', aiSkill: '标准智能匹配', warn: false, hasUpdate: false },
  { id: 2, item: '镉 Cd', formula: 'Cd²⁺', object: '食品样品', category: '重金属', stdCode: 'GB 5009.15-2014', stdVer: '2014版', stdNextVer: '2023版已发布', method: 'ICP-MS Cd', methodVer: 'v1.5', limitRule: 'Cd Limit', limitVer: 'v2', reportTpl: '食品报告', reportVer: 'v4', aiSkill: '标准智能匹配', warn: false, hasUpdate: true },
  { id: 3, item: '砷 As', formula: 'As³⁺/As⁵⁺', object: '食品样品', category: '重金属', stdCode: 'GB 5009.11-2014', stdVer: '2014版', stdNextVer: null, method: 'AAS 氢化物', methodVer: 'v2.0', limitRule: 'As Limit', limitVer: 'v2', reportTpl: '食品报告', reportVer: 'v4', aiSkill: null, warn: false, hasUpdate: false },
  { id: 4, item: '汞 Hg', formula: 'Hg⁰/Hg²⁺', object: '食品样品', category: '重金属', stdCode: 'GB 5009.17-2021', stdVer: '2021版', stdNextVer: null, method: 'CV-AAS', methodVer: 'v3.0', limitRule: 'Hg Limit', limitVer: 'v2', reportTpl: '食品报告', reportVer: 'v4', aiSkill: null, warn: false, hasUpdate: false },
  { id: 5, item: '菌落总数', formula: null, object: '食品样品', category: '微生物', stdCode: 'GB 4789.2-2022', stdVer: '2022版', stdNextVer: null, method: '平板计数法', methodVer: 'v3', limitRule: '乳品菌落限值', limitVer: 'v2', reportTpl: '微生物报告', reportVer: 'v2', aiSkill: null, warn: false, hasUpdate: false },
  { id: 6, item: '大肠菌群', formula: null, object: '食品样品', category: '微生物', stdCode: 'GB 4789.3-2016', stdVer: '2016版', stdNextVer: null, method: 'MPN 法', methodVer: 'v2', limitRule: '大肠菌群限值', limitVer: 'v2', reportTpl: '微生物报告', reportVer: 'v2', aiSkill: null, warn: false, hasUpdate: false },
  { id: 7, item: '蛋白质', formula: null, object: '食品样品', category: '营养成分', stdCode: 'GB 5009.5-2016', stdVer: '2016版', stdNextVer: null, method: '凯氏定氮法', methodVer: 'v2', limitRule: '乳品蛋白标准', limitVer: 'v3', reportTpl: '营养报告', reportVer: 'v3', aiSkill: '报告草稿生成', warn: false, hasUpdate: false },
  { id: 8, item: '脂肪', formula: null, object: '食品样品', category: '营养成分', stdCode: 'GB 5009.6-2016', stdVer: '2016版', stdNextVer: null, method: '索氏提取法', methodVer: 'v1', limitRule: '乳品脂肪标准', limitVer: 'v2', reportTpl: '营养报告', reportVer: 'v3', aiSkill: null, warn: false, hasUpdate: false },
])

const matrixGroups = computed(() => {
  const filtered = matrixRows.value.filter(r =>
    (!matrixSearch.value || r.item.includes(matrixSearch.value)) &&
    (!matrixCategory.value || (
      (matrixCategory.value === 'heavy-metal' && r.category === '重金属') ||
      (matrixCategory.value === 'micro' && r.category === '微生物') ||
      (matrixCategory.value === 'nutrition' && r.category === '营养成分')
    ))
  )
  const cats: Record<string, any[]> = {}
  filtered.forEach(r => {
    if (!cats[r.category]) cats[r.category] = []
    cats[r.category].push(r)
  })
  return Object.entries(cats).map(([category, rows]) => ({ category, rows }))
})

function openMatrixEdit(row: any) { editingRow.value = { ...row }; showMatrixEdit.value = true }

// ── Report templates ──────────────────────────────────
const reportTemplates = ref([
  { id: 1, name: '食品检验报告（标准版）', code: 'RPT-FOOD-STD-001', version: '4.0', enabled: true, cma: true, cnas: true, lang: '中文', scenes: ['重金属', '微生物', '营养成分'], signRule: '检测人 + 技术审核 + 授权签字人' },
  { id: 2, name: '微生物检测专项报告', code: 'RPT-FOOD-MIC-001', version: '2.0', enabled: true, cma: true, cnas: false, lang: '中文', scenes: ['微生物'], signRule: '检测人 + 技术审核' },
  { id: 3, name: '营养标签检测报告', code: 'RPT-FOOD-NUT-001', version: '3.0', enabled: true, cma: true, cnas: false, lang: '中文 / 英文', scenes: ['营养成分'], signRule: '检测人 + 授权签字人' },
  { id: 4, name: 'Food Inspection Report (EN)', code: 'RPT-FOOD-EN-001', version: '2.1', enabled: false, cma: false, cnas: false, lang: '英文', scenes: ['出口样品'], signRule: 'Inspector + Authorized Signatory' },
])

// ── AI Skills ─────────────────────────────────────────
const aiSkills = ref([
  { id: 1, icon: 'Aim', name: '标准智能匹配', en: 'Standard Auto-match', trigger: '委托受理', input: '检测项目 + 场景', output: '推荐标准版本', confirm: true, risk: '低', enabled: true, callCount: 312, adoptRate: 94 },
  { id: 2, icon: 'EditPen', name: '委托解析', en: 'Request Parsing', trigger: '受理阶段', input: '委托文件 PDF', output: '结构化检测计划', confirm: true, risk: '中', enabled: true, callCount: 186, adoptRate: 82 },
  { id: 3, icon: 'DataAnalysis', name: '报告草稿生成', en: 'Report Draft Gen', trigger: '结果处理后', input: '检测数据 + 模板', output: '报告草稿', confirm: true, risk: '中', enabled: true, callCount: 248, adoptRate: 91 },
  { id: 4, icon: 'Finished', name: '报告审核 AI', en: 'Report Review AI', trigger: '技术审核前', input: '报告草稿', output: '审核意见 + 风险标注', confirm: true, risk: '高', enabled: true, callCount: 196, adoptRate: 88 },
  { id: 5, icon: 'Warning', name: '结果异常识别', en: 'Anomaly Detection', trigger: '结果录入时', input: '检测数值', output: '异常标记 + 建议', confirm: false, risk: '低', enabled: true, callCount: 1024, adoptRate: 79 },
  { id: 6, icon: 'Timer', name: '智能任务调度', en: 'Smart Scheduling', trigger: '检测策划时', input: '任务队列 + 设备状态', output: '推荐排程方案', confirm: true, risk: '低', enabled: false, callCount: 82, adoptRate: 85 },
])

const pipelineStages = [
  { name: '委托受理', skills: ['标准智能匹配', '委托解析'] },
  { name: '检测策划', skills: ['智能任务调度'] },
  { name: '检测执行', skills: ['结果异常识别'] },
  { name: '结果处理', skills: ['报告草稿生成'] },
  { name: '技术审核', skills: ['报告审核 AI'] },
]

// ── Forms ─────────────────────────────────────────────
const formModules = ref([
  {
    id: 'apply', label: '申请字段',
    fields: [
      { id: 1, name: '委托单位', type: '文本', required: true, visible: true, defaultVal: '', condition: '' },
      { id: 2, name: '联系人', type: '文本', required: true, visible: true, defaultVal: '', condition: '' },
      { id: 3, name: '联系电话', type: '电话', required: true, visible: true, defaultVal: '', condition: '' },
      { id: 4, name: '委托目的', type: '单选', required: false, visible: true, defaultVal: '例行检测', condition: '' },
      { id: 5, name: '合同编号', type: '文本', required: false, visible: true, defaultVal: '', condition: '业务模式 = 第三方' },
      { id: 6, name: '报价参考', type: '数字', required: false, visible: false, defaultVal: '', condition: '' },
    ]
  },
  {
    id: 'sample', label: '样品字段',
    fields: [
      { id: 1, name: '样品名称', type: '文本', required: true, visible: true, defaultVal: '', condition: '' },
      { id: 2, name: '生产日期', type: '日期', required: false, visible: true, defaultVal: '', condition: '' },
      { id: 3, name: '保质期', type: '文本', required: false, visible: true, defaultVal: '', condition: '' },
      { id: 4, name: '样品状态', type: '单选', required: true, visible: true, defaultVal: '完好', condition: '' },
    ]
  },
  {
    id: 'test', label: '检测字段',
    fields: [
      { id: 1, name: '检测项目', type: '多选', required: true, visible: true, defaultVal: '', condition: '' },
      { id: 2, name: '检测标准', type: '关联', required: true, visible: true, defaultVal: '自动推荐', condition: '' },
      { id: 3, name: '特殊要求', type: '长文本', required: false, visible: true, defaultVal: '', condition: '' },
    ]
  },
  {
    id: 'result', label: '结果字段',
    fields: [
      { id: 1, name: '测定值', type: '数字', required: true, visible: true, defaultVal: '', condition: '' },
      { id: 2, name: '重复次数', type: '数字', required: true, visible: true, defaultVal: '3', condition: '' },
      { id: 3, name: '结果备注', type: '长文本', required: false, visible: true, defaultVal: '', condition: '' },
    ]
  },
  {
    id: 'review', label: '审核字段',
    fields: [
      { id: 1, name: '审核意见', type: '长文本', required: true, visible: true, defaultVal: '', condition: '' },
      { id: 2, name: '审核结论', type: '单选', required: true, visible: true, defaultVal: '', condition: '' },
    ]
  },
])

const currentFormModule = computed(() => formModules.value.find(f => f.id === activeForm.value) || formModules.value[0])
</script>

<style scoped>
/*
  三色系统：
  主色   #1677FF  — 品牌蓝，选中/激活/链接/主按钮
  辅色   #526075  — 蓝灰，次级文字/图标/标签文字
  底色   #0B1220  — 主文字
  背景   #F5F7FA / #F8FAFB / #FFFFFF
  选中底  #EDF4FF
  边框   #D9DEE7
  弱文字  #8A96A6 / #B0B9C6
*/

/* ── Root layout ──────────────────────────────────── */
.studio-root {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 48px - 48px);
  gap: 0;
}

.studio-topbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 14px;
  flex-shrink: 0;
}
.studio-title { font-size: 18px; font-weight: 600; color: #0B1220; margin-bottom: 3px; }
.studio-subtitle { font-size: 12px; color: #526075; }
.studio-topbar-actions { display: flex; gap: 8px; }

.studio-body {
  display: flex;
  gap: 0;
  flex: 1;
  overflow: hidden;
  border: 1px solid #D9DEE7;
  border-radius: 6px;
  background: #fff;
}

/* ── Scene sidebar ────────────────────────────────── */
.scene-sidebar {
  width: 236px;
  flex-shrink: 0;
  border-right: 1px solid #D9DEE7;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #FAFBFC;
}

.sidebar-search {
  padding: 10px 12px;
  border-bottom: 1px solid #D9DEE7;
}

.sidebar-stats {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  font-size: 11px;
  color: #8A96A6;
  border-bottom: 1px solid #F0F2F5;
}
.stat-num { font-weight: 600; color: #0B1220; }
.stat-dot { color: #D9DEE7; }

.scene-group { }
.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px 5px;
  font-size: 10px;
  font-weight: 600;
  color: #B0B9C6;
  letter-spacing: 0.6px;
  text-transform: uppercase;
}
.group-count {
  background: #EEF0F3;
  color: #8A96A6;
  border-radius: 10px;
  padding: 0 6px;
  font-size: 10px;
  font-weight: 600;
}

.scene-node {
  padding: 9px 14px;
  cursor: pointer;
  border-left: 3px solid transparent;
  transition: all .12s;
}
.scene-node:hover { background: #F0F2F5; }
.scene-node.active {
  background: #EDF4FF;
  border-left-color: #1677FF;
}

.scene-node-top {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 5px;
}
.scene-node-status {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.scene-node-status.active { background: #1677FF; }
.scene-node-status.draft { background: #B0B9C6; }
.scene-node-status.reviewing { background: #526075; }
.scene-node-status.disabled { background: #B0B9C6; }

.scene-node-name { font-size: 13px; font-weight: 500; color: #0B1220; }
.scene-node-meta { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
.scene-node-ver { font-size: 10px; color: #8A96A6; }
.scene-node-status-tag { font-size: 10px !important; padding: 0 4px !important; height: 16px !important; line-height: 16px !important; }

/* ── Scene detail ─────────────────────────────────── */
.scene-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px 24px;
  border-bottom: 1px solid #D9DEE7;
  flex-shrink: 0;
}
.detail-name { font-size: 16px; font-weight: 600; color: #0B1220; margin-bottom: 5px; }
.detail-meta { font-size: 12px; color: #8A96A6; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.meta-code { font-family: monospace; color: #526075; font-size: 11px; background: #F0F2F5; padding: 1px 5px; border-radius: 3px; }
.meta-sep { color: #D9DEE7; }
.meta-version { color: #1677FF; font-weight: 500; }
.detail-header-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }

/* ── Pack overview ────────────────────────────────── */
.pack-overview {
  padding: 14px 24px;
  border-bottom: 1px solid #D9DEE7;
  flex-shrink: 0;
  background: #F8FAFB;
}
.pack-overview-label {
  font-size: 11px;
  font-weight: 600;
  color: #526075;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.pack-rail {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.pack-block { display: flex; align-items: center; gap: 8px; }

.pack-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 5px;
  border: 1px solid #D9DEE7;
  background: #fff;
  position: relative;
  min-width: 140px;
}

.pack-card-icon { font-size: 16px; color: #526075; }
.pack-card-body { flex: 1; }
.pack-card-name { font-size: 11px; font-weight: 600; color: #0B1220; }
.pack-card-en { font-size: 10px; color: #8A96A6; }
.pack-card-ver { font-size: 10px; font-family: monospace; color: #1677FF; margin-top: 2px; font-weight: 500; }
.pack-card-status {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 700;
  flex-shrink: 0;
}
.pack-card-status.on { background: #1677FF; color: white; }
.pack-card-status.off { background: #D9DEE7; color: #8A96A6; }

.pack-plus { font-size: 16px; color: #B0B9C6; font-weight: 700; }

.pack-result {
  padding: 8px 14px;
  border: 1px dashed #D9DEE7;
  border-radius: 5px;
  background: #fff;
}
.pack-result-label { font-size: 11px; font-weight: 600; color: #1677FF; margin-bottom: 4px; }
.pack-result-stats { font-size: 11px; color: #526075; display: flex; gap: 10px; }

/* ── Tabs ─────────────────────────────────────────── */
.detail-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0 24px;
}
.detail-tabs :deep(.el-tabs__header) { flex-shrink: 0; margin-bottom: 0; }
.detail-tabs :deep(.el-tabs__content) { flex: 1; overflow-y: auto; }
.detail-tabs :deep(.el-tab-pane) { height: 100%; }

.tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 16px;
  background: #E6EBF5;
  color: #526075;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 600;
  padding: 0 5px;
  margin-left: 5px;
  vertical-align: middle;
}


.tab-content { padding: 18px 0 24px; }

/* ── Basic form ───────────────────────────────────── */
.form-section { margin-bottom: 24px; }
.form-section-title {
  font-size: 12px;
  font-weight: 600;
  color: #526075;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #F0F2F5;
}
.form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; max-width: 700px; }
.form-grid-2 :deep(.el-form-item) { margin-bottom: 0; }

.selector-label { font-size: 12px; color: #526075; margin-bottom: 8px; font-weight: 500; }

.mode-domain-selector { display: flex; flex-direction: column; gap: 16px; }
.mode-radios { display: flex; gap: 10px; }
.mode-radios :deep(.el-radio) { display: flex; flex-direction: column; align-items: flex-start; height: auto; padding: 10px 14px; border-radius: 4px; }
.mode-radio-label { font-size: 13px; font-weight: 500; color: #0B1220; }
.mode-radio-sub { font-size: 11px; color: #8A96A6; margin-top: 2px; }

.domain-chips { display: flex; gap: 8px; flex-wrap: wrap; }
.domain-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 14px;
  border: 1px solid #D9DEE7;
  border-radius: 5px;
  cursor: pointer;
  transition: all .12s;
  min-width: 72px;
}
.domain-chip:hover { border-color: #1677FF; background: #F8FBFF; }
.domain-chip.active { border-color: #1677FF; background: #EDF4FF; }
.domain-chip-icon { font-size: 18px; margin-bottom: 4px; }
.domain-chip-name { font-size: 11px; font-weight: 500; color: #0B1220; }
.domain-chip-en { font-size: 10px; color: #8A96A6; }

.object-selector { display: flex; gap: 8px; flex-wrap: wrap; }
.object-chip {
  display: flex;
  align-items: center;
  padding: 5px 10px;
  border: 1px solid #D9DEE7;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  color: #526075;
  transition: all .12s;
}
.object-chip:hover { border-color: #1677FF; }
.object-chip.active { border-color: #1677FF; background: #EDF4FF; color: #1677FF; }

/* ── Flow diagram ─────────────────────────────────── */
.flow-diagram {
  background: #F8FAFB;
  border: 1px solid #D9DEE7;
  border-radius: 5px;
  padding: 16px;
  margin-bottom: 16px;
}
.flow-lane-wrap { margin-bottom: 12px; }
.flow-lane-wrap:last-child { margin-bottom: 0; }

.flow-lane-label {
  font-size: 10px;
  font-weight: 600;
  color: #8A96A6;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  margin-bottom: 8px;
}
.flow-lane-track { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }

.flow-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 8px 12px;
  border-radius: 5px;
  border: 1.5px solid;
  cursor: pointer;
  min-width: 80px;
  position: relative;
  transition: all .12s;
}
.flow-step.business { background: #F8FAFB; border-color: #D9DEE7; }
.flow-step.domain { background: #F8FAFB; border-color: #D9DEE7; }
.flow-step.review { background: #F8FAFB; border-color: #D9DEE7; }
.flow-step.ai { background: #EDF4FF; border-color: #1677FF; }
.flow-step:hover { transform: translateY(-2px); box-shadow: 0 3px 10px rgba(0,0,0,.06); }
.flow-step.selected { box-shadow: 0 0 0 2px #1677FF; }

.flow-step-icon { font-size: 14px; color: #526075; }
.flow-step-name { font-size: 11px; font-weight: 500; color: #0B1220; text-align: center; }
.flow-step-badges { display: flex; gap: 3px; flex-wrap: wrap; justify-content: center; }
.flow-badge { font-size: 9px; padding: 1px 4px; border-radius: 2px; font-weight: 600; }
.flow-badge.ai { background: #1677FF; color: white; }
.flow-badge.sla { background: #EBEEF2; color: #526075; }
.flow-step-required {
  position: absolute;
  top: -6px; right: -4px;
  background: #526075; color: white;
  font-size: 9px; border-radius: 2px; padding: 0 3px;
}
.flow-arrow { color: #B0B9C6; font-size: 14px; }

.flow-table-wrap { }
.flow-table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }

/* ── Matrix ───────────────────────────────────────── */
.matrix-toolbar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }

.matrix-legend {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 7px 12px;
  background: #F8FAFB;
  border: 1px solid #D9DEE7;
  border-radius: 4px;
  margin-bottom: 12px;
}
.legend-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #526075; }
.legend-item.warn { color: #526075; }
.legend-item.upd { color: #1677FF; }
.legend-dot {
  width: 8px; height: 8px; border-radius: 2px; display: inline-block;
}
.legend-dot.std    { background: #1677FF; }
.legend-dot.method { background: #526075; }
.legend-dot.limit  { background: #8A96A6; }
.legend-dot.report { background: #B0B9C6; }
.legend-dot.ai     { background: #1677FF; opacity: .4; }

.matrix-table-wrap { overflow: auto; border: 1px solid #D9DEE7; border-radius: 5px; }

.matrix-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.matrix-table thead tr {
  background: #F8FAFB;
}

.matrix-table th {
  padding: 8px 10px;
  text-align: left;
  border-bottom: 1px solid #D9DEE7;
  border-right: 1px solid #F0F2F5;
  vertical-align: top;
  white-space: nowrap;
  font-weight: 500;
  color: #526075;
  font-size: 12px;
}
.matrix-table th:last-child { border-right: none; }

.th-inner { display: flex; align-items: center; gap: 4px; margin-bottom: 2px; }
.th-sub { font-size: 10px; color: #B0B9C6; font-weight: 400; }
.col-dot {
  width: 7px; height: 7px; border-radius: 1px; display: inline-block; flex-shrink: 0;
}
.col-dot.std    { background: #1677FF; }
.col-dot.method { background: #526075; }
.col-dot.limit  { background: #8A96A6; }
.col-dot.report { background: #B0B9C6; }
.col-dot.ai     { background: #1677FF; opacity: .4; }

.col-item { width: 120px; }
.col-obj { width: 90px; }
.col-std { width: 160px; }
.col-method { width: 140px; }
.col-limit { width: 130px; }
.col-report { width: 130px; }
.col-ai { width: 130px; }
.col-ops { width: 90px; }

.matrix-group-row td {
  background: #F3F5F8;
  padding: 5px 10px;
  border-top: 1px solid #D9DEE7;
  border-bottom: 1px solid #D9DEE7;
}
.matrix-group-label {
  font-size: 11px;
  font-weight: 600;
  color: #526075;
  letter-spacing: 0.4px;
  text-transform: uppercase;
}
.matrix-group-count {
  font-size: 11px;
  color: #B0B9C6;
  margin-left: 8px;
}

.matrix-data-row td {
  padding: 8px 10px;
  border-bottom: 1px solid #F0F2F5;
  border-right: 1px solid #F0F2F5;
  vertical-align: middle;
}
.matrix-data-row td:last-child { border-right: none; }
.matrix-data-row:hover td { background: #F8FBFF; }
.matrix-data-row.has-update td { background: #F5F9FF; }
.matrix-data-row.has-warn td { background: #F5F7FA; }

.cell-item {}
.item-name { font-size: 13px; font-weight: 500; color: #0B1220; }
.item-formula { font-size: 10px; color: #8A96A6; font-style: italic; margin-top: 1px; }

.ver-chip {
  display: inline-flex;
  flex-direction: column;
  padding: 3px 7px;
  border-radius: 3px;
  border: 1px solid;
}
.ver-chip.std, .ver-chip.method, .ver-chip.limit, .ver-chip.report {
  background: #F5F7FA;
  border-color: #D9DEE7;
}

.ver-code { font-size: 11px; font-weight: 500; color: #0B1220; font-family: monospace; }
.ver-ver { font-size: 10px; color: #8A96A6; margin-top: 1px; }

.upd-hint { font-size: 10px; color: #1677FF; margin-top: 4px; display: flex; align-items: center; gap: 3px; }

.ai-skill-cell {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #1677FF;
}
.ai-dot { width: 6px; height: 6px; background: #1677FF; border-radius: 50%; flex-shrink: 0; }
.ai-name { font-size: 11px; }
.cell-empty { color: #D9DEE7; font-size: 14px; }

.cell-ops { white-space: nowrap; }

/* ── Report templates ─────────────────────────────── */
.report-tpl-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.report-tpl-card {
  border: 1px solid #D9DEE7;
  border-radius: 5px;
  padding: 14px 16px;
  background: #fff;
}
.report-tpl-card:hover { border-color: #1677FF; }

.rtpl-header { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px; }
.rtpl-icon { font-size: 24px; flex-shrink: 0; }
.rtpl-info { flex: 1; }
.rtpl-name { font-size: 13px; font-weight: 500; color: #0B1220; margin-bottom: 2px; }
.rtpl-code { font-size: 11px; color: #8A96A6; font-family: monospace; }

.rtpl-meta { display: flex; align-items: center; gap: 4px; margin-bottom: 8px; }
.rtpl-lang { font-size: 11px; color: #8A96A6; margin-left: 6px; }

.rtpl-scenes { font-size: 12px; margin-bottom: 6px; display: flex; align-items: center; flex-wrap: wrap; gap: 3px; }
.rtpl-scene-label { color: #8A96A6; }

.rtpl-sign { font-size: 11px; color: #526075; }
.sign-label { color: #8A96A6; }

/* ── AI Skills ────────────────────────────────────── */
.ai-pipeline {
  background: #F8FAFB;
  border: 1px solid #D9DEE7;
  border-radius: 5px;
  padding: 14px;
  margin-bottom: 16px;
}
.ai-pipeline-label { font-size: 11px; font-weight: 600; color: #526075; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
.ai-pipeline-track { display: flex; gap: 0; overflow-x: auto; }

.pipe-stage {
  flex: 1;
  min-width: 110px;
  padding: 8px 10px;
  border-right: 1px solid #D9DEE7;
}
.pipe-stage:last-child { border-right: none; }
.pipe-stage-name { font-size: 11px; font-weight: 500; color: #526075; margin-bottom: 8px; text-align: center; }
.pipe-skills { display: flex; flex-direction: column; gap: 5px; }
.pipe-skill {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  background: #EDF4FF;
  color: #1677FF;
  border: 1px solid #BAD4FF;
  padding: 2px 6px;
  border-radius: 3px;
  white-space: nowrap;
}
.pipe-skill.disabled { background: #F5F7FA; color: #B0B9C6; border-color: #D9DEE7; }

.ai-skill-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }

.ai-skill-card {
  border: 1px solid #D9DEE7;
  border-radius: 5px;
  padding: 14px;
  transition: all .12s;
}
.ai-skill-card:hover { border-color: #1677FF; }
.ai-skill-card.disabled { opacity: .55; background: #F8FAFB; }

.ask-header { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 12px; }
.ask-icon {
  width: 34px; height: 34px;
  border-radius: 5px;
  display: flex; align-items: center; justify-content: center;
  background: #EDF4FF;
  color: #1677FF;
  flex-shrink: 0;
}
.ask-info { flex: 1; }
.ask-name { font-size: 13px; font-weight: 500; color: #0B1220; margin-bottom: 2px; }
.ask-en { font-size: 11px; color: #8A96A6; }

.ask-flow {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  background: #F8FAFB;
  border-radius: 4px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}
.ask-io { display: flex; flex-direction: column; }
.io-label { font-size: 9px; color: #B0B9C6; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
.io-val { font-size: 11px; color: #0B1220; font-weight: 500; }
.ask-arrow { color: #B0B9C6; font-size: 12px; }

.ask-footer { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.ask-stat { font-size: 11px; color: #8A96A6; margin-left: auto; }

/* ── Dynamic forms ────────────────────────────────── */
.forms-layout { display: flex; gap: 0; border: 1px solid #D9DEE7; border-radius: 5px; overflow: hidden; }

.forms-nav {
  width: 130px;
  flex-shrink: 0;
  border-right: 1px solid #D9DEE7;
  background: #FAFBFC;
}
.form-nav-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  font-size: 13px;
  color: #526075;
  cursor: pointer;
  border-bottom: 1px solid #F0F2F5;
}
.form-nav-item:hover { background: #F0F2F5; }
.form-nav-item.active { background: #EDF4FF; color: #1677FF; font-weight: 500; }
.form-nav-count {
  background: #E6EBF5;
  color: #8A96A6;
  border-radius: 10px;
  font-size: 10px;
  padding: 0 5px;
  font-weight: 600;
}

.forms-fields { flex: 1; padding: 14px 16px; }
.fields-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }

.fields-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.fields-table th {
  text-align: left;
  padding: 7px 10px;
  border-bottom: 1px solid #D9DEE7;
  font-size: 11px;
  font-weight: 500;
  color: #526075;
  background: #F8FAFB;
}
.fields-table td {
  padding: 8px 10px;
  border-bottom: 1px solid #F0F2F5;
  vertical-align: middle;
}
.fields-table tr:hover td { background: #F8FBFF; }
.field-name-cell { font-weight: 500; color: #0B1220; }
</style>
