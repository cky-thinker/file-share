// ----- Docker / Node 独立服务入口 -----
// 环境变量：
//   PORT            服务端口（默认 5421）
//   UPLOAD_DIR      上传目录（挂载卷，默认 /app/upload）
//   DATA_DIR        配置持久化目录（leveldb，默认 /app/data）
//   ADMIN_USERNAME  管理员账号（可选，配合 ADMIN_PASSWORD 创建/更新管理员）
//   ADMIN_PASSWORD  管理员密码（可选）
//   AUTH_ENABLE     是否开启密码认证（可选 'true' / 'false'）
const path = require("path");
const fs = require("fs");

const Database = require("../shared/utils/Database");
const LevelDbAdapter = require("./LevelDbAdapter");
const Setting = require("../shared/utils/Setting");
const Account = require("../shared/utils/Account");
const Server = require("../shared/utils/Server");

const main = async () => {
  // 1. 初始化 leveldb 持久化
  let dataDir = process.env.DATA_DIR || path.join(__dirname, "..", "data");
  let adapter = new LevelDbAdapter(dataDir);
  await adapter.init();
  Database.setAdapter(adapter);
  console.log("leveldb 已初始化:", dataDir);

  // 2. 上传目录（挂载卷）
  let uploadDir =
    process.env.UPLOAD_DIR || path.join(__dirname, "..", "upload");
  fs.mkdirSync(uploadDir, { recursive: true });
  if (Setting.getUploadPath() !== uploadDir) {
    await Setting.updateUploadPath(uploadDir);
  }
  console.log("上传目录:", uploadDir);

  // 3. 认证开关
  if (process.env.AUTH_ENABLE != null && process.env.AUTH_ENABLE !== "") {
    let enable = process.env.AUTH_ENABLE === "true";
    if (Setting.getAuthEnable() !== enable) {
      await Setting.updateAuthEnable(enable);
    }
  }

  // 4. 管理员账号（已存在则更新密码并确保管理员标志）
  if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
    let username = process.env.ADMIN_USERNAME.trim();
    let existing = Account.getAccountByUsername(username);
    if (existing) {
      await Account.updateAccount(existing.id, {
        password: process.env.ADMIN_PASSWORD,
        admin: true,
      });
      console.log("管理员账号已更新:", username);
    } else {
      await Account.addAccount({
        username,
        password: process.env.ADMIN_PASSWORD,
        admin: true,
      });
      console.log("管理员账号已创建:", username);
    }
  }

  // 5. 启动服务
  let port = parseInt(process.env.PORT, 10);
  if (port > 0 && port !== Setting.getPort()) {
    await Setting.updatePort(port);
  }
  let result = Server.startServer();
  console.log(result.message, result.url);
};

main().catch((e) => {
  console.error("服务启动失败", e);
  process.exit(1);
});
