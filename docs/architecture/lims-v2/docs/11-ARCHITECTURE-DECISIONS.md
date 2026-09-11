# 11 · Architecture Decisions (ADR Summary)

## ADR-001 · Scenario Pack is the primary publishable business unit

**Decision**：v2 以 ScenarioPackVersion 替代 v1 Composition 作为最终配置与运行单元。

**Reason**：降低 Pack 概念复杂度，并让设计、发布、运行围绕同一个对象。

---

## ADR-002 · Capability Module is code, Scenario Pack is configuration

**Decision**：代码能力与业务配置严格分离。

**Reason**：避免租户配置变成任意代码扩展，同时保持行业业务可组合。

---

## ADR-003 · Published Scenario Version is immutable

**Decision**：发布后只读；修改创建新版本。

**Reason**：保证实验室结果、标准、报告和流程可追溯与可复现。

---

## ADR-004 · Publish creates an immutable resolved Snapshot

**Decision**：运行时读取 Snapshot，不解析 Draft。

**Reason**：防止资产“latest”升级影响历史运行。

---

## ADR-005 · Setup lifecycle is declarative

**Decision**：Scenario Studio 的步骤顺序由 Manifest/API 驱动。

**Reason**：食品、环境、计量、新能源的配置顺序不同，不能硬编码统一 Tab。

---

## ADR-006 · Workflow is orchestration, domain state remains in domain model

**Decision**：Process Engine 不直接更新 Sample/TestTask/Result 状态。

**Reason**：避免 BPMN/流程配置破坏领域不变量。

---

## ADR-007 · Semantic Node Type + Executor Registry

**Decision**：流程节点使用 `FIELD_SAMPLING`、`ONSITE_INSPECTION` 等业务语义 NodeType，通过 Registry 解析 Executor。

**Reason**：实现可配置流程与可执行代码之间的稳定契约。

---

## ADR-008 · No arbitrary code in YAML

**Decision**：Manifest 只引用受信 Registry Key；MVP 不支持任意脚本。

**Reason**：安全、审计、可升级、可测试。

---

## ADR-009 · UI Renderer is a registered extension

**Decision**：Node Type 可以声明 config/runtime renderer key；场景不能引用任意远程 JS。

**Reason**：支持现场采样、几何量测量等专业工作面，同时保护前端供应链安全。

---

## ADR-010 · Runtime Request selects Scenario first

**Decision**：新建委托/申请第一步是选择已发布且已激活的 Scenario。

**Reason**：业务人员不需要理解内部 Pack 组合；场景本身已经包含 Business Mode 和 Domain。

---

## ADR-011 · Publish and Activation are separate

**Decision**：发布进入 Catalog，Activation 决定在哪些实验室可用。

**Reason**：满足多租户、多实验室、灰度上线和有效期控制。

---

## ADR-012 · Keep Process Runtime vendor-neutral

**Decision**：平台定义自身 Workflow DSL、Node SPI、ProcessEnginePort。

**Reason**：允许后端选用自研或嵌入式 Workflow Adapter，而不让产品数据模型被具体引擎锁死。
