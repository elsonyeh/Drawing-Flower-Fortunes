import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import LandingPage from './components/LandingPage'
import GachaAnimation from './components/GachaAnimation'
import FortuneResult from './components/FortuneResult'
import CollectionPage from './components/CollectionPage'
import AdminPage from './components/AdminPage'
import EmotionScanPage from './components/EmotionScanPage'
import { getRandomFlower, saveCollectedFlower } from './utils/fortuneHelper'

// 引入 FlowerBloom 觸發背景預載入其他模型
import './components/FlowerBloom'

function App() {
  const [stage, setStage] = useState('landing') // 'landing', 'gacha', 'result', 'collection', 'admin', 'emotionScan'

  // Check for admin route on mount
  useEffect(() => {
    if (window.location.pathname === '/elsontest') {
      setStage('admin')
    }
  }, [])
  const [selectedFlower, setSelectedFlower] = useState(null)
  const [viewingFlower, setViewingFlower] = useState(null) // For viewing from collection
  const [emotionData, setEmotionData] = useState(null)     // 情緒解籤模式的情緒資料

  const handlePetalSelect = () => {
    // 花瓣選擇後，生成花卉並進入抽卡動畫
    const flower = getRandomFlower()
    setSelectedFlower(flower)
    setEmotionData(null)
    setStage('gacha')

    // Save to collection
    saveCollectedFlower(flower)
  }

  const handleEmotionScan = () => {
    setStage('emotionScan')
  }

  // 情緒掃描完成：flower 由 emotionMapper 決定，emotion 為情緒資料
  const handleEmotionComplete = (flower, emotion) => {
    setSelectedFlower(flower)
    setEmotionData(emotion)
    saveCollectedFlower(flower)
    setStage('gacha')
  }

  const handleGachaComplete = () => {
    setStage('result')
  }

  const handleReset = () => {
    // If viewing from collection, go back to collection
    if (viewingFlower) {
      setStage('collection')
      setViewingFlower(null)
    } else {
      // Otherwise go to landing
      setStage('landing')
      setSelectedFlower(null)
      setEmotionData(null)
    }
  }

  const handleOpenCollection = () => {
    setStage('collection')
  }

  const handleCloseCollection = () => {
    setStage('landing')
  }

  const handleSelectFlowerFromCollection = (flower) => {
    setViewingFlower(flower)
    setStage('result')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-night-900 via-night-800 to-night-700 text-white">
      <AnimatePresence mode="wait">
        {stage === 'landing' && (
          <LandingPage
            key="landing"
            onPetalSelect={handlePetalSelect}
            onOpenCollection={handleOpenCollection}
            onEmotionScan={handleEmotionScan}
          />
        )}

        {stage === 'emotionScan' && (
          <EmotionScanPage
            key="emotionScan"
            onComplete={handleEmotionComplete}
            onBack={() => setStage('landing')}
          />
        )}

        {stage === 'gacha' && (
          <GachaAnimation
            key="gacha"
            flower={selectedFlower}
            onComplete={handleGachaComplete}
          />
        )}

        {stage === 'result' && (
          <FortuneResult
            key="result"
            flower={viewingFlower || selectedFlower}
            onReset={handleReset}
            isFromCollection={!!viewingFlower}
            emotionData={emotionData}
          />
        )}

        {stage === 'collection' && (
          <CollectionPage
            key="collection"
            onClose={handleCloseCollection}
            onSelectFlower={handleSelectFlowerFromCollection}
          />
        )}

        {stage === 'admin' && (
          <AdminPage
            key="admin"
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
