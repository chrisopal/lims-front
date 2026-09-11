# 01 · Product Architecture v2

## 1. 设计目标

v2 的目标是让产品真正围绕“检测场景”配置，而不是围绕技术模块配置。

业务用户最终关心的是：

- 我现在要配置哪个检测场景？
- 这个场景有哪些检测对象？
- 检测哪些项目？
- 适用哪些法律法规、标准和方法？
- 业务流程是什么？
- 哪些步骤需要现场完成？
- 哪些步骤在实验室完成？
- 需要哪些设备和人员资质？
- 最终生成哪种报告？
- 哪些 AI 能力可以参与？
- 什么时候可以发布并投入使用？

因此产品一级对象必须是 Scenario Pack。

## 2. 三层产品模型

### A. Platform Core

稳定内核，包括：

```text
Tenant / Org / IAM
Audit / Document / Event
Rule / Formula / Metadata
Request / Subject / Sample
Plan / Task / Result / Review / Report
Resource / Qualification / Equipment
```

### B. Capability & Asset Layer

#### Capability

代码级能力：

```text
Field Sampling
Onsite Inspection
Sample Receipt
Sample Preparation
PhysChem Execution
Metrology Measurement
Technical Review
Report Generation
Instrument Acquisition
```

#### Asset

业务配置资产：

```text
Test Item
Regulation / Standard
Method
Limit Rule
Formula
Dynamic Form
Report Template
Qualification Policy
AI Skill
```

### C. Scenario Layer

最终业务配置：

```text
第三方食品理化检测
环境水质监测
企业内部几何量检测
客户现场尺寸检测
新能源循环寿命测试
```

## 3. 设计态与运行态

### Design Time

```text
Scenario Catalog
  ↓
Scenario Pack Studio
  ↓
Guided Setup
  ↓
Professional Asset Managers
  ↓
Workflow Designer
  ↓
Validation
  ↓
Publish
```

### Runtime

```text
Published Scenario Catalog
  ↓
Request Composer
  ↓
Scenario Resolver
  ↓
Process Instance
  ↓
Node Runtime
  ↓
Human Work / Domain Service / Rule / Integration / AI
```

## 4. Maven / Modulith 边界

```text
lims-kernel
lims-scenario
lims-process
lims-laboratory
lims-knowledge
lims-resource
lims-quality
lims-capabilities
lims-integration
lims-ai-bridge
lims-web-api
```

### lims-scenario

负责：

- ScenarioPack；
- ScenarioPackVersion；
- Guided Setup；
- Asset Binding；
- Validation；
- Publish Compiler；
- Snapshot；
- Activation；
- Runtime Resolution。

### lims-process

负责：

- Workflow Definition；
- Workflow Version；
- Node Definition；
- Process Instance；
- Node Runtime；
- Human Work Item；
- Incident / Retry；
- Timer / Signal。

### lims-capabilities

只实现代码级业务能力。

不能把行业配置资产直接写死在 capability 代码里。

## 5. 依赖方向

```text
kernel
  ↑
scenario / process / laboratory / knowledge / resource
  ↑
capabilities / integration / ai
  ↑
web-api
```

强约束：

- `kernel` 不依赖业务模块；
- `scenario` 只通过 Registry / Application API 解析资产；
- `process` 不直接写 Laboratory Repository；
- `NodeExecutor` 调用公开 Application Service；
- `capabilities` 不能修改 Scenario Snapshot；
- `integration` 和 `ai` 不参与本地核心事务；
- `web-api` 不包含业务规则。

## 6. 配置与代码的边界

优先配置化：

```text
流程结构
字段
检测项绑定
标准/方法/限值绑定
路由条件
资源资格策略
报告模板
AI Skill
```

必须写 Java 的典型情况：

```text
复杂领域事务
现场采样领域模型
三坐标测量领域模型
特殊仪器协议
复杂结果解析
跨对象业务不变量
```

## 7. 运行时可替换性

为了避免和特定 Workflow 引擎锁死，定义：

```text
Scenario DSL
Workflow DSL
Node SPI
ProcessEnginePort
```

具体 runtime 可以通过 Adapter 实现。

v2 产品层的 API、数据库与 UI 不应直接暴露 BPMN vendor 概念。
