import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth.jsx'
import { isSupabaseEnabled } from '../lib/supabase'

export default function AuthModal({ isOpen, onClose }) {
  const { user, signInWithGoogle, signInWithLine, signOut } = useAuth()

  if (!isSupabaseEnabled) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none px-6"
          >
            <div className="bg-night-800 border border-white/10 rounded-3xl p-8 w-full max-w-sm pointer-events-auto shadow-2xl">
              {user ? (
                /* 已登入：顯示用戶資訊 + 登出 */
                <>
                  <div className="text-center mb-8">
                    {user.user_metadata?.avatar_url && (
                      <img src={user.user_metadata.avatar_url} alt="" className="w-16 h-16 rounded-full mx-auto mb-3 border-2 border-white/20" />
                    )}
                    <h2 className="text-xl font-bold text-white">
                      {user.user_metadata?.full_name || user.user_metadata?.name || '用戶'}
                    </h2>
                    <p className="text-green-400 text-xs mt-2">✓ 花語蒐集已同步到雲端</p>
                  </div>
                  <button
                    onClick={() => { signOut(); onClose() }}
                    className="w-full flex items-center justify-center gap-2 bg-white/10 text-white/70 font-medium py-3 px-6 rounded-2xl hover:bg-white/20 active:scale-95 transition-all border border-white/10"
                  >
                    登出
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full mt-3 text-white/40 text-sm py-2 hover:text-white/70 transition-colors"
                  >
                    關閉
                  </button>
                </>
              ) : (
                /* 未登入：顯示登入選項 */
                <>
                  {/* 標題 */}
                  <div className="text-center mb-8">
                    <div className="text-4xl mb-3">🌸</div>
                    <h2 className="text-xl font-bold text-white">登入帳戶</h2>
                    <p className="text-white/50 text-sm mt-2">登入後花語蒐集永久保存</p>
                  </div>

                  {/* 登入按鈕 */}
                  <div className="space-y-3">
                    <button
                      onClick={() => { signInWithGoogle(); onClose() }}
                      className="w-full flex items-center justify-center bg-white text-gray-800 font-medium py-3 px-6 rounded-2xl hover:bg-gray-100 active:scale-95 transition-all"
                    >
                      使用 Google 登入
                    </button>

                    <button
                      onClick={() => { signInWithLine(); onClose() }}
                      className="w-full flex items-center justify-center bg-[#06C755] text-white font-medium py-3 px-6 rounded-2xl hover:bg-[#05b34d] active:scale-95 transition-all"
                    >
                      使用 LINE 登入
                    </button>
                  </div>

                  {/* 取消 */}
                  <button
                    onClick={onClose}
                    className="w-full mt-4 text-white/40 text-sm py-2 hover:text-white/70 transition-colors"
                  >
                    稍後再說
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
