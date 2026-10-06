# 开发与打包指南

本文档说明 FileShare 项目的依赖管理方式、各模块的开发/构建命令，以及 Electron 与 uTools 的打包流程。

## 一、环境要求

| 依赖 | 版本 | 说明 |
|------|------|------|
| Node.js | >= 22 | pnpm 12 的要求；CI 使用 22 |
| pnpm | 12.9.1 | 通过 corepack 管理，版本已固定在根 `package.json` 的 `packageManager` 字段 |

启用 pnpm（Node 22 自带 corepack）：

```bash
corepack enable
pnpm --version   # 应输出 12.9.1
```

## 二、目录结构与依赖管理方式

本项目是「混合」结构：核心三件套用 pnpm workspace 统一管理，两个前端应用保持独立。

| 目录 | 包名 | 是否 workspace 成员 | 包管理器 |
|------|------|--------------------|----------|
| `shared/` | `@file-share/shared-utils` | 是 | pnpm |
| `electron/` | `fileshare` | 是 | pnpm |
| `utools/preload/` | `file-share-utools` | 是 | pnpm |
| `page_app/` | `file-share-app` | 否 | pnpm |
| `page_web/` | `file-share-web` | 否 | pnpm |

workspace 成员在根目录 [pnpm-workspace.yaml](../pnpm-workspace.yaml) 中声明。

### 2.1 依赖链接方式（重要）

pnpm 默认使用 **isolated** 模式：

- 每个 workspace 包目录下都有**自己的 `node_modules`**；
- 但其中的条目是指向仓库根 `node_modules/.pnpm` 的 **junction / 软链接**，不是真实文件；
- 工作区内部包以链接形式互相引用，例如：
  `electron/node_modules/@file-share/shared-utils` → `../../shared`

这一点对打包有直接影响：`electron-builder` 与 uTools 都需要**真实文件**，不能是软链。项目已针对两者分别验证/处理（见第四、五节）。

### 2.2 构建脚本白名单

pnpm 10+ 出于供应链安全考虑，**默认禁止依赖执行安装脚本**。缺少白名单时会报错：

```
ERR_PNPM_IGNORED_BUILDS
Ignored build scripts: electron@..., registry-js@...
```

需要放行的包写在 [pnpm-workspace.yaml](../pnpm-workspace.yaml) 的 `allowBuilds` 中：

```yaml
allowBuilds:
  electron: true      # postinstall 下载 Electron 二进制
  registry-js: true   # 原生模块，需要 node-gyp 编译
```

**新增原生依赖时**，若安装报此错误，把包名加入 `allowBuilds` 即可。

## 三、安装依赖

```bash
# 1. 根目录：一次装好 shared + electron + utools/preload
pnpm install

# 2. 两个独立前端应用（仍用 npm）
cd page_app && npm install
cd page_web && npm install
```

## 四、Electron 开发与打包

### 4.1 开发

```bash
pnpm --filter fileshare run dev
```

### 4.2 构建与打包

```bash
pnpm --filter fileshare run build          # 仅 webpack 构建（产出 electron/dist）
pnpm --filter fileshare run release:win    # 完整打包 Windows
pnpm --filter fileshare run release:mac    # 完整打包 macOS
pnpm --filter fileshare run release:linux  # 完整打包 Linux
```

也可以先 `cd electron`，再 `pnpm run <script>`。

### 4.3 打包前置：必须先构建两个前端

`release:*` 只做 webpack 构建 + electron-builder，**不会**自动构建前端资源。打包前需要：

```bash
# 产出 electron/dist/page_app（Electron 窗口界面）
cd page_app && npm run build:desktop

# 产出 shared/page_web（局域网浏览器访问的页面）
cd page_web && npm run build
```

否则打出来的包会缺少界面资源。

### 4.4 pnpm 与 electron-builder 的兼容性

**结论：pnpm isolated 模式下 electron-builder 25.1.8 可正常工作，无需额外配置。**

原理：`@file-share/shared-utils` 在 webpack 中被 `externals` 外置（`electron/.electron_build/webpack.*.config.js` 把所有 `dependencies` 设为 external），运行时从 `node_modules` 解析。electron-builder 会**解引用 junction**，把 `shared-utils` 及其全部传递依赖（express、multer、archiver、registry-js 等）以**真实文件**复制进产物。

已验证结果（`electron/build/win-unpacked/resources/app/node_modules/`）：

- `@file-share/shared-utils` 为真实目录，非软链；
- 传递依赖齐全，原生模块 `registry-js` 已按 Electron ABI 重新编译；
- 未混入 `page_app` / `page_web` 的依赖（无 `element-plus` / `vue` / `tailwindcss` 等）。

**升级 electron-builder 或调整 `node-linker` 后，请重新按此清单验证产物。**

## 五、uTools 打包

### 5.1 依赖固化（必做）

uTools 打包要求依赖是**真实文件**，而 pnpm 的 junction 结构指向工作区外的虚拟 store，无法直接打包。因此提供了固化脚本：

```bash
pnpm run prepare:utools-preload
```

脚本 [scripts/prepare-utools-preload-deps.js](../scripts/prepare-utools-preload-deps.js) 的流程：

1. `pnpm pack` 打包 `shared`（会触发 `prepack`，先重新构建 `page_web` 并同步到 `shared/page_web`）；
2. 在 `.tmp/` 临时目录用 npm 安装该 tgz，得到**扁平、真实文件**的 `node_modules`；
3. 用其整体替换 `utools/preload/node_modules`；
4. 清理临时目录。

> 说明：这一步刻意使用 npm 并脱离 workspace，目的是绕开 pnpm 的软链结构，得到可直接打包的扁平依赖树。

### 5.2 打包步骤

```bash
# 1. 固化 preload 依赖
pnpm run prepare:utools-preload

# 2. 构建 uTools 界面到 utools/page_app
cd page_app && npm run build:utool

# 3. 用 uTools 开发者工具加载 utools/ 目录并打包
```

`utools/plugin.json` 指向 `preload/index.js` 与 `page_app/index.html`。

## 六、CI 发布流程

[.github/workflows/release.yml](../.github/workflows/release.yml) 在推送 `v*` tag 时触发：

1. `pnpm/action-setup` 安装 pnpm，`actions/setup-node` 使用 Node 22 并缓存 pnpm store；
2. `pnpm install --frozen-lockfile` 安装 workspace 依赖；
3. `page_app` / `page_web` 仍用 `npm install` 单独安装并构建；
4. 在 `electron/` 目录执行 `pnpm run release:linux|mac|win`；
5. 上传产物到 GitHub Release。

## 七、常见问题

**Q：`pnpm install` 报 `ERR_PNPM_IGNORED_BUILDS`？**
把报错里列出的包名加入 [pnpm-workspace.yaml](../pnpm-workspace.yaml) 的 `allowBuilds`。

**Q：改了 `shared/` 的代码，electron 里没生效？**
workspace 链接是实时的，通常无需重装。若确认未生效，执行 `pnpm install` 重新链接。

**Q：`page_app` / `page_web` 为什么不用 pnpm？**
它们不属于 workspace，保持独立的 npm 安装与锁文件，改动隔离、互不影响。

**Q：uTools 打包后运行报模块找不到？**
多半是漏跑了 `pnpm run prepare:utools-preload`，导致 `utools/preload/node_modules` 仍是软链。
