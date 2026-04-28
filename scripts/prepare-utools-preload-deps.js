const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = path.resolve(__dirname, "..");
const sharedDir = path.join(rootDir, "shared");
const preloadDir = path.join(rootDir, "utools", "preload");
const tempPackDir = path.join(rootDir, ".tmp", "utools-preload-pack");

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

function findPackedTgz(packOutput) {
  const matches = [...packOutput.matchAll(/([^\s]+\.tgz)/g)].map((m) => m[1]);
  if (matches.length > 0) {
    return matches[matches.length - 1];
  }

  if (!fs.existsSync(tempPackDir)) {
    return null;
  }

  const tgzs = fs
    .readdirSync(tempPackDir)
    .filter((name) => name.endsWith(".tgz"))
    .sort((a, b) => {
      const aPath = path.join(tempPackDir, a);
      const bPath = path.join(tempPackDir, b);
      return fs.statSync(bPath).mtimeMs - fs.statSync(aPath).mtimeMs;
    });

  return tgzs[0] || null;
}

function main() {
  fs.mkdirSync(tempPackDir, { recursive: true });

  const sharedPkgInPreload = path.join(
    preloadDir,
    "node_modules",
    "@file-share",
    "shared-utils"
  );
  fs.rmSync(sharedPkgInPreload, { recursive: true, force: true });

  const packOutput = run(
    "npm",
    ["pack", "--pack-destination", tempPackDir],
    sharedDir
  );
  const tgzName = findPackedTgz(packOutput);
  if (!tgzName) {
    throw new Error("Unable to find generated tgz from npm pack output.");
  }

  const tgzPath = path.join(tempPackDir, path.basename(tgzName));
  if (!fs.existsSync(tgzPath)) {
    throw new Error(`Generated tgz not found: ${tgzPath}`);
  }

  try {
    run("npm", ["install", "--no-save", "--omit=dev", tgzPath], preloadDir);
  } finally {
    fs.rmSync(tgzPath, { force: true });
    const remaining = fs.existsSync(tempPackDir)
      ? fs.readdirSync(tempPackDir)
      : [];
    if (remaining.length === 0) {
      fs.rmSync(tempPackDir, { recursive: true, force: true });
    }
  }

  console.log("utools/preload 依赖固化完成。");
}

main();
