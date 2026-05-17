import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { getAllFlowers, getCollectedFlowers, getCollectionStats, isFlowerCollected, isFlowerViewed, markFlowerAsViewed } from '../utils/fortuneHelper'
import { isExhibitionMode, getZoneProgress } from '../utils/exhibitionHelper'
import { ZONE_THEME, ZONE_ARTWORKS } from '../utils/exhibitionConstants'
import CardBack from './CardBack'
import FlowerBloom from './FlowerBloom'
import { useAuth } from '../hooks/useAuth'
import { logEvent } from '../utils/analytics'

const ZONE_UNLOCK_KEY = 'chenghua_zone_unlock_seen'

const CollectionPage = ({ onClose, onSelectFlower }) => {
  const { user } = useAuth()
  const [selectedTab, setSelectedTab] = useState('all') // 'all', 'ssr', 'common'
  const [flippedCard, setFlippedCard] = useState(null) // Track which card is flipped
  const [showFlower, setShowFlower] = useState(false) // Delay flower rendering
  const [showZoneModal, setShowZoneModal] = useState(false)
  const [zoneRating, setZoneRating] = useState(0)
  const [zoneRatingHover, setZoneRatingHover] = useState(0)
  const exMode = isExhibitionMode()
  const currentSource = exMode ? 'exhibition' : 'normal'
  const allFlowers = getAllFlowers()
  const stats = getCollectionStats(currentSource)
  // zone unlock 檢查用全來源；gallery 用 currentSource 過濾
  const collectedIds = getCollectedFlowers(null).map(f => f.id)

  const exProgress = exMode ? getZoneProgress() : null

  // 任意掃描 1 件裝置藝術且擁有 1 朵花時，顯示一次恭喜動畫
  useEffect(() => {
    if (!exMode || !exProgress) return
    const anyArtworkScanned = ['A', 'B', 'C'].some(z => (exProgress[z] || []).length >= 1)
    const hasFlower = collectedIds.length >= 1
    if (anyArtworkScanned && hasFlower && !localStorage.getItem(ZONE_UNLOCK_KEY)) {
      setShowZoneModal(true)
    }
  }, [exMode, exProgress, collectedIds])

  const filteredFlowers = allFlowers.filter(flower => {
    if (selectedTab === 'ssr') return flower.rarity === 'ssr'
    if (selectedTab === 'common') return flower.rarity === 'common'
    return true
  })

  // Delay flower rendering until flip animation completes
  useEffect(() => {
    if (flippedCard) {
      setShowFlower(false)
      const timer = setTimeout(() => {
        setShowFlower(true)
      }, 400) // Show flower after flip animation starts (0.6s total, show at 0.4s)
      return () => clearTimeout(timer)
    } else {
      setShowFlower(false)
    }
  }, [flippedCard])

  const closeZoneModal = () => {
    localStorage.setItem(ZONE_UNLOCK_KEY, '1')
    setShowZoneModal(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen text-white overflow-y-auto"
    >
      {/* Header */}
      <div className="sticky top-0 z-20 backdrop-blur-md border-b" style={{ background: 'rgba(14,20,42,0.18)', borderColor: 'rgba(242,126,147,0.18)' }}>
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gradient">花語圖鑑</h1>
            <button
              data-tutorial="back-btn"
              onClick={onClose}
              aria-label="關閉圖鑑"
              className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
              style={{ background: 'rgba(255,255,255,0.07)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.13)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <line x1="2" y1="2" x2="14" y2="14" />
                <line x1="14" y1="2" x2="2" y2="14" />
              </svg>
            </button>
          </div>

          {/* Stats */}
          <div data-tutorial="collection-progress" className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-lg p-3 text-center" style={{ background: 'rgba(242,126,147,0.12)', border: '1px solid rgba(242,126,147,0.22)' }}>
              <p className="text-xs" style={{ color: 'rgba(242,217,208,0.55)' }}>總收集率</p>
              <p className="text-2xl font-bold" style={{ color: '#F27E93' }}>{stats.percentage}%</p>
              <p className="text-xs" style={{ color: 'rgba(242,217,208,0.45)' }}>{stats.total}/{stats.totalCards}</p>
            </div>
            <div className="rounded-lg p-3 text-center" style={{ background: 'rgba(242,190,92,0.12)', border: '1px solid rgba(242,190,92,0.22)' }}>
              <p className="text-xs" style={{ color: 'rgba(242,217,208,0.55)' }}>SSR</p>
              <p className="text-2xl font-bold" style={{ color: '#F2BE5C' }}>{stats.ssr}/{stats.totalSSR}</p>
              <p className="text-xs" style={{ color: 'rgba(242,217,208,0.45)' }}>稀有</p>
            </div>
            <div className="rounded-lg p-3 text-center" style={{ background: 'rgba(91,123,168,0.15)', border: '1px solid rgba(91,123,168,0.25)' }}>
              <p className="text-xs" style={{ color: 'rgba(242,217,208,0.55)' }}>一般</p>
              <p className="text-2xl font-bold" style={{ color: '#a8c4e0' }}>{stats.common}/{stats.totalCommon}</p>
              <p className="text-xs" style={{ color: 'rgba(242,217,208,0.45)' }}>普通</p>
            </div>
          </div>

          {/* Exhibition Progress */}
          {exMode && exProgress && (
            <div className="mb-4 rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="px-4 py-3" style={{ background: 'rgba(91,123,168,0.08)' }}>
                <span className="text-xs text-white/50 tracking-widest font-medium">裝置藝術展覽解鎖進度</span>
              </div>
              <div className="grid grid-cols-3 divide-x divide-white/8">
                {['A', 'B', 'C'].map(zone => {
                  const theme = ZONE_THEME[zone]
                  const visited = exProgress[zone] || []
                  const total = ZONE_ARTWORKS[zone].length
                  const pct = Math.round((visited.length / total) * 100)
                  const isComplete = visited.length === total
                  const barColor = isComplete ? '#F2BE5C' : theme.color
                  const countColor = isComplete ? '#F2BE5C' : 'rgba(255,255,255,0.6)'
                  return (
                    <div key={zone} className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1.5">
                        <span className="text-sm font-bold" style={{ color: isComplete ? '#F2BE5C' : theme.color }}>
                          {theme.name}
                        </span>
                      </div>
                      <div className="h-1 rounded-full bg-white/10 overflow-hidden mb-1">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{ background: barColor }}
                        />
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-xs" style={{ color: countColor }}>
                          {visited.length}/{total}
                        </span>
                        {isComplete && <span style={{ color: '#F2BE5C', fontSize: '10px', fontWeight: 700 }}>★</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 普通模式：展覽即將開始提示 */}
          {!exMode && (
            <div className="mb-3 rounded-xl px-4 py-3" style={{ background: 'rgba(242,190,92,0.06)', border: '1px solid rgba(242,190,92,0.14)' }}>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(242,217,208,0.7)' }}>
                <span style={{ color: '#F2BE5C', fontWeight: 600 }}>✦ 花語封印中</span>
                {'　'}5/16 踏入現場掃描第一件裝置藝術，此圖鑑將封印沉眠，靜待旅程終了後再度甦醒。
              </p>
            </div>
          )}

          {/* Sticker redemption hint */}
          {exMode && exProgress && (
            <div className="mb-3 rounded-xl px-4 py-3" style={{ background: 'rgba(242,190,92,0.06)', border: '1px solid rgba(242,190,92,0.14)' }}>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(242,217,208,0.7)' }}>
                <span style={{ color: '#F2BE5C', fontWeight: 600 }}>✦ 兌換任務</span>
                {'　'}掃描任一裝置藝術並抽到花語，至服務台出示圖鑑頁面即可兌換集章活動限定角色貼紙！
              </p>
              <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.32)' }}>
                ✧ 走遍鹽埕、集齊 15 種以上花語——據說完成者將解鎖一份隱藏好禮。你，敢挑戰嗎？
              </p>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2">
            {[
              { id: 'all', label: '全部', count: allFlowers.length },
              { id: 'ssr', label: 'SSR', count: 5 },
              { id: 'common', label: '一般', count: 15 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  selectedTab === tab.id ? 'text-white' : 'text-white/40 hover:text-white/70'
                }`}
                style={selectedTab === tab.id
                  ? { background: 'linear-gradient(135deg, rgba(242,126,147,0.35), rgba(242,164,136,0.25))', border: '1px solid rgba(242,126,147,0.35)' }
                  : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }
                }
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Card Grid */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredFlowers.map((flower, index) => {
            const collected = isFlowerCollected(flower.id, currentSource)
            const isFirstCollected = collected && !filteredFlowers.slice(0, index).some(f => isFlowerCollected(f.id, currentSource))

            return (
              <motion.div
                key={flower.id}
                data-tutorial={isFirstCollected ? 'collection-card' : undefined}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="relative"
              >
                <motion.button
                  onClick={() => {
                    if (collected) {
                      markFlowerAsViewed(flower.id)
                      setFlippedCard(flower)
                    }
                  }}
                  className={`w-full aspect-[2/3] rounded-xl overflow-hidden shadow-lg relative ${
                    collected ? 'cursor-pointer' : 'cursor-not-allowed'
                  }`}
                  whileTap={collected ? { scale: 0.95 } : {}}
                  disabled={!collected}
                >
                  {collected ? (
                    <>
                      {/* Collected card - show card back */}
                      <CardBack flower={flower} />

                      {/* Flower name overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 z-10">
                        <p className="text-white font-bold text-sm">{flower.flower}</p>
                        <p className="text-white/70 text-xs">{flower.meaning}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Not collected - show silhouette */}
                      <div className="w-full h-full flex items-center justify-center rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
                        <div className="text-center">
                          <div className="text-4xl mb-2 opacity-30">?</div>
                          <p className="text-xs text-gray-500">未收集</p>
                        </div>
                      </div>

                      {/* Lock icon */}
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.10)' }}>
                        <span className="text-xs">🔒</span>
                      </div>
                    </>
                  )}
                </motion.button>

                {/* NEW badge for recently collected and not yet viewed */}
                {collected && !isFlowerViewed(flower.id) && collectedIds.indexOf(flower.id) >= collectedIds.length - 3 && (
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="absolute -top-2 -left-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg z-20"
                  >
                    NEW
                  </motion.div>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Empty state */}
        {filteredFlowers.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">此分類暫無卡片</p>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="max-w-6xl mx-auto px-4 pb-8">
        <div className="rounded-lg p-4 space-y-1.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(242,126,147,0.12)' }}>
          <p className="text-xs text-center" style={{ color: 'rgba(242,217,208,0.45)' }}>
            💡 點擊已收集的卡片即可翻轉查看花語詳情
          </p>
          <p className="text-xs text-center" style={{ color: '#F2BE5C', opacity: 0.75 }}>
            ✦ 傳說中藏有五種極稀有的 SSR 花語，展覽模式每次抽卡有 5% 機率邂逅
          </p>
          <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.28)' }}>
            那朵屬於你的花，或許正在等待有緣人⋯⋯
          </p>
        </div>
      </div>

      {/* Flipped Card Modal */}
      <AnimatePresence>
        {flippedCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setFlippedCard(null)}
          >
            <motion.div
              initial={{ scale: 0.8, rotateY: 0 }}
              animate={{ scale: 1, rotateY: 180 }}
              exit={{ scale: 0.8, rotateY: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-[2/3] preserve-3d"
              onClick={(e) => e.stopPropagation()}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Card back side */}
              <div className="absolute inset-0 backface-hidden rounded-2xl overflow-hidden shadow-2xl" style={{ backfaceVisibility: 'hidden' }}>
                <CardBack flower={flippedCard} />
              </div>

              {/* Card front side with flower */}
              <div
                className="absolute inset-0 backface-hidden rounded-2xl overflow-hidden shadow-2xl"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              >
                {/* Background gradient */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: flippedCard.rarity === 'ssr'
                      ? `linear-gradient(135deg, ${flippedCard.gradientColors?.[0]}, ${flippedCard.gradientColors?.[1]}, ${flippedCard.gradientColors?.[2]})`
                      : `linear-gradient(135deg, ${flippedCard.color}, ${flippedCard.color}dd)`,
                  }}
                />

                {/* Decorative pattern overlay */}
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px),
                                     radial-gradient(circle at 80% 50%, white 1px, transparent 1px)`,
                    backgroundSize: '30px 30px',
                  }}
                />

                {/* Ornate border */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Outer border */}
                  <div
                    className="absolute inset-3 rounded-xl"
                    style={{
                      border: flippedCard.rarity === 'ssr' ? '3px solid rgba(255, 215, 0, 0.8)' : '3px solid rgba(255, 255, 255, 0.6)',
                      boxShadow: flippedCard.rarity === 'ssr'
                        ? 'inset 0 0 20px rgba(255, 215, 0, 0.3), 0 0 20px rgba(255, 215, 0, 0.3)'
                        : 'inset 0 0 20px rgba(255, 255, 255, 0.2), 0 0 15px rgba(255, 255, 255, 0.2)',
                    }}
                  />

                  {/* Inner border */}
                  <div
                    className="absolute inset-5 rounded-lg"
                    style={{
                      border: flippedCard.rarity === 'ssr' ? '2px solid rgba(255, 215, 0, 0.5)' : '2px solid rgba(255, 255, 255, 0.4)',
                    }}
                  />
                </div>
                {/* SSR Special Effects */}
                {flippedCard.rarity === 'ssr' && (
                  <>
                    {/* Rotating rays */}
                    <motion.div
                      className="absolute inset-0 pointer-events-none"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    >
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute top-1/2 left-1/2 w-1 h-full origin-top opacity-20"
                          style={{
                            background: `linear-gradient(to bottom, ${flippedCard.gradientColors?.[0]}, transparent)`,
                            transform: `rotate(${(i * 360) / 8}deg)`,
                          }}
                        />
                      ))}
                    </motion.div>

                    {/* Sparkle particles */}
                    {[...Array(12)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1.5 h-1.5 rounded-full"
                        style={{
                          background: flippedCard.gradientColors?.[i % 3],
                          left: `${20 + Math.random() * 60}%`,
                          top: `${20 + Math.random() * 60}%`,
                        }}
                        animate={{
                          scale: [0, 1, 0],
                          opacity: [0, 1, 0],
                        }}
                        transition={{
                          duration: 2,
                          delay: i * 0.3,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      />
                    ))}

                    {/* Glowing border pulse */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl"
                      style={{
                        boxShadow: `inset 0 0 20px ${flippedCard.gradientColors?.[0]}80`,
                      }}
                      animate={{
                        boxShadow: [
                          `inset 0 0 20px ${flippedCard.gradientColors?.[0]}40`,
                          `inset 0 0 40px ${flippedCard.gradientColors?.[1]}80`,
                          `inset 0 0 20px ${flippedCard.gradientColors?.[0]}40`,
                        ],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                  </>
                )}

                {/* Common card subtle effects */}
                {flippedCard.rarity !== 'ssr' && (
                  <>
                    {/* Floating petals */}
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute text-2xl opacity-30"
                        style={{
                          left: `${Math.random() * 100}%`,
                          top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                          y: [0, -30, 0],
                          x: [0, Math.random() * 20 - 10, 0],
                          rotate: [0, 360],
                          opacity: [0.1, 0.3, 0.1],
                        }}
                        transition={{
                          duration: 4 + Math.random() * 2,
                          delay: i * 0.5,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      >
                        ✿
                      </motion.div>
                    ))}

                    {/* Soft glow */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl"
                      style={{
                        boxShadow: `inset 0 0 30px ${flippedCard.color}40`,
                      }}
                      animate={{
                        boxShadow: [
                          `inset 0 0 30px ${flippedCard.color}20`,
                          `inset 0 0 50px ${flippedCard.color}60`,
                          `inset 0 0 30px ${flippedCard.color}20`,
                        ],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                  </>
                )}

                {/* 3D Flower - Centered with fixed positioning */}
                {showFlower && (
                  <div
                    style={{
                      position: 'absolute',
                      width: '100%',
                      height: '65%',
                      left: 0,
                      top: '5%',
                      zIndex: 5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: 'none',
                    }}
                  >
                    <div style={{ width: '100%', height: '100%' }}>
                      <FlowerBloom flower={flippedCard} key={flippedCard.id} />
                    </div>
                  </div>
                )}

                {/* Flower info */}
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 z-10">
                  {/* Background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-transparent" />

                  {/* Content */}
                  <div className="relative">
                    {/* Title with subtle glow */}
                    <div className="mb-2 sm:mb-3">
                      <h3 className="text-lg sm:text-xl font-bold text-white mb-0.5 sm:mb-1 drop-shadow-lg tracking-wide">
                        {flippedCard.flower}
                      </h3>
                      <p className="text-sm sm:text-base text-white/90 drop-shadow tracking-wide">
                        {flippedCard.meaning}
                      </p>
                    </div>

                    <button
                      data-tutorial="view-detail-btn"
                      onClick={() => {
                        setFlippedCard(null)
                        onSelectFlower?.(flippedCard)
                      }}
                      className={`w-full py-2 sm:py-2.5 rounded-full font-medium shadow-lg text-sm sm:text-base transition-transform hover:scale-105 active:scale-95 ${
                        flippedCard.rarity === 'ssr'
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                          : 'text-white'
                      }`}
                      style={{
                        background: flippedCard.rarity === 'ssr' ? undefined : 'linear-gradient(135deg, #F27E93, #F2A488)',
                        boxShadow: flippedCard.rarity === 'ssr'
                          ? '0 4px 15px rgba(255, 215, 0, 0.4)'
                          : '0 4px 15px rgba(242,126,147,0.40)',
                      }}
                    >
                      查看完整內容
                    </button>
                  </div>
                </div>

                {/* SSR badge */}
                {flippedCard.rarity === 'ssr' && (
                  <div className="absolute top-2 right-2 sm:top-3 sm:right-3 px-2 py-1 sm:px-3 sm:py-1.5 bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 rounded-full font-bold text-white shadow-2xl border-2 border-yellow-200 z-20 text-xs sm:text-sm">
                    ⭐ SSR ⭐
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
      `}</style>

      {/* Zone unlock modal */}
      <AnimatePresence>
        {showZoneModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.78)' }}
            onClick={closeZoneModal}
          >
            <motion.div
              initial={{ scale: 0.82, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 18, stiffness: 260 }}
              className="mx-6 rounded-2xl px-6 py-7 text-center"
              style={{ background: 'linear-gradient(160deg,#1a1030,#0e1a30)', border: '1px solid rgba(242,190,92,0.35)', maxWidth: 340 }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
              <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#F2BE5C', letterSpacing: 1 }}>
                任務達成！
              </h2>
              <p style={{ margin: '0 0 6px', fontSize: 13, lineHeight: 1.85, color: 'rgba(242,217,208,0.95)' }}>
                你已掃描裝置藝術並解鎖花語，任務完成！
              </p>
              <div
                style={{ margin: '12px 0', padding: '12px 16px', borderRadius: 12,
                  background: 'rgba(242,190,92,0.08)', border: '1px solid rgba(242,190,92,0.2)' }}
              >
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.9, color: 'rgba(242,217,208,0.92)' }}>
                  前往服務台出示圖鑑頁面<br />
                  即可兌換 <strong style={{ color: '#F2BE5C' }}>活動限定角色集章貼紙</strong> 🌸
                </p>
              </div>
              {/* 體驗評分 */}
              <div style={{ margin: '16px 0 8px', paddingTop: 16, borderTop: '1px solid rgba(242,190,92,0.15)', textAlign: 'center' }}>
                <p style={{ margin: '0 0 2px', fontSize: 12, fontWeight: 700, color: 'rgba(242,217,208,0.75)', letterSpacing: 2 }}>
                  {zoneRating > 0 ? '感謝你的回饋！' : '旅程評價'}
                </p>
                <p style={{ margin: '0 0 12px', fontSize: 11, color: 'rgba(242,217,208,0.42)', lineHeight: 1.6 }}>
                  {zoneRating > 0
                    ? '你的聲音是我們繼續前進的動力 🌿'
                    : '這次鹽夏不夜埕花語旅程，你覺得如何？'}
                </p>
                {zoneRating === 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <button key={i}
                        onClick={() => {
                          setZoneRating(i)
                          logEvent(user?.id ?? null, 'rating', { score: i, source: 'zone_unlock' })
                          localStorage.setItem('chenghua_zone_rating_seen', String(i))
                        }}
                        onMouseEnter={() => setZoneRatingHover(i)}
                        onMouseLeave={() => setZoneRatingHover(0)}
                        style={{ background: 'none', border: 'none', fontSize: 26, cursor: 'pointer',
                          opacity: i <= (zoneRatingHover || 0) ? 1 : 0.25, transition: 'opacity 0.15s', padding: '2px 4px' }}>
                        🌸
                      </button>
                    ))}
                  </div>
                ) : (
                  <div style={{ marginBottom: 14 }}>
                    <p style={{ margin: '0 0 10px', fontSize: 12, color: 'rgba(242,217,208,0.55)', lineHeight: 1.7 }}>
                      想和我們聊聊這次的展覽、互動體驗，<br />
                      或是對整個活動有什麼想說的嗎？
                    </p>
                    <a href="https://forms.gle/fNJTKrez1tX1M8X58" target="_blank" rel="noreferrer"
                      style={{ display: 'inline-block', fontSize: 13, fontWeight: 600,
                        color: '#f27e93', textDecoration: 'none',
                        padding: '7px 18px', borderRadius: 20,
                        border: '1px solid rgba(242,126,147,0.35)',
                        background: 'rgba(242,126,147,0.08)' }}>
                      前往填寫完整回饋 →
                    </a>
                  </div>
                )}
              </div>
              <button
                onClick={closeZoneModal}
                style={{
                  width: '100%', padding: '11px', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg,#F2BE5C,#f27e93)',
                  color: '#0e142a', fontWeight: 700, fontSize: 14, cursor: 'pointer', letterSpacing: 0.5,
                }}
              >
                知道了！
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default CollectionPage
