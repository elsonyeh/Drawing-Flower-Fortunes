import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'

export default function QRScanPage({ onScanSuccess, onBack }) {
  const [status, setStatus] = useState('init') // 'init', 'scanning', 'error'
  const [errorMsg, setErrorMsg] = useState('')
  const [scanKey, setScanKey] = useState(0) // 遞增 key 強制 scanner 重新 mount
  const successFiredRef = useRef(false)
  const genRef = useRef(0) // generation counter，解決 StrictMode 雙重 mount 競爭
  const qrRef = useRef(null) // 追蹤當前 Html5Qrcode instance，供 fallback cleanup 用

  // 攔截 html5-qrcode 內部 video.play() 在 StrictMode 下被中斷的 AbortError
  useEffect(() => {
    const handler = (e) => {
      if (e.reason?.name === 'AbortError') e.preventDefault()
    }
    window.addEventListener('unhandledrejection', handler)
    return () => window.removeEventListener('unhandledrejection', handler)
  }, [])

  useEffect(() => {
    const gen = ++genRef.current // 每次 mount 遞增，過期的 start() 會被攔截

    const container = document.getElementById('qr-reader-container')
    if (container) {
      // 先 pause 所有 video，避免移除播放中的元素觸發 AbortError
      container.querySelectorAll('video').forEach(v => {
        v.pause()
        v.srcObject = null
      })
      container.innerHTML = ''
    }

    const makeQR = () => new Html5Qrcode('qr-reader-container', {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
    })

    // html5-qrcode instance 不可重用；用 ref 追蹤當前 instance 以便 cleanup
    let qr = makeQR()
    qrRef.current = qr

    const stopInstance = (instance) => {
      const tryClear = () => { try { instance.clear() } catch { /* ignore */ } }
      try { instance.stop().then(tryClear).catch(tryClear) } catch { tryClear() }
    }

    const stopQR = () => stopInstance(qrRef.current)

    const scanConfig = {
      fps: 25,
      qrbox: (w, h) => {
        const edge = Math.floor(Math.min(w, h) * 0.82)
        return { width: edge, height: edge }
      },
      experimentalFeatures: { useBarCodeDetectorIfSupported: true },
    }

    const onScan = (decodedText) => {
      if (genRef.current !== gen || successFiredRef.current) return
      const text = decodedText.trim()
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

    const onFrameError = () => { /* ignore */ }

    const showError = (err) => {
      if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') {
        setErrorMsg('請允許瀏覽器使用相機，並重新整理頁面後再試')
      } else if (err?.name === 'NotReadableError') {
        setErrorMsg('相機目前被其他程式使用中，請關閉後重試')
      } else {
        setErrorMsg(`無法開啟相機（${err?.name ?? '未知錯誤'}），請重試`)
      }
      setStatus('error')
    }

    // 先嘗試含 ideal 解析度；失敗且非權限問題時，建新 instance fallback
    qr.start(
      { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      scanConfig,
      onScan,
      onFrameError
    ).then(() => {
      if (genRef.current !== gen) { stopQR(); return }
      setStatus('scanning')
    }).catch((err) => {
      if (genRef.current !== gen) return
      if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') {
        showError(err); return
      }
      // 舊 instance 已損壞，必須建新的才能再次 start
      stopInstance(qr)
      const container = document.getElementById('qr-reader-container')
      if (container) container.innerHTML = ''
      qr = makeQR()
      qrRef.current = qr
      qr.start({ facingMode: 'environment' }, scanConfig, onScan, onFrameError)
        .then(() => {
          if (genRef.current !== gen) { stopQR(); return }
          setStatus('scanning')
        })
        .catch((err2) => {
          if (genRef.current !== gen) return
          showError(err2)
        })
    })

    return () => {
      stopQR()
    }
  }, [scanKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRetry = () => {
    successFiredRef.current = false
    setErrorMsg('')
    setStatus('init')
    setScanKey(k => k + 1) // 重新 mount scanner
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
          <div
            key={scanKey}
            id="qr-reader-container"
            className="w-full"
            style={{ height: 300 }}
          />
          {/* Corner overlay */}
          {status === 'scanning' && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Scanning animation — 用 translateY 取代 top，避免 layout thrash */}
              <motion.div
                className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent"
                style={{ top: '20%' }}
                animate={{ y: ['0%', '300%', '0%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
              {/* Corner markers */}
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

      {/* 隱藏 html5-qrcode 預設的控制面板與邊框 */}
      <style>{`
        #qr-reader-container { border: none !important; }
        #qr-reader-container__dashboard { display: none !important; }
        #qr-reader-container__scan_region { height: 100% !important; }
        #qr-reader-container video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover;
          display: block;
          border-radius: 1rem;
        }
        #qr-reader-container canvas {
          visibility: hidden !important;
          position: absolute !important;
          pointer-events: none !important;
        }
      `}</style>
    </motion.div>
  )
}
