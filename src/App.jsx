import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import LandingPage from './components/LandingPage'
import GachaAnimation from './components/GachaAnimation'
import FortuneResult from './components/FortuneResult'
import CollectionPage from './components/CollectionPage'
import AdminPage from './components/AdminPage'
import EmotionScanPage from './components/EmotionScanPage'
import AuthModal from './components/AuthModal'
import { getRandomFlower, saveCollectedFlower } from './utils/fortuneHelper'
import { useAuth } from './hooks/useAuth'
import { saveFlowerToCloud, syncLocalToCloud, loadCloudToLocal, ensureProfile, linkLineToProfile } from './utils/collectionSync'

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
  const [showAuthModal, setShowAuthModal] = useState(false)

  const { user } = useAuth()

  // 登入後：同步本地資料到雲端，並載入雲端資料合併
  useEffect(() => {
    if (user) {
      ensureProfile(user).then(async () => {
        // 偵測「LINE 用戶連結 Google」完成
        // 改用 localStorage（sessionStorage 在 OAuth 跨 origin 跳轉後可能被清空）
        const linkForUserId = localStorage.getItem('pending_link_user_id')
        const linkLineUserId = localStorage.getItem('pending_link_line_user_id')
        const linkTs = parseInt(localStorage.getItem('pending_link_ts') || '0')
        const isExpired = Date.now() - linkTs > 10 * 60 * 1000

        console.log('[App] pending_link_user_id:', linkForUserId)
        console.log('[App] pending_link_line_user_id:', linkLineUserId)
        console.log('[App] current user.id:', user.id)
        console.log('[App] isExpired:', isExpired, 'age(s):', Math.round((Date.now() - linkTs) / 1000))

        if (linkForUserId && linkLineUserId && !isExpired && user.id !== linkForUserId) {
          console.log('[App] 執行 linkLineToProfile')
          localStorage.removeItem('pending_link_user_id')
          localStorage.removeItem('pending_link_line_user_id')
          localStorage.removeItem('pending_link_ts')
          await linkLineToProfile(user.id, linkLineUserId)
        } else if (linkForUserId) {
          console.log('[App] linkLineToProfile 未執行，原因：',
            !linkLineUserId ? 'lineUserId 空' :
            isExpired ? '已過期' :
            user.id === linkForUserId ? 'user ID 相同' : '未知'
          )
        }
        syncLocalToCloud(user.id).then(() => loadCloudToLocal(user.id))
      })
    }
  }, [user])

  const handlePetalSelect = () => {
    // 花瓣選擇後，生成花卉並進入抽卡動畫
    const flower = getRandomFlower()
    setSelectedFlower(flower)
    setEmotionData(null)
    setStage('gacha')

    // Save to localStorage (always)
    saveCollectedFlower(flower)
    // Save to cloud (if logged in)
    if (user) saveFlowerToCloud(user.id, flower)
  }

  const handleEmotionScan = () => {
    setStage('emotionScan')
  }

  // 面相解讀完成：flower 由 faceReader 決定，data 包含 archetype 等面相資料
  const handleEmotionComplete = (flower, data) => {
    setSelectedFlower(flower)
    setEmotionData(data)
    saveCollectedFlower(flower)
    if (user) saveFlowerToCloud(user.id, flower)
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
            onOpenAuth={() => setShowAuthModal(true)}
            user={user}
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

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  )
}

export default App
