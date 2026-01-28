/* eslint-disable react/no-unknown-property */
import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'
import { getFlowerConfig } from '../data/flowerConfigs'

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
  camellia: {
    curve: { main: 0.18, edge: 0.08, tip: 0.05 },
    arrange: { baseRadius: 0.09, radiusGrow: 0.04, tiltBase: 0.4, tiltDecay: 0.18, randomPos: 0.01, randomRot: 0.06 },
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
    case 'camellia': {
      // 山茶花：規則圓潤
      shape.moveTo(0, l * 0.03)
      shape.bezierCurveTo(-w * 0.5, l * 0.02, -w * 0.95, l * 0.25, -w * 0.92, l * 0.52)
      shape.bezierCurveTo(-w * 0.88, l * 0.78, -w * 0.52, l * 0.95, 0, l)
      shape.bezierCurveTo(w * 0.52, l * 0.95, w * 0.88, l * 0.78, w * 0.92, l * 0.52)
      shape.bezierCurveTo(w * 0.95, l * 0.25, w * 0.5, l * 0.02, 0, l * 0.03)
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

// ============ 單片玫瑰花瓣（橢圓形+尖端，杯狀曲面）============
const RoseCupPetal = ({ angle, layer, totalLayers, color, lightColor, dotSize }) => {
  const dots = useMemo(() => {
    const items = []

    // 層級參數
    const layerRatio = layer / (totalLayers - 1)

    // 花瓣尺寸
    const petalLength = 0.06 + layerRatio * 0.09   // 花瓣長度
    const petalWidth = 0.03 + layerRatio * 0.045   // 花瓣最寬處
    const baseRadius = 0.006 + layerRatio * 0.065  // 底部離中心距離（更靠近中心）

    // 傾斜角度：內層直立，外層也不要太開（最多 0.5）
    const tiltAngle = 0.08 + layerRatio * 0.42

    // 頂部內捲：全部都要往內捲，形成半橢圓形
    const topCurl = (1 - layerRatio) * 0.4 + 0.25

    const rows = 12  // 沿花瓣長度
    const cols = 9   // 沿花瓣寬度

    for (let r = 0; r < rows; r++) {
      const t = r / (rows - 1)  // 0=底部, 1=頂部（尖端）

      // ===== 橢圓形+尖端的寬度曲線 =====
      // 底部窄 → 中間最寬 → 頂部收成尖端
      let widthCurve
      if (t < 0.6) {
        // 底部到中間：橢圓形膨脹
        widthCurve = Math.sin((t / 0.6) * Math.PI * 0.5) * 1.0
      } else {
        // 中間到頂部：收成尖端
        const tipT = (t - 0.6) / 0.4
        widthCurve = Math.cos(tipT * Math.PI * 0.5) * 1.0
      }
      // 確保有最小寬度
      widthCurve = Math.max(widthCurve, 0.15)

      const actualWidth = petalWidth * widthCurve
      const actualCols = Math.max(2, Math.round(cols * widthCurve))

      for (let c = 0; c < actualCols; c++) {
        const s = actualCols > 1 ? (c / (actualCols - 1)) - 0.5 : 0  // -0.5 到 0.5

        // 花瓣局部座標
        const localLength = t * petalLength
        const localWidth = s * actualWidth * 2

        // 內凹曲面（杯狀）
        const cupDepth = (1 - Math.abs(s) * 1.8) * 0.012 * (0.5 + t)

        // 頂部內捲（往中心捲）
        const curlAmount = Math.pow(t, 3) * topCurl * petalLength

        // 傾斜變換
        const radiusOffset = baseRadius + Math.sin(tiltAngle) * localLength - curlAmount
        const heightOffset = Math.cos(tiltAngle) * localLength + cupDepth

        // 寬度方向的角度偏移
        const widthAngle = (localWidth / petalLength) * 0.8

        // 3D 座標
        const finalAngle = angle + widthAngle
        const x = Math.cos(finalAngle) * Math.max(0.005, radiusOffset)
        const z = Math.sin(finalAngle) * Math.max(0.005, radiusOffset)
        const y = heightOffset

        // 點大小：頂端（尖端）更小
        const tipFactor = t > 0.7 ? (1 - (t - 0.7) / 0.3 * 0.5) : 1
        const edgeFactor = 1 - Math.abs(s) * 0.25
        const size = dotSize * tipFactor * edgeFactor

        // 顏色
        const useLight = t > 0.45 || Math.abs(s) > 0.35

        items.push({ position: [x, y, z], size, useLight })
      }
    }

    return items
  }, [angle, layer, totalLayers, dotSize])

  return (
    <>
      {dots.map((dot, i) => (
        <mesh key={i} position={dot.position}>
          <sphereGeometry args={[dot.size, 8, 8]} />
          <meshStandardMaterial
            color={dot.useLight ? lightColor : color}
            roughness={0.3}
            metalness={0.05}
          />
        </mesh>
      ))}
    </>
  )
}

// ============ 玫瑰花（層層往上包覆）============
const RoseDotCluster = ({ color, isSSR = false, gradientColors }) => {
  const ref = useRef()
  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.getElapsedTime() * 0.05
  })

  // 顏色
  const colors = useMemo(() => {
    const base = new THREE.Color(color)
    const hsl = {}
    base.getHSL(hsl)
    return {
      deep: '#' + new THREE.Color().setHSL(hsl.h, hsl.s * 0.95, hsl.l * 0.35).getHexString(),
      dark: '#' + new THREE.Color().setHSL(hsl.h, hsl.s, hsl.l * 0.55).getHexString(),
      mid: color,
      light: '#' + new THREE.Color().setHSL(hsl.h, hsl.s * 0.85, Math.min(hsl.l * 1.2, 0.9)).getHexString(),
    }
  }, [color])

  // 花瓣配置：每層的花瓣數和起始角度
  const petals = useMemo(() => {
    const items = []
    const totalLayers = 6
    const petalsPerLayer = [3, 4, 5, 6, 7, 9]  // 內到外
    const goldenAngle = 137.5 * Math.PI / 180

    for (let layer = 0; layer < totalLayers; layer++) {
      const count = petalsPerLayer[layer]
      const layerOffset = layer * goldenAngle * 0.4  // 每層錯開

      // 顏色：內層深，外層淺
      const layerColor = layer < 2 ? colors.deep : layer < 4 ? colors.dark : colors.mid
      const layerLight = layer < 2 ? colors.dark : layer < 4 ? colors.mid : colors.light

      // 點的大小
      const dotSize = 0.005 + layer * 0.0015

      for (let p = 0; p < count; p++) {
        const angle = (p / count) * Math.PI * 2 + layerOffset
        items.push({
          angle,
          layer,
          totalLayers,
          color: layerColor,
          lightColor: layerLight,
          dotSize,
        })
      }
    }
    return items
  }, [colors])

  // 花苞底部填充（圓弧狀）
  const baseDots = useMemo(() => {
    const items = []
    const baseColor = colors.dark

    // 用半球形填充底部
    const rings = 6  // 環數
    const maxRadius = 0.07  // 最大半徑

    for (let ring = 0; ring < rings; ring++) {
      const ringRatio = ring / (rings - 1)
      const radius = maxRadius * ringRatio
      const y = -0.01 - (1 - Math.sqrt(1 - ringRatio * ringRatio)) * 0.04  // 圓弧形下沉

      const dotsInRing = Math.max(4, Math.round(8 + ring * 4))

      for (let d = 0; d < dotsInRing; d++) {
        const angle = (d / dotsInRing) * Math.PI * 2
        items.push({
          position: [Math.cos(angle) * radius, y, Math.sin(angle) * radius],
          size: 0.006 + ringRatio * 0.003,
          color: baseColor,
        })
      }
    }
    return items
  }, [colors])

  return (
    <group ref={ref} position={[0, 0, 0]}>
      {/* 花苞底部填充（圓弧） */}
      {baseDots.map((dot, i) => (
        <mesh key={`base-${i}`} position={dot.position}>
          <sphereGeometry args={[dot.size, 6, 6]} />
          <meshStandardMaterial color={dot.color} roughness={0.35} />
        </mesh>
      ))}

      {/* 花萼 */}
      <mesh position={[0, -0.05, 0]}>
        <coneGeometry args={[0.04, 0.04, 8]} />
        <meshStandardMaterial color="#2D5A20" roughness={0.6} />
      </mesh>

      {/* 花瓣 */}
      {petals.map((petal, i) => (
        <RoseCupPetal key={i} {...petal} />
      ))}

      {/* SSR 光暈 */}
      {isSSR && (
        <mesh position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.2, 32]} />
          <meshBasicMaterial color={gradientColors?.[1] || color} transparent opacity={0.12} side={THREE.DoubleSide} />
        </mesh>
      )}
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

// ============ 玫瑰葉子幾何體（鋸齒邊緣）============
const createRoseLeafletGeometry = (size = 0.12) => {
  const shape = new THREE.Shape()
  const l = size, w = size * 0.45

  // 玫瑰葉片：橢圓形帶鋸齒邊緣
  shape.moveTo(0, 0)
  // 左側帶鋸齒
  const segments = 6
  for (let i = 1; i <= segments; i++) {
    const t = i / segments
    const baseX = -Math.sin(t * Math.PI) * w
    const y = t * l
    const serration = (i % 2 === 0) ? 0.015 : -0.008
    shape.lineTo(baseX + serration, y)
  }
  // 頂端
  shape.quadraticCurveTo(0, l * 1.05, w * 0.15, l * 0.92)
  // 右側帶鋸齒
  for (let i = segments - 1; i >= 1; i--) {
    const t = i / segments
    const baseX = Math.sin(t * Math.PI) * w
    const y = t * l
    const serration = (i % 2 === 0) ? 0.015 : -0.008
    shape.lineTo(baseX + serration, y)
  }
  shape.lineTo(0, 0)

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.003,
    bevelEnabled: true,
    bevelThickness: 0.001,
    bevelSize: 0.001,
    bevelSegments: 1,
  })

  // 添加自然彎曲
  const positions = geometry.attributes.position
  for (let i = 0; i < positions.count; i++) {
    const y = positions.getY(i)
    const z = positions.getZ(i)
    const t = y / l
    positions.setZ(i, z + t * t * size * 0.15)
  }
  geometry.computeVertexNormals()
  return geometry
}

// ============ 玫瑰複葉（5片小葉）============
const RoseCompoundLeaf = ({ position, rotation, scale = 1, delay = 0 }) => {
  const ref = useRef()
  const leafletGeo = useMemo(() => createRoseLeafletGeometry(0.1), [])

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.z = rotation[2] + Math.sin(state.clock.getElapsedTime() * 0.5 + delay) * 0.03
    }
  })

  // 5片小葉的配置：頂端1片 + 兩側各2片
  const leaflets = useMemo(() => [
    // 頂端小葉（最大）
    { pos: [0, 0.12, 0], rot: [0.2, 0, 0], scale: 1.2 },
    // 第一對側葉
    { pos: [-0.045, 0.07, 0], rot: [0.25, 0.3, -0.2], scale: 0.9 },
    { pos: [0.045, 0.07, 0], rot: [0.25, -0.3, 0.2], scale: 0.9 },
    // 第二對側葉（較小）
    { pos: [-0.035, 0.03, 0], rot: [0.3, 0.4, -0.25], scale: 0.7 },
    { pos: [0.035, 0.03, 0], rot: [0.3, -0.4, 0.25], scale: 0.7 },
  ], [])

  return (
    <group ref={ref} position={position} rotation={rotation} scale={scale}>
      {/* 葉柄（中央莖）*/}
      <mesh position={[0, 0.06, 0.002]} rotation={[0.1, 0, 0]}>
        <cylinderGeometry args={[0.004, 0.003, 0.14, 6]} />
        <meshStandardMaterial color="#2D5A1E" roughness={0.6} />
      </mesh>
      {/* 小葉 */}
      {leaflets.map((leaflet, i) => (
        <mesh
          key={i}
          position={leaflet.pos}
          rotation={leaflet.rot}
          scale={leaflet.scale}
          geometry={leafletGeo}
        >
          <meshStandardMaterial color="#3A7D2E" roughness={0.45} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  )
}

// ============ 玫瑰細莖 ============
const RoseStem = () => {
  const geometry = useMemo(() => {
    const points = []
    const height = 1.6
    for (let i = 0; i <= 24; i++) {
      const t = i / 24
      // 非常輕微的自然彎曲
      const x = Math.sin(t * Math.PI * 0.3) * 0.02
      const z = Math.cos(t * Math.PI * 0.2) * 0.01
      points.push(new THREE.Vector3(x, 0.52 - height * t, z))
    }
    // 細莖：半徑 0.018
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 20, 0.018, 8, false)
  }, [])

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#3D6B35" roughness={0.55} />
    </mesh>
  )
}

// ============ 玫瑰莖上的葉子組（參考照片：兩組葉子，左右交錯）============
const RoseLeaves = () => (
  <group>
    {/* 上方葉子 - 向右伸出 */}
    <RoseCompoundLeaf
      position={[0.04, 0.05, 0.02]}
      rotation={[0.2, -1.2, 0.4]}
      scale={1.1}
      delay={0}
    />
    {/* 下方葉子 - 向左伸出 */}
    <RoseCompoundLeaf
      position={[-0.03, -0.45, -0.01]}
      rotation={[0.25, 1.3, -0.35]}
      scale={1.0}
      delay={0.6}
    />
  </group>
)

// ============ 3D 模型配置（只有向日葵使用 3D 模型）============
const flower3DConfigs = {
  sunflower: {
    mtl: '/models/sunflower/10455_Sunflower_v1_max2010_it2.mtl',
    obj: '/models/sunflower/10455_Sunflower_v1_max2010_it2.obj',
    scale: 0.019,
    position: [0, -2.0, 0],
    clipThreshold: 80,
    clipAxis: 'z',
    clipDirection: '>',
  },
}

// ============ 通用 3D 花朵模型 ============
const Flower3DModel = ({ modelType }) => {
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
      <group scale={config.scale} rotation={[-Math.PI / 2, 0, 0]} position={config.position}>
        <primitive object={clonedObj} />
      </group>
      {/* 補光 */}
      <pointLight position={[0, 0.8, 1.5]} intensity={1} color="#fffaf0" />
      <pointLight position={[0, 0.8, -1.5]} intensity={1} color="#fff8dc" />
      <pointLight position={[1.5, 0.6, 0]} intensity={0.8} color="#ffffff" />
      <pointLight position={[-1.5, 0.6, 0]} intensity={0.8} color="#ffffff" />
      <pointLight position={[0.8, -0.3, 0.8]} intensity={0.6} color="#fffef5" />
      <pointLight position={[-0.8, -0.3, 0.8]} intensity={0.6} color="#fffef5" />
    </group>
  )
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

  // 玫瑰使用小圓點匯集成立體花
  if (petalType === 'rose') {
    return (
      <group>
        {/* 花朵（放大 1.8 倍）*/}
        <group position={[0, 0.55, 0]} scale={1.8}>
          <RoseDotCluster color={flower.color} isSSR={isSSR} gradientColors={flower.gradientColors} />
        </group>
        {/* 細莖（連接花萼）*/}
        <RoseStem />
        {/* 玫瑰葉子（參考照片位置）*/}
        <RoseLeaves />
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
    <Canvas camera={{ position: [0, 0.08, 2.75], fov: 38 }} gl={{ alpha: true, antialias: true, localClippingEnabled: true }}>
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
