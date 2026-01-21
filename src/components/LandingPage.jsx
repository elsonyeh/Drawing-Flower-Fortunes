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
      {/* Petal shape using CSS */}
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

const LandingPage = ({ onDraw, onOpenCollection }) => {
  const [particles, setParticles] = useState([])
  const [petals, setPetals] = useState([])

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

    // Generate many floating petals (50-80 petals)
    const newPetals = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 10,
      duration: Math.random() * 8 + 6, // 6-14 seconds
      size: Math.random() * 12 + 8, // 8-20px
      rotation: (Math.random() - 0.5) * 720, // -360 to 360 degrees
    }))
    setPetals(newPetals)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden"
    >
      {/* Collection button in top right */}
      <motion.button
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        onClick={onOpenCollection}
        className="absolute top-6 right-6 z-20 px-4 py-2 bg-gradient-to-r from-primary-600/80 to-pink-600/80 backdrop-blur-sm rounded-full text-white font-medium flex items-center gap-2 border border-primary-400/30 shadow-lg"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <CollectionIcon className="w-5 h-5" color="white" />
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
      <div className="absolute inset-0 overflow-hidden">
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

      {/* Main content */}
      <div className="relative z-10 text-center">
        <motion.h1
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-6xl md:text-7xl font-bold mb-4 text-gradient glow"
        >
          埕花
        </motion.h1>

        <motion.p
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl md:text-2xl text-primary-200 mb-2"
        >
          鹽夏不夜埕
        </motion.p>

        <motion.p
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-lg md:text-xl text-gray-300 mb-16"
        >
          讓花語成為今日的指引
        </motion.p>

        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 0.5,
            delay: 0.8,
            type: 'spring',
            stiffness: 200,
          }}
        >
          <motion.button
            onClick={onDraw}
            className="relative px-12 py-4 text-xl font-medium text-white bg-gradient-to-r from-primary-500 to-pink-500 rounded-full shadow-lg overflow-hidden group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="relative z-10">抽出今夜的花語</span>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500"
              initial={{ x: '-100%' }}
              whileHover={{ x: 0 }}
              transition={{ duration: 0.3 }}
            />
          </motion.button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="mt-8 text-sm text-gray-400"
        >
          帶你走進屬於自己的鹽埕夜晚
        </motion.p>
      </div>

    </motion.div>
  )
}

export default LandingPage
