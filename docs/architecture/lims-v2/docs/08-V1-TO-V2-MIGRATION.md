# 08 · v1 → v2 Migration Plan

## 1. 迁移原则

v2 是架构升级，不建议直接删除 v1 Pack Runtime。

采用：

```text
Compatibility Bridge
→ Dual Read / Controlled Migration
→ v2 First
→ v1 Deprecated
```

## 2. 概念映射

| v1 | v2 |
|---|---|
| BusinessModePack | Business Profile / reusable capability & assets |
| DomainPack | Capability Module + Domain Assets |
| StandardPack | Standard Asset Bundle |
| ReportPack | Report Asset Bundle |
| AdapterPack | Integration Capability / Adapter Registry |
| AISkillPack | AI Skill Registry / Asset Bundle |
| Composition | ScenarioPackVersion |
| CompositionStudio | ScenarioPackStudio |
| PackRuntime | Scenario Registry + Asset Import + Publish Runtime |
| WorkflowRegistry | Workflow Definition + NodeType Registry |
| UIPluginRegistry | UIExtensionRegistry |
| Tenant Pack Activation | Scenario Activation |

## 3. 不变部分

v1 以下内容继续保留：

- Canonical Laboratory Domain；
- TestSubject 不等于 Sample；
- Standard/Method version lock；
- Rule/Formula deterministic；
- ReportDocumentModel；
- AI provenance；
- Tenant isolation；
- Audit / Outbox；
- Java modular monolith；
- Python AI services。

## 4. 数据迁移阶段

### Phase A · Additive Schema

只新增：

```text
scenario.*
process.*
request scenario refs
node/ui registry projection
```

不删除 v1 表。

### Phase B · V1 Pack Import Adapter

读取 v1 manifest：

```text
Business Mode
Domain
Standard
Report
AI
```

转换为：

```text
Capability / Asset Provider records
```

### Phase C · Generate Draft Scenario

根据 v1 Composition 生成：

```text
ScenarioPackVersion(DRAFT)
```

自动生成基础 Setup Steps：

```text
basic
subjects
test-items
standards
methods
workflow
forms
resources
reports
ai
validation
```

### Phase D · Manual Review

由于 v1 Composition 不一定包含：

- node executor mapping；
- runtime renderer；
- complete setup order；
- precise activation；

迁移后必须作为 Draft 由产品/实施人员确认。

### Phase E · Publish v2

Validate + Publish Snapshot。

## 5. v1 Workflow 迁移

v1 Workflow Node 如果只有 generic task：

```text
Generic Human Task
```

可以先迁移到：

```text
GENERIC_HUMAN_TASK
```

再逐步替换为：

```text
FIELD_SAMPLING
LAB_TEST_EXECUTION
TECHNICAL_REVIEW
...
```

不能自动猜业务 Node Type 后直接发布。

## 6. API Compatibility

短期保留：

```text
/api/v1/packs
/api/v1/compositions
```

新增 v2。

前端新功能只写 v2 API。

旧 UI 在过渡期只读或提供“迁移到场景包”操作。

## 7. Runtime Compatibility

历史 v1 TestRequest：

```text
scenario_snapshot_id = null
```

仍按 legacy flow 运行/查看。

新的 v2 Request：

```text
scenario_snapshot_id NOT NULL
```

禁止把运行中的 legacy 实例强制迁移到 v2，除非单独做 migration project。

## 8. Frontend Migration

原：

```text
CompositionStudio
BusinessModeSelector
```

新：

```text
ScenarioPackStudio
ScenarioLifecycleStepper
RuntimeScenarioSelector
```

保留：

```text
TestCapabilityMatrix
WorkflowDesigner
MetadataFormDesigner
ReportTemplateDesigner
AiSkillBindingPanel
```

但都改成 Scenario Context aware。

## 9. Migration Acceptance

必须验证：

1. v1 第三方食品 Composition 能迁移成 v2 Draft；
2. v1 内部计量 Composition 能迁移；
3. 原标准/方法版本引用不丢失；
4. 原报告模板不丢失；
5. v1 历史委托仍可打开；
6. v2 新委托只使用 Scenario Runtime；
7. 两套模式的 Audit 清晰区分；
8. 删除 v1 代码前有明确 usage=0 证据。
