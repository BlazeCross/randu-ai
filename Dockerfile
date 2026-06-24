# syntax=docker/dockerfile:1.7

# =============================================================================
# 阶段 1: 依赖安装（deps）
# =============================================================================
FROM node:20-alpine AS deps

WORKDIR /app

# 仅复制 package.json 和 lockfile，利用 Docker 缓存层
COPY package.json package-lock.json* ./

# 安装所有依赖（含 devDependencies，构建需要）
RUN npm ci --include=dev

# =============================================================================
# 阶段 2: 构建（builder）
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 构建时所需的环境变量（Next.js 会将 NEXT_PUBLIC_* 内联到客户端代码）
# 真实密钥在运行时通过环境变量注入，不写入镜像
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_TELEMETRY_DISABLED=1

# 生成 Prisma Client
RUN npx prisma generate

# 构建 Next.js 应用
RUN npm run build

# =============================================================================
# 阶段 3: 运行时（runner）- 最小化镜像
# =============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

# 关闭 Next.js 遥测
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# 创建非 root 用户运行应用
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# 复制构建产物
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.ts ./next.config.ts

USER nextjs

EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "fetch('http://localhost:3000/api/workflow/list').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["npm", "start"]
