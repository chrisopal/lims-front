# LIMS v2.0 Architecture Upgrade Pack

这是一套从 v1 “Pack 组合”升级到 v2 “Scenario Pack 生命周期驱动”的完整架构与前端设计包。

## v2 的核心变化

v2 不再让最终用户直接面对 Business Mode Pack / Domain Pack / Standard Pack / Report Pack 等多层 Pack 组合，而是把产品模型收敛为：

```text
Capability Module（代码能力）
+ Reusable Asset（可复用业务资产）
                ↓
Scenario Pack（业务可发布场景）
                ↓
Validate / Publish
                ↓
Immutable Snapshot
                ↓
Runtime Process
```

Scenario Pack 成为：

- 产品配置入口；
- 版本管理入口；
- 发布入口；
- 运行态选择入口；
- 业务与技术能力的组合边界。

## 建议阅读顺序

1. `LIMS_Architecture_Spec_v2.0.md`
2. `docs/02-SCENARIO-PACK-SPEC.md`
3. `docs/03-WORKFLOW-RUNTIME-SPEC.md`
4. `docs/04-NODE-SPI-UI-EXTENSION-SPEC.md`
5. `docs/05-DOMAIN-DATABASE-V2.md`
6. `docs/07-FRONTEND-IA-UX-SPEC.md`
7. `docs/09-CODEX-IMPLEMENTATION-PLAN.md`
8. `docs/10-FIGMA-MAKE-AI-PROMPT-V2.md`

## 目录

```text
lims-v2-architecture-upgrade/
├── LIMS_Architecture_Spec_v2.0.md
├── README.md
├── docs/
├── schemas/
├── examples/
├── sql/
└── enterprise-ui-standard/
```

## 给 Codex 的用法

将整个目录复制到代码仓库，例如：

```text
/docs/architecture/lims-v2/
```

然后使用：

```text
请以 docs/architecture/lims-v2/LIMS_Architecture_Spec_v2.0.md 为总体架构基线，
按 docs/architecture/lims-v2/docs/09-CODEX-IMPLEMENTATION-PLAN.md 的任务顺序实施。

涉及 Scenario Pack 时必须遵循 schemas/scenario-pack-v2.schema.json；
涉及 Workflow 时必须遵循 schemas/workflow-v2.schema.json；
涉及前端时必须同时读取 enterprise-ui-standard/README.md、tokens.json、tokens.css 和 CHECKLIST.md。

禁止将 Food / Environment / Metrology 等行业逻辑硬编码到 Core；
禁止在 YAML 中执行任意脚本；
Published Scenario Snapshot 必须不可变；
所有运行态 TestRequest 必须锁定 ScenarioPackVersion 和 Snapshot。
```

## 给 Figma Make AI 的用法

直接复制：

`docs/10-FIGMA-MAKE-AI-PROMPT-V2.md`

其中已经把 v2 的：

- 场景包生命周期；
- 引导式配置；
- 业务资产独立管理；
- 流程设计器；
- Node Type / Executor；
- Published Scenario Catalog；
- Request Runtime；
- 现场采样 / 现场检测工作台；
- Enterprise Workbench UI 风格；

全部放进了提示词。
