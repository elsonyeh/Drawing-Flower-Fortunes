import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import LandingPage from './components/LandingPage'
import PetalSelection from './components/PetalSelection'
import GachaAnimation from './components/GachaAnimation'
import FortuneResult from './components/FortuneResult'
import CollectionPage from './components/CollectionPage'
import { getRandomFlower, saveCollectedFlower } from './utils/fortuneHelper'

function App() {
  const [stage, setStage] = useState('landing') // 'landing', 'petalSelection', 'gacha', 'result', 'collection'
  const [selectedFlower, setSelectedFlower] = useState(null)
  const [viewingFlower, setViewingFlower] = useState(null) // For viewing from collection

  const handleDraw = () => {
    // 先進入花瓣選擇界面
    setStage('petalSelection')
  }

  const handlePetalSelect = () => {
    // 選擇花瓣後，生成花卉並進入抽卡動畫
    const flower = getRandomFlower()
    setSelectedFlower(flower)
    setStage('gacha')

    // Save to collection
    saveCollectedFlower(flower)
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
            onDraw={handleDraw}
            onOpenCollection={handleOpenCollection}
          />
        )}

        {stage === 'petalSelection' && (
          <PetalSelection
            key="petalSelection"
            onSelect={handlePetalSelect}
          />
        )}

        {stage === 'gacha' && (
          <GachaAnimation
            key="gacha"
            flower={selectedFlower}
            onComplete={handleGachaComplete}
            onOpenCollection={handleOpenCollection}
          />
        )}

        {stage === 'result' && (
          <FortuneResult
            key="result"
            flower={viewingFlower || selectedFlower}
            onReset={handleReset}
            isFromCollection={!!viewingFlower}
          />
        )}

        {stage === 'collection' && (
          <CollectionPage
            key="collection"
            onClose={handleCloseCollection}
            onSelectFlower={handleSelectFlowerFromCollection}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
