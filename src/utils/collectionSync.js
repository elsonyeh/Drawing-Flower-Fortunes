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

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!error && data) return // 已存在

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
  } else {
    console.log(`已同步 ${rows.length} 筆本地蒐集到雲端`)
  }
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
