import { useState } from 'react'
import { motion } from 'framer-motion'

export default function FirstFlowerToast({ onClose }) {
  const [rated, setRated] = useState(false)
  const [hover, setHover] = useState(0)

  const handleRate = (score) => {
    if (rated) return
    setRated(true)
    localStorage.setItem('chenghua_first_rating_seen', String(score))
  }

  const handleClose = () => {
    localStorage.setItem('chenghua_first_rating_seen', 'skipped')
    onClose()
  }

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6"
      initial={{ y: 120, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 120, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 22, delay: 1.2 }}
    >
      <div style={{
        position: 'relative',
        background: 'rgba(14,20,42,0.95)',
        border: '1px solid rgba(242,126,147,0.28)',
        borderRadius: 16,
        padding: '16px 20px 14px',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        boxShadow: '0 -4px 40px rgba(0,0,0,0.4)',
      }}>
        <button onClick={handleClose} style={{
          position: 'absolute', top: 8, right: 12,
          background: 'none', border: 'none',
          color: 'rgba(242,217,208,0.35)', fontSize: 20,
          cursor: 'pointer', lineHeight: 1,
        }}>×</button>

        <p style={{ color: '#f2d9d0', fontSize: 13, fontWeight: 600, textAlign: 'center', marginBottom: 4 }}>
          🌸 恭喜蒐集到第一朵花！
        </p>
        <p style={{ color: 'rgba(242,217,208,0.6)', fontSize: 11, textAlign: 'center', marginBottom: 12 }}>
          這次體驗如何？
        </p>

        {!rated ? (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
            {[1, 2, 3, 4, 5].map(i => (
              <button key={i} onClick={() => handleRate(i)}
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)}
                style={{
                  background: 'none', border: 'none', fontSize: 26, cursor: 'pointer',
                  opacity: i <= (hover || 0) ? 1 : 0.28,
                  transition: 'opacity 0.15s', padding: 2,
                }}>
                🌸
              </button>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#F2BE5C', fontSize: 13, marginBottom: 8 }}>謝謝你的回饋 🙏</p>
            <a href="https://forms.gle/fNJTKrez1tX1M8X58" target="_blank" rel="noreferrer"
              style={{ color: '#f27e93', fontSize: 12, textDecoration: 'underline' }}>
              想多說一點嗎？→
            </a>
          </div>
        )}
      </div>
    </motion.div>
  )
}
