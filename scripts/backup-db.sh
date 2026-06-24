#!/bin/sh
# =============================================================================
# 燃渡AI - PostgreSQL 自动备份脚本
# =============================================================================
# 功能：
# - 每日自动备份数据库
# - 保留最近 7 天的备份
# - 备份文件压缩存储
#
# 使用方式（配合 cron 定时执行）：
#   crontab -e
#   # 每天凌晨 3 点备份
#   0 3 * * * /path/to/backup-db.sh >> /var/log/db-backup.log 2>&1
#
# 手动执行：
#   ./backup-db.sh
# =============================================================================

# 数据库配置（与 docker-compose.yml 保持一致）
DB_CONTAINER="randu-db"
DB_USER="${POSTGRES_USER:-randu}"
DB_NAME="${POSTGRES_DB:-randu_ai}"

# 备份目录（挂载到容器的 /backups）
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

# 备份文件名（含日期时间）
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/randu_ai_${TIMESTAMP}.sql.gz"

# 保留天数
KEEP_DAYS=7

echo "[$(date)] 开始备份数据库 $DB_NAME ..."

# 执行备份（在容器内运行 pg_dump，输出到挂载目录）
docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  FILESIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "[$(date)] 备份成功: $BACKUP_FILE ($FILESIZE)"
else
  echo "[$(date)] 备份失败！"
  exit 1
fi

# 清理过期备份（保留最近 KEEP_DAYS 天）
echo "[$(date)] 清理 $KEEP_DAYS 天前的备份 ..."
find "$BACKUP_DIR" -name "randu_ai_*.sql.gz" -type f -mtime +$KEEP_DAYS -delete
echo "[$(date)] 清理完成"

echo "[$(date)] 备份任务完成"
