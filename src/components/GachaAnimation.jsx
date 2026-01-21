import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import CardBack from './CardBack'
import FlowerBloom from './FlowerBloom'

const GachaAnimation = ({ flower, onComplete, onOpenCollection }) => {
  const [stage, setStage] = useState('shuffle') // shuffle -> draw -> flip -> reveal
  const [showFlower, setShowFlower] = useState(false)
  const isSSR = flower?.rarity === 'ssr'

  useEffect(() => {
    const timers = []

    // Stage 1: Shuffle cards (2s)
    timers.push(setTimeout(() => setStage('draw'), 2000))

    // Stage 2: Draw one card (1.5s)
    timers.push(setTimeout(() => setStage('flip'), 3500))

    // Stage 3: Card flip (1.5s)
    timers.push(setTimeout(() => {
      setStage('reveal')
    }, 5000))

    // Stage 3.5: Delay flower rendering (400ms after reveal starts)
    timers.push(setTimeout(() => {
      setShowFlower(true)
    }, 5400))

    // Stage 4: Complete (3s display time)
    timers.push(setTimeout(() => {
      onComplete?.()
    }, 8400))

    return () => timers.forEach(clearTimeout)
  }, [onComplete, isSSR])

  // Multiple cards for shuffle effect
  const cards = Array.from({ length: 7 }, (_, i) => ({ id: i }))

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden"
    >
      {/* SSR special effects */}
      {isSSR && stage === 'reveal' && (
        <>
          {/* Golden light rays */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.7] }}
            transition={{ duration: 0.5 }}
          >
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute top-1/2 left-1/2 w-2 h-screen origin-top"
                style={{
                  background: `linear-gradient(to bottom, ${flower.gradientColors?.[0] || '#FFD700'}40, transparent)`,
                  transform: `rotate(${(i * 360) / 12}deg)`,
                }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
              />
            ))}
          </motion.div>

          {/* Burst particles */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(30)].map((_, i) => {
              const angle = (i / 30) * Math.PI * 2
              const distance = 200
              return (
                <motion.div
                  key={i}
                  className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full"
                  style={{
                    background: flower.gradientColors?.[i % 3] || '#FFD700',
                  }}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                  animate={{
                    x: Math.cos(angle) * distance,
                    y: Math.sin(angle) * distance,
                    opacity: 0,
                    scale: 1,
                  }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              )
            })}
          </div>
        </>
      )}

      {/* Main card animation area */}
      <div className="relative w-full max-w-[320px] aspect-[2/3]">
        {stage === 'shuffle' && (
          <div className="relative w-full h-full">
            {cards.map((card, index) => (
              <motion.div
                key={card.id}
                className="absolute inset-0 w-full h-full"
                initial={{
                  x: 0,
                  y: 0,
                  rotate: 0,
                  scale: 1,
                  zIndex: index,
                  opacity: 1,
                }}
                animate={{
                  x: [0, (index - 3) * 30, 0],
                  y: [0, Math.sin(index) * 20, 0],
                  rotate: [0, (index - 3) * 10, 0],
                  scale: 1,
                  opacity: 1,
                }}
                transition={{
                  duration: 2,
                  times: [0, 0.5, 1],
                  ease: 'easeInOut',
                }}
              >
                <div className="w-full h-full rounded-2xl shadow-2xl">
                  <CardBack flower={flower} />
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {stage === 'draw' && (
          <motion.div
            className="absolute inset-0"
            initial={{ y: 0, scale: 1, rotateY: 0 }}
            animate={{
              y: [0, -50, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{
              duration: 1.5,
              times: [0, 0.5, 1],
              ease: ['easeOut', 'easeInOut']
            }}
          >
            <div className="w-full h-full rounded-2xl shadow-2xl">
              <CardBack flower={flower} />
            </div>

            {/* Glow effect when drawing */}
            <motion.div
              className="absolute -inset-4 rounded-3xl blur-xl"
              style={{
                background: isSSR
                  ? `linear-gradient(135deg, ${flower.gradientColors?.[0] || '#FFD700'}, ${flower.gradientColors?.[1] || '#FFA500'})`
                  : `radial-gradient(circle, ${flower.color}60, transparent)`,
              }}
              animate={{
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
              }}
            />
          </motion.div>
        )}

        {(stage === 'flip' || stage === 'reveal') && (
          <div className="absolute inset-0" style={{ perspective: '1000px' }}>
            <motion.div
              className="relative w-full h-full preserve-3d"
              initial={{ rotateY: 0 }}
              animate={{ rotateY: stage === 'reveal' ? 180 : 90 }}
              transition={{
                duration: 1.5,
                ease: 'easeInOut',
              }}
            >
              {/* Card back */}
              <motion.div
                className="absolute inset-0 backface-hidden rounded-2xl shadow-2xl"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <CardBack flower={flower} />
              </motion.div>

              {/* Card front with flower - game style card */}
              <motion.div
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
                    background: isSSR
                      ? `linear-gradient(135deg, ${flower.gradientColors?.[0]}, ${flower.gradientColors?.[1]}, ${flower.gradientColors?.[2]})`
                      : `linear-gradient(135deg, ${flower.color}, ${flower.color}dd)`,
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
                      border: isSSR ? '3px solid rgba(255, 215, 0, 0.8)' : '3px solid rgba(255, 255, 255, 0.6)',
                      boxShadow: isSSR
                        ? 'inset 0 0 20px rgba(255, 215, 0, 0.3), 0 0 20px rgba(255, 215, 0, 0.3)'
                        : 'inset 0 0 20px rgba(255, 255, 255, 0.2), 0 0 15px rgba(255, 255, 255, 0.2)',
                    }}
                  />

                  {/* Inner border */}
                  <div
                    className="absolute inset-5 rounded-lg"
                    style={{
                      border: isSSR ? '2px solid rgba(255, 215, 0, 0.5)' : '2px solid rgba(255, 255, 255, 0.4)',
                    }}
                  />
                </div>

                {showFlower && stage === 'reveal' && (
                  <>
                    {/* 3D Flower in center */}
                    <div
                      style={{
                        position: 'absolute',
                        width: '160px',
                        height: '160px',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        marginTop: '-50px',
                        zIndex: 10,
                      }}
                    >
                      <FlowerBloom flower={flower} key={flower.id} />
                    </div>

                    {/* Flower name banner - wrapper for centering */}
                    <div
                      className="absolute bottom-8 w-[70%]"
                      style={{
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 20,
                      }}
                    >
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                      >
                        <div className="relative">
                          {/* Glow effect */}
                          <div
                            className="absolute inset-0 rounded-full blur-xl opacity-60"
                            style={{
                              background: isSSR
                                ? `radial-gradient(ellipse, ${flower.gradientColors?.[0]}, transparent)`
                                : `radial-gradient(ellipse, ${flower.color}, transparent)`,
                            }}
                          />

                          {/* Main content */}
                          <div
                            className="relative px-4 py-2 rounded-full backdrop-blur-sm"
                            style={{
                              background: isSSR
                                ? 'linear-gradient(90deg, rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.6))'
                                : 'linear-gradient(90deg, rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.6))',
                              boxShadow: isSSR
                                ? `0 4px 20px rgba(255, 215, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)`
                                : `0 4px 20px ${flower.color}40, inset 0 1px 0 rgba(255, 255, 255, 0.1)`,
                            }}
                          >
                            <div className="text-center">
                              <p className="text-white font-bold text-lg tracking-wide drop-shadow-lg">
                                {flower.flower}
                              </p>
                              <p className="text-white/90 text-xs mt-0.5 drop-shadow tracking-wide">
                                {flower.meaning}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {/* Top rarity indicator */}
                    {isSSR && (
                      <div
                        className="absolute top-10 z-10"
                        style={{
                          left: '50%',
                          transform: 'translateX(-50%)',
                        }}
                      >
                        <motion.div
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3, type: 'spring' }}
                        >
                          <div className="px-4 py-2 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 rounded-full border-2 border-yellow-200 shadow-2xl">
                            <p className="text-yellow-900 font-black text-sm tracking-wider">
                              ⭐ SSR ⭐
                            </p>
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            </motion.div>

            {/* Particle effects around card during reveal */}
            {stage === 'reveal' && (
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      background: flower.color,
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      y: [0, -100],
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0],
                    }}
                    transition={{
                      duration: 2,
                      delay: Math.random() * 1,
                      repeat: Infinity,
                      repeatDelay: 1,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

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

export default GachaAnimation
