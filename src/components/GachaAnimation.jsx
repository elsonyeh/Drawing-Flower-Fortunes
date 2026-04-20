import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import CardBack from './CardBack'
import FlowerBloom from './FlowerBloom'

// 選牌扇形配置
const PICK_FAN = [
  { angle: -28, dx: -88, dy: 22 },
  { angle: -14, dx: -42, dy: 6 },
  { angle:   0, dx:   0, dy: 0 },
  { angle:  14, dx:  42, dy: 6 },
  { angle:  28, dx:  88, dy: 22 },
]

const GachaAnimation = ({ flower, onComplete }) => {
  const [stage, setStage] = useState('pick') // pick -> flip -> reveal
  const [selectedCard, setSelectedCard] = useState(null)
  const [showFlower, setShowFlower] = useState(false)
  const isSSR = flower?.rarity === 'ssr'

  // 選牌後啟動 flip → reveal → complete 的計時器
  useEffect(() => {
    if (stage !== 'flip') return
    const timers = []
    timers.push(setTimeout(() => setStage('reveal'), 2000))
    timers.push(setTimeout(() => setShowFlower(true), 2500))
    timers.push(setTimeout(() => onComplete?.(), 6000))
    return () => timers.forEach(clearTimeout)
  }, [stage, onComplete])

  const handlePick = (index) => {
    if (selectedCard !== null) return
    setSelectedCard(index)
    setTimeout(() => setStage('flip'), 900)
  }

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden"
    >
      {/* 白光消散效果 */}
      <motion.div
        className="absolute inset-0 bg-white pointer-events-none"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        style={{ zIndex: 100 }}
      />
      {/* ── 選牌階段 ── */}
      {stage === 'pick' && (
        <motion.div
          key="pick"
          className="flex flex-col items-center gap-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 0.6 }}
        >
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="text-white/65 text-sm tracking-[0.25em]"
          >
            選擇一張牌，開啟你的花語
          </motion.p>

          <div className="relative" style={{ width: 320, height: 190 }}>
            {PICK_FAN.map((cfg, i) => (
              <motion.div
                key={i}
                style={{
                  position: 'absolute',
                  width: 82, height: 123,
                  left: '50%', bottom: 0,
                  marginLeft: -41,
                  transformOrigin: '50% 130%',
                  zIndex: selectedCard === i ? 20 : 5 - Math.abs(i - 2),
                }}
                initial={{ rotate: cfg.angle, x: cfg.dx, y: 80, opacity: 0 }}
                animate={
                  selectedCard === i
                    ? { rotate: 0, x: 0, y: -30, scale: 1.18, opacity: 1 }
                    : selectedCard !== null
                    ? { rotate: cfg.angle, x: cfg.dx, y: 0, opacity: 0.25, scale: 0.96 }
                    : { rotate: cfg.angle, x: cfg.dx, y: 0, opacity: 1, scale: 1 }
                }
                transition={{
                  delay: selectedCard !== null ? 0 : 0.7 + i * 0.08,
                  duration: selectedCard === i ? 0.45 : 0.5,
                  type: 'spring', stiffness: 180, damping: 18,
                }}
              >
                <motion.button
                  whileHover={selectedCard === null ? { y: -14, scale: 1.08 } : {}}
                  whileTap={selectedCard === null ? { scale: 0.95 } : {}}
                  onClick={() => handlePick(i)}
                  disabled={selectedCard !== null}
                  className="w-full h-full rounded-xl relative overflow-hidden focus:outline-none"
                  style={{
                    background: 'linear-gradient(145deg, #F27E93, #F2A488)',
                    boxShadow: selectedCard === i
                      ? '0 8px 32px rgba(242,126,147,0.75), 0 0 50px rgba(242,190,92,0.45)'
                      : '0 4px 18px rgba(0,0,0,0.40)',
                    border: '1px solid rgba(255,255,255,0.25)',
                  }}
                >
                  {/* dot pattern */}
                  <svg className="absolute inset-0 w-full h-full opacity-15" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id={`pp-${i}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                        <circle cx="10" cy="10" r="1.2" fill="white"/>
                        <circle cx="3" cy="3" r="0.8" fill="white"/>
                        <circle cx="17" cy="3" r="0.8" fill="white"/>
                        <circle cx="3" cy="17" r="0.8" fill="white"/>
                        <circle cx="17" cy="17" r="0.8" fill="white"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill={`url(#pp-${i})`}/>
                  </svg>
                  <div className="absolute inset-2.5 border border-white/35 rounded-lg pointer-events-none"/>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.span
                      className="text-white/65 text-3xl select-none"
                      animate={selectedCard === null ? { scale: [1, 1.07, 1], rotate: [0, 4, -4, 0] } : {}}
                      transition={{ duration: 3.5, repeat: Infinity, delay: i * 0.55 }}
                    >✿</motion.span>
                  </div>
                  <span className="absolute top-1 left-1 text-white/40 text-[10px] select-none">❀</span>
                  <span className="absolute top-1 right-1 text-white/40 text-[10px] select-none">❀</span>
                  <span className="absolute bottom-1 left-1 text-white/40 text-[10px] select-none">❀</span>
                  <span className="absolute bottom-1 right-1 text-white/40 text-[10px] select-none">❀</span>
                  {selectedCard === i && (
                    <motion.div
                      className="absolute inset-0 rounded-xl pointer-events-none"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 0.65, 0.25, 0.65] }}
                      transition={{ duration: 0.7, repeat: Infinity }}
                      style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.45), transparent)', filter: 'blur(4px)' }}
                    />
                  )}
                </motion.button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* SSR special effects */}
      {isSSR && stage === 'reveal' && (
        <>
          {/* Golden light rays */}
          <motion.div
            className="absolute inset-0 pointer-events-none overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.7] }}
            transition={{ duration: 0.5 }}
          >
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute top-1/2 left-1/2 w-2 origin-bottom"
                style={{
                  height: '50vh',
                  background: `linear-gradient(to top, ${flower.gradientColors?.[0] || '#FFD700'}40, transparent)`,
                  transform: `translateY(-100%) rotate(${(i * 360) / 12}deg)`,
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

      {/* ── 翻牌 + 揭示階段 ── */}
      {(stage === 'flip' || stage === 'reveal') && (
        <motion.div
          initial={{ rotateY: 0 }}
          animate={{ rotateY: stage === 'reveal' ? 180 : 90 }}
          transition={{
            duration: 2,
            ease: 'easeInOut',
          }}
          className="relative w-full max-w-[320px] aspect-[2/3] preserve-3d"
          style={{ transformStyle: 'preserve-3d' }}
        >
            {/* Card back */}
            <div
              className="absolute inset-0 backface-hidden rounded-2xl overflow-hidden shadow-2xl"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <CardBack flower={flower} />
            </div>

            {/* Card front with flower - game style card */}
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
                        <FlowerBloom flower={flower} key={flower.id} />
                      </div>
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
            </div>

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
          </motion.div>
        )}

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
