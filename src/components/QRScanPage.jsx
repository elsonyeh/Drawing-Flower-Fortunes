import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { BrowserQRCodeReader } from '@zxing/browser'
import { DecodeHintType } from '@zxing/library'

export default function QRScanPage({ onScanSuccess, onBack }) {
  const [status, setStatus] = useState('init') // 'init' | 'scanning' | 'error'
  const [errorMsg, setErrorMsg] = useState('')
  const [scanKey, setScanKey] = useState(0)
  const videoRef = useRef(null)
  const controlsRef = useRef(null)
  const successFiredRef = useRef(false)
  const genRef = useRef(0)

  // 攔截 ZXing 內部 video.play() 在 StrictMode 下被中斷的 AbortError（無害雜訊）
  useEffect(() => {
    const handler = (e) => {
      if (e.reason?.name === 'AbortError') e.preventDefault()
    }
    window.addEventListener('unhandledrejection', handler)
    return () => window.removeEventListener('unhandledrejection', handler)
  }, [])

  useEffect(() => {
    const gen = ++genRef.current
    const video = videoRef.current   // 快照，供 cleanup 安全存取

    const hints = new Map()
    hints.set(DecodeHintType.TRY_HARDER, true)

    const reader = new BrowserQRCodeReader(hints, { delayBetweenScanAttempts: 80 })

    reader.decodeFromConstraints(
      {
        audio: false,
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          // 連續自動對焦（Android Chrome / Samsung Internet 支援）
          advanced: [{ focusMode: 'continuous' }],
        },
      },
      videoRef.current,
      (result) => {
        if (genRef.current !== gen || successFiredRef.current) return
        if (!result) return
        const text = result.getText().trim()
        const urlText = /^https?:\/\//i.test(text) ? text : `https://${text}`
        try {
          const url = new URL(urlText)
          const zone = url.searchParams.get('zone')
          const work = url.searchParams.get('work')
          const name = url.searchParams.get('name')
          if (zone && work) {
            successFiredRef.current = true
            controlsRef.current?.stop()
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
    ).then((controls) => {
      if (genRef.current !== gen) { controls.stop(); return }
      controlsRef.current = controls
      setStatus('scanning')
    }).catch((err) => {
      if (genRef.current !== gen) return
      if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') {
        setErrorMsg('請允許瀏覽器使用相機，並重新整理頁面後再試')
      } else if (err?.name === 'NotReadableError') {
        setErrorMsg('相機目前被其他程式使用中，請關閉後重試')
      } else if (err?.name === 'OverconstrainedError') {
        // 解析度約束不被支援，以預設值重試
        reader.decodeFromConstraints(
          { audio: false, video: { facingMode: 'environment' } },
          videoRef.current,
          (result) => {
            if (genRef.current !== gen || successFiredRef.current || !result) return
            const text = result.getText().trim()
            const urlText = /^https?:\/\//i.test(text) ? text : `https://${text}`
            try {
              const url = new URL(urlText)
              const zone = url.searchParams.get('zone')
              const work = url.searchParams.get('work')
              const name = url.searchParams.get('name')
              if (zone && work) {
                successFiredRef.current = true
                controlsRef.current?.stop()
                onScanSuccess({ zone, workId: work, workName: name ? decodeURIComponent(name) : work })
              }
            } catch { /* ignore */ }
          }
        ).then((controls) => {
          if (genRef.current !== gen) { controls.stop(); return }
          controlsRef.current = controls
          setStatus('scanning')
        }).catch((err2) => {
          if (genRef.current !== gen) return
          setErrorMsg(`無法開啟相機（${err2?.name ?? '未知錯誤'}），請重試`)
          setStatus('error')
        })
        return
      } else {
        setErrorMsg(`無法開啟相機（${err?.name ?? '未知錯誤'}），請重試`)
      }
      setStatus('error')
    })

    return () => {
      // 讓所有 in-flight callback 失效（genRef 不是 DOM ref，直接 mutate 是安全的）
      genRef.current++ // eslint-disable-line react-hooks/exhaustive-deps
      // 停掉已拿到的 controls（若 promise 已 resolve）
      controlsRef.current?.stop()
      controlsRef.current = null
      // 強制停 video stream：cleanup 跑時 promise 可能還沒 resolve，
      // 此時 controls 為 null，需直接對 video element 手動停流，
      // 否則 StrictMode 第二次 mount 的 play() 會打架產生 AbortError
      if (video) {
        video.pause()
        if (video.srcObject) {
          try { video.srcObject.getTracks().forEach(t => t.stop()) } catch { /* ignore */ }
          video.srcObject = null
        }
      }
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
          {/* Corner overlay */}
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
