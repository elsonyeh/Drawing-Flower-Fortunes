import { useState } from 'react'
import { motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { unlockAllFlowers, clearAllFlowers, getCollectionStats } from '../utils/fortuneHelper'
import { getExhibitionState } from '../utils/exhibitionHelper'

const ARTWORKS = [
  { zone: 'A', id: 'A1', name: '當我聽見我',          location: '光榮國小外空地' },
  { zone: 'A', id: 'A2', name: '一瞬花綻',            location: '光榮國小陶壺後空地' },
  { zone: 'A', id: 'A3', name: '炎赫',                location: '千葉素食館' },
  { zone: 'A', id: 'A4', name: '關於情緒的棲息方式',   location: '國小國中外草地（綠廊）' },
  { zone: 'A', id: 'A5', name: '流金歲月',            location: '光榮國小建築物空隙' },
  { zone: 'B', id: 'B1', name: '花落成流',            location: '欄杆區／光榮國小牆外' },
  { zone: 'B', id: 'B2', name: '情緒共振實驗室',       location: '鹽埕國中外牆花圃' },
  { zone: 'B', id: 'B3', name: '這裡有很多按鈕',       location: '克朗德美術館騎樓' },
  { zone: 'B', id: 'B4', name: '著花',                location: '巴黎花紙行' },
  { zone: 'B', id: 'B5', name: '花鹽',                location: '雍之川流古董師交易館' },
  { zone: 'C', id: 'C1', name: '聽見花開：聲與光的共存', location: '沙地里空屋一樓' },
  { zone: 'C', id: 'C2', name: '鹽晶．緣進',           location: '老房間（里長）' },
  { zone: 'C', id: 'C3', name: '起家：紮根',           location: '老房間（居民）' },
  { zone: 'C', id: 'C4', name: '聲綻',                location: '瑞士大飯店' },
  { zone: 'C', id: 'C5', name: '日常的封存',           location: '岸等' },
]

const ZONE_COLOR = { A: '#a78bfa', B: '#f472b6', C: '#34d399' }

function AdminPage() {
  const [stats, setStats] = useState(getCollectionStats())
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState('stats') // 'stats', 'qrcodes', 'exhibition'
  const [baseUrl, setBaseUrl] = useState(window.location.origin)

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

  const handleGoToMain = () => {
    window.location.href = '/'
  }

  const handlePrint = () => {
    window.print()
  }

  const getQRUrl = (art) =>
    `${baseUrl}/?zone=${art.zone}&work=${art.id}&name=${encodeURIComponent(art.name)}`

  const exState = getExhibitionState()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-b from-night-900 via-night-800 to-night-700 text-white"
    >
      <div className="max-w-4xl mx-auto px-4 pt-8 pb-16">
        <h1 className="text-2xl font-bold text-center mb-1">Admin Panel</h1>
        <p className="text-gray-400 text-center text-sm mb-6">elsontest</p>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'stats', label: '蒐集數據' },
            { id: 'qrcodes', label: 'QR Code 列表' },
            { id: 'exhibition', label: '展覽狀態' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white/20 text-white'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

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
              <button onClick={handleGoToMain}
                className="w-full py-3 px-4 bg-white/10 rounded-xl font-semibold text-white hover:bg-white/20 transition-all">
                Go to Main Page
              </button>
            </div>
          </div>
        )}

        {/* ── QR Codes Tab ── */}
        {activeTab === 'qrcodes' && (
          <div>
            {/* Base URL setting */}
            <div className="bg-white/5 rounded-xl p-4 mb-5">
              <label className="text-white/60 text-xs mb-1 block">App 網址（用於生成 QR Code）</label>
              <input
                type="text"
                value={baseUrl}
                onChange={e => setBaseUrl(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/40"
              />
            </div>

            <button
              onClick={handlePrint}
              className="w-full mb-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all"
            >
              列印所有 QR Code
            </button>

            {/* QR Code Grid by Zone */}
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
            {!exState ? (
              <div className="text-center py-12 text-white/40 text-sm">
                尚未進入展覽模式<br />
                <span className="text-xs mt-1 block">掃描任意作品 QR Code 後進入</span>
              </div>
            ) : (
              <>
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold">抽卡次數</h3>
                    <span className="text-2xl font-bold text-yellow-300">{exState.tickets}</span>
                  </div>
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
                  onClick={() => {
                    if (window.confirm('清除展覽進度？')) {
                      localStorage.removeItem('exhibitionState')
                      window.location.reload()
                    }
                  }}
                  className="w-full py-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm hover:bg-red-500/25 transition-all"
                >
                  重置展覽進度
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
        }
      `}</style>
    </motion.div>
  )
}

export default AdminPage
