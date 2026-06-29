# Checklist

## 登录 500 错误根除
- [x] 登录 API catch 块不再返回 debug 字段
- [x] 登录 API catch 块仅返回 { message: "服务器内部错误" }
- [x] console.error 仍记录完整错误到服务器日志
- [x] 本地 npx next build 无类型错误

## 登录系统安全加固
- [x] 登录 API 通过 Set-Cookie 下发 httpOnly + Secure + SameSite=Lax cookie
- [x] 注册 API 通过 Set-Cookie 下发 httpOnly cookie
- [x] 前端不再在 localStorage 存储 JWT
- [x] API 鉴权优先从 cookie 读取 token，回退到 Bearer header
- [x] proxy 对 cookie token 执行 jwt.verify 验签
- [x] proxy 对无效/过期 token 重定向到 /login
- [x] requireAuth 查询用户 status，blocked 返回 403
- [x] requireAuth 有短时内存缓存降低 DB 压力
- [x] jwt.verify 显式指定 algorithms: ['HS256']
- [x] signToken 包含 issuer 和 audience
- [x] 登录时用户不存在时执行 dummy bcrypt.compare
- [x] cookie maxAge 与 JWT exp 一致（7 天）
- [x] 新增 /api/auth/logout 路由清除 cookie
- [x] next.config.ts 配置安全响应头（CSP/HSTS/X-Frame-Options 等）
- [x] 安全响应头不影响 themeScript 和 next/image

## 死代码清理
- [x] public/icons/ 目录已删除（40 个 SVG）
- [x] public/next.svg、vercel.svg、file.svg、globe.svg、window.svg 已删除
- [x] src/components/ui/Button.tsx 已删除
- [x] src/components/ui/Card.tsx 已删除
- [x] src/components/ui/SectionHeader.tsx 已删除
- [x] src/lib/api-error.ts 已删除
- [x] src/app/api/admin/workflows/[id]/cover/ 已删除
- [x] package.json 中 effect 依赖已移除
- [x] src/lib/invite.ts 的 NEXT_PUBLIC_BASE_URL 已改为 NEXT_PUBLIC_APP_URL
- [x] layout.tsx 中注释的 OG 图片 TODO 已删除
- [x] .env.production.example 补全 ALIYUN_STS_* 变量说明
- [x] docker-compose.yml 补全缺失的环境变量

## 构建与部署
- [x] npx next build 成功（89 页全部生成）
- [x] Git commit 并 push 成功
- [ ] 服务器部署命令已提供
- [ ] Docker 日志切割配置命令已提供
- [ ] 磁盘空间排查命令清单已提供
- [ ] 浏览器缓存清理指导已提供

## 不破坏现有功能验证
- [x] 登录功能正常（账号密码登录）
- [x] 注册功能正常
- [x] 登出功能正常（清除 cookie）
- [x] 受保护路由 /dashboard、/chat、/workspace、/admin 需登录才能访问
- [x] API 鉴权正常（Bearer header 兼容外部 SDK）
- [x] 主题切换功能正常（暗色/亮色）
- [x] 客服按钮功能正常
- [x] 预约弹窗功能正常
- [x] 图片上传功能正常
- [x] 工作流执行功能正常
- [x] 智能体对话功能正常
