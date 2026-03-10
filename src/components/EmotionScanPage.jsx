import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as faceapi from '@vladmandic/face-api'
import { averageLandmarks, extractFeatures, getFlowerByFace, ARCHETYPES } from '../utils/faceReader'

const MODEL_URL = '/models/face-api'
const SCAN_DURATION = 4000   // ms 掃描總時長
const FRAME_INTERVAL = 250   // ms 每幀間隔

// ─── 各階段 ────────────────────────────────────────────────
// privacy → loading → scanning → revealing → ready
// ─────────────────────────────────────────────────────────

// 面相掃描 SVG 圖示（Face-ID 風格）
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
    <path d="M3 9V5.5A2.5 2.5 0 0 1 5.5 3H9" />
    <path d="M15 3h3.5A2.5 2.5 0 0 1 21 5.5V9" />
    <path d="M21 15v3.5A2.5 2.5 0 0 1 18.5 21H15" />
    <path d="M9 21H5.5A2.5 2.5 0 0 1 3 18.5V15" />
    <ellipse cx="12" cy="11.5" rx="5" ry="5.5" />
    <circle cx="10" cy="10.5" r="0.6" fill="currentColor" stroke="none" />
    <circle cx="14" cy="10.5" r="0.6" fill="currentColor" stroke="none" />
    <path d="M9.5 13.5c.6 1 1.4 1.5 2.5 1.5s1.9-.5 2.5-1.5" />
  </svg>
)

// 掃描圈角裝飾
const CornerFrame = ({ w = 280, h = 340, color = '#a78bfa' }) => {
  const c = 28
  return (
    <svg width={w} height={h} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
      <polyline points={`${c},8 8,8 8,${c}`} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <polyline points={`${w - c},8 ${w - 8},8 ${w - 8},${c}`} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <polyline points={`${c},${h - 8} 8,${h - 8} 8,${h - c}`} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <polyline points={`${w - c},${h - 8} ${w - 8},${h - 8} ${w - 8},${h - c}`} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

// 面相特質標籤
const TraitBadge = ({ label, color, delay }) => (
  <motion.span
    className="px-3 py-1 rounded-full text-xs font-medium"
    style={{ background: `${color}22`, border: `1px solid ${color}66`, color }}
    initial={{ opacity: 0, scale: 0.8, y: 8 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
  >
    {label}
  </motion.span>
)

export default function EmotionScanPage({ onComplete, onBack }) {
  const [phase, setPhase] = useState('privacy')   // privacy | loading | scanning | revealing | ready
  const [progress, setProgress] = useState(0)
  const [faceDetected, setFaceDetected] = useState(false)
  const [frameCount, setFrameCount] = useState(0)  // 已收到的有效臉部幀數
  const [result, setResult] = useState(null)        // { flower, archetype, archetypeName }
  const [error, setError] = useState(null)

  const videoRef  = useRef(null)
  const streamRef = useRef(null)
  const scanTimerRef  = useRef(null)
  const landmarkFrames = useRef([])  // 收集的 landmark 幀

  // ── 關閉鏡頭 ──────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    clearTimeout(scanTimerRef.current)
  }, [])

  // ── 離開清理 ──────────────────────────────────────────────
  useEffect(() => () => stopCamera(), [stopCamera])

  // ── 開始掃描（phase: scanning） ───────────────────────────
  const startScan = useCallback(async () => {
    const video = videoRef.current
    console.log('[Face] startScan, video:', video?.readyState, 'paused:', video?.paused)
    if (!video) { console.warn('[Face] no video'); return }

    landmarkFrames.current = []
    setProgress(0)
    setFaceDetected(false)
    setFrameCount(0)

    const startTime = Date.now()

    const collectFrame = async () => {
      if (!videoRef.current) { console.warn('[Face] videoRef lost'); return }

      const elapsed = Date.now() - startTime
      setProgress(Math.min(elapsed / SCAN_DURATION, 1))

      if (elapsed >= SCAN_DURATION) {
        console.log('[Face] scan done, landmark frames:', landmarkFrames.current.length)
        finalizeScan()
        return
      }

      const v = videoRef.current
      if (v.readyState < 2) {
        console.log('[Face] video not ready, readyState:', v.readyState)
        scanTimerRef.current = setTimeout(collectFrame, FRAME_INTERVAL)
        return
      }

      try {
        const detection = await faceapi
          .detectSingleFace(v, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks(true)

        if (detection) {
          setFaceDetected(true)
          const positions = detection.landmarks.positions
          landmarkFrames.current.push(positions.map(p => ({ x: p.x, y: p.y })))
          setFrameCount(landmarkFrames.current.length)
          console.log('[Face] frame', Math.round(elapsed / FRAME_INTERVAL), '→ landmark captured, total:', landmarkFrames.current.length)
        } else {
          setFaceDetected(false)
          console.log('[Face] frame', Math.round(elapsed / FRAME_INTERVAL), '→ no face')
        }
      } catch (err) {
        console.error('[Face] faceapi error:', err)
      }

      scanTimerRef.current = setTimeout(collectFrame, FRAME_INTERVAL)
    }

    collectFrame()
  }, [])

  // ── 掃描結束，計算面相結果 ────────────────────────────────
  const finalizeScan = useCallback(() => {
    const frames = landmarkFrames.current
    console.log('[Face] finalizeScan, frames:', frames.length)

    if (frames.length === 0) {
      console.warn('[Face] no landmarks → error')
      setError('未偵測到臉部，請確認光線充足並將臉部對準畫面')
      setPhase('error')
      return
    }

    const avgPts  = averageLandmarks(frames)
    const features = extractFeatures(avgPts)
    console.log('[Face] features:', features)

    const { flower, archetypeName, archetype, scores } = getFlowerByFace(features)
    console.log('[Face] archetype:', archetypeName, 'scores:', scores)
    console.log('[Face] flower:', flower?.flower)

    setResult({ flower, archetypeName, archetype, features })
    setPhase('revealing')
  }, [])

  // ── 載入模型並開啟鏡頭 ───────────────────────────────────
  const initCamera = useCallback(async () => {
    setPhase('loading')
    setError(null)
    console.log('[Camera] loading models from', MODEL_URL)

    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
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
      console.log('[Camera] stream acquired:', stream.getVideoTracks().map(t => t.label))
      setPhase('scanning')
    } catch (err) {
      console.error('[Camera] getUserMedia failed:', err)
      setError('無法取得鏡頭，請確認已授權相機權限')
      setPhase('error')
    }
  }, [])

  // ── video 元素掛載時立即接上 stream ──────────────────────
  const setVideoRef = useCallback((node) => {
    videoRef.current = node
    console.log('[VideoRef] node:', node, 'stream:', streamRef.current)
    if (node && streamRef.current) {
      node.srcObject = streamRef.current
      node.play()
        .then(() => console.log('[VideoRef] play OK'))
        .catch(err => console.error('[VideoRef] play failed:', err))
      startScan()
    }
  }, [startScan])

  // ── 重新掃描 ──────────────────────────────────────────────
  const handleRetry = useCallback(() => {
    setError(null)
    setResult(null)
    landmarkFrames.current = []
    setFrameCount(0)
    setProgress(0)
    if (streamRef.current) {
      setPhase('scanning')
    } else {
      initCamera()
    }
  }, [initCamera])

  // ── 確認開始解籤 ──────────────────────────────────────────
  const handleConfirm = useCallback(() => {
    stopCamera()
    onComplete(result.flower, { archetype: result.archetypeName })
  }, [result, stopCamera, onComplete])

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
            <h2 className="text-xl font-bold text-white">觀臉取花</h2>
            <p className="text-white/60 text-sm leading-relaxed">
              透過鏡頭解讀你的面相輪廓，
              分析五官比例與氣質特徵，
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
              開始觀臉
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
              className="text-purple-400"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <FaceScanIcon size={48} />
            </motion.div>
            <p className="text-white/60 text-sm">載入面相模型中⋯</p>
          </motion.div>
        )}

        {/* ── 面相掃描中 ─────────────────────────────────────── */}
        {phase === 'scanning' && (
          <motion.div
            key="scanning"
            className="flex flex-col items-center gap-5 w-full px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <p className="text-white/70 text-sm">
              {faceDetected
                ? `解讀中⋯（已擷取 ${frameCount} 幀）`
                : '請將臉部對準畫面中央'}
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

              {/* 橢圓臉部對齊框 */}
              <svg
                width="280"
                height="340"
                viewBox="0 0 280 340"
                className="absolute inset-0 pointer-events-none"
                style={{ borderRadius: '1rem' }}
              >
                <defs>
                  <mask id="face-oval-mask">
                    <rect width="280" height="340" fill="white" />
                    <ellipse cx="140" cy="165" rx="98" ry="125" fill="black" />
                  </mask>
                  <filter id="oval-glow">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                <rect width="280" height="340" fill="rgba(0,0,0,0.4)" mask="url(#face-oval-mask)" />

                {!faceDetected && (
                  <ellipse cx="140" cy="165" rx="98" ry="125"
                    fill="none" stroke="rgba(167,139,250,0.5)" strokeWidth="1.5" strokeDasharray="6 4" />
                )}
                {faceDetected && (
                  <ellipse cx="140" cy="165" rx="98" ry="125"
                    fill="none" stroke="#a78bfa" strokeWidth="2" filter="url(#oval-glow)" />
                )}

                {!faceDetected && (
                  <text x="140" y="308" textAnchor="middle"
                    fill="rgba(255,255,255,0.45)" fontSize="11" fontFamily="sans-serif">
                    請將臉部對準橢圓
                  </text>
                )}
              </svg>

              {/* 掃描線（限制在橢圓內） */}
              <svg width="280" height="340" viewBox="0 0 280 340"
                className="absolute inset-0 pointer-events-none">
                <defs>
                  <clipPath id="oval-clip">
                    <ellipse cx="140" cy="165" rx="98" ry="125" />
                  </clipPath>
                  <linearGradient id="scan-grad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="transparent" />
                    <stop offset="50%" stopColor="#a78bfa" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="transparent" />
                  </linearGradient>
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
              </svg>

              {/* 關鍵點連線動畫（偵測到臉時顯示幾條紫色細線示意） */}
              {faceDetected && (
                <svg width="280" height="340" viewBox="0 0 280 340"
                  className="absolute inset-0 pointer-events-none">
                  {/* 示意：眉毛、眼睛、嘴巴位置線 */}
                  {[
                    { x1: 88, y1: 128, x2: 118, y2: 122 },   // 右眉
                    { x1: 162, y1: 122, x2: 192, y2: 128 },  // 左眉
                    { x1: 95, y1: 148, x2: 124, y2: 148 },   // 右眼
                    { x1: 156, y1: 148, x2: 185, y2: 148 },  // 左眼
                    { x1: 112, y1: 204, x2: 168, y2: 204 },  // 嘴巴
                  ].map((line, i) => (
                    <motion.line key={i}
                      {...line}
                      stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 0.7, 0.3, 0.7] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </svg>
              )}

              {/* 角框 */}
              <div className="absolute inset-0 pointer-events-none">
                <CornerFrame w={280} h={340} color={faceDetected ? '#c4b5fd' : '#a78bfa'} />
              </div>
            </div>

            {/* 進度條 */}
            <div className="w-64">
              <div className="flex justify-between text-xs text-white/40 mb-1">
                <span>面相解讀中</span>
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

            {error && (
              <p className="text-red-400 text-xs text-center">{error}</p>
            )}
          </motion.div>
        )}

        {/* ── 面相揭示 ───────────────────────────────────────── */}
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
            <p className="text-white/50 text-xs tracking-widest uppercase">面相解讀完成</p>

            {/* 原型圖示 + 名稱 */}
            <motion.div
              className="flex flex-col items-center gap-2"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 120, damping: 14, delay: 0.5 }}
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
                style={{
                  background: `radial-gradient(circle, ${result.archetype.color}33, transparent)`,
                  boxShadow: `0 0 30px ${result.archetype.color}44`,
                }}
              >
                {result.archetype.icon}
              </div>
              <h3 className="text-2xl font-bold" style={{ color: result.archetype.color }}>
                {result.archetype.zh}
              </h3>
              <p className="text-white/50 text-sm text-center leading-relaxed">
                {result.archetype.desc}
              </p>
            </motion.div>

            {/* 特質標籤 */}
            <motion.div
              className="flex gap-2 flex-wrap justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0, duration: 0.8 }}
            >
              {result.archetype.traits.map((trait, i) => (
                <TraitBadge
                  key={trait}
                  label={trait}
                  color={result.archetype.color}
                  delay={1.1 + i * 0.15}
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
                background: `radial-gradient(circle, ${result.archetype.color}33, transparent)`,
                boxShadow: `0 0 24px ${result.archetype.color}44`,
              }}
            >
              {result.archetype.icon}
            </div>

            <div>
              <p className="text-white/40 text-xs mb-1">你的面相屬於</p>
              <h3 className="text-xl font-bold" style={{ color: result.archetype.color }}>
                {result.archetype.zh}
              </h3>
              <div className="flex gap-2 justify-center mt-2 flex-wrap">
                {result.archetype.traits.map(t => (
                  <span key={t} className="text-xs text-white/40">#{t}</span>
                ))}
              </div>
            </div>

            <p className="text-white/60 text-sm">
              以你的面相氣質，<br />為你找到最相符的花語
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
              重新觀臉
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
