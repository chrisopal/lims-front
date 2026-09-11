# 03 · Workflow Runtime Specification v2

## 1. 目标

v2 的 Workflow 不是“画图功能”，而是一个可以真实驱动实验室任务执行的 Process Orchestration Runtime。

## 2. 四层模型

```text
WorkflowTemplate        可复用模板（可选）
WorkflowDefinitionDraft 场景编辑态
WorkflowVersion         场景发布时锁定
ProcessInstance         运行实例
```

## 3. WorkflowDefinition

```text
id
key
name
scenario_version_id?
status
version
nodes
edges
variables_schema
created_by
```

## 4. Node Definition

```text
key
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
```

## 5. Edge Definition

```text
from_node
to_node
condition_expression?
priority
label?
```

条件只允许安全表达式语言，不允许任意代码。

## 6. Process Runtime 状态

### ProcessInstance

```text
CREATED
RUNNING
WAITING
COMPLETED
FAILED
CANCELLED
SUSPENDED
```

### NodeInstance

```text
CREATED
READY
RUNNING
WAITING
COMPLETED
FAILED
CANCELLED
SKIPPED
```

## 7. Node 启动算法

伪代码：

```text
1. Lock ProcessInstance
2. Find READY node(s)
3. Build NodeExecutionContext
4. Resolve NodeTypeDescriptor
5. Resolve NodeExecutor
6. Check authorization / capability / resource gate
7. Call executor.start()
8. Persist NodeExecution
9. If COMPLETED → evaluate outgoing edges
10. If WAITING → persist wait reference
11. If FAILED → apply retry/incident policy
12. Emit domain/process event via outbox
```

## 8. Human Task

Human Task Node 的 Executor：

```text
start()
  → create WorkItem
  → return WAITING(workItemId)
```

用户完成：

```text
Complete WorkItem
  → validate payload
  → call domain Application Service
  → persist evidence
  → signal NodeExecution
  → executor.resume()
  → COMPLETED
```

## 9. Java Service Node

用于自动执行核心领域服务。

约束：

- 幂等；
- 不跨模块操作 Repository；
- 失败产生结构化 error code；
- 所有领域写操作经过 Application Service；
- 必须支持 traceId。

## 10. Rule Node

输入：已解析变量 + snapshot reference。

输出：

```text
MATCHED / NOT_MATCHED
result payload
rule execution trace
```

规则版本随 Scenario Snapshot 锁定。

## 11. Integration Node

不在当前事务里同步等待长时间外部系统。

```text
start()
→ create IntegrationJob
→ WAITING

Integration callback / poll completion
→ signal process
→ resume()
```

## 12. AI Node

同 Integration Node，默认异步。

```text
AIExecution
→ evidence
→ policy
→ optional human checkpoint
```

AI 不允许修改 Final State。

## 13. Gateway

### Exclusive

必须确保：

- 条件有明确优先级；
- 可选 default edge；
- 多个条件同时命中时按 priority；
- 无命中且无 default → Incident。

### Parallel

MVP 支持 Fork / Join。

Join policy：

```text
ALL
ANY
N_OF_M（后期）
```

## 14. Timer / SLA

Timer 可用于：

- 延迟执行；
- SLA 预警；
- SLA 违约；
- 超时升级。

Timer 不自动改变核心业务最终状态，除非通过受控 NodeExecutor。

## 15. Retry 与 Incident

RetryPolicy：

```text
max_attempts
backoff
retryable_error_codes
```

Incident：

```text
PROCESS_CONFIGURATION_ERROR
EXECUTOR_NOT_FOUND
RESOURCE_NOT_ELIGIBLE
INTEGRATION_FAILED
AI_FAILED
TIMEOUT
UNHANDLED_GATEWAY
DATA_CONFLICT
```

Incident 支持：

- Retry；
- Assign Operator；
- Controlled Skip（高权限 + reason + audit）；
- Cancel Process。

## 16. Process Signal

Signal 来源：

```text
WorkItem Completed
Integration Completed
AI Completed
Timer Fired
External Business Event
Admin Controlled Command
```

Signal 必须含 idempotency key。

## 17. Domain State 与 Process State

必须分离。

例如：

```text
Process Node = SAMPLE_RECEIPT
```

Node Executor 调用：

```text
SampleApplicationService.receiveSample()
```

Sample 自己决定合法状态转换。

Process Engine 不能直接：

```sql
update lab_sample set status='RECEIVED'
```

## 18. Process Variables

变量只用于编排上下文，不是业务事实主存储。

允许：

```text
requestId
subjectIds
workItem refs
routing decisions
small intermediate values
```

不应存：

- 完整检测结果；
- 标准全文；
- 大附件；
- 时序数据。

## 19. Engine Adapter

产品定义：

```java
ProcessEnginePort
```

实现必须通过统一 Contract。

建议做技术 Spike 验证：

1. Human Task；
2. Exclusive Gateway；
3. Parallel Join；
4. Timer；
5. Async Integration；
6. Node Executor；
7. Process Migration；
8. Audit / Query 性能。

选型结论必须写 ADR。

## 20. Process Migration

Published WorkflowVersion 不修改。

正在运行实例默认继续旧版本。

只有显式、受控 Migration Plan 才允许迁移：

```text
oldNodeKey -> newNodeKey
variable transform
compatibility check
operator approval
```

MVP 不支持任意运行实例自动升级。
