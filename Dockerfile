# ----- 构建阶段：编译 web 前端 -----
# 前端产物与架构无关，固定用构建机架构执行（避免 arm64 下 QEMU 模拟 webpack 过慢）
FROM --platform=$BUILDPLATFORM node:20-bookworm-slim AS web-builder
WORKDIR /build
COPY page_web/package.json page_web/
RUN cd page_web && npm install
COPY page_web/ page_web/
RUN cd page_web && npm run build

# ----- 运行阶段 -----
FROM node:20-bookworm-slim
WORKDIR /app

# 先复制依赖清单与安装脚本以利用层缓存（postinstall 脚本位于 scripts/）
COPY shared/package.json shared/
COPY shared/scripts/ shared/scripts/
RUN cd shared && npm install --omit=dev

# docker 服务专属依赖（leveldb）
COPY docker/package.json docker/
RUN cd docker && npm install --omit=dev

# 复制服务端代码与启动入口
COPY shared/ shared/
COPY docker/ docker/

# web 构建产物作为静态资源目录（Server 静态目录为 shared/../page_web）
COPY --from=web-builder /build/page_web/dist/ page_web/

# 环境变量：
#   PORT            服务端口
#   UPLOAD_DIR      上传目录（挂载卷）
#   DATA_DIR        配置持久化目录（leveldb，挂载卷）
#   ADMIN_USERNAME  管理员账号
#   ADMIN_PASSWORD  管理员密码
#   AUTH_ENABLE     是否开启密码认证（'true' / 'false'）
ENV PORT=5421 \
    UPLOAD_DIR=/app/upload \
    DATA_DIR=/app/data

VOLUME ["/app/upload", "/app/data"]

EXPOSE 5421

CMD ["node", "docker/server.js"]
