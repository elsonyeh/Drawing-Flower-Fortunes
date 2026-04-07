import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef, useState, useCallback } from 'react'
import FlowerBloom from './FlowerBloom'

// ─── Canvas 花朵繪製 ─────────────────────────────────────────
function drawFlower(ctx, cx, cy, color, grad1, grad2, grad3, isSSR) {
  const petalCount = isSSR ? 8 : 6
  const petalLen   = 210
  const petalWid   = 80
  const innerR     = 55

  ctx.save()
  ctx.translate(cx, cy)

  // 外層花瓣（大）
  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2
    ctx.save()
    ctx.rotate(angle)

    const pg = ctx.createRadialGradient(0, -petalLen * 0.3, 0, 0, -petalLen * 0.5, petalLen)
    if (isSSR) {
      pg.addColorStop(0,   `${grad1}ee`)
      pg.addColorStop(0.5, `${grad2}bb`)
      pg.addColorStop(1,   `${grad3}44`)
    } else {
      pg.addColorStop(0,   `${color}ee`)
      pg.addColorStop(0.6, `${color}99`)
      pg.addColorStop(1,   `${color}22`)
    }
    ctx.fillStyle = pg

    ctx.beginPath()
    ctx.ellipse(0, -petalLen / 2, petalWid / 2, petalLen / 2, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  // 內層花瓣（小，旋轉半格）
  const innerCount = petalCount
  for (let i = 0; i < innerCount; i++) {
    const angle = ((i + 0.5) / innerCount) * Math.PI * 2
    ctx.save()
    ctx.rotate(angle)

    const pg2 = ctx.createRadialGradient(0, -petalLen * 0.15, 0, 0, -petalLen * 0.35, petalLen * 0.6)
    if (isSSR) {
      pg2.addColorStop(0,   `${grad2}cc`)
      pg2.addColorStop(1,   `${grad3}33`)
    } else {
      pg2.addColorStop(0,   `${color}cc`)
      pg2.addColorStop(1,   `${color}22`)
    }
    ctx.fillStyle = pg2
    ctx.beginPath()
    ctx.ellipse(0, -petalLen * 0.32, petalWid * 0.35, petalLen * 0.3, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  // 花心光暈
  const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, innerR * 1.6)
  cg.addColorStop(0,   'rgba(255,255,255,0.95)')
  cg.addColorStop(0.4, isSSR ? `${grad1}dd` : `${color}dd`)
  cg.addColorStop(1,   'transparent')
  ctx.fillStyle = cg
  ctx.beginPath()
  ctx.arc(0, 0, innerR * 1.6, 0, Math.PI * 2)
  ctx.fill()

  // 花心
  ctx.beginPath()
  ctx.arc(0, 0, innerR, 0, Math.PI * 2)
  ctx.fillStyle = isSSR ? grad1 : color
  ctx.shadowColor = isSSR ? grad1 : color
  ctx.shadowBlur = 30
  ctx.fill()
  ctx.shadowBlur = 0

  // 花心點點
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    const r = innerR * 0.55
    ctx.beginPath()
    ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 7, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.fill()
  }

  ctx.restore()
}

// ─── 生成花語分享卡片（Canvas） ─────────────────────────────
function generateShareCard(flower, emotionData, flowerImageUrl) {
  return new Promise((resolve) => {
    const W = 1080, H = 1920
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')

    const isSSR = flower.rarity === 'ssr'
    const color = flower.color || '#a78bfa'
    const grad1 = flower.gradientColors?.[0] || color
    const grad2 = flower.gradientColors?.[1] || color
    const grad3 = flower.gradientColors?.[2] || color

    // 背景漸層
    const bg = ctx.createLinearGradient(0, 0, W, H)
    if (isSSR) {
      bg.addColorStop(0,   '#0d0a1a')
      bg.addColorStop(0.4, '#1a0a2e')
      bg.addColorStop(1,   '#0a1020')
    } else {
      bg.addColorStop(0, '#0d0a1a')
      bg.addColorStop(1, '#0a1628')
    }
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    // 星點裝飾
    ctx.save()
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * W
      const y = Math.random() * H
      const r = Math.random() * 1.5 + 0.5
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.4 + 0.1})`
      ctx.fill()
    }
    ctx.restore()

    // SSR 射線
    if (isSSR) {
      ctx.save()
      ctx.globalAlpha = 0.05
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2
        const g = ctx.createLinearGradient(W/2, H/2, W/2 + Math.cos(angle)*H, H/2 + Math.sin(angle)*H)
        g.addColorStop(0, grad1)
        g.addColorStop(1, 'transparent')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.moveTo(W/2, H/2)
        ctx.arc(W/2, H/2, H, angle - 0.15, angle + 0.15)
        ctx.closePath()
        ctx.fill()
      }
      ctx.restore()
    }

    // 花色光暈圓
    const flowerCY = H * 0.30
    const halo = ctx.createRadialGradient(W/2, flowerCY, 0, W/2, flowerCY, 480)
    halo.addColorStop(0,   `${grad1}55`)
    halo.addColorStop(0.5, `${grad2 || color}22`)
    halo.addColorStop(1,   'transparent')
    ctx.fillStyle = halo
    ctx.fillRect(0, 0, W, H)

    // ── 花朵（優先用 3D 截圖，fallback 用 Canvas 繪製）────────
    const drawMain = () => {
      if (flowerImageUrl) {
        const img = new Image()
        img.onload = () => {
          // 圓形裁切 + 置中
          const size = 560
          const x = W/2 - size/2
          const y = flowerCY - size/2
          ctx.save()
          ctx.beginPath()
          ctx.arc(W/2, flowerCY, size/2, 0, Math.PI * 2)
          ctx.closePath()
          ctx.clip()
          ctx.drawImage(img, x, y, size, size)
          ctx.restore()
          continueDrawing()
        }
        img.onerror = () => {
          drawFlower(ctx, W/2, flowerCY, color, grad1, grad2, grad3, isSSR)
          continueDrawing()
        }
        img.src = flowerImageUrl
      } else {
        drawFlower(ctx, W/2, flowerCY, color, grad1, grad2, grad3, isSSR)
        continueDrawing()
      }
    }

    drawMain()
    return // 後續繼續由 continueDrawing 執行

    function continueDrawing() {

    // 花名（大字）
    const flowerY = isSSR ? H * 0.54 : H * 0.52
    ctx.save()
    ctx.textAlign = 'center'
    ctx.font = `bold ${isSSR ? 180 : 160}px serif`
    if (isSSR) {
      const tg = ctx.createLinearGradient(W/2 - 300, 0, W/2 + 300, 0)
      tg.addColorStop(0,   grad1)
      tg.addColorStop(0.5, grad2)
      tg.addColorStop(1,   grad3)
      ctx.fillStyle = tg
      ctx.shadowColor = grad1
      ctx.shadowBlur = 50
    } else {
      ctx.fillStyle = color
      ctx.shadowColor = color
      ctx.shadowBlur = 30
    }
    ctx.fillText(flower.flower, W/2, flowerY)
    ctx.restore()

    // 花語（副標題）
    ctx.save()
    ctx.textAlign = 'center'
    ctx.font = `${isSSR ? 58 : 54}px serif`
    ctx.fillStyle = 'rgba(255,255,255,0.75)'
    ctx.fillText(flower.meaning, W/2, flowerY + 90)
    ctx.restore()

    // 分隔線
    const lineY = flowerY + 140
    const lineGrad = ctx.createLinearGradient(W/2 - 200, 0, W/2 + 200, 0)
    lineGrad.addColorStop(0, 'transparent')
    lineGrad.addColorStop(0.5, `${color}99`)
    lineGrad.addColorStop(1, 'transparent')
    ctx.strokeStyle = lineGrad
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(W/2 - 200, lineY)
    ctx.lineTo(W/2 + 200, lineY)
    ctx.stroke()

    // 今夜訊息（引言）
    const msgY = lineY + 70
    const msgLines = wrapText(ctx, `「${flower.message}」`, W - 160, '40px sans-serif')
    ctx.save()
    ctx.textAlign = 'center'
    ctx.font = '40px sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.65)'
    ctx.fontStyle = 'italic'
    msgLines.forEach((line, i) => ctx.fillText(line, W/2, msgY + i * 60))
    ctx.restore()

    // 面相結果（若有）
    let archetypeBlockY = msgY + msgLines.length * 60 + 60
    if (emotionData?.archetypeData) {
      const a = emotionData.archetypeData
      ctx.save()
      // 圓角方框
      const bx = W/2 - 260, bw = 520
      const by = archetypeBlockY, bh = 160
      roundRect(ctx, bx, by, bw, bh, 24)
      ctx.fillStyle = `${a.color}18`
      ctx.fill()
      ctx.strokeStyle = `${a.color}44`
      ctx.lineWidth = 1.5
      ctx.stroke()

      ctx.textAlign = 'center'
      ctx.font = 'bold 52px sans-serif'
      ctx.fillStyle = a.color
      ctx.fillText(`${a.icon} ${a.zh}`, W/2, by + 70)
      ctx.font = '36px sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.fillText(a.traits.join('・'), W/2, by + 125)
      ctx.restore()
      archetypeBlockY += bh + 40
    }

    // SSR 徽章
    if (isSSR) {
      ctx.save()
      const bx = W/2 - 140, by = archetypeBlockY, bw = 280, bh = 70
      roundRect(ctx, bx, by, bw, bh, 35)
      const sbg = ctx.createLinearGradient(bx, 0, bx + bw, 0)
      sbg.addColorStop(0, '#facc15')
      sbg.addColorStop(0.5, '#f97316')
      sbg.addColorStop(1, '#facc15')
      ctx.fillStyle = sbg
      ctx.fill()
      ctx.textAlign = 'center'
      ctx.font = 'bold 36px sans-serif'
      ctx.fillStyle = '#fff'
      ctx.fillText('⭐ SSR 稀有花語 ⭐', W/2, by + 46)
      ctx.restore()
    }

    // 品牌 footer
    ctx.save()
    ctx.textAlign = 'center'
    ctx.font = '36px sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.25)'
    ctx.fillText('埕花・鹽夏不夜埕', W/2, H - 100)
    ctx.font = '28px sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.15)'
    ctx.fillText('花語抽籤互動體驗', W/2, H - 55)
    ctx.restore()

    resolve(canvas.toDataURL('image/png'))
    } // end continueDrawing
  })
}

function wrapText(ctx, text, maxWidth, font) {
  ctx.font = font
  if (ctx.measureText(text).width <= maxWidth) return [text]
  const chars = [...text]
  const lines = []
  let line = ''
  for (const ch of chars) {
    const test = line + ch
    if (ctx.measureText(test).width > maxWidth) {
      lines.push(line)
      line = ch
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

// ─── 分享 Modal ──────────────────────────────────────────────
function ShareModal({ flower, emotionData, flowerImageUrl, onClose }) {
  const [imgUrl, setImgUrl] = useState(null)
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(true)
  const [sharing, setSharing] = useState(false)

  useEffect(() => {
    generateShareCard(flower, emotionData, flowerImageUrl).then(url => {
      setImgUrl(url)
      setGenerating(false)
    })
  }, [flower, emotionData, flowerImageUrl])

  const shareText = `今夜抽到了${flower.rarity === 'ssr' ? 'SSR ' : ''}${flower.flower}，花語是「${flower.meaning}」。${flower.message}`

  const handleNativeShare = useCallback(async () => {
    if (!imgUrl) return
    setSharing(true)
    try {
      const blob = await (await fetch(imgUrl)).blob()
      const file = new File([blob], `埕花-${flower.flower}.png`, { type: 'image/png' })
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `埕花 - ${flower.flower}`, text: shareText })
      } else if (navigator.share) {
        await navigator.share({ title: `埕花 - ${flower.flower}`, text: shareText, url: window.location.href })
      }
    } catch (e) {
      if (e.name !== 'AbortError') console.error(e)
    }
    setSharing(false)
  }, [imgUrl, flower, shareText])

  const handleDownload = useCallback(() => {
    if (!imgUrl) return
    const a = document.createElement('a')
    a.href = imgUrl
    a.download = `埕花-${flower.flower}.png`
    a.click()
  }, [imgUrl, flower])

  const handleCopyText = useCallback(async () => {
    await navigator.clipboard.writeText(shareText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [shareText])

  const isSSR = flower.rarity === 'ssr'
  const color = flower.color || '#a78bfa'

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* 背景遮罩 */}
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        className="relative w-full max-w-sm mx-4 mb-4 sm:mb-0 rounded-3xl overflow-hidden"
        style={{ maxHeight: '80vh', background: 'linear-gradient(to bottom, #1a0a2e, #0d0a1a)', border: '1px solid rgba(167,139,250,0.2)' }}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        {/* 標題 */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h3 className="text-white font-semibold text-lg">分享花語</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white/80 transition-colors text-xl">✕</button>
        </div>

        {/* 預覽圖 */}
        <div className="px-5 pb-3">
          <div className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: '9/16', maxHeight: 200, background: '#0a0814' }}>
            {generating ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  className="w-8 h-8 rounded-full border-2 border-purple-400 border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              </div>
            ) : (
              <img src={imgUrl} alt="花語卡片" className="w-full h-full object-cover" />
            )}
          </div>
        </div>

        {/* 操作按鈕 */}
        <div className="px-5 pb-4 flex flex-col gap-2.5">
          {/* 分享圖片（主要） */}
          <motion.button
            onClick={handleNativeShare}
            disabled={generating || sharing}
            className="w-full py-3 rounded-2xl font-semibold text-white flex items-center justify-center gap-2"
            style={{ background: isSSR ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : `linear-gradient(135deg, #7c3aed, #4f46e5)` }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {sharing ? (
              <motion.div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                分享卡片
              </>
            )}
          </motion.button>

          <div className="flex gap-3">
            {/* 儲存圖片 */}
            <motion.button
              onClick={handleDownload}
              disabled={generating}
              className="flex-1 py-2.5 rounded-2xl font-medium text-white/80 flex items-center justify-center gap-2 text-sm"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              儲存圖片
            </motion.button>

            {/* 複製文字 */}
            <motion.button
              onClick={handleCopyText}
              className="flex-1 py-2.5 rounded-2xl font-medium flex items-center justify-center gap-2 text-sm transition-colors"
              style={{
                background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.08)',
                border: `1px solid ${copied ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.12)'}`,
                color: copied ? '#4ade80' : 'rgba(255,255,255,0.8)',
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {copied ? (
                <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>已複製</>
              ) : (
                <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>複製文字</>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

const FortuneResult = ({ flower, onReset, isFromCollection = false, emotionData = null }) => {
  const containerRef = useRef(null)
  const flowerRef = useRef(null)
  const [showShare, setShowShare] = useState(false)
  const [flowerSnapshot, setFlowerSnapshot] = useState(null)
  const isSSR = flower?.rarity === 'ssr'

  const handleOpenShare = useCallback(() => {
    // 截取 Three.js WebGL canvas
    if (flowerRef.current) {
      const glCanvas = flowerRef.current.querySelector('canvas')
      if (glCanvas) {
        try {
          setFlowerSnapshot(glCanvas.toDataURL('image/png'))
        } catch (e) {
          setFlowerSnapshot(null)
        }
      }
    }
    setShowShare(true)
  }, [])

  // Scroll to top when viewing from collection
  useEffect(() => {
    if (isFromCollection) {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [isFromCollection])

  if (!flower) return null

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
      },
    },
  }

  return (
    <motion.div
      ref={containerRef}
      initial={isFromCollection ? { opacity: 0, y: 0 } : "hidden"}
      animate={isFromCollection ? { opacity: 1, y: 0 } : "visible"}
      exit={{ opacity: 0 }}
      variants={!isFromCollection ? containerVariants : undefined}
      className="min-h-screen flex flex-col items-center justify-start px-4 py-8 overflow-y-auto overflow-x-hidden relative"
    >
      {/* SSR Background effects */}
      {isSSR && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {/* Subtle rotating rays */}
          <motion.div
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          >
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 w-1 h-screen origin-top opacity-5"
                style={{
                  background: `linear-gradient(to bottom, ${flower.gradientColors?.[0] || '#FFD700'}, transparent)`,
                  transform: `rotate(${(i * 360) / 8}deg)`,
                }}
              />
            ))}
          </motion.div>

          {/* Floating particles */}
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                background: flower.gradientColors?.[i % 3] || '#FFD700',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -50, 0],
                opacity: [0, 0.6, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                delay: Math.random() * 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      )}

      <div className="w-full max-w-4xl relative z-10 px-0">
        {/* Main 3D Flower Display */}
        <motion.div
          variants={!isFromCollection ? itemVariants : undefined}
          initial={isFromCollection ? { opacity: 0, y: 30 } : undefined}
          animate={isFromCollection ? { opacity: 1, y: 0 } : undefined}
          transition={isFromCollection ? { duration: 0.6, delay: 0.1 } : undefined}
          className="relative w-full aspect-square max-w-md mx-auto mb-6"
        >
          {/* Glow effect for SSR */}
          {isSSR && (
            <motion.div
              className="absolute -inset-8 rounded-full blur-3xl"
              style={{
                background: `radial-gradient(circle, ${flower.gradientColors?.[0]}40, ${flower.gradientColors?.[1]}20, transparent)`,
              }}
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}

          {/* 3D Flower - Larger with fixed centering */}
          <div ref={flowerRef} style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            minHeight: '350px',
            maxHeight: '400px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <FlowerBloom flower={flower} />
          </div>

          {/* Rarity badge */}
          {isSSR && (
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', delay: 0.3 }}
              className="absolute -top-4 -right-2 sm:-right-4 px-4 py-2 bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 rounded-full font-bold text-white shadow-2xl border-2 border-yellow-200 z-20"
            >
              ⭐ SSR ⭐
            </motion.div>
          )}
        </motion.div>

        {/* Flower name and meaning */}
        {/* 面相解籤分析標籤 */}
        {emotionData?.archetypeData && (
          <motion.div
            className="flex flex-col items-center gap-3 mb-6 w-full"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div
              className="w-full rounded-2xl px-5 py-4 flex flex-col items-center gap-2"
              style={{
                background: `${emotionData.archetypeData.color}15`,
                border: `1px solid ${emotionData.archetypeData.color}40`,
              }}
            >
              <p className="text-white/40 text-xs tracking-widest">面相解讀結果</p>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{emotionData.archetypeData.icon}</span>
                <span className="text-xl font-bold" style={{ color: emotionData.archetypeData.color }}>
                  {emotionData.archetypeData.zh}
                </span>
              </div>
              <p className="text-white/50 text-sm text-center">{emotionData.archetypeData.desc}</p>
              <div className="flex gap-2 flex-wrap justify-center mt-1">
                {emotionData.archetypeData.traits.map(trait => (
                  <span
                    key={trait}
                    className="px-2.5 py-0.5 rounded-full text-xs"
                    style={{
                      background: `${emotionData.archetypeData.color}20`,
                      border: `1px solid ${emotionData.archetypeData.color}50`,
                      color: emotionData.archetypeData.color,
                    }}
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          variants={!isFromCollection ? itemVariants : undefined}
          initial={isFromCollection ? { opacity: 0, y: 30 } : undefined}
          animate={isFromCollection ? { opacity: 1, y: 0 } : undefined}
          transition={isFromCollection ? { duration: 0.6, delay: 0.2 } : undefined}
          className="text-center mb-8"
        >
          <motion.h1
            className="text-5xl md:text-6xl font-bold mb-3"
            style={{
              background: isSSR
                ? `linear-gradient(135deg, ${flower.gradientColors?.[0]}, ${flower.gradientColors?.[1]}, ${flower.gradientColors?.[2]})`
                : flower.color,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: isSSR ? 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.5))' : 'none',
            }}
            animate={isSSR ? {
              textShadow: [
                '0 0 20px rgba(255, 215, 0, 0.5)',
                '0 0 30px rgba(255, 215, 0, 0.8)',
                '0 0 20px rgba(255, 215, 0, 0.5)',
              ],
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {flower.flower}
          </motion.h1>
          <p className="text-2xl md:text-3xl text-primary-300">{flower.meaning}</p>
        </motion.div>

        {/* Story section */}
        <motion.div
          variants={!isFromCollection ? itemVariants : undefined}
          initial={isFromCollection ? { opacity: 0, y: 30 } : undefined}
          animate={isFromCollection ? { opacity: 1, y: 0 } : undefined}
          transition={isFromCollection ? { duration: 0.6, delay: 0.3 } : undefined}
          className={`rounded-2xl p-6 mb-6 border ${
            isSSR
              ? 'bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border-yellow-500/30'
              : 'bg-gradient-to-br from-night-800/60 to-night-900/60 border-primary-500/20'
          } backdrop-blur-md`}
        >
          <h2 className={`text-xl font-semibold mb-3 flex items-center ${
            isSSR ? 'text-yellow-300' : 'text-primary-300'
          }`}>
            <span className="mr-2">📖</span>
            花之物語
          </h2>
          <p className="text-gray-200 leading-relaxed text-lg">{flower.story}</p>
        </motion.div>

        {/* Message section */}
        <motion.div
          variants={!isFromCollection ? itemVariants : undefined}
          initial={isFromCollection ? { opacity: 0, y: 30 } : undefined}
          animate={isFromCollection ? { opacity: 1, y: 0 } : undefined}
          transition={isFromCollection ? { duration: 0.6, delay: 0.4 } : undefined}
          className={`rounded-2xl p-6 mb-6 border ${
            isSSR
              ? 'bg-gradient-to-br from-orange-900/40 to-yellow-900/40 border-yellow-400/40'
              : 'bg-gradient-to-br from-primary-900/40 to-purple-900/40 border-primary-400/30'
          } backdrop-blur-md`}
        >
          <h2 className={`text-xl font-semibold mb-3 flex items-center ${
            isSSR ? 'text-yellow-200' : 'text-primary-200'
          }`}>
            <span className="mr-2">💌</span>
            今夜的訊息
          </h2>
          <p className="text-white text-lg md:text-xl leading-relaxed italic">
            「{flower.message}」
          </p>
        </motion.div>

        {/* Locations section */}
        <motion.div
          variants={!isFromCollection ? itemVariants : undefined}
          initial={isFromCollection ? { opacity: 0, y: 30 } : undefined}
          animate={isFromCollection ? { opacity: 1, y: 0 } : undefined}
          transition={isFromCollection ? { duration: 0.6, delay: 0.5 } : undefined}
          className="bg-gradient-to-br from-night-800/60 to-night-900/60 backdrop-blur-md rounded-2xl p-6 mb-8 border border-primary-500/20"
        >
          <h2 className="text-xl font-semibold text-primary-300 mb-4 flex items-center">
            <span className="mr-2">📍</span>
            推薦探索地點
          </h2>
          <div className="space-y-3">
            {flower.locations.map((location, index) => (
              <motion.div
                key={index}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="flex items-center space-x-3 p-4 rounded-lg bg-night-700/40 hover:bg-night-700/60 transition-colors"
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{
                    background: isSSR
                      ? `linear-gradient(135deg, ${flower.gradientColors?.[0]}, ${flower.gradientColors?.[1]})`
                      : flower.color
                  }}
                />
                <span className="text-gray-200 text-lg">{location}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Exhibition artwork recommendation */}
        {flower.artwork && !isFromCollection && (
          <motion.div
            variants={!isFromCollection ? itemVariants : undefined}
            className="bg-gradient-to-br from-night-800/60 to-night-900/60 backdrop-blur-md rounded-2xl p-6 mb-8 border border-purple-500/30"
          >
            <h2 className="text-xl font-semibold text-purple-300 mb-4 flex items-center">
              <span className="mr-2">🎨</span>
              前往探索
            </h2>
            <div className="rounded-xl p-4 bg-white/5 border border-white/10">
              <p className="text-white/40 text-xs mb-1">{flower.artwork.id} · 展區 {flower.exhibitionZone}</p>
              <p className="text-white font-bold text-lg mb-1">{flower.artwork.name}</p>
              <p className="text-white/60 text-sm flex items-center gap-1">
                <span>📍</span>{flower.artwork.location}
              </p>
            </div>
          </motion.div>
        )}

        {/* Action buttons */}
        <motion.div
          variants={!isFromCollection ? itemVariants : undefined}
          initial={isFromCollection ? { opacity: 0, y: 30 } : undefined}
          animate={isFromCollection ? { opacity: 1, y: 0 } : undefined}
          transition={isFromCollection ? { duration: 0.6, delay: 0.6 } : undefined}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-6"
        >
          <motion.button
            onClick={onReset}
            className={`px-8 py-4 rounded-full font-medium shadow-lg text-lg ${
              isSSR
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                : 'bg-gradient-to-r from-primary-500 to-pink-500 text-white'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isFromCollection ? '返回圖鑑' : '再抽一次'}
          </motion.button>

          <motion.button
            onClick={handleOpenShare}
            className="px-8 py-4 bg-night-700/80 text-primary-300 rounded-full font-medium border border-primary-500/30 hover:bg-night-700 transition-colors text-lg flex items-center justify-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            分享花語
          </motion.button>
        </motion.div>

        {/* SSR Congratulations message */}
        {isSSR && !isFromCollection && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mb-6"
          >
            <motion.div
              className="inline-block px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full text-white font-bold text-lg shadow-2xl"
              animate={{
                boxShadow: [
                  '0 0 20px rgba(255, 215, 0, 0.5)',
                  '0 0 40px rgba(255, 215, 0, 0.8)',
                  '0 0 20px rgba(255, 215, 0, 0.5)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🎉 恭喜獲得稀有SSR花語！🎉
            </motion.div>
          </motion.div>
        )}

        {/* Footer */}
        <motion.div
          variants={!isFromCollection ? itemVariants : undefined}
          initial={isFromCollection ? { opacity: 0, y: 30 } : undefined}
          animate={isFromCollection ? { opacity: 1, y: 0 } : undefined}
          transition={isFromCollection ? { duration: 0.6, delay: 0.7 } : undefined}
          className="text-center text-gray-400 text-sm"
        >
          <p>願今夜的花語指引你</p>
          <p className="mt-2">在鹽埕找到屬於自己的故事</p>
        </motion.div>
      </div>

      {/* 分享 Modal */}
      <AnimatePresence>
        {showShare && (
          <ShareModal
            flower={flower}
            emotionData={emotionData}
            flowerImageUrl={flowerSnapshot}
            onClose={() => setShowShare(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default FortuneResult
