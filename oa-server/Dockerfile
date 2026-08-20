# NestJS 后端镜像 - 多阶段构建（builder + runner），基于 node:alpine 优化体积
# 使用方式: docker build -t oa-server:latest .
# 运行方式: 见根目录 docker-compose.yml

# ===== Stage 1: builder =====
FROM node:18-alpine AS builder
WORKDIR /app

# 仅拷贝依赖清单，利用 Docker 层缓存
COPY package*.json ./
RUN npm config set registry https://registry.npmmirror.com \
    && npm ci --no-audit --no-fund

# 拷贝源码并构建（产物输出到 dist/）
COPY . .
RUN npm run build

# 生产依赖裁剪（剔除 devDependencies，进一步压缩运行镜像）
RUN npm prune --production

# ===== Stage 2: runner =====
FROM node:18-alpine AS runner
WORKDIR /app

# 安装最小运行时依赖（mysql2 原生模块在 alpine 下通常无需额外编译，保留 tini 作 init 进程）
RUN apk add --no-cache tini

# 安全：以非 root 用户运行
RUN addgroup -S app && adduser -S app -G app
USER app

# 仅拷贝构建产物与生产依赖
COPY --from=builder --chown=app:app /app/dist ./dist
COPY --from=builder --chown=app:app /app/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/package.json ./package.json

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# tini 作 PID 1，正确转发信号，避免僵尸进程（自愈/优雅退出的基础）
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]
