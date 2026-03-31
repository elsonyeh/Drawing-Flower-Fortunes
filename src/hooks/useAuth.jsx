import { useState, useEffect, createContext, useContext } from 'react'
import { supabase, isSupabaseEnabled } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    if (!isSupabaseEnabled) return
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
    const clientId = import.meta.env.VITE_LINE_CLIENT_ID
    const redirectUri = encodeURIComponent(`${window.location.origin}/auth/callback`)
    const state = crypto.randomUUID()
    sessionStorage.setItem('line_oauth_state', state)
    window.location.href = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=profile%20openid%20email`
  }

  const signOut = async () => {
    if (!isSupabaseEnabled) return
    const { error } = await supabase.auth.signOut()
    if (error) console.error('登出失敗:', error.message)
    else localStorage.removeItem('collectedFlowers')
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithLine, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
