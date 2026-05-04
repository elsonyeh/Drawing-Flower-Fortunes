import { motion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { sendCompletionEmail } from '../utils/collectionSync'

// 52 particles burst radially from center
const PARTICLES = Array.from({ length: 52 }, (_, i) => {
  const angle = (i / 52) * Math.PI * 2 + (Math.random() - 0.5) * 0.3
  const dist = 90 + Math.random() * 140
  const palette = ['#f27e93', '#F2BE5C', '#f2d9d0', '#c4b5fd', '#fb923c', '#a5f3fc']
  return {
    id: i,
    x: Math.cos(angle) * dist,
    y: Math.sin(angle) * dist,
    size: 3 + Math.random() * 7,
    color: palette[i % palette.length],
    delay: Math.random() * 0.4,
    dur: 1.0 + Math.random() * 0.9,
  }
})

export default function CollectionComplete({ user, needsEmail, onClose, isTest = false }) {
  const [phase, setPhase] = useState(0)
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const t = [
      setTimeout(() => setPhase(1), 300),   // particles burst
      setTimeout(() => setPhase(2), 1000),  // 埕花 title
      setTimeout(() => setPhase(3), 2000),  // main text
      setTimeout(() => setPhase(4), 2900),  // subtitle
      setTimeout(() => setPhase(5), 3700),  // content card
    ]
    return () => t.forEach(clearTimeout)
  }, [])

  // Users with email: auto-send when card appears (skip in test mode)
  useEffect(() => {
    if (phase < 5 || needsEmail || result) return
    if (isTest) { setResult({ prizeClaimed: true, rank: 1 }); return }
    sendCompletionEmail(user).then(setResult)
  }, [phase, needsEmail, result, user, isTest])

  // Focus email input for LINE users
  useEffect(() => {
    if (phase === 5 && needsEmail) setTimeout(() => inputRef.current?.focus(), 200)
  }, [phase, needsEmail])

  const handleSubmit = async () => {
    const trimmed = email.trim()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return
    setSubmitting(true)
    const r = isTest
      ? { prizeClaimed: true, rank: 1 }
      : await sendCompletionEmail(user, trimmed)
    setResult(r)
    setSubmitting(false)
  }

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center overflow-hidden"
      style={{ zIndex: 200, background: 'radial-gradient(ellipse at 50% 35%, #1a0d38 0%, #0e142a 55%, #070d1a 100%)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Burst particles */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {phase >= 1 && PARTICLES.map(p => (
          <motion.div key={p.id} className="absolute rounded-full"
            style={{ width: p.size, height: p.size, background: p.color,
              left: '50%', top: '50%', marginLeft: -p.size / 2, marginTop: -p.size / 2 }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
            animate={{ x: p.x, y: p.y, opacity: [0, 1, 1, 0], scale: [0, 1.3, 1, 0] }}
            transition={{ duration: p.dur, delay: p.delay, ease: 'easeOut' }}
          />
        ))}
      </div>

      {/* Glow rings */}
      {phase >= 2 && [300, 200, 120].map((size, i) => (
        <motion.div key={i} className="absolute pointer-events-none"
          style={{ width: size, height: size, borderRadius: '50%',
            border: `1px solid rgba(242,190,92,${0.20 - i * 0.05})` }}
          initial={{ scale: 0.1, opacity: 0 }}
          animate={{ scale: [0.1, 1.7, 1.2], opacity: [0, 0.8, 0.12 + i * 0.04] }}
          transition={{ duration: 1.5, delay: i * 0.14, ease: 'easeOut' }}
        />
      ))}

      {/* Central content */}
      <div className="relative text-center px-6 w-full" style={{ zIndex: 10, maxWidth: 320 }}>

        {/* 埕花 */}
        {phase >= 2 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.15 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 160, damping: 13 }}
          >
            <div style={{
              fontSize: 66, fontWeight: 700, letterSpacing: 10, color: '#F2BE5C', lineHeight: 1,
              textShadow: '0 0 20px rgba(242,190,92,1), 0 0 50px rgba(242,190,92,0.7), 0 0 100px rgba(242,190,92,0.35)',
            }}>
              埕花
            </div>
          </motion.div>
        )}

        {/* Main text */}
        {phase >= 3 && (
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            style={{ fontSize: 16, color: '#f2d9d0', letterSpacing: 3.5, margin: '16px 0 8px' }}
          >
            走遍鹽埕 · 花語任務達成
          </motion.p>
        )}

        {/* Subtitle */}
        {phase >= 4 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9 }}
            style={{ fontSize: 11, color: 'rgba(242,217,208,0.38)', letterSpacing: 3.5, marginBottom: 28 }}
          >
            ✨ 隱 藏 成 就 解 鎖 ✨
          </motion.p>
        )}

        {/* Content card */}
        {phase >= 5 && (
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ background: 'rgba(242,126,147,0.07)', border: '1px solid rgba(242,126,147,0.22)', borderRadius: 16, padding: '22px 18px' }}
          >
            {needsEmail && !result ? (
              <EmailForm
                inputRef={inputRef}
                email={email}
                setEmail={setEmail}
                submitting={submitting}
                onSubmit={handleSubmit}
                onSkip={onClose}
              />
            ) : result ? (
              <PrizeResult result={result} onClose={onClose} />
            ) : (
              <div style={{ textAlign: 'center', padding: '14px 0', color: 'rgba(242,217,208,0.4)', fontSize: 13 }}>
                傳送恭賀信件中⋯⋯
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Close button */}
      {phase >= 5 && (
        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          onClick={onClose}
          style={{ position: 'absolute', top: 20, right: 20, fontSize: 26, color: 'rgba(242,217,208,0.22)',
            background: 'transparent', border: 'none', cursor: 'pointer', lineHeight: 1, zIndex: 10 }}
        >
          ×
        </motion.button>
      )}
    </motion.div>
  )
}

function EmailForm({ inputRef, email, setEmail, submitting, onSubmit, onSkip }) {
  return (
    <>
      <p style={{ fontSize: 13, color: 'rgba(242,217,208,0.7)', textAlign: 'center', lineHeight: 1.85, marginBottom: 14 }}>
        填寫 Email 以接收<br />隱藏任務恭賀通知
      </p>
      <input
        ref={inputRef}
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onSubmit()}
        placeholder="your@email.com"
        style={{
          width: '100%', boxSizing: 'border-box',
          background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(242,126,147,0.28)',
          borderRadius: 8, padding: '10px 12px', color: '#f2d9d0', fontSize: 14, outline: 'none', marginBottom: 10,
        }}
      />
      <button
        onClick={onSubmit} disabled={submitting}
        style={{
          width: '100%', padding: '11px', borderRadius: 10, border: 'none',
          cursor: submitting ? 'default' : 'pointer',
          background: submitting ? 'rgba(242,126,147,0.3)' : 'linear-gradient(135deg,#f27e93,#F2BE5C)',
          color: '#0e142a', fontWeight: 700, fontSize: 14, letterSpacing: 1,
        }}
      >
        {submitting ? '送出中...' : '確認送出'}
      </button>
      <button
        onClick={onSkip}
        style={{ width: '100%', marginTop: 8, padding: 8, background: 'transparent', border: 'none',
          color: 'rgba(242,217,208,0.28)', fontSize: 12, cursor: 'pointer' }}
      >
        跳過
      </button>
    </>
  )
}

function PrizeResult({ result, onClose }) {
  const { prizeClaimed, rank } = result
  const btn = {
    width: '100%', marginTop: 14, padding: '10px', borderRadius: 10, border: 'none',
    cursor: 'pointer', background: 'linear-gradient(135deg,#f27e93,#F2BE5C)',
    color: '#0e142a', fontWeight: 700, fontSize: 14,
  }

  if (!prizeClaimed) return (
    <>
      <p style={{ fontSize: 15, fontWeight: 600, color: '#f2d9d0', textAlign: 'center', marginBottom: 8 }}>
        🌸 恭喜集滿花語！
      </p>
      <p style={{ fontSize: 12, color: 'rgba(242,217,208,0.5)', textAlign: 'center', lineHeight: 1.9 }}>
        很遺憾，本次活動獎品（共 10 份）<br />已全數兌換完畢。<br />感謝你的熱情參與！
      </p>
      <button onClick={onClose} style={btn}>關閉</button>
    </>
  )

  return (
    <>
      <p style={{ fontSize: 13, color: '#F2BE5C', fontWeight: 700, marginBottom: 8, letterSpacing: 0.5 }}>
        🎁 恭賀郵件已寄出！
      </p>
      <p style={{ fontSize: 12, color: 'rgba(242,217,208,0.65)', lineHeight: 1.9, marginBottom: 0 }}>
        你是第 <strong style={{ color: '#f27e93', fontSize: 14 }}>{rank}</strong> 位蒐齊花語的旅人。<br />
        請至信箱查看領獎說明，<br />
        依信中指示回覆預約時間即可。
      </p>
      <button onClick={onClose} style={btn}>繼續探索</button>
    </>
  )
}
