const fs = require("fs");
const path = require("path");

const mapDir = path.resolve(__dirname, "..", "node_modules", "registry-js", "dist", "lib");

if (!fs.existsSync(mapDir)) {
  process.exit(0);
}

for (const fileName of fs.readdirSync(mapDir)) {
  if (fileName.endsWith(".map")) {
    fs.rmSync(path.join(mapDir, fileName), { force: true });
  }
}
