/**
 * Supabase 蒐集同步工具
 * 將 localStorage 的蒐集資料同步到 Supabase
 */
import { supabase, isSupabaseEnabled } from '../lib/supabase'
import { getCollectedMap } from './fortuneHelper'

/**
 * 確保用戶的 profile 存在（trigger 失敗時的備援）
 */
export const ensureProfile = async (user) => {
  if (!isSupabaseEnabled || !user) return

  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (data) return // 已存在

  // 不存在則建立
  await supabase.from('profiles').upsert({
    id: user.id,
    display_name:
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0],
    avatar_url: user.user_metadata?.avatar_url,
    provider: user.app_metadata?.provider || 'email',
  }, { onConflict: 'id' })
}

/**
 * 儲存花朵到 Supabase（登入時使用）
 */
export const saveFlowerToCloud = async (userId, flower) => {
  if (!isSupabaseEnabled || !userId) return

  const { error } = await supabase
    .from('collections')
    .upsert(
      { user_id: userId, flower_id: flower.id, collected_at: new Date().toISOString() },
      { onConflict: 'user_id,flower_id', ignoreDuplicates: true }
    )

  if (error) console.error('儲存花朵到雲端失敗:', error.message)
}

/**
 * 從 Supabase 取得用戶的蒐集
 */
export const getCloudCollection = async (userId) => {
  if (!isSupabaseEnabled || !userId) return {}

  const { data, error } = await supabase
    .from('collections')
    .select('flower_id, collected_at')
    .eq('user_id', userId)

  if (error) {
    console.error('取得雲端蒐集失敗:', error.message)
    return {}
  }

  const map = {}
  data.forEach(row => { map[row.flower_id] = row.collected_at })
  return map
}

/**
 * 登入後：將本地 localStorage 蒐集同步上雲端
 */
export const syncLocalToCloud = async (userId) => {
  if (!isSupabaseEnabled || !userId) return

  const map = getCollectedMap()
  const ids = Object.keys(map)
  if (ids.length === 0) return

  const rows = ids.map(id => ({
    user_id: userId,
    flower_id: Number(id),
    collected_at: map[id],
  }))

  const { error } = await supabase
    .from('collections')
    .upsert(rows, { onConflict: 'user_id,flower_id', ignoreDuplicates: true })

  if (error) {
    console.error('同步本地資料到雲端失敗:', error.message)
  }
}

/**
 * 將 LINE user ID 連結到現有帳號的 profile（Google 連結 LINE 時使用）
 */
export const linkLineToProfile = async (userId, lineUserId) => {
  if (!isSupabaseEnabled || !userId || !lineUserId) return

  const { error } = await supabase
    .from('profiles')
    .update({ linked_line_id: lineUserId })
    .eq('id', userId)

  if (error) {
    console.error('[linkLineToProfile] DB 更新失敗:', error.message)
    return
  }

  // 同步更新 auth user metadata，使前端 user 物件立即反映連結狀態
  await supabase.auth.updateUser({ data: { line_user_id: lineUserId } })

  // 快取到 localStorage，讓 LINE 用戶下次登入時也能立即看到已連結狀態
  localStorage.setItem(`line_linked_${lineUserId}`, '1')
}

/**
 * 從雲端載入蒐集並覆寫 localStorage（登入時合併）
 */
export const loadCloudToLocal = async (userId) => {
  if (!isSupabaseEnabled || !userId) return

  const cloudMap = await getCloudCollection(userId)
  if (Object.keys(cloudMap).length === 0) return

  // 合併：雲端優先，本地補充
  const localMap = getCollectedMap()
  const merged = { ...cloudMap, ...localMap }
  localStorage.setItem('collectedFlowers', JSON.stringify(merged))
}
