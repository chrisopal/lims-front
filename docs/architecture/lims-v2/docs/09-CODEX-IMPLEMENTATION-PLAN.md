# 09 · Codex Implementation Plan v2

## 总原则

Codex 每个任务都必须：

- 先读总体 Spec；
- 不改动无关模块；
- 有 migration；
- 有 module/architecture test；
- 有 unit/integration test；
- 有 OpenAPI；
- 有审计；
- 有错误码；
- 前端任务读 enterprise-ui-standard；
- 不把行业 if/else 写入 Core。

---

# Epic V2-E0 · Compatibility Baseline

## V2-001 建立 v2 ADR 与 Feature Flag

创建：

```text
scenario-runtime-v2.enabled
```

验收：v1 不受影响。

## V2-002 模块骨架

新增：

```text
lims-scenario
lims-process
```

建立 Modulith / ArchUnit 依赖测试。

## V2-003 v1 Pack Compatibility Reader

只读现有 Pack/Composition，用于迁移，不扩展新业务。

---

# Epic V2-E1 · Scenario Domain

## V2-010 ScenarioPack Aggregate
## V2-011 ScenarioPackVersion Aggregate
## V2-012 Scenario Version State Machine
## V2-013 Guided Setup Step Model
## V2-014 Asset Binding Model
## V2-015 Test Capability Binding Model
## V2-016 Scenario Version Diff Service

验收：

- 可创建 Scenario + Draft Version；
- Published 不可修改；
- Clone New Version 可用。

---

# Epic V2-E2 · Capability / Asset Registry Upgrade

## V2-020 Capability Descriptor
## V2-021 Node Type Descriptor Registry
## V2-022 UI Extension Descriptor API
## V2-023 Regulation Asset Model
## V2-024 Asset Version Resolver
## V2-025 Registry Conflict Detection

验收：

- Node Type 能查询 executor/renderer/schema；
- 标准/方法/报告等可解析确切版本。

---

# Epic V2-E3 · Guided Configuration Runtime

## V2-030 Setup Steps API
## V2-031 Step Completion Validator SPI
## V2-032 Scenario Context API
## V2-033 Route-backed Asset Binding
## V2-034 Test Capability Matrix API

验收：

- Setup 顺序由 Manifest/API 驱动；
- 专业资产页面能带场景上下文保存绑定并返回。

---

# Epic V2-E4 · Validation & Publish

## V2-040 Validation Framework
## V2-041 Schema Validation
## V2-042 Reference Validation
## V2-043 Semantic Validation
## V2-044 Runtime Readiness Validation
## V2-045 Snapshot Builder
## V2-046 Canonical JSON + SHA256
## V2-047 Publish Command
## V2-048 Scenario Activation

验收：

- 有 ERROR 不能发布；
- 发布生成 immutable snapshot；
- Published 版本不可 PATCH。

---

# Epic V2-E5 · Workflow Definition v2

## V2-050 Workflow DSL Domain
## V2-051 Node / Edge Persistence
## V2-052 Workflow Validator
## V2-053 Node Type Resolution
## V2-054 Gateway Expression Policy
## V2-055 Workflow JSON Schema

验收：

- Field Sampling / Lab Test / Review 节点可配置；
- 未注册 Executor/Renderer 会阻止发布。

---

# Epic V2-E6 · Node SPI

## V2-060 NodeExecutionContext
## V2-061 NodeExecutor SPI
## V2-062 NodeExecutor Registry
## V2-063 Execution Result / WaitReference
## V2-064 Idempotency Framework
## V2-065 Generic Human Task Executor
## V2-066 Rule Executor
## V2-067 Integration Executor
## V2-068 AI Executor

验收：所有 Node Runtime 都经 Registry 解析。

---

# Epic V2-E7 · Process Runtime

## V2-070 ProcessInstance
## V2-071 NodeInstance
## V2-072 Process Runner
## V2-073 Edge Evaluation
## V2-074 Human WorkItem
## V2-075 Signal / Resume
## V2-076 Retry Policy
## V2-077 Incident Management
## V2-078 Timer/SLA Foundation
## V2-079 Process Timeline Query

验收：

```text
Start → Human → Java/Rule → Review → End
```

可以真实运行。

---

# Epic V2-E8 · Process Engine Adapter Spike

## V2-080 ProcessEnginePort
## V2-081 Internal Runtime Adapter Prototype
## V2-082 Embedded Workflow Engine Adapter Prototype
## V2-083 Benchmark & ADR

比较：

- human task；
- gateway；
- timer；
- async；
- migration；
- operational complexity；
- schema control；
- license/maintenance constraints。

形成最终 ADR，但上层契约不变。

---

# Epic V2-E9 · UI Extension Registry

## V2-090 Frontend Registry
## V2-091 Backend Descriptor API
## V2-092 Generic Setup Renderer
## V2-093 Generic Node Config Renderer
## V2-094 Generic Human Task Renderer
## V2-095 Runtime Node Host

验收：rendererKey 不存在时有受控错误，不 silent fallback。

---

# Epic V2-E10 · Scenario Pack Studio Frontend

## V2-100 Scenario Pack List
## V2-101 Scenario Header / Status
## V2-102 Lifecycle Stepper
## V2-103 Scenario Step Host
## V2-104 Test Capability Matrix
## V2-105 Compliance Binding Context
## V2-106 Workflow Launcher
## V2-107 Preflight Validation
## V2-108 Publish Dialog
## V2-109 Version Diff

必须符合 enterprise UI token/checklist。

---

# Epic V2-E11 · Runtime Request

## V2-110 Published Scenario Catalog
## V2-111 Runtime Scenario Selector
## V2-112 Request Schema Resolver
## V2-113 Subject Schema Resolver
## V2-114 TestRequest Scenario Lock
## V2-115 Start Process on Request

验收：Request 第一项是 Scenario，不再先选 Business Mode。

---

# Epic V2-E12 · Field Sampling Capability

## V2-120 FieldTask Domain
## V2-121 FIELD_SAMPLING Node Type
## V2-122 Field Sampling Executor
## V2-123 Field Sampling Config Renderer
## V2-124 Field Sampling Runtime Workbench
## V2-125 GPS / Photo / Evidence Schema
## V2-126 Chain of Custody Integration

验收：环境场景端到端跑通。

---

# Epic V2-E13 · Onsite Inspection / Metrology

## V2-130 ONSITE_INSPECTION Node
## V2-131 Onsite Workbench
## V2-132 METROLOGY_MEASUREMENT Node
## V2-133 Part/Feature/Characteristic Context
## V2-134 Measurement/Tolerance Result Integration

验收：无 Sample 的现场几何量检测能跑通。

---

# Epic V2-E14 · Hardening

## V2-140 Cross-tenant isolation
## V2-141 Published immutability test
## V2-142 Scenario history replay test
## V2-143 Executor idempotency test
## V2-144 Workflow compatibility suite
## V2-145 Renderer contract test
## V2-146 Failure/retry/incident E2E
## V2-147 AI provenance E2E
## V2-148 Audit completeness
## V2-149 Performance baseline

---

# Architecture Gate

完成 V2-149 后必须做架构冻结评审。

通过条件：

1. Food、Environment、Metrology 使用同一个 Scenario Runtime；
2. 三者没有 Core 行业分支；
3. Setup Step 真正数据驱动；
4. 发布快照可重放；
5. Node 真实执行；
6. 专业 UI 由 renderer key 驱动；
7. 现场采样与现场检测已验证；
8. 历史场景版本不受升级影响；
9. 所有关键流程有 audit + trace。
