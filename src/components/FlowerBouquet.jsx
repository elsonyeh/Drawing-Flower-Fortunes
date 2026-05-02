import { motion } from 'framer-motion'

export const BOUQUET_FLOWERS = [
  { id: 0, color: '#ff69b4' },
  { id: 1, color: '#F2BE5C' },
  { id: 2, color: '#f472b6' },
  { id: 3, color: '#F2A488' },
  { id: 4, color: '#fb7185' },
]

export const FLOWER_POSITIONS = [
  { angle: -25, stemHeight: 115, x: -45, curve1: 10, curve2: -6, mid: 0.52, yOffset: 15 },
  { angle: -10, stemHeight: 130, x: -20, curve1: -5, curve2: 7,  mid: 0.48, yOffset: 10 },
  { angle:   0, stemHeight: 140, x:   0, curve1:  4, curve2: -3, mid: 0.50, yOffset:  8 },
  { angle:  12, stemHeight: 145, x:  22, curve1: -5, curve2:  8, mid: 0.47, yOffset:  0 },
  { angle:  28, stemHeight: 125, x:  48, curve1: 10, curve2: -8, mid: 0.53, yOffset:  0 },
]

// 單朵花頭
export const FlowerHead = ({ color, size, isSelected, isTransforming, isHighlighted }) => {
  const petalCount = 8
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {[...Array(petalCount)].map((_, i) => {
        const angle = (i / petalCount) * Math.PI * 2
        const petalSize = size * 0.45
        const dist = size * 0.28
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: petalSize, height: petalSize,
              left: '50%', top: '50%',
              marginLeft: -petalSize / 2 + Math.cos(angle) * dist,
              marginTop:  -petalSize / 2 + Math.sin(angle) * dist,
            }}
            animate={
              isTransforming && isSelected
                ? { background: [color, '#fff'], opacity: [1, 1, 0], scale: [1, 1.3, 1.5] }
                : isSelected
                ? { background: color, boxShadow: `0 0 15px ${color}`, scale: [1, 1.1, 1] }
                : isHighlighted
                ? { background: color, boxShadow: '0 0 12px rgba(251,191,36,0.7)' }
                : { background: color, boxShadow: '0 3px 8px rgba(0,0,0,0.3)' }
            }
            transition={{ duration: isTransforming ? 0.2 : 0.5, repeat: isSelected && !isTransforming ? Infinity : 0 }}
          />
        )
      })}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size * 0.32, height: size * 0.32,
          left: '50%', top: '50%',
          marginLeft: -size * 0.16, marginTop: -size * 0.16,
        }}
        animate={
          isTransforming && isSelected
            ? { background: ['#ffd700', '#fff'], scale: [1, 2, 3], opacity: [1, 1, 0] }
            : isSelected
            ? { background: '#ffd700', boxShadow: '0 0 12px #ffd700', scale: [1, 1.15, 1] }
            : { background: 'radial-gradient(circle, #ffd700, #f59e0b)', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }
        }
        transition={{ duration: isTransforming ? 0.2 : 0.5, repeat: isSelected && !isTransforming ? Infinity : 0 }}
      />
    </div>
  )
}

// 單枝花（花 + 彎曲莖 + 葉子）
export const SingleFlower = ({ flower, position, index, isSelected, isTransforming, isHighlighted, onClick, isMobile }) => {
  const stemHeight = isMobile ? position.stemHeight * 0.7 : position.stemHeight
  const curve1    = isMobile ? position.curve1 * 0.7     : position.curve1
  const curve2    = isMobile ? position.curve2 * 0.7     : position.curve2
  const midPoint  = position.mid
  const flowerSize = isMobile ? 52 : 68
  const stemEndX   = 30 + curve2 * 0.3
  // 用 prefix 避免多處渲染時 SVG gradient id 衝突
  const idPrefix = isMobile ? 'sm' : 'lg'

  return (
    <motion.div
      className="absolute"
      style={{ left: '50%', bottom: position.yOffset || 0, zIndex: 10, transformOrigin: 'bottom center' }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        x: isMobile ? position.x * 0.7 : position.x,
        rotate: isTransforming && isSelected ? 0 : position.angle,
        scale: isTransforming && !isSelected ? 0.85 : 1,
        opacity: isTransforming ? (isSelected ? 1 : 0) : 1,
      }}
      transition={{ delay: isTransforming ? 0 : index * 0.06, duration: isTransforming ? 0.15 : 0.6, type: 'spring', stiffness: 150 }}
    >
      <motion.div
        className="relative"
        style={{ width: 60, height: stemHeight, marginLeft: -30 }}
        animate={{ opacity: isTransforming && isSelected ? 0 : 1, y: isTransforming && isSelected ? -10 : 0 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
      >
        <svg width="60" height={stemHeight} viewBox={`0 0 60 ${stemHeight}`} style={{ position: 'absolute', overflow: 'visible' }}>
          <defs>
            <linearGradient id={`stem-${idPrefix}-${index}`} x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%"   stopColor="#15803d" />
              <stop offset="50%"  stopColor="#22c55e" />
              <stop offset="100%" stopColor="#86efac" />
            </linearGradient>
          </defs>
          <path
            d={`M 30 ${stemHeight} C ${30+curve1*2} ${stemHeight*(1-midPoint*0.4)}, ${30+curve1*1.5+curve2*0.5} ${stemHeight*(1-midPoint)}, ${30+curve2*0.8} ${stemHeight*0.35} S ${stemEndX} ${stemHeight*0.12}, ${stemEndX} 5`}
            fill="none" stroke={`url(#stem-${idPrefix}-${index})`}
            strokeWidth={isMobile ? 4 : 5} strokeLinecap="round"
          />
        </svg>

        {/* 葉子 1 */}
        <motion.div
          className="absolute"
          style={{
            width: isMobile ? 12 : 15, height: isMobile ? 18 : 24,
            left: 30 + curve1 * 0.8 + (curve1 > 0 ? 2 : -14), top: stemHeight * 0.25,
            background: 'linear-gradient(140deg, #86efac, #22c55e, #15803d)',
            borderRadius: curve1 > 0 ? '0 80% 0 80%' : '80% 0 80% 0',
            transformOrigin: curve1 > 0 ? 'left center' : 'right center',
          }}
          animate={{ rotate: curve1 > 0 ? [5, 12, 5] : [-5, -12, -5], opacity: isTransforming && isSelected ? 0 : 1, y: isTransforming && isSelected ? -8 : 0 }}
          transition={{ rotate: { duration: 3, repeat: Infinity }, opacity: { duration: 0.15 }, y: { duration: 0.15 } }}
        />

        {/* 葉子 2 */}
        <motion.div
          className="absolute"
          style={{
            width: isMobile ? 10 : 13, height: isMobile ? 16 : 20,
            left: 30 + curve1 * 0.4 + (curve1 > 0 ? -14 : 3), top: stemHeight * 0.48,
            background: 'linear-gradient(220deg, #86efac, #22c55e, #15803d)',
            borderRadius: curve1 > 0 ? '80% 0 80% 0' : '0 80% 0 80%',
            transformOrigin: curve1 > 0 ? 'right center' : 'left center',
          }}
          animate={{ rotate: curve1 > 0 ? [-6, -14, -6] : [6, 14, 6], opacity: isTransforming && isSelected ? 0 : 1, y: isTransforming && isSelected ? -8 : 0 }}
          transition={{ rotate: { duration: 3.5, repeat: Infinity, delay: 0.3 }, opacity: { duration: 0.15 }, y: { duration: 0.15 } }}
        />

        {/* 花朵 */}
        <motion.div
          className="absolute flex items-center justify-center"
          style={{ top: -flowerSize/2+5, left: stemEndX-flowerSize/2+10, width: flowerSize, height: flowerSize }}
          animate={isTransforming && isSelected ? { scale: [1, 2.2, 3.5], opacity: [1, 1, 0] } : {}}
          transition={{ duration: 0.22, times: [0, 0.45, 1], ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.button
            onClick={onClick}
            disabled={isTransforming}
            className="focus:outline-none"
            whileHover={!isTransforming ? { scale: 1.15 } : {}}
            whileTap={!isTransforming ? { scale: 0.95 } : {}}
          >
            {isHighlighted && (
              <motion.div
                className="absolute inset-[-10px] rounded-full pointer-events-none"
                animate={{ opacity: [0, 0.6, 0.4, 0.6, 0], scale: [1, 1.4, 1.2, 1.4, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ boxShadow: '0 0 25px rgba(251,191,36,0.9), 0 0 40px rgba(251,191,36,0.5)' }}
              />
            )}
            {isSelected && isTransforming && (
              <>
                <motion.div
                  className="absolute inset-[-20px] rounded-full pointer-events-none"
                  initial={{ scale: 2.5, opacity: 0 }}
                  animate={{ scale: [2.5,1,1,1], opacity: [0,0.8,0.8,0] }}
                  transition={{ duration: 2.8, times: [0,0.3,0.65,1] }}
                  style={{ background: 'radial-gradient(circle, rgba(242,126,147,0.8), transparent 70%)', filter: 'blur(15px)' }}
                />
                {[0,1,2].map(i => (
                  <motion.div
                    key={i}
                    className="absolute inset-[-12px] rounded-full border-2 pointer-events-none"
                    style={{ borderColor: 'rgba(242,190,92,0.6)' }}
                    initial={{ scale: 1, opacity: 0 }}
                    animate={{ scale: [1, 4.5], opacity: [0.8, 0] }}
                    transition={{ duration: 1.4, delay: i * 0.3 }}
                  />
                ))}
                <motion.div
                  className="absolute inset-[-15px] rounded-full bg-white pointer-events-none"
                  initial={{ scale: 1, opacity: 0 }}
                  animate={{ scale: [1,1,1,10,20,30], opacity: [0,0,0,0.8,1,1] }}
                  transition={{ duration: 2.8, times: [0,0.55,0.55,0.75,0.9,1] }}
                  style={{ filter: 'blur(35px)' }}
                />
              </>
            )}
            {isSelected && !isTransforming && (
              <motion.div
                className="absolute inset-[-12px] rounded-full pointer-events-none"
                animate={{ scale: [1,2,1], opacity: [0.7,0,0.7] }}
                transition={{ duration: 1, repeat: Infinity }}
                style={{ boxShadow: '0 0 45px rgba(242,126,147,0.9)' }}
              />
            )}
            <motion.div
              animate={isTransforming ? { scale: 1 } : { scale: [1, 1.05, 1] }}
              transition={{ duration: 2.4 + index * 0.35, repeat: Infinity, ease: 'easeInOut', delay: index * 0.48 }}
            >
              <FlowerHead color={flower.color} size={flowerSize} isSelected={isSelected} isTransforming={isTransforming} isHighlighted={isHighlighted} />
            </motion.div>
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

// 台灣竹編花籃
export const BambooBasket = ({ isMobile, isTransforming }) => (
  <motion.div
    className="relative"
    style={{ zIndex: 5 }}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: isTransforming ? 0 : 1, scale: isTransforming ? 0.92 : 1, y: isTransforming ? 10 : 0 }}
    transition={{ duration: 0.18, ease: 'easeOut' }}
  >
    <svg width={isMobile ? 180 : 220} height={isMobile ? 100 : 125} viewBox="0 0 180 100">
      <defs>
        <linearGradient id="bambooLight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D4A574"/><stop offset="100%" stopColor="#B8956E"/>
        </linearGradient>
        <linearGradient id="bambooDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B6914"/><stop offset="100%" stopColor="#7A5C3C"/>
        </linearGradient>
        <linearGradient id="bambooMid" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#C9A66B"/><stop offset="100%" stopColor="#A67C52"/>
        </linearGradient>
        <radialGradient id="soilGrad" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#5C4033"/><stop offset="100%" stopColor="#3D2914"/>
        </radialGradient>
        <linearGradient id="redRibbon" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8B0000"/><stop offset="30%" stopColor="#DC143C"/>
          <stop offset="50%" stopColor="#FF4500"/><stop offset="70%" stopColor="#DC143C"/>
          <stop offset="100%" stopColor="#8B0000"/>
        </linearGradient>
      </defs>
      <ellipse cx="90" cy="96" rx="68" ry="5" fill="rgba(0,0,0,0.15)"/>
      <path d="M90 94 C 38 94, 22 82, 22 62 C 22 42, 35 26, 55 22 L 125 22 C 145 26, 158 42, 158 62 C 158 82, 142 94, 90 94 Z" fill="url(#bambooMid)" stroke="#7A5C3C" strokeWidth="1.5"/>
      {[0,1,2,3,4,5].map(i => <path key={`h-${i}`} d={`M ${28+i*2} ${30+i*11} Q 90 ${26+i*11}, ${152-i*2} ${30+i*11}`} fill="none" stroke={i%2===0?"#B8956E":"#8B6914"} strokeWidth="2.5" opacity="0.6"/>)}
      {[0,1,2,3,4,5,6,7].map(i => <path key={`d-${i}`} d={`M ${22+i*20} 24 Q ${30+i*19} 58, ${34+i*17} 92`} fill="none" stroke={i%2===0?"url(#bambooLight)":"url(#bambooDark)"} strokeWidth="3" opacity="0.5"/>)}
      <ellipse cx="90" cy="23" rx="60" ry="9" fill="none" stroke="#A67C52" strokeWidth="6"/>
      <ellipse cx="90" cy="23" rx="60" ry="9" fill="none" stroke="#C9A66B" strokeWidth="3"/>
      <ellipse cx="90" cy="22" rx="54" ry="7" fill="url(#soilGrad)"/>
      <ellipse cx="90" cy="50" rx="10" ry="7" fill="url(#redRibbon)"/>
      <ellipse cx="90" cy="50" rx="4" ry="3" fill="#8B0000"/>
      <path d="M80 50 Q 68 44, 60 50 Q 68 56, 80 50" fill="url(#redRibbon)"/>
      <path d="M100 50 Q 112 44, 120 50 Q 112 56, 100 50" fill="url(#redRibbon)"/>
      <path d="M86 57 Q 82 68, 78 80 Q 76 85, 80 83 Q 84 78, 88 60" fill="url(#redRibbon)" opacity="0.9"/>
      <path d="M94 57 Q 98 68, 102 80 Q 104 85, 100 83 Q 96 78, 92 60" fill="url(#redRibbon)" opacity="0.9"/>
      <path d="M38 32 Q 42 50, 40 70" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  </motion.div>
)
