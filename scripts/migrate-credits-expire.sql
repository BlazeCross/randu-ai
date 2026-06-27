-- ============================================================
-- 余额过期提醒 + 关键指标埋点 迁移脚本（17.3 / 18.1）（幂等）
--
-- 1. users 表添加积分过期相关列：
--    credits_expires_at TIMESTAMP（积分过期时间，nullable）
--    credits_expired    BOOLEAN  DEFAULT FALSE（是否已过期）
--    以及用于后台批量查询的复合索引
-- 2. 新增 event_logs 表（用户行为埋点，18.1）
--
-- 已存在的对象会被跳过，可重复执行
-- ============================================================

-- ===== 1. users 表：积分过期列 =====
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits_expires_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits_expired BOOLEAN NOT NULL DEFAULT FALSE;

-- ===== 2. 后台批量过期检查索引（credits_expired + credits_expires_at）=====
-- 用于 scripts/expire-credits.sh 查询 credits_expires_at < now() AND credits_expired = false
CREATE INDEX IF NOT EXISTS users_credits_expired_expires_at_idx
    ON users (credits_expired, credits_expires_at);

-- ============================================================
-- ===== 3. event_logs 表（18.1 关键指标埋点）=====
-- ============================================================
CREATE TABLE IF NOT EXISTS event_logs (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id     TEXT NOT NULL,
    event       TEXT NOT NULL,
    properties   JSONB,
    client_ip   TEXT,
    user_agent  TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT event_logs_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- 按用户 + 时间查询（某用户的行为序列）
CREATE INDEX IF NOT EXISTS event_logs_user_id_created_at_idx
    ON event_logs (user_id, created_at);

-- 按事件 + 时间查询（某类事件的统计 / 留存分析）
CREATE INDEX IF NOT EXISTS event_logs_event_created_at_idx
    ON event_logs (event, created_at);

-- 按时间范围扫描（留存分析按 created_at 范围过滤，避免全表扫描）
CREATE INDEX IF NOT EXISTS event_logs_created_at_idx
    ON event_logs (created_at);

-- call_logs 按时间范围扫描（留存分析复用，避免全表扫描）
CREATE INDEX IF NOT EXISTS call_logs_created_at_idx
    ON call_logs (created_at);

-- 验证
\echo '✓ 迁移完成：users 表（credits_expires_at / credits_expired）+ event_logs 表'
