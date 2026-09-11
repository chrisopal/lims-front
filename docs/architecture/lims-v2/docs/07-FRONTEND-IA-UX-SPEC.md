# 07 · Frontend IA & UX Spec v2

## 1. UI 基线

遵循本包 `enterprise-ui-standard`：

- 单一蓝色交互体系；
- 蓝灰中性色；
- 浅灰画布、白色面板；
- 细边框、轻层级；
- 14px 正文；
- 4px 控件圆角；
- 6px 面板圆角；
- 220px 侧栏；
- 48px 顶栏；
- 不使用装饰渐变、毛玻璃、光晕、厚阴影；
- 专业工作面优先效率和上下文连续性。

## 2. 一级信息架构

```text
工作台

业务运行
  委托 / 申请
  我的工作
  检测对象 / 样品
  检测任务
  审核中心
  报告

场景中心
  场景包
  已发布场景
  场景激活
  发布记录

业务资产
  检测项
  法律法规与标准
  检测方法
  限值与公式
  动态表单
  报告模板

流程与能力
  流程设计器
  节点类型
  AI Skills
  集成能力

资源
  设备
  人员资质
  实验室资源

平台管理
  组织与实验室
  角色权限
  审计
  系统设置
```

## 3. 场景包列表

页面结构：

```text
PageHeader: 场景包                              [新建场景包]
Filter: 关键字 / 状态 / 领域 / 业务模式 / 所属实验室
Table/List
```

列：

```text
场景名称
场景Key
当前编辑版本
当前发布版本
业务模式
领域
完整度
状态
最近修改
操作
```

主要操作：

- 打开 Draft；
- 创建新版本；
- 查看已发布版本；
- Diff；
- 导出 YAML；
- 复制场景。

## 4. Scenario Pack Studio

### Header

```text
← 场景包 / 第三方食品理化检测
第三方食品理化检测     v1.3.0   Draft
完整度 72% · 2 warnings · 上次保存 15:26
                              [更多] [保存草稿] [校验] [发布]
```

### 左侧配置生命周期

宽约 240px：

```text
✓ 01 基础信息
✓ 02 检测对象
● 03 检测项                    16 / 18
! 04 法律法规与标准             2项待处理
○ 05 检测方法与限值
○ 06 检测流程
○ 07 动态表单
○ 08 资源与资质
○ 09 报告
○ 10 AI能力
○ 11 发布检查
```

步骤来自 API，不在前端写死。

### 中间主工作面

按 `rendererKey / stepType` 加载。

### 右侧 Context Panel（有需要才出现）

```text
步骤说明
完成条件
依赖项
校验问题
影响范围
```

不要每页都强制显示右栏。

## 5. 检测项配置 Step

建议采用连续表格 + Drawer 编辑，而不是卡片墙。

列：

```text
检测项
适用对象
法规/标准
方法
限值规则
公式
设备能力
人员资质
报告模板
状态
```

行状态：

- 完整；
- 缺方法；
- 缺标准；
- 版本失效；
- Warning。

可从公共“检测项管理”选择并绑定。

## 6. 法律法规与标准 Step

场景内页面只显示“绑定关系”和缺口。

提供：

```text
[选择现有法规/标准]
[进入标准法规库管理]
```

跳转后顶部显示 Context Bar：

```text
场景上下文：第三方食品理化检测 v1.3.0 / 法律法规与标准
                                                [保存并返回场景]
```

标准管理仍是独立专业菜单。

## 7. Workflow Designer

三栏：

```text
Node Palette 260px | Canvas flexible | Inspector 320px
```

Palette 分组：

```text
流程控制
实验室通用
现场作业
专业检测
审核与报告
自动化 / AI / 集成
```

节点卡显示：

- icon；
- name；
- execution mode 小标签；
- capability source（Tooltip）。

Canvas：

- 只用轻边框节点；
- 当前选择蓝色描边；
- 错误节点红色标识 + 文本；
- 不做发光或 3D。

Inspector：

```text
基本属性
执行配置
进入/完成条件
角色与 SLA
Input/Output Mapping
失败与重试
UI Renderer
Audit
```

## 8. Node Type Catalog

面向平台管理员/产品工程师。

列表：

```text
Node Type
类别
Execution Mode
Executor
Config Renderer
Runtime Renderer
Source Module
Version
状态
```

点击查看 Descriptor，不在 UI 允许修改编译代码级 Executor。

## 9. 发布检查

采用“Preflight Checklist + Blocking Issues”。

顶部：

```text
发布检查
9/11 通过 · 2 Errors · 3 Warnings
```

分组：

```text
基础信息
检测能力
法规标准
流程
UI Renderer
资源/资质
报告
AI Policy
权限
```

每条 issue 支持：

- 定位到步骤；
- 打开对象；
- 查看影响。

底部发布操作仅 Error = 0 可用。

## 10. 已发布场景 Catalog

展示运行态可用场景：

```text
场景名称
版本
状态
激活实验室
运行实例数
最近发布时间
```

详情页：

```text
Overview
Versions
Activation
Dependencies
Runtime Usage
Release History
```

Published 页面没有“编辑”按钮，主动作是：

```text
[创建新版本]
```

## 11. Version Diff

左右或单栏 diff：

```text
v1.2.0 Published  →  v1.3.0 Draft
```

分组显示：

- Added Test Item；
- Changed Standard Version；
- Workflow Node Added/Removed；
- Report Template Changed；
- AI Skill Version Changed。

## 12. Request Composer v2

第一步改为：

```text
选择检测场景
```

不要先要求用户理解 Business Mode Pack。

场景可搜索/按领域过滤。

选择后：

```text
加载 Snapshot
→ 动态渲染 Request / Subject / Test Item
```

顶部显示：

```text
使用场景：第三方食品理化检测 v1.2.0
```

## 13. My Work

统一 Human Task：

筛选：

```text
全部 / 今日 / 超时 / 现场 / 实验室 / 审核
```

列：

```text
任务
流程节点
场景
委托号
对象
地点
截止时间
状态
```

点击后根据 Runtime Renderer 打开专业工作面。

## 14. Field Sampling Workbench

桌面优先两栏：

左：

```text
采样任务
点位与地图信息
计划/时间
人员设备
```

主区：

```text
现场条件
采样记录
容器与保存条件
照片/附件
现场仪器读数
Chain of Custody
```

固定底部操作：

```text
[保存草稿] [完成采样]
```

移动端需适配现场操作，但 v2 Figma 主原型先做桌面版，可增加 390px 样板。

## 15. Onsite Inspection / Metrology Workbench

三段：

```text
现场上下文
检测/测量记录
结果与确认
```

计量场景显示：

```text
Part → Feature → Characteristic
Tolerance
Measurement
Uncertainty
Instrument
```

## 16. 状态与反馈

必须包含：

- loading；
- empty；
- permission denied；
- validation error；
- stale version conflict；
- published immutable；
- executor unavailable；
- offline/现场网络异常（后期移动端）。

## 17. 组件建议

```text
ScenarioPackTable
ScenarioLifecycleStepper
ScenarioStepHost
ScenarioContextBar
TestCapabilityMatrix
ComplianceBindingPanel
WorkflowDesigner
WorkflowNodePalette
WorkflowNodeInspector
ScenarioPreflight
ScenarioVersionDiff
PublishedScenarioCatalog
RuntimeScenarioSelector
WorkItemList
NodeRuntimeHost
FieldSamplingWorkbench
OnsiteInspectionWorkbench
```

这些组件不得硬编码 Food / Environment / Metrology 业务字段。
