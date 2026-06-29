# 平台安全加固、登录系统优化与代码清理 Spec

## Why

当前平台存在以下问题：
1. **登录 500 错误未根除**：服务器端 curl 测试 200 正常，但浏览器访问仍报 500（可能由旧 JS chunk、debug 信息泄露或代理配置引起）
2. **登录系统存在多项安全隐患**：JWT 存于 localStorage（XSS 可窃取）、proxy 仅检查 cookie 存在不验签、登录 500 响应泄露 debug 堆栈、requireAuth 不校验用户封禁状态
3. **代码库存在大量死代码**：45 个孤立静态资源、3 个未使用组件、1 个死 API 路由、1 个死 lib 模块、1 个未使用依赖（effect）、环境变量命名 bug（NEXT_PUBLIC_BASE_URL vs NEXT_PUBLIC_APP_URL）
4. **系统盘占用 25.19GB**：可能由 Docker 容器日志未切割、APT 缓存、journal 日志等堆积导致
5. **OSS 配置不完整**：STS 直传未启用、CDN 域名实为 OSS 默认域名、AI 生成视频 24h 失效未转存

本次优化目标：**可靠、安全、稳定、可控、模块化、方便后续升级**，严格遵循阿里云开发文档最佳实践，绝不破坏现有功能。

## What Changes

### A. 登录 500 错误根除（P0 紧急）
- 移除登录 API catch 块中的 `debug` 字段返回（修复信息泄露 + 避免序列化错误）
- 确保服务器代码与最新提交同步（解决旧 chunk hash 问题）
- 验证 Nginx 反代配置正确性

### B. 登录系统安全加固（P0 高优先）
- **JWT 存储改造**：从 localStorage + 非 httpOnly cookie 改为 httpOnly + Secure + SameSite=Lax cookie
  - 登录 API 通过 `Set-Cookie` 响应头下发 httpOnly cookie
  - 前端不再在 localStorage 存储 token
  - API 鉴权从 `Authorization: Bearer` 改为从 cookie 读取（保留 Bearer 兼容外部 SDK）
- **proxy 验签**：proxy 中对 cookie 调用 `jwt.verify` 校验签名和过期，而非仅检查存在性
- **requireAuth 加固**：在 requireAuth 中查询用户 status，blocked 用户直接 403
- **JWT 算法 pin**：`jwt.verify` 显式指定 `algorithms: ['HS256']`
- **登录时序攻击防护**：用户不存在时对固定 dummy hash 执行 bcrypt.compare
- **cookie max-age 对齐**：从 30 天改为 7 天（与 JWT exp 一致）

### C. 死代码清理（P1 中优先）
- 删除 45 个孤立静态资源（40 个 icons + 5 个默认 SVG）
- 删除 3 个未使用组件（Button.tsx、Card.tsx、SectionHeader.tsx）
- 删除 1 个死 API 路由（/api/admin/workflows/[id]/cover）
- 删除 1 个死 lib 模块（api-error.ts）
- 移除未使用依赖 effect（package.json）
- 修复环境变量命名 bug（NEXT_PUBLIC_BASE_URL → NEXT_PUBLIC_APP_URL）
- 删除 layout.tsx 中注释掉的 OG 图片 TODO

### D. 服务器磁盘与基础设施优化（P2 低优先，仅文档指导）
- 提供 Docker 日志切割配置命令（不修改项目文件）
- 提供磁盘空间排查命令清单
- 完善 .env.production.example 补全 STS 相关变量
- 修复 docker-compose.yml 缺失的环境变量

## Impact

- **Affected specs**: platform-final-optimization（已完成，本次为独立优化）
- **Affected code**:
  - 登录相关：src/app/api/auth/login/route.ts、src/lib/auth.ts、src/lib/auth-context.tsx、src/proxy.ts、src/app/login/page.tsx
  - 死代码清理：public/icons/、public/{next,vercel,file,globe,window}.svg、src/components/ui/{Button,Card,SectionHeader}.tsx、src/app/api/admin/workflows/[id]/cover/、src/lib/api-error.ts
  - 配置修复：package.json、.env.production.example、docker-compose.yml、src/lib/invite.ts
  - 安全头：next.config.ts（添加 CSP/HSTS 等响应头）

## ADDED Requirements

### Requirement: HttpOnly Cookie 鉴权
系统 SHALL 在登录成功时通过 `Set-Cookie` 响应头下发 httpOnly + Secure + SameSite=Lax cookie，前端不再在 localStorage 存储 JWT。

#### Scenario: 登录成功
- **WHEN** 用户提交正确的账号密码
- **THEN** API 返回 200 + Set-Cookie 头（httpOnly=true, secure=true, sameSite=lax, maxAge=7天, path=/）
- **AND** 前端不再执行 localStorage.setItem(TOKEN_KEY, token)
- **AND** 前端从响应中读取 user 信息并存储到 React state

#### Scenario: API 鉴权
- **WHEN** 受保护的 API 收到请求
- **THEN** 优先从 cookie 读取 token 并验签
- **IF** cookie 无 token，则回退到 Authorization: Bearer header（兼容外部 SDK）

### Requirement: Proxy 验签
系统 SHALL 在 proxy 中对 cookie token 执行 jwt.verify 验证签名和过期时间。

#### Scenario: 有效 token
- **WHEN** 请求携带有效且未过期的 JWT cookie
- **THEN** 放行请求

#### Scenario: 无效或过期 token
- **WHEN** cookie 缺失、签名无效或已过期
- **THEN** 重定向到 /login?redirect=<原路径>

### Requirement: requireAuth 封禁校验
系统 SHALL 在 requireAuth 中查询用户 status，blocked 用户返回 403。

#### Scenario: 封禁用户访问
- **WHEN** status=blocked 的用户携带有效 JWT 访问受保护 API
- **THEN** 返回 403 + "账号已被封禁，请联系管理员"

### Requirement: 安全响应头
系统 SHALL 在 next.config.ts 中配置 Content-Security-Policy、X-Content-Type-Options、X-Frame-Options、Referrer-Policy、Strict-Transport-Security 等安全响应头。

#### Scenario: 所有响应
- **WHEN** 任何 HTTP 响应
- **THEN** 包含上述安全头

## MODIFIED Requirements

### Requirement: 登录 API 错误处理
登录 API 的 catch 块 SHALL 仅返回 `{ message: "服务器内部错误" }`，不泄露 debug 信息（stack、env 配置状态等）。错误详情仅通过 console.error 输出到服务器日志。

### Requirement: 登录时序安全
登录 API SHALL 在用户不存在时对固定 dummy bcrypt hash 执行 compare 操作，消除账号存在与否的响应时间差异。

### Requirement: JWT 验签算法锁定
`jwt.verify` SHALL 显式指定 `{ algorithms: ['HS256'] }`，防止算法混淆攻击。

## REMOVED Requirements

### Requirement: localStorage 存储 JWT
**Reason**: localStorage 存储 JWT 可被 XSS 攻击窃取，违反安全最佳实践
**Migration**: 改为 httpOnly cookie 存储，前端不再直接访问 token

### Requirement: 登录 API 返回 debug 字段
**Reason**: debug 字段泄露服务器堆栈和环境配置状态，违反信息安全原则
**Migration**: 仅 console.error 记录，响应只返回通用 message
