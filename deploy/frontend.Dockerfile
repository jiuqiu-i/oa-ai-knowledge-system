# 统一前端镜像 - 多阶段构建，一次构建同时产出用户端 (/) 与管理端 (/admin) 静态资源
# 构建上下文需为项目根目录：docker build -f deploy/frontend.Dockerfile -t oa-frontend:latest .

# ===== Stage 1: builder =====
FROM node:18-alpine AS builder

# 构建用户端
WORKDIR /build/user
COPY vue-app-user/package*.json ./
RUN npm config set registry https://registry.npmmirror.com \
    && npm ci --no-audit --no-fund
COPY vue-app-user/ ./
RUN npm run build

# 构建管理端
WORKDIR /build/admin
COPY vue-app-admin/package*.json ./
RUN npm config set registry https://registry.npmmirror.com \
    && npm ci --no-audit --no-fund
COPY vue-app-admin/ ./
RUN npm run build

# ===== Stage 2: runner =====
FROM nginx:1.25-alpine AS runner

# 用户端 -> /，管理端 -> /admin
COPY --from=builder /build/user/dist /usr/share/nginx/html
COPY --from=builder /build/admin/dist /usr/share/nginx/html/admin

# SPA history 路由兜底（用户端 / 与管理端 /admin）
RUN printf 'server {\n\
  listen 80;\n\
  server_name _;\n\
  root /usr/share/nginx/html;\n\
  index index.html;\n\
\n\
  # 静态资源缓存（动静分离中的"静"）\n\
  location ~* \\.(?:js|css|woff2?|ttf|svg|png|jpg|jpeg|gif|ico|webp)$ {\n\
    expires 7d;\n\
    add_header Cache-Control "public, immutable";\n\
    access_log off;\n\
  }\n\
\n\
  # 管理端 SPA\n\
  location /admin/ { try_files $uri $uri/ /admin/index.html; }\n\
  location = /admin { return 301 /admin/; }\n\
\n\
  # 用户端 SPA\n\
  location / { try_files $uri $uri/ /index.html; }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
