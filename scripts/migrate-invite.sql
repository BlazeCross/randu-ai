-- ============================================================
-- 邀请裂变功能迁移脚本（13.4）（幂等）
-- 为 users 表添加邀请码、邀请人、邀请计数、邀请奖励积分等列与索引
-- 已存在的对象会被跳过，可重复执行
-- ============================================================

-- ===== 1. users 表补齐邀请相关列 =====
ALTER TABLE users ADD COLUMN IF NOT EXISTS invite_code TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS inviter_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS invite_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS invite_reward INTEGER NOT NULL DEFAULT 0;

-- ===== 2. 唯一约束（invite_code）=====
-- DO 块判断约束是否存在，避免重复创建
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_invite_code_key'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_invite_code_key UNIQUE (invite_code);
    END IF;
END $$;

-- ===== 3. 邀请人索引（用于按邀请人查询被邀请人列表）=====
CREATE INDEX IF NOT EXISTS users_inviter_id_idx ON users (inviter_id);

-- ===== 4. 外键约束：inviter_id → users.id，ON DELETE SET NULL =====
-- 幂等：先检查约束是否存在再创建
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_inviter_id_fkey'
    ) THEN
        ALTER TABLE users
            ADD CONSTRAINT users_inviter_id_fkey
            FOREIGN KEY (inviter_id) REFERENCES users (id)
            ON DELETE SET NULL;
    END IF;
END $$;

-- 验证
\echo '✓ 邀请裂变迁移完成（users 表：invite_code / inviter_id / invite_count / invite_reward）'
