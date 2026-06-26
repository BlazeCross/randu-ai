-- ============================================================
-- Phase 4 列补齐脚本（幂等）
-- 补齐 workflows / usage_logs 表中 Prisma schema 期望但数据库缺失的列与索引
-- 已存在的对象会被跳过，可重复执行
-- ============================================================

-- ===== 1. workflows 表补齐列 =====
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS cover_image TEXT;
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS input_schema JSONB;
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS output_type TEXT NOT NULL DEFAULT 'text';
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS credits_required INTEGER NOT NULL DEFAULT 1;
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'coze';
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS volc_model TEXT;
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

-- ===== 2. workflows 表索引 =====
CREATE INDEX IF NOT EXISTS workflows_status_sort_order_idx ON workflows (status, sort_order);
CREATE INDEX IF NOT EXISTS workflows_category_idx ON workflows (category);

-- ===== 3. usage_logs 表补齐列 =====
ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS credits_cost INTEGER NOT NULL DEFAULT 0;
ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'direct';
ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS thumbnail TEXT;

-- ===== 4. usage_logs 表索引 =====
CREATE INDEX IF NOT EXISTS usage_logs_user_id_created_at_idx ON usage_logs (user_id, created_at);
CREATE INDEX IF NOT EXISTS usage_logs_user_id_status_idx ON usage_logs (user_id, status);
CREATE INDEX IF NOT EXISTS usage_logs_workflow_id_idx ON usage_logs (workflow_id);

-- 验证
\echo '✓ Phase 4 列补齐完成（workflows + usage_logs）'
