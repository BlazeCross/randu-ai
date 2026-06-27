#!/bin/bash
# ============================================================
# 积分批量过期检查脚本（17.3）
#
# 作用：每日定时扫描所有已到过期时间但尚未标记过期的用户，
#       将其积分清零、标记为已过期，并发送站内通知。
#
# 用法：
#   手动执行：bash scripts/expire-credits.sh
#   cron 定时（每日凌晨 4 点执行）：
#     0 4 * * * /bin/bash /opt/randu-ai/scripts/expire-credits.sh >> /var/log/randu-ai/expire-credits.log 2>&1
#
# 环境变量（可选）：
#   POSTGRES_CONTAINER  Postgres 容器名（默认 randu-db）
#   POSTGRES_USER       数据库用户（默认 randu）
#   POSTGRES_DB         数据库名（默认 randu_ai）
# ============================================================

set -euo pipefail

# 数据库连接配置（与 monitor.sh 保持一致）
PG_CONTAINER="${POSTGRES_CONTAINER:-randu-db}"
PG_USER="${POSTGRES_USER:-randu}"
PG_DB="${POSTGRES_DB:-randu_ai}"

# 当前时间戳
now() {
    date '+%Y-%m-%d %H:%M:%S'
}

log_info() {
    echo "[$(now)] [INFO] $1"
}

# 执行 psql 命令的封装
psql_exec() {
    docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" "$@"
}

# 健康检查：容器是否在运行
container_status=$(docker inspect --format='{{.State.Status}}' "$PG_CONTAINER" 2>/dev/null || echo "")
if [ "$container_status" != "running" ]; then
    echo "[$(now)] [ERROR] Postgres 容器 ${PG_CONTAINER} 未运行（状态：${container_status:-未找到}）"
    exit 1
fi

log_info "开始执行积分批量过期检查..."

# 单事务完成：更新过期用户 + 写入通知
# - WHERE credits_expires_at < now() AND credits_expired = false 锁定待过期用户
# - RETURNING id 拿到受影响用户 ID，用于创建通知
# 使用 CTE 一次完成，避免 N+1 与并发问题
RESULT=$(psql_exec -t -A -F '|' -c "BEGIN;
WITH expired_users AS (
    UPDATE users
    SET credits = 0,
        credits_expired = true,
        updated_at = now()
    WHERE credits_expires_at IS NOT NULL
      AND credits_expires_at < now()
      AND credits_expired = false
    RETURNING id
),
inserted AS (
    INSERT INTO notifications (id, user_id, type, title, content, link, is_read, created_at)
    SELECT gen_random_uuid()::text, id, 'system', '积分已过期',
           '您的积分已超过有效期并被清零，如需继续使用请前往充值。',
           '/dashboard', false, now()
    FROM expired_users
    RETURNING id
)
SELECT (SELECT count(*) FROM expired_users) || '|' || (SELECT count(*) FROM inserted);
COMMIT;" 2>&1)

if [ $? -ne 0 ]; then
    echo "[$(now)] [ERROR] 执行过期检查失败：$RESULT"
    exit 1
fi

# 解析结果：expired_count|notified_count
EXPIRED_COUNT=$(echo "$RESULT" | cut -d'|' -f1 | tr -d '[:space:]')
NOTIFIED_COUNT=$(echo "$RESULT" | cut -d'|' -f2 | tr -d '[:space:]')

log_info "本次共过期 ${EXPIRED_COUNT} 个用户的积分，发送通知 ${NOTIFIED_COUNT} 条"
log_info "积分批量过期检查完成"
exit 0
