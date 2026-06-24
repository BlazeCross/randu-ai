# 燃渡 AI 工作流 - 部署指南

本文档介绍将燃渡 AI 工作流（Next.js 16 全栈应用）部署到生产环境的完整流程。

提供两种部署方案：

| 方案 | 适用场景 | 优点 | 缺点 |
|------|----------|------|------|
| **方案 A：Vercel**（推荐） | 快速上线、无运维负担 | 零配置、自动 CI/CD、自动 HTTPS、全球 CDN | 国内访问需自定义域名 |
| **方案 B：阿里云轻量服务器** | 数据合规、成本可控、需自主运维 | 完全自主可控、国内访问快 | 需自行维护服务器、证书、监控 |

---

## 目录

- [前置准备](#前置准备)
- [方案 A：Vercel 部署（推荐）](#方案-avercel-部署推荐)
- [方案 B：阿里云轻量服务器部署](#方案-b阿里云轻量服务器部署)
- [数据库初始化](#数据库初始化)
- [阿里云 OSS 配置](#阿里云-oss-配置)
- [Coze API 配置](#coze-api-配置)
- [环境变量清单](#环境变量清单)
- [部署后验证](#部署后验证)
- [常见问题](#常见问题)

---

## 前置准备

无论选择哪种部署方案，都需要先完成以下准备工作：

### 1. Coze API Token

1. 访问 [Coze 平台](https://www.coze.cn) 注册账号
2. 进入「个人中心」→「API 访问令牌」生成 Token
3. 记录 `COZE_API_TOKEN` 值
4. 在 Coze 工作台创建所需的工作流，记录每个工作流的 `workflow_id`

### 2. 阿里云 OSS Bucket

1. 登录 [阿里云 OSS 控制台](https://oss.console.aliyun.com/)
2. 创建 Bucket（建议选与目标用户就近的地域）
3. 创建 RAM 子账号，授予 `AliyunOSSFullAccess` 权限，获取 AccessKey
4. （可选）配置 CDN 加速域名

### 3. PostgreSQL 数据库

- **Vercel 部署**：推荐使用 [Neon](https://neon.tech)、[Supabase](https://supabase.com) 或阿里云 RDS PostgreSQL
- **自托管部署**：在服务器上自行安装 PostgreSQL 15+

### 4. 域名（可选但推荐）

准备一个已备案（国内）或无需备案（海外）的域名，用于绑定应用。

---

## 方案 A：Vercel 部署（推荐）

Vercel 是 Next.js 的官方托管平台，提供零配置部署、自动 CI/CD、全球 CDN 和自动 HTTPS。

### 步骤 1：推送代码到 GitHub

```bash
# 初始化 Git 仓库（如尚未初始化）
git init
git add .
git commit -m "Initial commit"

# 关联 GitHub 远程仓库
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git branch -M main
git push -u origin main
```

> 注意：确认 `.gitignore` 已忽略 `.env.local`、`node_modules`、`.next` 等文件。

### 步骤 2：在 Vercel 导入项目

1. 访问 [vercel.com](https://vercel.com) 并使用 GitHub 账号登录
2. 点击「Add New...」→「Project」
3. 在「Import Git Repository」中找到并选中本项目的仓库
4. Vercel 会自动识别为 Next.js 项目，框架预设（Framework Preset）显示为 `Next.js`

### 步骤 3：配置环境变量

在 Vercel 项目的「Settings」→「Environment Variables」中，逐一添加以下变量（参考 [环境变量清单](#环境变量清单)）：

| Key | Value | Environment |
|-----|-------|-------------|
| `DATABASE_URL` | `postgresql://...` | Production, Preview |
| `COZE_API_TOKEN` | 你的 Coze Token | Production, Preview |
| `COZE_BASE_URL` | `https://api.coze.cn` | Production, Preview |
| `OSS_ACCESS_KEY_ID` | 阿里云 AK | Production, Preview |
| `OSS_ACCESS_KEY_SECRET` | 阿里云 SK | Production, Preview |
| `OSS_BUCKET` | Bucket 名称 | Production, Preview |
| `OSS_REGION` | `oss-cn-hangzhou` | Production, Preview |
| `OSS_CDN_DOMAIN` | `https://cdn.your-domain.com` | Production, Preview |
| `JWT_SECRET` | 强随机密钥（≥32 字符） | Production, Preview |
| `FEISHU_DOC_URL` | 飞书文档地址 | Production, Preview |
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.com` | Production, Preview |

> 提示：`NEXT_PUBLIC_APP_URL` 在构建时会被内联到客户端代码，修改后需重新部署。

### 步骤 4：部署

1. 点击「Deploy」开始首次部署
2. Vercel 会自动执行 `npm install` → `npm run build` → 启动
3. 部署完成后会获得一个 `xxx.vercel.app` 的临时域名
4. 后续每次 `git push` 到 `main` 分支会自动触发生产部署，push 到其他分支触发 Preview 部署

### 步骤 5：初始化数据库

Vercel 部署完成后，需运行 Prisma 迁移和种子脚本。可通过 Vercel CLI 在本地执行（连接生产数据库）：

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录并关联项目
vercel login
vercel link

# 拉取生产环境变量到本地 .env.local
vercel env pull .env.local --environment=production

# 执行迁移（首次部署）
npx prisma migrate deploy

# 执行种子数据
npx prisma db seed
```

> 也可在 Vercel 项目「Settings」→「Functions」查看部署日志确认应用正常运行。

### 步骤 6：绑定自定义域名

1. 进入 Vercel 项目 →「Settings」→「Domains」
2. 输入你的域名（如 `app.your-domain.com`）并点击「Add」
3. 按提示到域名 DNS 服务商添加 CNAME 记录：
   - 类型：`CNAME`
   - 主机记录：`app`
   - 记录值：`cname.vercel-dns.com`
4. 等待 DNS 生效（通常几分钟到几小时），Vercel 会自动签发 SSL 证书

### 步骤 7：HTTPS 自动配置

- Vercel 自动为所有域名（含 `*.vercel.app` 和自定义域名）提供免费 SSL 证书
- 证书由 Let's Encrypt 签发，自动续期，无需手动维护
- 强制 HTTPS：在「Settings」→「Domains」中开启「Enforce HTTPS」

---

## 方案 B：阿里云轻量服务器部署

适用于需要数据留在国内、或希望完全自主可控的场景。

### 步骤 1：服务器环境准备

以 Ubuntu 22.04 LTS 为例（CentOS/Debian 类似）：

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 验证版本（需 >= 20.0.0）
node -v
npm -v

# 安装 PM2 进程管理器
sudo npm install -g pm2

# 安装 Git
sudo apt install -y git
```

### 步骤 2：安装 PostgreSQL 15

```bash
# 添加 PostgreSQL 官方源
sudo sh -c 'echo "deb https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg

sudo apt update
sudo apt install -y postgresql-15

# 启动并设置开机自启
sudo systemctl enable --now postgresql
```

### 步骤 3：创建数据库与用户

```bash
# 切换到 postgres 用户
sudo -u postgres psql

# 在 psql 提示符下执行：
CREATE USER randu WITH PASSWORD 'your_strong_password';
CREATE DATABASE randu_ai OWNER randu;
GRANT ALL PRIVILEGES ON DATABASE randu_ai TO randu;
\q
```

记录连接串：`postgresql://randu:your_strong_password@localhost:5432/randu_ai`

### 步骤 4：克隆代码并安装依赖

```bash
# 选择部署目录
cd /var/www
sudo mkdir -p randu-ai && sudo chown $USER:$USER randu-ai
cd randu-ai

# 克隆代码
git clone https://github.com/<你的用户名>/<仓库名>.git .

# 安装依赖
npm ci

# 生成 Prisma Client
npx prisma generate
```

### 步骤 5：配置环境变量

```bash
# 复制示例文件
cp .env.example .env.local

# 编辑 .env.local，填入真实值
nano .env.local
```

确保以下关键变量已正确配置：
- `DATABASE_URL`：使用步骤 3 创建的连接串
- `COZE_API_TOKEN`、`OSS_*`、`JWT_SECRET` 等

### 步骤 6：构建应用

```bash
# 构建生产版本
npm run build
```

### 步骤 7：初始化数据库

```bash
# 执行迁移（应用 schema 到数据库）
npx prisma migrate deploy

# 执行种子数据（套餐、工作流等初始数据）
npx prisma db seed
```

> 注意：本项目 `prisma/` 目录下未包含 migrations 历史，首次部署可使用 `npx prisma db push` 直接同步 schema，再执行 seed。

### 步骤 8：使用 PM2 启动应用

```bash
# 使用项目自带的 PM2 配置启动
pm2 start ecosystem.config.cjs

# 保存进程列表（用于开机自启恢复）
pm2 save

# 配置开机自启（按提示执行返回的命令）
pm2 startup

# 查看运行状态
pm2 status
pm2 logs randu-ai-workflow
```

应用将运行在 `http://localhost:3000`。

### 步骤 9：配置 Nginx 反向代理

```bash
# 安装 Nginx
sudo apt install -y nginx

# 创建站点配置
sudo nano /etc/nginx/sites-available/randu-ai
```

写入以下内容（将 `your-domain.com` 替换为真实域名）：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 客户端上传大小限制（视频/图片场景建议 ≥ 50M）
    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Coze 任务可能耗时较长，适当延长超时
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }
}
```

启用站点并重启 Nginx：

```bash
sudo ln -s /etc/nginx/sites-available/randu-ai /etc/nginx/sites-enabled/
sudo nginx -t          # 测试配置
sudo systemctl reload nginx
```

### 步骤 10：配置 HTTPS（Let's Encrypt）

```bash
# 安装 certbot
sudo apt install -y certbot python3-certbot-nginx

# 申请并自动配置 SSL 证书
sudo certbot --nginx -d your-domain.com

# 测试自动续期（证书 90 天有效，certbot 会自动续期）
sudo certbot renew --dry-run
```

完成后访问 `https://your-domain.com` 验证。

### （可选）Docker 容器化部署

项目已提供 `Dockerfile`，支持容器化部署：

```bash
# 构建镜像（NEXT_PUBLIC_APP_URL 在构建时内联）
docker build \
  --build-arg NEXT_PUBLIC_APP_URL=https://your-domain.com \
  -t randu-ai-workflow:latest .

# 运行容器（运行时注入密钥类环境变量）
docker run -d \
  --name randu-ai \
  --restart unless-stopped \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://randu:pwd@host:5432/randu_ai" \
  -e COZE_API_TOKEN="your_token" \
  -e COZE_BASE_URL="https://api.coze.cn" \
  -e OSS_ACCESS_KEY_ID="your_ak" \
  -e OSS_ACCESS_KEY_SECRET="your_sk" \
  -e OSS_BUCKET="your_bucket" \
  -e OSS_REGION="oss-cn-hangzhou" \
  -e OSS_CDN_DOMAIN="https://cdn.your-domain.com" \
  -e JWT_SECRET="your_strong_secret" \
  -e FEISHU_DOC_URL="https://your-feishu-doc.com" \
  randu-ai-workflow:latest
```

> 容器化部署时，数据库迁移和种子需在容器内执行：
> ```bash
> docker exec -it randu-ai npx prisma migrate deploy
> docker exec -it randu-ai npx prisma db seed
> ```

---

## 数据库初始化

无论选择哪种部署方案，都需要初始化数据库：

### 1. 创建 PostgreSQL 数据库

```sql
CREATE USER randu WITH PASSWORD 'your_strong_password';
CREATE DATABASE randu_ai OWNER randu;
GRANT ALL PRIVILEGES ON DATABASE randu_ai TO randu;
```

### 2. 执行 Schema 迁移

```bash
# 方式一：使用 migrations（推荐，有迁移历史）
npx prisma migrate deploy

# 方式二：直接同步 schema（首次部署，无 migrations 目录时）
npx prisma db push
```

### 3. 执行种子数据

```bash
npx prisma db seed
```

种子脚本会写入：
- **套餐数据（plans 表）**：基础版 / 专业版 / 企业版
- **工作流数据（workflows 表）**：各 AI 工作流的元信息（含占位 `coze_workflow_id`，需手动更新为真实值）

### 4. 更新工作流的 Coze Workflow ID

种子数据中的 `coze_workflow_id` 为占位值，需在 Coze 平台创建对应工作流后，更新数据库：

```sql
-- 在 psql 或数据库客户端执行
UPDATE workflows
SET coze_workflow_id = '真实的_coze_workflow_id'
WHERE name = '服装换装视频生成';
```

或在 Prisma Studio 中可视化编辑：

```bash
npx prisma studio
```

---

## 阿里云 OSS 配置

### 1. 创建 Bucket

- 读写权限：**公共读**（视频/图片需通过 URL 访问）
- 防盗链：按需配置（允许应用域名Referer）
- 生命周期：建议配置过期规则，自动清理临时上传文件

### 2. 配置 CDN 域名

1. 进入 [阿里云 CDN 控制台](https://cdn.console.aliyun.com/)
2. 添加加速域名，回源地址指向 OSS Bucket
3. 配置 CNAME：到域名 DNS 服务商添加 CNAME 记录指向 CDN 分配的域名
4. 记录 CDN 域名填入 `OSS_CDN_DOMAIN` 环境变量

### 3. 配置 CORS（跨域访问）

OSS Bucket →「权限管理」→「跨域设置」，添加规则：

| 项目 | 值 |
|------|-----|
| 来源 | `https://your-domain.com`（生产域名），多个换行 |
| 允许 Methods | `GET, POST, PUT, HEAD` |
| 允许 Headers | `*` |
| 暴露 Headers | `ETag, x-oss-request-id` |
| 缓存时间 | `0` |

> 如使用 CDN，CDN 控制台也需配置对应的 CORS 规则。

### 4. RAM 子账号权限

为安全起见，建议使用 RAM 子账号并仅授予 OSS 必要权限：

```json
{
  "Version": "1",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["oss:PutObject", "oss:GetObject", "oss:DeleteObject"],
      "Resource": ["acs:oss:*:*:your_bucket_name/*"]
    }
  ]
}
```

---

## Coze API 配置

### 1. 获取 API Token

1. 登录 [Coze 平台](https://www.coze.cn)
2. 「个人中心」→「API 访问令牌」→ 生成新令牌
3. 将 Token 填入 `COZE_API_TOKEN` 环境变量

### 2. 创建工作流

1. 在 Coze 工作台创建所需的 AI 工作流（如服装换装视频生成）
2. 配置工作流的输入参数（本项目默认参数名为 `input`，值为图片 URL）
3. 发布工作流，记录 `workflow_id`

### 3. 更新数据库工作流 ID

将 Coze 工作流 ID 写入数据库 `workflows` 表的 `coze_workflow_id` 字段（见 [数据库初始化](#数据库初始化) 第 4 步）。

### 4. 验证 Coze 连接

部署后可通过以下方式验证 Coze API 是否正常：

```bash
# 在服务器上执行（需配置好环境变量）
curl -X POST https://api.coze.cn/v1/workflow/async_run \
  -H "Authorization: Bearer $COZE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"workflow_id":"your_workflow_id","parameters":{"input":"https://example.com/test.jpg"}}'
```

预期返回：`{"code":0,"data":{"task_id":"xxx"}}`

---

## 环境变量清单

完整的环境变量列表见 [.env.example](./.env.example)。部署时需配置的全部变量：

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `DATABASE_URL` | ✅ | PostgreSQL 连接串 |
| `COZE_API_TOKEN` | ✅ | Coze 平台 API Token |
| `COZE_BASE_URL` | ✅ | Coze API 基础地址 |
| `OSS_ACCESS_KEY_ID` | ✅ | 阿里云 RAM AccessKey ID |
| `OSS_ACCESS_KEY_SECRET` | ✅ | 阿里云 RAM AccessKey Secret |
| `OSS_BUCKET` | ✅ | OSS Bucket 名称 |
| `OSS_REGION` | ✅ | OSS 地域 |
| `OSS_CDN_DOMAIN` | ✅ | OSS/CDN 访问域名 |
| `JWT_SECRET` | ✅ | JWT 签名密钥（≥32 字符） |
| `FEISHU_DOC_URL` | ✅ | 飞书使用说明文档地址 |
| `NEXT_PUBLIC_APP_URL` | ✅ | 应用对外访问 URL |

---

## 部署后验证

部署完成后，按以下清单验证应用是否正常运行：

### 1. 基础访问

- [ ] 访问首页 `https://your-domain.com` 能正常加载
- [ ] 访问 `/login` 登录页能正常显示
- [ ] 访问 `/register` 注册页能正常显示

### 2. 核心功能

- [ ] 注册新账号成功
- [ ] 登录后跳转到 `/dashboard`
- [ ] 工作流列表（`/api/workflow/list`）返回数据
- [ ] 上传图片（`/api/upload`）成功并返回 URL
- [ ] 提交工作流任务（`/api/workflow/[id]/run`）返回 taskId
- [ ] 轮询任务状态（`/api/task/[id]/status`）最终返回 completed
- [ ] 生成视频可通过 OSS CDN 域名访问

### 3. 健康检查

```bash
# 检查应用响应
curl -I https://your-domain.com

# 检查 API 可用性
curl https://your-domain.com/api/workflow/list
```

---

## 常见问题

### Q1：Vercel 部署后 API 报 502 / 函数超时

**原因**：Coze 任务提交或文件上传耗时超过 Vercel 默认超时（10s）。

**解决**：本项目 `vercel.json` 已为耗时 API 配置 `maxDuration`（60s）。Vercel Pro 计划最大可设 300s，Hobby 计划最大 60s。

### Q2：Prisma 报 "Can't reach database server"

**原因**：数据库连接串错误，或数据库未放行应用 IP。

**解决**：
- Vercel 部署：使用云数据库（Neon/Supabase/阿里云 RDS），确保允许所有 IP 或配置 Vercel 出口 IP
- 自托管：检查 PostgreSQL 的 `pg_hba.conf` 是否允许应用连接

### Q3：OSS 上传报 403 / AccessDenied

**原因**：RAM 子账号权限不足，或 AK/SK 配置错误。

**解决**：
- 确认 RAM 子账号已授予 OSS 读写权限
- 确认 `OSS_BUCKET`、`OSS_REGION` 与 Bucket 实际信息一致
- 检查 AK/SK 是否有多余空格

### Q4：Coze 任务一直 running

**原因**：Coze 工作流未发布，或 `coze_workflow_id` 配置错误。

**解决**：
- 在 Coze 平台确认工作流已发布
- 检查数据库 `workflows` 表的 `coze_workflow_id` 是否为真实值（非占位符）
- 查看应用日志确认 Coze API 响应

### Q5：PM2 重启后环境变量丢失

**原因**：PM2 启动时未加载 `.env.local`。

**解决**：Next.js 会自动读取 `.env.local`，但需确保：
- `.env.local` 位于项目根目录
- PM2 的 `cwd` 配置正确（本项目 `ecosystem.config.cjs` 已配置为 `__dirname`）
- 使用 `pm2 restart randu-ai-workflow --update-env` 重启以刷新环境变量

### Q6：Docker 容器中 Prisma Client 报错

**原因**：Prisma Client 未随构建产物复制到 runner 阶段。

**解决**：本项目 Dockerfile 已在 runner 阶段复制 `node_modules`，确保 Prisma Client 可用。如仍报错，检查 `npx prisma generate` 是否在 builder 阶段成功执行。

---

## 相关文件

| 文件 | 用途 |
|------|------|
| [`vercel.json`](./vercel.json) | Vercel 部署配置（框架、构建命令、函数超时） |
| [`ecosystem.config.cjs`](./ecosystem.config.cjs) | PM2 进程管理配置（自托管部署） |
| [`Dockerfile`](./Dockerfile) | Docker 容器化部署配置 |
| [`.dockerignore`](./.dockerignore) | Docker 构建忽略文件列表 |
| [`.env.example`](./env.example) | 环境变量示例（含详细注释） |
| [`next.config.ts`](./next.config.ts) | Next.js 配置（含 `serverExternalPackages`） |
