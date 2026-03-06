import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { initDrawQueue } from './utils/fortuneHelper'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

// 啟用 THREE.js 全域 cache，讓 fetch() 下載的資料可以被 useGLTF 共用
THREE.Cache.enabled = true

// 模型路徑對照表
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
  magnolia: '/models/magnolia/magnolia.glb',
}

// 更新進度條（0-100）
const updateLoadingProgress = (percent) => {
  const bar = document.getElementById('loading-bar')
  const text = document.getElementById('loading-percent')
  const p = Math.round(Math.min(100, Math.max(0, percent)))
  if (bar) bar.style.width = `${p}%`
  if (text) text.textContent = `${p}%`
}

// 隱藏載入畫面
const hideLoadingScreen = () => {
  updateLoadingProgress(100)
  const loadingScreen = document.getElementById('loading-screen')
  if (loadingScreen) {
    setTimeout(() => {
      loadingScreen.classList.add('hidden')
      setTimeout(() => loadingScreen.remove(), 500)
    }, 200)
  }
}

// 預載入第一個模型，完整流程：
//   1. 用 fetch() 下載 GLB，逐 chunk 更新進度條（0% → 90%）
//   2. 將完整 bytes 存入 THREE.Cache（相對 + 絕對路徑都存）
//   3. 呼叫 useGLTF.preload()：從 THREE.Cache 讀取檔案（0 延遲）→ parse GLB → 存入 suspend-react cache
//      同時 DRACOLoader 也會從 CDN 下載 WASM decoder（首次訪問需額外時間）
//   4. 監聽 THREE.DefaultLoadingManager.onLoad，等待 parse + Draco decoder 全部完成
//   5. 進度推到 100%，loading screen 才隱藏
//   → 保證 FlowerGLBModel 呼叫 useGLTF() 時 suspend-react cache 已有結果，不顯示 skeleton
const preloadFirstModel = async () => {
  const queue = initDrawQueue()
  const firstFlower = queue[0]
  const path = MODEL_PATHS[firstFlower?.model]
  if (!path) return

  // ── Step 1: 在觸發 preload 之前先安裝 onLoad 監聽器 ──
  // DefaultLoadingManager.onLoad 在所有 managed 資源（模型 + Draco WASM）完成時觸發
  const parseComplete = new Promise((resolve) => {
    const mgr = THREE.DefaultLoadingManager
    const prevOnLoad = mgr.onLoad

    mgr.onLoad = () => {
      mgr.onLoad = prevOnLoad  // 還原，避免影響後續載入
      resolve()
    }

    // 安全網：若 onLoad 6 秒內未觸發（例如 Draco CDN 很慢），直接繼續
    setTimeout(resolve, 6000)
  })

  // ── Step 2: fetch() 下載 GLB，追蹤 byte-level 進度（0% → 90%） ──
  try {
    const res = await fetch(path)
    const total = Number(res.headers.get('content-length') || 0)
    const chunks = []
    let loaded = 0

    const reader = res.body.getReader()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      loaded += value.byteLength
      // 保留 90-100% 給 parse 階段，讓進度條看起來還在跑
      if (total > 0) updateLoadingProgress((loaded / total) * 90)
    }

    // 合併並存入 THREE.Cache
    const buf = new Uint8Array(loaded)
    let offset = 0
    for (const chunk of chunks) { buf.set(chunk, offset); offset += chunk.byteLength }
    THREE.Cache.add(path, buf.buffer)
    THREE.Cache.add(new URL(path, window.location.href).href, buf.buffer)

    // 進入 parse 階段，顯示 93%
    updateLoadingProgress(93)
  } catch {
    // 網路失敗：讓 useGLTF 自行下載（會有 skeleton，但不 block）
    updateLoadingProgress(90)
  }

  // ── Step 3: 觸發 drei 的 preload ──
  // 讀 THREE.Cache（幾乎瞬間）→ parse → 存入 useGLTF / suspend-react cache
  // DefaultLoadingManager 同時追蹤 Draco WASM 的下載
  useGLTF.preload(path, true)

  // ── Step 4: 等待 parse 完整完成（含 Draco decoder） ──
  await parseComplete
}

// 渲染 React
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// 最多等 10 秒（從 3 秒延長：確保大模型 + Draco 下載都有足夠時間）
// 正常情況下：fetch 完成 + parse 完成後會提早退出
Promise.race([
  preloadFirstModel(),
  new Promise(resolve => setTimeout(resolve, 10000))
]).then(hideLoadingScreen)
