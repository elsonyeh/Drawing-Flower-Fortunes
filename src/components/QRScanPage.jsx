import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Html5Qrcode } from 'html5-qrcode'

export default function QRScanPage({ onScanSuccess, onBack }) {
  const [status, setStatus] = useState('init') // 'init', 'scanning', 'error'
  const [errorMsg, setErrorMsg] = useState('')
  const qrRef = useRef(null)
  const successFiredRef = useRef(false)

  useEffect(() => {
    // 同步清空容器，避免 StrictMode 雙重 mount 留下兩個 video 元素
    const container = document.getElementById('qr-reader-container')
    if (container) container.innerHTML = ''

    const qr = new Html5Qrcode('qr-reader-container')
    qrRef.current = qr

    qr.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 240, height: 240 } },
      (decodedText) => {
        if (successFiredRef.current) return
        try {
          const url = new URL(decodedText)
          const zone = url.searchParams.get('zone')
          const work = url.searchParams.get('work')
          const name = url.searchParams.get('name')
          if (zone && work) {
            successFiredRef.current = true
            onScanSuccess({ zone, workId: work, workName: name ? decodeURIComponent(name) : work })
          } else {
            setErrorMsg('不是展覽 QR Code，請掃描展場的作品 QR Code')
            setStatus('error')
          }
        } catch {
          setErrorMsg('無法識別此 QR Code，請重試')
          setStatus('error')
        }
      },
      () => { /* ignore frame errors */ }
    ).then(() => {
      setStatus('scanning')
    }).catch(() => {
      setStatus('error')
      setErrorMsg('無法開啟相機，請允許相機使用權限後重試')
    })

    return () => {
      // 無論 scanner 是否已啟動都嘗試 stop + clear
      // stop() 可能因 scanner 尚未啟動而丟錯，統一吞掉
      try {
        qr.stop()
          .then(() => { try { qr.clear() } catch {} })
          .catch(() => { try { qr.clear() } catch {} })
      } catch {
        try { qr.clear() } catch {}
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRetry = () => {
    setErrorMsg('')
    setStatus('scanning')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black flex flex-col z-50"
    >
      {/* Header */}
      <div className="flex items-center gap-4 px-5 py-4 bg-black/70 backdrop-blur-sm border-b border-white/10">
        <button
          onClick={onBack}
          className="text-white/60 hover:text-white transition-colors text-sm flex items-center gap-1"
        >
          ← 返回
        </button>
        <h2 className="text-white font-bold flex-1 text-center tracking-wide">掃描作品 QR Code</h2>
        <div className="w-12" />
      </div>

      {/* Scanner */}
      <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6">
        {status === 'scanning' && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-white/50 text-sm text-center"
          >
            將鏡頭對準展場作品旁的 QR Code
          </motion.p>
        )}

        {/* Camera view */}
        <div className="relative w-full max-w-xs">
          <div
            id="qr-reader-container"
            className="w-full rounded-2xl overflow-hidden bg-black"
            style={{ minHeight: 280 }}
          />
          {/* Corner overlay */}
          {status === 'scanning' && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Scanning animation */}
              <motion.div
                className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent"
                animate={{ top: ['20%', '80%', '20%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
              {/* Corner markers */}
              {[
                'top-2 left-2 border-t-2 border-l-2',
                'top-2 right-2 border-t-2 border-r-2',
                'bottom-2 left-2 border-b-2 border-l-2',
                'bottom-2 right-2 border-b-2 border-r-2',
              ].map((cls, i) => (
                <div key={i} className={`absolute w-6 h-6 border-purple-400 rounded-sm ${cls}`} />
              ))}
            </div>
          )}
        </div>

        {status === 'init' && (
          <p className="text-white/40 text-sm">正在啟動相機⋯</p>
        )}

        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/15 border border-red-500/40 rounded-2xl p-5 text-center max-w-xs w-full"
          >
            <p className="text-red-300 text-sm mb-4">{errorMsg}</p>
            <button
              onClick={handleRetry}
              className="bg-white/10 hover:bg-white/20 text-white text-sm px-5 py-2 rounded-full transition-colors"
            >
              再試一次
            </button>
          </motion.div>
        )}
      </div>

      <div className="pb-8 text-center">
        <button
          onClick={onBack}
          className="text-white/30 text-sm hover:text-white/60 transition-colors"
        >
          取消
        </button>
      </div>
    </motion.div>
  )
}
