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
 * Save collected flower to localStorage
 * @param {Object} flower - Flower object to save
 */
export const saveCollectedFlower = (flower) => {
  const map = getCollectedMap()
  if (!(flower.id in map)) {
    map[flower.id] = new Date().toISOString()
    localStorage.setItem('collectedFlowers', JSON.stringify(map))
  }
}

/**
 * Get raw collected map from localStorage: { [flowerId]: collectedAt }
 */
export const getCollectedMap = () => {
  const stored = localStorage.getItem('collectedFlowers')
  if (!stored) return {}
  const parsed = JSON.parse(stored)
  // 相容舊格式（陣列）
  if (Array.isArray(parsed)) {
    const map = {}
    parsed.forEach(f => { map[f.id] = f.collectedAt || new Date().toISOString() })
    localStorage.setItem('collectedFlowers', JSON.stringify(map))
    return map
  }
  return parsed
}

/**
 * Get all collected flowers from localStorage
 * @returns {Array} Array of {id, collectedAt}
 */
export const getCollectedFlowers = () => {
  const map = getCollectedMap()
  return Object.entries(map).map(([id, collectedAt]) => ({ id: Number(id), collectedAt }))
}

/**
 * Check if a flower is collected
 * @param {number} flowerId - Flower ID to check
 * @returns {boolean} True if collected
 */
export const isFlowerCollected = (flowerId) => {
  return flowerId in getCollectedMap()
}

/**
 * Get collection statistics
 * @returns {Object} Collection stats
 */
export const getCollectionStats = () => {
  const map = getCollectedMap()
  const ids = Object.keys(map).map(Number)
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
export const unlockAllFlowers = () => {
  const now = new Date().toISOString()
  const map = {}
  flowersData.forEach(f => { map[f.id] = now })
  localStorage.setItem('collectedFlowers', JSON.stringify(map))
}

/**
 * Clear all collected flowers (Admin function)
 * Resets the collection to empty
 */
export const clearAllFlowers = () => {
  localStorage.removeItem('collectedFlowers')
  localStorage.removeItem('viewedFlowers')
}
