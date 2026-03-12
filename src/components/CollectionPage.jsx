import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { getAllFlowers, getCollectedFlowers, getCollectionStats, isFlowerCollected, isFlowerViewed, markFlowerAsViewed } from '../utils/fortuneHelper'
import CardBack from './CardBack'
import FlowerBloom from './FlowerBloom'

const CollectionPage = ({ onClose, onSelectFlower }) => {
  const [selectedTab, setSelectedTab] = useState('all') // 'all', 'ssr', 'common'
  const [flippedCard, setFlippedCard] = useState(null) // Track which card is flipped
  const [showFlower, setShowFlower] = useState(false) // Delay flower rendering
  const allFlowers = getAllFlowers()
  const stats = getCollectionStats()
  const collectedIds = getCollectedFlowers().map(f => f.id)

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-b from-night-900 via-night-800 to-night-700 text-white overflow-y-auto"
    >
      {/* Header */}
      <div className="sticky top-0 z-20 bg-night-900/90 backdrop-blur-md border-b border-primary-500/20">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gradient">花語圖鑑</h1>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-night-700/50 hover:bg-night-700 transition-colors"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-gradient-to-br from-primary-900/40 to-purple-900/40 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-400">總收集率</p>
              <p className="text-2xl font-bold text-primary-300">{stats.percentage}%</p>
              <p className="text-xs text-gray-400">{stats.total}/{stats.totalCards}</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-900/40 to-orange-900/40 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-400">SSR</p>
              <p className="text-2xl font-bold text-yellow-300">{stats.ssr}/{stats.totalSSR}</p>
              <p className="text-xs text-gray-400">稀有</p>
            </div>
            <div className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-400">一般</p>
              <p className="text-2xl font-bold text-blue-300">{stats.common}/{stats.totalCommon}</p>
              <p className="text-xs text-gray-400">普通</p>
            </div>
          </div>

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
                  selectedTab === tab.id
                    ? 'bg-gradient-to-r from-primary-500 to-pink-500 text-white'
                    : 'bg-night-700/50 text-gray-400 hover:bg-night-700'
                }`}
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
            const collected = isFlowerCollected(flower.id)

            return (
              <motion.div
                key={flower.id}
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
                      <div className="w-full h-full bg-gradient-to-br from-night-800 to-night-700 flex items-center justify-center border-2 border-night-600 rounded-xl">
                        <div className="text-center">
                          <div className="text-4xl mb-2 opacity-30">?</div>
                          <p className="text-xs text-gray-500">未收集</p>
                        </div>
                      </div>

                      {/* Lock icon */}
                      <div className="absolute top-2 right-2 w-6 h-6 bg-night-600 rounded-full flex items-center justify-center">
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
        <div className="bg-night-800/50 rounded-lg p-4 border border-primary-500/20">
          <p className="text-sm text-gray-400 text-center">
            💡 點擊卡片翻轉查看花朵 · SSR 卡片機率各 1% · 持續抽取收集完整圖鑑！
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
                      onClick={() => {
                        setFlippedCard(null)
                        onSelectFlower?.(flippedCard)
                      }}
                      className={`w-full py-2 sm:py-2.5 rounded-full font-medium shadow-lg text-sm sm:text-base transition-transform hover:scale-105 active:scale-95 ${
                        flippedCard.rarity === 'ssr'
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                          : 'bg-gradient-to-r from-primary-500 to-pink-500 text-white'
                      }`}
                      style={{
                        boxShadow: flippedCard.rarity === 'ssr'
                          ? '0 4px 15px rgba(255, 215, 0, 0.4)'
                          : `0 4px 15px ${flippedCard.color}60`,
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
    </motion.div>
  )
}

export default CollectionPage
