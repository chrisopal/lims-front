验收记录：[2026-09-11 完整交互前端](docs/FRONTEND_ACCEPTANCE_2026-09-11.md)。

> 当前升级：完整交互前端 v2.2。使用、模拟边界和验收命令见 [交付说明](docs/FRONTEND_INTERACTIVE_V2_2.md)。

# LIMS 前端：下载与本地运行指南

本项目是 **Laboratory Operations Platform / Composable LIMS** 的前端原型，使用 **Vue 3 + TypeScript + Element Plus + Vue Router + Vite**。

本文对应前端 **v2.1**：支持场景选择、委托草稿保存与恢复、检测项选择、我的工作和节点记录的本地演示。**运行这个前端不需要启动 Java / Python 后端、数据库、Docker 或 Figma，也不需要配置 AI API Key。**

> **数据与权限说明**：当前委托、草稿和工作项保存在浏览器本地，不是服务端数据。登录是演示入口，不是真实身份认证。请勿录入真实客户资料、实验结果、个人敏感信息或其他保密数据。场景发布、激活、部分看板和专业页面仍包含独立静态样例。

## 1. 最快启动方式

先安装 **Node.js 22.x（不低于 22.12）**，解压源码，然后在**包含 `package.json` 的文件夹**打开终端，依次执行：

```bash
# 安装项目约定的 pnpm 版本；已安装相同版本可跳过
npm install --global pnpm@10.34.3

# 使用仓库锁文件安装依赖
pnpm install --frozen-lockfile

# 启动本机开发服务；保持这个终端打开
pnpm dev --host 127.0.0.1 --port 5173 --strictPort
```

浏览器访问：

```text
http://127.0.0.1:5173/#/login
```

点击 **「以演示身份进入」** 即可打开工作台，无需申请账号或输入真实密码。

**不要双击 `index.html`，也不要在 `file://` 地址下使用本项目。** 源码需要由 Vite 处理；浏览器本地运行记录也需要合适的访问环境。

## 2. 环境准备

| 工具 | 要求 | 说明 |
| --- | --- | --- |
| Node.js | 22.x，至少 22.12 | 仓库 `.mise.toml` 和 CI 使用 Node 22；Vite 8 对 Node 有最低版本要求 |
| npm | 随 Node.js 提供 | 此处仅用来安装 pnpm；项目依赖仍使用 pnpm 安装 |
| pnpm | **10.34.3** | 与 `.mise.toml` 和 CI 配置保持一致，不使用未固定的大版本 |
| 浏览器 | 支持 Web Locks 的现代浏览器 | 已有正式浏览器检查基于 Chromium；本地演示可先使用 Chrome 或 Edge |
| Git | 可选 | 下载 ZIP 不需要 Git；克隆、拉取更新时才需要 |

通过 Node.js 官方下载页面安装符合要求的 **22.x** 版本；不必跟随页面默认推荐的大版本。安装后重新打开终端并检查：

```bash
node --version
npm --version
npm install --global pnpm@10.34.3
pnpm --version
```

`node --version` 应显示符合要求的 `v22.x.x`；`pnpm --version` 应显示 `10.34.3`。首次安装依赖需要网络访问软件包源。

不便全局安装 pnpm 时，可在项目根目录改用以下方式，两套方式任选其一：

```bash
npx --yes pnpm@10.34.3 install --frozen-lockfile
npx --yes pnpm@10.34.3 dev --host 127.0.0.1 --port 5173 --strictPort
```

## 3. 下载源码，并进入正确目录

### 方式 A：从 GitHub 下载 ZIP

登录有仓库访问权限的 GitHub 账号，打开 `chrisopal/lims-front`，确认分支为 **`main`**，选择 **Code → Download ZIP**。先完整解压，再打开项目目录，不要直接在压缩包里运行。

不同来源的压缩包，进入的目录可能不同：

| 源码来源 | 应进入的目录 |
| --- | --- |
| GitHub 的 main 分支 ZIP | `lims-front-main/` |
| 本地运行包 `LIMS_frontend_v2.1_local_run.zip` | `lims-front-local/` |
| 之前提供的 Figma 同步包 | `lims-figma-site-sync-v2.1/source/`，注意是 `source/`，不是外层说明目录 |

**判断标准：当前文件夹必须能看到 `package.json`、`pnpm-lock.yaml`、`vite.config.ts` 和 `src/`。**

macOS / Linux 示例，实际路径请按解压位置调整：

```bash
cd ~/Downloads/lims-front-main
```

Windows PowerShell 示例：

```powershell
cd "C:\work\lims-front-main"
```

Windows 命令提示符 CMD 跨盘符进入目录时使用：

```bat
cd /d "C:\work\lims-front-main"
```

也可以用 VS Code 打开上述目录，再选择 **Terminal → New Terminal**。

### 方式 B：使用 Git 克隆

已安装 Git 且已获授权时，在用于存放项目的目录执行：

```bash
git clone --branch main https://github.com/chrisopal/lims-front.git
cd lims-front
```

这是私有仓库，需要使用自己的授权 GitHub 登录方式。不要把访问令牌写进源码、README、截图或共享命令。下载后的代码运行本身不需要持续连接 GitHub。

## 4. 启动开发服务

在项目根目录执行：

```bash
pnpm install --frozen-lockfile
pnpm dev --host 127.0.0.1 --port 5173 --strictPort
```

打开 `http://127.0.0.1:5173/`，会进入登录页。终端持续运行代表服务正在提供页面，不是命令卡住。

开发时修改源码，Vite 会更新浏览器预览。停止服务按 **Ctrl + C**；下次使用通常只需重新执行启动命令。拉取了依赖变化后，再安装一次依赖。

### 关于端口和 HTTP

仓库 `vite.config.ts` 为兼容原 Figma 环境，开发和预览配置的端口回退值都是 **8443**，默认监听地址为 `0.0.0.0`，也可受 `PORT`、`FIGMA_DEV_SERVER_HOST` 环境变量影响。

本文显式使用 `--host 127.0.0.1 --port 5173`，只允许本机访问，并固定本地开发端口。**8443 只是端口数字，不代表已配置 HTTPS。** 本文启动命令使用 `http://`。

仅执行 `pnpm dev` 时，以终端实际显示的地址和端口为准；不要同时混用多个地址进行同一份草稿的演示。

## 5. 第一次打开后，如何验证功能

1. 在登录页点击 **「以演示身份进入」**，打开实验室工作台。
2. 进入 **业务运行 → 委托 / 申请**，选择食品理化、环境现场采样或内部几何量场景，创建草稿。
3. 按向导填写必填信息与检测对象，选择至少一个检测项。保存草稿后刷新页面，检查内容是否恢复。
4. 确认信息并点击 **「提交并创建本地工作项」**，进入 **我的工作**。
5. 打开工作台，点击 **「开始处理」**，填写当前节点记录，再保存或完成节点；依次查看后续工作项。

零个检测项不能提交。只选一个检测项，保存重开后仍应保持一个。需要人工确认的节点必须完成确认后才能继续。

常用入口，前提是开发服务已在 5173 端口启动：

```text
登录            http://127.0.0.1:5173/#/login
工作台          http://127.0.0.1:5173/#/app/dashboard
委托 / 申请     http://127.0.0.1:5173/#/app/operations/requests
我的工作        http://127.0.0.1:5173/#/app/operations/my-work
场景包          http://127.0.0.1:5173/#/app/scenarios
已发布场景      http://127.0.0.1:5173/#/app/scenarios/published
```

节点工作台依赖实际创建的本地工作项 ID，请从「我的工作」进入，不要手写随机 ID。

## 6. 构建与本地预览

检查生产构建：

```bash
pnpm build
```

成功后生成 **`dist/`**。随后启动构建结果预览：

```bash
pnpm preview --host 127.0.0.1 --port 4173 --strictPort
```

打开：

```text
http://127.0.0.1:4173/#/login
```

`pnpm dev` 用于开发调试；`pnpm preview` 用于检查已构建的 `dist/`。修改源码后要先重新执行 `pnpm build`，预览才会反映新版本。

**两者都不应直接充当正式对外生产服务。** 本地运行和构建不会自动更新原 `.figma.site` 网站，也不会执行 `.figma/make/deploy`。

## 7. 数据保存与浏览器注意事项

本地运行记录存储在 `localStorage` 的 **`lims.demo.runtime.v1`** 键中，仅用于演示；页面关闭后已成功保存的数据通常仍在，未保存输入则不保证保留。

- 存储按「协议 + 主机名 + 端口」区分。因此 `127.0.0.1:5173`、`localhost:5173`、`127.0.0.1:4173` 和 Figma 站点的草稿互不共享。
- 不同浏览器、浏览器用户配置和隐私窗口的数据也不同。清理网站存储可能删除本地记录。
- 仓库使用 Web Locks 协调多个窗口的本地写入。请使用本机回环地址或 HTTPS。通过普通局域网 HTTP 地址访问时，可能能看页面但无法保存。
- 本文默认不向局域网开放服务。需要手机访问时，应另行配置受控的 HTTPS 预览，不要关闭浏览器安全限制来绕过 Web Locks。
- 本地存储不是权限控制、多租户隔离、受控审计、数字签名或服务器备份。

需要重新开始演示时，先确认所有窗口已停止编辑，并备份需要保留的演示数据。可以在浏览器开发者工具的 **Application / 应用 → Local Storage / 本地存储** 中，仅删除当前来源下的 `lims.demo.runtime.v1`，再刷新。

> 删除该键会清空当前来源下的全部演示草稿、委托、工作项和历史，且没有应用内恢复功能。不要清空所有网站的存储。

## 8. 测试命令（开发人员可选）

只为打开页面演示时，可跳过本节。

### 运行模型测试

```bash
pnpm test:runtime
```

该脚本会严格检查并编译 `src/runtime`，然后运行领域 / 状态测试。**它不是全项目 `vue-tsc`、lint 或后端 E2E 检查。**

### 浏览器检查

下面与仓库 CI 的检查路径保持一致。测试工具单独安装到 `.qa-tools/`，不更换应用依赖。

先安装依赖、构建并生成测试需要的 `.qa-domain/`：

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm test:runtime
npm install --prefix .qa-tools --no-save --package-lock=false playwright@1.59.0
node .qa-tools/node_modules/playwright/cli.js install chromium
```

Linux 缺少浏览器系统依赖时，可按 Playwright 提示将最后一条改为 `install --with-deps chromium`；这可能需要安装系统软件的权限。CI 另安装了 `fonts-noto-cjk`，本地字体差异会影响截图。

在**终端 A**启动预览并保持运行：

```bash
pnpm preview --host 127.0.0.1 --port 4173 --strictPort
```

在**终端 B**进入同一项目根目录，依次执行：

```bash
node scripts/qa/browser-check.mjs
node scripts/qa/interaction-check.mjs
node scripts/qa/runtime-browser-check.mjs
```

默认输出目录是 `qa-artifacts/`，包含截图和 JSON 报告。每个命令都要单独检查结果与退出码；后一个成功不代表前一个成功。重新运行可能覆盖同名测试文件，需要留档时先复制已有结果。

测试默认针对 `http://127.0.0.1:4173`，可以用 `QA_BASE_URL` 指定其他本地测试地址。脚本使用隔离浏览器上下文，不是日常使用的浏览器配置，但仍应只对演示环境运行。

已有检查覆盖浅色 Chromium 的多个尺寸和交互，不等于所有浏览器、完整可访问性或已批准截图基线的像素比对。CI 配置见 [enterprise-validation.yml](.github/workflows/enterprise-validation.yml)。

## 9. 常见问题

| 问题 | 检查与处理 |
| --- | --- |
| `pnmp` 找不到命令 | 正确名称是 **`pnpm`**，注意字母顺序 |
| 找不到 `package.json` / `ERR_PNPM_NO_IMPORTER_MANIFEST_FOUND` | 进入真正源码根目录；旧 Figma 同步包需再进入 `source/` |
| `node`、`npm` 或 `pnpm` 找不到 | 重新打开终端检查安装及 PATH；pnpm 可使用第 2 节的 `npx` 方式 |
| Windows 提示 `pnpm.ps1` 不允许执行 | 在公司允许的终端环境使用 CMD，或执行 `pnpm.cmd install --frozen-lockfile`、`pnpm.cmd dev --host 127.0.0.1 --port 5173 --strictPort`；不要为此全局放开脚本执行策略 |
| 全局安装 pnpm 报 `EACCES` | 使用 `npx --yes pnpm@10.34.3 ...`，或修复自己的 Node 用户安装目录；不需要修改系统目录为所有人可写 |
| Vite 提示 Node 版本过低 | 检查当前终端的 `node --version`，切换到 Node 22.12 或更高的 22.x；装了新版本不代表 PATH 已切换 |
| 端口已被占用 | 关闭自己之前的开发服务，或把命令中的 5173 改为 5174，再打开相应地址；地址变化会使用另一份本地存储 |
| `ERR_PNPM_OUTDATED_LOCKFILE` | 确认 `package.json` 和 `pnpm-lock.yaml` 来自同一提交；重新完整下载。不要直接删锁文件或去掉冻结选项掩盖文件不一致 |
| 安装依赖超时 / 无法连接包源 | 检查网络、企业代理和已批准的软件包源；不要关闭 TLS 校验，也不要使用来历不明的安装脚本 |
| 打开页面空白 | 确认服务仍在运行、使用 HTTP 地址而非双击 HTML、路径含 `/#/`；查看终端和浏览器控制台首个错误 |
| 预览提示 `dist` 不存在 | 先执行 `pnpm build`，成功后再执行 `pnpm preview` |
| 保存提示 `LOCK_UNAVAILABLE` | 使用支持 Web Locks 的浏览器和本文的回环地址；检查是否被企业策略阻止，不要禁用安全检查 |
| 草稿“消失”或我的工作为空 | 检查主机名、端口、浏览器配置是否改变；仅创建草稿还不会产生工作项，需要提交 |
| 保存提示版本冲突 | 另一窗口可能已修改同一记录。先保留当前输入，再重新加载最新版本；不要直接覆盖存储 |
| 点击某些发布、AI 或统计操作没有真实后台结果 | 对应区域仍是原型或静态样例。当前没有后台发布引擎、真实 AI 调用、仪器采集和报告签章 |
| 构建提示 chunk 大于 500 kB | 这是需要后续优化的体积警告，不能当作“无警告通过”；检查是否同时存在真正导致命令失败的错误 |

## 10. 更新代码与目录说明

Git 克隆的项目，先停止本地服务并保存自己的改动，然后同步：

```bash
git status
git switch main
git pull --ff-only origin main
pnpm install --frozen-lockfile
pnpm dev --host 127.0.0.1 --port 5173 --strictPort
```

本地有改动或分支已分叉时，应先处理冲突；不要用 `reset --hard` 丢弃自己的工作。ZIP 下载目录没有 `.git`，不能直接 `git pull`，需要另行下载新的完整 ZIP。

```text
lims-front/
├── readme.md                         # 本地运行说明
├── package.json                      # 启动、构建和运行模型测试命令
├── pnpm-lock.yaml                    # 依赖锁文件，请保留
├── .mise.toml                        # Node / pnpm 工具链约定
├── vite.config.ts                    # Vite 和端口配置
├── src/
│   ├── main.ts / App.vue             # Vue 入口
│   ├── router/                       # Hash 路由
│   ├── views/                        # 业务与专业工作面
│   ├── components/runtime/           # 动态字段、检测项选择等组件
│   ├── runtime/                      # 本地演示数据模型和场景定义
│   ├── composables/useLocalRuntime.ts # 浏览器存储适配
│   └── styles/                       # 企业 UI 与响应式样式
├── scripts/qa/                       # 领域和浏览器检查
├── docs/FRONTEND_RUNTIME_V2_1.md       # 能力与边界说明
└── .github/workflows/                # CI 工作流
```

`node_modules/`、`dist/`、`.qa-domain/`、`.qa-tools/` 和 `qa-artifacts/` 是安装、构建或测试时生成的内容；源码下载包不需要附带它们。

## 11. 说明依据与进一步阅读

项目专有命令、端口、登录方式和数据边界以仓库中的 `package.json`、`.mise.toml`、`vite.config.ts`、`src/views/Login.vue`、`src/runtime/` 及 [v2.1 运行模型说明](docs/FRONTEND_RUNTIME_V2_1.md) 为准。工具安装和浏览器环境补充参考：

- [Node.js 官方下载](https://nodejs.org/en/download)
- [pnpm 10.x 安装说明](https://pnpm.io/10.x/installation)
- [Vite 8 Node.js 版本要求](https://vite.dev/blog/announcing-vite8)
- [Vite 构建与本地预览](https://vite.dev/guide/static-deploy.html)
- [MDN Web Locks API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API)
- [MDN 安全上下文与本机回环地址](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Secure_Contexts)

本文提供本地运行和复验步骤，不宣称执行这些命令就完成了后端联调、生产合规验收或原 Figma 站点同步。
