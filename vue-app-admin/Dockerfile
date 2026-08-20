# 管理端 Vue3 前端镜像 - 多阶段构建（builder 用 node，runner 用 nginx）
# 构建产物为静态资源，由根目录 Nginx 容器统一托管于 /admin 路径

# ===== Stage 1: builder =====
FROM node:18-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm config set registry https://registry.npmmirror.com \
    && npm ci --no-audit --no-fund

COPY . .
# 管理端构建：base 路径 /admin/，确保静态资源与路由前缀一致
RUN npm run build

# ===== Stage 2: runner =====
FROM nginx:1.25-alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html/admin

# 管理端 SPA history 路由兜底（/admin 前缀）
RUN printf 'server {\n\
  listen 80;\n\
  server_name _;\n\
  root /usr/share/nginx/html;\n\
  index index.html;\n\
  location /admin/ { try_files $uri $uri/ /admin/index.html; }\n\
  location = /admin { return 301 /admin/; }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
