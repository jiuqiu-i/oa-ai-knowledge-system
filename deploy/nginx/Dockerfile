# Nginx 反向代理镜像 - 五容器架构中的入口网关
# 职责：动静分离、/api 反代后端、Gzip 压缩、SSE 流式透传、健康检查端点
# 构建上下文需为项目根目录：docker build -f deploy/nginx/Dockerfile -t oa-gateway:latest .

FROM nginx:1.25-alpine

# 清空默认 server 块，使用自定义网关配置
RUN rm /etc/nginx/conf.d/default.conf
COPY deploy/nginx/nginx.conf /etc/nginx/conf.d/gateway.conf

# 健康检查依赖：curl 探测 /health
RUN apk add --no-cache curl

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
