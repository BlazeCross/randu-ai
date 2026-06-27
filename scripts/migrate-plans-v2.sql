-- Phase 17.2 套餐细化迁移脚本
-- 更新现有套餐 + 新增体验包/月卡/季卡/年卡
-- 注意：此脚本只更新 plans 表的常量数据，不涉及 users 表结构变更
-- 积分有效期字段（credits_expires_at / credits_expired）已在 migrate-credits-expire.sql 中添加

-- 1. 更新现有套餐（基础版/专业版/企业版 保持不变，作为订阅套餐）
-- 已有数据，无需变更

-- 2. 新增点数包套餐（type 字段通过 features 标识，plans 表无独立 type 列）
-- 使用 upsert 避免重复插入

-- 体验包：6元 = 50点（有效期7天）
INSERT INTO plans (id, name, daily_limit, monthly_price, features, created_at, updated_at)
VALUES (
  'plan_trial_pack',
  '体验包',
  0,
  6.00,
  '["50点积分","有效期7天","适合体验试用"]'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT (name) DO UPDATE SET
  daily_limit = EXCLUDED.daily_limit,
  monthly_price = EXCLUDED.monthly_price,
  features = EXCLUDED.features,
  updated_at = NOW();

-- 月卡：30元 = 300点（有效期30天）
INSERT INTO plans (id, name, daily_limit, monthly_price, features, created_at, updated_at)
VALUES (
  'plan_monthly',
  '月卡',
  0,
  30.00,
  '["300点积分","有效期30天","适合个人轻度使用"]'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT (name) DO UPDATE SET
  daily_limit = EXCLUDED.daily_limit,
  monthly_price = EXCLUDED.monthly_price,
  features = EXCLUDED.features,
  updated_at = NOW();

-- 季卡：88元 = 1000点（有效期90天）
INSERT INTO plans (id, name, daily_limit, monthly_price, features, created_at, updated_at)
VALUES (
  'plan_quarterly',
  '季卡',
  0,
  88.00,
  '["1000点积分","有效期90天","9折优惠","适合个人常规使用"]'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT (name) DO UPDATE SET
  daily_limit = EXCLUDED.daily_limit,
  monthly_price = EXCLUDED.monthly_price,
  features = EXCLUDED.features,
  updated_at = NOW();

-- 年卡：299元 = 5000点（有效期365天）
INSERT INTO plans (id, name, daily_limit, monthly_price, features, created_at, updated_at)
VALUES (
  'plan_yearly',
  '年卡',
  0,
  299.00,
  '["5000点积分","有效期365天","85折优惠","适合个人重度使用"]'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT (name) DO UPDATE SET
  daily_limit = EXCLUDED.daily_limit,
  monthly_price = EXCLUDED.monthly_price,
  features = EXCLUDED.features,
  updated_at = NOW();

-- 3. 验证
SELECT name, daily_limit, monthly_price, features FROM plans ORDER BY monthly_price;
