# File Share Shared Utils

这是一个为 file-share 项目提供的共享工具库，包含了 Electron 和 uTools 平台都需要使用的通用工具函数。

## 安装

在项目中添加依赖：

```json
{
  "dependencies": {
    "@file-share/shared-utils": "^1.0.0"
  }
}
```


```bash
npm install

# 在 shared 目录下执行
cd shared

# 检查包配置
npm pack --dry-run

# 补丁版本更新 (1.0.0 -> 1.0.1)
npm version patch

# 次要版本更新 (1.0.0 -> 1.1.0)
npm version minor

# 主要版本更新 (1.0.0 -> 2.0.0)
npm version major

# 预发布版本 (1.0.0 -> 1.0.1-0)
npm version prerelease

# 指定具体版本号
npm version 1.0.1

# 发布到 npm
npm publish
```