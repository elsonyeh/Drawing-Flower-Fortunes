import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import CollectionIcon from './CollectionIcon'

const FloatingPetal = ({ delay, x, duration, size, rotation }) => (
  <motion.div
    className="absolute pointer-events-none"
    style={{
      left: `${x}%`,
      top: '-10%',
    }}
    initial={{ y: 0, rotate: 0, opacity: 0 }}
    animate={{
      y: ['0vh', '110vh'],
      rotate: [0, rotation, rotation * 2],
      opacity: [0, 1, 1, 0],
      x: [0, Math.sin(x) * 50, Math.sin(x * 2) * 30],
    }}
    transition={{
      duration: duration,
      delay: delay,
      repeat: Infinity,
      ease: 'linear',
    }}
  >
    <div
      className="relative"
      style={{
        width: `${size}px`,
        height: `${size * 1.5}px`,
      }}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(ellipse at center, rgba(255, 183, 197, 0.8), rgba(255, 105, 180, 0.4))`,
          clipPath: 'ellipse(50% 60% at 50% 40%)',
          filter: 'blur(0.5px)',
        }}
      />
    </div>
  </motion.div>
)

const LandingPage = ({ onPetalSelect, onOpenCollection }) => {
  const [particles, setParticles] = useState([])
  const [petals, setPetals] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [isTransforming, setIsTransforming] = useState(false)

  useEffect(() => {
    // Generate random particles for background
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 2
    }))
    setParticles(newParticles)

    // Generate floating petals
    const newPetals = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 10,
      duration: Math.random() * 8 + 6,
      size: Math.random() * 12 + 8,
      rotation: (Math.random() - 0.5) * 720,
    }))
    setPetals(newPetals)
  }, [])

  // 創建 7 枝花的位置
  const flowers = Array.from({ length: 7 }, (_, i) => {
    const angle = (i / 7) * Math.PI * 2 - Math.PI / 2
    return {
      id: i,
      angle: angle,
    }
  })

  const handleFlowerClick = (index) => {
    if (isTransforming) return

    setSelectedIndex(index)
    setIsTransforming(true)

    setTimeout(() => {
      onPetalSelect()
    }, 2000)
  }

  const getFlowerPosition = (angle) => {
    // 響應式半徑
    const radius = typeof window !== 'undefined' && window.innerWidth < 768 ? 110 : 170
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      rotate: (angle * 180) / Math.PI + 90,
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-screen flex flex-col items-center justify-center px-4 md:px-6 overflow-hidden"
    >
      {/* Collection button */}
      <motion.button
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        onClick={onOpenCollection}
        className="absolute top-4 right-4 md:top-6 md:right-6 z-20 px-3 py-2 md:px-4 md:py-2 bg-gradient-to-r from-primary-600/80 to-pink-600/80 backdrop-blur-sm rounded-full text-white text-sm md:text-base font-medium flex items-center gap-2 border border-primary-400/30 shadow-lg"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <CollectionIcon className="w-4 h-4 md:w-5 md:h-5" color="white" />
        <span className="hidden sm:inline">圖鑑</span>
      </motion.button>

      {/* Floating petals */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {petals.map((petal) => (
          <FloatingPetal
            key={petal.id}
            delay={petal.delay}
            x={petal.x}
            duration={petal.duration}
            size={petal.size}
            rotation={petal.rotation}
          />
        ))}
      </div>

      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-primary-400/20"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Title */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="text-center mb-6 md:mb-8 relative z-10"
      >
        <h1 className="text-5xl md:text-7xl font-bold mb-2 md:mb-4 text-gradient glow">
          埕花
        </h1>
        <p className="text-lg md:text-2xl text-primary-200 mb-1 md:mb-2">
          鹽夏不夜埕
        </p>
        <p className="text-base md:text-xl text-gray-300">
          {isTransforming ? '正在為你抽取花語...' : '選擇一朵花，開啟今夜的指引'}
        </p>
      </motion.div>

      {/* 花朵圓圈 */}
      <div className="relative w-[260px] h-[260px] md:w-[380px] md:h-[380px] flex items-center justify-center mb-4 md:mb-8 mx-auto">
        {/* 中心發光圓 */}
        <motion.div
          className="absolute w-2 h-2 md:w-3 md:h-3 rounded-full bg-primary-400"
          animate={{
            scale: [1, 2, 1],
            opacity: [0.3, 0.9, 0.3],
            boxShadow: [
              '0 0 10px rgba(139, 92, 246, 0.4)',
              '0 0 40px rgba(139, 92, 246, 1)',
              '0 0 10px rgba(139, 92, 246, 0.4)',
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        />

        {/* 外圈光環 */}
        <motion.div
          className="absolute w-40 h-40 md:w-56 md:h-56 rounded-full border border-primary-400/20"
          animate={{
            scale: [0.9, 1.1, 0.9],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
          }}
        />

        {/* 花朵 */}
        {flowers.map((flower, index) => {
          const isSelected = selectedIndex === index
          const pos = getFlowerPosition(flower.angle)

          return (
            <motion.div
              key={flower.id}
              className="absolute"
              style={{
                left: '50%',
                top: '50%',
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                x: isTransforming && isSelected ? 0 : pos.x,
                y: isTransforming && isSelected ? 0 : pos.y,
                scale: isTransforming && isSelected ? 2.8 : 1,
                opacity: isTransforming ? (isSelected ? 1 : 0) : 1,
                rotate: isTransforming && isSelected ? 1080 : pos.rotate,
              }}
              transition={{
                delay: isTransforming ? 0 : index * 0.08,
                duration: isTransforming ? 1.8 : 0.5,
                type: 'spring',
                stiffness: isTransforming ? 80 : 200,
              }}
            >
              <motion.button
                onClick={() => handleFlowerClick(index)}
                disabled={isTransforming}
                className="relative focus:outline-none"
                whileHover={!isTransforming ? { scale: 1.35 } : {}}
                whileTap={!isTransforming ? { scale: 0.9 } : {}}
              >
                {/* 發光光環 */}
                {isSelected && (
                  <>
                    {/* 脈動光環 */}
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      animate={{
                        scale: [1, 2.5, 1],
                        opacity: [0.8, 0, 0.8],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                      }}
                      style={{
                        boxShadow: '0 0 60px rgba(168, 85, 247, 1)',
                      }}
                    />

                    {/* 旋轉光線 */}
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      animate={{
                        rotate: [0, 360],
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                    >
                      {[...Array(16)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-0.5 h-10 md:h-12 bg-gradient-to-t from-transparent via-purple-300 to-transparent"
                          style={{
                            left: '50%',
                            top: '50%',
                            transformOrigin: 'center -25px',
                            transform: `translateX(-50%) rotate(${(i * 360) / 16}deg)`,
                            opacity: 0.7,
                          }}
                        />
                      ))}
                    </motion.div>

                    {/* 粒子效果 */}
                    {[...Array(12)].map((_, i) => {
                      const particleAngle = (i / 12) * Math.PI * 2
                      return (
                        <motion.div
                          key={i}
                          className="absolute w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-purple-300"
                          style={{
                            left: '50%',
                            top: '50%',
                          }}
                          animate={{
                            x: [0, Math.cos(particleAngle) * 40, 0],
                            y: [0, Math.sin(particleAngle) * 40, 0],
                            opacity: [0, 1, 0],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            delay: i * 0.1,
                          }}
                        />
                      )
                    })}
                  </>
                )}

                {/* 花朵 */}
                <motion.div
                  className="relative w-11 h-11 md:w-16 md:h-16 flex items-center justify-center"
                  animate={
                    isSelected
                      ? {
                          rotate: [0, 20, -20, 20, -20, 0],
                          scale: [1, 1.2, 1.15, 1.2, 1.15, 1],
                        }
                      : {}
                  }
                  transition={{
                    duration: 0.5,
                    repeat: isSelected ? Infinity : 0,
                  }}
                >
                  {/* 花瓣 */}
                  <div className="relative w-full h-full">
                    {[...Array(8)].map((_, petalIndex) => {
                      const petalAngle = (petalIndex / 8) * Math.PI * 2
                      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
                      const petalSize = isMobile ? 18 : 24
                      const petalDistance = isMobile ? 11 : 16

                      return (
                        <motion.div
                          key={petalIndex}
                          className="absolute top-1/2 left-1/2 rounded-full"
                          style={{
                            width: `${petalSize}px`,
                            height: `${petalSize}px`,
                            background: isSelected
                              ? 'linear-gradient(135deg, #d8b4fe, #c084fc, #a855f7)'
                              : 'linear-gradient(135deg, #c084fc, #a855f7, #9333ea)',
                            x: Math.cos(petalAngle) * petalDistance - petalSize / 2,
                            y: Math.sin(petalAngle) * petalDistance - petalSize / 2,
                            boxShadow: isSelected
                              ? '0 0 25px rgba(168, 85, 247, 1), inset 0 0 12px rgba(255, 255, 255, 0.4)'
                              : '0 4px 15px rgba(0, 0, 0, 0.5)',
                          }}
                          animate={
                            isSelected
                              ? {
                                  scale: [1, 1.3, 1],
                                  boxShadow: [
                                    '0 0 25px rgba(168, 85, 247, 1)',
                                    '0 0 35px rgba(168, 85, 247, 1)',
                                    '0 0 25px rgba(168, 85, 247, 1)',
                                  ],
                                }
                              : {}
                          }
                          transition={{
                            duration: 0.6,
                            repeat: isSelected ? Infinity : 0,
                            delay: petalIndex * 0.04,
                          }}
                        />
                      )
                    })}

                    {/* 花心 */}
                    <motion.div
                      className="absolute top-1/2 left-1/2 rounded-full"
                      style={{
                        width: typeof window !== 'undefined' && window.innerWidth < 768 ? '13px' : '18px',
                        height: typeof window !== 'undefined' && window.innerWidth < 768 ? '13px' : '18px',
                        transform: 'translate(-50%, -50%)',
                        background: isSelected
                          ? 'radial-gradient(circle, #fef9c3, #fef08a, #fbbf24, #f59e0b)'
                          : 'radial-gradient(circle, #fef08a, #fbbf24, #eab308)',
                        boxShadow: isSelected
                          ? '0 0 25px rgba(251, 191, 36, 1), inset 0 0 10px rgba(255, 255, 255, 0.6)'
                          : '0 3px 12px rgba(0, 0, 0, 0.5)',
                      }}
                      animate={
                        isSelected
                          ? {
                              scale: [1, 1.4, 1],
                              boxShadow: [
                                '0 0 25px rgba(251, 191, 36, 1)',
                                '0 0 40px rgba(251, 191, 36, 1)',
                                '0 0 25px rgba(251, 191, 36, 1)',
                              ],
                            }
                          : {}
                      }
                      transition={{
                        duration: 0.6,
                        repeat: isSelected ? Infinity : 0,
                      }}
                    />
                  </div>
                </motion.div>

                {/* 變形成卡片 */}
                {isTransforming && isSelected && (
                  <motion.div
                    className="absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2, duration: 0.6 }}
                  >
                    <motion.div
                      className="w-20 h-32 md:w-28 md:h-44 rounded-2xl"
                      style={{
                        background: 'linear-gradient(135deg, #7c3aed, #6d28d9, #5b21b6)',
                        boxShadow: '0 20px 60px rgba(124, 58, 237, 1), inset 0 0 40px rgba(255, 255, 255, 0.2)',
                      }}
                      initial={{ scale: 0, rotate: 0 }}
                      animate={{
                        scale: 1,
                        rotate: 1080,
                      }}
                      transition={{
                        duration: 0.8,
                        type: 'spring',
                        stiffness: 100,
                      }}
                    />
                  </motion.div>
                )}
              </motion.button>
            </motion.div>
          )
        })}
      </div>

      {/* 提示文字 */}
      {!isTransforming && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-sm md:text-base text-gray-400 text-center relative z-10"
        >
          點擊任意一朵花開始抽籤
        </motion.p>
      )}
    </motion.div>
  )
}

export default LandingPage
