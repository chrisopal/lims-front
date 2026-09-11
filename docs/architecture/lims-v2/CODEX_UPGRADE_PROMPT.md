# Codex Upgrade Prompt · LIMS v2

```text
请对现有 LIMS 项目进行 v2 架构升级。

架构基线：
- LIMS_Architecture_Spec_v2.0.md
- docs/02-SCENARIO-PACK-SPEC.md
- docs/03-WORKFLOW-RUNTIME-SPEC.md
- docs/04-NODE-SPI-UI-EXTENSION-SPEC.md
- docs/05-DOMAIN-DATABASE-V2.md
- docs/06-API-CONTRACT-V2.md
- docs/09-CODEX-IMPLEMENTATION-PLAN.md

必须保留 v1 已成立的 Canonical Laboratory Domain，不做全量重写。

核心升级：
1. ScenarioPackVersion 成为唯一业务可发布配置单元；
2. Capability Module 与 Reusable Asset 分离；
3. 场景配置步骤由 setup.steps 数据驱动；
4. 发布必须生成 immutable ScenarioSnapshot + hash；
5. TestRequest 创建时锁定 scenario version / snapshot；
6. Workflow 从配置图升级为可执行 Process Runtime；
7. Node Type 通过 Registry 解析 NodeExecutor；
8. Human Task 生成 WorkItem；
9. FIELD_SAMPLING / ONSITE_INSPECTION 等专业节点支持 runtime renderer；
10. UIExtensionRegistry 不允许远程任意 JS；
11. YAML 不允许任意脚本/SQL/class name；
12. Published Version 不可 PATCH，修改必须 Create New Version；
13. v1 数据/接口先保持兼容，通过迁移 Adapter 逐步下线。

实施时严格按 docs/09-CODEX-IMPLEMENTATION-PLAN.md 的 Epic 顺序执行。
不要一次性完成所有 Epic。每个 Epic 先给出变更计划、模块边界、数据 migration、API 和测试策略，再实施。

前端必须读取 enterprise-ui-standard/README.md、tokens.json、tokens.css、CHECKLIST.md、AI-PROMPT.md；保持 Vue 3 + TypeScript + Element Plus，不引入第二套 UI 框架。
```
