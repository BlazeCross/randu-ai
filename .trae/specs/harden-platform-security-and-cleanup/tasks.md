# Tasks

## 阶段一：登录 500 错误根除（P0 紧急）

- [x] Task 1: 移除登录 API 的 debug 信息泄露
  - [x] SubTask 1.1: 修改 src/app/api/auth/login/route.ts，catch 块仅返回 { message: "服务器内部错误" }，移除 debug 字段
  - [x] SubTask 1.2: 保留 console.error 输出完整错误到服务器日志
  - [x] SubTask 1.3: 构建验证（npx next build）确保无类型错误

- [ ] Task 2: 验证服务器端代码同步与部署
  - [ ] SubTask 2.1: 确认本地代码已 commit 并 push 到 GitHub
  - [ ] SubTask 2.2: 提供服务器部署命令（git fetch + reset + docker rebuild）
  - [ ] SubTask 2.3: 提供清理浏览器缓存的指导

## 阶段二：登录系统安全加固（P0 高优先）

- [x] Task 3: 改造 JWT 存储为 httpOnly Cookie
  - [x] SubTask 3.1: 修改 src/app/api/auth/login/route.ts，登录成功时通过 Set-Cookie 响应头下发 httpOnly + Secure + SameSite=Lax + MaxAge=7天 + Path=/ 的 cookie
  - [x] SubTask 3.2: 修改 src/app/api/auth/register/route.ts，注册成功时同样下发 httpOnly cookie
  - [x] SubTask 3.3: 修改 src/lib/auth.ts 的 getTokenFromRequest，优先从 cookie 读取 token，回退到 Authorization Bearer header（兼容外部 SDK）
  - [x] SubTask 3.4: 修改 src/lib/auth-context.tsx，移除 localStorage 读写，login 函数不再手动设 cookie（由 API 响应头自动设置），logout 函数通过调用 /api/auth/logout 清除 cookie
  - [x] SubTask 3.5: 新增 src/app/api/auth/logout/route.ts，POST 请求清除 httpOnly cookie（maxAge=0）
  - [x] SubTask 3.6: 修改 src/proxy.ts，从 cookie 读取 token 并执行 jwt.verify 验签（不再仅检查存在性）
  - [x] SubTask 3.7: 更新所有使用 localStorage TOKEN_KEY 的文件（analytics-client.ts、useTaskPolling.ts、ImageUploader.tsx、admin 页面）改为从 /api/user/profile 获取登录状态或使用 useAuth

- [x] Task 4: requireAuth 封禁校验
  - [x] SubTask 4.1: 修改 src/lib/auth.ts 的 requireAuth，在 verifyToken 后查询用户 status，blocked 返回 403
  - [x] SubTask 4.2: 添加短时内存缓存（5 秒 TTL）降低 DB 查询压力

- [x] Task 5: JWT 安全加固
  - [x] SubTask 5.1: 修改 src/lib/auth.ts 的 verifyToken，显式指定 { algorithms: ['HS256'] }
  - [x] SubTask 5.2: 修改 src/lib/auth.ts 的 signToken，添加 issuer 和 audience 声明
  - [x] SubTask 5.3: 修改 src/app/api/auth/login/route.ts，用户不存在时对 dummy hash 执行 bcrypt.compare 消除时序差异

- [x] Task 6: 安全响应头配置
  - [x] SubTask 6.1: 修改 next.config.ts，添加 headers() 配置 Content-Security-Policy、X-Content-Type-Options、X-Frame-Options、Referrer-Policy、Strict-Transport-Security
  - [x] SubTask 6.2: 确保不影响现有内联脚本（themeScript）和 next/image 加载

## 阶段三：死代码清理（P1 中优先）

- [x] Task 7: 删除孤立静态资源
  - [x] SubTask 7.1: 删除 public/icons/ 目录（40 个 SVG 文件）
  - [x] SubTask 7.2: 删除 public/next.svg、public/vercel.svg、public/file.svg、public/globe.svg、public/window.svg

- [x] Task 8: 删除未使用组件和模块
  - [x] SubTask 8.1: 删除 src/components/ui/Button.tsx
  - [x] SubTask 8.2: 删除 src/components/ui/Card.tsx
  - [x] SubTask 8.3: 删除 src/components/ui/SectionHeader.tsx
  - [x] SubTask 8.4: 删除 src/lib/api-error.ts
  - [x] SubTask 8.5: 删除 src/app/api/admin/workflows/[id]/cover/ 目录（死路由）

- [x] Task 9: 清理依赖和配置
  - [x] SubTask 9.1: 从 package.json 移除 effect 依赖
  - [x] SubTask 9.2: 修复 src/lib/invite.ts 的 NEXT_PUBLIC_BASE_URL → NEXT_PUBLIC_APP_URL
  - [x] SubTask 9.3: 删除 src/app/layout.tsx 中注释的 OG 图片 TODO
  - [x] SubTask 9.4: 更新 .env.production.example 补全 ALIYUN_STS_* 变量说明
  - [x] SubTask 9.5: 更新 docker-compose.yml 补全缺失的环境变量

## 阶段四：构建验证与部署（P0 必做）

- [x] Task 10: 构建验证
  - [x] SubTask 10.1: 执行 npx next build 确保无类型错误
  - [x] SubTask 10.2: 确认所有页面正常生成
  - [x] SubTask 10.3: Git commit 并 push

- [ ] Task 11: 部署指导
  - [ ] SubTask 11.1: 提供服务器部署命令
  - [ ] SubTask 11.2: 提供 Docker 日志切割配置命令
  - [ ] SubTask 11.3: 提供磁盘空间排查命令清单
  - [ ] SubTask 11.4: 提供浏览器缓存清理指导

# Task Dependencies
- Task 2 依赖 Task 1 完成
- Task 3 的 SubTask 3.7 依赖 SubTask 3.4 完成
- Task 4 可与 Task 3 并行
- Task 5 可与 Task 3、Task 4 并行
- Task 6 可与 Task 3-5 并行
- Task 7、8、9 可并行
- Task 10 依赖 Task 1-9 全部完成
- Task 11 依赖 Task 10 完成
