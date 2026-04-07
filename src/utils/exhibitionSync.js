/**
 * 展覽進度雲端同步
 * 三層保護：localStorage → Cookie → Supabase
 */
import { supabase, isSupabaseEnabled } from '../lib/supabase'

const VISITOR_ID_KEY = 'exhibitionVisitorId'
const COOKIE_NAME = 'exVisitorId'

// ── Visitor ID（訪客識別碼）──────────────────────────────

const getCookieId = () => {
  const match = document.cookie.split(';').find(c => c.trim().startsWith(COOKIE_NAME + '='))
  return match ? match.split('=')[1].trim() : null
}

const setCookie = (id) => {
  // 30 天有效，SameSite=Lax 相容 iOS Safari
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString()
  document.cookie = `${COOKIE_NAME}=${id}; expires=${expires}; path=/; SameSite=Lax`
}

/**
 * 取得或建立訪客 ID
 * 優先順序：localStorage → Cookie → 新建
 * 每次都同時寫入兩層，確保互相備援
 */
export const getOrCreateVisitorId = () => {
  let id = localStorage.getItem(VISITOR_ID_KEY)

  if (!id) {
    // localStorage 消失了，嘗試從 Cookie 還原
    id = getCookieId()
    if (id) {
      localStorage.setItem(VISITOR_ID_KEY, id)
    }
  }

  if (!id) {
    // 全新訪客
    id = crypto.randomUUID()
    localStorage.setItem(VISITOR_ID_KEY, id)
  }

  // 每次都更新 Cookie（延長有效期）
  setCookie(id)
  return id
}

// ── 雲端同步 ────────────────────────────────────────────

/**
 * 將展覽狀態同步到 Supabase（fire-and-forget）
 */
export const syncExhibitionToCloud = async (state) => {
  if (!isSupabaseEnabled) return
  const visitorId = getOrCreateVisitorId()

  const { error } = await supabase
    .from('exhibition_sessions')
    .upsert({
      visitor_id: visitorId,
      visited: state.visited,
      tickets: state.tickets,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'visitor_id' })

  if (error) console.error('[exhibitionSync] 同步失敗:', error.message)
}

/**
 * 從 Supabase 載入展覽進度（localStorage 消失時還原用）
 * 回傳 null 表示雲端無資料
 */
export const loadExhibitionFromCloud = async () => {
  if (!isSupabaseEnabled) return null
  const visitorId = getOrCreateVisitorId()

  const { data, error } = await supabase
    .from('exhibition_sessions')
    .select('visited, tickets')
    .eq('visitor_id', visitorId)
    .maybeSingle()

  if (error) {
    console.error('[exhibitionSync] 載入失敗:', error.message)
    return null
  }
  if (!data) return null

  return {
    visited: data.visited || [],
    tickets: data.tickets ?? 1,
    initialized: true,
  }
}
