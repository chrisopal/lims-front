# LIMS Architecture Spec v2.0

**产品代号**：Composable AI-Native Laboratory Operations Platform
**版本**：v2.0
**状态**：Architecture Upgrade Baseline
**目标读者**：产品负责人、架构师、前后端工程师、测试、AI 工程师、Codex
**技术主线**：Java 21 + Spring Boot + Spring Modulith + Vue 3 + TypeScript + Element Plus + Python AI Services

---

## 0. v2.0 升级结论

v2.0 对 v1.0 做一个核心收敛：

> **Scenario Pack（场景包）成为产品唯一的业务可发布配置单元。**

v1 中的 Business Mode Pack、Domain Pack、Standard Pack、Report Pack、AI Skill Pack 等概念，不再作为运行时由客户直接拼装的一级产品对象，而被重新分为两类：

1. **Capability Module（能力模块）**：由 Java / 前端代码提供可执行能力、领域服务、Node Type、Executor、UI Renderer、Adapter 等；
2. **Reusable Asset（可复用业务资产）**：检测项、法律法规、标准、方法、限值规则、公式、表单、报告模板、资质策略、AI Skill 等可版本化资产；
3. **Scenario Pack（场景包）**：引用能力和资产，定义“某一检测业务场景如何配置、如何发布、如何运行”。

系统的产品主链由此变为：

```text
Capability Modules + Reusable Assets
                ↓
        Scenario Pack Draft
                ↓
      Guided Configuration
                ↓
    Validate → Ready → Publish
                ↓
      Immutable Scenario Snapshot
                ↓
       Published Scenario Catalog
                ↓
      Request / Application selects scenario
                ↓
     Process Instance + Node Runtime
                ↓
Human / Java / Rule / Integration / AI
```

这一改变解决 v1 的三个问题：

- “Pack”层次过多，产品用户难以理解究竟应该配置哪一个 Pack；
- 前端 Composition Studio 仍偏“Tab 配置”，没有围绕场景生命周期组织；
- Workflow 主要是配置定义，缺少对“节点如何真正执行、如何呈现专业 UI”的一等建模。

---

# 1. v2 核心架构原则

## 1.1 Stable Core + Capability + Asset + Scenario

Core 仍然只认识通用实验室语义：

```text
TestRequest
TestSubject
Sample
TestPlan
TestTask
RawRecord
TestResult
ReviewCase
Report
Equipment
Qualification
```

Core 不写：

```java
if (food) ...
if (environment) ...
if (metrology) ...
if (battery) ...
```

行业差异通过：

- Capability Module；
- Scenario Pack；
- Metadata / Dynamic Form；
- Workflow Definition；
- Rule / Formula；
- Standards / Methods / Limits；
- Report Template；
- UI Extension；
- Integration Adapter；
- AI Skill；

进行表达。

## 1.2 Scenario First

用户不再先选择“Business Mode + Domain Pack + Standard Pack”。

设计态首先创建一个场景，例如：

- 第三方食品理化检测；
- 环境水质现场采样与实验室分析；
- 企业内部三坐标几何量检测；
- 客户现场尺寸检测；
- 新能源电池循环寿命测试。

场景包本身包含：

```text
业务模式
检测对象
检测项
法律法规/标准
检测方法
限值/公式
检测流程
动态表单
资源与资质
报告模板
AI Skill
UI Runtime Policy
```

## 1.3 Published is Immutable

发布后的 `ScenarioPackVersion` 不允许直接编辑。

```text
v1.2.0 PUBLISHED
     ↓ 修改
Create New Version
     ↓
v1.3.0 DRAFT
```

历史委托必须永远锁定创建时使用的：

```text
scenarioPackVersionId
scenarioSnapshotId
workflowDefinitionVersionId
standardVersionIds
methodVersionIds
rule/formula versions
reportTemplateVersionId
```

## 1.4 Design-time 与 Runtime 分离

```text
Design Time
Scenario Pack Studio
Workflow Designer
Asset Managers
        ↓
Publish Compiler / Snapshot Builder
        ↓
Runtime
Scenario Resolver
Process Engine
Node Runtime
Work Item Runtime
```

运行态禁止直接读取仍在编辑的 Draft。

## 1.5 Process Orchestration ≠ Domain Logic

流程引擎负责：

- 当前节点；
- 分支与路由；
- Human Task；
- 等待/恢复；
- SLA / Timer；
- Retry / Incident；
- 子流程；
- 节点执行编排。

领域代码负责：

- 样品接收；
- 样品拆分；
- 检测任务生成；
- 标准版本锁定；
- 结果提交；
- 规则判定；
- 报告发布等领域不变量。

流程引擎不能直接绕过 Application Service 更新核心表。

---

# 2. v2 逻辑架构

```mermaid
flowchart TB
  UI[Applications\nScenario Pack Studio | Request Composer | My Work | Domain Workbenches]

  STUDIO[Design-time Configuration\nScenario Pack | Workflow | Assets | Publish]
  SCN[Scenario Registry\nDraft | Version | Validate | Publish | Activate]
  SNAP[Immutable Scenario Snapshot]

  ASSET[Reusable Asset Registries\nTest Item | Regulation | Standard | Method | Limit | Formula | Form | Report | AI Skill]
  CAP[Capability Registry\nNode Types | Executors | Domain Capabilities | Adapters]
  UIREG[UI Extension Registry\nSetup Renderer | Node Config Renderer | Runtime Renderer]

  RUNTIME[Runtime Orchestration\nScenario Resolver | Process Engine | Node Runtime | Human Work Item]
  CORE[Laboratory Core\nRequest | Subject | Sample | Plan | Task | Result | Review | Report]
  KERNEL[Kernel\nTenant | IAM | Audit | Event | Document | Rule | Formula | Metadata]
  INT[Integration / Instrument Adapters]
  AI[AI Runtime / Skill / Model Gateway / Eval]

  UI --> STUDIO
  STUDIO --> SCN
  STUDIO --> ASSET
  STUDIO --> CAP
  STUDIO --> UIREG
  SCN --> SNAP
  SNAP --> RUNTIME
  CAP --> RUNTIME
  UIREG --> UI
  RUNTIME --> CORE
  RUNTIME --> INT
  RUNTIME --> AI
  CORE --> KERNEL
```

---

# 3. 产品对象重新命名

## 3.1 Capability Module

能力模块是代码级产品能力，随平台版本部署，原则上不允许租户上传任意不可信 JAR 热加载。

示例：

```text
sample-management
field-sampling
onsite-inspection
metrology-measurement
physchem-execution
technical-review
report-generation
instrument-acquisition
```

每个 Capability Module 可以注册：

- Domain Capability；
- Node Type；
- Node Executor；
- Config Schema；
- Runtime Input/Output Schema；
- UI Renderer Key；
- Adapter；
- Validation Hook；
- Event Handler。

## 3.2 Reusable Asset

业务资产拥有独立菜单和生命周期：

```text
TestItem / TestItemVersion
Regulation / RegulationVersion
Standard / StandardVersion
Method / MethodVersion
LimitRule / LimitRuleVersion
Formula / FormulaVersion
MetadataSchema / Version
ReportTemplate / Version
QualificationPolicy / Version
AiSkill / Version
```

场景包只做“引用与绑定”，不复制公共资产。

## 3.3 Scenario Pack

Scenario Pack 是用户真正看到、编辑、校验、发布和运行的产品单元。

定义：

> 一个 Scenario Pack 是一个版本化、可发布、可导入导出的声明式检测场景定义，它描述该场景所需的配置步骤、业务对象、检测能力、合规知识、流程、表单、资源规则、报告和 AI 能力，并在发布时编译为不可变 Snapshot。

---

# 4. Scenario Pack 生命周期

## 4.1 Pack Identity 与 Version

```text
ScenarioPack
  key = third-party-food-physchem
  name = 第三方食品理化检测

ScenarioPackVersion
  1.0.0 DRAFT
  1.0.0 PUBLISHED
  1.1.0 DRAFT
```

`ScenarioPack` 是长期身份，`ScenarioPackVersion` 是可发布版本。

## 4.2 状态机

```text
DRAFT
  ↓ validate
VALIDATING
  ├── error → DRAFT
  ↓ success
READY
  ↓ publish
PUBLISHED
  ↓
DEPRECATED
  ↓
RETIRED
```

约束：

- `PUBLISHED / DEPRECATED / RETIRED` 都不可编辑；
- 修改已发布场景必须创建新版本；
- DEPRECATED 允许已有实例继续运行，可禁止新建委托；
- RETIRED 不允许新建实例，仅保留历史解析能力；
- Published Snapshot 永不被后续资产升级覆盖。

## 4.3 Publish 与 Activation 分离

`PUBLISHED` = 已进入平台场景目录；

`ScenarioActivation` = 某租户/实验室允许在运行态选择该版本。

```text
Published Scenario
       ↓
Activation Scope
Tenant / LabEntity / Org / Effective Time
       ↓
Request Composer 可见
```

---

# 5. Guided Configuration Model

场景配置 UI 不再固定为若干 Tab，而由 `setup.steps` 驱动。

一个典型顺序：

```text
01 基础信息
02 业务模式与检测对象
03 检测项
04 法律法规与标准
05 检测方法 / 限值
06 检测流程
07 动态表单
08 资源与资质
09 报告
10 AI能力
11 发布检查
```

环境场景可以改为：

```text
基础信息
→ 检测对象
→ 监测项目
→ 法规标准
→ 采样方案
→ 现场采样流程
→ 实验室流程
→ Chain of Custody
→ 报告
→ 发布
```

每个 Setup Step 定义：

```text
key
name
order
dependsOn
stepType
required
rendererKey?
route?
completionValidator
permission
helpText
```

Step 类型：

```text
BUILTIN
ASSET_BINDING
WORKFLOW
FORM_SCHEMA
CAPABILITY_BINDING
RESOURCE_POLICY
AI_SKILL_BINDING
CUSTOM_RENDERER
VALIDATION
```

专业管理页面仍然独立存在。Scenario Pack Studio 可以带场景上下文跳转：

```text
/standards?scenarioVersionId=...&step=standards&returnTo=...
```

完成后“保存并返回场景包”。

---

# 6. Scenario Manifest v2

YAML / JSON 是：

- Git-friendly；
- Import / Export；
- 产品交付和版本管理格式；
- 自动化生成格式。

但数据库不只保存 YAML Blob，必须规范化保存 Draft 与 Binding。

示例：

```yaml
apiVersion: lims.huixin.ai/v2
kind: ScenarioPack
metadata:
  key: third-party-food-physchem
  name: 第三方食品理化检测
  version: 1.2.0
  labels:
    domain: food
    serviceMode: third-party

spec:
  businessMode: THIRD_PARTY

  requiredCapabilities:
    - lab.request
    - lab.sample
    - physchem.execution
    - report.generation

  setup:
    steps:
      - key: basic
        name: 基础信息
        order: 10
        stepType: BUILTIN
        required: true
        rendererKey: scenario-basic-editor

      - key: test-items
        name: 检测项
        order: 30
        stepType: ASSET_BINDING
        assetType: TEST_ITEM
        required: true
        route: /assets/test-items
        completionValidator: scenario.test-items.non-empty

      - key: standards
        name: 法律法规与标准
        order: 40
        stepType: ASSET_BINDING
        assetType: COMPLIANCE_REFERENCE
        required: true
        route: /assets/standards
        completionValidator: scenario.compliance.complete

      - key: workflow
        name: 检测流程
        order: 60
        stepType: WORKFLOW
        required: true
        route: /workflow/designer
        completionValidator: workflow.publishable

  subjects:
    allowedTypes:
      - FOOD_SAMPLE

  testCapabilities:
    - itemRef: test-item:pb
      applicableSubjectTypes: [FOOD_SAMPLE]
      standardBindings:
        - standardVersionRef: GB-5009.12:2023
          methodVersionRef: ICP-MS-PB:2.0.0
          limitRuleVersionRef: FOOD-PB-LIMIT:3.1.0
      reportTemplateVersionRef: FOOD-PHYSCHEM-REPORT:4.0.0

  workflow:
    definitionRef: workflow:food-thirdparty-main:3.0.0

  forms:
    request: form:food-request:2.1.0
    subject: form:food-sample:3.0.0

  reports:
    defaultTemplateRef: report:food-physchem:4.0.0

  aiSkills:
    - skillRef: ai:standard-match:1.2.0
      trigger: REQUEST_PLANNING
      humanApprovalRequired: true

  policies:
    scenarioVersionLock: true
    standardVersionLock: true
    publishedImmutable: true
```

完整 Schema 见 `schemas/scenario-pack-v2.schema.json`。

---

# 7. Publish Compiler 与 Scenario Snapshot

发布不是简单把状态改成 `PUBLISHED`。

Publish Pipeline：

```text
Draft
 ↓
Schema Validation
 ↓
Dependency Resolution
 ↓
Capability Resolution
 ↓
Asset Version Resolution
 ↓
Workflow Validation
 ↓
UI Renderer Validation
 ↓
Security / Permission Validation
 ↓
Cross-reference Validation
 ↓
Build Snapshot
 ↓
SHA-256 Hash
 ↓
Persist Publish Record
 ↓
PUBLISHED
```

Snapshot 至少包含：

```text
Scenario identity/version
Resolved capability descriptors
Resolved asset version refs + hashes
Resolved workflow definition
Resolved metadata schemas
Resolved report templates
Resolved AI skills
UI renderer keys
Resource policies
Validation profile
Snapshot hash
```

运行态只读取 Snapshot。

---

# 8. Workflow Definition v2

## 8.1 Canonical Workflow DSL

设计态保存自己的中立 DSL，不把产品架构绑定到某个 BPMN 厂商。

```yaml
workflow:
  key: environment-water-main
  version: 2.0.0
  nodes:
    - key: intake
      nodeType: REQUEST_ACCEPTANCE
      name: 委托受理

    - key: field-sampling
      nodeType: FIELD_SAMPLING
      name: 现场采样
      config:
        requireGps: true
        requirePhotos: true
        custodyRequired: true

    - key: lab-test
      nodeType: LAB_TEST_EXECUTION
      name: 实验室检测

  edges:
    - from: intake
      to: field-sampling
    - from: field-sampling
      to: lab-test
```

## 8.2 Process Definition 与 Instance

```text
WorkflowDefinitionDraft
      ↓ publish / scenario snapshot
WorkflowDefinitionVersion
      ↓ instantiate
ProcessInstance
      ↓
ProcessNodeInstance
      ↓
NodeExecution / WorkItem
```

## 8.3 流程引擎边界

定义 `ProcessEnginePort`，产品 DSL 不依赖具体 runtime。

```java
public interface ProcessEnginePort {
    ProcessInstanceId start(StartProcessCommand command);
    void signal(SignalProcessCommand command);
    void cancel(CancelProcessCommand command);
    ProcessView get(ProcessInstanceId id);
}
```

底层实现可以通过技术 Spike 选择：

- 自研受控 Graph/State Runtime；或
- 嵌入式 Java Workflow Engine Adapter。

无论选择哪一种，Scenario DSL、Node SPI、数据库业务契约不改变。

---

# 9. Node Type 与 Node Runtime

## 9.1 两类 Node

### Flow-control Node

```text
START
END
EXCLUSIVE_GATEWAY
PARALLEL_GATEWAY
TIMER
EVENT_WAIT
SUBPROCESS
```

### Semantic Business Node

```text
REQUEST_ACCEPTANCE
SAMPLING_PLAN
FIELD_SAMPLING
SAMPLE_RECEIPT
SAMPLE_PREPARATION
LAB_TEST_EXECUTION
ONSITE_INSPECTION
METROLOGY_MEASUREMENT
TECHNICAL_REVIEW
REPORT_GENERATION
REPORT_REVIEW
REPORT_RELEASE
```

业务节点来自 Capability Registry，而不是前端常量。

## 9.2 Execution Mode

每个 NodeType 声明执行模式：

```text
HUMAN_TASK
JAVA_SERVICE
RULE
INTEGRATION
AI
SUBPROCESS
TIMER_EVENT
```

`FIELD_SAMPLING` 通常是 HUMAN_TASK，但可以由 Java Handler 在进入节点时创建现场任务和受控数据对象。

## 9.3 Node Executor SPI

```java
public interface NodeExecutor {
    NodeTypeKey nodeType();

    NodeStartResult start(NodeExecutionContext context);

    NodeResumeResult resume(
        NodeExecutionContext context,
        NodeSignal signal
    );
}
```

返回：

```text
COMPLETED
WAITING
FAILED
```

`WAITING` 可以引用：

- Human Work Item；
- Integration Job；
- AI Job；
- Timer；
- External Event。

## 9.4 NodeExecutionContext

必须包含：

```text
tenantId
labEntityId
scenarioPackVersionId
scenarioSnapshotId
requestId
processInstanceId
nodeInstanceId
nodeConfig
resolvedInputs
currentActor
traceId
```

Executor 不允许绕过权限或跨模块直接修改他域 Repository。

---

# 10. Human Task 与专业工作面

Human Node 进入后生成 `WorkItem`：

```text
WorkItem
- id
- processInstanceId
- nodeInstanceId
- workType
- assignee / candidate roles
- dueAt
- status
- runtimeRendererKey
- domainObjectRefs
```

例如 `FIELD_SAMPLING` 的运行 UI：

```text
现场采样工作台
- 采样任务
- 采样点 / GPS
- 采样时间
- 现场人员
- 现场环境
- 采样容器
- 保存条件
- 现场仪器
- 照片
- Chain of Custody
```

`ONSITE_INSPECTION` 可以加载：

```text
现场检测工作台
- 客户现场
- 检测对象
- 人员/设备派遣
- 方法/SOP
- 原始记录
- 照片/附件
- 结果
```

因此专业 UI 是 Node Capability 的一部分，而不是在 Core 页面里写行业 if/else。

---

# 11. UI Extension Registry v2

后端 Capability 与前端 Renderer 成对注册：

```text
Node Type
  ├── Backend Executor / Handler
  ├── Config Schema
  ├── Runtime Schema
  ├── Node Config Renderer Key
  └── Runtime Workbench Renderer Key
```

前端扩展类型：

```text
SCENARIO_SETUP_RENDERER
NODE_CONFIG_RENDERER
NODE_RUNTIME_RENDERER
SUBJECT_EDITOR
RESULT_EDITOR
ASSET_BINDING_RENDERER
DASHBOARD_WIDGET
```

示例：

```yaml
nodeType: FIELD_SAMPLING
executionMode: HUMAN_TASK
runtime:
  executorKey: fieldSamplingExecutor
ui:
  configRendererKey: field-sampling-node-config
  runtimeRendererKey: field-sampling-workbench
```

安全要求：

- YAML 只能引用平台已注册 Renderer Key；
- 不允许 YAML 指定任意远程 JS URL；
- UI 权限不替代后端授权；
- 通用 Metadata Form 是兜底 Renderer；
- 专业 Renderer 必须声明可兼容的 schema/version。

---

# 12. Script Policy

v2 明确禁止在场景 YAML 中直接保存任意可执行 JavaScript / Groovy / SQL。

允许：

```yaml
executor:
  kind: JAVA_SERVICE
  key: fieldSamplingExecutor
```

或受控表达式：

```yaml
condition:
  expressionLanguage: CEL
  expression: "result.value > limit.max"
```

若未来支持 Script Node，必须满足：

- Sandbox；
- CPU / 内存 / Timeout；
- 无任意网络和文件访问；
- 白名单 Tool API；
- 版本化；
- 审计；
- 签名；
- 禁止直接数据库访问。

MVP 不启用任意脚本节点。

---

# 13. Runtime Request Binding

运行态的新建委托/申请不再先选择 Business Mode，而是：

```text
选择已发布且已激活的 Scenario
       ↓
读取 Scenario Snapshot
       ↓
渲染 Request Form / Subject Form / Test Capability
       ↓
Create TestRequest
       ↓
锁定 ScenarioPackVersion + Snapshot
       ↓
创建 ProcessInstance
```

`lab_test_request` 增加：

```text
scenario_pack_id
scenario_pack_version_id
scenario_snapshot_id
process_instance_id
```

任何后续 v1.3 的发布都不能改变使用 v1.2 创建的委托。

---

# 14. Asset Binding 模型

一个检测能力不再只是 Test Item：

```text
TestItem
  × Applicable Subject
  × Regulation/Standard Version
  × Method Version
  × Limit Rule Version
  × Formula Version
  × Required Equipment Capability
  × Required Person Qualification
  × Report Template Version
  × Optional AI Skill Version
```

绑定必须在发布前完成一致性校验。

例如：

```text
铅 Pb
→ FOOD_SAMPLE
→ GB 5009.12-2023
→ ICP-MS Pb v2
→ Food Pb Limit v3
→ Food Report v4
→ standard-match v1.2
```

---

# 15. 法律法规 / 标准 / 方法资产

v2 将“法律法规”正式纳入 Knowledge Asset：

```text
RegulatoryDocument
- LAW
- REGULATION
- STANDARD
- GUIDANCE
- ENTERPRISE_STANDARD
- PROCEDURE
```

对工程实现可保留专用聚合：

```text
Regulation / RegulationVersion
Standard / StandardVersion
Method / MethodVersion
```

场景通过统一的 `ComplianceReferenceBinding` 引用。

历史运行锁定具体版本，不使用 `latest`。

---

# 16. 数据库 v2 新增核心对象

新增逻辑 Schema：`scenario`、`process`。

核心表：

```text
scn_scenario_pack
scn_scenario_pack_version
scn_setup_step
scn_asset_binding
scn_capability_binding
scn_validation_run
scn_validation_issue
scn_scenario_snapshot
scn_publish_record
scn_activation

proc_workflow_definition
proc_workflow_version
proc_workflow_node
proc_workflow_edge
proc_process_instance
proc_node_instance
proc_node_execution
proc_work_item
proc_process_incident

sys_node_type_descriptor
sys_ui_extension_descriptor
```

现有业务表增强：

```text
lab_test_request
+ scenario_pack_id
+ scenario_pack_version_id
+ scenario_snapshot_id
+ process_instance_id

lab_test_task
+ process_node_instance_id
```

完整 DDL 见 `sql/V2__scenario_workflow_runtime.sql`。

---

# 17. API v2 重点

## Scenario Design-time

```text
POST /api/v2/scenario-packs
GET  /api/v2/scenario-packs
POST /api/v2/scenario-packs/{id}/versions
GET  /api/v2/scenario-versions/{id}
PATCH /api/v2/scenario-versions/{id}
POST /api/v2/scenario-versions/{id}/validate
POST /api/v2/scenario-versions/{id}/publish
POST /api/v2/scenario-versions/{id}/deprecate
POST /api/v2/scenario-versions/{id}/retire
POST /api/v2/scenario-versions/{id}/clone-version
GET  /api/v2/scenario-versions/{id}/validation
GET  /api/v2/scenario-versions/{id}/diff?against=...
```

## Activation / Catalog

```text
POST /api/v2/scenario-activations
DELETE /api/v2/scenario-activations/{id}
GET /api/v2/runtime/scenarios?labEntityId=...
```

## Runtime

```text
POST /api/v2/test-requests
GET  /api/v2/process-instances/{id}
GET  /api/v2/my-work
POST /api/v2/work-items/{id}/claim
POST /api/v2/work-items/{id}/complete
POST /api/v2/node-executions/{id}/retry
POST /api/v2/process-instances/{id}/signal
```

详细 Contract 见 `docs/06-API-CONTRACT-V2.md`。

---

# 18. 前端信息架构 v2

```text
工作台

业务运行
├─ 委托 / 申请
├─ 我的工作
├─ 检测对象 / 样品
├─ 检测任务
├─ 审核中心
└─ 报告

场景中心
├─ 场景包
├─ 已发布场景
├─ 场景激活
└─ 版本 / 发布记录

业务资产
├─ 检测项
├─ 法律法规与标准
├─ 检测方法
├─ 限值与公式
├─ 动态表单
└─ 报告模板

流程与能力
├─ 流程设计器
├─ 节点类型
├─ AI Skills
└─ 集成能力

资源
├─ 设备
├─ 人员资质
└─ 实验室资源

平台管理
├─ 租户 / 组织
├─ 角色权限
├─ 审计
└─ 系统设置
```

核心页面由 `CompositionStudio` 正式更名：

> **ScenarioPackStudio**

并采用左侧引导式生命周期，而不是固定 Tab。

---

# 19. Scenario Pack Studio UI

顶部：

```text
第三方食品理化检测        v1.3.0 Draft
完整度 72%  | 上次保存 15:26
                            [保存草稿] [校验] [发布]
```

左侧 Setup Lifecycle：

```text
✓ 01 基础信息
✓ 02 检测对象
● 03 检测项            16/18
! 04 法律法规与标准     2项待处理
○ 05 检测方法与限值
○ 06 检测流程
○ 07 动态表单
○ 08 资源与资质
○ 09 报告
○ 10 AI能力
○ 11 发布检查
```

主区根据当前 Step Renderer 变化。

右侧仅在需要时显示：

- Step Guide；
- Completion Status；
- Validation Issues；
- Dependency Impact。

---

# 20. Workflow Designer UI v2

三栏：

```text
Node Palette | Canvas | Inspector
```

Node Palette 不应只显示 generic “Task”，而应展示注册的业务能力：

```text
基础节点
开始 / 结束 / 网关 / 定时器

实验室节点
委托受理
现场采样
收样
样品前处理
实验室检测
现场检测
技术审核
报告生成

自动化
规则节点
AI节点
集成节点
```

Inspector 显示：

```text
节点类型
执行模式
进入条件
完成条件
角色/候选组
SLA
Node Config
Input Mapping
Output Mapping
Rule Hook
AI Hook
失败策略
Retry
Renderer
Audit Policy
```

---

# 21. 运行态 UI v2

## 21.1 Request Composer

第一步：选择已发布场景。

场景卡片显示：

```text
场景名称
版本
适用实验室
业务模式
检测对象
TAT/说明
```

选择后所有表单和后续步骤由 Snapshot 驱动。

## 21.2 My Work

所有 Human Task 汇总到统一工作台：

```text
我的待办
现场任务
实验室任务
审核任务
超时任务
```

点击 WorkItem，前端根据 `runtimeRendererKey` 打开相应专业工作面。

## 21.3 Field Sampling Workbench

用于 Environment 等场景。

## 21.4 Onsite Inspection Workbench

用于客户现场检测、计量等场景。

---

# 22. Java 模块调整

建议 v2：

```text
lims-parent
├── lims-bootstrap
├── lims-kernel
│   ├── tenant
│   ├── iam
│   ├── audit
│   ├── event
│   ├── metadata
│   ├── rule
│   ├── formula
│   ├── document
│   └── registry
│
├── lims-scenario
│   ├── scenario-domain
│   ├── scenario-application
│   ├── scenario-publish
│   └── scenario-runtime
│
├── lims-process
│   ├── process-definition
│   ├── process-runtime
│   ├── node-runtime
│   └── work-item
│
├── lims-laboratory
├── lims-knowledge
├── lims-resource
├── lims-quality
├── lims-capabilities
│   ├── capability-api
│   ├── field-sampling
│   ├── onsite-inspection
│   ├── physchem
│   └── metrology
├── lims-integration
├── lims-ai-bridge
└── lims-web-api
```

v1 的 `lims-pack-runtime` 逐步迁移为：

```text
lims-scenario + registry + asset import/export
```

---

# 23. 运行时一致性与并发

必须满足：

- Scenario Snapshot immutable；
- ProcessInstance 锁定 workflow version；
- Node execution 具备幂等键；
- Human Task 完成使用 optimistic lock；
- 外部集成通过 outbox / job，不做分布式事务；
- Executor 重试不能重复写领域事实；
- Process Engine 与 Domain Event 关联 traceId；
- 节点失败产生 Incident，不直接跳过；
- 管理员人工跳转必须属于受控操作并审计。

---

# 24. AI 在 v2 中的位置

AI Skill 既可以：

- 被场景直接绑定到阶段；
- 作为 Workflow AI Node；
- 在 Human Task 的专业 Workbench 内作为辅助能力。

仍保持：

```text
Rule / Formula / State / Permission = Deterministic
AI = Extraction / Generation / Recommendation / Semantic Reasoning / Detection
```

AI Node Executor 只能调用注册 Skill，保存：

```text
skillVersion
model
promptVersion
input refs
evidence
output
policy result
human decision
trace
```

---

# 25. v1 → v2 迁移策略

v1 概念映射：

| v1 | v2 |
|---|---|
| Business Mode Pack | Scenario Profile / Asset & Capability Provider |
| Domain Pack | Capability Module + Domain Assets |
| Standard Pack | Standard Asset Bundle |
| Report Pack | Report Asset Bundle |
| AI Skill Pack | AI Skill Registry / Asset Bundle |
| Composition | ScenarioPackVersion |
| Composition Studio | Scenario Pack Studio |
| Workflow Registry | Workflow Definition + Node Type Registry |
| UI Plugin Registry | UI Extension Registry |
| Pack Activation | Scenario Publication + Scenario Activation |

迁移过程中不删除现有 v1 表和 API，先提供 Compatibility Adapter。

已有 v1 Pack 可以转换为：

```text
Source Pack
  ↓ import
Capabilities / Assets
  ↓ compose
ScenarioPack Draft
```

---

# 26. v2 MVP 验证场景

必须同时验证三种差异：

## A. 第三方食品理化检测

```text
委托 → 收样 → 前处理 → 实验室检测 → 审核 → 报告
```

验证资产绑定和传统 Sample-based LIMS。

## B. 环境现场采样 + 实验室分析

```text
委托 → 采样计划 → 现场采样 → Chain of Custody → 实验室检测 → 报告
```

验证 Field Node + 专业 Runtime Renderer。

## C. 企业内部 / 客户现场几何量检测

```text
申请 → 派工 → Onsite/Metrology → Measurement → Tolerance → Review → Feedback
```

验证非 Sample 领域和现场检测流程。

如果三种场景能在同一个 Core、同一个 Scenario Runtime 上运行，v2 架构成立。

---

# 27. Codex 实施顺序

```text
V2-E0 Architecture Compatibility Layer
V2-E1 Scenario Domain & Version Lifecycle
V2-E2 Asset/Capability Registry Upgrade
V2-E3 Guided Setup Runtime
V2-E4 Publish Compiler & Snapshot
V2-E5 Workflow Definition v2
V2-E6 Node Type Registry / Executor SPI
V2-E7 Process Runtime / Human Work Item
V2-E8 UI Extension Registry
V2-E9 Scenario Pack Studio Frontend
V2-E10 Runtime Scenario Resolver / Request Composer
V2-E11 Field Sampling Capability
V2-E12 Onsite Inspection / Metrology Capability
V2-E13 Version Diff / Migration / Hardening
V2-E14 Architecture Validation Suite
```

详细拆解见 `docs/09-CODEX-IMPLEMENTATION-PLAN.md`。

---

# 28. Architecture Definition of Done

v2 只有满足以下条件才算升级完成：

1. 场景包可由 YAML/JSON 导入导出，但 Draft 也有规范化数据库模型；
2. 场景配置步骤由 Manifest 驱动，不是前端固定 Tab；
3. 检测项、法规、标准、方法、报告仍可在独立菜单维护并回到场景上下文；
4. Published Scenario Version 不可编辑；
5. 发布产生 immutable snapshot + hash；
6. Request 创建时锁定 scenario snapshot；
7. Workflow Node Type 来自 Registry；
8. Node 能真实执行或等待，不只是流程图；
9. FIELD_SAMPLING 和 ONSITE_INSPECTION 能拥有独立运行工作台；
10. YAML 无法注入任意代码；
11. Executor 不能绕过 Application Service 和权限；
12. 场景升级不改变历史实例；
13. v1 Food 与 Metrology 能迁移；
14. Environment Field Sampling 场景可以由配置跑通；
15. 所有发布、版本、人工跳转、重试、AI 决策均可审计。

---

# 29. 本包文档索引

```text
LIMS_Architecture_Spec_v2.0.md              总体架构
README.md                                   使用说明

docs/01-PRODUCT-ARCHITECTURE-V2.md         架构变化与模块边界
docs/02-SCENARIO-PACK-SPEC.md               场景包/Manifest/生命周期
docs/03-WORKFLOW-RUNTIME-SPEC.md            Design/Runtime流程模型
docs/04-NODE-SPI-UI-EXTENSION-SPEC.md       Node Executor与UI扩展
docs/05-DOMAIN-DATABASE-V2.md               数据模型升级
docs/06-API-CONTRACT-V2.md                  API Contract
docs/07-FRONTEND-IA-UX-SPEC.md              前端IA与交互
docs/08-V1-TO-V2-MIGRATION.md               迁移策略
docs/09-CODEX-IMPLEMENTATION-PLAN.md         Codex任务拆解
docs/10-FIGMA-MAKE-AI-PROMPT-V2.md          Figma Make AI完整提示词
docs/11-ARCHITECTURE-DECISIONS.md           ADR摘要

schemas/scenario-pack-v2.schema.json
schemas/workflow-v2.schema.json
examples/*.yaml
sql/V2__scenario_workflow_runtime.sql
enterprise-ui-standard/*
```

---

**End of LIMS Architecture Spec v2.0**
