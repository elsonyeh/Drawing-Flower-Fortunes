import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef, useMemo } from 'react'
import CardBack from './CardBack'
import FlowerBloom from './FlowerBloom'
import { BOUQUET_FLOWERS, FLOWER_POSITIONS, SingleFlower, BambooBasket } from './FlowerBouquet'

// 白光消退橋接用的柔光粒子（靜態預算，與花色無關）
// 分兩層：大型光暈球 + 細小閃爍星點
const GLOW_ORBS = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2
  const dist  = 60 + (i % 4) * 28
  return {
    id: i,
    dx: Math.cos(angle) * dist,
    dy: Math.sin(angle) * dist - 40,   // 整體偏上
    size: 80 + (i % 3) * 40,           // 大：80/120/160px
    blur: 10 + (i % 3) * 5,            // 輕度模糊，保持可見：10/15/20px
    delay: i * 0.055,
    dur: 1.9 + (i % 3) * 0.2,
    colorIdx: i % 3,                   // 0=白 1=花色 2=金
  }
})
const SPARKLE_POINTS = Array.from({ length: 14 }, (_, i) => {
  const angle = (i / 14) * Math.PI * 2 + 0.22
  const dist  = 30 + (i % 5) * 22
  return {
    id: i,
    dx: Math.cos(angle) * dist,
    dy: Math.sin(angle) * dist - 20,
    size: 5 + (i % 4) * 3,            // 小：5/8/11/14px
    blur: 2 + (i % 3),
    delay: 0.05 + i * 0.04,
    dur: 1.4 + (i % 3) * 0.25,
    colorIdx: i % 2,                   // 0=白 1=金
  }
})

// 預計算，避免 re-render 時位置變動
const REVEAL_PARTICLES = Array.from({ length: 32 }, (_, i) => ({
  id: i,
  left: 5 + Math.random() * 90,
  top: 10 + Math.random() * 80,
  delay: Math.random() * 1.4,
  dur: 1.8 + Math.random() * 1.4,
  size: 4 + Math.random() * 7,
  type: i % 3, // 0=花色 1=金 2=白
}))

const GachaAnimation = ({ flower, onComplete, skipFlowerPick = false }) => {
  const [stage, setStage] = useState('pick_flower')
  const [selectedFlowerIdx, setSelectedFlowerIdx] = useState(null)
  const [isFlowerTransforming, setIsFlowerTransforming] = useState(false)
  const [showFlower, setShowFlower] = useState(false)
  const [burstActive, setBurstActive] = useState(false)
  const [clickFlash, setClickFlash] = useState(false)
  const [cardPulse, setCardPulse] = useState(false)      // 點擊縮放觸覺回饋
  const [midFlipFlash, setMidFlipFlash] = useState(false) // 翻牌到 90° 時的閃光
  const [preFlowerFlash, setPreFlowerFlash] = useState(false) // 花出現前亮光
  const [transitionFlash, setTransitionFlash] = useState(false) // 點花後白光從花心擴散
  const [transitionGlow, setTransitionGlow] = useState(false)  // 白光消退時的柔光粒子橋接
  const [glowIdx, setGlowIdx] = useState(0)                    // pick_flower：輪流發光的花朵 index
  const [preHighlightIdx, setPreHighlightIdx] = useState(null) // 點擊後立即點亮，比光圈早 100ms
  const isSSR = flower?.rarity === 'ssr'
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const flashOriginTop = useRef(isMobile ? '40%' : '38%')      // 白光起點：選花束=花位置，主頁=正中
  const flowerColor = flower?.color ?? '#F27E93'

  const onCompleteRef = useRef(onComplete)
  useEffect(() => { onCompleteRef.current = onComplete }, [onComplete])

  const timersRef = useRef([])
  useEffect(() => () => timersRef.current.forEach(clearTimeout), [])

  // pick_flower：每 1.8 秒換下一朵花發光
  useEffect(() => {
    if (stage !== 'pick_flower' || isFlowerTransforming) return
    const id = setInterval(() => setGlowIdx(i => (i + 1) % BOUQUET_FLOWERS.length), 1800)
    return () => clearInterval(id)
  }, [stage, isFlowerTransforming])

  // 主頁流程（skipFlowerPick=true）：自動點擊中間花朵，播放光圈爆發後進卡牌
  useEffect(() => {
    if (!skipFlowerPick) return
    flashOriginTop.current = '50%'
    setSelectedFlowerIdx(2)
    setPreHighlightIdx(2)
    const t1 = setTimeout(() => {
      setIsFlowerTransforming(true)
      setBurstActive(true)
      setTransitionFlash(true)
    }, 80)
    const t2 = setTimeout(() => setTransitionGlow(true), 660)
    const t3 = setTimeout(() => setStage('show_card'), 1350)
    return () => [t1, t2, t3].forEach(clearTimeout)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 12 顆環繞粒子位置（依花色）
  const orbitParticles = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i,
    angle: (i / 12) * 360,
    r: 165 + (i % 3) * 24,
    size: 4 + (i % 4) * 2,
    dur: 5 + (i % 3) * 1.6,
    delay: i * 0.38,
  })), [])

  const handleFlowerClick = (index) => {
    if (isFlowerTransforming) return
    setSelectedFlowerIdx(index)
    setPreHighlightIdx(index)                          // t=0：花朵立即點亮（比光圈早）
    setTimeout(() => {
      setIsFlowerTransforming(true)
      setBurstActive(true)                             // t=100ms：光圈才爆發
      setTransitionFlash(true)
    }, 100)
    setTimeout(() => setTransitionGlow(true), 680)
    setTimeout(() => setStage('show_card'), 1350)
  }

  const handleCardClick = () => {
    if (stage !== 'show_card') return
    // 先觸發縮放觸覺動畫（0.5s），再開始翻牌
    setCardPulse(true)
    setTimeout(() => {
      setClickFlash(true)
      setStage('flip')
      timersRef.current = [
        // 翻牌到 90°（一半，4.5s / 2 = 2250ms）時的魔法閃光
        setTimeout(() => setMidFlipFlash(true), 2250),
        setTimeout(() => setMidFlipFlash(false), 2850),
        // 翻牌完成切 reveal（4.5s + 緩衝）
        setTimeout(() => setStage('reveal'), 4700),
        // 光環先慢後快，花在 3.1s 後出現（節奏稍放慢）
        setTimeout(() => setPreFlowerFlash(true), 7400), // 花出現前 400ms 亮光
        setTimeout(() => setShowFlower(true), 7800),
        setTimeout(() => onCompleteRef.current?.(), 14000),
      ]
    }, 500)
  }

  const burstColor = selectedFlowerIdx !== null
    ? BOUQUET_FLOWERS[selectedFlowerIdx]?.color ?? '#F27E93'
    : '#F27E93'

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden"
    >
      {/* ── 全域大氣背景（隨 stage 演進）── */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 0 }}
        initial={{ background: `radial-gradient(ellipse 70% 55% at 50% 60%, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 70%)` }}
        animate={{
          background:
            stage === 'show_card'
              ? `radial-gradient(ellipse 70% 55% at 50% 60%, ${flowerColor}22 0%, rgba(0,0,0,0) 70%)`
              : stage === 'flip'
              ? `radial-gradient(ellipse 90% 65% at 50% 55%, ${flowerColor}40 0%, rgba(0,0,0,0) 70%)`
              : stage === 'reveal'
              ? `radial-gradient(ellipse 130% 90% at 50% 50%, ${flowerColor}55 0%, ${flowerColor}22 40%, rgba(0,0,0,0) 75%)`
              : `radial-gradient(ellipse 70% 55% at 50% 60%, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 70%)`,
        }}
        transition={{ duration: 1.6, ease: 'easeInOut' }}
      />

      {/* reveal 時的全螢幕色彩爆發 */}
      {stage === 'reveal' && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 1, background: `radial-gradient(ellipse at 50% 50%, ${flowerColor}88, transparent 65%)` }}
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ opacity: [0, 0.7, 0] }}
          transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
        />
      )}

      {/* 入場白光消散 */}
      <motion.div
        className="absolute inset-0 bg-white pointer-events-none"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        style={{ zIndex: 100 }}
      />

      {/* ── burst 層：獨立於 AnimatePresence，隨花完整播完 ── */}
      {burstActive && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 15 }}>
          {[...Array(22)].map((_, i) => {
            const angle = (i / 22) * Math.PI * 2
            const dist = 80 + Math.random() * 70
            return (
              <motion.div key={`p-${i}`} className="absolute pointer-events-none rounded-full"
                style={{
                  left: '50%', top: isMobile ? '40%' : '38%',
                  width: 5 + Math.random() * 7, height: 5 + Math.random() * 7,
                  background: i % 3 === 0 ? burstColor : i % 3 === 1 ? '#F2BE5C' : '#fff',
                  marginLeft: -4, marginTop: -4,
                }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, opacity: 0, scale: 1.5 }}
                transition={{ duration: 0.75 + Math.random() * 0.45, ease: 'easeOut' }}
              />
            )
          })}
          {[0, 1, 2].map(i => (
            <motion.div key={`ring-${i}`} className="absolute pointer-events-none rounded-full"
              style={{
                left: '50%', top: isMobile ? '40%' : '38%',
                width: 60, height: 60, marginLeft: -30, marginTop: -30,
                border: i === 1 ? '1.5px solid rgba(242,190,92,0.8)' : `2px solid ${burstColor}`,
              }}
              initial={{ scale: 0.4, opacity: 0.9 }}
              animate={{ scale: 4 + i * 1.5, opacity: 0 }}
              transition={{ duration: 0.9 + i * 0.14, ease: [0.22, 1, 0.36, 1], delay: i * 0.12 }}
            />
          ))}
          <motion.div className="absolute pointer-events-none rounded-full"
            style={{
              left: '50%', top: isMobile ? '40%' : '38%',
              width: 40, height: 40, marginLeft: -20, marginTop: -20,
              background: `radial-gradient(circle, #fff, ${burstColor}88)`,
              filter: 'blur(8px)',
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 3, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
          />
        </div>
      )}

      {/* ── 白光從花心擴散（pick_flower → show_card 橋接 / 主頁換場）── */}
      {transitionFlash && (
        <motion.div
          className="absolute pointer-events-none rounded-full"
          style={{
            left: '50%', top: flashOriginTop.current,
            width: 60, height: 60,
            marginLeft: -30, marginTop: -30,
            background: 'white',
            zIndex: 60,
          }}
          initial={{ scale: 1, opacity: 0.95 }}
          animate={{ scale: 45, opacity: [0.95, 1, 0] }}
          transition={{ duration: 1.8, times: [0, 0.13, 1], ease: [0.16, 1, 0.3, 1] }}
        />
      )}

      {/* ── 柔光粒子橋接（白光消退 → 卡牌出現，z高於白光層讓粒子可見）── */}
      {transitionGlow && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 65 }}>
          {/* 大光暈球 */}
          {GLOW_ORBS.map(orb => {
            const color = orb.colorIdx === 0 ? 'rgba(255,255,255,1)'
                        : orb.colorIdx === 1 ? `${flowerColor}ee`
                        : 'rgba(242,190,92,0.95)'
            return (
              <motion.div
                key={`orb-${orb.id}`}
                className="absolute rounded-full pointer-events-none"
                style={{
                  left: '50%', top: flashOriginTop.current,
                  width: orb.size, height: orb.size,
                  marginLeft: -orb.size / 2, marginTop: -orb.size / 2,
                  background: `radial-gradient(circle, ${color} 0%, ${color.replace(/[\d.]+\)$/, '0.3)')} 55%, transparent 75%)`,
                  filter: `blur(${orb.blur}px)`,
                  mixBlendMode: 'screen',
                }}
                initial={{ x: 0, y: 0, opacity: 0, scale: 0.2 }}
                animate={{
                  x: orb.dx, y: orb.dy,
                  opacity: [0, 1, 0.85, 0],
                  scale:   [0.2, 1.1, 0.95, 0.6],
                }}
                transition={{
                  duration: orb.dur, delay: orb.delay,
                  ease: [0.22, 1, 0.36, 1],
                  opacity: { times: [0, 0.15, 0.55, 1] },
                  scale:   { times: [0, 0.15, 0.55, 1] },
                }}
              />
            )
          })}
          {/* 細小閃爍星點 */}
          {SPARKLE_POINTS.map(sp => {
            const color = sp.colorIdx === 0 ? '#ffffff' : '#F2BE5C'
            return (
              <motion.div
                key={`sp-${sp.id}`}
                className="absolute rounded-full pointer-events-none"
                style={{
                  left: '50%', top: flashOriginTop.current,
                  width: sp.size, height: sp.size,
                  marginLeft: -sp.size / 2, marginTop: -sp.size / 2,
                  background: color,
                  filter: `blur(${sp.blur}px)`,
                  boxShadow: `0 0 ${sp.size * 2}px ${sp.size}px ${color}`,
                }}
                initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                animate={{
                  x: sp.dx, y: sp.dy,
                  opacity: [0, 1, 0.7, 0],
                  scale:   [0, 1.4, 1, 0.4],
                }}
                transition={{
                  duration: sp.dur, delay: sp.delay,
                  ease: [0.22, 1, 0.36, 1],
                  opacity: { times: [0, 0.12, 0.5, 1] },
                  scale:   { times: [0, 0.12, 0.5, 1] },
                }}
              />
            )
          })}
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* ── 花盆選花階段 ── */}
        {stage === 'pick_flower' && (
          <motion.div
            key="pick_flower"
            className="flex flex-col items-center gap-6 relative"
            style={{ zIndex: 2 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.88, transition: { duration: 0.2, delay: 0 } }}
            transition={{ delay: 0.5, duration: 0.35 }}
          >
            {!skipFlowerPick && (
              <motion.p
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: [1, 1.06, 1] }}
                transition={{
                  opacity: { delay: 0.8, duration: 0.4 },
                  scale: { delay: 1.2, duration: 2.6, repeat: Infinity, ease: 'easeInOut' },
                }}
                className="text-sm tracking-[0.25em]"
                style={{ color: 'rgba(242,190,92,0.9)', textShadow: '0 0 12px rgba(242,190,92,0.6)' }}
              >
                ✦ 點擊一枝花，開啟你的花語 ✦
              </motion.p>
            )}

            <div
              className="relative flex flex-col items-center"
              style={{ width: isMobile ? 260 : 320, height: isMobile ? 280 : 350 }}
            >

              <div
                className="relative flex items-end justify-center"
                style={{ width: '100%', height: isMobile ? 170 : 215, marginBottom: isMobile ? -25 : -35, zIndex: 2 }}
              >
                {BOUQUET_FLOWERS.map((f, index) => (
                  <SingleFlower
                    key={f.id} flower={f} position={FLOWER_POSITIONS[index]} index={index}
                    isSelected={selectedFlowerIdx === index}
                    isTransforming={isFlowerTransforming && selectedFlowerIdx === index}
                    isHighlighted={isFlowerTransforming ? selectedFlowerIdx === index : (preHighlightIdx === index || glowIdx === index)}
                    onClick={() => handleFlowerClick(index)}
                    isMobile={isMobile}
                  />
                ))}
              </div>
              <BambooBasket isMobile={isMobile} isTransforming={isFlowerTransforming} />
            </div>
          </motion.div>
        )}

        {/* ── 卡背等待 / 翻牌 / 揭示 ── */}
        {(stage === 'show_card' || stage === 'flip' || stage === 'reveal') && (
          <motion.div
            key="card_area"
            className="flex flex-col items-center gap-5 w-full relative"
            style={{ zIndex: 2 }}
            initial={{ opacity: 0, y: 18, scale: 0.82 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              type: 'spring', stiffness: 90, damping: 14,
              opacity: { duration: 0.35, ease: 'easeOut' },
            }}
          >
            {/* 提示文字 */}
            <AnimatePresence>
              {stage === 'show_card' && !cardPulse && (
                <motion.p
                  key="hint"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: [0, 0.75, 0.45, 0.75] }}
                  exit={{ opacity: 0, y: -8, transition: { duration: 0.15, delay: 0 } }}
                  transition={{ delay: 0.5, duration: 2.4, repeat: Infinity }}
                  className="text-white/70 text-sm tracking-[0.3em]"
                >
                  ✦ 點擊翻牌，揭曉花語 ✦
                </motion.p>
              )}
            </AnimatePresence>

            {/* 環繞漂浮粒子（show_card） */}
            {stage === 'show_card' && orbitParticles.map(p => (
              <motion.div key={p.id} className="absolute pointer-events-none rounded-full"
                style={{
                  width: p.size, height: p.size,
                  background: p.id % 2 === 0 ? flowerColor : '#F2BE5C',
                  filter: 'blur(1.5px)',
                  top: '50%', left: '50%',
                  marginLeft: -p.size / 2, marginTop: -p.size / 2,
                }}
                animate={{
                  x: [
                    Math.cos((p.angle * Math.PI) / 180) * p.r,
                    Math.cos(((p.angle + 180) * Math.PI) / 180) * p.r,
                    Math.cos((p.angle * Math.PI) / 180) * p.r,
                  ],
                  y: [
                    Math.sin((p.angle * Math.PI) / 180) * p.r * 0.38,
                    Math.sin(((p.angle + 180) * Math.PI) / 180) * p.r * 0.38,
                    Math.sin((p.angle * Math.PI) / 180) * p.r * 0.38,
                  ],
                  opacity: [0, 0.65, 0.25, 0.65, 0],
                  scale: [0.5, 1.3, 0.8, 1.3, 0.5],
                }}
                transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
              />
            ))}

            {/* 翻牌容器 */}
            {/* 外層：與光暈同頻的靜息脈動 + reveal 時隨光環震動 */}
            <motion.div
              className="relative w-full max-w-[300px] mx-auto"
              style={{ height: 450 }}
              animate={
                stage === 'show_card' && !cardPulse
                  ? { scale: [1, 1.012, 1], y: [0, -2, 0] }
                  : stage === 'reveal'
                  ? { scale: [1, 1.04, 1.01, 1.03, 1.005, 1], y: [0, -6, -1, -4, -1, 0] }
                  : { scale: 1, y: 0 }
              }
              transition={
                stage === 'show_card' && !cardPulse
                  ? { duration: 2.6, repeat: Infinity, ease: 'easeInOut' }
                  : stage === 'reveal'
                  ? { duration: 3.5, times: [0, 0.08, 0.35, 0.55, 0.78, 1], ease: 'easeInOut' }
                  : { duration: 0.3 }
              }
            >
            {/* 內層：點擊觸動 */}
            <motion.div
              style={{ width: '100%', height: '100%', position: 'relative' }}
              animate={cardPulse ? {
                scale:   [1, 0.93, 1.05, 0.99, 1.01, 1],
                y:       [0, 4,    -5,   1,    -1,   0],
                rotateZ: [0, 0.6,  -0.7, 0.3,  -0.1, 0],
              } : {}}
              transition={cardPulse ? {
                duration: 0.75,
                times: [0, 0.2, 0.55, 0.75, 0.88, 1],
                ease: 'easeInOut',
              } : {}}
              onClick={stage === 'show_card' ? handleCardClick : undefined}
              data-tutorial="gacha-card"
            >
              {/* 等待點擊：多層脈衝光暈 */}
              {stage === 'show_card' && (
                <>
                  {/* 外層柔光暈（花色） */}
                  <motion.div className="absolute pointer-events-none"
                    style={{
                      inset: -40,
                      background: `radial-gradient(ellipse at 50% 50%, ${flowerColor}66 0%, ${flowerColor}33 45%, transparent 70%)`,
                      filter: 'blur(18px)',
                      zIndex: -1,
                    }}
                    animate={{ opacity: [0.35, 0.85, 0.35], scale: [0.96, 1.04, 0.96] }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  {/* 中層琥珀光暈 */}
                  <motion.div className="absolute pointer-events-none"
                    style={{
                      inset: -18,
                      background: 'radial-gradient(ellipse at 50% 50%, rgba(242,190,92,0.55) 0%, rgba(242,190,92,0.2) 50%, transparent 72%)',
                      filter: 'blur(10px)',
                      zIndex: -1,
                    }}
                    animate={{ opacity: [0.25, 0.7, 0.25] }}
                    transition={{ duration: 1.9, repeat: Infinity, delay: 0.55, ease: 'easeInOut' }}
                  />
                  {/* 內層亮核 */}
                  <motion.div className="absolute pointer-events-none"
                    style={{
                      inset: 0,
                      background: `radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.18) 0%, transparent 60%)`,
                      filter: 'blur(4px)',
                      borderRadius: '1rem',
                      zIndex: 1,
                    }}
                    animate={{ opacity: [0.2, 0.6, 0.2] }}
                    transition={{ duration: 2.1, repeat: Infinity, delay: 0.2, ease: 'easeInOut' }}
                  />
                  {/* 星光：散落在卡片四周不規則位置 */}
                  {[
                    { style: { top: 55,  left: -26  }, size: 'text-2xl',  dur: 3.1, delay: 0.0 },
                    { style: { top: -18, left: 75   }, size: 'text-sm',   dur: 3.8, delay: 1.2 },
                    { style: { top: 170, right: -22 }, size: 'text-xl',   dur: 2.9, delay: 0.6 },
                    { style: { bottom: 100, right: -20 }, size: 'text-base', dur: 3.4, delay: 1.8 },
                    { style: { bottom: -16, left: 95 }, size: 'text-lg',  dur: 3.2, delay: 0.3 },
                    { style: { top: 310, left: -18  }, size: 'text-xs',   dur: 4.0, delay: 2.1 },
                  ].map((p, i) => (
                    <motion.div key={i} className={`absolute pointer-events-none text-amber-300 select-none ${p.size}`}
                      style={p.style}
                      animate={{ opacity: [0.15, 1, 0.15], scale: [0.6, 1.5, 0.6], rotate: [0, 180, 360] }}
                      transition={{ duration: p.dur, repeat: Infinity, delay: p.delay }}
                    >✦</motion.div>
                  ))}
                  {/* 卡面光澤掃描 */}
                  <motion.div className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden" style={{ zIndex: 5 }}>
                    <motion.div
                      className="absolute inset-y-0 w-16"
                      style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)', filter: 'blur(4px)' }}
                      initial={{ x: -80 }}
                      animate={{ x: 380 }}
                      transition={{ duration: 4.5, repeat: Infinity, repeatDelay: 5.0, ease: [0.25, 1, 0.5, 1] }}
                    />
                  </motion.div>
                </>
              )}

              {/* 點擊瞬間白光 */}
              {clickFlash && (
                <motion.div className="absolute inset-0 rounded-2xl pointer-events-none"
                  style={{ background: 'white', zIndex: 30 }}
                  initial={{ opacity: 0.95 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.55, ease: 'easeOut' }}
                />
              )}

              {/* 點擊爆發粒子 */}
              {clickFlash && (
                <>
                  {[...Array(18)].map((_, i) => {
                    const angle = (i / 18) * Math.PI * 2
                    return (
                      <motion.div key={`cf-${i}`} className="absolute rounded-full pointer-events-none"
                        style={{
                          left: '50%', top: '50%', marginLeft: -5, marginTop: -5,
                          width: 8 + (i % 4) * 3, height: 8 + (i % 4) * 3,
                          background: i % 2 === 0 ? flowerColor : '#F2BE5C',
                          zIndex: 25,
                        }}
                        initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                        animate={{ x: Math.cos(angle) * (110 + i * 7), y: Math.sin(angle) * (110 + i * 7), opacity: 0, scale: 1.6 }}
                        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                      />
                    )
                  })}
                  {[0, 1, 2].map(i => (
                    <motion.div key={`cr-${i}`} className="absolute rounded-full pointer-events-none"
                      style={{
                        left: '50%', top: '50%',
                        width: 80, height: 80, marginLeft: -40, marginTop: -40,
                        border: `${i === 0 ? 2 : 1}px solid ${i === 1 ? '#F2BE5C' : flowerColor}`,
                        zIndex: 25,
                      }}
                      initial={{ scale: 0.3, opacity: 1 }}
                      animate={{ scale: 5.5 + i * 1.5, opacity: 0 }}
                      transition={{ duration: 1.1 + i * 0.2, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 }}
                    />
                  ))}
                </>
              )}

              {/* 翻牌到 90° 時：魔法閃光衝破卡面 */}
              {midFlipFlash && (
                <>
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      zIndex: 50,
                      background: `radial-gradient(ellipse 60% 80% at 50% 50%, white, ${flowerColor}cc, transparent 75%)`,
                      filter: 'blur(2px)',
                    }}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: [0, 1, 0.6, 0], scale: [0.6, 1.2, 1.4, 1.6] }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                  />
                  {/* 從卡片中心射出的光線 */}
                  {[...Array(8)].map((_, i) => {
                    const angle = (i / 8) * Math.PI * 2
                    return (
                      <motion.div key={`ray-${i}`} className="absolute pointer-events-none"
                        style={{
                          left: '50%', top: '50%',
                          width: 3, height: 180,
                          marginLeft: -1.5, marginTop: -180,
                          transformOrigin: '50% 100%',
                          rotate: `${i * 45}deg`,
                          background: `linear-gradient(to top, ${flowerColor}cc, transparent)`,
                          zIndex: 48,
                        }}
                        initial={{ scaleY: 0, opacity: 0.9 }}
                        animate={{ scaleY: [0, 1, 0], opacity: [0.8, 0.9, 0] }}
                        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.05 }}
                      />
                    )
                  })}
                </>
              )}

              {/* 花出現前的迎光 + 餘韻 */}
              {preFlowerFlash && (
                <>
                  {/* 外層大光暈（花色，慢消散） */}
                  <motion.div
                    className="absolute pointer-events-none"
                    style={{
                      inset: -80,
                      zIndex: 54,
                      background: `radial-gradient(ellipse 65% 75% at 50% 48%, ${flowerColor}99 0%, ${flowerColor}44 45%, transparent 72%)`,
                      filter: 'blur(22px)',
                    }}
                    initial={{ opacity: 0, scale: 0.55 }}
                    animate={{ opacity: [0, 0.9, 0.75, 0.45, 0.2, 0], scale: [0.55, 1.15, 1.25, 1.35, 1.4, 1.45] }}
                    transition={{ duration: 3.2, times: [0, 0.12, 0.3, 0.55, 0.78, 1], ease: 'easeOut' }}
                  />
                  {/* 內層白芯（快速爆發，慢餘韻） */}
                  <motion.div
                    className="absolute pointer-events-none"
                    style={{
                      inset: -30,
                      zIndex: 55,
                      background: `radial-gradient(ellipse 55% 70% at 50% 45%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.55) 30%, ${flowerColor}66 55%, transparent 75%)`,
                      filter: 'blur(8px)',
                      borderRadius: '1.5rem',
                    }}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: [0, 1, 0.7, 0.3, 0.1, 0], scale: [0.6, 1.1, 1.18, 1.22, 1.25, 1.28] }}
                    transition={{ duration: 2.8, times: [0, 0.13, 0.35, 0.6, 0.8, 1], ease: 'easeOut' }}
                  />
                </>
              )}

              {/* 翻牌動畫核心 */}
              <motion.div
                initial={{ rotateY: 0 }}
                animate={{ rotateY: (stage === 'flip' || stage === 'reveal') ? 180 : 0 }}
                transition={{ duration: 4.5, ease: [0.4, 0, 0.2, 1] }}
                style={{
                  position: 'absolute', inset: 0,
                  transformStyle: 'preserve-3d',
                  WebkitTransformStyle: 'preserve-3d',
                  perspective: 1200,
                }}
              >
                {/* 卡背面 */}
                <motion.div
                  className="absolute inset-0 rounded-2xl shadow-2xl cursor-pointer"
                  style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', overflow: 'hidden' }}
                  whileHover={stage === 'show_card' ? { scale: 1.04, y: -8 } : {}}
                  whileTap={stage === 'show_card' ? { scale: 0.96 } : {}}
                >
                  <CardBack flower={flower} />
                </motion.div>

                {/* 卡正面 */}
                <div className="absolute inset-0 rounded-2xl shadow-2xl"
                  style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)', overflow: 'hidden' }}
                >
                  <div className="absolute inset-0" style={{
                    background: isSSR
                      ? `linear-gradient(135deg, ${flower.gradientColors?.[0]}, ${flower.gradientColors?.[1]}, ${flower.gradientColors?.[2]})`
                      : `linear-gradient(135deg, ${flower.color}, ${flower.color}dd)`,
                  }} />
                  <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)`,
                    backgroundSize: '30px 30px',
                  }} />
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-3 rounded-xl" style={{
                      border: isSSR ? '3px solid rgba(255,215,0,0.8)' : '3px solid rgba(255,255,255,0.6)',
                      boxShadow: isSSR
                        ? 'inset 0 0 20px rgba(255,215,0,0.3), 0 0 20px rgba(255,215,0,0.3)'
                        : 'inset 0 0 20px rgba(255,255,255,0.2), 0 0 15px rgba(255,255,255,0.2)',
                    }} />
                    <div className="absolute inset-5 rounded-lg" style={{
                      border: isSSR ? '2px solid rgba(255,215,0,0.5)' : '2px solid rgba(255,255,255,0.4)',
                    }} />
                  </div>

                  {showFlower && stage === 'reveal' && (
                    <>
                      <div style={{ position: 'absolute', width: '100%', height: '65%', left: 0, top: '5%', zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                        <div style={{ width: '100%', height: '100%' }}>
                          <FlowerBloom flower={flower} key={flower.id} />
                        </div>
                      </div>
                      <div className="absolute bottom-8 w-[70%]" style={{ left: '50%', transform: 'translateX(-50%)', zIndex: 20 }}>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6 }}>
                          <div className="relative">
                            <div className="absolute inset-0 rounded-full blur-xl opacity-60"
                              style={{ background: isSSR ? `radial-gradient(ellipse, ${flower.gradientColors?.[0]}, transparent)` : `radial-gradient(ellipse, ${flower.color}, transparent)` }}
                            />
                            <div className="relative px-4 py-2 rounded-full backdrop-blur-sm"
                              style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.75), rgba(0,0,0,0.6))', boxShadow: isSSR ? `0 4px 20px rgba(255,215,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)` : `0 4px 20px ${flower.color}40, inset 0 1px 0 rgba(255,255,255,0.1)` }}
                            >
                              <div className="text-center">
                                <p className="text-white font-bold text-lg tracking-wide drop-shadow-lg">{flower.flower}</p>
                                <p className="text-white/90 text-xs mt-0.5 drop-shadow tracking-wide">{flower.meaning}</p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                      {isSSR && (
                        <div className="absolute top-10 z-10" style={{ left: '50%', transform: 'translateX(-50%)' }}>
                          <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, type: 'spring' }}>
                            <div className="px-4 py-2 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 rounded-full border-2 border-yellow-200 shadow-2xl">
                              <p className="text-yellow-900 font-black text-sm tracking-wider">⭐ SSR ⭐</p>
                            </div>
                          </motion.div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </motion.div>

              {/* reveal：粒子噴泉 */}
              {stage === 'reveal' && REVEAL_PARTICLES.map(p => (
                <motion.div key={p.id} className="absolute rounded-full pointer-events-none"
                  style={{
                    width: p.size, height: p.size,
                    background: p.type === 0 ? flowerColor : p.type === 1 ? '#F2BE5C' : 'rgba(255,255,255,0.9)',
                    left: `${p.left}%`, top: `${p.top}%`,
                    filter: 'blur(0.5px)',
                  }}
                  animate={{ y: [0, -130], opacity: [0, 1, 0], scale: [0, 1.8, 0] }}
                  transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, repeatDelay: 0.6 }}
                />
              ))}
            </motion.div>

            {/* reveal：光環三段加速——慢（pulse 1）→ 中（pulse 2）→ 快（pulse 3 花出現前） */}
            {stage === 'reveal' && (() => {
              // [delay, duration, borderColor, borderWidth, maxScale]
              // 節奏介於原版（-22%）與再慢一點之間，配合 showFlower 在 3100ms
              const rings = [
                // Pulse 1 — 慢（舒展）
                [0.0,  1.85, flowerColor, 2, 3.8],
                [0.30, 1.85, '#F2BE5C',  1, 4.2],
                [0.60, 1.85, flowerColor, 1, 3.6],
                [0.90, 1.85, '#F2BE5C',  2, 4.0],
                // Pulse 2 — 中
                [1.38, 1.05, flowerColor, 2, 3.8],
                [1.57, 1.05, '#F2BE5C',  1, 4.2],
                [1.76, 1.05, flowerColor, 1, 3.6],
                [1.95, 1.05, '#F2BE5C',  2, 4.0],
                // Pulse 3 — 快（花即將出現）
                [2.42, 0.52, flowerColor, 2, 4.0],
                [2.55, 0.52, '#fff',      1, 4.5],
                [2.68, 0.52, flowerColor, 2, 4.2],
                [2.81, 0.52, '#F2BE5C',  1, 4.8],
              ]
              return (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center" style={{ zIndex: 1 }}>
                  {rings.map(([delay, dur, color, bw, maxScale], i) => (
                    <motion.div key={i} className="absolute rounded-full"
                      style={{ width: 220, height: 220, border: `${bw}px solid ${color}` }}
                      initial={{ scale: 0.4, opacity: 0.9 }}
                      animate={{ scale: maxScale, opacity: 0 }}
                      transition={{ duration: dur, delay, ease: [0.22, 1, 0.36, 1] }}
                    />
                  ))}
                  <motion.div className="absolute rounded-full"
                    style={{
                      width: 300, height: 300,
                      background: `radial-gradient(circle, ${flowerColor}44, transparent 65%)`,
                      filter: 'blur(24px)',
                    }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [0, 2.2, 1.8], opacity: [0, 0.9, 0.35] }}
                    transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              )
            })()}
          </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SSR 光柱 + 粒子 */}
      {isSSR && stage === 'reveal' && (
        <>
          <motion.div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}
            initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.7] }} transition={{ duration: 0.5 }}
          >
            {[...Array(12)].map((_, i) => (
              <motion.div key={i} className="absolute top-1/2 left-1/2 w-2 origin-bottom"
                style={{
                  height: '55vh',
                  background: `linear-gradient(to top, ${flower.gradientColors?.[0] || '#FFD700'}50, transparent)`,
                  transform: `translateY(-100%) rotate(${(i * 360) / 12}deg)`,
                }}
                initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: i * 0.045, duration: 0.35 }}
              />
            ))}
          </motion.div>
          <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
            {[...Array(30)].map((_, i) => {
              const angle = (i / 30) * Math.PI * 2
              return (
                <motion.div key={i} className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full"
                  style={{ background: flower.gradientColors?.[i % 3] || '#FFD700' }}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                  animate={{ x: Math.cos(angle) * 220, y: Math.sin(angle) * 220, opacity: 0, scale: 1 }}
                  transition={{ duration: 1.1, ease: 'easeOut' }}
                />
              )
            })}
          </div>
        </>
      )}

      <style>{`
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
        }
      `}</style>
    </motion.div>
  )
}

export default GachaAnimation
