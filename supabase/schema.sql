-- =============================================
-- 埕花 (Cheng Flowers) - Supabase 資料庫 Schema
-- 在 Supabase Dashboard > SQL Editor 執行此檔案
-- =============================================

-- 1. 用戶資料表（擴充 auth.users）
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url   TEXT,
  provider     TEXT,  -- 'google' | 'line'
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 花朵蒐集表
CREATE TABLE IF NOT EXISTS collections (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  flower_id    INTEGER NOT NULL,
  flower_name  TEXT NOT NULL,
  rarity       TEXT NOT NULL CHECK (rarity IN ('common', 'ssr')),
  collected_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, flower_id)
);

-- =============================================
-- Row Level Security（RLS）
-- =============================================

ALTER TABLE profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- profiles：只能讀/寫/改自己的資料
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- collections：只能讀/寫/刪自己的資料
CREATE POLICY "Users can view own collections"
  ON collections FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own collections"
  ON collections FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections"
  ON collections FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 自動建立 profile（新用戶註冊時觸發）
-- =============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, avatar_url, provider)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_app_meta_data->>'provider'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- Migration: 帳號連結支援
-- 在 Supabase Dashboard > SQL Editor 執行以下語句（已存在則跳過）
-- =============================================

-- 連結的 LINE user ID（例如 "U1234abcd..."）
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linked_line_id TEXT UNIQUE;

-- LINE 用戶反向查詢：檢查此 LINE user ID 是否已被某個帳號連結
-- SECURITY DEFINER 讓此函式以 postgres 身份執行，可跨 user 查詢，不受 RLS 限制
CREATE OR REPLACE FUNCTION is_line_user_linked(p_line_user_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE linked_line_id = p_line_user_id
  );
$$;
