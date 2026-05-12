import flowersData from '../data/flowers.json'

// ============ 預抽籤佇列系統 ============
// 預先產生抽籤順序，讓模型可以按順序載入
const QUEUE_SIZE = 10 // 預先產生 10 個抽籤結果
let drawQueue = []

/**
 * 產生一個隨機花朵（內部用）
 */
const generateRandomFlower = () => {
  const random = Math.random() * 100
  const ssrCards = flowersData.filter(f => f.rarity === 'ssr')
  const commonCards = flowersData.filter(f => f.rarity === 'common')

  // SSR: 5% 總機率 (5張各1%)
  if (random < 5) {
    const ssrIndex = Math.floor(random)
    return ssrCards[ssrIndex]
  }

  // Common: 90% 機率
  const randomIndex = Math.floor(Math.random() * commonCards.length)
  return commonCards[randomIndex]
}

/**
 * 初始化抽籤佇列
 * 在 App 載入時呼叫，預先決定接下來要抽到的花
 */
export const initDrawQueue = () => {
  drawQueue = []
  for (let i = 0; i < QUEUE_SIZE; i++) {
    drawQueue.push(generateRandomFlower())
  }
  return drawQueue
}

/**
 * 取得預抽籤佇列（用於預載入模型）
 * @returns {Array} 預先產生的花朵陣列
 */
export const getDrawQueue = () => {
  if (drawQueue.length === 0) {
    initDrawQueue()
  }
  return [...drawQueue]
}

/**
 * Get a random flower with gacha probability
 * 從預抽籤佇列取出下一個花朵，並補充佇列
 * @returns {Object} Random flower object
 */
export const getRandomFlower = () => {
  // 確保佇列有內容
  if (drawQueue.length === 0) {
    initDrawQueue()
  }

  // 從佇列取出第一個
  const flower = drawQueue.shift()

  // 補充一個新的到佇列尾端
  drawQueue.push(generateRandomFlower())

  return flower
}

/**
 * Exhibition mode: draw from unlocked zone pools
 * @param {string[]} unlockedPools - array of unlocked zones e.g. ['A', 'B']
 * @returns {Object} Random flower from unlocked pools
 */
export const getRandomFlowerForExhibition = (unlockedPools) => {
  const eligible = flowersData.filter(f => f.exhibitionZone && unlockedPools.includes(f.exhibitionZone))
  if (eligible.length === 0) return getRandomFlower()

  const ssrCards = eligible.filter(f => f.rarity === 'ssr')
  const commonCards = eligible.filter(f => f.rarity === 'common')

  const random = Math.random() * 100
  // SSR: ~1% per SSR card in pool
  if (ssrCards.length > 0 && random < ssrCards.length) {
    return ssrCards[Math.floor(random)]
  }
  return commonCards[Math.floor(Math.random() * commonCards.length)]
}

/**
 * Get flower by ID
 * @param {number} id - Flower ID
 * @returns {Object|null} Flower object or null if not found
 */
export const getFlowerById = (id) => {
  return flowersData.find(flower => flower.id === id) || null
}

/**
 * Get all flowers
 * @returns {Array} Array of all flower objects
 */
export const getAllFlowers = () => {
  return flowersData
}

/**
 * Get all SSR flowers
 * @returns {Array} Array of SSR flower objects
 */
export const getSSRFlowers = () => {
  return flowersData.filter(f => f.rarity === 'ssr')
}

/**
 * Get all common flowers
 * @returns {Array} Array of common flower objects
 */
export const getCommonFlowers = () => {
  return flowersData.filter(f => f.rarity === 'common')
}

/**
 * Normalize a stored entry to { collectedAt, source }
 * 相容舊格式（純 ISO string）→ source 預設 'normal'
 */
const normalizeEntry = (val, defaultSource = 'normal') =>
  typeof val === 'string' ? { collectedAt: val, source: defaultSource } : val

/**
 * Save collected flower to localStorage
 * @param {Object} flower - Flower object to save
 * @param {'normal'|'exhibition'} source - Where the flower was drawn
 */
export const saveCollectedFlower = (flower, source = 'normal') => {
  const map = getCollectedMap()
  if (!(flower.id in map)) {
    map[flower.id] = { collectedAt: new Date().toISOString(), source }
    localStorage.setItem('collectedFlowers', JSON.stringify(map))
  }
}

/**
 * Get raw collected map from localStorage: { [flowerId]: { collectedAt, source } }
 */
export const getCollectedMap = () => {
  const stored = localStorage.getItem('collectedFlowers')
  if (!stored) return {}
  const parsed = JSON.parse(stored)
  // 相容舊格式（陣列）
  if (Array.isArray(parsed)) {
    const map = {}
    parsed.forEach(f => { map[f.id] = { collectedAt: f.collectedAt || new Date().toISOString(), source: 'normal' } })
    localStorage.setItem('collectedFlowers', JSON.stringify(map))
    return map
  }
  // 相容舊格式（value 為純 ISO string）
  const normalized = {}
  Object.entries(parsed).forEach(([id, val]) => { normalized[id] = normalizeEntry(val) })
  return normalized
}

/**
 * Get all collected flowers from localStorage
 * @param {string|null} source - 若指定，只回傳該 source 的花；null = 全部
 * @returns {Array} Array of {id, collectedAt, source}
 */
export const getCollectedFlowers = (source = null) => {
  const map = getCollectedMap()
  return Object.entries(map)
    .filter(([, entry]) => !source || entry.source === source)
    .map(([id, entry]) => ({ id: Number(id), collectedAt: entry.collectedAt, source: entry.source }))
}

/**
 * Check if a flower is collected
 * @param {number} flowerId - Flower ID to check
 * @param {string|null} source - 若指定，需 source 相符才算 collected
 * @returns {boolean}
 */
export const isFlowerCollected = (flowerId, source = null) => {
  const map = getCollectedMap()
  if (!(flowerId in map)) return false
  if (!source) return true
  return map[flowerId].source === source
}

/**
 * Get collection statistics
 * @param {string|null} source - 若指定，只統計該 source；null = 全部
 * @returns {Object} Collection stats
 */
export const getCollectionStats = (source = null) => {
  const map = getCollectedMap()
  const ids = Object.entries(map)
    .filter(([, entry]) => !source || entry.source === source)
    .map(([id]) => Number(id))
  const total = flowersData.length
  const ssrCollected = ids.filter(id => id > 100).length
  const commonCollected = ids.filter(id => id <= 100).length

  return {
    total: ids.length,
    totalCards: total,
    ssr: ssrCollected,
    totalSSR: 5,
    common: commonCollected,
    totalCommon: 15,
    percentage: Math.round((ids.length / total) * 100)
  }
}

/**
 * Mark a flower as viewed in collection
 * @param {number} flowerId - Flower ID to mark as viewed
 */
export const markFlowerAsViewed = (flowerId) => {
  const viewed = getViewedFlowers()
  if (!viewed.includes(flowerId)) {
    viewed.push(flowerId)
    localStorage.setItem('viewedFlowers', JSON.stringify(viewed))
  }
}

/**
 * Get all viewed flowers from localStorage
 * @returns {Array} Array of viewed flower IDs
 */
export const getViewedFlowers = () => {
  const stored = localStorage.getItem('viewedFlowers')
  return stored ? JSON.parse(stored) : []
}

/**
 * Check if a flower has been viewed
 * @param {number} flowerId - Flower ID to check
 * @returns {boolean} True if viewed
 */
export const isFlowerViewed = (flowerId) => {
  const viewed = getViewedFlowers()
  return viewed.includes(flowerId)
}

/**
 * Unlock all flowers (Admin function)
 * Adds all flowers to the collection
 */
export const unlockAllFlowers = (source = 'exhibition') => {
  const now = new Date().toISOString()
  const map = {}
  flowersData.forEach(f => { map[f.id] = { collectedAt: now, source } })
  localStorage.setItem('collectedFlowers', JSON.stringify(map))
}

/**
 * Remove a single flower from the collection map
 */
export const removeCollectedFlower = (flowerId) => {
  const map = getCollectedMap()
  if (flowerId in map) {
    delete map[flowerId]
    localStorage.setItem('collectedFlowers', JSON.stringify(map))
  }
}

/**
 * Clear all collected flowers (Admin function)
 * Resets the collection to empty
 */
export const clearAllFlowers = () => {
  localStorage.removeItem('collectedFlowers')
  localStorage.removeItem('viewedFlowers')
}
