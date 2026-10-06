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

> 注意：全仓库统一使用 pnpm，**不要**在子目录里用 `npm install`。混用会产生双锁文件和结构冲突的 `node_modules`。

## 二、目录结构与 workspace 成员

所有子项目都已纳入 pnpm workspace，成员在根目录 [pnpm-workspace.yaml](../pnpm-workspace.yaml) 中声明。

| 目录 | 包名 | 职责 |
|------|------|------|
| `shared/` | `@file-share/shared-utils` | 共享工具库（Server、FileDb、Setting 等） |
| `electron/` | `fileshare` | Electron 桌面应用 |
| `utools/preload/` | `file-share-utools` | uTools 插件 preload |
| `page_app/` | `file-share-app` | 应用界面（Electron 窗口 / uTools 界面） |
| `page_web/` | `file-share-web` | 局域网浏览器访问页面 |

### 2.1 依赖链接方式（重要）

pnpm 默认使用 **isolated** 模式：

- 每个包目录下都有**自己的 `node_modules`**；
- 但其中条目是指向仓库根 `node_modules/.pnpm` 的 **junction / 软链接**，不是真实文件；
- 工作区内部包以链接形式互相引用，例如：
  `electron/node_modules/@file-share/shared-utils` → `../../shared`

这一点对打包有直接影响：`electron-builder` 与 uTools 都需要**真实文件**。项目已分别验证/处理（见第四、五节）。

### 2.2 构建脚本白名单

pnpm 10+ 出于供应链安全，**默认禁止依赖执行安装脚本**，且是**直接报错中断安装**：

```
ERR_PNPM_IGNORED_BUILDS
Ignored build scripts: electron@..., registry-js@...
```

需要放行的包写在 [pnpm-workspace.yaml](../pnpm-workspace.yaml) 的 `allowBuilds` 中：

```yaml
allowBuilds:
  electron: true            # postinstall 下载 Electron 二进制
  registry-js: true         # 原生模块，需要 node-gyp 编译
  "@parcel/watcher": true   # 前端工具链原生模块
  core-js: true
  yorkie: true
```

**新增依赖时若报此错误**，把报错列出的包名加入 `allowBuilds` 即可。

### 2.3 幽灵依赖（phantom dependency）

pnpm 的严格隔离会**暴露**那些「用了但没声明」的依赖——这类代码在 npm 扁平化下能跑，换 pnpm 后就会报 `Module not found`。

本项目已修复一处历史遗留：`page_web` / `page_app` 都 import 了 `@element-plus/icons-vue`，但只在 `element-plus` 的传递依赖里，现已显式加入两个包的 `dependencies`。

**新增 import 时，请确保对应包已写入当前包的 `package.json`**，不要依赖其他包的传递依赖。

## 三、安装依赖

```bash
# 根目录一次装好全部 5 个 workspace 包
pnpm install
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
pnpm --filter file-share-app run build:desktop

# 产出 shared/page_web（局域网浏览器访问的页面）
pnpm --filter file-share-web run build
```

否则打出来的包会缺少界面资源。

### 4.4 pnpm 与 electron-builder 的兼容性

**结论：pnpm isolated 模式下 electron-builder 25.1.8 可正常工作，无需额外配置。**

原理：`@file-share/shared-utils` 在 webpack 中被 `externals` 外置（`electron/.electron_build/webpack.*.config.js` 把所有 `dependencies` 设为 external），运行时从 `node_modules` 解析。electron-builder 会**解引用 junction**，把 `shared-utils` 及其全部传递依赖（express、multer、archiver、registry-js 等）以**真实文件**复制进产物。

已验证结果（`electron/build/win-unpacked/resources/app/node_modules/`）：

- `@file-share/shared-utils` 为真实目录，非软链；
- 传递依赖齐全，原生模块 `registry-js` 已按 Electron ABI 重新编译；
- **未混入** `page_app` / `page_web` 的依赖（无 `element-plus` / `vue` / `tailwindcss` / `axios` 等）。

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

> 说明：这一步刻意使用 npm 并脱离 workspace，目的是绕开 pnpm 的软链结构，得到可直接打包的扁平依赖树。这是**唯一**保留 npm 的地方，属于打包步骤而非依赖管理。

### 5.2 打包步骤

```bash
# 1. 固化 preload 依赖
pnpm run prepare:utools-preload

# 2. 构建 uTools 界面到 utools/page_app
pnpm --filter file-share-app run build:utool

# 3. 用 uTools 开发者工具加载 utools/ 目录并打包
```

`utools/plugin.json` 指向 `preload/index.js` 与 `page_app/index.html`。

## 六、各前端构建命令速查

```bash
# page_app（file-share-app）
pnpm --filter file-share-app run dev
pnpm --filter file-share-app run build:desktop   # → electron/dist/page_app
pnpm --filter file-share-app run build:utool     # → utools/page_app

# page_web（file-share-web）
pnpm --filter file-share-web run dev
pnpm --filter file-share-web run build           # → shared/page_web
```

## 七、CI 发布流程

[.github/workflows/release.yml](../.github/workflows/release.yml) 在推送 `v*` tag 时触发：

1. `pnpm/action-setup` 安装 pnpm，`actions/setup-node` 使用 Node 22 并缓存 pnpm store；
2. `pnpm install --frozen-lockfile` 安装全部 workspace 依赖；
3. `pnpm --filter file-share-app run build:desktop`、`pnpm --filter file-share-web run build` 构建前端；
4. 在 `electron/` 目录执行 `pnpm run release:linux|mac|win`；
5. 上传产物到 GitHub Release。

## 八、常见问题

**Q：`pnpm install` 报 `ERR_PNPM_IGNORED_BUILDS`？**
把报错里列出的包名加入 [pnpm-workspace.yaml](../pnpm-workspace.yaml) 的 `allowBuilds`。

**Q：构建报 `Module not found: Can't resolve 'xxx'`？**
幽灵依赖。把 `xxx` 加进**当前包**的 `dependencies`（不要依赖其他包的传递依赖），再 `pnpm install`。

**Q：改了 `shared/` 的代码，electron 里没生效？**
workspace 链接是实时的，通常无需重装。若确认未生效，执行 `pnpm install` 重新链接。

**Q：uTools 打包后运行报模块找不到？**
多半是漏跑了 `pnpm run prepare:utools-preload`，导致 `utools/preload/node_modules` 仍是软链。

**Q：不小心在子目录跑了 `npm install`？**
删除该目录下的 `package-lock.json` 和 `node_modules`，回到根目录重新 `pnpm install`。
