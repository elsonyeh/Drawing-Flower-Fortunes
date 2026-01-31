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

// 預載入第一個模型（有 3 秒超時）
const preloadFirstModel = () => {
  return new Promise((resolve) => {
    const queue = initDrawQueue()
    const firstFlower = queue[0]
    const path = MODEL_PATHS[firstFlower?.model]

    if (!path) {
      resolve()
      return
    }

    const loader = new GLTFLoader()
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')
    loader.setDRACOLoader(dracoLoader)

    loader.load(path, () => resolve(), undefined, () => resolve())
  })
}

// 渲染 React
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// 最多等 3 秒，或模型載入完成後顯示
Promise.race([
  preloadFirstModel(),
  new Promise(resolve => setTimeout(resolve, 3000))
]).then(hideLoadingScreen)
