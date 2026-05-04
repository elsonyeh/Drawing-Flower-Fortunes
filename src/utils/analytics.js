import { supabase, isSupabaseEnabled } from '../lib/supabase'

/**
 * 記錄事件到 Supabase events table。
 * 不阻塞主流程，失敗靜默處理。
 *
 * @param {string|null} userId  - Supabase user ID（未登入傳 null）
 * @param {string}      type    - 事件類型，見下方清單
 * @param {object}      payload - 事件相關資料
 *
 * 事件類型：
 *   draw              - 每次抽花 { source: 'tutorial'|'normal'|'exhibition'|'face_scan', flower_id, rarity }
 *   face_scan_complete - 面相掃描完成 { archetype, flower_id, rarity }
 *   tutorial_complete  - 完成引導
 *   tutorial_skip      - 跳過引導 { step }（幾步時跳）
 *   qr_scan           - 掃描 QR Code { zone, work_id }
 *   share             - 分享花語 { flower_id, flower_name }
 */
export const logEvent = async (userId, type, payload = {}) => {
  if (!isSupabaseEnabled) return
  try {
    await supabase.from('events').insert({
      user_id: userId ?? null,
      event_type: type,
      payload,
    })
  } catch (_) {
    // 追蹤失敗不影響主流程
  }
}
