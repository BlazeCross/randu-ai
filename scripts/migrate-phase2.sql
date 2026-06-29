-- ============================================================
-- Phase 2 schema 同步脚本（幂等）
-- 新增两张表：carousel_slides（首页轮播图） + tutorials（图文/视频教程）
-- 已存在的对象会被跳过，可重复执行
-- ============================================================

BEGIN;

-- ===== 1. 新建 carousel_slides 表 =====
CREATE TABLE IF NOT EXISTS carousel_slides (
  id          VARCHAR PRIMARY KEY,
  title       VARCHAR NOT NULL,
  description VARCHAR,
  image       VARCHAR NOT NULL,
  link        VARCHAR,
  badge       VARCHAR,
  sort_order  INT DEFAULT 0,
  published   BOOLEAN DEFAULT false,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS carousel_slides_published_sort_order_idx
  ON carousel_slides (published, sort_order);

-- 创建 carousel_slides.updated_at 触发器（自动更新）
DROP FUNCTION IF EXISTS update_carousel_slides_updated_at();
CREATE OR REPLACE FUNCTION update_carousel_slides_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS carousel_slides_updated_at ON carousel_slides;
CREATE TRIGGER carousel_slides_updated_at
  BEFORE UPDATE ON carousel_slides
  FOR EACH ROW
  EXECUTE FUNCTION update_carousel_slides_updated_at();

-- ===== 2. 新建 tutorials 表 =====
CREATE TABLE IF NOT EXISTS tutorials (
  id           VARCHAR PRIMARY KEY,
  type         VARCHAR NOT NULL,
  title        VARCHAR NOT NULL,
  category     VARCHAR,
  cover        VARCHAR,
  content      VARCHAR,
  video_url    VARCHAR,
  excerpt      VARCHAR,
  sort_order   INT DEFAULT 0,
  published    BOOLEAN DEFAULT false,
  study_count  INT DEFAULT 0,
  view_count   INT DEFAULT 0,
  access_level VARCHAR DEFAULT 'free',
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tutorials_published_sort_order_idx
  ON tutorials (published, sort_order);
CREATE INDEX IF NOT EXISTS tutorials_type_idx
  ON tutorials (type);

-- 创建 tutorials.updated_at 触发器（自动更新）
DROP FUNCTION IF EXISTS update_tutorials_updated_at();
CREATE OR REPLACE FUNCTION update_tutorials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tutorials_updated_at ON tutorials;
CREATE TRIGGER tutorials_updated_at
  BEFORE UPDATE ON tutorials
  FOR EACH ROW
  EXECUTE FUNCTION update_tutorials_updated_at();

COMMIT;

-- ===== 验证：列出新建的表 =====
\echo '✓ Phase 2 表创建完成'
\dt carousel_slides
\dt tutorials
