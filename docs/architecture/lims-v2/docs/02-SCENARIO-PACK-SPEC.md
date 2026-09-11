# 02 · Scenario Pack Specification v2

## 1. 目标

Scenario Pack 是 v2 唯一的业务可发布配置单元。

它需要同时支持：

- UI 引导式配置；
- YAML/JSON 导入导出；
- 版本化；
- 完整性校验；
- 发布；
- 生效范围管理；
- 运行态版本锁定；
- 历史可重放。

## 2. 聚合模型

```text
ScenarioPack
└── ScenarioPackVersion
    ├── SetupStep
    ├── CapabilityBinding
    ├── AssetBinding
    ├── WorkflowBinding
    ├── FormBinding
    ├── ReportBinding
    ├── AiSkillBinding
    ├── ResourcePolicyBinding
    ├── ValidationRun
    └── PublishRecord
```

发布后生成：

```text
ScenarioSnapshot
```

## 3. ScenarioPack

字段：

```text
id
scenario_key
name
description
category
domain_tags
owner_tenant_id
status
created_at
created_by
```

ScenarioPack 本身不代表可运行版本。

## 4. ScenarioPackVersion

字段：

```text
id
scenario_pack_id
version_code
state
business_mode
config_schema_version
base_version_id?
change_summary
created_at
created_by
validated_at?
published_at?
```

状态：

```text
DRAFT
VALIDATING
READY
PUBLISHED
DEPRECATED
RETIRED
```

## 5. Setup Step

Setup Step 只描述设计态如何配置，不是运行流程。

```text
key
name
order
depends_on[]
step_type
required
asset_type?
renderer_key?
route?
completion_validator
permission_code?
help_text?
```

### StepType

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

### completion 状态

```text
NOT_STARTED
IN_PROGRESS
COMPLETE
WARNING
BLOCKED
ERROR
```

前端根据后台返回结果显示，而不是前端自行推断。

## 6. Asset Binding

统一结构：

```text
id
scenario_version_id
binding_type
target_asset_type
target_asset_id
target_asset_version_id
scope_type
scope_key
binding_config_json
required
```

BindingType 示例：

```text
TEST_ITEM
COMPLIANCE_REFERENCE
METHOD
LIMIT_RULE
FORMULA
FORM_SCHEMA
REPORT_TEMPLATE
AI_SKILL
QUALIFICATION_POLICY
RESOURCE_CAPABILITY
```

## 7. Test Capability Binding

检测项是一个组合能力，不是孤立主数据。

```text
ScenarioTestCapability
- test_item_version_id
- subject_type
- standard_version_id
- method_version_id
- limit_rule_version_id?
- formula_version_id?
- qualification_policy_version_id?
- equipment_capability_codes[]
- report_template_version_id?
- ai_skill_version_ids[]
- effective_conditions
```

一个 Test Item 可以在同一个场景里存在多个 Method Binding。

## 8. Compliance Binding

统一表示：

```text
LAW
REGULATION
STANDARD
GUIDANCE
ENTERPRISE_STANDARD
PROCEDURE
```

发布时必须锁定确切 Version。

禁止 Published Snapshot 中出现：

```text
latest
*
>=1.0
```

版本范围只允许出现在设计态依赖解析中，发布时必须 resolve。

## 9. Workflow Binding

```text
workflow_definition_id
workflow_version_id
entry_node_key
completion_policy
```

场景发布时需要验证：

- 所有 Node Type 均已注册；
- Executor 可用；
- Renderer 可用；
- 必需资产引用有效；
- 无孤立节点；
- 至少存在 Start/End；
- Gateway 条件完整；
- Human Task 有候选人策略；
- Integration / AI Node 有失败策略。

## 10. Form Binding

按运行阶段绑定：

```text
REQUEST
SUBJECT
SAMPLING
RECEIPT
EXECUTION
RESULT
REVIEW
REPORT_META
```

每个 FormSchemaVersion immutable。

## 11. Resource Policy

```text
required_person_qualifications
required_equipment_capabilities
facility_requirements
calendar_policy
capacity_policy
```

用于排程和 Node Start Gate。

## 12. AI Skill Binding

```text
skill_version_id
trigger_type
trigger_key
input_mapping
output_mapping
human_approval_required
may_write_draft
may_update_final_state = false
```

## 13. Validation Framework

验证分层：

### Level 1 · Schema

Manifest 和字段结构。

### Level 2 · Reference

资产、Capability、Renderer 引用存在。

### Level 3 · Semantic

例如：

- Test Item 必须有 Method；
- Standard 和 Method Applicability 一致；
- Report Template 接受场景的 Document Model；
- Field Sampling 场景必须有 Sampling Form；
- Metrology Measurement 必须声明 measurement subject capability。

### Level 4 · Runtime Readiness

- Workflow 可执行；
- Executor 注册；
- Human Role 可解析；
- Integration Config 存在；
- AI Skill Policy 合法。

## 14. Publish Compiler

发布编译器输入：

```text
ScenarioPackVersion Draft
Asset Registry
Capability Registry
UI Extension Registry
Workflow Definition
Tenant/Lab Activation policy
```

输出：

```text
ScenarioSnapshot
ValidationReport
PublishRecord
```

Snapshot JSON 必须 canonicalize 后计算 SHA-256。

## 15. Import / Export

### Export

支持：

```text
scenario.yaml
scenario.json
```

默认不内嵌受版权保护的标准全文，只保存引用和用户有权导出的资产。

### Import

流程：

```text
Upload
→ Schema validate
→ Show dependency preview
→ Map external refs
→ Import as DRAFT
→ User complete missing bindings
→ Validate
→ Publish
```

Import 永远不能直接生成 PUBLISHED。

## 16. Activation

发布与激活分离。

```text
ScenarioActivation
- scenario_pack_version_id
- tenant_id
- lab_entity_id?
- org_scope?
- effective_from
- effective_to?
- enabled
```

Runtime Catalog 只展示：

```text
PUBLISHED + ACTIVE + current time valid + user authorized
```

## 17. Version Diff

产品必须能比较：

- Setup sequence；
- Test items；
- Standard/Method versions；
- Workflow nodes/edges；
- Forms；
- Reports；
- AI Skills；
- Resource policies。

Diff 是创建新版本和发布审核的重要 UI。

## 18. 发布后修改原则

Published 禁止：

- PATCH；
- 重新绑定标准；
- 直接编辑流程；
- 替换报告模板；
- 更新 AI Skill 版本。

只能：

```text
Create New Version
```
