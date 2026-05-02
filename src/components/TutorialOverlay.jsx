import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const TUTORIAL_KEY = 'chenghua_tutorial_v1'
const PAD = 10

// ── Step definitions ─────────────────────────────────────────────────────────
const STEPS = [
  // 0: Welcome
  {
    type: 'fullscreen', emoji: '🌸',
    title: '歡迎來到埕花',
    body: '2026 鹽夏不夜埕的花語體驗\n讓花語為你指引今夜的旅程',
    cta: '開始導覽',
  },
  // 1: Pick flower (landing)
  {
    type: 'spotlight', target: 'flowers', placement: 'bottom',
    title: '選一枝花',
    body: '點擊任意一枝花\n開啟你的花語抽籤',
    advanceOnStage: 'gacha',
  },
  // 2: Watch gacha (gacha)
  {
    type: 'banner', placement: 'top',
    title: '🃏 翻牌揭曉',
    body: '靜候花語顯現，點擊卡牌可加速翻面',
    advanceOnStage: 'result',
  },
  // 3: Flower name (result)
  {
    type: 'spotlight', target: 'flower-name', placement: 'bottom',
    title: '你的花語',
    body: '這是今夜屬於你的花語\n每朵花都有獨特的寓意',
    cta: '下一步',
  },
  // 4: Story (result)
  {
    type: 'spotlight', target: 'flower-story', placement: 'top',
    title: '花之物語',
    body: '花語與鹽夏不夜埕的在地故事交織\n感受城市的溫度',
    cta: '下一步',
  },
  // 5: Locations (result)
  {
    type: 'spotlight', target: 'locations', placement: 'top',
    title: '今夜推薦',
    body: '花語指引你探索三個特別的地點\n出發去看看吧！',
    cta: '下一步',
  },
  // 6: Return button (result)
  {
    type: 'spotlight', target: 'return-btn', placement: 'top',
    title: '收下花語',
    body: '點擊按鈕，回到主頁繼續探索',
    advanceOnStage: 'landing',
  },
  // 7: Collection button (landing)
  {
    type: 'spotlight', target: 'collection-btn', placement: 'bottom',
    title: '📖 我的圖鑑',
    body: '點擊右上角的圖鑑\n查看你收集的所有花語',
    advanceOnStage: 'collection',
  },
  // 8: Collection progress
  {
    type: 'spotlight', target: 'collection-progress', placement: 'bottom',
    title: '蒐集進度',
    body: '追蹤你的蒐集進度\n20 種花語等你一一解鎖',
    cta: '下一步',
  },
  // 9: Click a card
  {
    type: 'spotlight', target: 'collection-card', placement: 'top',
    title: '花語卡片',
    body: '點擊卡片查看完整的花語故事',
    advanceOnClick: 'collection-card',
  },
  // 10: Card detail info
  {
    type: 'banner', placement: 'bottom',
    title: '卡片詳情',
    body: '每張卡片都有花語故事、個人訊息\n與在地景點推薦',
    cta: '下一步',
  },
  // 11: Close collection → back to landing
  {
    type: 'spotlight', target: 'back-btn', placement: 'bottom',
    title: '返回主頁',
    body: '點擊關閉圖鑑，回到主頁繼續探索',
    advanceOnStage: 'landing',
  },
  // 12: Auth button
  {
    type: 'spotlight', target: 'auth-btn', placement: 'bottom',
    title: '📲 登入 / 註冊',
    body: '建立帳號，跨裝置同步花語收藏\n不怕換手機也遺失！',
    cta: '知道了',
  },
  // 13: Complete
  {
    type: 'fullscreen', emoji: '✨',
    title: '準備好了！',
    body: '開始你的花語旅程\n每一枝花，都是今夜獨特的緣分',
    cta: '出發探索！',
  },
]

// ── Hook: poll target element rect ───────────────────────────────────────────
function useTargetRect(key) {
  const [rect, setRect] = useState(null)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!key) { setRect(null); return }

    const update = () => {
      const el = document.querySelector(`[data-tutorial="${key}"]`)
      if (!el) { setRect(null); return }
      const r = el.getBoundingClientRect()
      // scroll into view if outside viewport
      if (r.bottom < 0 || r.top > window.innerHeight) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
    }

    update()
    timerRef.current = setInterval(update, 160)
    window.addEventListener('resize', update)
    return () => { clearInterval(timerRef.current); window.removeEventListener('resize', update) }
  }, [key])

  return rect
}

// ── Step progress dots ───────────────────────────────────────────────────────
function ProgressDots({ current, total }) {
  return (
    <div className="flex gap-1 items-center">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="h-1 rounded-full transition-all duration-300"
          style={{
            width: i === current ? 14 : 4,
            background: i === current ? '#F2BE5C' : 'rgba(255,255,255,0.18)',
          }}
        />
      ))}
    </div>
  )
}

// ── Tooltip card ─────────────────────────────────────────────────────────────
function TooltipCard({ step, cur, onNext, onSkip, showAbove }) {
  return (
    <motion.div
      key={`tip-${step}`}
      className="mx-auto max-w-sm rounded-2xl p-4"
      style={{
        background: 'rgba(10, 16, 38, 0.96)',
        border: '1px solid rgba(242,190,92,0.30)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 36px rgba(0,0,0,0.50)',
      }}
      initial={{ opacity: 0, y: showAbove ? 8 : -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
    >
      <div className="flex items-center justify-between mb-2.5">
        <ProgressDots current={step} total={STEPS.length} />
        <button onClick={onSkip} className="text-white/28 text-xs hover:text-white/55 transition-colors">
          跳過
        </button>
      </div>

      <h3 className="text-white font-semibold text-sm mb-1.5">{cur.title}</h3>
      <p className="text-white/58 text-xs leading-relaxed whitespace-pre-line mb-3">{cur.body}</p>

      {cur.cta ? (
        <motion.button
          onClick={onNext}
          className="w-full py-2 rounded-xl text-white font-medium text-xs"
          style={{ background: 'linear-gradient(135deg, rgba(242,126,147,0.85), rgba(242,190,92,0.85))' }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          {cur.cta}
        </motion.button>
      ) : (
        <p className="text-amber-400/42 text-xs text-center">依提示操作自動前進</p>
      )}
    </motion.div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function TutorialOverlay({ appStage }) {
  const [step, setStep] = useState(0)
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(TUTORIAL_KEY)) setActive(true)
  }, [])

  const cur = STEPS[step] ?? STEPS[0]
  const targetKey = cur.type === 'spotlight' ? cur.target : null
  const rawRect = useTargetRect(targetKey)
  const spotRect = rawRect ? {
    top: rawRect.top - PAD,
    left: rawRect.left - PAD,
    width: rawRect.width + PAD * 2,
    height: rawRect.height + PAD * 2,
  } : null

  // Auto-advance when app stage matches
  useEffect(() => {
    if (!active || !cur.advanceOnStage) return
    if (appStage === cur.advanceOnStage) {
      const t = setTimeout(() => setStep(s => s + 1), 480)
      return () => clearTimeout(t)
    }
  }, [appStage, cur.advanceOnStage, active])

  // Advance on click of annotated element
  useEffect(() => {
    if (!active || !cur.advanceOnClick) return
    const key = cur.advanceOnClick
    const handler = (e) => {
      if (e.target.closest(`[data-tutorial="${key}"]`)) {
        setTimeout(() => setStep(s => s + 1), 480)
      }
    }
    document.addEventListener('click', handler, true)
    return () => document.removeEventListener('click', handler, true)
  }, [active, cur.advanceOnClick])

  const handleNext = () => {
    if (step >= STEPS.length - 1) {
      localStorage.setItem(TUTORIAL_KEY, '1')
      setActive(false)
    } else {
      setStep(s => s + 1)
    }
  }
  const handleSkip = () => { localStorage.setItem(TUTORIAL_KEY, '1'); setActive(false) }

  if (!active) return null

  // ── Fullscreen ────────────────────────────────────────────────────────────
  if (cur.type === 'fullscreen') {
    return (
      <motion.div
        key={`fs-${step}`}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center px-8"
        style={{ background: 'rgba(8,12,28,0.97)', backdropFilter: 'blur(18px)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        {step < STEPS.length - 1 && (
          <button
            onClick={handleSkip}
            className="absolute top-5 right-5 text-white/32 text-sm hover:text-white/60 transition-colors px-3 py-1.5"
          >
            跳過導覽
          </button>
        )}
        <motion.div
          className="text-center max-w-xs"
          initial={{ scale: 0.88, opacity: 0, y: 18 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ delay: 0.08, type: 'spring', stiffness: 250, damping: 22 }}
        >
          <motion.div
            className="text-7xl mb-8"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            {cur.emoji}
          </motion.div>
          <h2 className="text-white text-2xl font-bold mb-4 tracking-wide">{cur.title}</h2>
          <p className="text-white/60 text-[15px] leading-relaxed mb-10 whitespace-pre-line">{cur.body}</p>
          <motion.button
            onClick={handleNext}
            className="px-10 py-3.5 rounded-2xl text-white font-semibold text-base shadow-lg"
            style={{ background: 'linear-gradient(135deg, #F27E93, #F2BE5C)' }}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          >
            {cur.cta}
          </motion.button>
        </motion.div>
      </motion.div>
    )
  }

  // ── Tooltip positioning ───────────────────────────────────────────────────
  const isLowerHalf = spotRect
    ? (spotRect.top + spotRect.height / 2) > window.innerHeight * 0.55
    : false
  const showAbove = cur.placement === 'top' || isLowerHalf

  const tooltipStyle = (() => {
    if (cur.type === 'banner') {
      return cur.placement === 'top' ? { top: 64 } : { bottom: 52 }
    }
    if (!spotRect) return { top: '50%', transform: 'translateY(-50%)' }
    if (showAbove) {
      return { bottom: Math.max(12, window.innerHeight - spotRect.top + 14) }
    }
    return { top: Math.min(window.innerHeight - 180, spotRect.top + spotRect.height + 14) }
  })()

  // ── Spotlight + Banner ───────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[9998] pointer-events-none">

      {/* Dark mask with spotlight hole */}
      {spotRect && (
        <>
          <div
            style={{
              position: 'fixed',
              top: spotRect.top, left: spotRect.left,
              width: spotRect.width, height: spotRect.height,
              borderRadius: 14,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.68)',
              zIndex: 9998,
              pointerEvents: 'none',
            }}
          />
          {/* Pulsing ring */}
          <motion.div
            style={{
              position: 'fixed',
              top: spotRect.top - 4, left: spotRect.left - 4,
              width: spotRect.width + 8, height: spotRect.height + 8,
              borderRadius: 18,
              border: '2px solid rgba(242,190,92,0.80)',
              zIndex: 9999,
              pointerEvents: 'none',
            }}
            animate={{ opacity: [0.5, 1, 0.5], scale: [0.985, 1.015, 0.985] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        </>
      )}

      {/* Tooltip */}
      <div
        className="fixed left-3 right-3 pointer-events-auto"
        style={{ zIndex: 10000, ...tooltipStyle }}
      >
        <TooltipCard
          step={step}
          cur={cur}
          onNext={handleNext}
          onSkip={handleSkip}
          showAbove={showAbove}
        />
      </div>
    </div>
  )
}
