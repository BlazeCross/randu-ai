#!/bin/bash
# ============================================================
# 燃渡AI 监控告警脚本（轻量方案 16.3）
#
# 检查项：
#   1. /api/health 健康检查（连续 3 次失败才告警）
#   2. 磁盘使用率 > 80%
#   3. 内存使用率 > 90%
#   4. 数据库连接数 > 50
#
# 告警方式：
#   - 写入日志 /var/log/randu-ai/monitor.log
#   - 可选：钉钉机器人 webhook（配置 DINGTALK_WEBHOOK_URL 环境变量）
#
# Cron 配置（每分钟执行）：
#   * * * * * /opt/randu-ai/scripts/monitor.sh >> /var/log/randu-ai/monitor.log 2>&1
# ============================================================

# 日志目录
LOG_DIR="/var/log/randu-ai"
mkdir -p "$LOG_DIR"

# 状态文件（记录连续失败次数）
STATE_FILE="/tmp/randu-monitor-health-failures"

# 钉钉 webhook（可选）
DINGTALK_WEBHOOK="${DINGTALK_WEBHOOK_URL:-}"

# 当前时间戳
now() {
    date '+%Y-%m-%d %H:%M:%S'
}

# 发送告警
send_alert() {
    local msg="$1"
    local timestamp=$(now)
    local alert_msg="[$timestamp] [ALERT] $msg"
    echo "$alert_msg"

    # 钉钉机器人告警
    if [ -n "$DINGTALK_WEBHOOK" ]; then
        curl -s -X POST "$DINGTALK_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{\"msgtype\":\"text\",\"text\":{\"content\":\"[燃渡AI告警] $msg\"}}" \
            > /dev/null 2>&1
    fi
}

# 记录正常日志
log_info() {
    local msg="$1"
    echo "[$(now)] [INFO] $msg"
}

# ===== 1. 健康检查 =====
HEALTH_URL="http://localhost:3000/api/health"
health_response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$HEALTH_URL" 2>/dev/null)

if [ "$health_response" != "200" ]; then
    # 失败次数 +1
    failures=$(cat "$STATE_FILE" 2>/dev/null || echo "0")
    failures=$((failures + 1))
    echo "$failures" > "$STATE_FILE"

    log_info "健康检查失败（第 $failures 次），HTTP $health_response"

    # 连续 3 次失败才告警
    if [ "$failures" -ge 3 ]; then
        send_alert "服务健康检查连续 ${failures} 次失败（HTTP $health_response），请检查容器状态"
    fi
else
    # 成功，重置失败计数
    if [ -f "$STATE_FILE" ]; then
        prev=$(cat "$STATE_FILE")
        if [ "$prev" -ge 3 ]; then
            log_info "服务已恢复（之前连续失败 ${prev} 次）"
        fi
        rm -f "$STATE_FILE"
    fi
fi

# ===== 2. 磁盘使用率 =====
disk_usage=$(df / | awk 'NR==2 {gsub(/%/,""); print $5}')
if [ -n "$disk_usage" ] && [ "$disk_usage" -gt 80 ]; then
    send_alert "磁盘使用率 ${disk_usage}%（阈值 80%），请清理空间"
fi

# ===== 3. 内存使用率 =====
# 计算方式：(1 - available/total) * 100
mem_total=$(free -m | awk '/Mem:/ {print $2}')
mem_avail=$(free -m | awk '/Mem:/ {print $7}')
if [ -n "$mem_total" ] && [ -n "$mem_avail" ] && [ "$mem_total" -gt 0 ]; then
    mem_usage=$(( (mem_total - mem_avail) * 100 / mem_total ))
    if [ "$mem_usage" -gt 90 ]; then
        send_alert "内存使用率 ${mem_usage}%（阈值 90%），总内存 ${mem_total}MB，可用 ${mem_avail}MB"
    fi
fi

# ===== 4. 数据库连接数 =====
db_active=$(docker exec randu-db psql -U randu -d randu_ai -t -c \
    "SELECT count(*) FROM pg_stat_activity WHERE state != 'idle';" 2>/dev/null | tr -d ' ')
if [ -n "$db_active" ] && [ "$db_active" -gt 50 ]; then
    send_alert "数据库活跃连接数 ${db_active}（阈值 50），请检查是否有慢查询"
fi

# ===== 5. Docker 容器状态 =====
for container in randu-app randu-db; do
    status=$(docker inspect --format='{{.State.Status}}' "$container" 2>/dev/null)
    if [ "$status" != "running" ]; then
        send_alert "容器 ${container} 状态异常：${status:-未找到}"
    fi
done

exit 0
