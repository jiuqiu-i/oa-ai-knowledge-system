#!/usr/bin/env bash
# ============================================================================
# OA 办公知识库 - 一键全量部署脚本
# 职责：依赖检查 → 构建 → 启动 → 健康验证 → 日志提示
# 用法：bash deploy/scripts/deploy.sh [up|down|restart|rebuild|logs]
# ============================================================================
set -euo pipefail

# 进入项目根目录（脚本位于 deploy/scripts/）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
cd "${PROJECT_ROOT}"

ACTION="${1:-up}"
COMPOSE_FILE="${PROJECT_ROOT}/docker-compose.yml"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
log()  { echo -e "${GREEN}[deploy]${NC} $1"; }
warn() { echo -e "${YELLOW}[deploy]${NC} $1"; }
err()  { echo -e "${RED}[deploy]${NC} $1" >&2; }

# ---------- 前置依赖检查 ----------
check_deps() {
  log "检查依赖..."
  command -v docker >/dev/null 2>&1 || { err "未安装 docker，请先安装 Docker"; exit 1; }
  if ! docker compose version >/dev/null 2>&1; then
    err "未找到 'docker compose' 子命令（需 Docker Compose v2）"
    exit 1
  fi
  log "依赖检查通过"
}

# ---------- 环境变量文件 ----------
ensure_env() {
  if [ ! -f "${PROJECT_ROOT}/.env" ]; then
    warn "未发现 .env，从 .env.example 复制默认配置（请按需修改密钥）"
    cp "${PROJECT_ROOT}/.env.example" "${PROJECT_ROOT}/.env"
  fi
}

# ---------- 健康验证 ----------
wait_for_health() {
  log "等待后端健康检查通过（最长 90s）..."
  local elapsed=0
  while [ $elapsed -lt 90 ]; do
    # 通过网关探测后端（/health 由网关直接返回；后端独立 healthcheck 在容器内）
    if curl -fsS "http://localhost/health" >/dev/null 2>&1; then
      log "网关健康检查通过"
      return 0
    fi
    sleep 3
    elapsed=$((elapsed + 3))
    printf "."
  done
  echo ""
  err "健康检查超时，请检查日志：bash $0 logs"
  docker compose -f "${COMPOSE_FILE}" ps
  exit 1
}

# ---------- 子命令 ----------
case "${ACTION}" in
  up)
    check_deps
    ensure_env
    log "拉起全部容器（DB/Cache/Backend/Frontend/Nginx）..."
    docker compose -f "${COMPOSE_FILE}" up -d --build
    wait_for_health
    log "部署完成"
    log "用户端：  http://<服务器IP>/"
    log "管理端：  http://<服务器IP>/admin/"
    log "健康检查：http://<服务器IP>/health"
    log "Swagger： http://<服务器IP>/api/docs"
    log "查看日志：bash $0 logs"
    ;;
  rebuild)
    check_deps
    ensure_env
    log "强制重新构建并拉起..."
    docker compose -f "${COMPOSE_FILE}" up -d --build --force-recreate
    wait_for_health
    log "重建部署完成"
    ;;
  restart)
    log "重启全部容器（不重新构建）..."
    docker compose -f "${COMPOSE_FILE}" restart
    wait_for_health
    log "重启完成"
    ;;
  down)
    log "停止并移除容器（保留数据卷）..."
    docker compose -f "${COMPOSE_FILE}" down
    log "已停止"
    ;;
  logs)
    log "跟踪后端日志（Ctrl+C 退出）..."
    docker compose -f "${COMPOSE_FILE}" logs -f backend
    ;;
  status)
    docker compose -f "${COMPOSE_FILE}" ps
    ;;
  *)
    err "未知命令: ${ACTION}"
    echo "用法: bash $0 {up|rebuild|restart|down|logs|status}"
    exit 1
    ;;
esac
