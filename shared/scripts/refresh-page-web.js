const path = require("path");
const { spawnSync } = require("child_process");

const pageWebDir = path.resolve(__dirname, "..", "..", "page_web");

const result = spawnSync("npm", ["run", "build"], {
  cwd: pageWebDir,
  stdio: "inherit",
  shell: true,
});

if (result.status !== 0) {
  process.exit(result.status || 1);
}
