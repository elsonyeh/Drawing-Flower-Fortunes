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
}

// 更新進度條
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

// 預載入第一個模型（有 3 秒超時）
//
// 解決雙重下載問題的關鍵流程：
//   1. fetch() 下載 GLB 並追蹤進度（顯示進度條）
//   2. 將檔案內容存入 THREE.Cache（相對 + 絕對路徑都存）
//   3. useGLTF.preload() 從 THREE.Cache 讀取並 parse → 存入 drei 的 useGLTF cache
//   4. 用戶有 5-6 秒的抽卡動畫時間，parse 必定完成，result 頁不會出現 skeleton
const preloadFirstModel = async () => {
  const queue = initDrawQueue()
  const firstFlower = queue[0]
  const path = MODEL_PATHS[firstFlower?.model]

  if (!path) return

  try {
    // Step 1: fetch 下載並追蹤 byte-level 進度
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
      if (total > 0) updateLoadingProgress((loaded / total) * 100)
    }

    // Step 2: 合併 chunks 並存入 THREE.Cache
    // 同時存相對路徑和絕對路徑，確保 THREE.FileLoader 無論用哪種 key 都能命中
    const buf = new Uint8Array(loaded)
    let offset = 0
    for (const chunk of chunks) { buf.set(chunk, offset); offset += chunk.byteLength }
    const absoluteUrl = new URL(path, window.location.href).href
    THREE.Cache.add(path, buf.buffer)
    THREE.Cache.add(absoluteUrl, buf.buffer)

  } catch {
    // 網路錯誤時 fallback，讓 useGLTF 自行下載
  }

  // Step 3: 觸發 drei 的 preload，從 THREE.Cache 讀取並 parse（背景執行）
  useGLTF.preload(path, true)
}

// 渲染 React
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// 最多等 3 秒，或第一個模型下載完成後顯示
Promise.race([
  preloadFirstModel(),
  new Promise(resolve => setTimeout(resolve, 3000))
]).then(hideLoadingScreen)
