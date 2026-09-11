# 前端服务边界

本地仓库模拟交互，不是后端实现。领域 API 沿用 docs/architecture/lims-v2/docs/06-API-CONTRACT-V2.md。

| 前端边界 | 本地操作 | 后端接入要求 |
|---|---|---|
| ScenarioRepository | read/create/fork/save/publish/activate/available | GET/POST/PATCH 场景版本；服务端校验、快照、版本锁与实验室激活 |
| CatalogRepository | read/save/remove | 版本化资产/资源 CRUD；引用检查和服务端权限 |
| LocalRuntimeRepository | createDraft/saveDraft/submitDraft/startWork/saveWork/reviewWork/generateReport | 委托、幂等提交、工作项乐观锁、审核退回 |

Vue 页面通过 composables 订阅数据；由适配器负责读写和错误。不允许让后端直接信任浏览器保存的快照或角色。运行请求必须由服务器重新解析已激活快照 ID。

版本冲突必须返回可区分错误，保留用户输入；失败不触发成功通知。发布操作与激活操作分开。历史请求复制发布定义和绑定资产，不读取未发布草稿。

角色与实验室选择是前端演示会话。正式接入时由认证服务返回身份、权限及组织范围，服务端对每个命令重新检查。

本地节点以受控注册表和顺序人工工作项演示。Java、AI、仪器、异步计时器、外部事件与数字签名由未来后台运行时提供；页面中的配置不能执行任意脚本。
