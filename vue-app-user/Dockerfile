# 用户端 Vue3 前端镜像 - 多阶段构建（builder 用 node，runner 用 nginx）
# 构建产物为静态资源，由根目录 Nginx 容器统一托管

# ===== Stage 1: builder =====
FROM node:18-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm config set registry https://registry.npmmirror.com \
    && npm ci --no-audit --no-fund

COPY . .
# 生产构建；API 基址在运行期由 Nginx 反代 /api 到后端，构建期默认 /api
RUN npm run build

# ===== Stage 2: runner =====
FROM nginx:1.25-alpine AS runner

# 拷贝 SPA 静态资源到 Nginx 默认目录
COPY --from=builder /app/dist /usr/share/nginx/html

# SPA history 路由兜底：所有未匹配静态文件的请求回退到 index.html
RUN printf 'server {\n\
  listen 80;\n\
  server_name _;\n\
  root /usr/share/nginx/html;\n\
  index index.html;\n\
  location / { try_files $uri $uri/ /index.html; }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
