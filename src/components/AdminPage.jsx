import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react'
import { unlockAllFlowers, clearAllFlowers, getCollectionStats } from '../utils/fortuneHelper'
import { getExhibitionState, clearWorkVisit, resetExhibitionState } from '../utils/exhibitionHelper'
import { fetchGlobalMode, pushGlobalMode } from '../utils/exhibitionSync'
import { ZONE_THEME, ARTWORKS } from '../utils/exhibitionConstants'
import { supabase, isSupabaseEnabled } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
const KPIDashboard = lazy(() => import('./KPIDashboard'))
const AuthModal = lazy(() => import('./AuthModal'))

const ZONE_COLOR = Object.fromEntries(Object.entries(ZONE_THEME).map(([k, v]) => [k, v.color]))

function AdminPage({ onSimulateQRScan, onDirectDraw, onTestCompletion }) {
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(null) // null=checking, true/false
  const [showAdminAuth, setShowAdminAuth] = useState(false)

  const [stats, setStats] = useState(getCollectionStats())
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState('kpi')
  const [baseUrl, setBaseUrl] = useState(window.location.origin)
  const [globalMode, setGlobalMode] = useState(null)
  const [modeLoading, setModeLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const qrCanvasRefs = useRef({})

  const [allUsers, setAllUsers] = useState([])
  const [adminIds, setAdminIds] = useState(new Set())
  const [usersLoading, setUsersLoading] = useState(false)
  const [userMsg, setUserMsg] = useState('')

  // 驗證管理員身份
  useEffect(() => {
    if (!isSupabaseEnabled || !user) { setIsAdmin(false); return }
    supabase.from('admins').select('user_id').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => setIsAdmin(!!data))
  }, [user])

  useEffect(() => {
    if (!isAdmin) return
    fetchGlobalMode().then(setGlobalMode)
  }, [isAdmin])

  // 切換到用戶管理 tab 時載入資料
  useEffect(() => {
    if (activeTab !== 'users' || !isAdmin) return
    loadUsers()
  }, [activeTab, isAdmin])

  const loadUsers = async () => {
    setUsersLoading(true)
    const [{ data: profiles }, { data: admins }] = await Promise.all([
      supabase.from('profiles').select('id, email, display_name, created_at')
        .order('created_at', { ascending: false }).limit(200),
      supabase.from('admins').select('user_id'),
    ])
    setAllUsers(profiles || [])
    setAdminIds(new Set((admins || []).map(a => a.user_id)))
    setUsersLoading(false)
  }

  const handleToggleAdmin = async (targetUser) => {
    const name = targetUser.display_name || targetUser.email || targetUser.id.slice(0, 8) + '…'
    if (adminIds.has(targetUser.id)) {
      if (targetUser.id === user.id) {
        setUserMsg('無法移除自己的管理員權限')
        setTimeout(() => setUserMsg(''), 2500)
        return
      }
      const { error } = await supabase.from('admins').delete().eq('user_id', targetUser.id)
      if (!error) {
        setAdminIds(prev => { const s = new Set(prev); s.delete(targetUser.id); return s })
        setUserMsg(`已移除 ${name} 的管理員權限`)
      }
    } else {
      const { error } = await supabase.from('admins').insert({ user_id: targetUser.id })
      if (!error) {
        setAdminIds(prev => new Set([...prev, targetUser.id]))
        setUserMsg(`已設 ${name} 為管理員`)
      }
    }
    setTimeout(() => setUserMsg(''), 3000)
  }

  const handleUnlockAll = () => {
    unlockAllFlowers()
    setStats(getCollectionStats())
    setMessage('All flowers unlocked!')
    setTimeout(() => setMessage(''), 2000)
  }

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all collected flowers?')) {
      clearAllFlowers()
      setStats(getCollectionStats())
      setMessage('Collection cleared!')
      setTimeout(() => setMessage(''), 2000)
    }
  }

  const handleSwitchGlobalMode = async (targetMode) => {
    const label = targetMode === 'exhibition' ? '展覽模式' : '一般模式'
    const warn = targetMode === 'normal'
      ? '確定切換為一般模式？所有用戶將離開展覽限制。'
      : '確定切換為展覽模式？所有用戶將自動進入展覽模式。'
    if (!window.confirm(warn)) return
    setModeLoading(true)
    const ok = await pushGlobalMode(targetMode)
    if (ok) {
      setGlobalMode(targetMode)
      setMessage(`已切換為${label}，所有用戶即時生效`)
    } else {
      setMessage('切換失敗，請確認 Supabase 連線')
    }
    setModeLoading(false)
    setTimeout(() => setMessage(''), 3000)
  }

  const handleExportAll = async () => {
    setExporting(true)
    for (const art of ARTWORKS) {
      const canvas = qrCanvasRefs.current[art.id]
      if (!canvas) continue
      const link = document.createElement('a')
      link.download = `${art.name}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      await new Promise(r => setTimeout(r, 150))
    }
    setExporting(false)
  }

  const getQRUrl = (art) =>
    `${baseUrl}/?zone=${art.zone}&work=${art.id}&name=${encodeURIComponent(art.name)}`

  const exState = getExhibitionState()

  // ── 驗證中 ──
  if (isAdmin === null) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="min-h-screen flex items-center justify-center">
        <p className="text-white/40 text-sm animate-pulse">驗證身份中…</p>
      </motion.div>
    )
  }

  // ── 未登入 / 無權限 ──
  if (!user || !isAdmin) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="min-h-screen flex items-center justify-center px-8">
        <div className="text-center space-y-5 max-w-xs w-full">
          <div>
            <h1 className="text-xl font-bold mb-1">Admin Panel</h1>
            <p className="text-xs text-white/25">elsontest</p>
          </div>
          {!user ? (
            <>
              <p className="text-white/50 text-sm">請以管理員帳號登入</p>
              <button
                onClick={() => setShowAdminAuth(true)}
                className="w-full py-3 rounded-xl font-semibold text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #F27E93, #F2BE5C)' }}
              >
                登入
              </button>
            </>
          ) : (
            <p className="text-sm" style={{ color: 'rgba(252,165,165,0.75)' }}>
              此帳號（{user.email}）無管理員權限
            </p>
          )}
        </div>
        <Suspense fallback={null}>
          <AuthModal isOpen={showAdminAuth} onClose={() => setShowAdminAuth(false)} />
        </Suspense>
      </motion.div>
    )
  }

  // ── 管理員主界面 ──
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-b from-night-900 via-night-800 to-night-700 text-white"
    >
      <div className="max-w-4xl mx-auto px-4 pt-8 pb-16">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <span className="text-xs text-white/30 truncate max-w-[160px]">{user.email}</span>
        </div>
        <p className="text-gray-400 text-center text-sm mb-6">elsontest</p>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { id: 'kpi',        label: '📊 KPI' },
            { id: 'users',      label: '👥 管理員' },
            { id: 'stats',      label: '蒐集數據' },
            { id: 'qrcodes',    label: 'QR Code' },
            { id: 'exhibition', label: '展覽狀態' },
            { id: 'test',       label: '🧪 測試' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all min-h-[44px] ${
                activeTab === tab.id
                  ? 'bg-white/20 text-white'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── KPI Tab ── */}
        {activeTab === 'kpi' && (
          <Suspense fallback={<p className="text-center py-8 text-white/40 text-sm animate-pulse">載入中…</p>}>
            <KPIDashboard />
          </Suspense>
        )}

        {/* ── Users Management Tab ── */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-sm font-bold mb-1">管理員設定</p>
              <p className="text-xs text-white/40">從已註冊用戶中選擇並授予管理員權限</p>
            </div>

            {userMsg && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-lg p-3 text-center text-sm"
                style={{ background: 'rgba(110,231,183,0.12)', color: '#6ee7b7', border: '1px solid rgba(110,231,183,0.2)' }}>
                {userMsg}
              </motion.div>
            )}

            {usersLoading ? (
              <p className="text-center py-8 text-white/40 text-sm animate-pulse">載入用戶中…</p>
            ) : (
              <>
                <div className="space-y-2">
                  {allUsers.map(u => {
                    const thisIsAdmin = adminIds.has(u.id)
                    const isSelf = u.id === user.id
                    const label = u.display_name || u.email || u.id.slice(0, 8) + '…'
                    return (
                      <div
                        key={u.id}
                        className="flex items-center gap-3 rounded-xl px-4 py-3"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: `1px solid ${thisIsAdmin ? 'rgba(242,190,92,0.28)' : 'rgba(255,255,255,0.07)'}`,
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {label}
                            {isSelf && <span className="ml-1.5 text-xs text-white/25">（你）</span>}
                          </p>
                          {u.email && u.display_name && (
                            <p className="text-xs truncate mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                              {u.email}
                            </p>
                          )}
                        </div>

                        {thisIsAdmin && (
                          <span
                            className="shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold"
                            style={{ background: 'rgba(242,190,92,0.13)', color: '#F2BE5C', border: '1px solid rgba(242,190,92,0.35)' }}
                          >
                            管理員
                          </span>
                        )}

                        <button
                          onClick={() => handleToggleAdmin(u)}
                          disabled={isSelf && thisIsAdmin}
                          className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all min-h-[32px] disabled:opacity-30"
                          style={thisIsAdmin
                            ? { background: 'rgba(239,68,68,0.12)', color: 'rgba(252,165,165,0.8)', border: '1px solid rgba(239,68,68,0.28)' }
                            : { background: 'rgba(110,231,183,0.10)', color: '#6ee7b7', border: '1px solid rgba(110,231,183,0.28)' }
                          }
                        >
                          {thisIsAdmin ? '移除' : '設為管理員'}
                        </button>
                      </div>
                    )
                  })}

                  {allUsers.length === 0 && (
                    <p className="text-center py-8 text-white/30 text-sm">尚無用戶資料</p>
                  )}
                </div>

                <div className="text-right">
                  <button onClick={loadUsers} className="text-xs text-white/25 hover:text-white/50 transition-colors">
                    ↻ 重新整理
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Stats Tab ── */}
        {activeTab === 'stats' && (
          <div className="space-y-4">
            <div className="bg-white/10 rounded-xl p-4">
              <h2 className="text-lg font-semibold mb-3">Collection Stats</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-400">Total:</span><span className="ml-2">{stats.total} / {stats.totalCards}</span></div>
                <div><span className="text-gray-400">Progress:</span><span className="ml-2">{stats.percentage}%</span></div>
                <div><span className="text-gray-400">SSR:</span><span className="ml-2 text-yellow-400">{stats.ssr} / {stats.totalSSR}</span></div>
                <div><span className="text-gray-400">Common:</span><span className="ml-2">{stats.common} / {stats.totalCommon}</span></div>
              </div>
            </div>

            {message && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-green-500/20 text-green-300 rounded-lg p-3 text-center">
                {message}
              </motion.div>
            )}

            <div className="space-y-3">
              <button onClick={handleUnlockAll}
                className="w-full py-3 px-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all">
                Unlock All Flowers
              </button>
              <button onClick={handleClearAll}
                className="w-full py-3 px-4 bg-red-500/20 border border-red-500/50 rounded-xl font-semibold text-red-300 hover:bg-red-500/30 transition-all">
                Clear Collection
              </button>
              <button onClick={() => window.location.href = '/'}
                className="w-full py-3 px-4 bg-white/10 rounded-xl font-semibold text-white hover:bg-white/20 transition-all">
                Go to Main Page
              </button>
            </div>
          </div>
        )}

        {/* ── QR Codes Tab ── */}
        {activeTab === 'qrcodes' && (
          <div>
            <div className="bg-white/5 rounded-xl p-4 mb-5">
              <label htmlFor="base-url-input" className="text-white/60 text-xs mb-1 block">App 網址（用於生成 QR Code）</label>
              <input
                id="base-url-input"
                type="text"
                value={baseUrl}
                onChange={e => setBaseUrl(e.target.value)}
                aria-label="App 網址"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-white/40 min-h-[44px]"
              />
            </div>

            <div className="sr-only" aria-hidden="true">
              {ARTWORKS.map(art => (
                <QRCodeCanvas
                  key={art.id}
                  ref={el => { qrCanvasRefs.current[art.id] = el }}
                  value={getQRUrl(art)}
                  size={600}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="M"
                />
              ))}
            </div>

            <button
              onClick={handleExportAll}
              disabled={exporting}
              className="w-full mb-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all disabled:opacity-50"
            >
              {exporting ? '匯出中…' : '匯出所有 QR Code（獨立圖片）'}
            </button>

            {['A', 'B', 'C'].map(zone => (
              <div key={zone} className="mb-8">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                  <span
                    className="px-3 py-1 rounded-full text-xs"
                    style={{ background: `${ZONE_COLOR[zone]}25`, color: ZONE_COLOR[zone], border: `1px solid ${ZONE_COLOR[zone]}50` }}
                  >
                    展區 {zone}
                  </span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {ARTWORKS.filter(a => a.zone === zone).map(art => (
                    <div
                      key={art.id}
                      className="bg-white/5 rounded-2xl p-4 flex flex-col items-center gap-3 text-center"
                      style={{ border: `1px solid ${ZONE_COLOR[zone]}30` }}
                    >
                      <QRCodeSVG
                        value={getQRUrl(art)}
                        size={120}
                        bgColor="transparent"
                        fgColor="#ffffff"
                        level="M"
                      />
                      <div>
                        <p className="text-white/50 text-xs mb-0.5">{art.id}</p>
                        <p className="text-white text-sm font-medium leading-tight">{art.name}</p>
                        <p className="text-white/40 text-xs mt-1">{art.location}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Exhibition State Tab ── */}
        {activeTab === 'exhibition' && (
          <div className="space-y-4">
            <div className={`rounded-xl p-4 border ${
              globalMode === 'exhibition'
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-white/5 border-white/10'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-bold">全域模式</p>
                  <p className="text-xs text-white/40 mt-0.5">切換後即時影響所有用戶</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  globalMode === null
                    ? 'bg-white/10 text-white/40'
                    : globalMode === 'exhibition'
                      ? 'bg-green-500/20 text-green-300'
                      : 'bg-white/10 text-white/60'
                }`}>
                  {globalMode === null ? '讀取中…' : globalMode === 'exhibition' ? '展覽模式' : '一般模式'}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSwitchGlobalMode('normal')}
                  disabled={modeLoading || globalMode === 'normal'}
                  className="flex-1 py-2.5 rounded-lg bg-white/10 text-white/70 text-sm hover:bg-white/20 transition-all disabled:opacity-40 min-h-[44px]"
                >
                  切換為一般模式
                </button>
                <button
                  onClick={() => handleSwitchGlobalMode('exhibition')}
                  disabled={modeLoading || globalMode === 'exhibition'}
                  className="flex-1 py-2.5 rounded-lg bg-green-500/20 border border-green-500/40 text-green-300 text-sm hover:bg-green-500/30 transition-all disabled:opacity-40 min-h-[44px]"
                >
                  切換為展覽模式
                </button>
              </div>
            </div>

            {!exState ? (
              <div className="text-center py-8 text-white/40 text-sm">尚未進入展覽模式</div>
            ) : (
              <>
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="text-white/40 text-xs">已訪作品：{exState.visited.length} / 15</div>
                </div>

                {['A', 'B', 'C'].map(zone => {
                  const visited = exState.visited.filter(w => w.startsWith(zone))
                  return (
                    <div key={zone} className="bg-white/5 rounded-xl p-4" style={{ border: `1px solid ${ZONE_COLOR[zone]}30` }}>
                      <h4 className="text-sm font-bold mb-2" style={{ color: ZONE_COLOR[zone] }}>展區 {zone}（{visited.length}/5）</h4>
                      <div className="flex flex-wrap gap-2">
                        {ARTWORKS.filter(a => a.zone === zone).map(art => {
                          const v = visited.includes(art.id)
                          return (
                            <span
                              key={art.id}
                              className="px-2 py-0.5 rounded-full text-xs"
                              style={{
                                background: v ? `${ZONE_COLOR[zone]}30` : 'rgba(255,255,255,0.05)',
                                color: v ? ZONE_COLOR[zone] : 'rgba(255,255,255,0.25)',
                                border: `1px solid ${v ? ZONE_COLOR[zone] + '60' : 'transparent'}`,
                              }}
                            >
                              {v ? '✓ ' : ''}{art.id}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}

                <button
                  onClick={async () => {
                    if (!window.confirm('清除展覽進度？')) return
                    await resetExhibitionState()
                    window.location.reload()
                  }}
                  className="w-full py-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm hover:bg-red-500/25 transition-all"
                >
                  重置展覽進度
                </button>
              </>
            )}
          </div>
        )}

        {/* ── Test Flow Tab ── */}
        {activeTab === 'test' && (
          <div className="space-y-5">
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-sm font-bold mb-1">直接抽卡</p>
              <p className="text-xs text-white/40 mb-3">跳過作品介紹頁，直接進入選花 → 翻牌流程</p>
              <button
                onClick={onDirectDraw}
                className="w-full py-3 rounded-xl font-semibold text-white transition-all min-h-[44px]"
                style={{ background: 'linear-gradient(135deg, rgba(242,190,92,0.5), rgba(242,126,147,0.4))', border: '1px solid rgba(242,190,92,0.4)' }}
              >
                ✦ 直接開始抽卡
              </button>
            </div>

            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-sm font-bold mb-1">集滿成就動畫</p>
              <p className="text-xs text-white/40 mb-3">測試集滿任務的全螢幕動畫效果（不實際寄信、不寫資料庫）</p>
              <div className="flex gap-2">
                <button
                  onClick={() => onTestCompletion?.(false)}
                  className="flex-1 py-3 rounded-xl font-semibold text-white transition-all min-h-[44px] text-sm"
                  style={{ background: 'linear-gradient(135deg, rgba(242,126,147,0.5), rgba(196,181,253,0.4))', border: '1px solid rgba(242,126,147,0.4)' }}
                >
                  🌸 有 Email
                </button>
                <button
                  onClick={() => onTestCompletion?.(true)}
                  className="flex-1 py-3 rounded-xl font-semibold text-white transition-all min-h-[44px] text-sm"
                  style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.5), rgba(196,181,253,0.4))', border: '1px solid rgba(99,102,241,0.4)' }}
                >
                  🔗 LINE 無 Email
                </button>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-sm font-bold mb-1">引導動畫</p>
              <p className="text-xs text-white/40 mb-3">清除完成記錄，返回首頁重新播放引導流程</p>
              <button
                onClick={() => {
                  localStorage.removeItem('chenghua_tutorial_v1')
                  window.location.href = '/'
                }}
                className="w-full py-3 rounded-xl font-semibold text-white transition-all min-h-[44px]"
                style={{ background: 'linear-gradient(135deg, rgba(91,123,168,0.5), rgba(72,100,140,0.4))', border: '1px solid rgba(91,123,168,0.4)' }}
              >
                🎬 重新播放引導動畫
              </button>
            </div>

            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-sm font-bold mb-1">模擬 QR 掃描（完整流程）</p>
              <p className="text-xs text-white/40 mb-4">作品介紹頁 → 點擊抽卡 → 選花 → 翻牌</p>
              {['A', 'B', 'C'].map(zone => (
                <div key={zone} className="mb-4">
                  <p className="text-xs font-semibold mb-2" style={{ color: ZONE_COLOR[zone] }}>展區 {zone}</p>
                  <div className="grid grid-cols-1 gap-2">
                    {ARTWORKS.filter(a => a.zone === zone).map(art => (
                      <button
                        key={art.id}
                        onClick={() => {
                          clearWorkVisit(art.id)
                          onSimulateQRScan({ zone: art.zone, workId: art.id, workName: art.name })
                        }}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all min-h-[44px] hover:bg-white/10"
                        style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${ZONE_COLOR[zone]}25` }}
                      >
                        <span className="text-white/80 font-medium">{art.name}</span>
                        <span className="text-white/30 text-xs">{art.id} →</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default AdminPage
