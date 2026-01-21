import { motion } from 'framer-motion'

// Generate unique pattern for each flower based on its color and model
const CardBack = ({ flower, className = '' }) => {
  const isSSR = flower?.rarity === 'ssr'
  const color = flower?.color || '#FFB7C5'
  const gradientColors = flower?.gradientColors || [color, color, color]

  // Different patterns for SSR vs common
  if (isSSR) {
    return (
      <div className={`relative w-full h-full ${className}`}>
        {/* SSR Golden animated background */}
        <div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: `linear-gradient(135deg, ${gradientColors[0]}, ${gradientColors[1]}, ${gradientColors[2]})`,
          }}
        >
          {/* Sparkle particles */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          {/* Golden border pattern */}
          <div className="absolute inset-4 border-2 border-yellow-200/50 rounded-xl" />
          <div className="absolute inset-6 border border-yellow-100/30 rounded-lg" />

          {/* Center ornate pattern */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="text-6xl opacity-30"
              animate={{
                rotate: 360,
                scale: [1, 1.1, 1],
              }}
              transition={{
                rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
                scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
              }}
            >
              ✦
            </motion.div>
          </div>

          {/* SSR Badge */}
          <div className="absolute top-3 right-3 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full text-xs font-bold text-white shadow-lg">
            SSR
          </div>
        </div>
      </div>
    )
  }

  // Common card back - unique pattern based on flower
  // Use same color as card front for consistency
  return (
    <div className={`relative w-full h-full ${className}`}>
      <div
        className="absolute inset-0 rounded-2xl"
        style={{
          background: `linear-gradient(135deg, ${color}, ${color}dd)`,
        }}
      >
        {/* Pattern overlay based on flower type */}
        <svg className="absolute inset-0 w-full h-full opacity-15" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id={`pattern-${flower?.id}`} x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="2" fill="white" />
              <circle cx="10" cy="10" r="1.5" fill="white" />
              <circle cx="30" cy="10" r="1.5" fill="white" />
              <circle cx="10" cy="30" r="1.5" fill="white" />
              <circle cx="30" cy="30" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#pattern-${flower?.id})`} />
        </svg>

        {/* Border */}
        <div
          className="absolute inset-4 border-2 rounded-xl opacity-40"
          style={{ borderColor: 'rgba(255, 255, 255, 0.6)' }}
        />

        {/* Center flower symbol */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="text-5xl opacity-50"
            style={{ color: 'white' }}
            animate={{
              scale: [1, 1.05, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            ✿
          </motion.div>
        </div>

        {/* Corner decorations */}
        <div className="absolute top-2 left-2 text-xl opacity-40" style={{ color: 'white' }}>❀</div>
        <div className="absolute top-2 right-2 text-xl opacity-40" style={{ color: 'white' }}>❀</div>
        <div className="absolute bottom-2 left-2 text-xl opacity-40" style={{ color: 'white' }}>❀</div>
        <div className="absolute bottom-2 right-2 text-xl opacity-40" style={{ color: 'white' }}>❀</div>
      </div>
    </div>
  )
}

export default CardBack
