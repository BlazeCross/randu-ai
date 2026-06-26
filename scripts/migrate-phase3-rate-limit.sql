-- ============================================================
-- Phase 3.4 schema 同步脚本（幂等）
-- 为 api_keys 表添加频率限制字段：
--   qps_limit       单 Key 每秒最大请求数（默认 5）
--   daily_limit     单 Key 每日最大调用次数（默认 1000）
--   daily_used      今日已调用次数（每日 UTC 0 点重置）
--   daily_reset_at  下次重置时间
-- 已存在的对象会被跳过，可重复执行
-- ============================================================

BEGIN;

-- ===== 1. 添加频率限制字段（IF NOT EXISTS 兼容写法） =====
DO $$
BEGIN
  -- qps_limit
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_keys' AND column_name = 'qps_limit'
  ) THEN
    ALTER TABLE api_keys ADD COLUMN qps_limit INTEGER NOT NULL DEFAULT 5;
  END IF;

  -- daily_limit
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_keys' AND column_name = 'daily_limit'
  ) THEN
    ALTER TABLE api_keys ADD COLUMN daily_limit INTEGER NOT NULL DEFAULT 1000;
  END IF;

  -- daily_used
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_keys' AND column_name = 'daily_used'
  ) THEN
    ALTER TABLE api_keys ADD COLUMN daily_used INTEGER NOT NULL DEFAULT 0;
  END IF;

  -- daily_reset_at（设为当前时间，触发后续首次重置逻辑）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_keys' AND column_name = 'daily_reset_at'
  ) THEN
    ALTER TABLE api_keys ADD COLUMN daily_reset_at TIMESTAMP NOT NULL DEFAULT NOW();
  END IF;
END$$;

COMMIT;

-- 验证
\echo '✓ api_keys 频率限制字段已就绪（qps_limit / daily_limit / daily_used / daily_reset_at）'
