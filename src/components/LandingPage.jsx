import { motion, useAnimation } from 'framer-motion'
import { useState, useEffect, useRef, useCallback } from 'react'
import CollectionIcon from './CollectionIcon'

// 花束配置 - 5種不同的花
const BOUQUET_FLOWERS = [
  { id: 0, color: '#ff69b4' },  // 粉紅
  { id: 1, color: '#c084fc' },  // 紫色
  { id: 2, color: '#f472b6' },  // 玫瑰粉
  { id: 3, color: '#a78bfa' },  // 淡紫
  { id: 4, color: '#fb7185' },  // 珊瑚粉
]

// 每枝花的位置配置 - 5枝花，莖從花盆土壤開始
const FLOWER_POSITIONS = [
  { angle: -25, stemHeight: 115, x: -45, curve1: 10, curve2: -6, mid: 0.52, yOffset: 15 },  // 左外 - 往上移
  { angle: -10, stemHeight: 130, x: -20, curve1: -5, curve2: 7, mid: 0.48, yOffset: 10 },   // 左內 - 往上移
  { angle: 0, stemHeight: 140, x: 0, curve1: 4, curve2: -3, mid: 0.5, yOffset: 8 },         // 中央 - 往上移
  { angle: 12, stemHeight: 145, x: 22, curve1: -5, curve2: 8, mid: 0.47, yOffset: 0 },      // 右內
  { angle: 28, stemHeight: 125, x: 48, curve1: 10, curve2: -8, mid: 0.53, yOffset: 0 },     // 右外
]

// 背景飄落花瓣
const FloatingPetal = ({ delay, x, duration, size, rotation }) => (
  <motion.div
    className="absolute pointer-events-none"
    style={{ left: `${x}%`, top: '-10%' }}
    initial={{ y: 0, rotate: 0, opacity: 0 }}
    animate={{
      y: ['0vh', '110vh'],
      rotate: [0, rotation, rotation * 2],
      opacity: [0, 1, 1, 0],
      x: [0, Math.sin(x) * 50, Math.sin(x * 2) * 30],
    }}
    transition={{ duration, delay, repeat: Infinity, ease: 'linear' }}
  >
    <div
      className="rounded-full"
      style={{
        width: size,
        height: size * 1.5,
        background: 'radial-gradient(ellipse at center, rgba(255,183,197,0.8), rgba(255,105,180,0.4))',
        clipPath: 'ellipse(50% 60% at 50% 40%)',
        filter: 'blur(0.5px)',
      }}
    />
  </motion.div>
)

// 單朵花組件
const FlowerHead = ({ color, size, isSelected, isTransforming, isHighlighted }) => {
  const petalCount = 8

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* 花瓣 */}
      {[...Array(petalCount)].map((_, i) => {
        const angle = (i / petalCount) * Math.PI * 2
        const petalSize = size * 0.45
        const dist = size * 0.28
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: petalSize,
              height: petalSize,
              left: '50%',
              top: '50%',
              marginLeft: -petalSize / 2 + Math.cos(angle) * dist,
              marginTop: -petalSize / 2 + Math.sin(angle) * dist,
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
            transition={{
              duration: isTransforming ? 2.8 : 0.5,
              repeat: isSelected && !isTransforming ? Infinity : 0,
            }}
          />
        )
      })}
      {/* 花蕊 */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size * 0.32,
          height: size * 0.32,
          left: '50%',
          top: '50%',
          marginLeft: -size * 0.16,
          marginTop: -size * 0.16,
        }}
        animate={
          isTransforming && isSelected
            ? { background: ['#ffd700', '#fff'], scale: [1, 1.5, 2], opacity: [1, 1, 0] }
            : isSelected
            ? { background: '#ffd700', boxShadow: '0 0 12px #ffd700', scale: [1, 1.15, 1] }
            : { background: 'radial-gradient(circle, #ffd700, #f59e0b)', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }
        }
        transition={{
          duration: isTransforming ? 2.8 : 0.5,
          repeat: isSelected && !isTransforming ? Infinity : 0,
        }}
      />
    </div>
  )
}

// 單枝花組件（花 + 彎曲莖 + 葉子）
const SingleFlower = ({ flower, position, index, isSelected, isTransforming, isHighlighted, onClick, isMobile }) => {
  const stemHeight = isMobile ? position.stemHeight * 0.7 : position.stemHeight
  const curve1 = isMobile ? position.curve1 * 0.7 : position.curve1
  const curve2 = isMobile ? position.curve2 * 0.7 : position.curve2
  const midPoint = position.mid
  const flowerSize = isMobile ? 52 : 68

  const stemEndX = 30 + curve2 * 0.3

  return (
    <motion.div
      className="absolute"
      style={{
        left: '50%',
        bottom: position.yOffset || 0, // 可個別調整垂直位置
        zIndex: 10, // 莖在花盆上面
        transformOrigin: 'bottom center',
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        x: isMobile ? position.x * 0.7 : position.x,
        rotate: isTransforming && isSelected ? 0 : position.angle,
        scale: 1,
        opacity: isTransforming ? (isSelected ? 1 : 0) : 1,
      }}
      transition={{
        delay: isTransforming ? 0 : index * 0.06,
        duration: 0.6,
        type: 'spring',
        stiffness: 150,
      }}
    >
      {/* 彎曲花莖 SVG */}
      <motion.div
        className="relative"
        style={{ width: 60, height: stemHeight, marginLeft: -30 }}
        animate={{ opacity: isTransforming && isSelected ? [1, 1, 0] : 1 }}
        transition={{ duration: 2.8, times: [0, 0.4, 0.6] }}
      >
        <svg
          width="60"
          height={stemHeight}
          viewBox={`0 0 60 ${stemHeight}`}
          style={{ position: 'absolute', overflow: 'visible' }}
        >
          <defs>
            <linearGradient id={`stem-${index}`} x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#15803d" />
              <stop offset="50%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#86efac" />
            </linearGradient>
          </defs>
          <path
            d={`M 30 ${stemHeight}
                C ${30 + curve1 * 2} ${stemHeight * (1 - midPoint * 0.4)},
                  ${30 + curve1 * 1.5 + curve2 * 0.5} ${stemHeight * (1 - midPoint)},
                  ${30 + curve2 * 0.8} ${stemHeight * 0.35}
                S ${stemEndX} ${stemHeight * 0.12}, ${stemEndX} 5`}
            fill="none"
            stroke={`url(#stem-${index})`}
            strokeWidth={isMobile ? 4 : 5}
            strokeLinecap="round"
          />
        </svg>

        {/* 葉子 1 - 上方 */}
        <motion.div
          className="absolute"
          style={{
            width: isMobile ? 12 : 15,
            height: isMobile ? 18 : 24,
            left: 30 + curve1 * 0.8 + (curve1 > 0 ? 2 : -14),
            top: stemHeight * 0.25,
            background: 'linear-gradient(140deg, #86efac, #22c55e, #15803d)',
            borderRadius: curve1 > 0 ? '0 80% 0 80%' : '80% 0 80% 0',
            transformOrigin: curve1 > 0 ? 'left center' : 'right center',
          }}
          animate={{
            rotate: curve1 > 0 ? [5, 12, 5] : [-5, -12, -5],
            opacity: isTransforming && isSelected ? [1, 1, 0] : 1
          }}
          transition={{ rotate: { duration: 3, repeat: Infinity }, opacity: { duration: 2.8 } }}
        />

        {/* 葉子 2 - 下方 */}
        <motion.div
          className="absolute"
          style={{
            width: isMobile ? 10 : 13,
            height: isMobile ? 16 : 20,
            left: 30 + curve1 * 0.4 + (curve1 > 0 ? -14 : 3),
            top: stemHeight * 0.48,
            background: 'linear-gradient(220deg, #86efac, #22c55e, #15803d)',
            borderRadius: curve1 > 0 ? '80% 0 80% 0' : '0 80% 0 80%',
            transformOrigin: curve1 > 0 ? 'right center' : 'left center',
          }}
          animate={{
            rotate: curve1 > 0 ? [-6, -14, -6] : [6, 14, 6],
            opacity: isTransforming && isSelected ? [1, 1, 0] : 1
          }}
          transition={{ rotate: { duration: 3.5, repeat: Infinity, delay: 0.3 }, opacity: { duration: 2.8 } }}
        />

        {/* 花朵 */}
        <motion.div
          className="absolute flex items-center justify-center"
          style={{
            top: -flowerSize / 2 + 5,
            left: stemEndX - flowerSize / 2 + 10,
            width: flowerSize,
            height: flowerSize,
          }}
          animate={isTransforming && isSelected ? {
            x: isMobile ? -position.x * 0.7 : -position.x,
            y: -stemHeight * 0.4,
            scale: [1, 1.8, 2.8, 3.2],
          } : {}}
          transition={{ duration: 2.8, times: [0, 0.3, 0.6, 1] }}
        >
          <motion.button
            onClick={onClick}
            disabled={isTransforming}
            className="focus:outline-none"
            whileHover={!isTransforming ? { scale: 1.15 } : {}}
            whileTap={!isTransforming ? { scale: 0.95 } : {}}
          >
            {/* 螢火蟲高亮 */}
            {isHighlighted && (
              <motion.div
                className="absolute inset-[-10px] rounded-full pointer-events-none"
                animate={{ opacity: [0, 0.6, 0.4, 0.6, 0], scale: [1, 1.4, 1.2, 1.4, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ boxShadow: '0 0 25px rgba(251,191,36,0.9), 0 0 40px rgba(251,191,36,0.5)' }}
              />
            )}

            {/* 選中特效 */}
            {isSelected && isTransforming && (
              <>
                <motion.div
                  className="absolute inset-[-20px] rounded-full pointer-events-none"
                  initial={{ scale: 2.5, opacity: 0 }}
                  animate={{ scale: [2.5, 1, 1, 1], opacity: [0, 0.8, 0.8, 0] }}
                  transition={{ duration: 2.8, times: [0, 0.3, 0.65, 1] }}
                  style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.8), transparent 70%)', filter: 'blur(15px)' }}
                />
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="absolute inset-[-12px] rounded-full border-2 border-purple-400 pointer-events-none"
                    initial={{ scale: 1, opacity: 0 }}
                    animate={{ scale: [1, 4.5], opacity: [0.8, 0] }}
                    transition={{ duration: 1.4, delay: i * 0.3 }}
                  />
                ))}
                <motion.div
                  className="absolute inset-[-15px] rounded-full bg-white pointer-events-none"
                  initial={{ scale: 1, opacity: 0 }}
                  animate={{ scale: [1, 1, 1, 10, 20, 30], opacity: [0, 0, 0, 0.8, 1, 1] }}
                  transition={{ duration: 2.8, times: [0, 0.55, 0.55, 0.75, 0.9, 1] }}
                  style={{ filter: 'blur(35px)' }}
                />
              </>
            )}

            {isSelected && !isTransforming && (
              <motion.div
                className="absolute inset-[-12px] rounded-full pointer-events-none"
                animate={{ scale: [1, 2, 1], opacity: [0.7, 0, 0.7] }}
                transition={{ duration: 1, repeat: Infinity }}
                style={{ boxShadow: '0 0 45px rgba(168,85,247,1)' }}
              />
            )}

            <FlowerHead
              color={flower.color}
              size={flowerSize}
              isSelected={isSelected}
              isTransforming={isTransforming}
              isHighlighted={isHighlighted}
            />
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

// 台灣竹編花籃
const BambooBasket = ({ isMobile, isTransforming }) => (
  <motion.div
    className="relative"
    style={{ zIndex: 5 }} // 花盆 z-index 比莖低
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: isTransforming ? 0.3 : 1, scale: 1 }}
    transition={{ duration: 0.8, delay: 0.3 }}
  >
    <svg
      width={isMobile ? 180 : 220}
      height={isMobile ? 100 : 125}
      viewBox="0 0 180 100"
    >
      <defs>
        <linearGradient id="bambooLight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D4A574" />
          <stop offset="100%" stopColor="#B8956E" />
        </linearGradient>
        <linearGradient id="bambooDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B6914" />
          <stop offset="100%" stopColor="#7A5C3C" />
        </linearGradient>
        <linearGradient id="bambooMid" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#C9A66B" />
          <stop offset="100%" stopColor="#A67C52" />
        </linearGradient>
        <radialGradient id="soilGrad" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#5C4033" />
          <stop offset="100%" stopColor="#3D2914" />
        </radialGradient>
        <linearGradient id="redRibbon" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8B0000" />
          <stop offset="30%" stopColor="#DC143C" />
          <stop offset="50%" stopColor="#FF4500" />
          <stop offset="70%" stopColor="#DC143C" />
          <stop offset="100%" stopColor="#8B0000" />
        </linearGradient>
      </defs>

      {/* 籃子陰影 */}
      <ellipse cx="90" cy="96" rx="68" ry="5" fill="rgba(0,0,0,0.15)" />

      {/* 籃子主體 */}
      <path
        d="M90 94 C 38 94, 22 82, 22 62 C 22 42, 35 26, 55 22 L 125 22 C 145 26, 158 42, 158 62 C 158 82, 142 94, 90 94 Z"
        fill="url(#bambooMid)"
        stroke="#7A5C3C"
        strokeWidth="1.5"
      />

      {/* 竹編橫紋 */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <path
          key={`h-${i}`}
          d={`M ${28 + i * 2} ${30 + i * 11} Q 90 ${26 + i * 11}, ${152 - i * 2} ${30 + i * 11}`}
          fill="none"
          stroke={i % 2 === 0 ? "#B8956E" : "#8B6914"}
          strokeWidth="2.5"
          opacity="0.6"
        />
      ))}

      {/* 竹編斜紋 */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <path
          key={`d-${i}`}
          d={`M ${22 + i * 20} 24 Q ${30 + i * 19} 58, ${34 + i * 17} 92`}
          fill="none"
          stroke={i % 2 === 0 ? "url(#bambooLight)" : "url(#bambooDark)"}
          strokeWidth="3"
          opacity="0.5"
        />
      ))}

      {/* 籃口邊緣 */}
      <ellipse cx="90" cy="23" rx="60" ry="9" fill="none" stroke="#A67C52" strokeWidth="6" />
      <ellipse cx="90" cy="23" rx="60" ry="9" fill="none" stroke="#C9A66B" strokeWidth="3" />

      {/* 土壤 */}
      <ellipse cx="90" cy="22" rx="54" ry="7" fill="url(#soilGrad)" />

      {/* 紅色蝴蝶結 */}
      <ellipse cx="90" cy="50" rx="10" ry="7" fill="url(#redRibbon)" />
      <ellipse cx="90" cy="50" rx="4" ry="3" fill="#8B0000" />
      <path d="M80 50 Q 68 44, 60 50 Q 68 56, 80 50" fill="url(#redRibbon)" />
      <path d="M100 50 Q 112 44, 120 50 Q 112 56, 100 50" fill="url(#redRibbon)" />

      {/* 緞帶尾巴 */}
      <path d="M86 57 Q 82 68, 78 80 Q 76 85, 80 83 Q 84 78, 88 60" fill="url(#redRibbon)" opacity="0.9" />
      <path d="M94 57 Q 98 68, 102 80 Q 104 85, 100 83 Q 96 78, 92 60" fill="url(#redRibbon)" opacity="0.9" />

      {/* 高光 */}
      <path d="M38 32 Q 42 50, 40 70" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  </motion.div>
)

// 主組件
const LandingPage = ({ onPetalSelect, onOpenCollection, onEmotionScan, onOpenAuth, onQRScan, user, exhibitionMode }) => {
  const [particles, setParticles] = useState([])
  const [petals, setPetals] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [isTransforming, setIsTransforming] = useState(false)
  const [fireflyTarget, setFireflyTarget] = useState(0)
  const [fireflyArrived, setFireflyArrived] = useState(null)
  const [showFirefly, setShowFirefly] = useState(true)
  const fireflyControls = useAnimation()
  const fireflyPosRef = useRef({ x: 0, y: 0 })

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  // 螢幕高度 < 700px（iPhone SE、小型 Android）需要更緊湊的佈局
  const isSmallScreen = typeof window !== 'undefined' && window.innerHeight < 700

  // 螢火蟲目標位置
  const getFireflyTarget = useCallback((idx) => {
    const pos = FLOWER_POSITIONS[idx]
    const scale = isMobile ? 0.7 : 1
    return {
      x: pos.x * scale,
      y: -(pos.stemHeight * scale) - 20,
    }
  }, [isMobile])

  useEffect(() => {
    setParticles(Array.from({ length: 30 }, (_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 4 + 2, duration: Math.random() * 3 + 2, delay: Math.random() * 2
    })))
    setPetals(Array.from({ length: 60 }, (_, i) => ({
      id: i, x: Math.random() * 100, delay: Math.random() * 10,
      duration: Math.random() * 8 + 6, size: Math.random() * 12 + 8, rotation: (Math.random() - 0.5) * 720
    })))
  }, [])

  useEffect(() => {
    if (isTransforming || selectedIndex !== null) {
      setShowFirefly(false)
      return
    }
    setShowFirefly(true)
    const interval = setInterval(() => setFireflyTarget(p => (p + 1) % 5), 4500)
    return () => clearInterval(interval)
  }, [isTransforming, selectedIndex])

  useEffect(() => {
    if (!showFirefly || isTransforming || selectedIndex !== null) return
    const target = getFireflyTarget(fireflyTarget)
    const cur = fireflyPosRef.current
    fireflyControls.start({
      x: [cur.x, (cur.x + target.x) / 2 + Math.sin(fireflyTarget * 2) * 15, target.x],
      y: [cur.y, (cur.y + target.y) / 2 - 30, target.y],
      opacity: 1,
      transition: { duration: 3.5, ease: 'easeInOut' }
    }).then(() => {
      fireflyPosRef.current = target
      setFireflyArrived(fireflyTarget)
    })
  }, [fireflyTarget, showFirefly, isTransforming, selectedIndex, fireflyControls, getFireflyTarget])

  const handleFlowerClick = (index) => {
    if (isTransforming) return
    setSelectedIndex(index)
    setIsTransforming(true)
    setTimeout(() => onPetalSelect(), 2800)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 1 }}
      transition={{ exit: { duration: 0 } }}
      className="relative flex flex-col items-center justify-center overflow-hidden"
      style={{
        height: '100dvh',
        paddingTop: isSmallScreen ? '3rem' : '5rem',
        paddingBottom: isSmallScreen
          ? 'calc(env(safe-area-inset-bottom, 0px) + 7rem)'
          : 'calc(env(safe-area-inset-bottom, 0px) + 9rem)',
      }}
    >
      {/* ── 頂部 HUD（遊戲式資源欄）── */}
      {!isTransforming && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-3 pb-2"
          style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}
        >
          {/* 左側：空白佔位 */}
          <div />

          {/* 右側：登入 + 圖鑑 */}
          <div className="flex items-center gap-2">
            {onOpenAuth && (
              <motion.button
                onClick={onOpenAuth}
                className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm font-medium flex items-center gap-1.5 border border-white/20 hover:bg-white/20 transition-colors min-h-[36px]"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {user ? (
                  <>
                    {user.user_metadata?.avatar_url
                      ? <img src={user.user_metadata.avatar_url} alt="" className="w-5 h-5 rounded-full" />
                      : <span className="text-xs">👤</span>
                    }
                    <span className="max-w-[64px] truncate text-xs">
                      {user.user_metadata?.full_name || user.user_metadata?.name || '用戶'}
                    </span>
                  </>
                ) : (
                  <span className="text-xs">登入</span>
                )}
              </motion.button>
            )}
            <motion.button
              onClick={onOpenCollection}
              className="px-3 py-1.5 backdrop-blur-sm rounded-full text-white text-sm font-medium flex items-center gap-1.5 shadow-lg min-h-[36px]"
              style={{ background: 'linear-gradient(135deg, rgba(242,126,147,0.55), rgba(242,164,136,0.45))', border: '1px solid rgba(242,126,147,0.35)' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <CollectionIcon className="w-4 h-4" color="white" />
              <span className="text-xs">圖鑑</span>
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* 背景飄落花瓣 */}
      <motion.div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        animate={{ opacity: isTransforming ? 0.2 : 1 }}
      >
        {petals.map(p => <FloatingPetal key={p.id} {...p} />)}
      </motion.div>

      {/* 背景粒子 */}
      <motion.div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        animate={{ opacity: isTransforming ? 0.2 : 1 }}
      >
        {particles.map(p => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-primary-400/20"
            style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
            animate={{ y: [0, -30, 0], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: p.duration, repeat: Infinity, delay: p.delay }}
          />
        ))}
      </motion.div>

      {/* 標題 */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className={`text-center ${isSmallScreen ? 'mb-2' : 'mb-4 md:mb-6'} relative z-10`}
        style={{ opacity: isTransforming ? 0.3 : 1 }}
      >
        <h1 className={`${isSmallScreen ? 'text-4xl' : 'text-5xl md:text-7xl'} font-bold ${isSmallScreen ? 'mb-1' : 'mb-2 md:mb-4'} text-gradient glow`}>埕花</h1>
        <p className={`${isSmallScreen ? 'text-base' : 'text-lg md:text-2xl'} text-primary-200 ${isSmallScreen ? 'mb-0.5' : 'mb-1 md:mb-2'}`}>鹽夏不夜埕</p>
        <motion.p
          key={isTransforming ? 't' : 's'}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${isSmallScreen ? 'text-sm' : 'text-base md:text-xl'} text-gray-300`}
        >
          {isTransforming ? '花語顯現中...' : '選擇一枝花，開啟今夜的指引'}
        </motion.p>
      </motion.div>

      {/* 背景遮罩 */}
      {isTransforming && (
        <>
          <motion.div
            className="fixed inset-0 bg-black pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.7, 0.7, 0] }}
            transition={{ duration: 2.8, times: [0, 0.2, 0.65, 1] }}
            style={{ zIndex: 5 }}
          />
          <motion.div
            className="fixed inset-0 bg-white pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0, 0, 0.5, 1] }}
            transition={{ duration: 2.8, times: [0, 0.55, 0.65, 0.85, 1] }}
            style={{ zIndex: 15 }}
          />
        </>
      )}

      {/* 花束區域 */}
      <div
        className="relative flex flex-col items-center"
        style={{ zIndex: 10, width: isSmallScreen ? 230 : (isMobile ? 280 : 360), height: isSmallScreen ? 240 : (isMobile ? 300 : 380) }}
      >
        {/* 花朵容器 - 莖底部對齊 */}
        <div
          className="relative flex items-end justify-center"
          style={{ width: '100%', height: isSmallScreen ? 145 : (isMobile ? 180 : 230), marginBottom: isSmallScreen ? -20 : (isMobile ? -25 : -35) }}
        >
          {/* 螢火蟲 */}
          {showFirefly && !isTransforming && selectedIndex === null && (
            <motion.div
              className="absolute pointer-events-none"
              style={{ left: '50%', bottom: 0, zIndex: 30 }}
              initial={{ opacity: 0, x: 0, y: 0 }}
              animate={fireflyControls}
            >
              <motion.div
                className="w-5 h-5 md:w-6 md:h-6 rounded-full"
                style={{ background: 'radial-gradient(circle, #fffbeb, #fef9c3, #fbbf24)' }}
                animate={
                  fireflyArrived === fireflyTarget
                    ? { scale: [1, 1.4, 1], boxShadow: ['0 0 18px rgba(251,191,36,1)', '0 0 35px rgba(251,191,36,1)', '0 0 18px rgba(251,191,36,1)'] }
                    : { scale: [1, 1.15, 1], boxShadow: ['0 0 12px rgba(251,191,36,0.9)', '0 0 22px rgba(251,191,36,1)', '0 0 12px rgba(251,191,36,0.9)'] }
                }
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>
          )}

          {/* 7 枝花 */}
          {BOUQUET_FLOWERS.map((flower, index) => (
            <SingleFlower
              key={flower.id}
              flower={flower}
              position={FLOWER_POSITIONS[index]}
              index={index}
              isSelected={selectedIndex === index}
              isTransforming={isTransforming}
              isHighlighted={!isTransforming && selectedIndex === null && fireflyArrived === index}
              onClick={() => handleFlowerClick(index)}
              isMobile={isMobile}
            />
          ))}
        </div>

        {/* 台灣竹編花籃 */}
        <BambooBasket isMobile={isMobile} isTransforming={isTransforming} />
      </div>

      {/* 提示文字 */}
      {!isTransforming && (
        <div className={`flex flex-col items-center ${isSmallScreen ? 'mt-2' : 'mt-4'} relative z-10`}>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{
              opacity: [0.6, 1, 0.6],
              y: 0,
              textShadow: ['0 0 8px rgba(255,200,150,0.3)', '0 0 16px rgba(255,200,150,0.6)', '0 0 8px rgba(255,200,150,0.3)']
            }}
            transition={{
              delay: 1,
              opacity: { duration: 2, repeat: Infinity },
              textShadow: { duration: 2, repeat: Infinity },
            }}
            className="text-sm md:text-base text-amber-200/90 text-center tracking-widest font-medium"
          >
            ✦ 點擊任意一枝花開始抽籤 ✦
          </motion.p>
        </div>
      )}

      {/* ── 底部操作列（遊戲式 Action Bar）── */}
      {!isTransforming && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-0 left-0 right-0 z-10 flex flex-col items-center gap-2 px-6"
          style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom, 20px))' }}
        >
          {/* 主要：掃描 QR（展覽核心動作，全寬顯眼） */}
          {onQRScan && (
            <motion.button
              onClick={onQRScan}
              className="w-full max-w-xs py-3 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2 border border-green-400/50 min-h-[48px]"
              style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.45), rgba(5,150,105,0.45))', backdropFilter: 'blur(8px)' }}
              whileHover={{ scale: 1.03, boxShadow: '0 0 20px rgba(52,211,153,0.4)' }}
              whileTap={{ scale: 0.97 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
                <path d="M14 14h1v1h-1z" /><path d="M17 14h1v1h-1z" /><path d="M14 17h1v1h-1z" /><path d="M17 17h1v1h-1z" /><path d="M20 14v1" /><path d="M20 18v3" /><path d="M14 20h3" />
              </svg>
              掃描作品 QR Code
            </motion.button>
          )}

          {/* 次要：相由花緣 */}
          {onEmotionScan && (
            <motion.button
              onClick={onEmotionScan}
              className="w-full max-w-xs py-2.5 rounded-2xl text-sm font-medium text-white/80 flex items-center justify-center gap-2 border border-purple-400/40 min-h-[44px]"
              style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.35), rgba(79,70,229,0.35))', backdropFilter: 'blur(8px)' }}
              whileHover={{ scale: 1.03, boxShadow: '0 0 16px rgba(167,139,250,0.35)' }}
              whileTap={{ scale: 0.97 }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9V5.5A2.5 2.5 0 0 1 5.5 3H9" /><path d="M15 3h3.5A2.5 2.5 0 0 1 21 5.5V9" />
                <path d="M21 15v3.5A2.5 2.5 0 0 1 18.5 21H15" /><path d="M9 21H5.5A2.5 2.5 0 0 1 3 18.5V15" />
                <ellipse cx="12" cy="11.5" rx="5" ry="5.5" />
                <circle cx="10" cy="10.5" r="0.6" fill="currentColor" stroke="none" /><circle cx="14" cy="10.5" r="0.6" fill="currentColor" stroke="none" />
                <path d="M9.5 13.5c.6 1 1.4 1.5 2.5 1.5s1.9-.5 2.5-1.5" />
              </svg>
              相由花緣
            </motion.button>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}

export default LandingPage
