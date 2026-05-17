/**
 * Supabase 蒐集同步工具
 * 將 localStorage 的蒐集資料同步到 Supabase
 */
import { supabase, isSupabaseEnabled } from '../lib/supabase'
import { getCollectedMap } from './fortuneHelper'
import { getExhibitionState } from './exhibitionHelper'
import { ARTWORKS } from './exhibitionConstants'

// 集滿條件：全部 15 件裝置藝術皆掃過
const ALL_ARTWORK_IDS = ARTWORKS.map(a => a.id) // ['A1'…'C5']

export const isCompletionMet = () => {
  const visited = getExhibitionState()?.visited ?? []
  return ALL_ARTWORK_IDS.every(id => visited.includes(id))
}

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
    email: user.email,
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
export const saveFlowerToCloud = async (userId, flower, source = 'normal') => {
  if (!isSupabaseEnabled || !userId) return

  const { error } = await supabase
    .from('collections')
    .upsert(
      { user_id: userId, flower_id: flower.id, collected_at: new Date().toISOString(), source },
      { onConflict: 'user_id,flower_id,source', ignoreDuplicates: true }
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
    .select('flower_id, collected_at, source')
    .eq('user_id', userId)

  if (error) {
    console.error('取得雲端蒐集失敗:', error.message)
    return {}
  }

  const map = {}
  data.forEach(row => {
    const source = row.source || 'normal'
    map[`${row.flower_id}:${source}`] = { collectedAt: row.collected_at }
  })
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

  const rows = ids.map(id => {
    const [flowerId, source] = id.split(':')
    return {
      user_id: userId,
      flower_id: Number(flowerId),
      collected_at: map[id].collectedAt,
      source: source || 'normal',
    }
  })

  const { error } = await supabase
    .from('collections')
    .upsert(rows, { onConflict: 'user_id,flower_id,source', ignoreDuplicates: true })

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

  // 合併：key 格式 "${flowerId}:${source}"，雲端有但本地沒有的直接補入
  const localMap = getCollectedMap()
  const merged = { ...localMap }
  Object.entries(cloudMap).forEach(([key, { collectedAt }]) => {
    if (!(key in merged)) merged[key] = { collectedAt }
  })
  localStorage.setItem('collectedFlowers_v2', JSON.stringify(merged))
}

/**
 * 判斷是否需要顯示完成動畫
 * 回傳 { showAnimation: true, needsEmail: boolean } 或 null
 * - showAnimation: true 代表本裝置尚未看過動畫，應觸發
 * - needsEmail: true 代表用戶無 email（僅 LINE 登入），需在動畫後補填
 */
/**
 * 未登入用戶的集滿判斷（不查雲端，只看 localStorage）
 * 條件成立且本裝置未看過動畫 → 回傳 { showAnimation: true, needsEmail: true }
 */
export const checkAnonymousCompletion = () => {
  if (!isCompletionMet()) return null
  if (localStorage.getItem('chenghua_completion_seen')) return null
  if (localStorage.getItem('chenghua_completion_pending')) return null
  localStorage.setItem('chenghua_completion_pending', '1')
  return { showAnimation: true }
}

export const checkAndNotifyCompletion = async (user) => {
  if (!isSupabaseEnabled || !user) return null

  if (!isCompletionMet()) return null

  // 本裝置已看過動畫，不重複觸發
  if (localStorage.getItem('chenghua_completion_seen')) return null

  // 雲端已標記通知（其他裝置觸發過），直接同步本地旗標
  const { data: profile } = await supabase
    .from('profiles')
    .select('completion_notified')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.completion_notified) {
    localStorage.setItem('chenghua_completion_seen', '1')
    return null
  }

  return { showAnimation: true, needsEmail: !user.email }
}

/**
 * 實際發送恭賀郵件並標記完成
 * 由 CollectionComplete 元件在動畫結束後呼叫
 * - emailOverride: LINE 用戶手動填寫的 email
 * 回傳 { prizeClaimed: boolean, rank: number }
 */
export const sendCompletionEmail = async (user, emailOverride = null) => {
  if (!isSupabaseEnabled) return { prizeClaimed: false, rank: 0 }

  const email = emailOverride || user?.email
  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    (email ? email.split('@')[0] : '花語旅人')

  // 計算已獲獎人數，超過 10 人不寄信
  const { count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('completion_notified', true)

  const currentCount = count ?? 0
  const prizeClaimed = currentCount < 10
  const rank = currentCount + 1

  if (email && prizeClaimed) {
    try {
      const res = await supabase.functions.invoke('send-completion-email', {
        body: { email, displayName, prizeRank: rank },
      })
      if (res.error) throw res.error
    } catch (e) {
      console.error('[sendCompletionEmail] 寄信失敗:', e)
    }
  }

  // 標記完成（登入用戶寫雲端；匿名只靠 localStorage 防重複）
  if (user) {
    await supabase
      .from('profiles')
      .update({ completion_notified: true })
      .eq('id', user.id)
  }

  localStorage.setItem('chenghua_completion_seen', '1')
  return { prizeClaimed, rank }
}
