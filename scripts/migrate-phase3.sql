-- ============================================================
-- Phase 3.1 schema 同步脚本（幂等）
-- 为 orders 表添加 plan_id 外键约束和索引（Order ↔ Plan 关系）
-- 已存在的对象会被跳过，可重复执行
-- ============================================================

BEGIN;

-- ===== 1. orders.plan_id → plans.id 外键（ON DELETE SET NULL） =====
-- 若已存在同名约束则跳过
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_orders_plan'
      AND table_name = 'orders'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT fk_orders_plan
      FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE SET NULL;
  END IF;
END$$;

-- ===== 2. orders.plan_id 索引（用于按套餐查询订单） =====
CREATE INDEX IF NOT EXISTS orders_plan_id_idx ON orders (plan_id);

COMMIT;

-- 验证
\echo '✓ orders.plan_id 外键与索引已就绪'
