import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { recordVisit, getExhibitionState, initExhibitionWithCloud, getUnlockedPools, getZoneProgress } from '../utils/exhibitionHelper'
import { ZONE_THEME, ARTWORKS, ZONE_ARTWORKS } from '../utils/exhibitionConstants'
import { getAllFlowers } from '../utils/fortuneHelper'
import { preloadModelsForFlowers } from './FlowerBloom'

export default function ExhibitionScanPage({ zone, workId, workName, onDraw, onBack }) {
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
      if (!poolsBefore.includes('B') && poolsAfter.includes('B')) setNewPoolUnlocked('B')
      else if (!poolsBefore.includes('C') && poolsAfter.includes('C')) setNewPoolUnlocked('C')
      setReady(true)

      // 使用者閱讀作品介紹的期間，背景預載本次可能抽到的花模型
      const eligible = getAllFlowers().filter(
        f => f.exhibitionZone && poolsAfter.includes(f.exhibitionZone)
      )
      preloadModelsForFlowers(eligible)
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
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{ background: `radial-gradient(ellipse 100% 55% at 50% 20%, ${theme.color}22, transparent 65%)` }}
        />
        <motion.div
          className="absolute inset-0"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ background: `radial-gradient(ellipse 60% 35% at 50% 15%, ${theme.color}0e, transparent 55%)` }}
        />
      </div>

      {/* First-encounter particles */}
      {isNewVisit && ready && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(14)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: i % 3 === 0 ? 6 : 3,
                height: i % 3 === 0 ? 6 : 3,
                background: theme.color,
                left: `${15 + (i * 5.2) % 70}%`,
                top: `${20 + (i * 7.3) % 45}%`,
              }}
              initial={{ opacity: 0, scale: 0, y: 0 }}
              animate={{ opacity: [0, 0.8, 0], scale: [0, 1, 0.3], y: -(70 + i * 6) }}
              transition={{ duration: 2 + (i % 4) * 0.3, delay: i * 0.1, ease: 'easeOut' }}
            />
          ))}
        </div>
      )}

      {/* ── Top bar ── */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-4 pb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm min-h-[44px] min-w-[44px] transition-colors"
          style={{ color: 'rgba(255,255,255,0.35)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          返回
        </button>

        {/* Zone badge */}
        <motion.span
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest"
          style={{
            background: `${theme.color}20`,
            color: theme.color,
            border: `1px solid ${theme.color}40`,
          }}
        >
          {theme.name}
        </motion.span>

        <div className="w-[60px]" />
      </div>

      {/* ── Main content ── */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-7 gap-0">

        {/* Artwork title block */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="mb-8"
        >
          <h1
            className="text-4xl font-bold text-white leading-tight mb-3"
            style={{ textShadow: `0 0 40px ${theme.color}50` }}
          >
            {workName}
          </h1>

          <div className="flex flex-col gap-1">
            {artwork?.location && (
              <p className="text-sm" style={{ color: `${theme.color}cc` }}>
                {artwork.location}
              </p>
            )}
            <p className="text-sm text-white/30">{theme.desc}</p>
          </div>
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
          className="mb-8 origin-left"
          style={{ height: 1, background: `linear-gradient(to right, ${theme.color}50, transparent)` }}
        />

        {/* Status message */}
        {ready && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            {isNewVisit ? (
              <p className="text-base leading-relaxed" style={{ color: '#34d399cc' }}>
                此刻的相遇，已悄悄留下印記
              </p>
            ) : (
              <p className="text-base font-medium text-white/60">你曾造訪過這件作品</p>
            )}
          </motion.div>
        )}

        {/* New pool unlocked */}
        {newPoolUnlocked && (
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 160 }}
            className="mb-6 rounded-2xl px-4 py-3"
            style={{
              background: `${ZONE_THEME[newPoolUnlocked].color}15`,
              border: `1px solid ${ZONE_THEME[newPoolUnlocked].color}40`,
            }}
          >
            <p className="text-sm font-medium" style={{ color: ZONE_THEME[newPoolUnlocked].color }}>
              ✨ 「{ZONE_THEME[newPoolUnlocked].name}」花卡已解鎖
            </p>
          </motion.div>
        )}

        {/* Zone progress */}
        {progress && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="flex flex-col gap-3"
          >
            <p className="text-xs text-white/20 tracking-widest">展覽進度</p>
            <div className="flex gap-6">
              {['A', 'B', 'C'].map(z => {
                const visited = progress[z]?.length || 0
                const total = ZONE_ARTWORKS[z].length
                const unlocked = pools.includes(z)
                const zTheme = ZONE_THEME[z]
                return (
                  <div key={z} className="flex flex-col gap-2">
                    <div className="flex gap-1.5">
                      {[...Array(total)].map((_, i) => (
                        <div
                          key={i}
                          className="w-2 h-2 rounded-full transition-all"
                          style={{
                            background: i < visited
                              ? (unlocked ? zTheme.color : 'rgba(255,255,255,0.2)')
                              : 'rgba(255,255,255,0.07)',
                            boxShadow: i < visited && unlocked ? `0 0 5px ${zTheme.color}70` : 'none',
                          }}
                        />
                      ))}
                    </div>
                    <span
                      className="text-xs"
                      style={{ color: unlocked ? zTheme.color + 'bb' : 'rgba(255,255,255,0.18)' }}
                    >
                      {unlocked ? zTheme.name : '🔒'}
                    </span>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Bottom CTA ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="relative z-10 px-6 pb-10"
        style={{ paddingBottom: 'max(40px, env(safe-area-inset-bottom, 40px))' }}
      >
        {isNewVisit || !ready ? (
          <motion.button
            onClick={onDraw}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 rounded-2xl font-bold text-lg text-white relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${theme.color}, ${theme.color}bb)` }}
          >
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{ opacity: [0, 0.3, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{ background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.4), transparent 70%)' }}
            />
            <span className="relative z-10">🌸 立即抽卡</span>
          </motion.button>
        ) : (
          <motion.button
            onClick={onBack}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 rounded-2xl font-medium text-base transition-colors"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            返回首頁
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  )
}
