-- ============================================================
-- Phase 1 schema 同步脚本（幂等）
-- 在 PostgreSQL 上执行，新增表 + 给现有表加新字段
-- 已存在的对象会被跳过，可重复执行
-- ============================================================

BEGIN;

-- ===== 1. 给 users 表加新字段（IF NOT EXISTS 保护） =====
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_used INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- 创建 users.updated_at 触发器（自动更新）
DROP FUNCTION IF EXISTS update_users_updated_at();
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();

-- ===== 2. 给 workflows 表加新字段（IF NOT EXISTS 保护） =====
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS cover_image VARCHAR;
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS input_schema JSONB;
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS output_type VARCHAR DEFAULT 'text';
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS credits_required INT DEFAULT 1;
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS source VARCHAR DEFAULT 'coze';
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS volc_model VARCHAR;
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- 创建 workflows.updated_at 触发器
DROP FUNCTION IF EXISTS update_workflows_updated_at();
CREATE OR REPLACE FUNCTION update_workflows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS workflows_updated_at ON workflows;
CREATE TRIGGER workflows_updated_at
  BEFORE UPDATE ON workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_workflows_updated_at();

CREATE INDEX IF NOT EXISTS workflows_status_sort_order_idx ON workflows (status, sort_order);
CREATE INDEX IF NOT EXISTS workflows_category_idx ON workflows (category);

-- ===== 3. 给 usage_logs 表加新字段（IF NOT EXISTS 保护） =====
ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS credits_cost INT DEFAULT 0;
ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS source VARCHAR DEFAULT 'direct';
ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS thumbnail VARCHAR;

CREATE INDEX IF NOT EXISTS usage_logs_user_id_created_at_idx ON usage_logs (user_id, created_at);
CREATE INDEX IF NOT EXISTS usage_logs_user_id_status_idx ON usage_logs (user_id, status);
CREATE INDEX IF NOT EXISTS usage_logs_workflow_id_idx ON usage_logs (workflow_id);

-- ===== 4. 新建 api_keys 表 =====
CREATE TABLE IF NOT EXISTS api_keys (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  key_prefix VARCHAR NOT NULL,
  key_hash VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'active',
  credits_used INT DEFAULT 0,
  total_calls INT DEFAULT 0,
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_api_keys_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS api_keys_user_id_idx ON api_keys (user_id);

-- ===== 5. 新建 call_logs 表 =====
CREATE TABLE IF NOT EXISTS call_logs (
  id VARCHAR PRIMARY KEY,
  api_key_id VARCHAR NOT NULL,
  user_id VARCHAR NOT NULL,
  workflow_id VARCHAR,
  endpoint VARCHAR NOT NULL,
  method VARCHAR NOT NULL,
  credits_cost INT DEFAULT 0,
  status VARCHAR DEFAULT 'success',
  error_message VARCHAR,
  response_time INT,
  client_ip VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_call_logs_api_key FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE CASCADE,
  CONSTRAINT fk_call_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS call_logs_api_key_id_created_at_idx ON call_logs (api_key_id, created_at);
CREATE INDEX IF NOT EXISTS call_logs_user_id_created_at_idx ON call_logs (user_id, created_at);

-- ===== 6. 新建 orders 表 =====
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR PRIMARY KEY,
  order_no VARCHAR UNIQUE NOT NULL,
  user_id VARCHAR NOT NULL,
  type VARCHAR NOT NULL,
  plan_id VARCHAR,
  credits INT DEFAULT 0,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR DEFAULT 'pending',
  payment_method VARCHAR,
  payment_id VARCHAR,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS orders_user_id_created_at_idx ON orders (user_id, created_at);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status);

-- ===== 7. 新建 notifications 表 =====
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  type VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  content VARCHAR,
  link VARCHAR,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS notifications_user_id_is_read_created_at_idx ON notifications (user_id, is_read, created_at);

-- ===== 8. 新建 action_logs 表 =====
CREATE TABLE IF NOT EXISTS action_logs (
  id VARCHAR PRIMARY KEY,
  operator_id VARCHAR NOT NULL,
  target_user_id VARCHAR,
  action VARCHAR NOT NULL,
  detail JSONB,
  ip_address VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_action_logs_operator FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_action_logs_target FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS action_logs_operator_id_created_at_idx ON action_logs (operator_id, created_at);
CREATE INDEX IF NOT EXISTS action_logs_target_user_id_idx ON action_logs (target_user_id);

-- ===== 9. 给 plans 表加 updated_at 触发器 =====
DROP FUNCTION IF EXISTS update_plans_updated_at();
CREATE OR REPLACE FUNCTION update_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS plans_updated_at ON plans;
CREATE TRIGGER plans_updated_at
  BEFORE UPDATE ON plans
  FOR EACH ROW
  EXECUTE FUNCTION update_plans_updated_at();

COMMIT;

-- ===== 10. 验证：列出所有表 =====
\echo '当前数据库表列表：'
\dt
