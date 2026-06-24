/**
 * PM2 进程管理配置
 *
 * 用于阿里云轻量服务器（或任何自托管 Node.js 环境）部署 Next.js 应用。
 *
 * 使用方式：
 *   pm2 start ecosystem.config.cjs
 *   pm2 save
 *   pm2 startup  # 配置开机自启
 *
 * 常用命令：
 *   pm2 status              # 查看进程状态
 *   pm2 logs randu-ai-workflow  # 查看日志
 *   pm2 restart randu-ai-workflow  # 重启
 *   pm2 stop randu-ai-workflow     # 停止
 *   pm2 delete randu-ai-workflow   # 删除进程
 *
 * 说明：
 * - 使用 fork 模式（instances: 1）以避免 Prisma Client 在 cluster 模式下的连接数问题。
 *   如需横向扩展，建议在前面加 Nginx 负载均衡，并配置 PgBouncer 管理 PostgreSQL 连接。
 * - 启动前请确保已执行 `npm run build`，并配置好 `.env.local` 环境变量。
 */
module.exports = {
  apps: [
    {
      name: "randu-ai-workflow",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      time: true,
    },
  ],
};
