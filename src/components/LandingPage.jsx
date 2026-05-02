import { motion, useAnimation } from 'framer-motion'
import { useState, useEffect, useRef, useCallback } from 'react'
import CollectionIcon from './CollectionIcon'
import { BOUQUET_FLOWERS, FLOWER_POSITIONS, SingleFlower, BambooBasket } from './FlowerBouquet'

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

  // 非展覽模式下，已抽過就鎖定花朵
  const hasDrawn = !exhibitionMode && (() => {
    try {
      const stored = localStorage.getItem('collectedFlowers')
      if (!stored) return false
      return Object.keys(JSON.parse(stored)).length > 0
    } catch { return false }
  })()

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
    if (isTransforming || hasDrawn) return
    setSelectedIndex(index)
    setIsTransforming(true)
    // 立即切換到 GachaAnimation 選花環節，讓 B1/B2（爆發粒子＋白光）在 GachaAnimation 內原生執行
    onPetalSelect()
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
          {/* 左側：logo + 活動名稱 */}
          <div className="flex items-center gap-2">
            <img
              src="/assets/yanxia-logo.png"
              alt="鹽夏不夜埕"
              className="h-7 w-auto object-contain pointer-events-none select-none"
              style={{ filter: 'brightness(0) invert(1) drop-shadow(0 0 4px rgba(255,255,255,0.4))' }}
            />
            <span
              className="text-xs font-medium tracking-wide whitespace-nowrap"
              style={{ color: 'rgba(255,255,255,0.85)', textShadow: '0 0 8px rgba(242,190,92,0.5)' }}
            >
              2026 鹽夏不夜埕-花轟
            </span>
          </div>

          {/* 右側：登入 + 圖鑑 */}
          <div className="flex items-center gap-2">
            {onOpenAuth && (
              <motion.button
                data-tutorial="auth-btn"
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
              data-tutorial="collection-btn"
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
        <h1
          className={`${isSmallScreen ? 'text-4xl' : 'text-5xl md:text-7xl'} font-bold ${isSmallScreen ? 'mb-1' : 'mb-2 md:mb-4'}`}
          style={{
            color: 'rgba(242,217,208,0.96)',
            textShadow: '0 0 14px rgba(242,126,147,0.45), 0 0 32px rgba(242,190,92,0.20)',
          }}
        >埕花</h1>
        <motion.p
          key={isTransforming ? 't' : 's'}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${isSmallScreen ? 'text-sm' : 'text-base md:text-xl'} text-gray-300`}
        >
          {isTransforming ? '花語顯現中...' : hasDrawn ? '今夜的花語已為你綻放' : '選擇一枝花，開啟今夜的指引'}
        </motion.p>
      </motion.div>

      {/* 背景遮罩已移除：換場效果交由 GachaAnimation 的 transitionFlash/transitionGlow 處理 */}

      {/* 花束區域 */}
      <div
        className="relative flex flex-col items-center"
        style={{ zIndex: 10, width: isSmallScreen ? 230 : (isMobile ? 280 : 360), height: isSmallScreen ? 240 : (isMobile ? 300 : 380) }}
      >
        {/* 花朵容器 - 莖底部對齊 */}
        <div
          data-tutorial="flowers"
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

          {/* 5 枝花 */}
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

      {/* 提示文字：已抽過就隱藏 */}
      {!isTransforming && !hasDrawn && (
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
              className="w-full max-w-xs py-3 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2 min-h-[48px]"
              style={{ background: 'linear-gradient(135deg, rgba(242,190,92,0.40), rgba(242,164,136,0.35))', border: '1px solid rgba(242,190,92,0.40)', backdropFilter: 'blur(8px)' }}
              whileHover={{ scale: 1.03, boxShadow: '0 0 20px rgba(242,190,92,0.35)' }}
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
              className="w-full max-w-xs py-2.5 rounded-2xl text-sm font-medium text-white/75 flex items-center justify-center gap-2 min-h-[44px]"
              style={{ background: 'linear-gradient(135deg, rgba(91,123,168,0.35), rgba(72,100,140,0.28))', border: '1px solid rgba(91,123,168,0.40)', backdropFilter: 'blur(8px)' }}
              whileHover={{ scale: 1.03, boxShadow: '0 0 16px rgba(91,123,168,0.35)' }}
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
