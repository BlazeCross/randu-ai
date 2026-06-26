#!/bin/bash
#
# PostgreSQL 数据库定时备份脚本
#
# 用法：
#   手动执行：bash /opt/randu-ai/scripts/backup-db.sh
#   cron 定时：0 3 * * * /bin/bash /opt/randu-ai/scripts/backup-db.sh >> /var/log/randu-backup.log 2>&1
#
# 备份策略：
#   - 每天凌晨 3:00 执行一次全量备份
#   - 本地保留最近 7 天的备份
#   - 超过 7 天的备份自动删除
#

# 开启严格模式：
#   -e  任何命令失败立即退出
#   -u  使用未定义变量立即退出
#   -o pipefail  管道中任意命令失败则整个管道失败
set -euo pipefail

# 数据库连接配置（从环境变量读取，兜底使用默认值）
DB_HOST="${POSTGRES_HOST:-postgres}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-randu_ai}"
DB_USER="${POSTGRES_USER:-randu}"

# 备份目录
BACKUP_DIR="/opt/randu-ai/backups"
# 本地保留天数
RETENTION_DAYS=7
# 备份文件名（带时间戳）
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始备份数据库 ${DB_NAME}..."

# 创建备份目录
mkdir -p "${BACKUP_DIR}"

# Postgres 容器名（docker compose 默认命名：项目目录名-postgres-1）
CONTAINER_NAME="randu-ai-postgres-1"

# 执行备份（通过 docker exec 调用容器内的 pg_dump，输出 gzip 压缩）
# 由于已开启 pipefail，管道中 docker exec 或 gzip 任一失败都会触发退出
docker exec "${CONTAINER_NAME}" pg_dump \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --no-owner \
  --no-privileges \
  --format=plain \
  | gzip > "${BACKUP_FILE}"

FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 备份成功：${BACKUP_FILE} (${FILE_SIZE})"

# 清理过期备份（超过 RETENTION_DAYS 天）
find "${BACKUP_DIR}" -name "${DB_NAME}_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 已清理超过 ${RETENTION_DAYS} 天的旧备份"

# 列出当前备份
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 当前备份列表："
ls -lh "${BACKUP_DIR}"/${DB_NAME}_*.sql.gz 2>/dev/null | awk '{print "  "$NF" ("$5")"}'

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 备份任务完成"
