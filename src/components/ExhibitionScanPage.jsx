import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { recordVisit, getExhibitionState, initExhibition, getUnlockedPools, getZoneProgress } from '../utils/exhibitionHelper'

const ZONE_THEME = {
  A: { name: '呼吸', color: '#a78bfa', desc: '感知自我・內在靜觀' },
  B: { name: '蔓延', color: '#f472b6', desc: '情緒擴散・與他人連結' },
  C: { name: '共生', color: '#34d399', desc: '相互依存・紮根共存' },
}

export default function ExhibitionScanPage({ zone, workId, workName, onDraw, onBack }) {
  const [isNewVisit, setIsNewVisit] = useState(false)
  const [state, setState] = useState(null)
  const [progress, setProgress] = useState(null)
  const [pools, setPools] = useState(['A'])
  const [newPoolUnlocked, setNewPoolUnlocked] = useState(null)

  useEffect(() => {
    // Init exhibition if first time
    initExhibition()
    const prev = getExhibitionState()
    const wasVisited = prev?.visited?.includes(workId)
    const poolsBefore = getUnlockedPools()

    // Record this visit
    const newState = recordVisit(workId)
    setIsNewVisit(!wasVisited)
    setState(newState)
    setProgress(getZoneProgress())

    const poolsAfter = getUnlockedPools()
    setPools(poolsAfter)

    // Check if a new pool was unlocked by this visit
    if (!poolsBefore.includes('B') && poolsAfter.includes('B')) {
      setNewPoolUnlocked('B')
    } else if (!poolsBefore.includes('C') && poolsAfter.includes('C')) {
      setNewPoolUnlocked('C')
    }
  }, [workId])

  const theme = ZONE_THEME[zone] || ZONE_THEME.A

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden"
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at center, ${theme.color}15, transparent 70%)` }}
      />

      <div className="w-full max-w-sm relative z-10 flex flex-col gap-5">
        {/* Zone badge */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-center gap-2"
        >
          <span
            className="px-4 py-1.5 rounded-full text-sm font-bold tracking-widest"
            style={{ background: `${theme.color}25`, color: theme.color, border: `1px solid ${theme.color}50` }}
          >
            展區 {zone}・{theme.name}
          </span>
        </motion.div>

        {/* Artwork card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl p-6 text-center"
          style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.color}30` }}
        >
          <div className="text-5xl mb-3">🎨</div>
          <p className="text-white/50 text-xs mb-1 tracking-widest">{workId}</p>
          <h1 className="text-2xl font-bold text-white mb-2">{workName}</h1>
          <p className="text-white/40 text-sm">{theme.desc}</p>

          {isNewVisit ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="mt-4 flex items-center justify-center gap-2 text-green-400 text-sm font-medium"
            >
              <span>✓</span>
              <span>作品已記錄・獲得 +1 抽卡次數</span>
            </motion.div>
          ) : (
            <p className="mt-4 text-white/30 text-sm">已拜訪過此作品</p>
          )}
        </motion.div>

        {/* Zone progress */}
        {progress && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl p-4"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <p className="text-white/40 text-xs mb-3 text-center tracking-wider">展區進度</p>
            <div className="flex justify-around">
              {['A', 'B', 'C'].map(z => {
                const count = progress[z]?.length || 0
                const unlocked = pools.includes(z)
                const zTheme = ZONE_THEME[z]
                return (
                  <div key={z} className="flex flex-col items-center gap-1">
                    <span
                      className="text-xs font-bold"
                      style={{ color: unlocked ? zTheme.color : 'rgba(255,255,255,0.2)' }}
                    >
                      {z}
                    </span>
                    <span className="text-white/60 text-xs">{count}/5</span>
                    {z !== 'A' && !unlocked && (
                      <span className="text-xs text-white/20">🔒</span>
                    )}
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* New pool unlocked notification */}
        {newPoolUnlocked && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-2xl p-4 text-center"
            style={{ background: `${ZONE_THEME[newPoolUnlocked].color}20`, border: `1px solid ${ZONE_THEME[newPoolUnlocked].color}50` }}
          >
            <p className="text-white font-bold text-sm">
              ✨ 展區 {newPoolUnlocked}・{ZONE_THEME[newPoolUnlocked].name} 卡池已解鎖！
            </p>
          </motion.div>
        )}

        {/* Tickets */}
        {state && (
          <p className="text-center text-white/40 text-sm">
            剩餘抽卡次數：<span className="text-white/70 font-bold">{state.tickets}</span> 次
          </p>
        )}

        {/* Draw button */}
        <motion.button
          onClick={onDraw}
          disabled={state && state.tickets <= 0}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-2xl font-bold text-lg text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: state && state.tickets > 0
              ? `linear-gradient(135deg, ${theme.color}, ${theme.color}99)`
              : 'rgba(255,255,255,0.1)',
          }}
        >
          {state && state.tickets > 0 ? '🌸 立即抽卡' : '無抽卡次數・請繼續探索'}
        </motion.button>

        <button
          onClick={onBack}
          className="text-white/30 text-sm py-2 hover:text-white/60 transition-colors text-center"
        >
          返回首頁
        </button>
      </div>
    </motion.div>
  )
}
