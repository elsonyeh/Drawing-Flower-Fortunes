/* eslint-disable react/no-unknown-property */
import { useRef, useMemo, Suspense, useEffect } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF, useProgress, Html } from '@react-three/drei'
import * as THREE from 'three'

// 固定相機比例組件 - 防止 3D 內容被拉伸
function FixedAspectCamera() {
  const { camera, size } = useThree()

  useEffect(() => {
    // 強制使用 1:1 的相機比例，不管容器實際大小
    camera.aspect = 1
    camera.updateProjectionMatrix()
  }, [camera, size])

  return null
}
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { getFlowerConfig } from '../data/flowerConfigs'
import { getDrawQueue, initDrawQueue } from '../utils/fortuneHelper'

// ============ 模型路徑對照表 ============
const MODEL_PATHS = {
  rose: '/models/rose/rose.glb',
  sakura: '/models/sakura/sakura.glb',
  lavender: '/models/lavender/lavender.glb',
  jasmine: '/models/jasmine/jasmine.glb',
  lotus: '/models/lotus/lotus.glb',
  tulip: '/models/tulip/tulip.glb',
  bellflower: '/models/bellflower/bellflower.glb',
  violet: '/models/violet/violet.glb',
  lily: '/models/lily/lily.glb',
  chrysanthemum: '/models/chrysanthemum/chrysanthemum.glb',
  peony: '/models/peony/peony.glb',
  hydrangea: '/models/hydrangea/hydrangea.glb',
}

// ============ 按抽籤順序預載入模型 ============
// 初始化抽籤佇列並按順序載入模型
const initPreloading = () => {
  const queue = initDrawQueue()
  const loadedModels = new Set()

  // 先載入佇列中的模型（按抽籤順序）
  queue.forEach(flower => {
    const modelPath = MODEL_PATHS[flower.model]
    if (modelPath && !loadedModels.has(modelPath)) {
      useGLTF.preload(modelPath, true)
      loadedModels.add(modelPath)
    }
  })

  // 再載入其他還沒載入的模型
  Object.values(MODEL_PATHS).forEach(path => {
    if (!loadedModels.has(path)) {
      useGLTF.preload(path, true)
    }
  })
}

// 執行預載入
initPreloading()

// ============ 載入中動畫組件 ============
function ModelLoader() {
  const { progress, active } = useProgress()

  if (!active) return null

  return (
    <Html
      center
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: 'system-ui, sans-serif',
        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
        padding: '1rem 1.5rem',
        borderRadius: '0.75rem',
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(8px)',
        minWidth: '120px',
      }}>
        {/* 旋轉的花朵圖示 */}
        <div style={{
          fontSize: '2.5rem',
          animation: 'spin 1.5s linear infinite',
        }}>
          🌸
        </div>
        {/* 進度文字 */}
        <div style={{
          marginTop: '0.5rem',
          fontSize: '0.875rem',
          fontWeight: 'bold',
          textAlign: 'center',
        }}>
          載入中 {progress.toFixed(0)}%
        </div>
        {/* CSS 動畫 */}
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </Html>
  )
}

// ============ 花瓣配置 - 形狀、彎曲、排列 ============
const petalProfiles = {
  rose: {
    // 彎曲：強內捲
    curve: { main: 0.55, edge: 0.35, tip: -0.15 },
    // 排列：緊密螺旋
    arrange: { baseRadius: 0.08, radiusGrow: 0.04, tiltBase: 0.75, tiltDecay: 0.35, randomPos: 0.01, randomRot: 0.08 },
  },
  tulip: {
    curve: { main: 0.45, edge: 0.18, tip: 0.08 },
    arrange: { baseRadius: 0.06, radiusGrow: 0.035, tiltBase: 0.6, tiltDecay: 0.25, randomPos: 0.008, randomRot: 0.05 },
  },
  sakura: {
    curve: { main: 0.12, edge: 0.08, tip: 0.18 },
    arrange: { baseRadius: 0.12, radiusGrow: 0.02, tiltBase: 0.22, tiltDecay: 0.1, randomPos: 0.015, randomRot: 0.1 },
  },
  sunflower: {
    curve: { main: 0.04, edge: 0.02, tip: -0.08 },
    arrange: { baseRadius: 0.22, radiusGrow: 0.03, tiltBase: 0.12, tiltDecay: 0.05, randomPos: 0.01, randomRot: 0.06 },
  },
  lotus: {
    curve: { main: 0.28, edge: 0.12, tip: 0.22 },
    arrange: { baseRadius: 0.1, radiusGrow: 0.05, tiltBase: 0.38, tiltDecay: 0.18, randomPos: 0.012, randomRot: 0.07 },
  },
  lily: {
    curve: { main: 0.42, edge: 0.25, tip: 0.55 },
    arrange: { baseRadius: 0.14, radiusGrow: 0.03, tiltBase: 0.45, tiltDecay: 0.15, randomPos: 0.015, randomRot: 0.08 },
  },
  peony: {
    curve: { main: 0.22, edge: 0.3, tip: 0.12 },
    arrange: { baseRadius: 0.07, radiusGrow: 0.045, tiltBase: 0.48, tiltDecay: 0.22, randomPos: 0.018, randomRot: 0.12 },
  },
  jasmine: {
    curve: { main: 0.08, edge: 0.04, tip: 0.12 },
    arrange: { baseRadius: 0.1, radiusGrow: 0.02, tiltBase: 0.2, tiltDecay: 0.08, randomPos: 0.01, randomRot: 0.06 },
  },
  carnation: {
    curve: { main: 0.12, edge: 0.22, tip: 0.08 },
    arrange: { baseRadius: 0.05, radiusGrow: 0.025, tiltBase: 0.65, tiltDecay: 0.2, randomPos: 0.02, randomRot: 0.15 },
  },
  chrysanthemum: {
    // 菊花：細長花瓣放射狀
    curve: { main: 0.08, edge: 0.05, tip: 0.12 },
    arrange: { baseRadius: 0.08, radiusGrow: 0.02, tiltBase: 0.25, tiltDecay: 0.08, randomPos: 0.01, randomRot: 0.05 },
  },
  bellflower: {
    curve: { main: 0.15, edge: 0.08, tip: 0.1 },
    arrange: { baseRadius: 0.11, radiusGrow: 0.02, tiltBase: 0.28, tiltDecay: 0.1, randomPos: 0.012, randomRot: 0.07 },
  },
  hydrangea: {
    curve: { main: 0.08, edge: 0.06, tip: 0.12 },
    arrange: { baseRadius: 0.015, radiusGrow: 0.005, tiltBase: 0.18, tiltDecay: 0.05, randomPos: 0.005, randomRot: 0.08 },
  },
  gardenia: {
    // 梔子花：螺旋白花瓣
    curve: { main: 0.35, edge: 0.2, tip: 0.1 },
    arrange: { baseRadius: 0.07, radiusGrow: 0.04, tiltBase: 0.55, tiltDecay: 0.25, randomPos: 0.01, randomRot: 0.08 },
  },
  lavender: {
    // 薰衣草：小穗狀
    curve: { main: 0.05, edge: 0.03, tip: 0.08 },
    arrange: { baseRadius: 0.02, radiusGrow: 0.01, tiltBase: 0.15, tiltDecay: 0.05, randomPos: 0.008, randomRot: 0.1 },
  },
  violet: {
    // 紫羅蘭：小巧五瓣
    curve: { main: 0.1, edge: 0.06, tip: 0.15 },
    arrange: { baseRadius: 0.1, radiusGrow: 0.02, tiltBase: 0.2, tiltDecay: 0.08, randomPos: 0.012, randomRot: 0.08 },
  },
  epiphyllum: {
    curve: { main: 0.32, edge: 0.18, tip: 0.38 },
    arrange: { baseRadius: 0.12, radiusGrow: 0.04, tiltBase: 0.32, tiltDecay: 0.15, randomPos: 0.015, randomRot: 0.08 },
  },
  spider: {
    curve: { main: 0.6, edge: 0.45, tip: 0.85 },
    arrange: { baseRadius: 0.15, radiusGrow: 0.02, tiltBase: 0.55, tiltDecay: 0.1, randomPos: 0.02, randomRot: 0.1 },
  },
  phoenix: {
    curve: { main: 0.22, edge: 0.12, tip: 0.28 },
    arrange: { baseRadius: 0.14, radiusGrow: 0.035, tiltBase: 0.28, tiltDecay: 0.12, randomPos: 0.015, randomRot: 0.08 },
  },
  poppy: {
    curve: { main: 0.1, edge: 0.18, tip: 0.06 },
    arrange: { baseRadius: 0.13, radiusGrow: 0.03, tiltBase: 0.18, tiltDecay: 0.08, randomPos: 0.02, randomRot: 0.1 },
  },
  default: {
    curve: { main: 0.18, edge: 0.12, tip: 0.12 },
    arrange: { baseRadius: 0.1, radiusGrow: 0.03, tiltBase: 0.3, tiltDecay: 0.12, randomPos: 0.012, randomRot: 0.08 },
  },
}

// ============ 花瓣形狀 - 更自然的輪廓 ============
const createPetalShape = (type, w, l) => {
  const shape = new THREE.Shape()

  switch (type) {
    case 'rose': {
      // 玫瑰：飽滿圓潤，頂部略尖
      shape.moveTo(0, l * 0.03)
      shape.bezierCurveTo(-w * 0.35, l * 0.02, -w * 0.85, l * 0.18, -w * 1.05, l * 0.42)
      shape.bezierCurveTo(-w * 1.12, l * 0.62, -w * 0.95, l * 0.82, -w * 0.55, l * 0.94)
      shape.quadraticCurveTo(-w * 0.2, l * 0.99, 0, l)
      shape.quadraticCurveTo(w * 0.2, l * 0.99, w * 0.55, l * 0.94)
      shape.bezierCurveTo(w * 0.95, l * 0.82, w * 1.12, l * 0.62, w * 1.05, l * 0.42)
      shape.bezierCurveTo(w * 0.85, l * 0.18, w * 0.35, l * 0.02, 0, l * 0.03)
      break
    }
    case 'tulip': {
      // 鬱金香：底窄頂寬，橢圓頂
      shape.moveTo(0, 0)
      shape.bezierCurveTo(-w * 0.2, l * 0.08, -w * 0.65, l * 0.25, -w * 0.92, l * 0.48)
      shape.bezierCurveTo(-w * 1.08, l * 0.68, -w * 0.98, l * 0.85, -w * 0.65, l * 0.95)
      shape.quadraticCurveTo(-w * 0.25, l * 1.02, 0, l)
      shape.quadraticCurveTo(w * 0.25, l * 1.02, w * 0.65, l * 0.95)
      shape.bezierCurveTo(w * 0.98, l * 0.85, w * 1.08, l * 0.68, w * 0.92, l * 0.48)
      shape.bezierCurveTo(w * 0.65, l * 0.25, w * 0.2, l * 0.08, 0, 0)
      break
    }
    case 'sakura': {
      // 櫻花：心形缺口
      shape.moveTo(0, l * 0.06)
      shape.bezierCurveTo(-w * 0.45, l * 0.04, -w * 0.88, l * 0.28, -w * 0.78, l * 0.58)
      shape.bezierCurveTo(-w * 0.68, l * 0.82, -w * 0.38, l * 0.95, -w * 0.12, l * 0.92)
      shape.quadraticCurveTo(0, l * 0.78, w * 0.12, l * 0.92)
      shape.bezierCurveTo(w * 0.38, l * 0.95, w * 0.68, l * 0.82, w * 0.78, l * 0.58)
      shape.bezierCurveTo(w * 0.88, l * 0.28, w * 0.45, l * 0.04, 0, l * 0.06)
      break
    }
    case 'sunflower': {
      // 向日葵：細長舌狀
      shape.moveTo(0, 0)
      shape.bezierCurveTo(-w * 0.32, l * 0.06, -w * 0.42, l * 0.22, -w * 0.38, l * 0.48)
      shape.bezierCurveTo(-w * 0.34, l * 0.72, -w * 0.22, l * 0.88, -w * 0.08, l * 0.96)
      shape.quadraticCurveTo(0, l * 1.0, w * 0.08, l * 0.96)
      shape.bezierCurveTo(w * 0.22, l * 0.88, w * 0.34, l * 0.72, w * 0.38, l * 0.48)
      shape.bezierCurveTo(w * 0.42, l * 0.22, w * 0.32, l * 0.06, 0, 0)
      break
    }
    case 'lotus': {
      // 蓮花：優雅船形
      shape.moveTo(0, 0)
      shape.bezierCurveTo(-w * 0.18, l * 0.1, -w * 0.52, l * 0.28, -w * 0.48, l * 0.55)
      shape.bezierCurveTo(-w * 0.42, l * 0.78, -w * 0.22, l * 0.92, -w * 0.06, l * 0.98)
      shape.quadraticCurveTo(0, l * 1.0, w * 0.06, l * 0.98)
      shape.bezierCurveTo(w * 0.22, l * 0.92, w * 0.42, l * 0.78, w * 0.48, l * 0.55)
      shape.bezierCurveTo(w * 0.52, l * 0.28, w * 0.18, l * 0.1, 0, 0)
      break
    }
    case 'lily': {
      // 百合：細長優雅
      shape.moveTo(0, 0)
      shape.bezierCurveTo(-w * 0.15, l * 0.12, -w * 0.42, l * 0.32, -w * 0.38, l * 0.58)
      shape.bezierCurveTo(-w * 0.32, l * 0.8, -w * 0.15, l * 0.94, -w * 0.04, l * 0.99)
      shape.quadraticCurveTo(0, l * 1.0, w * 0.04, l * 0.99)
      shape.bezierCurveTo(w * 0.15, l * 0.94, w * 0.32, l * 0.8, w * 0.38, l * 0.58)
      shape.bezierCurveTo(w * 0.42, l * 0.32, w * 0.15, l * 0.12, 0, 0)
      break
    }
    case 'peony': {
      // 牡丹：波浪豐盈
      shape.moveTo(0, l * 0.05)
      shape.bezierCurveTo(-w * 0.4, l * 0.04, -w * 0.92, l * 0.22, -w * 1.0, l * 0.48)
      shape.bezierCurveTo(-w * 1.05, l * 0.68, -w * 0.85, l * 0.85, -w * 0.5, l * 0.94)
      shape.quadraticCurveTo(-w * 0.25, l * 0.98, -w * 0.08, l * 0.96)
      shape.quadraticCurveTo(0, l * 1.0, w * 0.08, l * 0.96)
      shape.quadraticCurveTo(w * 0.25, l * 0.98, w * 0.5, l * 0.94)
      shape.bezierCurveTo(w * 0.85, l * 0.85, w * 1.05, l * 0.68, w * 1.0, l * 0.48)
      shape.bezierCurveTo(w * 0.92, l * 0.22, w * 0.4, l * 0.04, 0, l * 0.05)
      break
    }
    case 'jasmine': {
      // 茉莉：星形細長
      shape.moveTo(0, 0)
      shape.bezierCurveTo(-w * 0.15, l * 0.1, -w * 0.55, l * 0.25, -w * 0.72, l * 0.48)
      shape.bezierCurveTo(-w * 0.82, l * 0.68, -w * 0.62, l * 0.88, -w * 0.28, l * 0.96)
      shape.quadraticCurveTo(0, l * 1.0, w * 0.28, l * 0.96)
      shape.bezierCurveTo(w * 0.62, l * 0.88, w * 0.82, l * 0.68, w * 0.72, l * 0.48)
      shape.bezierCurveTo(w * 0.55, l * 0.25, w * 0.15, l * 0.1, 0, 0)
      break
    }
    case 'carnation': {
      // 康乃馨：皺褶邊緣
      const pts = []
      for (let i = 0; i <= 24; i++) {
        const t = i / 24
        const baseW = Math.sin(t * Math.PI) * w
        const ruffle = 1 + Math.sin(t * Math.PI * 14) * 0.15 + Math.sin(t * Math.PI * 7) * 0.08
        pts.push({ x: baseW * ruffle, y: t * l })
      }
      shape.moveTo(0, 0)
      pts.forEach(p => shape.lineTo(p.x, p.y))
      for (let i = pts.length - 1; i >= 0; i--) shape.lineTo(-pts[i].x, pts[i].y)
      break
    }
    case 'chrysanthemum': {
      // 菊花：細長花瓣
      shape.moveTo(0, 0)
      shape.bezierCurveTo(-w * 0.25, l * 0.15, -w * 0.3, l * 0.45, -w * 0.2, l * 0.75)
      shape.quadraticCurveTo(-w * 0.08, l * 0.95, 0, l)
      shape.quadraticCurveTo(w * 0.08, l * 0.95, w * 0.2, l * 0.75)
      shape.bezierCurveTo(w * 0.3, l * 0.45, w * 0.25, l * 0.15, 0, 0)
      break
    }
    case 'bellflower': {
      // 桔梗：鐘形五角
      shape.moveTo(0, 0)
      shape.quadraticCurveTo(-w * 0.32, l * 0.18, -w * 0.62, l * 0.38)
      shape.quadraticCurveTo(-w * 0.58, l * 0.65, -w * 0.35, l * 0.88)
      shape.quadraticCurveTo(-w * 0.15, l * 0.95, 0, l * 0.88)
      shape.quadraticCurveTo(w * 0.15, l * 0.95, w * 0.35, l * 0.88)
      shape.quadraticCurveTo(w * 0.58, l * 0.65, w * 0.62, l * 0.38)
      shape.quadraticCurveTo(w * 0.32, l * 0.18, 0, 0)
      break
    }
    case 'hydrangea': {
      // 繡球：小巧四瓣
      shape.moveTo(0, 0)
      shape.quadraticCurveTo(-w * 0.42, l * 0.2, -w * 0.38, l * 0.62)
      shape.quadraticCurveTo(-w * 0.15, l * 0.95, 0, l)
      shape.quadraticCurveTo(w * 0.15, l * 0.95, w * 0.38, l * 0.62)
      shape.quadraticCurveTo(w * 0.42, l * 0.2, 0, 0)
      break
    }
    case 'gardenia': {
      // 梔子花：螺旋白花瓣，飽滿圓潤
      shape.moveTo(0, l * 0.04)
      shape.bezierCurveTo(-w * 0.42, l * 0.03, -w * 0.88, l * 0.22, -w * 0.95, l * 0.48)
      shape.bezierCurveTo(-w * 1.0, l * 0.72, -w * 0.78, l * 0.88, -w * 0.42, l * 0.96)
      shape.quadraticCurveTo(-w * 0.15, l * 1.0, 0, l * 0.98)
      shape.quadraticCurveTo(w * 0.15, l * 1.0, w * 0.42, l * 0.96)
      shape.bezierCurveTo(w * 0.78, l * 0.88, w * 1.0, l * 0.72, w * 0.95, l * 0.48)
      shape.bezierCurveTo(w * 0.88, l * 0.22, w * 0.42, l * 0.03, 0, l * 0.04)
      break
    }
    case 'lavender': {
      // 薰衣草：小巧橢圓形花瓣
      shape.moveTo(0, 0)
      shape.bezierCurveTo(-w * 0.35, l * 0.12, -w * 0.45, l * 0.38, -w * 0.38, l * 0.62)
      shape.bezierCurveTo(-w * 0.28, l * 0.85, -w * 0.12, l * 0.96, 0, l)
      shape.bezierCurveTo(w * 0.12, l * 0.96, w * 0.28, l * 0.85, w * 0.38, l * 0.62)
      shape.bezierCurveTo(w * 0.45, l * 0.38, w * 0.35, l * 0.12, 0, 0)
      break
    }
    case 'violet': {
      // 紫羅蘭：小巧五瓣，頂部微圓
      shape.moveTo(0, 0)
      shape.bezierCurveTo(-w * 0.32, l * 0.08, -w * 0.68, l * 0.28, -w * 0.72, l * 0.52)
      shape.bezierCurveTo(-w * 0.75, l * 0.75, -w * 0.52, l * 0.92, -w * 0.22, l * 0.98)
      shape.quadraticCurveTo(0, l * 1.02, w * 0.22, l * 0.98)
      shape.bezierCurveTo(w * 0.52, l * 0.92, w * 0.75, l * 0.75, w * 0.72, l * 0.52)
      shape.bezierCurveTo(w * 0.68, l * 0.28, w * 0.32, l * 0.08, 0, 0)
      break
    }
    case 'epiphyllum': {
      // 曇花：纖長飄逸
      shape.moveTo(0, 0)
      shape.bezierCurveTo(-w * 0.15, l * 0.15, -w * 0.38, l * 0.38, -w * 0.3, l * 0.65)
      shape.bezierCurveTo(-w * 0.2, l * 0.88, -w * 0.06, l * 0.98, 0, l)
      shape.bezierCurveTo(w * 0.06, l * 0.98, w * 0.2, l * 0.88, w * 0.3, l * 0.65)
      shape.bezierCurveTo(w * 0.38, l * 0.38, w * 0.15, l * 0.15, 0, 0)
      break
    }
    case 'spider': {
      // 彼岸花：極細長
      shape.moveTo(0, 0)
      shape.bezierCurveTo(-w * 0.1, l * 0.18, -w * 0.18, l * 0.45, -w * 0.12, l * 0.75)
      shape.quadraticCurveTo(-w * 0.05, l * 0.95, 0, l)
      shape.quadraticCurveTo(w * 0.05, l * 0.95, w * 0.12, l * 0.75)
      shape.bezierCurveTo(w * 0.18, l * 0.45, w * 0.1, l * 0.18, 0, 0)
      break
    }
    case 'phoenix': {
      // 鳳凰花：火焰形
      shape.moveTo(0, 0)
      shape.bezierCurveTo(-w * 0.2, l * 0.1, -w * 0.52, l * 0.25, -w * 0.48, l * 0.48)
      shape.bezierCurveTo(-w * 0.42, l * 0.68, -w * 0.25, l * 0.85, -w * 0.08, l * 0.96)
      shape.quadraticCurveTo(0, l * 1.02, w * 0.08, l * 0.96)
      shape.bezierCurveTo(w * 0.25, l * 0.85, w * 0.42, l * 0.68, w * 0.48, l * 0.48)
      shape.bezierCurveTo(w * 0.52, l * 0.25, w * 0.2, l * 0.1, 0, 0)
      break
    }
    case 'poppy': {
      // 虞美人：薄透寬大
      shape.moveTo(0, l * 0.04)
      shape.bezierCurveTo(-w * 0.6, l * 0.03, -w * 1.08, l * 0.28, -w * 1.0, l * 0.55)
      shape.bezierCurveTo(-w * 0.9, l * 0.8, -w * 0.48, l * 0.95, 0, l)
      shape.bezierCurveTo(w * 0.48, l * 0.95, w * 0.9, l * 0.8, w * 1.0, l * 0.55)
      shape.bezierCurveTo(w * 1.08, l * 0.28, w * 0.6, l * 0.03, 0, l * 0.04)
      break
    }
    default: {
      shape.moveTo(0, 0)
      shape.bezierCurveTo(-w * 0.4, l * 0.15, -w * 0.72, l * 0.42, -w * 0.58, l * 0.72)
      shape.quadraticCurveTo(-w * 0.25, l * 0.98, 0, l)
      shape.quadraticCurveTo(w * 0.25, l * 0.98, w * 0.58, l * 0.72)
      shape.bezierCurveTo(w * 0.72, l * 0.42, w * 0.4, l * 0.15, 0, 0)
    }
  }
  return shape
}

// ============ 花瓣幾何體 - 自然彎曲 ============
const createPetalGeometry = (type, width, length) => {
  const w = width * 0.5
  const l = length
  const shape = createPetalShape(type, w, l)
  const profile = petalProfiles[type] || petalProfiles.default

  const geometry = new THREE.ExtrudeGeometry(shape, {
    steps: 1,
    depth: 0.012,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.005,
    bevelSegments: 2,
    curveSegments: 16
  })

  const positions = geometry.attributes.position
  const { main, edge, tip } = profile.curve

  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i)
    const y = positions.getY(i)
    const z = positions.getZ(i)
    const t = Math.max(0, y) / l

    // 主彎曲：二次曲線，頂部更彎
    const mainBend = t * t * main * l * 0.45

    // 邊緣捲曲：邊緣向外/內捲
    const edgeFactor = Math.pow(Math.abs(x) / (w * 1.1), 1.5)
    const edgeCurl = edgeFactor * t * edge * l * 0.25

    // 尖端捲曲：花瓣頂部 65% 以上
    const tipT = Math.max(0, t - 0.65) / 0.35
    const tipCurl = tipT * tipT * tip * l * 0.18

    // 中脈微凸
    const midRib = (1 - edgeFactor) * t * 0.012

    // 自然波動（微小隨機感）
    const wave = Math.sin(t * Math.PI * 2.5 + x * 8) * 0.003 * t

    positions.setZ(i, z + mainBend + edgeCurl + tipCurl + midRib + wave)
  }

  geometry.computeVertexNormals()
  geometry.center()
  return geometry
}

// ============ 葉子幾何體 ============
const createLeafGeometry = (size = 0.32) => {
  const shape = new THREE.Shape()
  const l = size, w = size * 0.3

  shape.moveTo(0, 0)
  shape.bezierCurveTo(-w * 0.65, l * 0.12, -w * 0.9, l * 0.35, -w * 0.72, l * 0.62)
  shape.bezierCurveTo(-w * 0.48, l * 0.85, -w * 0.12, l * 0.98, 0, l)
  shape.bezierCurveTo(w * 0.15, l * 0.98, w * 0.52, l * 0.85, w * 0.78, l * 0.62)
  shape.bezierCurveTo(w * 0.95, l * 0.35, w * 0.7, l * 0.12, 0, 0)

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.004, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 1
  })

  const positions = geometry.attributes.position
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i)
    const t = y / l
    positions.setZ(i, z + t * t * size * 0.18 + (1 - Math.abs(x) / (w * 1.1)) * t * 0.012)
  }
  geometry.computeVertexNormals()
  return geometry
}

// ============ 花瓣組件 ============
const Petal = ({ geometry, position, rotation, color, scale = 1, index }) => {
  const meshRef = useRef()

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime()
      meshRef.current.scale.setScalar(scale * (1 + Math.sin(time * 1.1 + index * 0.7) * 0.008))
    }
  })

  return (
    <mesh ref={meshRef} position={position} rotation={rotation} geometry={geometry} scale={scale}>
      <meshStandardMaterial color={color} roughness={0.35} metalness={0.015} side={THREE.DoubleSide} />
    </mesh>
  )
}

// ============ 花瓣層組件 - 自然排列 ============
const PetalLayer = ({ config, color, layerIndex, faceForward, totalLayers, seed }) => {
  const groupRef = useRef()
  const { petalType, petalCount, petalSize, petalWidth, petalLength, rotation } = config
  const profile = petalProfiles[petalType] || petalProfiles.default
  const { baseRadius, radiusGrow, tiltBase, tiltDecay, randomPos, randomRot } = profile.arrange

  const layerProgress = totalLayers > 1 ? layerIndex / (totalLayers - 1) : 0
  const layerScale = 1 - layerProgress * 0.22

  const actualWidth = petalWidth * petalSize * layerScale * 0.38
  const actualLength = petalLength * petalSize * layerScale * 0.42

  const colors = useMemo(() => {
    const base = new THREE.Color(color)
    const hsl = {}
    base.getHSL(hsl)
    return {
      base: color,
      light: '#' + new THREE.Color().setHSL(hsl.h, hsl.s * 0.9, Math.min(hsl.l * 1.1, 0.92)).getHexString()
    }
  }, [color])

  const geometry = useMemo(() => createPetalGeometry(petalType, actualWidth, actualLength), [petalType, actualWidth, actualLength])

  useFrame((state) => {
    if (groupRef.current) {
      const axis = faceForward ? 'z' : 'y'
      groupRef.current.rotation[axis] = state.clock.getElapsedTime() * 0.035 + layerIndex * 0.12
    }
  })

  const petals = useMemo(() => {
    const items = []
    const radius = baseRadius + layerProgress * radiusGrow * totalLayers
    const layerRotOffset = (rotation * Math.PI / 180) * layerIndex
    const tilt = tiltBase * (1 - layerProgress * tiltDecay)

    // 使用 seed 產生一致的隨機數
    const random = (i, offset) => {
      const x = Math.sin((seed + i + offset) * 12.9898) * 43758.5453
      return x - Math.floor(x)
    }

    for (let i = 0; i < petalCount; i++) {
      const baseAngle = (i / petalCount) * Math.PI * 2 + layerRotOffset

      // 加入隨機偏移讓排列更自然
      const angleOffset = (random(i, 0) - 0.5) * randomRot
      const angle = baseAngle + angleOffset

      const posOffset = (random(i, 1) - 0.5) * randomPos
      const r = radius + posOffset

      const tiltOffset = (random(i, 2) - 0.5) * 0.08
      const finalTilt = tilt + tiltOffset

      const heightOffset = layerProgress * 0.035 + (random(i, 3) - 0.5) * 0.008

      if (faceForward) {
        items.push({
          position: [Math.cos(angle) * r, Math.sin(angle) * r, heightOffset],
          rotation: [finalTilt, 0, angle + Math.PI / 2],
        })
      } else {
        items.push({
          position: [Math.cos(angle) * r, heightOffset, Math.sin(angle) * r],
          rotation: [finalTilt, angle, 0],
        })
      }
    }
    return items
  }, [petalCount, baseRadius, radiusGrow, layerProgress, totalLayers, rotation, layerIndex, tiltBase, tiltDecay, randomPos, randomRot, faceForward, seed])

  return (
    <group ref={groupRef}>
      {petals.map((petal, i) => (
        <Petal
          key={i}
          geometry={geometry}
          position={petal.position}
          rotation={petal.rotation}
          color={i % 2 === 0 ? colors.base : colors.light}
          scale={layerScale}
          index={i + layerIndex * petalCount}
        />
      ))}
    </group>
  )
}

// ============ 花心組件 ============
const FlowerCenter = ({ config, isSSR }) => {
  const groupRef = useRef()
  const { centerSize, centerColor, special, faceForward } = config
  const size = centerSize * 0.36

  useFrame((state) => {
    if (groupRef.current) groupRef.current.scale.setScalar(1 + Math.sin(state.clock.getElapsedTime() * 1.6) * 0.018)
  })

  const rot = faceForward ? [Math.PI / 2, 0, 0] : [0, 0, 0]
  const pos = faceForward ? [0, 0, 0.012] : [0, 0.012, 0]

  const seeds = useMemo(() => {
    const items = []
    for (let i = 0; i < 50; i++) {
      const angle = i * 2.39996
      const r = size * 0.82 * Math.sqrt(i / 50)
      items.push({ p: [Math.cos(angle) * r, 0.022, Math.sin(angle) * r], s: 0.01 + Math.random() * 0.004 })
    }
    return items
  }, [size])

  const dots = useMemo(() => {
    const items = []
    for (let i = 0; i < 14; i++) {
      const phi = Math.acos(-1 + (2 * i) / 14)
      const theta = Math.sqrt(14 * Math.PI) * phi
      items.push([Math.cos(theta) * Math.sin(phi) * size * 0.88, Math.sin(theta) * Math.sin(phi) * size * 0.88, Math.cos(phi) * size * 0.88])
    }
    return items
  }, [size])

  if (special === 'sunflower') {
    return (
      <group ref={groupRef} position={pos} rotation={rot}>
        <mesh><cylinderGeometry args={[size, size * 0.88, 0.045, 28]} /><meshStandardMaterial color="#5D4537" roughness={0.88} /></mesh>
        {seeds.map((seed, i) => <mesh key={i} position={seed.p}><sphereGeometry args={[seed.s, 5, 5]} /><meshStandardMaterial color={i % 3 === 0 ? "#2D1F0F" : "#4A3020"} roughness={0.78} /></mesh>)}
      </group>
    )
  }

  if (special === 'lily') {
    return (
      <group ref={groupRef} position={pos} rotation={rot}>
        <mesh><sphereGeometry args={[size * 0.22, 10, 10]} /><meshStandardMaterial color="#90B080" roughness={0.52} /></mesh>
        {[...Array(6)].map((_, i) => (
          <group key={i} rotation={[0.3, (i / 6) * Math.PI * 2, 0]}>
            <mesh position={[0, 0.1, 0]}><cylinderGeometry args={[0.005, 0.005, 0.16, 5]} /><meshStandardMaterial color="#7CB040" roughness={0.48} /></mesh>
            <mesh position={[0, 0.19, 0]}><capsuleGeometry args={[0.016, 0.028, 4, 5]} /><meshStandardMaterial color="#8B5020" roughness={0.55} /></mesh>
          </group>
        ))}
      </group>
    )
  }

  if (special === 'lotus') {
    return (
      <group ref={groupRef} position={pos} rotation={rot}>
        <mesh><cylinderGeometry args={[size * 0.48, size * 0.35, 0.09, 10]} /><meshStandardMaterial color="#DAA520" roughness={0.58} /></mesh>
        {[...Array(6)].map((_, i) => {
          const angle = (i / 6) * Math.PI * 2
          return <mesh key={i} position={[Math.cos(angle) * size * 0.26, 0.05, Math.sin(angle) * size * 0.26]}><sphereGeometry args={[0.016, 5, 5]} /><meshStandardMaterial color="#556B2F" roughness={0.65} /></mesh>
        })}
      </group>
    )
  }

  return (
    <group ref={groupRef} position={pos} rotation={rot}>
      <mesh><sphereGeometry args={[size, 18, 18]} /><meshStandardMaterial color={centerColor} roughness={0.45} metalness={isSSR ? 0.1 : 0.02} /></mesh>
      {dots.map((dot, i) => <mesh key={i} position={dot}><sphereGeometry args={[size * 0.07, 4, 4]} /><meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.1} /></mesh>)}
    </group>
  )
}

// ============ 花萼 ============
const Sepals = ({ faceForward }) => {
  const geom = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(0, 0)
    shape.bezierCurveTo(0.032, 0.018, 0.028, 0.07, 0.02, 0.12)
    shape.quadraticCurveTo(0, 0.14, -0.02, 0.12)
    shape.bezierCurveTo(-0.028, 0.07, -0.032, 0.018, 0, 0)
    return new THREE.ExtrudeGeometry(shape, { depth: 0.006, bevelEnabled: false })
  }, [])

  const sepals = useMemo(() => {
    const items = []
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2
      items.push(faceForward
        ? { position: [Math.cos(angle) * 0.045, Math.sin(angle) * 0.045, -0.03], rotation: [0.62, 0, angle + Math.PI / 2] }
        : { position: [Math.cos(angle) * 0.045, -0.03, Math.sin(angle) * 0.045], rotation: [0.62, angle, 0] })
    }
    return items
  }, [faceForward])

  return <group>{sepals.map((s, i) => <mesh key={i} position={s.position} rotation={s.rotation} geometry={geom}><meshStandardMaterial color="#2E5E28" roughness={0.52} side={THREE.DoubleSide} /></mesh>)}</group>
}

// ============ SSR 光暈 ============
const SSRGlow = ({ color, glowColor, faceForward }) => {
  const ref = useRef()
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (ref.current) {
      ref.current.scale.setScalar(1 + Math.sin(t * 1.4) * 0.055)
      ref.current.material.opacity = 0.1 + Math.sin(t * 1.8) * 0.035
    }
  })
  return (
    <mesh ref={ref} position={faceForward ? [0, 0, -0.18] : [0, -0.09, 0]} rotation={faceForward ? [0, 0, 0] : [Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.9, 28]} /><meshBasicMaterial color={glowColor || color} transparent opacity={0.1} side={THREE.DoubleSide} />
    </mesh>
  )
}

// ============ 繡球花 ============
const HydrangeaCluster = ({ color }) => {
  const ref = useRef()
  useFrame((state) => { if (ref.current) ref.current.rotation.y = state.clock.getElapsedTime() * 0.055 })

  const flowers = useMemo(() => {
    const items = []
    for (let i = 0; i < 28; i++) {
      const phi = Math.acos(-1 + (2 * i) / 28)
      const theta = Math.sqrt(28 * Math.PI) * phi
      items.push([Math.cos(theta) * Math.sin(phi) * 0.32, Math.sin(theta) * Math.sin(phi) * 0.32, Math.cos(phi) * 0.32])
    }
    return items
  }, [])

  const petalGeom = useMemo(() => createPetalGeometry('hydrangea', 0.05, 0.058), [])

  const colors = useMemo(() => {
    const base = new THREE.Color(color), hsl = {}
    base.getHSL(hsl)
    return [color, '#' + new THREE.Color().setHSL(hsl.h + 0.035, hsl.s, hsl.l).getHexString(), '#' + new THREE.Color().setHSL(hsl.h - 0.035, hsl.s * 0.92, hsl.l * 1.06).getHexString()]
  }, [color])

  return (
    <group ref={ref} position={[0, 0.35, 0]}>
      {flowers.map((pos, fi) => (
        <group key={fi} position={pos}>
          {[0, 1, 2, 3].map((pi) => {
            const angle = (pi / 4) * Math.PI * 2
            return <mesh key={pi} position={[Math.cos(angle) * 0.014, Math.sin(angle) * 0.014, 0]} rotation={[0.12, 0, angle + Math.PI / 2]} geometry={petalGeom}><meshStandardMaterial color={colors[fi % 3]} roughness={0.4} side={THREE.DoubleSide} /></mesh>
          })}
          <mesh><sphereGeometry args={[0.01, 5, 5]} /><meshStandardMaterial color="#FFD700" /></mesh>
        </group>
      ))}
    </group>
  )
}

// ============ 薰衣草 ============
const LavenderSpike = ({ color }) => {
  const ref = useRef()
  useFrame((state) => { if (ref.current) ref.current.rotation.z = Math.sin(state.clock.getElapsedTime() * 0.45) * 0.035 })

  const flowers = useMemo(() => {
    const items = []
    for (let i = 0; i < 16; i++) items.push({ y: 0.24 + (i / 15) * 0.5, scale: 0.52 + (1 - i / 15) * 0.48 })
    return items
  }, [])

  return (
    <group ref={ref}>
      {flowers.map((f, i) => (
        <group key={i} position={[0, f.y, 0]} scale={f.scale}>
          {[0, 1, 2, 3, 4, 5].map((p) => {
            const angle = (p / 6) * Math.PI * 2 + i * 0.28
            return <mesh key={p} position={[Math.cos(angle) * 0.022, 0, Math.sin(angle) * 0.022]} rotation={[0.22, angle, 0]}><sphereGeometry args={[0.018, 5, 5]} /><meshStandardMaterial color={color} roughness={0.52} /></mesh>
          })}
        </group>
      ))}
    </group>
  )
}

// ============ 花莖 ============
const Stem = ({ height = 1.45, curve = 0.18 }) => {
  const geometry = useMemo(() => {
    const points = []
    for (let i = 0; i <= 20; i++) {
      const t = i / 20
      points.push(new THREE.Vector3(Math.sin(t * Math.PI * 1.05) * curve * (1 - t * 0.32), -height * t, Math.cos(t * Math.PI * 0.65) * curve * 0.22 * (1 - t * 0.45)))
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 18, 0.028, 7, false)
  }, [height, curve])
  return <mesh geometry={geometry}><meshStandardMaterial color="#2A5520" roughness={0.62} /></mesh>
}

// ============ 葉子 ============
const Leaf = ({ position, rotation, size = 0.28, delay = 0 }) => {
  const ref = useRef()
  const geometry = useMemo(() => createLeafGeometry(size), [size])
  useFrame((state) => { if (ref.current) ref.current.rotation.z = rotation[2] + Math.sin(state.clock.getElapsedTime() * 0.65 + delay) * 0.045 })
  return <mesh ref={ref} position={position} rotation={rotation} geometry={geometry}><meshStandardMaterial color="#388030" roughness={0.48} side={THREE.DoubleSide} /></mesh>
}

const StemLeaves = ({ curve = 0.18 }) => (
  <group>
    <Leaf position={[curve * 0.45 + 0.065, -0.32, 0.025]} rotation={[0.32, -0.22, 0.52]} size={0.28} delay={0} />
    <Leaf position={[-curve * 0.22 - 0.085, -0.58, -0.035]} rotation={[0.3, 0.32, -0.55]} size={0.32} delay={0.45} />
    <Leaf position={[curve * 0.12 + 0.045, -0.85, 0.018]} rotation={[0.26, -0.18, 0.42]} size={0.26} delay={0.9} />
  </group>
)

const BaseLeaves = () => {
  const leaves = useMemo(() => {
    const items = []
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 + (Math.random() - 0.5) * 0.22
      items.push({ position: [Math.cos(angle) * 0.1, -1.38, Math.sin(angle) * 0.1], rotation: [0.72 + Math.random() * 0.22, angle + (Math.random() - 0.5) * 0.28, 0], size: 0.28 + Math.random() * 0.08 })
    }
    return items
  }, [])
  return <group>{leaves.map((l, i) => <Leaf key={i} {...l} delay={i * 0.18} />)}</group>
}

// ============ 3D 模型配置 ============
//
// 【參數說明】
// ┌─────────────────┬────────────────────────────────────────────────────────┐
// │ 參數名稱         │ 說明                                                    │
// ├─────────────────┼────────────────────────────────────────────────────────┤
// │ type            │ 模型格式：'glb'、'fbx' 或 'obj'                          │
// │ glb / fbx / obj / mtl │ 模型檔案路徑                                      │
// ├─────────────────┼────────────────────────────────────────────────────────┤
// │ scale           │ 縮放比例，數字越大模型越大                               │
// │ position        │ [X, Y, Z] 位置偏移，Y負值=往下移                         │
// │ rotation        │ [X軸, Y軸, Z軸] 旋轉角度（弧度），Z負值=順時針傾斜        │
// ├─────────────────┼────────────────────────────────────────────────────────┤
// │ modelOffset     │ [X, Y, Z] 模型中心偏移，用於調整旋轉軸心位置              │
// │                 │ X負值=模型往左移（旋轉中心往右）                          │
// │ autoRotateSpeed │ 自動旋轉速度，0=停止旋轉，數字越大轉越快                  │
// │ showPivotGuide  │ true=顯示旋轉中心輔助線（紅:水平 綠:垂直 黃:旋轉圓）      │
// │ pivotHeight     │ 水平旋轉面的高度（Y軸位置），正值=往上，負值=往下          │
// ├─────────────────┼────────────────────────────────────────────────────────┤
// │ lightIntensity  │ 亮度倍率，預設 1.0，數字越小越暗（0.5=減半）             │
// │ forceOpaque     │ true=強制不透明，解決模型透明度過高問題                   │
// │ flowerColor     │ 花的顏色（十六進位色碼），會覆蓋模型中的白色/淺色材質      │
// │ overrideAllColors│ true=強制覆蓋所有花朵顏色（不只白色），需配合flowerColor    │
// │ stemColor       │ 莖的顏色（十六進位色碼），會覆蓋模型中的棕色材質           │
// │ filterMeshes    │ 要隱藏的 mesh 名稱陣列，例如 ['cube', 'plane']           │
// ├─────────────────┼────────────────────────────────────────────────────────┤
// │ clipThreshold   │ (OBJ專用) 裁切閾值，用於移除模型底部                     │
// │ clipAxis        │ (OBJ專用) 裁切軸：'x', 'y', 或 'z'                       │
// │ clipDirection   │ (OBJ專用) 裁切方向：'>' 保留大於閾值的部分               │
// └─────────────────┴────────────────────────────────────────────────────────┘
//
const flower3DConfigs = {
  // 向日葵 - OBJ 格式模型
  sunflower: {
    type: 'obj',
    mtl: '/models/sunflower/10455_Sunflower_v1_max2010_it2.mtl',
    obj: '/models/sunflower/10455_Sunflower_v1_max2010_it2.obj',
    scale: 0.019,                      // 縮放比例
    position: [0, -2.0, 0],            // 往下移 2 單位
    rotation: [-Math.PI / 2, 0, 0],    // X軸旋轉 -90度（原模型躺著）
    clipThreshold: 80,                 // 裁切 Z < 80 的部分（移除長莖）
    clipAxis: 'z',
    clipDirection: '>',
  },

  // 玫瑰 - GLB 格式模型
  rose: {
    type: 'glb',
    glb: '/models/rose/rose.glb',
    scale: 1.5,                        // 放大 1.5 倍
    position: [0, -0.5, 0],            // 往下移 0.5 單位
    rotation: [0, 0, 0],               // 不旋轉
    autoRotateSpeed: 0,                // 不自動旋轉
  },

  // 櫻花 - GLB 格式模型（樹枝造型）
  sakura: {
    type: 'glb',
    glb: '/models/sakura/sakura.glb',
    scale: 4.5,                        // 放大 4.5 倍
    position: [0, -0.5, 0],            // 往下移 0.5 單位
    rotation: [0, 0, -0.3],            // Z軸順時針傾斜 0.3 弧度（約17度）
    modelOffset: [-0.05, 0, 0],        // 模型往左移 0.05，讓樹枝中心對齊旋轉軸
    autoRotateSpeed: 0,                // 不自動旋轉
    showPivotGuide: false,             // 不顯示輔助線（調整時可開啟）
  },

  // 薰衣草 - GLB 格式模型
  lavender: {
    type: 'glb',
    glb: '/models/lavender/lavender.glb',
    scale: 2,                          // 放大 2 倍
    position: [0, 0, 0],               // 不偏移
    rotation: [0, 0, 0],               // 不旋轉
    modelOffset: [0, 0, 0],            // 不偏移中心
    autoRotateSpeed: 0,                // 不自動旋轉
    showPivotGuide: false,             // 不顯示輔助線
    flowerColor: '#9370DB',            // 紫色（覆蓋原本白色的花）
  },

  // 茉莉花 - GLB 格式模型
  jasmine: {
    type: 'glb',
    glb: '/models/jasmine/jasmine.glb',
    scale: 1.8,                          // 縮放比例
    position: [0, -0.1, 0],             // 位置偏移
    rotation: [0, 0, 0.4],               // 旋轉角度
    modelOffset: [0.1, 0, 0.01],           // 模型中心偏移
    autoRotateSpeed: 0,                  // 不自動旋轉
    showPivotGuide: false,                // 顯示輔助線方便調整
    pivotHeight: 0.1,                      // 水平旋轉面高度（Y軸位置）
    lightIntensity: 0.05,                // 亮度倍率
    forceOpaque: false,                   // 強制不透明
    stemColor: '#2D5A1E',                // 莖的顏色（綠色）
  },

  // 蓮花 - GLB 格式模型
  lotus: {
    type: 'glb',
    glb: '/models/lotus/lotus.glb',
    scale: 0.12,                         // 縮放比例
    position: [0, 0, 0],                 // 位置偏移
    rotation: [0, 0, 0.4],               // 旋轉角度
    modelOffset: [0, 0, 0],              // 模型中心偏移
    autoRotateSpeed: 0,                  // 不自動旋轉
    showPivotGuide: false,               // 顯示輔助線
    pivotHeight: 0,                      // 水平旋轉面高度
  },

  // 鬱金香 - GLB 格式模型
  tulip: {
    type: 'glb',
    glb: '/models/tulip/tulip.glb',
    scale: 0.07,                         // 縮放比例
    position: [0, 0.07, 0],              // 位置偏移
    rotation: [0, 0, 0],                 // 旋轉角度
    modelOffset: [0, 0, 0],              // 模型中心偏移
    autoRotateSpeed: 0,                  // 不自動旋轉
    showPivotGuide: false,               // 顯示輔助線
    pivotHeight: 0,                      // 水平旋轉面高度
  },

  // 桔梗 - GLB 格式模型
  bellflower: {
    type: 'glb',
    glb: '/models/bellflower/bellflower.glb',
    scale: 0.2,                          // 縮放比例
    position: [0, 0, 0],                 // 位置偏移
    rotation: [0, 0, 0],                 // 旋轉角度
    modelOffset: [0, 0, 0],              // 模型中心偏移
    autoRotateSpeed: 0,                  // 不自動旋轉
    showPivotGuide: false,               // 顯示輔助線
    pivotHeight: 0,                      // 水平旋轉面高度
  },

  // 紫羅蘭 - GLB 格式模型
  violet: {
    type: 'glb',
    glb: '/models/violet/violet.glb',
    scale: 12.5,                         // 縮放比例
    position: [0, 0.1, 0],               // 位置偏移
    rotation: [0, 0, 0],                 // 旋轉角度
    modelOffset: [0, 0, 0],              // 模型中心偏移
    autoRotateSpeed: 0,                  // 不自動旋轉
    showPivotGuide: false,               // 顯示輔助線
    pivotHeight: 0,                      // 水平旋轉面高度
  },

  // 百合 - GLB 格式模型
  lily: {
    type: 'glb',
    glb: '/models/lily/lily.glb',
    scale: 0.1,                           // 縮放比例
    position: [0.1, 0.5, 0],                 // 位置偏移
    rotation: [0, 0, 0],                 // 旋轉角度
    modelOffset: [0, 0, 0],              // 模型中心偏移
    autoRotateSpeed: 0,                  // 不自動旋轉
    showPivotGuide: false,                // 顯示輔助線方便調整
    pivotHeight: 0,                      // 水平旋轉面高度
    lightIntensity: 1.5,                 // 亮度
  },

  // 牡丹 - GLB 格式模型
  peony: {
    type: 'glb',
    glb: '/models/peony/peony.glb',
    scale: 0.47,                            // 縮放比例
    position: [0, 0, 0.05],                 // 位置偏移
    rotation: [0, 0, 0],                 // 旋轉角度
    modelOffset: [0, 0, 0],              // 模型中心偏移
    autoRotateSpeed: 0,                  // 不自動旋轉
    showPivotGuide: false,                // 顯示輔助線方便調整
    pivotHeight: 0,                      // 水平旋轉面高度
    lightIntensity: 1,                   // 亮度
  },

  // 菊花 - GLB 格式模型
  chrysanthemum: {
    type: 'glb',
    glb: '/models/chrysanthemum/chrysanthemum.glb',
    scale: 8.5,                            // 縮放比例
    position: [0, 0.15, 0],                 // 位置偏移
    rotation: [0, 0, 0],                 // 旋轉角度
    modelOffset: [0, 0, 0],              // 模型中心偏移
    autoRotateSpeed: 0,                  // 不自動旋轉
    showPivotGuide: false,                // 顯示輔助線方便調整
    pivotHeight: 0,                      // 水平旋轉面高度
    lightIntensity: 1,                   // 亮度
  },

  // 繡球花 - GLB 格式模型
  hydrangea: {
    type: 'glb',
    glb: '/models/hydrangea/hydrangea.glb',
    scale: 3.7,                            // 縮放比例
    position: [0, -0.55, 0],                 // 位置偏移
    rotation: [0, 0, 0],                 // 旋轉角度
    modelOffset: [0, 0, 0],              // 模型中心偏移
    autoRotateSpeed: 0,                  // 不自動旋轉
    showPivotGuide: false,                // 顯示輔助線方便調整
    pivotHeight: 0,                      // 水平旋轉面高度
    lightIntensity: 1,                   // 亮度
  },
}


// ============ GLB 模型載入組件 ============
const FlowerGLBModel = ({ modelType }) => {
  const groupRef = useRef()
  const config = flower3DConfigs[modelType]
  // 第二個參數 true 啟用 Draco 解碼（支援壓縮的 GLB）
  const { scene } = useGLTF(config.glb, true)

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true)  // 深度克隆
    const toRemove = []

    clone.traverse((child) => {
      if (child.isMesh) {
        // 過濾指定的 mesh（如正方體）
        const filterList = config.filterMeshes || []
        const shouldFilter = filterList.some(name =>
          child.name.toLowerCase().includes(name.toLowerCase())
        )

        if (shouldFilter) {
          toRemove.push(child)
        } else {
          child.castShadow = true
          child.receiveShadow = true
          // 處理材質（可能是單一材質或材質陣列）
          const isArray = Array.isArray(child.material)
          const materials = isArray ? child.material : [child.material]
          const processedMats = materials.map(mat => {
            if (!mat) return mat
            const clonedMat = mat.clone()
            clonedMat.side = THREE.DoubleSide
            clonedMat.needsUpdate = true

            // 強制不透明（解決透明度過高問題）
            if (config.forceOpaque) {
              clonedMat.transparent = false
              clonedMat.opacity = 1.0
              clonedMat.alphaTest = 0
              clonedMat.depthWrite = true
              clonedMat.alphaMap = null
              clonedMat.alphaToCoverage = false
              if (clonedMat.blending !== undefined) {
                clonedMat.blending = THREE.NormalBlending
              }
            }

            // 如果設定了花的顏色，覆蓋白色/淺色材質（或強制覆蓋所有非莖顏色）
            if (config.flowerColor && clonedMat.color) {
              const color = clonedMat.color
              // 檢測是否為莖（棕色/綠色系）- 這些不要被 flowerColor 覆蓋
              const isStem = (color.r > color.g && color.g > color.b && color.r < 0.7) ||
                             (color.r > 0.3 && color.g < 0.4 && color.b < 0.3) ||
                             (color.g > color.r && color.g > color.b) // 綠色

              if (config.overrideAllColors) {
                // 強制覆蓋所有顏色（除了莖）
                if (!isStem) {
                  clonedMat.color.set(config.flowerColor)
                }
              } else {
                // 只覆蓋白色/淺色材質
                if (color.r > 0.8 && color.g > 0.8 && color.b > 0.8) {
                  clonedMat.color.set(config.flowerColor)
                }
              }
            }

            // 如果設定了莖的顏色，覆蓋棕色/深色材質
            if (config.stemColor && clonedMat.color) {
              const color = clonedMat.color
              // 檢測棕色系（R > G > B 且整體偏暗）
              const isBrown = (color.r > color.g && color.g > color.b && color.r < 0.7) ||
                              (color.r > 0.3 && color.g < 0.4 && color.b < 0.3)
              if (isBrown) {
                clonedMat.color.set(config.stemColor)
              }
            }

            return clonedMat
          })
          // 如果原本是單一材質，還原為單一材質
          child.material = isArray ? processedMats : processedMats[0]
        }
      }
    })

    // 移除被過濾的 mesh
    toRemove.forEach(obj => obj.parent?.remove(obj))

    return clone
  }, [scene, config.filterMeshes, config.flowerColor, config.forceOpaque, config.stemColor, config.overrideAllColors])

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * (config.autoRotateSpeed || 0.15)
    }
  })

  return (
    <group ref={groupRef}>
      {/* 旋轉中心輔助線 */}
      {config.showPivotGuide && (
        <>
          {/* 水平線（紅色）- 可用 pivotHeight 調整高度 */}
          <mesh position={[0, config.pivotHeight || 0, 0]}>
            <boxGeometry args={[2, 0.01, 0.01]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>
          {/* 垂直線（綠色）*/}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.01, 2, 0.01]} />
            <meshBasicMaterial color="#00ff00" />
          </mesh>
          {/* 旋轉軌跡圓（黃色）- 可用 pivotHeight 調整高度 */}
          <mesh position={[0, config.pivotHeight || 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.95, 1, 64]} />
            <meshBasicMaterial color="#ffff00" side={THREE.DoubleSide} transparent opacity={0.5} />
          </mesh>
        </>
      )}
      {/* 模型容器：先偏移讓樹枝對齊中心，再旋轉 */}
      <group position={config.modelOffset || [0, 0, 0]}>
        <group
          scale={config.scale}
          rotation={config.rotation || [0, 0, 0]}
          position={config.position}
        >
          <primitive object={clonedScene} />
        </group>
      </group>
      {/* 補光 - 可調亮度（lightIntensity: 預設 1.0，數字越小越暗）*/}
      {(() => {
        const li = config.lightIntensity ?? 1.0
        return (
          <>
            <pointLight position={[0, 1, 2]} intensity={4 * li} color="#fffaf0" />
            <pointLight position={[0, 1, -2]} intensity={4 * li} color="#fff8dc" />
            <pointLight position={[2, 0.8, 0]} intensity={3.5 * li} color="#ffffff" />
            <pointLight position={[-2, 0.8, 0]} intensity={3.5 * li} color="#ffffff" />
            <pointLight position={[0, -0.5, 1.5]} intensity={2.5 * li} color="#fff5ee" />
            <pointLight position={[0, 2, 0]} intensity={3 * li} color="#ffffff" />
          </>
        )
      })()}
    </group>
  )
}

// ============ FBX 模型載入組件 ============
const FlowerFBXModel = ({ modelType }) => {
  const groupRef = useRef()
  const config = flower3DConfigs[modelType]
  const fbx = useLoader(FBXLoader, config.fbx)

  const clonedScene = useMemo(() => {
    const clone = fbx.clone(true)
    const toRemove = []

    clone.traverse((child) => {
      if (child.isMesh) {
        const filterList = config.filterMeshes || []
        const shouldFilter = filterList.some(name =>
          child.name.toLowerCase().includes(name.toLowerCase())
        )

        if (shouldFilter) {
          toRemove.push(child)
        } else {
          child.castShadow = true
          child.receiveShadow = true
          const isArray = Array.isArray(child.material)
          const materials = isArray ? child.material : [child.material]
          const processedMats = materials.map(mat => {
            if (!mat) return mat
            const clonedMat = mat.clone()
            clonedMat.side = THREE.DoubleSide
            clonedMat.needsUpdate = true

            if (config.forceOpaque) {
              clonedMat.transparent = false
              clonedMat.opacity = 1.0
              clonedMat.alphaTest = 0
              clonedMat.depthWrite = true
              clonedMat.alphaMap = null
              clonedMat.alphaToCoverage = false
              if (clonedMat.blending !== undefined) {
                clonedMat.blending = THREE.NormalBlending
              }
            }

            if (config.flowerColor && clonedMat.color) {
              const color = clonedMat.color
              const isStem = (color.r > color.g && color.g > color.b && color.r < 0.7) ||
                             (color.r > 0.3 && color.g < 0.4 && color.b < 0.3) ||
                             (color.g > color.r && color.g > color.b)

              if (config.overrideAllColors) {
                if (!isStem) {
                  clonedMat.color.set(config.flowerColor)
                }
              } else {
                if (color.r > 0.8 && color.g > 0.8 && color.b > 0.8) {
                  clonedMat.color.set(config.flowerColor)
                }
              }
            }

            if (config.stemColor && clonedMat.color) {
              const color = clonedMat.color
              const isBrown = (color.r > color.g && color.g > color.b && color.r < 0.7) ||
                              (color.r > 0.3 && color.g < 0.4 && color.b < 0.3)
              if (isBrown) {
                clonedMat.color.set(config.stemColor)
              }
            }

            return clonedMat
          })
          child.material = isArray ? processedMats : processedMats[0]
        }
      }
    })

    toRemove.forEach(obj => obj.parent?.remove(obj))
    return clone
  }, [fbx, config.filterMeshes, config.flowerColor, config.forceOpaque, config.stemColor, config.overrideAllColors])

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * (config.autoRotateSpeed || 0.15)
    }
  })

  return (
    <group ref={groupRef}>
      {config.showPivotGuide && (
        <>
          <mesh position={[0, config.pivotHeight || 0, 0]}>
            <boxGeometry args={[2, 0.01, 0.01]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.01, 2, 0.01]} />
            <meshBasicMaterial color="#00ff00" />
          </mesh>
          <mesh position={[0, config.pivotHeight || 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.95, 1, 64]} />
            <meshBasicMaterial color="#ffff00" side={THREE.DoubleSide} transparent opacity={0.5} />
          </mesh>
        </>
      )}
      <group position={config.modelOffset || [0, 0, 0]}>
        <group
          scale={config.scale}
          rotation={config.rotation || [0, 0, 0]}
          position={config.position}
        >
          <primitive object={clonedScene} />
        </group>
      </group>
      {(() => {
        const li = config.lightIntensity ?? 1.0
        return (
          <>
            <pointLight position={[0, 1, 2]} intensity={4 * li} color="#fffaf0" />
            <pointLight position={[0, 1, -2]} intensity={4 * li} color="#fff8dc" />
            <pointLight position={[2, 0.8, 0]} intensity={3.5 * li} color="#ffffff" />
            <pointLight position={[-2, 0.8, 0]} intensity={3.5 * li} color="#ffffff" />
            <pointLight position={[0, -0.5, 1.5]} intensity={2.5 * li} color="#fff5ee" />
            <pointLight position={[0, 2, 0]} intensity={3 * li} color="#ffffff" />
          </>
        )
      })()}
    </group>
  )
}

// ============ 通用 OBJ 3D 花朵模型 ============
const FlowerOBJModel = ({ modelType }) => {
  const groupRef = useRef()
  const config = flower3DConfigs[modelType] || flower3DConfigs.sunflower

  const materials = useLoader(MTLLoader, config.mtl)
  const obj = useLoader(OBJLoader, config.obj, (loader) => {
    materials.preload()
    loader.setMaterials(materials)
  })

  const clonedObj = useMemo(() => {
    const clone = obj.clone()
    clone.traverse((child) => {
      if (child.isMesh && child.geometry) {
        const geo = child.geometry.clone()
        const pos = geo.attributes.position
        const indices = geo.index ? Array.from(geo.index.array) : null
        const { clipThreshold, clipAxis, clipDirection } = config

        const getAxisValue = (arr, idx, axis) => {
          const base = idx * 3
          if (axis === 'x') return arr[base]
          if (axis === 'y') return arr[base + 1]
          return arr[base + 2]
        }

        const shouldKeep = (v0, v1, v2) => {
          if (clipDirection === '>') {
            return v0 > clipThreshold && v1 > clipThreshold && v2 > clipThreshold
          }
          return v0 < clipThreshold && v1 < clipThreshold && v2 < clipThreshold
        }

        if (indices) {
          const newIndices = []
          for (let i = 0; i < indices.length; i += 3) {
            const v0 = clipAxis === 'z' ? pos.getZ(indices[i]) : clipAxis === 'y' ? pos.getY(indices[i]) : pos.getX(indices[i])
            const v1 = clipAxis === 'z' ? pos.getZ(indices[i+1]) : clipAxis === 'y' ? pos.getY(indices[i+1]) : pos.getX(indices[i+1])
            const v2 = clipAxis === 'z' ? pos.getZ(indices[i+2]) : clipAxis === 'y' ? pos.getY(indices[i+2]) : pos.getX(indices[i+2])
            if (shouldKeep(v0, v1, v2)) {
              newIndices.push(indices[i], indices[i + 1], indices[i + 2])
            }
          }
          geo.setIndex(newIndices)
        } else {
          const oldPos = pos.array
          const newPos = []
          const uv = geo.attributes.uv ? geo.attributes.uv.array : null
          const newUv = uv ? [] : null
          const normal = geo.attributes.normal ? geo.attributes.normal.array : null
          const newNormal = normal ? [] : null

          for (let i = 0; i < pos.count; i += 3) {
            const v0 = getAxisValue(oldPos, i, clipAxis)
            const v1 = getAxisValue(oldPos, i + 1, clipAxis)
            const v2 = getAxisValue(oldPos, i + 2, clipAxis)

            if (shouldKeep(v0, v1, v2)) {
              for (let j = 0; j < 3; j++) {
                const idx = i + j
                newPos.push(oldPos[idx * 3], oldPos[idx * 3 + 1], oldPos[idx * 3 + 2])
                if (uv) newUv.push(uv[idx * 2], uv[idx * 2 + 1])
                if (normal) newNormal.push(normal[idx * 3], normal[idx * 3 + 1], normal[idx * 3 + 2])
              }
            }
          }

          geo.setAttribute('position', new THREE.Float32BufferAttribute(newPos, 3))
          if (newUv) geo.setAttribute('uv', new THREE.Float32BufferAttribute(newUv, 2))
          if (newNormal) geo.setAttribute('normal', new THREE.Float32BufferAttribute(newNormal, 3))
        }

        child.geometry = geo
        if (child.material) {
          child.material.side = THREE.DoubleSide
        }
      }
    })
    return clone
  }, [obj, config])

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.15
    }
  })

  return (
    <group ref={groupRef}>
      {/* 旋轉中心輔助線 */}
      {config.showPivotGuide && (
        <>
          <mesh position={[0, config.pivotHeight || 0, 0]}>
            <boxGeometry args={[2, 0.01, 0.01]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.01, 2, 0.01]} />
            <meshBasicMaterial color="#00ff00" />
          </mesh>
          <mesh position={[0, config.pivotHeight || 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.95, 1, 64]} />
            <meshBasicMaterial color="#ffff00" side={THREE.DoubleSide} transparent opacity={0.5} />
          </mesh>
        </>
      )}
      <group scale={config.scale} rotation={config.rotation || [-Math.PI / 2, 0, 0]} position={config.position}>
        <primitive object={clonedObj} />
      </group>
      {/* 補光 - 可調亮度 */}
      {(() => {
        const li = config.lightIntensity ?? 1.0
        return (
          <>
            <pointLight position={[0, 0.8, 1.5]} intensity={3 * li} color="#fffaf0" />
            <pointLight position={[0, 0.8, -1.5]} intensity={3 * li} color="#fff8dc" />
            <pointLight position={[1.5, 0.6, 0]} intensity={2.5 * li} color="#ffffff" />
            <pointLight position={[-1.5, 0.6, 0]} intensity={2.5 * li} color="#ffffff" />
            <pointLight position={[0.8, -0.3, 0.8]} intensity={2 * li} color="#fffef5" />
            <pointLight position={[-0.8, -0.3, 0.8]} intensity={2 * li} color="#fffef5" />
            <pointLight position={[0, 1.5, 0]} intensity={2 * li} color="#ffffff" />
          </>
        )
      })()}
    </group>
  )
}

// ============ 統一 3D 模型分發器 ============
const Flower3DModel = ({ modelType }) => {
  const config = flower3DConfigs[modelType]
  if (!config) return null

  if (config.type === 'glb') {
    return <FlowerGLBModel modelType={modelType} />
  }
  if (config.type === 'fbx') {
    return <FlowerFBXModel modelType={modelType} />
  }
  return <FlowerOBJModel modelType={modelType} />
}

// ============ 完整花朵 ============
const CompleteFlower = ({ flower, config }) => {
  const isSSR = flower.rarity === 'ssr'
  const { layers, faceForward, special, glowColor, petalType } = config
  const curveStrength = 0.18
  const seed = useMemo(() => Math.random() * 1000, [])

  // 有 3D 模型的花朵
  if (flower3DConfigs[petalType]) {
    return (
      <Suspense fallback={null}>
        <Flower3DModel modelType={petalType} />
      </Suspense>
    )
  }

  if (special === 'hydrangea') {
    return (
      <group>
        <HydrangeaCluster color={flower.color} />
        <group position={[0, 0.35, 0]}><Stem height={1.28} curve={0.14} /><StemLeaves curve={0.14} /></group>
        <BaseLeaves />
      </group>
    )
  }

  if (special === 'spike') {
    return (
      <group>
        <LavenderSpike color={flower.color} />
        <group position={[0, 0.24, 0]}><Stem height={1.18} curve={0.1} /><StemLeaves curve={0.1} /></group>
        <BaseLeaves />
      </group>
    )
  }

  return (
    <group>
      <group position={[0, 0.4, 0]}>
        {isSSR && <SSRGlow color={flower.color} glowColor={glowColor} faceForward={faceForward} />}
        <Sepals faceForward={faceForward} />
        <FlowerCenter config={config} isSSR={isSSR} />
        {[...Array(layers)].map((_, layerIndex) => (
          <PetalLayer
            key={layerIndex}
            config={config}
            color={isSSR && flower.gradientColors ? flower.gradientColors[layerIndex % flower.gradientColors.length] : flower.color}
            layerIndex={layerIndex}
            faceForward={faceForward}
            totalLayers={layers}
            seed={seed + layerIndex * 100}
          />
        ))}
      </group>
      <group position={[0, 0.4, 0]}><Stem height={1.48} curve={curveStrength} /><StemLeaves curve={curveStrength} /></group>
      <BaseLeaves />
    </group>
  )
}

// ============ 主組件 ============
const FlowerBloom = ({ flower }) => {
  const config = getFlowerConfig(flower.model)
  const isSSR = flower.rarity === 'ssr'

  return (
    <Canvas
      camera={{ position: [0, 0.08, 2.75], fov: 38 }}
      gl={{ alpha: true, antialias: true, localClippingEnabled: true }}
    >
      <FixedAspectCamera />
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 5, 4]} intensity={0.85} color="#ffffff" />
      <pointLight position={[-2, 2, 2]} intensity={0.3} color="#fff5ee" />
      <pointLight position={[0, -1, 2]} intensity={0.16} color="#e8f5e9" />
      <hemisphereLight args={['#f0f8ff', '#228b22', 0.3]} />

      {isSSR && (
        <>
          <pointLight position={[0, 1, 0.8]} intensity={0.42} color={flower.gradientColors?.[0] || '#ffd700'} />
          <spotLight position={[0, 2.5, 1.5]} angle={0.32} penumbra={0.5} intensity={0.55} color={flower.gradientColors?.[1] || '#ffa500'} />
        </>
      )}

      <CompleteFlower flower={flower} config={config} />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={flower3DConfigs[config.petalType] ? 0 : (isSSR ? 0.42 : 0.3)}
        maxPolarAngle={flower3DConfigs[config.petalType] ? Math.PI / 2 : Math.PI / 1.55}
        minPolarAngle={flower3DConfigs[config.petalType] ? Math.PI / 2 : Math.PI / 4.2}
        target={flower3DConfigs[config.petalType] ? [0, 0.4, 0] : [0, -0.1, 0]}
      />
    </Canvas>
  )
}

export default FlowerBloom
