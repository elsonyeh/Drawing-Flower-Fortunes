import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function LineCallback() {
  const [status, setStatus] = useState('登入中...')
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')
    const savedState = sessionStorage.getItem('line_oauth_state')

    console.log('[LINE Callback] code:', code)
    console.log('[LINE Callback] state from URL:', state)
    console.log('[LINE Callback] state from sessionStorage:', savedState)

    if (!code) {
      setStatus('登入失敗：缺少授權碼')
      setTimeout(() => { window.location.href = '/' }, 2000)
      return
    }
    if (state !== savedState) {
      console.error('[LINE Callback] state 不符合！URL state:', state, '| saved:', savedState)
      setStatus('登入失敗：state 驗證錯誤')
      setTimeout(() => { window.location.href = '/' }, 2000)
      return
    }

    sessionStorage.removeItem('line_oauth_state')

    const redirectUri = `${window.location.origin}/auth/callback`

    // 若是連結模式，取出並清除連結意圖
    const linkUserId = sessionStorage.getItem('line_link_for_user_id') || null
    if (linkUserId) sessionStorage.removeItem('line_link_for_user_id')

    console.log('[LINE Callback] 呼叫 Edge Function，redirectUri:', redirectUri, '連結模式:', !!linkUserId)

    supabase.functions.invoke('line-auth', {
      body: { code, redirectUri, linkUserId },
    }).then(async ({ data, error }) => {
      // 若有 HTTP 錯誤，嘗試讀取 response body
      if (error) {
        let detail = error.message
        try {
          const body = await error.context?.json()
          detail = body?.error || error.message
        } catch {}
        console.error('[LINE Callback] Edge Function 錯誤:', detail)
        setStatus('登入失敗：' + detail)
        setTimeout(() => { window.location.href = '/' }, 3000)
        return
      }

      console.log('[LINE Callback] Edge Function 回傳:', data)

      if (!data?.action_link) {
        setStatus('登入失敗：' + (data?.error || '未收到 action_link'))
        setTimeout(() => { window.location.href = '/' }, 3000)
        return
      }

      // 讓 Supabase 自己處理 session，完成後自動跳回首頁
      window.location.href = data.action_link
    }).catch(err => {
      setStatus('登入失敗：' + err.message)
      setTimeout(() => { window.location.href = '/' }, 2000)
    })
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-night-900 to-night-700 text-white">
      <div className="text-center">
        <div className="text-4xl mb-4">🌸</div>
        <p className="text-lg">{status}</p>
      </div>
    </div>
  )
}
