-- ============================================================
-- Phase 13 退费机制 + 成本核算迁移脚本（幂等）
-- 1. orders 表：补齐退费相关字段
-- 2. call_logs 表：补齐 API 成本字段
-- 已存在的列会被跳过，可重复执行
-- ============================================================

-- ===== 1. orders 表退费字段 =====
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_status TEXT NOT NULL DEFAULT 'none';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_reason TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10, 2);

-- ===== 2. call_logs 表成本字段 =====
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS api_cost DECIMAL(10, 4) NOT NULL DEFAULT 0;

-- 验证
\echo '✓ Phase 13 迁移完成（orders 退费字段 + call_logs 成本字段）'
