# LIMS 完整交互前端 v2.2

## 使用

沿用 Vue 3、Element Plus、TypeScript 和 Vite。进入登录页选择演示角色与实验室，默认平台管理员可操作全部本地功能。数据分别存储于场景、资产和运行仓库，刷新保留。

1. 场景包：创建空白草稿，或从食品、环境、内部几何量、现场几何量、新能源、高校科研示例创建新版本。
2. 配置对象表单、检测项和标准方法、动态表单、节点顺序、资源资质及报告模板。动态表单资产可套用到委托和节点。
3. 校验通过后发布。发布复制定义和资产版本；修改需创建新版本。
4. 在场景激活页指定实验室。委托选择器只读取该实验室可用版本。
5. 创建委托、保存或提交；在我的工作处理节点。对象、任务、审核、报告与工作台使用同一运行仓库。
6. 审核退回生成返工工作项；历史审核记录保留。报告从对应请求的实际记录生成，并展示冻结模板引用，支持预览与导出。
7. 资产与资源目录支持筛选、详情、新增、编辑、版本复制、启停、删除和导出。角色策略影响前端可用操作。

## 配置包

导出的 JSON 包包含独立的 ScenarioPack manifest、WorkflowDefinition 和前端版本数据。manifest 与 workflow 对照 architecture/lims-v2/schemas 校验。配置包不包含 Java/AI/设备执行代码。高校以 HYBRID 业务模式加 customerMode 标签表达，不私自扩展既有后端 schema 枚举。

## 验证

```sh
pnpm install --frozen-lockfile
pnpm test:runtime
pnpm build
npm install --prefix .qa-tools --no-save --package-lock=false playwright@1.58.2 vue-tsc@3.2.5 typescript@5.9.3
node .qa-tools/node_modules/vue-tsc/bin/vue-tsc.js --noEmit
.qa-tools/node_modules/.bin/playwright install chromium
pnpm preview --host 127.0.0.1 --port 4173 --strictPort
# 另一个终端
node scripts/qa/browser-check.mjs
node scripts/qa/interaction-check.mjs
node scripts/qa/runtime-browser-check.mjs
node scripts/qa/scenario-browser-check.mjs
node scripts/qa/catalog-browser-check.mjs
node scripts/qa/session-browser-check.mjs
```

浏览器证据位于 qa-artifacts。运行脚本生成各自 JSON 结果，不以成功提示或截图替代持久化回读。

## 模拟边界

此交付仅为前端：浏览器顺序工作项模拟不等于后台流程引擎。仪器、AI、外部系统、异步计时器、并行网关、正式鉴权与电子签章由后端接入提供。系统设置和集成策略可编辑保存，后台执行行为不在本次交付内。浏览器角色策略不构成服务端访问控制。

旧的独立现场示例已改成关联实际委托的工作项入口，不再展示与运行数据无关的可编辑假任务。
