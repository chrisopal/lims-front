# 05 · Domain & Database Upgrade v2

## 1. 目标

v2 不推翻 v1 的 Canonical Laboratory Domain，而是在其上增加 `scenario` 和 `process` 两个一等领域，并把运行实例与 Scenario Snapshot 绑定。

v1 保留的稳定聚合：

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
PersonQualification
```

v2 新增聚合：

```text
ScenarioPack
ScenarioPackVersion
ScenarioSnapshot
ScenarioActivation
WorkflowDefinition
WorkflowVersion
ProcessInstance
NodeInstance
WorkItem
ProcessIncident
```

## 2. Logical Schemas

推荐 PostgreSQL：

```text
kernel
scenario
process
commercial
lab
resource
quality
knowledge
integration
ai
```

## 3. ScenarioPack Aggregate

### scenario.scn_scenario_pack

```text
id UUID PK
tenant_id UUID nullable       -- null = platform distributed definition
scenario_key varchar(128)
name varchar(256)
description text
category varchar(64)
status varchar(32)
owner_tenant_id UUID
created_at timestamptz
created_by UUID
updated_at timestamptz
updated_by UUID
```

Unique：

```text
(owner_tenant_id, scenario_key)
```

### scenario.scn_scenario_pack_version

```text
id UUID PK
scenario_pack_id UUID NOT NULL
version_code varchar(64) NOT NULL
state varchar(32) NOT NULL
business_mode varchar(32)
config_schema_version varchar(32)
base_version_id UUID
change_summary text
manifest_json jsonb
created_at timestamptz
created_by UUID
validated_at timestamptz
published_at timestamptz
published_by UUID
lock_version bigint
```

Unique：

```text
(scenario_pack_id, version_code)
```

规则：

- PUBLISHED 后禁止 UPDATE 除状态性治理字段；
- 不允许同一 version_code 出现两个发布快照；
- 所有 Draft 修改必须 optimistic lock。

## 4. Guided Setup

### scenario.scn_setup_step

```text
id UUID PK
scenario_version_id UUID NOT NULL
step_key varchar(128) NOT NULL
name varchar(256) NOT NULL
order_no int NOT NULL
step_type varchar(64) NOT NULL
required boolean NOT NULL
depends_on_json jsonb
asset_type varchar(64)
renderer_key varchar(128)
route varchar(512)
completion_validator varchar(128)
permission_code varchar(128)
help_text text
config_json jsonb
```

Unique：

```text
(scenario_version_id, step_key)
```

### scenario.scn_setup_step_state

可选持久化工作进度：

```text
scenario_version_id
step_key
completion_state
completion_percent
warning_count
error_count
last_checked_at
```

真正是否可发布仍以 ValidationRun 为准，不能只信 UI 完整度。

## 5. Binding Tables

### scn_asset_binding

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
created_at
created_by
```

索引：

```text
(scenario_version_id, binding_type)
(target_asset_type, target_asset_version_id)
```

### scn_capability_binding

```text
id
scenario_version_id
capability_key
capability_version
required
config_json
```

### scn_test_capability_binding

为高频检测配置建立结构化表，避免全部塞 JSON：

```text
id
scenario_version_id
test_item_version_id
subject_type
standard_version_id
method_version_id
limit_rule_version_id
formula_version_id
qualification_policy_version_id
report_template_version_id
equipment_capabilities_json
ai_skill_versions_json
conditions_json
status
```

## 6. Validation

### scn_validation_run

```text
id
scenario_version_id
run_no
status
started_at
completed_at
initiated_by
summary_json
```

### scn_validation_issue

```text
id
validation_run_id
severity          ERROR | WARNING | INFO
code
step_key
object_type
object_ref
message
details_json
```

发布必须引用最后一个成功且未失效的 ValidationRun。

## 7. Snapshot

### scn_scenario_snapshot

```text
id UUID PK
scenario_pack_id UUID NOT NULL
scenario_version_id UUID NOT NULL
snapshot_schema_version varchar(32)
canonical_json jsonb NOT NULL
snapshot_hash varchar(128) NOT NULL
created_at timestamptz NOT NULL
created_by UUID NOT NULL
```

Unique：

```text
scenario_version_id
snapshot_hash
```

Snapshot 是运行态事实，应视为 append-only。

### scn_publish_record

```text
id
scenario_version_id
snapshot_id
validation_run_id
published_by
published_at
release_notes
publish_trace_id
```

## 8. Activation

### scn_activation

```text
id
scenario_version_id
tenant_id
lab_entity_id
org_unit_id
effective_from
effective_to
enabled
priority
created_at
created_by
```

Runtime Catalog 查询必须结合：

- scenario state；
- activation；
- effective date；
- user permission；
- lab scope。

## 9. Workflow Definition

### proc_workflow_definition

```text
id
workflow_key
name
description
owner_tenant_id
created_at
```

### proc_workflow_version

```text
id
workflow_definition_id
version_code
state
scenario_version_id
variables_schema_json
created_at
published_at
checksum
```

### proc_workflow_node

```text
id
workflow_version_id
node_key
name
node_type_key
execution_mode
config_json
input_mapping_json
output_mapping_json
assignee_policy_json
sla_policy_json
retry_policy_json
incident_policy_json
ui_config_json
position_json
```

### proc_workflow_edge

```text
id
workflow_version_id
from_node_key
to_node_key
edge_type
condition_expression
priority
label
```

## 10. Runtime

### proc_process_instance

```text
id
process_no
tenant_id
lab_entity_id
scenario_pack_version_id
scenario_snapshot_id
workflow_version_id
business_key_type
business_key_id
status
current_summary_json
started_at
completed_at
lock_version
trace_id
```

`business_key_id` 通常是 TestRequestId。

### proc_node_instance

```text
id
process_instance_id
node_key
node_type_key
status
attempt_no
entered_at
started_at
waiting_at
completed_at
wait_type
wait_ref
input_snapshot_json
output_json
lock_version
```

Unique 推荐：

```text
(process_instance_id, node_key, attempt_no)
```

并行循环场景若未来需要重复节点实例，可增加 `token_id` / `iteration_no`。

### proc_node_execution

详细执行日志：

```text
id
node_instance_id
execution_no
executor_key
started_at
completed_at
status
input_json
output_json
error_code
error_message
trace_id
idempotency_key
```

Unique：

```text
idempotency_key
```

## 11. WorkItem

### proc_work_item

```text
id
work_item_no
tenant_id
lab_entity_id
process_instance_id
node_instance_id
work_type
runtime_renderer_key
assignee_user_id
candidate_roles_json
candidate_orgs_json
status
priority
due_at
payload_schema_key
business_refs_json
claimed_at
completed_at
lock_version
```

状态：

```text
OPEN
CLAIMED
IN_PROGRESS
COMPLETED
CANCELLED
EXPIRED
```

## 12. Incident

### proc_process_incident

```text
id
process_instance_id
node_instance_id
incident_type
severity
error_code
message
details_json
status
created_at
resolved_at
resolved_by
resolution_action
resolution_reason
```

## 13. Node / UI Registry Projection

代码仍是 Source of Truth，但可以保存查询投影：

### sys_node_type_descriptor

```text
node_type_key
version
name
category
execution_mode
executor_key
config_schema_key
input_schema_key
output_schema_key
config_renderer_key
runtime_renderer_key
source_module
active
```

### sys_ui_extension_descriptor

```text
extension_key
extension_type
version
schema_versions_json
source_module
active
```

## 14. TestRequest Upgrade

`lab_test_request` 增加：

```text
scenario_pack_id UUID
scenario_pack_version_id UUID
scenario_snapshot_id UUID
process_instance_id UUID
```

约束：

- 新 v2 Request 必须四者一致；
- legacy request 可为空；
- scenario_snapshot_id 一旦 request 提交后禁止变更；
- `scenario_version_id` 与 snapshot 内 identity 必须校验一致。

## 15. TestTask Upgrade

`lab_test_task` 增加：

```text
process_node_instance_id UUID
work_item_id UUID nullable
```

用于业务任务与流程节点追踪，不让 TestTask 等同 Process Node。

## 16. Knowledge Upgrade

增加法规：

```text
kb_regulation
kb_regulation_version
kb_regulation_clause
```

或在未来统一到更抽象的 `kb_controlled_reference`，但 v2 MVP 推荐先用显式表，减少抽象过度。

## 17. Referential Integrity

发布 Snapshot 中引用的外部资产版本即使业务上被 `DEPRECATED`，也不得物理删除。

删除策略：

```text
Draft asset        可受控删除
Published/used     only deprecate/archive
Snapshot           never delete in normal business operation
```

## 18. Audit

新增审计事件：

```text
ScenarioPackCreated
ScenarioVersionCreated
ScenarioValidationStarted
ScenarioValidationCompleted
ScenarioPublished
ScenarioDeprecated
ScenarioRetired
ScenarioActivated
ScenarioDeactivated
ProcessStarted
NodeEntered
NodeWaiting
NodeCompleted
NodeFailed
WorkItemCreated
WorkItemClaimed
WorkItemCompleted
ProcessIncidentOpened
ProcessIncidentResolved
ControlledNodeSkip
```

## 19. Migration

Flyway 推荐：

```text
V2_001__scenario_core.sql
V2_002__workflow_definition.sql
V2_003__process_runtime.sql
V2_004__node_ui_registry.sql
V2_005__request_scenario_binding.sql
V2_006__regulation_assets.sql
V2_007__compatibility_views.sql
```

本包提供合并参考 DDL：`sql/V2__scenario_workflow_runtime.sql`。
