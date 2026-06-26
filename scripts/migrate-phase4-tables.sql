-- ============================================================
-- Phase 4 数据库表补齐脚本（幂等）
-- 补齐 Prisma schema 中存在但数据库缺失的 5 张表：
--   api_keys / call_logs / orders / notifications / action_logs
-- 注意：Prisma String 类型映射为 PostgreSQL text（非 UUID）
-- 已存在的对象会被跳过，可重复执行
-- ============================================================

-- 不使用 BEGIN/COMMIT 事务包裹，让每条语句独立执行，
-- 这样即使某条失败也不会导致后续全部回滚

-- ===== 1. api_keys 表 =====
CREATE TABLE IF NOT EXISTS api_keys (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL,
  key_prefix      TEXT NOT NULL,
  key_hash        TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'active',
  credits_used    INTEGER NOT NULL DEFAULT 0,
  total_calls     INTEGER NOT NULL DEFAULT 0,
  last_used_at    TIMESTAMP(3),
  expires_at      TIMESTAMP(3),
  created_at      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- Phase 3.4 频率限制字段
  qps_limit       INTEGER NOT NULL DEFAULT 5,
  daily_limit     INTEGER NOT NULL DEFAULT 1000,
  daily_used      INTEGER NOT NULL DEFAULT 0,
  daily_reset_at  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- Phase 3.6 Webhook 配置
  webhook_url     TEXT,
  webhook_secret  TEXT
);

-- api_keys -> users 外键（Prisma 默认命名：api_keys_user_id_fkey）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'api_keys_user_id_fkey'
      AND table_name = 'api_keys'
  ) THEN
    ALTER TABLE api_keys
      ADD CONSTRAINT api_keys_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS api_keys_user_id_idx ON api_keys (user_id);


-- ===== 2. call_logs 表 =====
CREATE TABLE IF NOT EXISTS call_logs (
  id            TEXT PRIMARY KEY,
  api_key_id    TEXT NOT NULL,
  user_id       TEXT NOT NULL,
  workflow_id   TEXT,
  endpoint      TEXT NOT NULL,
  method        TEXT NOT NULL,
  credits_cost  INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'success',
  error_message TEXT,
  response_time INTEGER,
  client_ip     TEXT,
  created_at    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- call_logs -> api_keys 外键
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'call_logs_api_key_id_fkey'
      AND table_name = 'call_logs'
  ) THEN
    ALTER TABLE call_logs
      ADD CONSTRAINT call_logs_api_key_id_fkey
      FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE CASCADE;
  END IF;
END$$;

-- call_logs -> users 外键
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'call_logs_user_id_fkey'
      AND table_name = 'call_logs'
  ) THEN
    ALTER TABLE call_logs
      ADD CONSTRAINT call_logs_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS call_logs_api_key_id_created_at_idx ON call_logs (api_key_id, created_at);
CREATE INDEX IF NOT EXISTS call_logs_user_id_created_at_idx ON call_logs (user_id, created_at);


-- ===== 3. orders 表 =====
CREATE TABLE IF NOT EXISTS orders (
  id             TEXT PRIMARY KEY,
  order_no       TEXT NOT NULL UNIQUE,
  user_id        TEXT NOT NULL,
  type           TEXT NOT NULL,
  plan_id        TEXT,
  credits        INTEGER NOT NULL DEFAULT 0,
  amount         DECIMAL(10, 2) NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  payment_id     TEXT,
  paid_at        TIMESTAMP(3),
  created_at     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- orders -> users 外键
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'orders_user_id_fkey'
      AND table_name = 'orders'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT orders_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END$$;

-- orders -> plans 外键（ON DELETE SET NULL）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'orders_plan_id_fkey'
      AND table_name = 'orders'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT orders_plan_id_fkey
      FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE SET NULL;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS orders_user_id_created_at_idx ON orders (user_id, created_at);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status);
CREATE INDEX IF NOT EXISTS orders_plan_id_idx ON orders (plan_id);


-- ===== 4. notifications 表 =====
CREATE TABLE IF NOT EXISTS notifications (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  content    TEXT,
  link       TEXT,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- notifications -> users 外键
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'notifications_user_id_fkey'
      AND table_name = 'notifications'
  ) THEN
    ALTER TABLE notifications
      ADD CONSTRAINT notifications_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS notifications_user_id_is_read_created_at_idx
  ON notifications (user_id, is_read, created_at);


-- ===== 5. action_logs 表 =====
CREATE TABLE IF NOT EXISTS action_logs (
  id             TEXT PRIMARY KEY,
  operator_id    TEXT NOT NULL,
  target_user_id TEXT,
  action         TEXT NOT NULL,
  detail         JSONB,
  ip_address     TEXT,
  created_at     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- action_logs -> users (operator) 外键
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'action_logs_operator_id_fkey'
      AND table_name = 'action_logs'
  ) THEN
    ALTER TABLE action_logs
      ADD CONSTRAINT action_logs_operator_id_fkey
      FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END$$;

-- action_logs -> users (target) 外键
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'action_logs_target_user_id_fkey'
      AND table_name = 'action_logs'
  ) THEN
    ALTER TABLE action_logs
      ADD CONSTRAINT action_logs_target_user_id_fkey
      FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS action_logs_operator_id_created_at_idx ON action_logs (operator_id, created_at);
CREATE INDEX IF NOT EXISTS action_logs_target_user_id_idx ON action_logs (target_user_id);

-- 验证
\echo '✓ Phase 4 表补齐完成'
