import { useState } from 'react'
import { motion } from 'framer-motion'
import { unlockAllFlowers, clearAllFlowers, getCollectionStats } from '../utils/fortuneHelper'

function AdminPage() {
  const [stats, setStats] = useState(getCollectionStats())
  const [message, setMessage] = useState('')

  const handleUnlockAll = () => {
    unlockAllFlowers()
    setStats(getCollectionStats())
    setMessage('All flowers unlocked!')
    setTimeout(() => setMessage(''), 2000)
  }

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all collected flowers?')) {
      clearAllFlowers()
      setStats(getCollectionStats())
      setMessage('Collection cleared!')
      setTimeout(() => setMessage(''), 2000)
    }
  }

  const handleGoToMain = () => {
    window.location.href = '/'
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-b from-night-900 via-night-800 to-night-700 text-white p-6"
    >
      <div className="max-w-md mx-auto pt-10">
        <h1 className="text-2xl font-bold text-center mb-2">Admin Panel</h1>
        <p className="text-gray-400 text-center text-sm mb-8">elsontest</p>

        {/* Stats */}
        <div className="bg-white/10 rounded-xl p-4 mb-6">
          <h2 className="text-lg font-semibold mb-3">Collection Stats</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Total:</span>
              <span className="ml-2">{stats.total} / {stats.totalCards}</span>
            </div>
            <div>
              <span className="text-gray-400">Progress:</span>
              <span className="ml-2">{stats.percentage}%</span>
            </div>
            <div>
              <span className="text-gray-400">SSR:</span>
              <span className="ml-2 text-yellow-400">{stats.ssr} / {stats.totalSSR}</span>
            </div>
            <div>
              <span className="text-gray-400">Common:</span>
              <span className="ml-2">{stats.common} / {stats.totalCommon}</span>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-500/20 text-green-300 rounded-lg p-3 text-center mb-4"
          >
            {message}
          </motion.div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleUnlockAll}
            className="w-full py-3 px-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all"
          >
            Unlock All Flowers
          </button>

          <button
            onClick={handleClearAll}
            className="w-full py-3 px-4 bg-red-500/20 border border-red-500/50 rounded-xl font-semibold text-red-300 hover:bg-red-500/30 transition-all"
          >
            Clear Collection
          </button>

          <button
            onClick={handleGoToMain}
            className="w-full py-3 px-4 bg-white/10 rounded-xl font-semibold text-white hover:bg-white/20 transition-all"
          >
            Go to Main Page
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default AdminPage
