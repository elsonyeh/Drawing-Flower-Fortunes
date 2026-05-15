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

const COLLECTION_KEY = 'collectedFlowers_v2'

/**
 * Get raw collected map from localStorage
 * Key format: "${flowerId}:${source}"，value: { collectedAt }
 */
export const getCollectedMap = () => {
  const stored = localStorage.getItem(COLLECTION_KEY)
  if (!stored) return {}
  return JSON.parse(stored)
}

/**
 * Save collected flower to localStorage
 * 同一花朵在不同 source 各自獨立記錄
 */
export const saveCollectedFlower = (flower, source = 'normal') => {
  const map = getCollectedMap()
  const key = `${flower.id}:${source}`
  if (!(key in map)) {
    map[key] = { collectedAt: new Date().toISOString() }
    localStorage.setItem(COLLECTION_KEY, JSON.stringify(map))
  }
}

/**
 * Get all collected flowers from localStorage
 * @param {string|null} source - 若指定，只回傳該 source 的花；null = 全部
 * @returns {Array} Array of {id, collectedAt, source}
 */
export const getCollectedFlowers = (source = null) => {
  const map = getCollectedMap()
  return Object.entries(map)
    .filter(([key]) => !source || key.endsWith(`:${source}`))
    .map(([key, entry]) => {
      const [id, src] = key.split(':')
      return { id: Number(id), collectedAt: entry.collectedAt, source: src }
    })
}

/**
 * Check if a flower is collected
 * @param {number} flowerId - Flower ID to check
 * @param {string|null} source - 若指定，需 source 相符；null = 任意 source 皆算
 * @returns {boolean}
 */
export const isFlowerCollected = (flowerId, source = null) => {
  const map = getCollectedMap()
  if (source) return (`${flowerId}:${source}` in map)
  return Object.keys(map).some(key => key.startsWith(`${flowerId}:`))
}

/**
 * Get collection statistics
 * @param {string|null} source - 若指定，只統計該 source；null = 全部（去重後計算唯一花朵數）
 * @returns {Object} Collection stats
 */
export const getCollectionStats = (source = null) => {
  const map = getCollectedMap()
  const matchingIds = Object.keys(map)
    .filter(key => !source || key.endsWith(`:${source}`))
    .map(key => Number(key.split(':')[0]))
  const ids = [...new Set(matchingIds)]
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
  flowersData.forEach(f => { map[`${f.id}:${source}`] = { collectedAt: now } })
  localStorage.setItem(COLLECTION_KEY, JSON.stringify(map))
}

/**
 * Remove a single flower from the collection map（移除所有 source 的記錄）
 */
export const removeCollectedFlower = (flowerId) => {
  const map = getCollectedMap()
  let changed = false
  Object.keys(map).forEach(key => {
    if (key.startsWith(`${flowerId}:`)) { delete map[key]; changed = true }
  })
  if (changed) localStorage.setItem(COLLECTION_KEY, JSON.stringify(map))
}

/**
 * Clear all collected flowers (Admin function)
 * Resets the collection to empty
 */
export const clearAllFlowers = () => {
  localStorage.removeItem(COLLECTION_KEY)
  localStorage.removeItem('viewedFlowers')
}
