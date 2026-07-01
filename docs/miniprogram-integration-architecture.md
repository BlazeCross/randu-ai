# 微信小程序与网站数据互通架构

## 1. 统一用户体系

### UnionID 方案
- 微信授权后获取 UnionID
- UnionID 作为跨平台用户的唯一标识
- 网站用户和小程序用户通过 UnionID 关联

### 登录流程
1. 小程序通过微信授权获取 code
2. 后端通过 code 换取 openid/session_key
3. 通过 UnionID 判断用户是否已注册
4. 已注册用户直接登录，未注册用户创建新账号

## 2. 数据同步方案

### 实时同步
- 用户基本信息（昵称、头像）
- 会员状态
- 积分/配额

### 异步同步
- 学习进度（定时同步）
- 使用历史（批量同步）

### 不同步
- 网站特有功能
- 临时会话状态

## 3. API 设计

### 微信授权登录
- POST /api/auth/wechat/miniprogram/login
- 请求体：{ code: string }
- 返回：{ token, user, isNewUser }

### 绑定已有账号
- POST /api/auth/wechat/miniprogram/bind
- 请求体：{ unionId, account, password }
