# =============================================================================
# 燃渡AI - Dockerfile（多阶段构建）
# =============================================================================
# 阶段说明：
# 1. deps：安装依赖（利用缓存层）
# 2. builder：生成 Prisma Client + 构建 Next.js
# 3. runner：最终运行镜像（体积小，仅含必要文件）
# =============================================================================

# ---------- 阶段1：安装依赖 ----------
FROM node:20-alpine AS deps

# 安装 OpenSSL（Prisma 运行时依赖）
RUN apk add --no-cache openssl

WORKDIR /app

# 先复制 package.json 和 lock 文件，利用 Docker 缓存层
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# 配置淘宝镜像源（国内服务器访问 npm 官方源经常超时）
RUN npm config set registry https://registry.npmmirror.com && \
    npm config set fetch-timeout 600000 && \
    npm config set fetch-retries 5

# 安装所有依赖（含 devDependencies，构建需要）
RUN npm ci --no-audit --no-fund

# ---------- 阶段2：构建应用 ----------
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

# 从 deps 阶段复制 node_modules
COPY --from=deps /app/node_modules ./node_modules

# 复制源代码
COPY . .

# 生成 Prisma Client
RUN npx prisma generate

# 构建 Next.js（standalone 模式）
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ---------- 阶段3：运行镜像 ----------
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl

WORKDIR /app

# 复制 standalone 构建产物
COPY --from=builder /app/.next/standalone ./
# 复制静态资源（standalone 不含这些）
COPY --from=builder /app/.next/static ./.next/static
# 复制 public 目录（如果存在）
COPY --from=builder /app/public ./public
# 复制 Prisma 相关文件（运行迁移需要）
COPY --from=builder /app/prisma ./prisma
# 复制 Prisma Client 和 CLI（包含 wasm 引擎文件）
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/.bin ./node_modules/.bin

# 创建启动脚本（数据库 schema 已通过 SQL 脚本在主机同步，容器启动时不再迁移）
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'node server.js' >> /app/start.sh && \
    chmod +x /app/start.sh

# 创建非 root 用户运行应用（安全最佳实践）
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    chown -R nextjs:nodejs /app

# 切换到非 root 用户
USER nextjs

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production

# 启动应用（先迁移数据库，再启动）
CMD ["/app/start.sh"]
