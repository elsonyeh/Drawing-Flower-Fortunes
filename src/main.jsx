import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { initDrawQueue } from './utils/fortuneHelper'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'

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

// 隱藏載入畫面
const hideLoadingScreen = () => {
  const loadingScreen = document.getElementById('loading-screen')
  if (loadingScreen) {
    loadingScreen.classList.add('hidden')
    setTimeout(() => {
      loadingScreen.remove()
    }, 500)
  }
}

// 預載入單個模型
const preloadModel = (path) => {
  return new Promise((resolve) => {
    const loader = new GLTFLoader()
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')
    loader.setDRACOLoader(dracoLoader)

    loader.load(
      path,
      () => resolve(true),
      undefined,
      () => resolve(false) // 載入失敗也繼續
    )
  })
}

// 預載入前兩個模型後才顯示網站
const preloadFirstModels = async () => {
  const queue = initDrawQueue()
  const modelsToLoad = []
  const loadedPaths = new Set()

  // 取得前兩個不重複的模型
  for (const flower of queue) {
    const path = MODEL_PATHS[flower.model]
    if (path && !loadedPaths.has(path)) {
      modelsToLoad.push(path)
      loadedPaths.add(path)
      if (modelsToLoad.length >= 2) break
    }
  }

  // 同時載入這兩個模型
  await Promise.all(modelsToLoad.map(preloadModel))

  // 載入完成後隱藏載入畫面
  hideLoadingScreen()
}

// 先渲染 React
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// 等前兩個模型載入完成後隱藏載入畫面
preloadFirstModels()
