#!/bin/bash
# ============================================================
# 燃渡AI Docker 日志切割配置（16.4）
#
# 配置 Docker 全局日志驱动：
# - log-driver: json-file
# - max-size: 10m（单个日志文件最大 10MB）
# - max-file: 3（保留 3 个日志文件，总计 30MB/容器）
#
# 用法：bash scripts/setup-docker-logrotate.sh
# 生效需重启 Docker：systemctl restart docker
# ============================================================

set -e

DAEMON_JSON="/etc/docker/daemon.json"
BACKUP="${DAEMON_JSON}.bak.$(date +%Y%m%d%H%M%S)"

# 备份原配置
if [ -f "$DAEMON_JSON" ]; then
    cp "$DAEMON_JSON" "$BACKUP"
    echo "✓ 已备份原配置到 $BACKUP"
fi

# 写入新配置（保留原有 registry-mirrors，添加 log-opts）
cat > "$DAEMON_JSON" << 'EOF'
{
  "registry-mirrors": [
    "https://mirror.ccs.tencentyun.com",
    "https://docker.m.daocloud.io"
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

echo "✓ 已配置 Docker 日志切割：每个容器日志最大 10MB，保留 3 个文件"
echo ""
echo "⚠ 需要重启 Docker 服务才能生效："
echo "  systemctl restart docker"
echo ""
echo "注意：重启 Docker 会短暂停止所有容器，docker compose restart=true 会自动拉起"
