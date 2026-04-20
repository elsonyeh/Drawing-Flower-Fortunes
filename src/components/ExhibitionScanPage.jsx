import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { recordVisit, getExhibitionState, initExhibitionWithCloud, getUnlockedPools, getZoneProgress } from '../utils/exhibitionHelper'
import { ZONE_THEME, ARTWORKS, ZONE_ARTWORKS } from '../utils/exhibitionConstants'

export default function ExhibitionScanPage({ zone, workId, workName, onDraw }) {
  const [isNewVisit, setIsNewVisit] = useState(false)
  const [progress, setProgress] = useState(null)
  const [pools, setPools] = useState(['A'])
  const [newPoolUnlocked, setNewPoolUnlocked] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const init = async () => {
      await initExhibitionWithCloud()

      const prev = getExhibitionState()
      const wasVisited = prev?.visited?.includes(workId)
      const poolsBefore = getUnlockedPools()

      recordVisit(workId)
      setIsNewVisit(!wasVisited)
      setProgress(getZoneProgress())

      const poolsAfter = getUnlockedPools()
      setPools(poolsAfter)

      if (!poolsBefore.includes('B') && poolsAfter.includes('B')) {
        setNewPoolUnlocked('B')
      } else if (!poolsBefore.includes('C') && poolsAfter.includes('C')) {
        setNewPoolUnlocked('C')
      }

      setReady(true)
    }
    init()
  }, [workId])

  const theme = ZONE_THEME[zone] || ZONE_THEME.A
  const artwork = ARTWORKS.find(a => a.id === workId)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center px-6 py-10 relative overflow-hidden"
    >
      {/* Atmospheric background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{ background: `radial-gradient(ellipse 80% 60% at 50% 40%, ${theme.color}1a, transparent 70%)` }}
        />
        <motion.div
          className="absolute inset-0"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ background: `radial-gradient(ellipse 50% 40% at 50% 30%, ${theme.color}10, transparent 60%)` }}
        />
      </div>

      {/* First-encounter floating particles */}
      {isNewVisit && ready && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(14)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: i % 3 === 0 ? 6 : 4,
                height: i % 3 === 0 ? 6 : 4,
                background: theme.color,
                left: `${15 + (i * 5.2) % 70}%`,
                top: `${25 + (i * 7.3) % 50}%`,
              }}
              initial={{ opacity: 0, scale: 0, y: 0 }}
              animate={{ opacity: [0, 0.9, 0], scale: [0, 1, 0.4], y: -(60 + i * 5) }}
              transition={{ duration: 1.8 + (i % 4) * 0.3, delay: i * 0.1, ease: 'easeOut' }}
            />
          ))}
        </div>
      )}

      <div className="w-full max-w-sm relative z-10 flex flex-col items-center gap-6">

        {/* Zone tag + visit badge */}
        <motion.div
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-2"
        >
          <span
            className="px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest"
            style={{
              background: `${theme.color}20`,
              color: theme.color,
              border: `1px solid ${theme.color}40`,
            }}
          >
            {theme.name}
          </span>
          {ready && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.35, type: 'spring', stiffness: 220 }}
              className="px-2.5 py-1 rounded-full text-xs font-bold"
              style={{
                background: isNewVisit ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.07)',
                color: isNewVisit ? '#fbbf24' : 'rgba(255,255,255,0.35)',
                border: isNewVisit ? '1px solid rgba(251,191,36,0.35)' : '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {isNewVisit ? '✦ 初遇' : '再遇'}
            </motion.span>
          )}
        </motion.div>

        {/* Artwork hero block */}
        <motion.div
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.45 }}
          className="w-full text-center"
        >
          <motion.div
            className="text-5xl mb-4"
            animate={isNewVisit ? { scale: [1, 1.18, 1], rotate: [0, 6, -4, 0] } : {}}
            transition={{ delay: 0.5, duration: 0.7 }}
          >
            🎨
          </motion.div>

          <h1
            className="text-3xl font-bold text-white mb-2 leading-tight"
            style={{ textShadow: `0 0 36px ${theme.color}55` }}
          >
            {workName}
          </h1>

          {artwork?.location && (
            <p className="text-xs tracking-wider mb-3" style={{ color: `${theme.color}aa` }}>
              {artwork.location}
            </p>
          )}

          <p className="text-white/30 text-sm">{theme.desc}</p>

          {ready && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-5 inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full"
              style={{
                background: isNewVisit ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.05)',
                color: isNewVisit ? '#34d399' : 'rgba(255,255,255,0.3)',
                border: isNewVisit ? '1px solid rgba(52,211,153,0.22)' : '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {isNewVisit ? (
                <>
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring' }}>
                    ✓
                  </motion.span>
                  作品已記錄
                </>
              ) : (
                <span>已拜訪過此作品</span>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* New pool unlocked */}
        {newPoolUnlocked && (
          <motion.div
            initial={{ scale: 0.82, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 180 }}
            className="w-full rounded-2xl p-4 text-center"
            style={{
              background: `${ZONE_THEME[newPoolUnlocked].color}18`,
              border: `1px solid ${ZONE_THEME[newPoolUnlocked].color}45`,
            }}
          >
            <p className="text-white font-bold text-sm">
              ✨ 「{ZONE_THEME[newPoolUnlocked].name}」花卡已解鎖
            </p>
          </motion.div>
        )}

        {/* Zone progress — dots only, no ABC labels */}
        {progress && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="w-full flex flex-col items-center gap-3"
          >
            <p className="text-white/20 text-xs tracking-widest">展覽進度</p>
            <div className="flex gap-5 justify-center">
              {['A', 'B', 'C'].map(z => {
                const visited = progress[z]?.length || 0
                const total = ZONE_ARTWORKS[z].length
                const unlocked = pools.includes(z)
                const zTheme = ZONE_THEME[z]
                return (
                  <div key={z} className="flex flex-col items-center gap-2">
                    <div className="flex gap-1">
                      {[...Array(total)].map((_, i) => (
                        <div
                          key={i}
                          className="w-2 h-2 rounded-full"
                          style={{
                            background: i < visited
                              ? (unlocked ? zTheme.color : 'rgba(255,255,255,0.25)')
                              : 'rgba(255,255,255,0.08)',
                            boxShadow: i < visited && unlocked ? `0 0 4px ${zTheme.color}80` : 'none',
                          }}
                        />
                      ))}
                    </div>
                    <span
                      className="text-xs"
                      style={{ color: unlocked ? zTheme.color + 'cc' : 'rgba(255,255,255,0.2)' }}
                    >
                      {unlocked ? zTheme.name : '🔒'}
                    </span>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Draw button */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="w-full"
        >
          <motion.button
            onClick={onDraw}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 rounded-2xl font-bold text-lg text-white relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${theme.color}, ${theme.color}bb)` }}
          >
            <motion.div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              animate={{ opacity: [0, 0.35, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{ background: `radial-gradient(ellipse at center, white, transparent 70%)` }}
            />
            <span className="relative z-10">🌸 立即抽卡</span>
          </motion.button>
        </motion.div>

      </div>
    </motion.div>
  )
}
