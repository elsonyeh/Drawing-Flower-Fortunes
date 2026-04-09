import { useState, useEffect, createContext, useContext } from 'react'
import { supabase, isSupabaseEnabled } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isNewUser, setIsNewUser] = useState(false)
  const [linkedLineId, setLinkedLineId] = useState(null)

  useEffect(() => {
    if (!isSupabaseEnabled) {
      setLoading(false)
      return
    }

    // 取得目前登入狀態
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // 監聽登入/登出事件
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)

      if (event === 'SIGNED_UP') {
        // Google OAuth 新帳號
        setIsNewUser(true)
      } else if (event === 'SIGNED_IN') {
        // LINE 新帳號沒有 SIGNED_UP 事件，改用 created_at 判斷（2 分鐘內）
        const createdAt = session?.user?.created_at
        const isRecent = createdAt
          ? Date.now() - new Date(createdAt).getTime() < 2 * 60 * 1000
          : false
        setIsNewUser(isRecent)
      } else {
        setIsNewUser(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // 每次 user 變動時，從 profiles 取得連結狀態
  useEffect(() => {
    if (!user || !isSupabaseEnabled) {
      setLinkedLineId(null)
      return
    }

    const isLineAccount = user.email?.endsWith('@line.user')

    if (isLineAccount) {
      const lineUserId = user.user_metadata?.line_user_id
        || user.email?.match(/^line_(.+)@line\.user$/)?.[1]
        || ''
      console.log('[useAuth] LINE 用戶連結狀態檢查, lineUserId:', lineUserId)

      if (!lineUserId) {
        setLinkedLineId(null)
        return
      }

      // 先查 localStorage（同裝置 fallback）
      const localLinked = localStorage.getItem(`line_linked_${lineUserId}`) === '1'
      console.log('[useAuth] localStorage line_linked:', localLinked)
      if (localLinked) {
        setLinkedLineId(lineUserId)
        return
      }

      // 再嘗試 RPC（跨裝置）
      supabase
        .rpc('is_line_user_linked', { p_line_user_id: lineUserId })
        .then(({ data, error }) => {
          console.log('[useAuth] RPC is_line_user_linked result:', data, 'error:', error?.message)
          if (error) return
          if (data) {
            localStorage.setItem(`line_linked_${lineUserId}`, '1')
            setLinkedLineId(lineUserId)
          }
        })
    } else {
      // Google 用戶：直接查自己的 profile
      supabase
        .from('profiles')
        .select('linked_line_id')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data }) => setLinkedLineId(data?.linked_line_id ?? null))
    }
  }, [user])

  const signInWithGoogle = async () => {
    if (!isSupabaseEnabled) return
    if (user) {
      // 連結模式：從 metadata 或 email 取得 LINE user ID
      const lineUserId = user.user_metadata?.line_user_id
        || user.email?.match(/^line_(.+)@line\.user$/)?.[1]
        || ''
      console.log('[signInWithGoogle] 連結模式 userId:', user.id, 'lineUserId:', lineUserId)
      localStorage.setItem('pending_link_user_id', user.id)
      localStorage.setItem('pending_link_line_user_id', lineUserId)
      localStorage.setItem('pending_link_ts', Date.now().toString())
    } else {
      // 真正的登入：記錄登入方式
      localStorage.setItem('last_login_provider', 'google')
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })
    if (error) console.error('Google 登入失敗:', error.message)
  }

  const signInWithLine = () => {
    if (!isSupabaseEnabled) return
    if (user) {
      // 連結模式：不更新 last_login_provider，保留原始登入方式
      localStorage.setItem('line_link_for_user_id', user.id)
    } else {
      // 真正的登入：記錄登入方式
      localStorage.setItem('last_login_provider', 'line')
    }
    const clientId = import.meta.env.VITE_LINE_CLIENT_ID
    const redirectUri = encodeURIComponent(`${window.location.origin}/auth/callback`)
    const state = crypto.randomUUID()
    localStorage.setItem('line_oauth_state', state)
    window.location.href = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=profile%20openid%20email`
  }

  const signOut = async () => {
    if (!isSupabaseEnabled) return
    const { error } = await supabase.auth.signOut()
    if (error) console.error('登出失敗:', error.message)
    else localStorage.removeItem('collectedFlowers')
  }

  return (
    <AuthContext.Provider value={{ user, loading, isNewUser, linkedLineId, signInWithGoogle, signInWithLine, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
