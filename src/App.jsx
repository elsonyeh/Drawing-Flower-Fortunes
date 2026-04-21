import { useState, useEffect, lazy, Suspense } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import LandingPage from './components/LandingPage'
import LoadingScreen from './components/LoadingScreen'
import GachaAnimation from './components/GachaAnimation'
import FortuneResult from './components/FortuneResult'
const CollectionPage = lazy(() => import('./components/CollectionPage'))
const AdminPage = lazy(() => import('./components/AdminPage'))
const EmotionScanPage = lazy(() => import('./components/EmotionScanPage'))
const ExhibitionScanPage = lazy(() => import('./components/ExhibitionScanPage'))
const QRScanPage = lazy(() => import('./components/QRScanPage'))
const AuthModal = lazy(() => import('./components/AuthModal'))
import { getRandomFlower, saveCollectedFlower, getRandomFlowerForExhibition } from './utils/fortuneHelper'
import { isExhibitionMode, getUnlockedPools, initAppMode, enterExhibitionMode } from './utils/exhibitionHelper'
import { fetchGlobalMode, subscribeGlobalMode } from './utils/exhibitionSync'
import { useAuth } from './hooks/useAuth'
import { saveFlowerToCloud, syncLocalToCloud, loadCloudToLocal, ensureProfile, linkLineToProfile } from './utils/collectionSync'

// 引入 FlowerBloom 觸發背景預載入其他模型
import './components/FlowerBloom'

function App() {
  const [stage, setStage] = useState('landing') // 'landing', 'gacha', 'result', 'collection', 'admin', 'emotionScan', 'exhibitionScan', 'qrScan'
  const [scanParams, setScanParams] = useState(null) // { zone, workId, workName }

  // 全域模式管理：fetch 初始值 + 訂閱 Realtime 即時更新
  useEffect(() => {
    const applyMode = async (mode) => {
      await initAppMode(mode)
    }

    fetchGlobalMode().then(applyMode)

    const unsubscribe = subscribeGlobalMode(applyMode)
    return unsubscribe
  }, [])

  // Check for QR scan params or admin route on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const zone = params.get('zone')
    const work = params.get('work')
    const name = params.get('name')

    if (zone && work) {
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname)
      setScanParams({ zone, workId: work, workName: name ? decodeURIComponent(name) : work })
      setStage('exhibitionScan')
    } else if (window.location.pathname === '/elsontest') {
      setStage('admin')
    }
  }, [])
  const [selectedFlower, setSelectedFlower] = useState(null)
  const [viewingFlower, setViewingFlower] = useState(null) // For viewing from collection
  const [emotionData, setEmotionData] = useState(null)     // 情緒解籤模式的情緒資料
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [gachaSkipFlowerPick, setGachaSkipFlowerPick] = useState(false)
  const [gachaTransitionFlash, setGachaTransitionFlash] = useState(false)

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

        if (linkForUserId && linkLineUserId && !isExpired && user.id !== linkForUserId) {
          localStorage.removeItem('pending_link_user_id')
          localStorage.removeItem('pending_link_line_user_id')
          localStorage.removeItem('pending_link_ts')
          await linkLineToProfile(user.id, linkLineUserId)
        }
        syncLocalToCloud(user.id).then(() => loadCloudToLocal(user.id))
      })
    }
  }, [user])

  const handlePetalSelect = () => {
    // 花瓣選擇後，生成花卉並進入抽卡動畫（首頁已選過花，跳過抽卡內的選花環節）
    const exMode = isExhibitionMode()
    const pools = exMode ? getUnlockedPools() : null
    const flower = exMode ? getRandomFlowerForExhibition(pools) : getRandomFlower()

    setSelectedFlower(flower)
    setEmotionData(null)
    setGachaSkipFlowerPick(false)  // 主頁改為與 QR 掃描相同體驗：進入 GachaAnimation 選花環節
    // 啟動白光橋接層，覆蓋 LandingPage 消失到 GachaAnimation 出現的黑幀
    setGachaTransitionFlash(true)
    setStage('gacha')

    // Save to localStorage (always)
    saveCollectedFlower(flower)
    // Save to cloud (if logged in)
    if (user) saveFlowerToCloud(user.id, flower)
  }

  const handleExhibitionDraw = () => {
    const pools = getUnlockedPools()
    const flower = getRandomFlowerForExhibition(pools)
    setSelectedFlower(flower)
    setEmotionData(null)
    saveCollectedFlower(flower)
    if (user) saveFlowerToCloud(user.id, flower)
    setScanParams(null)
    setGachaSkipFlowerPick(false) // 展覽模式需要選花環節
    setStage('gacha')
  }

  const handleQRScanSuccess = ({ zone, workId, workName }) => {
    // 若尚未進入展覽模式，掃碼即自動初始化（確保掃碼永遠可用）
    if (!isExhibitionMode()) {
      enterExhibitionMode()
    }

    // 顯示作品資訊頁（ExhibitionScanPage 會記錄拜訪並讓用戶點擊抽卡）
    setScanParams({ zone, workId, workName })
    setStage('exhibitionScan')
  }

  const handleEmotionScan = () => {
    setStage('emotionScan')
  }

  // 面相解讀完成：flower 由 faceReader 決定，data 包含 archetype 等面相資料
  const handleEmotionComplete = (flower, data) => {
    setSelectedFlower(flower)
    setEmotionData(data)
    // 相由花緣的結果不記錄到圖鑑，僅供當次欣賞
    setGachaSkipFlowerPick(true)
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
    <div className="min-h-screen text-white relative">
      {/* ── 主視覺背景：重現背景.png 的藍灰天空 + 中央暖光 + 底部珊瑚地面 ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          background: [
            /* 頂部藍灰天光（呼應主視覺霧藍天空） */
            'radial-gradient(ellipse 110% 55% at 50% -5%, rgba(91,123,168,0.30) 0%, rgba(80,110,158,0.10) 55%, transparent 72%)',
            /* 中央暖白光暈（月光感） */
            'radial-gradient(ellipse 90% 55% at 48% 28%, rgba(242,210,190,0.38) 0%, rgba(242,180,150,0.14) 45%, transparent 65%)',
            /* 底部珊瑚地面（加飽和，貼近主視覺橘珊瑚底色） */
            'radial-gradient(ellipse 180% 65% at 50% 112%, rgba(224,88,72,0.62) 0%, rgba(242,126,147,0.42) 32%, rgba(242,164,136,0.16) 55%, transparent 70%)',
            /* 天空基底：提亮一階，帶藍灰紫（呼應主視覺天空色） */
            'linear-gradient(175deg, #0e1428 0%, #1a2645 52%, #131e38 100%)',
          ].join(', '),
        }}
      />
      {/* 穀物紋理層（還原主視覺的噪點質感） */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          opacity: 0.09,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.78' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='250' height='250' filter='url(%23g)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '250px 250px',
        }}
      />
      <div className="relative" style={{ zIndex: 1 }}>
      <Suspense fallback={<LoadingScreen />}>
      <AnimatePresence mode="wait">
        {stage === 'qrScan' && (
          <QRScanPage
            key="qrScan"
            onScanSuccess={handleQRScanSuccess}
            onBack={() => setStage('landing')}
          />
        )}

        {stage === 'exhibitionScan' && scanParams && (
          <ExhibitionScanPage
            key="exhibitionScan"
            zone={scanParams.zone}
            workId={scanParams.workId}
            workName={scanParams.workName}
            onDraw={handleExhibitionDraw}
            onBack={() => { setScanParams(null); setStage('landing') }}
          />
        )}

        {stage === 'landing' && (
          <LandingPage
            key="landing"
            onPetalSelect={handlePetalSelect}
            onOpenCollection={handleOpenCollection}
            onEmotionScan={handleEmotionScan}
            onOpenAuth={() => setShowAuthModal(true)}
            onQRScan={() => setStage('qrScan')}
            user={user}
            exhibitionMode={isExhibitionMode()}
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
            skipFlowerPick={gachaSkipFlowerPick}
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
      </Suspense>

      <Suspense fallback={null}>
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </Suspense>
      </div>

      {/* 換場白光橋接層：覆蓋 LandingPage 瞬間消失到 GachaAnimation 白光接手之間的黑幀 */}
      {gachaTransitionFlash && (
        <motion.div
          style={{ position: 'fixed', inset: 0, background: 'white', zIndex: 500, pointerEvents: 'none' }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          onAnimationComplete={() => setGachaTransitionFlash(false)}
        />
      )}
    </div>
  )
}

export default App
