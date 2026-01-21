import { motion } from 'framer-motion'
import { useState } from 'react'

const PetalSelection = ({ onSelect }) => {
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [isTransforming, setIsTransforming] = useState(false)

  // 創建 7 枝花的位置
  const flowers = Array.from({ length: 7 }, (_, i) => {
    const angle = (i / 7) * Math.PI * 2 - Math.PI / 2 // 從上方開始
    const radius = 180 // 圓形半徑
    return {
      id: i,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      rotate: (angle * 180) / Math.PI + 90,
    }
  })

  const handleFlowerClick = (index) => {
    if (isTransforming) return

    setSelectedIndex(index)
    setIsTransforming(true)

    // 2秒後開始變成卡片並觸發抽卡
    setTimeout(() => {
      onSelect()
    }, 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
    >
      {/* 標題 */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-16"
      >
        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">
          選擇一朵花
        </h2>
        <p className="text-xl text-primary-300">
          憑直覺選擇，感受花的呼喚
        </p>
      </motion.div>

      {/* 花朵圓圈 */}
      <div className="relative w-[400px] h-[400px] flex items-center justify-center">
        {flowers.map((flower, index) => {
          const isSelected = selectedIndex === index

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
                x: isTransforming && isSelected ? 0 : flower.x,
                y: isTransforming && isSelected ? 0 : flower.y,
                scale: isTransforming && isSelected ? 2 : 1,
                opacity: isTransforming ? (isSelected ? 1 : 0) : 1,
                rotate: isTransforming && isSelected ? 0 : flower.rotate,
              }}
              transition={{
                delay: isTransforming ? 0 : index * 0.1,
                duration: isTransforming ? 1.5 : 0.5,
                type: isTransforming ? 'spring' : 'spring',
              }}
            >
              <motion.button
                onClick={() => handleFlowerClick(index)}
                disabled={isTransforming}
                className="relative"
                whileHover={!isTransforming ? { scale: 1.2 } : {}}
                whileTap={!isTransforming ? { scale: 0.95 } : {}}
              >
                {/* 發光效果 */}
                {isSelected && (
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    animate={{
                      boxShadow: [
                        '0 0 20px rgba(139, 92, 246, 0.6)',
                        '0 0 40px rgba(139, 92, 246, 0.8)',
                        '0 0 60px rgba(139, 92, 246, 1)',
                        '0 0 40px rgba(139, 92, 246, 0.8)',
                        '0 0 20px rgba(139, 92, 246, 0.6)',
                      ],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                    }}
                  />
                )}

                {/* 花朵 */}
                <motion.div
                  className="relative w-16 h-16 flex items-center justify-center"
                  animate={
                    isSelected
                      ? {
                          rotate: [0, 10, -10, 10, -10, 0],
                          scale: [1, 1.1, 1.05, 1.1, 1.05, 1],
                        }
                      : {}
                  }
                  transition={{
                    duration: 0.8,
                    repeat: isSelected ? Infinity : 0,
                  }}
                >
                  {/* 花瓣 */}
                  <div className="relative w-full h-full">
                    {[...Array(8)].map((_, petalIndex) => {
                      const petalAngle = (petalIndex / 8) * Math.PI * 2
                      return (
                        <motion.div
                          key={petalIndex}
                          className="absolute top-1/2 left-1/2 w-6 h-6 rounded-full"
                          style={{
                            background: isSelected
                              ? 'linear-gradient(135deg, #a78bfa, #8b5cf6)'
                              : 'linear-gradient(135deg, #9333ea, #7c3aed)',
                            x: Math.cos(petalAngle) * 16 - 12,
                            y: Math.sin(petalAngle) * 16 - 12,
                            boxShadow: isSelected
                              ? '0 0 20px rgba(139, 92, 246, 0.8)'
                              : '0 4px 10px rgba(0, 0, 0, 0.3)',
                          }}
                        />
                      )
                    })}

                    {/* 花心 */}
                    <div
                      className="absolute top-1/2 left-1/2 w-4 h-4 rounded-full -translate-x-1/2 -translate-y-1/2"
                      style={{
                        background: isSelected
                          ? 'radial-gradient(circle, #fef3c7, #fbbf24)'
                          : 'radial-gradient(circle, #fef08a, #eab308)',
                        boxShadow: isSelected
                          ? '0 0 15px rgba(251, 191, 36, 0.8)'
                          : '0 2px 8px rgba(0, 0, 0, 0.3)',
                      }}
                    />
                  </div>
                </motion.div>
              </motion.button>

              {/* 變形成卡片 */}
              {isTransforming && isSelected && (
                <motion.div
                  className="absolute inset-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1, duration: 0.5 }}
                >
                  <motion.div
                    className="w-32 h-48 rounded-2xl"
                    style={{
                      background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                      boxShadow: '0 10px 40px rgba(124, 58, 237, 0.6)',
                    }}
                    initial={{ scale: 0, rotate: 0 }}
                    animate={{ scale: 1, rotate: 360 }}
                    transition={{ duration: 1, type: 'spring' }}
                  />
                </motion.div>
              )}
            </motion.div>
          )
        })}

        {/* 中心裝飾 */}
        <motion.div
          className="absolute w-2 h-2 rounded-full bg-primary-400"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        />
      </div>

      {/* 提示文字 */}
      {!isTransforming && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-16 text-primary-300 text-lg"
        >
          點擊任意一朵花開始抽籤
        </motion.p>
      )}
    </motion.div>
  )
}

export default PetalSelection
