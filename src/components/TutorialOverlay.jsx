import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const TUTORIAL_KEY = 'chenghua_tutorial_v1'
const SESSION_STEP_KEY = 'chenghua_tutorial_step'
const PAD = 10

// 步驟與 app stage 的對應關係（用於中斷防呆）
// fullscreen 步驟（0, 15）不限 stage
const STEP_STAGE_MAP = {
  1: 'landing',
  2: 'gacha',
  3: 'result', 4: 'result', 5: 'result', 6: 'result', 7: 'result',
  8: 'landing',
  9: 'collection', 10: 'collection', 11: 'collection', 12: 'collection',
  13: 'landing', 14: 'landing',
}

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
    bodyHtml: '<span style="color:#F2BE5C;font-weight:700">點擊</span>任意一枝花，開啟你的花語抽籤',
    note: '此次抽籤不會收錄到圖鑑內',
    advanceOnStage: 'gacha',
  },
  // 2: Watch gacha (gacha)
  {
    type: 'spotlight', target: 'gacha-card', placement: 'bottom',
    title: '翻牌揭曉',
    bodyHtml: '<span style="color:#F2BE5C;font-weight:700">點擊</span>卡牌，揭開屬於你的花語',
    advanceOnClick: 'gacha-card',
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
    type: 'spotlight', target: 'flower-story', placement: 'bottom',
    title: '花之物語',
    body: '每朵花都有專屬的鹽埕在地故事\n在巷弄間悄悄生長的城市記憶',
    cta: '下一步',
  },
  // 5: Locations / artworks (result)
  {
    type: 'spotlight', target: 'locations', placement: 'bottom',
    title: '推薦前往的裝置藝術作品',
    bodyHtml: '花語為你挑選了本次展覽的作品<br/><span style="color:#F2BE5C;font-weight:600">📍 記得前往現場參觀！</span>',
    cta: '下一步',
  },
  // 6: Share button (result) ── 只介紹，不需點擊
  {
    type: 'spotlight', target: 'share-btn', placement: 'top',
    title: '分享花語',
    body: '將今夜的花語製成卡片\n分享給重要的人',
    cta: '知道了',
  },
  // 7: Return button (result)
  {
    type: 'spotlight', target: 'return-btn', placement: 'top',
    title: '收下花語',
    body: '點擊按鈕，回到主頁繼續探索',
    advanceOnStage: 'landing',
  },
  // 8: Collection button (landing)
  {
    type: 'spotlight', target: 'collection-btn', placement: 'bottom',
    title: '📖 我的圖鑑',
    body: '點擊右上角的圖鑑\n查看你收集的所有花語',
    advanceOnStage: 'collection',
  },
  // 9: Collection progress
  {
    type: 'spotlight', target: 'collection-progress', placement: 'bottom',
    title: '蒐集進度',
    body: '追蹤你的蒐集進度\n20 種花語等你一一解鎖',
    cta: '下一步',
  },
  // 10: Click a card
  {
    type: 'spotlight', target: 'collection-card', placement: 'top',
    title: '花語卡片',
    body: '點擊卡片查看完整的花語故事',
    advanceOnClick: 'collection-card',
  },
  // 11: Card detail info
  {
    type: 'banner', placement: 'bottom',
    title: '卡片詳情',
    body: '每張卡片都有花語故事、個人訊息\n與裝置藝術展覽資訊',
    cta: '下一步',
  },
  // 12: Close collection → back to landing
  {
    type: 'spotlight', target: 'back-btn', placement: 'bottom',
    title: '返回主頁',
    body: '點擊關閉圖鑑，回到主頁繼續探索',
    advanceOnStage: 'landing',
  },
  // 13: Auth button
  {
    type: 'spotlight', target: 'auth-btn', placement: 'bottom',
    title: '📲 登入 / 註冊',
    body: '建立帳號，跨裝置同步花語收藏\n不怕換手機也遺失！',
    cta: '知道了',
  },
  // 14: QR scan
  {
    type: 'spotlight', target: 'qr-btn', placement: 'top',
    title: '📷 掃描 QR Code',
    body: '走到展覽現場，掃描作品旁的 QR Code\n解鎖專屬花卡，開始你的花語旅程',
    cta: '知道了',
  },
  // 15: Complete
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
      {cur.bodyHtml
        ? <p className="text-white/58 text-xs leading-relaxed whitespace-pre-line mb-2" dangerouslySetInnerHTML={{ __html: cur.bodyHtml }} />
        : <p className="text-white/58 text-xs leading-relaxed whitespace-pre-line mb-2">{cur.body}</p>
      }
      {cur.note && (
        <p className="text-xs leading-relaxed mb-3" style={{ color: 'rgba(242,100,80,0.90)' }}>{cur.note}</p>
      )}

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

const DEV_LINE_IDS = ['U82cbfec05fb2bdcf9d5430f38dacc417']

function isDevUser(user) {
  if (!user) return false
  return DEV_LINE_IDS.some(id =>
    user.user_metadata?.sub === id ||
    user.user_metadata?.provider_id === id ||
    user.identities?.some(i => i.identity_data?.sub === id)
  )
}

const FS_BG = [
  'radial-gradient(ellipse 100% 55% at 50% -5%, rgba(91,123,168,0.28) 0%, transparent 65%)',
  'radial-gradient(ellipse 85% 50% at 48% 32%, rgba(242,210,190,0.22) 0%, transparent 58%)',
  'radial-gradient(ellipse 160% 60% at 50% 108%, rgba(224,88,72,0.42) 0%, rgba(242,126,147,0.28) 38%, transparent 62%)',
  'linear-gradient(175deg, #0e1428 0%, #1a2645 52%, #131e38 100%)',
].join(', ')

// ── Skip confirm dialog ───────────────────────────────────────────────────────
function SkipConfirm({ onConfirm, onCancel }) {
  return (
    <motion.div
      className="fixed inset-0 z-[10001] flex items-center justify-center px-8"
      style={{ background: 'rgba(8,14,32,0.60)', backdropFilter: 'blur(8px)', pointerEvents: 'auto' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-xs rounded-2xl p-6 text-center"
        style={{
          background: 'rgba(14,20,42,0.97)',
          border: '1px solid rgba(242,190,92,0.22)',
          boxShadow: '0 12px 48px rgba(0,0,0,0.55)',
        }}
        initial={{ scale: 0.88, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      >
        <p className="text-white font-semibold text-base mb-2">確定跳過導覽？</p>
        <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(242,100,80,0.90)' }}>
          跳過後將不再顯示引導
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.65)' }}
          >
            繼續導覽
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, rgba(242,126,147,0.85), rgba(242,190,92,0.85))' }}
          >
            確定跳過
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function TutorialOverlay({ appStage, user, onActiveChange }) {
  const [step, setStep] = useState(0)
  const [active, setActive] = useState(false)
  const [showSkipConfirm, setShowSkipConfirm] = useState(false)

  // 初始化：恢復 sessionStorage 中的進度（同一 session 中斷後繼續）
  useEffect(() => {
    if (isDevUser(user) || !localStorage.getItem(TUTORIAL_KEY)) {
      const saved = parseInt(sessionStorage.getItem(SESSION_STEP_KEY) || '0', 10)
      setStep(Number.isFinite(saved) && saved > 0 && saved < STEPS.length ? saved : 0)
      setActive(true)
    }
  }, [user])

  // 每次 step 變化時存入 sessionStorage
  useEffect(() => {
    if (active && step > 0) sessionStorage.setItem(SESSION_STEP_KEY, String(step))
  }, [step, active])

  useEffect(() => { onActiveChange?.(active) }, [active, onActiveChange])

  // Stage 一致性防呆：若 appStage 與當前步驟的預期 stage 不符，自動跳回對應步驟
  // 避免使用者中途返回主頁時引導卡在錯誤狀態
  useEffect(() => {
    if (!active) return
    const expected = STEP_STAGE_MAP[step]
    if (!expected || appStage === expected) return

    if (appStage === 'landing') {
      if (step >= 2 && step <= 7) {
        // 從 gacha/result 返回 landing → 重回選花步驟
        setStep(1)
      } else if (step >= 9 && step <= 12) {
        // 從 collection 返回 landing → 重回圖鑑入口步驟
        setStep(8)
      }
    }
  }, [appStage, step, active])

  const cur = STEPS[step] ?? STEPS[0]
  const targetKey = cur.type === 'spotlight' ? cur.target : null
  const rawRect = useTargetRect(targetKey)
  const spotRect = rawRect ? {
    top: rawRect.top - PAD,
    left: rawRect.left - PAD,
    width: rawRect.width + PAD * 2,
    height: rawRect.height + PAD * 2,
  } : null

  // Result 頁面步驟（3–7）滾動鎖定
  const SCROLL_LOCK_STEPS = [3, 4, 5, 6, 7]
  useEffect(() => {
    if (!active || !SCROLL_LOCK_STEPS.includes(step)) {
      document.body.style.overflow = ''
      const c = document.querySelector('[data-scroll-lock]')
      if (c) c.style.overflow = ''
      return
    }

    const target = STEPS[step]?.target
    if (target) {
      const el = document.querySelector(`[data-tutorial="${target}"]`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    const t = setTimeout(() => {
      document.body.style.overflow = 'hidden'
      const c = document.querySelector('[data-scroll-lock]')
      if (c) c.style.overflow = 'hidden'
    }, 500)

    return () => {
      clearTimeout(t)
      document.body.style.overflow = ''
      const c = document.querySelector('[data-scroll-lock]')
      if (c) c.style.overflow = ''
    }
  }, [active, step]) // eslint-disable-line react-hooks/exhaustive-deps

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
      sessionStorage.removeItem(SESSION_STEP_KEY)
      localStorage.setItem(TUTORIAL_KEY, '1')
      setActive(false)
    } else {
      setStep(s => s + 1)
    }
  }
  const handleSkip = () => setShowSkipConfirm(true)
  const handleSkipConfirm = () => {
    sessionStorage.removeItem(SESSION_STEP_KEY)
    localStorage.setItem(TUTORIAL_KEY, '1')
    setActive(false)
    setShowSkipConfirm(false)
  }
  const handleSkipCancel = () => setShowSkipConfirm(false)

  if (!active) return null

  // ── Fullscreen ────────────────────────────────────────────────────────────
  if (cur.type === 'fullscreen') {
    return (
      <>
      <motion.div
        key={`fs-${step}`}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center px-8"
        style={{ background: FS_BG, backdropFilter: 'blur(12px)' }}
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
      <AnimatePresence>
        {showSkipConfirm && <SkipConfirm onConfirm={handleSkipConfirm} onCancel={handleSkipCancel} />}
      </AnimatePresence>
      </>
    )
  }

  // ── Tooltip positioning ───────────────────────────────────────────────────
  const isLowerHalf = spotRect
    ? (spotRect.top + spotRect.height / 2) > window.innerHeight * 0.55
    : false
  const showAbove = cur.placement === 'top' || (cur.placement !== 'bottom' && isLowerHalf)

  const tooltipStyle = (() => {
    if (cur.type === 'banner') {
      return cur.placement === 'top' ? { top: 64 } : { bottom: 52 }
    }
    if (!spotRect) return { top: '50%', transform: 'translateY(-50%)' }
    if (cur.placement === 'bottom') return { bottom: 'max(16px, env(safe-area-inset-bottom, 16px))' }
    if (showAbove) {
      return { bottom: Math.max(12, window.innerHeight - spotRect.top + 14) }
    }
    const rawTop = spotRect.top + spotRect.height + 14
    return { top: Math.min(rawTop, window.innerHeight - 150) }
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
              boxShadow: '0 0 0 9999px rgba(14,20,40,0.74)',
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

      {/* Tooltip — spotlight 步驟等到目標出現後才顯示 */}
      {(cur.type !== 'spotlight' || spotRect) && (
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
      )}

      <AnimatePresence>
        {showSkipConfirm && <SkipConfirm onConfirm={handleSkipConfirm} onCancel={handleSkipCancel} />}
      </AnimatePresence>
    </div>
  )
}
