/**
 * pnpm 安装钩子。
 *
 * registry-js 是 Windows 专用的原生模块：
 *   1) 它的 binding.gyp 只在 OS=="win" 时才声明源文件；
 *   2) 运行时也只有 downloads-folder 的 windows() 分支会 require 它。
 *
 * 但它自身没有声明 os 字段，导致 pnpm 在 macOS/Linux 上也会安装它，
 * 进而被 electron-builder 的 buildDependenciesFromSource 拉去做无意义的源码重编译，
 * CI 上表现为长时间卡在 "preparing moduleName=registry-js"。
 *
 * 这里把它限定为 win32，让 pnpm 在非 Windows 平台直接跳过安装。
 */
function readPackage(pkg) {
  if (pkg.name === "registry-js") {
    pkg.os = ["win32"];
  }
  return pkg;
}

module.exports = {
  hooks: {
    readPackage,
  },
};
