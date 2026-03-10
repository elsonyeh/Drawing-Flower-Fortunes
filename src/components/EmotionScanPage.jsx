import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as faceapi from '@vladmandic/face-api'
import { averageExpressions, getFlowerByEmotion, EMOTION_META } from '../utils/emotionMapper'

const MODEL_URL = '/models/face-api'
const SCAN_DURATION = 3500   // ms 掃描總時長
const FRAME_INTERVAL = 200   // ms 每幀間隔

// ─── 各階段 ────────────────────────────────────────────────
// privacy → loading → scanning → revealing → ready
// ─────────────────────────────────────────────────────────

// 臉部掃描 SVG 圖示（Face-ID 風格）
const FaceScanIcon = ({ size = 48, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* 四角框 */}
    <path d="M3 9V5.5A2.5 2.5 0 0 1 5.5 3H9" />
    <path d="M15 3h3.5A2.5 2.5 0 0 1 21 5.5V9" />
    <path d="M21 15v3.5A2.5 2.5 0 0 1 18.5 21H15" />
    <path d="M9 21H5.5A2.5 2.5 0 0 1 3 18.5V15" />
    {/* 臉部橢圓 */}
    <ellipse cx="12" cy="11.5" rx="5" ry="5.5" />
    {/* 眼睛 */}
    <circle cx="10" cy="10.5" r="0.6" fill="currentColor" stroke="none" />
    <circle cx="14" cy="10.5" r="0.6" fill="currentColor" stroke="none" />
    {/* 嘴巴 */}
    <path d="M9.5 13.5c.6 1 1.4 1.5 2.5 1.5s1.9-.5 2.5-1.5" />
  </svg>
)

// 掃描圈角裝飾
const CornerFrame = ({ w = 280, h = 340 }) => {
  const c = 28  // 角長
  const stroke = '#a78bfa'
  return (
    <svg width={w} height={h} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
      {/* 左上 */}
      <polyline points={`${c},8 8,8 8,${c}`} fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
      {/* 右上 */}
      <polyline points={`${w - c},8 ${w - 8},8 ${w - 8},${c}`} fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
      {/* 左下 */}
      <polyline points={`${c},${h - 8} 8,${h - 8} 8,${h - c}`} fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
      {/* 右下 */}
      <polyline points={`${w - c},${h - 8} ${w - 8},${h - 8} ${w - 8},${h - c}`} fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

// 情緒條形圖（掃描完成後顯示）
const EmotionBar = ({ label, value, color, delay }) => (
  <motion.div
    className="flex items-center gap-2 text-xs"
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay }}
  >
    <span className="w-10 text-right text-white/60">{label}</span>
    <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.round(value * 100)}%` }}
        transition={{ delay: delay + 0.1, duration: 0.6, ease: 'easeOut' }}
      />
    </div>
    <span className="w-8 text-white/40">{Math.round(value * 100)}%</span>
  </motion.div>
)

export default function EmotionScanPage({ onComplete, onBack }) {
  const [phase, setPhase] = useState('privacy')   // privacy | loading | scanning | revealing | ready
  const [progress, setProgress] = useState(0)
  const [faceDetected, setFaceDetected] = useState(false)
  const [result, setResult] = useState(null)       // { flower, emotion, confidence, expressions }
  const [error, setError] = useState(null)
  const [scanFrames, setScanFrames] = useState([]) // 掃描中的即時情緒（視覺用）

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const animFrameRef = useRef(null)
  const scanTimerRef = useRef(null)
  const framesRef = useRef([])

  // ── 關閉鏡頭 ──────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    clearTimeout(scanTimerRef.current)
  }, [])

  // ── 離開清理 ──────────────────────────────────────────────
  useEffect(() => () => stopCamera(), [stopCamera])

  // ── 開始掃描（phase: scanning） ───────────────────────────
  const startScan = useCallback(async () => {
    const video = videoRef.current
    console.log('[Scan] startScan called, videoRef:', video)
    if (!video) { console.warn('[Scan] no video element, abort'); return }
    console.log('[Scan] video readyState:', video.readyState, 'paused:', video.paused, 'srcObject:', video.srcObject)

    framesRef.current = []
    setProgress(0)
    setFaceDetected(false)
    setScanFrames([])

    const startTime = Date.now()

    // 定時收幀
    const collectFrame = async () => {
      if (!videoRef.current) { console.warn('[Scan] videoRef lost mid-scan'); return }

      const elapsed = Date.now() - startTime
      setProgress(Math.min(elapsed / SCAN_DURATION, 1))

      if (elapsed >= SCAN_DURATION) {
        console.log('[Scan] time up, frames collected:', framesRef.current.length)
        finalizeScan()
        return
      }

      try {
        const v = videoRef.current
        if (v.readyState < 2) {
          console.log('[Scan] video not ready yet, readyState:', v.readyState)
          scanTimerRef.current = setTimeout(collectFrame, FRAME_INTERVAL)
          return
        }

        const detection = await faceapi
          .detectSingleFace(v, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks(true)
          .withFaceExpressions()

        console.log('[Scan] frame', Math.round(elapsed / FRAME_INTERVAL), '→', detection ? 'FACE DETECTED' : 'no face')

        if (detection) {
          setFaceDetected(true)
          const expr = detection.expressions
          framesRef.current.push({ ...expr })
          setScanFrames([...framesRef.current])
        } else {
          setFaceDetected(false)
        }
      } catch (err) {
        console.error('[Scan] faceapi error:', err)
      }

      scanTimerRef.current = setTimeout(collectFrame, FRAME_INTERVAL)
    }

    collectFrame()
  }, [])

  // ── 掃描結束，計算結果 ────────────────────────────────────
  const finalizeScan = useCallback(() => {
    const frames = framesRef.current
    console.log('[Scan] finalizeScan, total frames:', frames.length)
    if (frames.length === 0) {
      console.warn('[Scan] no frames collected → showing error')
      setError('未偵測到臉部，請重新嘗試')
      setPhase('error')
      return
    }

    const avgExpr = averageExpressions(frames)
    const { flower, emotion, confidence } = getFlowerByEmotion(avgExpr)
    setResult({ flower, emotion, confidence, expressions: avgExpr })
    setPhase('revealing')
  }, [])

  // ── 載入模型並開啟鏡頭 ───────────────────────────────────
  const initCamera = useCallback(async () => {
    setPhase('loading')
    setError(null)
    console.log('[Camera] loading models from', MODEL_URL)

    try {
      // 並行載入三個模型
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ])
      console.log('[Camera] models loaded OK')
    } catch (err) {
      console.error('[Camera] model load failed:', err)
      setError('模型載入失敗，請檢查網路連線')
      setPhase('error')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      })
      streamRef.current = stream
      console.log('[Camera] stream acquired, tracks:', stream.getVideoTracks().map(t => t.label))
      setPhase('scanning')
    } catch (err) {
      console.error('[Camera] getUserMedia failed:', err)
      setError('無法取得鏡頭，請確認已授權相機權限')
      setPhase('error')
    }
  }, [])

  // ── 重新掃描 ──────────────────────────────────────────────
  const handleRetry = useCallback(() => {
    setError(null)
    setResult(null)
    framesRef.current = []
    setScanFrames([])
    setProgress(0)
    if (streamRef.current) {
      // stream 還在，切回 scanning，video 掛載時 setVideoRef callback 會自動接上 stream
      setPhase('scanning')
    } else {
      initCamera()
    }
  }, [initCamera])

  // ── 確認開始解籤 ──────────────────────────────────────────
  const handleConfirm = useCallback(() => {
    stopCamera()
    onComplete(result.flower, { emotion: result.emotion, expressions: result.expressions })
  }, [result, stopCamera, onComplete])

  // ── video 元素掛載到 DOM 時立即接上 stream（解決 AnimatePresence 延遲掛載問題）──
  const setVideoRef = useCallback((node) => {
    videoRef.current = node
    console.log('[VideoRef] node:', node, 'stream:', streamRef.current)
    if (node && streamRef.current) {
      node.srcObject = streamRef.current
      node.play()
        .then(() => console.log('[VideoRef] video.play() OK'))
        .catch(err => console.error('[VideoRef] video.play() failed:', err))
      startScan()
    } else if (node && !streamRef.current) {
      console.warn('[VideoRef] node mounted but no stream yet')
    }
  }, [startScan])

  // ── 取得即時最強情緒（掃描中用） ─────────────────────────
  const getLiveEmotion = () => {
    if (scanFrames.length === 0) return null
    const last = scanFrames[scanFrames.length - 1]
    const top = Object.entries(last).sort(([, a], [, b]) => b - a)[0]
    return top ? top[0] : null
  }
  const liveEmotion = getLiveEmotion()

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════
  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(to bottom, #0d0a1a, #1a0a2e, #0a1628)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* 背景星點 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 2 + 1,
              height: Math.random() * 2 + 1,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.5 + 0.1,
            }}
            animate={{ opacity: [0.1, 0.6, 0.1] }}
            transition={{ duration: Math.random() * 3 + 2, repeat: Infinity, delay: Math.random() * 3 }}
          />
        ))}
      </div>

      {/* 返回按鈕 */}
      <motion.button
        className="absolute top-5 left-5 text-white/50 hover:text-white/90 transition-colors flex items-center gap-1 text-sm z-20"
        onClick={() => { stopCamera(); onBack() }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        ← 返回
      </motion.button>

      <AnimatePresence mode="wait">

        {/* ── 隱私聲明 ───────────────────────────────────────── */}
        {phase === 'privacy' && (
          <motion.div
            key="privacy"
            className="flex flex-col items-center gap-6 px-8 max-w-sm text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <motion.div
              className="text-purple-400"
              animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <FaceScanIcon size={64} />
            </motion.div>
            <h2 className="text-xl font-bold text-white">情緒解籤</h2>
            <p className="text-white/60 text-sm leading-relaxed">
              本功能透過鏡頭分析你的臉部情緒，
              為你推薦最相符的花語。
              <br /><br />
              所有分析在你的裝置上完成，
              <span className="text-purple-300">不會儲存或上傳任何影像。</span>
            </p>
            <motion.button
              className="mt-2 px-8 py-3 rounded-full font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={initCamera}
            >
              開啟鏡頭
            </motion.button>
            <button
              className="text-white/30 text-xs hover:text-white/60 transition-colors"
              onClick={() => { stopCamera(); onBack() }}
            >
              改用隨機抽卡
            </button>
          </motion.div>
        )}

        {/* ── 模型載入中 ─────────────────────────────────────── */}
        {phase === 'loading' && (
          <motion.div
            key="loading"
            className="flex flex-col items-center gap-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-16 h-16 rounded-full border-4 border-purple-500/30 border-t-purple-400"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <p className="text-white/60 text-sm">正在載入情緒分析模型…</p>
          </motion.div>
        )}

        {/* ── 掃描中 ─────────────────────────────────────────── */}
        {phase === 'scanning' && (
          <motion.div
            key="scanning"
            className="flex flex-col items-center gap-5 w-full px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <p className="text-white/70 text-sm">
              {faceDetected ? '偵測到臉部，正在分析情緒…' : '請將臉部對準畫面中央'}
            </p>

            {/* 鏡頭視窗 */}
            <div className="relative" style={{ width: 280, height: 340 }}>
              <video
                ref={setVideoRef}
                className="rounded-2xl object-cover"
                style={{ width: 280, height: 340, transform: 'scaleX(-1)', display: 'block' }}
                muted
                playsInline
                autoPlay
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 rounded-2xl"
                style={{ width: 280, height: 340, transform: 'scaleX(-1)' }}
              />

              {/* 橢圓臉部對齊框 SVG 覆蓋層 */}
              <svg
                width="280"
                height="340"
                viewBox="0 0 280 340"
                className="absolute inset-0 pointer-events-none"
                style={{ borderRadius: '1rem' }}
              >
                <defs>
                  {/* 橢圓遮罩：橢圓內透明，橢圓外暗化 */}
                  <mask id="face-oval-mask">
                    <rect width="280" height="340" fill="white" />
                    <ellipse cx="140" cy="165" rx="98" ry="125" fill="black" />
                  </mask>
                  {/* 橢圓光暈（偵測到臉時顯示） */}
                  <filter id="oval-glow">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* 橢圓外暗化遮罩 */}
                <rect width="280" height="340" fill="rgba(0,0,0,0.45)" mask="url(#face-oval-mask)" />

                {/* 橢圓邊框（未偵測到時） */}
                {!faceDetected && (
                  <ellipse
                    cx="140" cy="165" rx="98" ry="125"
                    fill="none"
                    stroke="rgba(167,139,250,0.5)"
                    strokeWidth="1.5"
                    strokeDasharray="6 4"
                  />
                )}

                {/* 橢圓邊框（偵測到時，實線+光暈） */}
                {faceDetected && (
                  <ellipse
                    cx="140" cy="165" rx="98" ry="125"
                    fill="none"
                    stroke="#a78bfa"
                    strokeWidth="2"
                    filter="url(#oval-glow)"
                  />
                )}

                {/* 對齊提示文字（僅未偵測到時） */}
                {!faceDetected && (
                  <text
                    x="140" y="308"
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.45)"
                    fontSize="11"
                    fontFamily="sans-serif"
                  >
                    請將臉部對準橢圓
                  </text>
                )}
              </svg>

              {/* 掃描線（限制在橢圓區域內，使用 clipPath） */}
              <svg
                width="280"
                height="340"
                viewBox="0 0 280 340"
                className="absolute inset-0 pointer-events-none"
              >
                <defs>
                  <clipPath id="oval-clip">
                    <ellipse cx="140" cy="165" rx="98" ry="125" />
                  </clipPath>
                </defs>
                <g clipPath="url(#oval-clip)">
                  <motion.line
                    x1="42" x2="238" strokeWidth="1"
                    stroke="url(#scan-grad)"
                    initial={{ y1: 40, y2: 40 }}
                    animate={{ y1: [40, 290, 40], y2: [40, 290, 40] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                  />
                </g>
                <defs>
                  <linearGradient id="scan-grad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="transparent" />
                    <stop offset="50%" stopColor="#a78bfa" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="transparent" />
                  </linearGradient>
                </defs>
              </svg>

              {/* 角框（視窗四角） */}
              <div className="absolute inset-0 pointer-events-none">
                <CornerFrame w={280} h={340} />
              </div>
            </div>

            {/* 進度條 */}
            <div className="w-64">
              <div className="flex justify-between text-xs text-white/40 mb-1">
                <span>分析中</span>
                <span>{Math.round(progress * 100)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(to right, #7c3aed, #a78bfa)', width: `${progress * 100}%` }}
                  transition={{ ease: 'linear' }}
                />
              </div>
            </div>

            {/* 即時情緒標籤 */}
            <AnimatePresence>
              {liveEmotion && EMOTION_META[liveEmotion] && (
                <motion.div
                  key={liveEmotion}
                  className="px-4 py-1.5 rounded-full text-xs font-medium"
                  style={{
                    background: `${EMOTION_META[liveEmotion].color}22`,
                    border: `1px solid ${EMOTION_META[liveEmotion].color}55`,
                    color: EMOTION_META[liveEmotion].color,
                  }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  {EMOTION_META[liveEmotion].zh}
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <p className="text-red-400 text-xs text-center">{error}</p>
            )}
          </motion.div>
        )}

        {/* ── 情緒揭示 ───────────────────────────────────────── */}
        {phase === 'revealing' && result && (
          <motion.div
            key="revealing"
            className="flex flex-col items-center gap-5 px-6 max-w-sm w-full"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            exit={{ opacity: 0 }}
            onAnimationComplete={() => setTimeout(() => setPhase('ready'), 1200)}
          >
            <p className="text-white/50 text-xs tracking-widest uppercase">情緒分析完成</p>

            {/* 主情緒 */}
            <motion.div
              className="flex flex-col items-center gap-2"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 120, damping: 14, delay: 0.5 }}
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
                style={{
                  background: `radial-gradient(circle, ${EMOTION_META[result.emotion]?.color}33, transparent)`,
                  boxShadow: `0 0 30px ${EMOTION_META[result.emotion]?.color}44`,
                }}
              >
                {result.emotion === 'happy'     && '😊'}
                {result.emotion === 'sad'       && '🌧️'}
                {result.emotion === 'neutral'   && '🌿'}
                {result.emotion === 'surprised' && '✨'}
                {result.emotion === 'angry'     && '🔥'}
                {result.emotion === 'fearful'   && '🌙'}
                {result.emotion === 'disgusted' && '❄️'}
              </div>
              <h3
                className="text-2xl font-bold"
                style={{ color: EMOTION_META[result.emotion]?.color }}
              >
                {EMOTION_META[result.emotion]?.zh}
              </h3>
              <p className="text-white/50 text-sm text-center">{EMOTION_META[result.emotion]?.desc}</p>
            </motion.div>

            {/* 情緒分布小圖 */}
            <motion.div
              className="w-full flex flex-col gap-1.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0, duration: 0.8 }}
            >
              {Object.entries(result.expressions)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 4)
                .map(([key, val], i) => (
                  <EmotionBar
                    key={key}
                    label={EMOTION_META[key]?.zh ?? key}
                    value={val}
                    color={EMOTION_META[key]?.color ?? '#888'}
                    delay={0.6 + i * 0.1}
                  />
                ))}
            </motion.div>
          </motion.div>
        )}

        {/* ── 準備解籤 ───────────────────────────────────────── */}
        {phase === 'ready' && result && (
          <motion.div
            key="ready"
            className="flex flex-col items-center gap-6 px-6 max-w-sm w-full text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
              style={{
                background: `radial-gradient(circle, ${EMOTION_META[result.emotion]?.color}33, transparent)`,
                boxShadow: `0 0 24px ${EMOTION_META[result.emotion]?.color}44`,
              }}
            >
              {result.emotion === 'happy'     && '😊'}
              {result.emotion === 'sad'       && '🌧️'}
              {result.emotion === 'neutral'   && '🌿'}
              {result.emotion === 'surprised' && '✨'}
              {result.emotion === 'angry'     && '🔥'}
              {result.emotion === 'fearful'   && '🌙'}
              {result.emotion === 'disgusted' && '❄️'}
            </div>

            <div>
              <p className="text-white/40 text-xs mb-1">偵測到你的情緒是</p>
              <h3
                className="text-xl font-bold"
                style={{ color: EMOTION_META[result.emotion]?.color }}
              >
                {EMOTION_META[result.emotion]?.zh}
              </h3>
              <p className="text-white/50 text-sm mt-1">{EMOTION_META[result.emotion]?.desc}</p>
            </div>

            <p className="text-white/60 text-sm">
              為你推薦最相符的花語，<br />準備好了嗎？
            </p>

            <motion.button
              className="px-10 py-3.5 rounded-full font-bold text-white text-base"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
              whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(124,58,237,0.5)' }}
              whileTap={{ scale: 0.97 }}
              onClick={handleConfirm}
            >
              開始解籤
            </motion.button>

            <button
              className="text-white/30 text-xs hover:text-white/60 transition-colors"
              onClick={handleRetry}
            >
              重新掃描
            </button>
          </motion.div>
        )}

        {/* ── 錯誤狀態 ───────────────────────────────────────── */}
        {phase === 'error' && (
          <motion.div
            key="error"
            className="flex flex-col items-center gap-4 px-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-4xl">😕</div>
            <p className="text-red-400 text-sm">{error}</p>
            <div className="flex gap-3">
              <button
                className="px-6 py-2 rounded-full text-sm text-white/60 border border-white/20 hover:border-white/40 transition-colors"
                onClick={() => { stopCamera(); onBack() }}
              >
                返回
              </button>
              <button
                className="px-6 py-2 rounded-full text-sm text-white font-semibold"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
                onClick={handleRetry}
              >
                重試
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  )
}
