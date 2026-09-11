# 04 · Node SPI & UI Extension Specification

## 1. 目标

让“流程节点”同时具备：

- 设计态描述；
- 后端执行能力；
- 前端配置能力；
- 运行态专业工作面；
- 输入输出契约；
- 权限和审计策略。

## 2. NodeTypeDescriptor

建议：

```java
public record NodeTypeDescriptor(
    String key,
    String name,
    NodeCategory category,
    ExecutionMode executionMode,
    String executorKey,
    String configSchemaKey,
    String inputSchemaKey,
    String outputSchemaKey,
    String configRendererKey,
    String runtimeRendererKey,
    Set<String> requiredCapabilities,
    Set<String> requiredPermissions,
    String version
) {}
```

## 3. ExecutionMode

```text
HUMAN_TASK
JAVA_SERVICE
RULE
INTEGRATION
AI
SUBPROCESS
TIMER_EVENT
FLOW_CONTROL
```

## 4. NodeExecutor

```java
public interface NodeExecutor {
    String executorKey();

    NodeStartResult start(NodeExecutionContext context);

    NodeResumeResult resume(
        NodeExecutionContext context,
        NodeSignal signal
    );
}
```

## 5. Start Result

```java
sealed interface NodeStartResult {
    record Completed(Map<String,Object> output) implements NodeStartResult {}
    record Waiting(WaitReference waitReference) implements NodeStartResult {}
    record Failed(NodeFailure failure) implements NodeStartResult {}
}
```

## 6. Context

```java
public record NodeExecutionContext(
    TenantId tenantId,
    LabEntityId labEntityId,
    ScenarioPackVersionId scenarioVersionId,
    ScenarioSnapshotId snapshotId,
    TestRequestId requestId,
    ProcessInstanceId processInstanceId,
    NodeInstanceId nodeInstanceId,
    Map<String,Object> nodeConfig,
    Map<String,Object> inputs,
    ActorContext actor,
    TraceId traceId
) {}
```

## 7. Capability Registration

通过 Spring Bean / ServiceLoader / 明确模块注册，不允许 YAML 加载任意 class name。

场景 YAML 只能写：

```yaml
nodeType: FIELD_SAMPLING
```

Registry 将其解析为可信 Descriptor。

## 8. 示例：Field Sampling

```text
NodeType            FIELD_SAMPLING
ExecutionMode       HUMAN_TASK
Executor            fieldSamplingExecutor
ConfigSchema        field-sampling-node-config-v1
InputSchema         field-sampling-input-v1
OutputSchema        field-sampling-output-v1
ConfigRenderer      field-sampling-node-config
RuntimeRenderer     field-sampling-workbench
```

`fieldSamplingExecutor.start()`：

1. 校验 Field Sampling Capability；
2. 创建 FieldTask；
3. 生成 WorkItem；
4. 返回 WAITING；
5. 等用户现场完成；
6. resume 后校验 Chain of Custody / Required Evidence；
7. 完成节点。

## 9. 示例：Onsite Inspection

```text
NodeType            ONSITE_INSPECTION
ExecutionMode       HUMAN_TASK
RuntimeRenderer     onsite-inspection-workbench
```

运行工作面：

- 现场地址；
- 预约时间；
- 检测对象；
- 人员；
- 携带设备；
- 方法/SOP；
- 原始记录；
- 照片；
- 结果；
- 客户确认（如适用）。

## 10. UI Extension Registry

前端不允许根据行业写：

```ts
if (scenario.domain === 'environment') {...}
```

统一 Registry：

```ts
export interface UiExtensionDescriptor {
  key: string
  extensionType:
    | 'SCENARIO_SETUP_RENDERER'
    | 'NODE_CONFIG_RENDERER'
    | 'NODE_RUNTIME_RENDERER'
    | 'SUBJECT_EDITOR'
    | 'RESULT_EDITOR'
    | 'ASSET_BINDING_RENDERER'
    | 'DASHBOARD_WIDGET'
  component: Component
  schemaVersions: string[]
  requiredPermissions?: string[]
}
```

## 11. UI Extension 加载策略

MVP 推荐：

- 组件随主前端构建；
- 启动时注册 Renderer；
- 后端只下发 Renderer Key；
- 未找到专用 Renderer 时使用 Generic Metadata Renderer（仅适用于声明允许 fallback 的 Node）。

后期如做微前端，需要单独的签名/来源/版本治理，不在 v2 MVP 开放任意 URL 加载。

## 12. Setup Renderer

Scenario Pack setup step 可以引用：

```text
scenario-basic-editor
subject-type-binding-editor
test-capability-matrix
compliance-binding-editor
workflow-editor-launcher
resource-policy-editor
report-binding-editor
ai-skill-binding-editor
publish-validation-view
```

## 13. Node Config Renderer

Workflow Designer Inspector 中按 `configRendererKey` 渲染。

例如 Field Sampling 配置：

```text
是否需要GPS
是否要求现场照片
Chain of Custody 是否必需
采样容器规则
保存条件
现场设备要求
候选执行角色
```

## 14. Runtime Renderer

My Work 打开 WorkItem 时：

```text
WorkItem
→ NodeInstance
→ NodeTypeDescriptor
→ runtimeRendererKey
→ UIExtensionRegistry.resolve()
→ render
```

## 15. 后端权限仍是最终边界

Renderer 的按钮隐藏不能作为权限控制。

所有 Command API 必须重新：

- 鉴权；
- 数据范围；
- NodeInstance 当前状态；
- WorkItem ownership；
- Domain invariant；
- optimistic lock。

## 16. Node Capability 测试

每个 Node Type 必须有：

- Descriptor test；
- Config schema test；
- Start/Resume unit test；
- Idempotency test；
- Permission test；
- UI renderer contract test；
- Workflow compatibility test。
