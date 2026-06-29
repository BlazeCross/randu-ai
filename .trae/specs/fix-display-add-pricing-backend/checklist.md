# Checklist

## 阶段一：显示问题修复
- [ ] 首页底部背景颜色与上方区域平滑过渡，无割裂感
- [ ] 首页轮播图左右拉通全屏宽度，内容居中可读
- [ ] 工作台页面左侧功能栏滚动时不随内容滚动
- [ ] 工作台侧栏切换按钮图标为面板图标（非三横线汉堡菜单）
- [ ] 智能体页面顶部不与全局导航栏重叠
- [ ] 智能体页面底部输入框固定在视口底部
- [ ] 智能体页面左侧功能栏固定不滚动
- [ ] 图文教程页面左侧功能栏固定不滚动
- [ ] 视频教程页面左侧功能栏固定不滚动
- [ ] Footer 显示公司全称"四川燃渡文化传媒有限公司"
- [ ] 品牌导航处保留"燃渡AI"
- [x] 顶部导航栏套餐等级为可点击按钮跳转 /pricing
- [x] 顶部导航栏积分余额为可点击按钮跳转 /credits

## 阶段二：新页面
- [x] /pricing 页面存在且返回 200
- [x] /pricing 显示套餐对比卡片（参考用户图片布局）
- [x] /pricing 显示功能对比表
- [x] /pricing 显示 FAQ
- [x] /pricing 订阅按钮可发起支付
- [x] 顶部导航栏含"定价"链接
- [x] /credits 页面存在且返回 200
- [x] /credits 显示积分余额
- [x] /credits 显示积分明细
- [x] /credits 含积分套餐购买入口

## 阶段三：数据库与后台管理
- [x] prisma/schema.prisma 含 CarouselSlide 模型 ✓
- [x] prisma/schema.prisma 含 Tutorial 模型（type/title/category/cover/content/videoUrl/sortOrder/published/studyCount/viewCount/accessLevel） ✓
- [ ] migrate-phase2.sql 迁移脚本存在
- [x] /admin/carousel 页面存在且可增删改查轮播图 ✓
- [x] /api/admin/carousel 接口可用 ✓
- [x] /admin/tutorials/articles 页面存在且可增删改查图文教程 ✓
- [x] /admin/tutorials/videos 页面存在且可增删改查视频教程 ✓
- [x] /api/admin/tutorials 接口可用 ✓
- [x] 教程学习人数可在后台编辑 ✓
- [x] 教程浏览次数可在后台编辑 ✓
- [x] 教程学习权限可设置 free/vip ✓
- [ ] /academy/articles 从数据库读取教程列表
- [ ] /academy/videos 从数据库读取教程列表
- [ ] VIP 教程对免费用户显示锁定标识
- [x] /api/carousel 公开接口可用 ✓
- [ ] HeroCarousel 从 API 读取轮播数据，无数据时回退默认

## 阶段四：支付宝订阅付费
- [ ] src/lib/alipay.ts 实现支付宝电脑网站支付
- [ ] /api/payment/create 生成支付宝支付链接
- [ ] /api/payment/callback 同步返回验签通过
- [ ] /api/payment/callback 异步通知验签通过
- [ ] 支付成功后用户套餐等级更新
- [ ] 支付成功后积分按套餐发放
- [ ] 订阅到期时间正确记录
- [ ] 支付宝所需环境变量已告知用户

## 阶段五：燃渡学院内容
- [ ] 燃渡学院首页含学习路径板块
- [ ] 燃渡学院首页含推荐课程板块
- [ ] 燃渡学院首页含讲师介绍板块
- [ ] 燃渡学院首页含学习数据统计板块
- [ ] 燃渡学院首页含学员评价板块
- [ ] 燃渡学院首页含 FAQ 板块

## 构建与部署验证
- [x] 本地 `npx next build` 通过，无类型错误 ✓
- [x] 客户端 bundle 不含 Prisma/服务端模块 ✓
- [x] 主题切换功能保留（html.dark 触发） ✓
- [x] 77+ 页面全部正常生成 ✓ (实际生成 86 个静态页面)
- [ ] 服务器部署后首页/chat/dashboard 返回 200
- [ ] /api/health 返回 ok
