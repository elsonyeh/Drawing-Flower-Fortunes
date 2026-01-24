import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import FlowerBloom from './FlowerBloom'

const FortuneResult = ({ flower, onReset, isFromCollection = false }) => {
  const containerRef = useRef(null)
  const isSSR = flower?.rarity === 'ssr'

  // Scroll to top when viewing from collection
  useEffect(() => {
    if (isFromCollection) {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [isFromCollection])

  if (!flower) return null

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
      },
    },
  }

  return (
    <motion.div
      ref={containerRef}
      initial={isFromCollection ? { opacity: 0, y: 0 } : "hidden"}
      animate={isFromCollection ? { opacity: 1, y: 0 } : "visible"}
      exit={{ opacity: 0 }}
      variants={!isFromCollection ? containerVariants : undefined}
      className="min-h-screen flex flex-col items-center justify-start px-4 py-8 overflow-y-auto overflow-x-hidden relative"
    >
      {/* SSR Background effects */}
      {isSSR && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {/* Subtle rotating rays */}
          <motion.div
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          >
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 w-1 h-screen origin-top opacity-5"
                style={{
                  background: `linear-gradient(to bottom, ${flower.gradientColors?.[0] || '#FFD700'}, transparent)`,
                  transform: `rotate(${(i * 360) / 8}deg)`,
                }}
              />
            ))}
          </motion.div>

          {/* Floating particles */}
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                background: flower.gradientColors?.[i % 3] || '#FFD700',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -50, 0],
                opacity: [0, 0.6, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                delay: Math.random() * 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      )}

      <div className="w-full max-w-4xl relative z-10 px-0">
        {/* Main 3D Flower Display */}
        <motion.div
          variants={!isFromCollection ? itemVariants : undefined}
          initial={isFromCollection ? { opacity: 0, y: 30 } : undefined}
          animate={isFromCollection ? { opacity: 1, y: 0 } : undefined}
          transition={isFromCollection ? { duration: 0.6, delay: 0.1 } : undefined}
          className="relative w-full aspect-square max-w-md mx-auto mb-6"
        >
          {/* Glow effect for SSR */}
          {isSSR && (
            <motion.div
              className="absolute -inset-8 rounded-full blur-3xl"
              style={{
                background: `radial-gradient(circle, ${flower.gradientColors?.[0]}40, ${flower.gradientColors?.[1]}20, transparent)`,
              }}
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}

          {/* 3D Flower - Larger with fixed centering */}
          <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            minHeight: '350px',
            maxHeight: '400px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <FlowerBloom flower={flower} />
          </div>

          {/* Rarity badge */}
          {isSSR && (
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', delay: 0.3 }}
              className="absolute -top-4 -right-2 sm:-right-4 px-4 py-2 bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 rounded-full font-bold text-white shadow-2xl border-2 border-yellow-200 z-20"
            >
              ⭐ SSR ⭐
            </motion.div>
          )}
        </motion.div>

        {/* Flower name and meaning */}
        <motion.div
          variants={!isFromCollection ? itemVariants : undefined}
          initial={isFromCollection ? { opacity: 0, y: 30 } : undefined}
          animate={isFromCollection ? { opacity: 1, y: 0 } : undefined}
          transition={isFromCollection ? { duration: 0.6, delay: 0.2 } : undefined}
          className="text-center mb-8"
        >
          <motion.h1
            className="text-5xl md:text-6xl font-bold mb-3"
            style={{
              background: isSSR
                ? `linear-gradient(135deg, ${flower.gradientColors?.[0]}, ${flower.gradientColors?.[1]}, ${flower.gradientColors?.[2]})`
                : flower.color,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: isSSR ? 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.5))' : 'none',
            }}
            animate={isSSR ? {
              textShadow: [
                '0 0 20px rgba(255, 215, 0, 0.5)',
                '0 0 30px rgba(255, 215, 0, 0.8)',
                '0 0 20px rgba(255, 215, 0, 0.5)',
              ],
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {flower.flower}
          </motion.h1>
          <p className="text-2xl md:text-3xl text-primary-300">{flower.meaning}</p>
        </motion.div>

        {/* Story section */}
        <motion.div
          variants={!isFromCollection ? itemVariants : undefined}
          initial={isFromCollection ? { opacity: 0, y: 30 } : undefined}
          animate={isFromCollection ? { opacity: 1, y: 0 } : undefined}
          transition={isFromCollection ? { duration: 0.6, delay: 0.3 } : undefined}
          className={`rounded-2xl p-6 mb-6 border ${
            isSSR
              ? 'bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border-yellow-500/30'
              : 'bg-gradient-to-br from-night-800/60 to-night-900/60 border-primary-500/20'
          } backdrop-blur-md`}
        >
          <h2 className={`text-xl font-semibold mb-3 flex items-center ${
            isSSR ? 'text-yellow-300' : 'text-primary-300'
          }`}>
            <span className="mr-2">📖</span>
            花之物語
          </h2>
          <p className="text-gray-200 leading-relaxed text-lg">{flower.story}</p>
        </motion.div>

        {/* Message section */}
        <motion.div
          variants={!isFromCollection ? itemVariants : undefined}
          initial={isFromCollection ? { opacity: 0, y: 30 } : undefined}
          animate={isFromCollection ? { opacity: 1, y: 0 } : undefined}
          transition={isFromCollection ? { duration: 0.6, delay: 0.4 } : undefined}
          className={`rounded-2xl p-6 mb-6 border ${
            isSSR
              ? 'bg-gradient-to-br from-orange-900/40 to-yellow-900/40 border-yellow-400/40'
              : 'bg-gradient-to-br from-primary-900/40 to-purple-900/40 border-primary-400/30'
          } backdrop-blur-md`}
        >
          <h2 className={`text-xl font-semibold mb-3 flex items-center ${
            isSSR ? 'text-yellow-200' : 'text-primary-200'
          }`}>
            <span className="mr-2">💌</span>
            今夜的訊息
          </h2>
          <p className="text-white text-lg md:text-xl leading-relaxed italic">
            「{flower.message}」
          </p>
        </motion.div>

        {/* Locations section */}
        <motion.div
          variants={!isFromCollection ? itemVariants : undefined}
          initial={isFromCollection ? { opacity: 0, y: 30 } : undefined}
          animate={isFromCollection ? { opacity: 1, y: 0 } : undefined}
          transition={isFromCollection ? { duration: 0.6, delay: 0.5 } : undefined}
          className="bg-gradient-to-br from-night-800/60 to-night-900/60 backdrop-blur-md rounded-2xl p-6 mb-8 border border-primary-500/20"
        >
          <h2 className="text-xl font-semibold text-primary-300 mb-4 flex items-center">
            <span className="mr-2">📍</span>
            推薦探索地點
          </h2>
          <div className="space-y-3">
            {flower.locations.map((location, index) => (
              <motion.div
                key={index}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="flex items-center space-x-3 p-4 rounded-lg bg-night-700/40 hover:bg-night-700/60 transition-colors"
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{
                    background: isSSR
                      ? `linear-gradient(135deg, ${flower.gradientColors?.[0]}, ${flower.gradientColors?.[1]})`
                      : flower.color
                  }}
                />
                <span className="text-gray-200 text-lg">{location}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          variants={!isFromCollection ? itemVariants : undefined}
          initial={isFromCollection ? { opacity: 0, y: 30 } : undefined}
          animate={isFromCollection ? { opacity: 1, y: 0 } : undefined}
          transition={isFromCollection ? { duration: 0.6, delay: 0.6 } : undefined}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-6"
        >
          <motion.button
            onClick={onReset}
            className={`px-8 py-4 rounded-full font-medium shadow-lg text-lg ${
              isSSR
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                : 'bg-gradient-to-r from-primary-500 to-pink-500 text-white'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isFromCollection ? '返回圖鑑' : '再抽一次'}
          </motion.button>

          <motion.button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: `埕花 - ${flower.flower}`,
                  text: `今夜抽到了${isSSR ? 'SSR ' : ''}${flower.flower}，花語是${flower.meaning}。${flower.message}`,
                  url: window.location.href,
                })
              }
            }}
            className="px-8 py-4 bg-night-700/80 text-primary-300 rounded-full font-medium border border-primary-500/30 hover:bg-night-700 transition-colors text-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            分享花語
          </motion.button>
        </motion.div>

        {/* SSR Congratulations message */}
        {isSSR && !isFromCollection && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mb-6"
          >
            <motion.div
              className="inline-block px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full text-white font-bold text-lg shadow-2xl"
              animate={{
                boxShadow: [
                  '0 0 20px rgba(255, 215, 0, 0.5)',
                  '0 0 40px rgba(255, 215, 0, 0.8)',
                  '0 0 20px rgba(255, 215, 0, 0.5)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🎉 恭喜獲得稀有SSR花語！🎉
            </motion.div>
          </motion.div>
        )}

        {/* Footer */}
        <motion.div
          variants={!isFromCollection ? itemVariants : undefined}
          initial={isFromCollection ? { opacity: 0, y: 30 } : undefined}
          animate={isFromCollection ? { opacity: 1, y: 0 } : undefined}
          transition={isFromCollection ? { duration: 0.6, delay: 0.7 } : undefined}
          className="text-center text-gray-400 text-sm"
        >
          <p>願今夜的花語指引你</p>
          <p className="mt-2">在鹽埕找到屬於自己的故事</p>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default FortuneResult
