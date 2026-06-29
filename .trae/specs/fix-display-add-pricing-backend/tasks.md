# Tasks

## 阶段一：显示问题修复（不依赖数据库）

- [x] Task 1: 修复首页底部背景颜色割裂
  - [x] SubTask 1.1: 检查 Footer 与上方区域的背景色过渡
  - [x] SubTask 1.2: 统一为平滑过渡（Footer 背景改为 bg-background）
- [x] Task 2: 首页轮播图 HeroCarousel 左右拉通全屏宽度
  - [x] SubTask 2.1: 移除外层 max-w-[1600px] 容器限制，改为 w-full
  - [x] SubTask 2.2: 内容区保持居中可读（内部 max-w 限制）
- [x] Task 3: 工作台页面侧栏固定不滚动
  - [x] SubTask 3.1: AppShell 高度改为 h-[calc(100vh-48px)] 避开全局导航栏
  - [x] SubTask 3.2: 修改切换按钮图标为 panel-left（矩形+左侧竖线）
- [x] Task 4: 智能体页面容器与输入框修复
  - [x] SubTask 4.1: 修复顶部与全局导航栏重叠（AppShell 高度调整）
  - [x] SubTask 4.2: 底部输入框区域固定（flex-none）
  - [x] SubTask 4.3: 左侧功能栏固定不滚动（AppShell flex 布局）
- [x] Task 5: 图文教程、视频教程页面侧栏固定不滚动（共享 AppShell 修复）
- [x] Task 6: 公司名规范统一
  - [x] SubTask 6.1: Footer 显示全称"四川燃渡文化传媒有限公司"
  - [x] SubTask 6.2: 品牌导航处保留"燃渡AI"
- [x] Task 7: 顶部导航栏套餐等级/积分余额按钮化
  - [x] SubTask 7.1: 套餐 Badge 用 Link 包裹跳转 /pricing（stopPropagation 避免触发 Popover）
  - [x] SubTask 7.2: 积分余额数字改为 Link 跳转 /credits

## 阶段二：新页面（定价 + 积分）

- [x] Task 8: 创建定价页面 /pricing
  - [x] SubTask 8.1: 套餐对比卡片（4 张横向，中间专业版高亮推荐）
  - [x] SubTask 8.2: 从 /api/payment/packages 读取套餐数据，失败回退默认
  - [x] SubTask 8.3: 订阅按钮调用 /api/payment/create 支付流程
  - [x] SubTask 8.4: 顶部导航栏新增"定价"链接
- [x] Task 9: 创建积分余额页面 /credits
  - [x] SubTask 9.1: 显示积分余额、积分明细（/api/user/usage）
  - [x] SubTask 9.2: 积分套餐购买入口（跳转 /pricing）

## 阶段三：数据库与后台管理

- [x] Task 10: 数据库 schema 新增模型
  - [x] SubTask 10.1: 新增 CarouselSlide 模型
  - [x] SubTask 10.2: 新增 Tutorial 模型（含 studyCount/viewCount/accessLevel）
  - [x] SubTask 10.3: 生成迁移 SQL scripts/migrate-phase2.sql
  - [ ] SubTask 10.4: 服务器执行迁移（部署时执行）
- [x] Task 11: 后台轮播图管理系统
  - [x] SubTask 11.1: /admin/carousel 页面（列表+新增+编辑+删除）
  - [x] SubTask 11.2: /api/admin/carousel CRUD 接口
  - [x] SubTask 11.3: 图片上传复用 /api/upload
- [x] Task 12: 后台教程管理系统（图文 + 视频）
  - [x] SubTask 12.1: /admin/tutorials/articles 页面
  - [x] SubTask 12.2: /admin/tutorials/videos 页面
  - [x] SubTask 12.3: /api/admin/tutorials CRUD 接口
  - [x] SubTask 12.4: 字段：学习人数/浏览次数可编辑、学习权限 free/vip
- [x] Task 13: 前台教程列表从数据库读取并按权限过滤
  - [x] SubTask 13.1: /academy/articles 从 /api/tutorials 读取
  - [x] SubTask 13.2: /academy/videos 从 /api/tutorials 读取
  - [x] SubTask 13.3: VIP 教程对未订阅用户显示锁定标识（锁图标+VIP Badge+blur 封面）
- [x] Task 14: HeroCarousel 改为从 API 读取轮播数据
  - [x] SubTask 14.1: 新增 /api/carousel 公开接口
  - [x] SubTask 14.2: HeroCarousel fetch 数据，无数据回退默认 DEFAULT_SLIDES

## 阶段四：支付宝订阅付费

- [x] Task 15: 完善支付宝集成（框架完成，待密钥配置启用）
  - [x] SubTask 15.1: src/lib/alipay.ts 已完整实现（loadConfig/getAlipaySdk/createPagePayment/verifyNotifySign）
  - [x] SubTask 15.2: /api/payment/create 添加 maxDuration=30 超时
  - [x] SubTask 15.3: /api/payment/callback 新增 GET 同步返回处理 + POST 异步通知验签
  - [x] SubTask 15.4: 支付成功 Prisma 事务更新套餐+积分
- [ ] Task 16: 向用户收集支付宝所需材料（待用户提供）
  - 所需材料：ALIPAY_APP_ID、ALIPAY_PRIVATE_KEY、ALIPAY_PUBLIC_KEY、网关、通知URL
  - 前置：域名备案完成（randuai.cn）

## 阶段五：燃渡学院内容丰富

- [x] Task 17: 全网搜索主流 AI 教育平台内容结构（6 个平台调研）
- [x] Task 18: 燃渡学院首页重构
  - [x] SubTask 18.1: Hero + 精简学习数据 + 学习路径（6 条）
  - [x] SubTask 18.2: 推荐课程板块（8 张卡）
  - [x] SubTask 18.3: 讲师介绍板块（6 位）
  - [x] SubTask 18.4: 完整学习数据统计（6 项）
  - [x] SubTask 18.5: 学员评价板块（6 条）
  - [x] SubTask 18.6: FAQ 板块（8 个，可折叠手风琴）

# Task Dependencies
- Task 2/3/4/5（显示修复）已并行完成
- Task 8/9（新页面）依赖 Task 7 已完成
- Task 11/12/13/14（后台管理）依赖 Task 10 已完成
- Task 15（支付宝）框架完成，Task 16 待用户提供材料
- Task 17/18（学院内容）已完成

# 待办（部署阶段）
- 服务器执行 scripts/migrate-phase2.sql 数据库迁移
- 用户提供支付宝密钥材料配置到 .env.production
- 域名备案完成后配置 ALIPAY_NOTIFY_URL
