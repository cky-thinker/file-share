const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = path.resolve(__dirname, "..");
const sharedDir = path.join(rootDir, "shared");
const utoolsDir = path.join(rootDir, "utools");
const preloadDir = path.join(utoolsDir, "preload");
const tempRoot = path.join(rootDir, ".tmp", "utools-preload-pack");
const tempPackDir = path.join(tempRoot, "pack");
const tempInstallDir = path.join(tempRoot, "install");

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    shell: true,
  });

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }
  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(" ")}`);
  }
  return result.stdout || "";
}

const debugFileSuffixes = [".map", ".js.gz"];

// 递归清理 uTools 产物中的调试文件（sourcemap、压缩中间产物）
function cleanDebugFiles(dir) {
  if (!fs.existsSync(dir)) {
    return 0;
  }
  let removed = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      removed += cleanDebugFiles(entryPath);
    } else if (debugFileSuffixes.some((suffix) => entry.name.endsWith(suffix))) {
      fs.rmSync(entryPath, { force: true });
      removed += 1;
    }
  }
  return removed;
}

function findPackedTgz(dir) {
  if (!fs.existsSync(dir)) {
    return null;
  }
  const tgzs = fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".tgz"))
    .sort((a, b) => {
      return (
        fs.statSync(path.join(dir, b)).mtimeMs -
        fs.statSync(path.join(dir, a)).mtimeMs
      );
    });
  return tgzs[0] || null;
}

function main() {
  fs.rmSync(tempRoot, { recursive: true, force: true });
  fs.mkdirSync(tempPackDir, { recursive: true });
  fs.mkdirSync(tempInstallDir, { recursive: true });

  // 1. 打包 shared（pnpm pack 会触发 prepack，刷新 shared/page_web 静态资源）
  run("pnpm", ["pack", "--pack-destination", tempPackDir], sharedDir);
  const tgzName = findPackedTgz(tempPackDir);
  if (!tgzName) {
    throw new Error("Unable to find generated tgz from pnpm pack output.");
  }

  // 2. 在仓库外的临时目录里用 npm 安装，得到「扁平、真实文件」的 node_modules。
  //    uTools 打包需要真实文件；pnpm 的软链/junction 结构（指向工作区外的虚拟 store）
  //    无法被直接打包，因此这一步刻意脱离 workspace 单独安装。
  fs.writeFileSync(
    path.join(tempInstallDir, "package.json"),
    `${JSON.stringify(
      {
        name: "utools-preload-bundle",
        private: true,
        dependencies: {
          "@file-share/shared-utils": `file:../pack/${tgzName}`,
        },
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  run(
    "npm",
    ["install", "--omit=dev", "--no-package-lock", "--no-audit", "--no-fund"],
    tempInstallDir
  );

  // 3. 用真实文件整体替换 utools/preload/node_modules
  const preloadNodeModules = path.join(preloadDir, "node_modules");
  fs.rmSync(preloadNodeModules, { recursive: true, force: true });
  fs.cpSync(path.join(tempInstallDir, "node_modules"), preloadNodeModules, {
    recursive: true,
  });

  // 4. 清理 uTools 产物中的 .map、.js.gz 调试文件
  const removed = cleanDebugFiles(utoolsDir);
  console.log(`已清理调试文件 ${removed} 个。`);

  fs.rmSync(tempRoot, { recursive: true, force: true });

  console.log("utools/preload 依赖固化完成。");
}

try {
  main();
} catch (error) {
  fs.rmSync(tempRoot, { recursive: true, force: true });
  console.error(error.message);
  process.exit(1);
}
