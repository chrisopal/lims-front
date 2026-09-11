# 06 · API Contract v2

Base path：

```text
/api/v2
```

通用约束：

- REST + OpenAPI；
- 生命周期动作使用 Command API，不直接 PATCH status；
- ETag / version 字段用于 optimistic locking；
- 所有写操作支持 `X-Idempotency-Key`（关键动作必须）；
- 所有错误返回稳定 business error code；
- 所有响应带 `traceId`；
- tenant / lab context 由鉴权上下文提供，不盲信 payload。

## 1. Scenario Pack

### Create

```http
POST /api/v2/scenario-packs
```

```json
{
  "scenarioKey": "third-party-food-physchem",
  "name": "第三方食品理化检测",
  "category": "FOOD"
}
```

### List

```http
GET /api/v2/scenario-packs?state=&keyword=&category=&owner=
```

### Create Version

```http
POST /api/v2/scenario-packs/{scenarioPackId}/versions
```

```json
{
  "versionCode": "1.3.0",
  "baseVersionId": "uuid",
  "changeSummary": "增加食品标签合规审核"
}
```

### Get Version

```http
GET /api/v2/scenario-versions/{id}
```

返回：

```json
{
  "id": "uuid",
  "scenarioPackId": "uuid",
  "versionCode": "1.3.0",
  "state": "DRAFT",
  "businessMode": "THIRD_PARTY",
  "setupProgress": {
    "completed": 6,
    "total": 11,
    "warnings": 2,
    "errors": 0
  },
  "lockVersion": 7
}
```

## 2. Setup Steps

```http
GET /api/v2/scenario-versions/{id}/setup-steps
```

返回顺序、状态、renderer/route。

```http
POST /api/v2/scenario-versions/{id}/setup-steps/{stepKey}/check
```

用于即时完成度检查，但不替代发布 Validation。

## 3. Asset Binding

```http
GET /api/v2/scenario-versions/{id}/asset-bindings?type=TEST_ITEM
PUT /api/v2/scenario-versions/{id}/asset-bindings/{bindingId}
POST /api/v2/scenario-versions/{id}/asset-bindings
DELETE /api/v2/scenario-versions/{id}/asset-bindings/{bindingId}
```

专门的检测能力矩阵：

```http
GET /api/v2/scenario-versions/{id}/test-capabilities
POST /api/v2/scenario-versions/{id}/test-capabilities
PUT /api/v2/scenario-versions/{id}/test-capabilities/{bindingId}
```

## 4. Validate

```http
POST /api/v2/scenario-versions/{id}/validate
```

响应：

```json
{
  "validationRunId": "uuid",
  "status": "RUNNING",
  "traceId": "..."
}
```

查询：

```http
GET /api/v2/scenario-versions/{id}/validation/latest
GET /api/v2/validation-runs/{runId}
```

## 5. Publish

```http
POST /api/v2/scenario-versions/{id}/publish
```

请求：

```json
{
  "validationRunId": "uuid",
  "releaseNotes": "首版食品理化检测场景"
}
```

成功：

```json
{
  "scenarioVersionId": "uuid",
  "state": "PUBLISHED",
  "snapshotId": "uuid",
  "snapshotHash": "sha256:...",
  "publishedAt": "..."
}
```

失败示例：

```json
{
  "code": "SCENARIO_NOT_PUBLISHABLE",
  "message": "场景仍存在 3 个阻塞问题",
  "details": {
    "validationRunId": "uuid",
    "errorCount": 3
  },
  "traceId": "..."
}
```

## 6. Version Governance

```http
POST /api/v2/scenario-versions/{id}/deprecate
POST /api/v2/scenario-versions/{id}/retire
POST /api/v2/scenario-versions/{id}/clone-version
GET  /api/v2/scenario-versions/{id}/diff?againstVersionId=...
```

禁止：

```http
PATCH /api/v2/scenario-versions/{publishedId}
```

返回：

```text
SCENARIO_VERSION_IMMUTABLE
```

## 7. Activation

```http
POST /api/v2/scenario-activations
```

```json
{
  "scenarioVersionId": "uuid",
  "labEntityId": "uuid",
  "effectiveFrom": "2026-09-10T00:00:00+08:00"
}
```

```http
POST /api/v2/scenario-activations/{id}/disable
```

## 8. Runtime Scenario Catalog

```http
GET /api/v2/runtime/scenarios?labEntityId=...
```

只返回当前用户可使用的 Published + Active 场景。

响应：

```json
[
  {
    "scenarioVersionId": "uuid",
    "scenarioKey": "third-party-food-physchem",
    "name": "第三方食品理化检测",
    "versionCode": "1.2.0",
    "businessMode": "THIRD_PARTY",
    "subjectTypes": ["FOOD_SAMPLE"],
    "requestComposerSchema": "food-request-v2",
    "description": "..."
  }
]
```

## 9. Request Runtime

```http
POST /api/v2/test-requests
```

```json
{
  "scenarioVersionId": "uuid",
  "requestData": {},
  "subjects": []
}
```

服务端必须：

1. 校验场景 Active；
2. 获取 Snapshot；
3. 校验 Request schema；
4. 创建 TestRequest；
5. 锁定 Scenario refs；
6. 创建 ProcessInstance；
7. 返回当前 runtime step/work item。

响应：

```json
{
  "requestId": "uuid",
  "requestNo": "REQ-20260905-001",
  "scenarioSnapshotId": "uuid",
  "processInstanceId": "uuid",
  "status": "SUBMITTED"
}
```

## 10. Workflow Design-time

```http
GET  /api/v2/node-types
GET  /api/v2/node-types/{key}
POST /api/v2/workflow-definitions
GET  /api/v2/workflow-definitions/{id}
PUT  /api/v2/workflow-definitions/{id}/draft
POST /api/v2/workflow-definitions/{id}/validate
```

场景拥有的 Workflow 在场景发布时锁定版本。

## 11. Process Runtime

```http
GET /api/v2/process-instances/{id}
GET /api/v2/process-instances/{id}/timeline
GET /api/v2/process-instances/{id}/nodes
```

Signal：

```http
POST /api/v2/process-instances/{id}/signals
```

服务端不接受前端直接指定“下一节点”。

## 12. My Work

```http
GET /api/v2/my-work?status=&workType=&dueBefore=&scenario=
```

```http
POST /api/v2/work-items/{id}/claim
POST /api/v2/work-items/{id}/start
POST /api/v2/work-items/{id}/complete
POST /api/v2/work-items/{id}/return
```

Complete：

```json
{
  "payload": {},
  "comment": "完成现场采样",
  "version": 3
}
```

## 13. Node Execution Operations

```http
GET /api/v2/node-executions/{id}
POST /api/v2/node-executions/{id}/retry
```

受控跳过：

```http
POST /api/v2/node-instances/{id}/controlled-skip
```

必须：

- 高权限；
- reason；
- 二次确认；
- audit；
- policy check。

## 14. Professional Runtime Context

打开 WorkItem 前：

```http
GET /api/v2/work-items/{id}/runtime-context
```

返回：

```json
{
  "nodeType": "FIELD_SAMPLING",
  "runtimeRendererKey": "field-sampling-workbench",
  "schemaVersion": "1",
  "permissions": [],
  "businessRefs": {},
  "context": {}
}
```

## 15. Asset Manager Context

从 Scenario Studio 跳到标准管理：

```http
GET /api/v2/standards?scenarioVersionId=...
```

保存绑定：

```http
POST /api/v2/scenario-versions/{id}/compliance-bindings
```

资产本体与场景 binding API 必须分开。

## 16. Error Codes

最低要求：

```text
SCENARIO_VERSION_IMMUTABLE
SCENARIO_NOT_PUBLISHABLE
SCENARIO_VALIDATION_STALE
SCENARIO_CAPABILITY_MISSING
SCENARIO_ASSET_VERSION_MISSING
SCENARIO_UI_RENDERER_MISSING
SCENARIO_NOT_ACTIVE
WORKFLOW_INVALID
WORKFLOW_NODE_TYPE_NOT_FOUND
WORKFLOW_EXECUTOR_NOT_FOUND
PROCESS_STATE_CONFLICT
WORK_ITEM_NOT_ASSIGNABLE
WORK_ITEM_ALREADY_COMPLETED
NODE_EXECUTION_FAILED
NODE_RETRY_EXHAUSTED
CONTROLLED_SKIP_NOT_ALLOWED
```
