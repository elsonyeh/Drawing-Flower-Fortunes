import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import jsQR from 'jsqr'

// 初始化原生 BarcodeDetector（Android Chrome 83+、iOS 17.4+ 支援）
let nativeDetector = null
if ('BarcodeDetector' in window) {
  try { nativeDetector = new window.BarcodeDetector({ formats: ['qr_code'] }) } catch { /* ignore */ }
}

export default function QRScanPage({ onScanSuccess, onBack }) {
  const [status, setStatus] = useState('init') // 'init' | 'scanning' | 'error'
  const [errorMsg, setErrorMsg] = useState('')
  const [scanKey, setScanKey] = useState(0)
  const videoRef = useRef(null)
  const successFiredRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    let timerId = null
    let stream = null
    const videoEl = videoRef.current
    // canvas 只有 jsQR fallback 才用，BarcodeDetector 直接給 video
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })

    const handleText = (text) => {
      if (cancelled || successFiredRef.current) return
      const urlText = /^https?:\/\//i.test(text) ? text : `https://${text}`
      try {
        const url = new URL(urlText)
        const zone = url.searchParams.get('zone')
        const work = url.searchParams.get('work')
        const name = url.searchParams.get('name')
        if (zone && work) {
          successFiredRef.current = true
          onScanSuccess({ zone, workId: work, workName: name ? decodeURIComponent(name) : work })
        } else {
          setErrorMsg(`不是展覽 QR Code（缺少 zone/work 參數）\n${text}`)
          setStatus('error')
        }
      } catch {
        setErrorMsg(`無法識別此 QR Code\n內容：${text}`)
        setStatus('error')
      }
    }

    const scanLoop = async () => {
      if (cancelled || successFiredRef.current) return
      try {
        if (videoEl.readyState >= 2 && !videoEl.paused) {
          let text = null
          if (nativeDetector) {
            // BarcodeDetector：直接給 video element，硬體加速
            const codes = await nativeDetector.detect(videoEl)
            text = codes[0]?.rawValue ?? null
          } else {
            // jsQR fallback：截 canvas frame
            const w = videoEl.videoWidth
            const h = videoEl.videoHeight
            if (w > 0 && h > 0) {
              canvas.width = w
              canvas.height = h
              ctx.drawImage(videoEl, 0, 0, w, h)
              const imageData = ctx.getImageData(0, 0, w, h)
              const code = jsQR(imageData.data, w, h, { inversionAttempts: 'attemptBoth' })
              text = code?.data ?? null
            }
          }
          if (text) { handleText(text); return }
        }
      } catch { /* ignore per-frame errors */ }
      if (!cancelled) timerId = setTimeout(scanLoop, 80)
    }

    const startWithConstraints = async (constraints) => {
      stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: constraints })
      if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
      videoEl.srcObject = stream
      await videoEl.play()
      if (cancelled) return
      setStatus('scanning')
      scanLoop()
    }

    const showError = (err) => {
      if (cancelled) return
      if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') {
        setErrorMsg('請允許瀏覽器使用相機，並重新整理頁面後再試')
      } else if (err?.name === 'NotReadableError') {
        setErrorMsg('相機目前被其他程式使用中，請關閉後重試')
      } else {
        setErrorMsg(`無法開啟相機（${err?.name ?? '未知錯誤'}），請重試`)
      }
      setStatus('error')
    }

    const start = async () => {
      // focusMode: continuous 只在瀏覽器明確支援時才加，避免 iOS Safari 拋非預期錯誤
      const supportedConstraints = navigator.mediaDevices.getSupportedConstraints?.() ?? {}
      const baseConstraints = {
        facingMode: 'environment',
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        ...(supportedConstraints.focusMode ? { focusMode: 'continuous' } : {}),
      }
      try {
        await startWithConstraints(baseConstraints)
      } catch (err) {
        if (cancelled) return
        // 解析度約束不被支援時，改用最小約束重試（iOS 舊版相容）
        if (err?.name === 'OverconstrainedError' || err?.name === 'NotFoundError') {
          try {
            await startWithConstraints({ facingMode: 'environment' })
          } catch (err2) {
            showError(err2)
          }
        } else {
          showError(err)
        }
      }
    }

    start()

    return () => {
      cancelled = true
      clearTimeout(timerId)
      // 我們自己持有 stream，cleanup 完全可控，不依賴任何 library lifecycle
      if (stream) stream.getTracks().forEach(t => t.stop())
      if (videoEl) { videoEl.pause(); videoEl.srcObject = null }
    }
  }, [scanKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRetry = () => {
    successFiredRef.current = false
    setErrorMsg('')
    setStatus('init')
    setScanKey(k => k + 1)
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
          aria-label="返回"
          className="text-white/60 hover:text-white transition-colors text-sm flex items-center gap-1 min-w-[44px] min-h-[44px]"
        >
          ← 返回
        </button>
        <h2 className="text-white font-bold flex-1 text-center tracking-wide">掃描作品 QR Code</h2>
        <div className="w-[44px]" aria-hidden="true" />
      </div>

      {/* Scanner */}
      <div className="flex-1 flex flex-col items-center justify-start pt-10 gap-5 px-6">
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
        <div className="relative w-full max-w-xs rounded-2xl overflow-hidden bg-black">
          <video
            key={scanKey}
            ref={videoRef}
            style={{ width: '100%', height: 300, objectFit: 'cover', display: 'block' }}
            muted
            playsInline
          />
          {status === 'scanning' && (
            <div className="absolute inset-0 pointer-events-none">
              <motion.div
                className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent"
                style={{ top: '20%' }}
                animate={{ y: ['0%', '300%', '0%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
              {[
                'top-2 left-2 border-t-2 border-l-2',
                'top-2 right-2 border-t-2 border-r-2',
                'bottom-2 left-2 border-b-2 border-l-2',
                'bottom-2 right-2 border-b-2 border-r-2',
              ].map((cls, i) => (
                <div key={i} className={`absolute w-6 h-6 border-amber-400 rounded-sm ${cls}`} />
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
            <p className="text-red-300 text-sm mb-4 whitespace-pre-line">{errorMsg}</p>
            <button
              onClick={handleRetry}
              className="bg-white/10 hover:bg-white/20 text-white text-sm px-5 py-2 rounded-full transition-colors"
            >
              再試一次
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
