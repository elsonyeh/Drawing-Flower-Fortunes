import flowersData from '../data/flowers.json'

/**
 * Get a random flower with gacha probability
 * SSR: 5% each (25% total for 5 SSR cards)
 * Common: 75% total (distributed among 15 common cards)
 * @returns {Object} Random flower object
 */
export const getRandomFlower = () => {
  const random = Math.random() * 100

  // SSR cards (id 101-105), each has 5% chance
  const ssrCards = flowersData.filter(f => f.rarity === 'ssr')
  const commonCards = flowersData.filter(f => f.rarity === 'common')

  // 0-25: SSR (5% each for 5 cards)
  if (random < 25) {
    const ssrIndex = Math.floor(random / 5) // 0-4
    return ssrCards[ssrIndex]
  }

  // 25-100: Common cards
  const randomIndex = Math.floor(Math.random() * commonCards.length)
  return commonCards[randomIndex]
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
  const collected = getCollectedFlowers()

  // Check if already collected
  if (!collected.find(f => f.id === flower.id)) {
    collected.push({
      id: flower.id,
      flower: flower.flower,
      rarity: flower.rarity,
      collectedAt: new Date().toISOString()
    })
    localStorage.setItem('collectedFlowers', JSON.stringify(collected))
  }
}

/**
 * Get all collected flowers from localStorage
 * @returns {Array} Array of collected flower IDs with metadata
 */
export const getCollectedFlowers = () => {
  const stored = localStorage.getItem('collectedFlowers')
  return stored ? JSON.parse(stored) : []
}

/**
 * Check if a flower is collected
 * @param {number} flowerId - Flower ID to check
 * @returns {boolean} True if collected
 */
export const isFlowerCollected = (flowerId) => {
  const collected = getCollectedFlowers()
  return collected.some(f => f.id === flowerId)
}

/**
 * Get collection statistics
 * @returns {Object} Collection stats
 */
export const getCollectionStats = () => {
  const collected = getCollectedFlowers()
  const total = flowersData.length
  const ssrCollected = collected.filter(f => f.id > 100).length
  const commonCollected = collected.filter(f => f.id <= 100).length

  return {
    total: collected.length,
    totalCards: total,
    ssr: ssrCollected,
    totalSSR: 5,
    common: commonCollected,
    totalCommon: 15,
    percentage: Math.round((collected.length / total) * 100)
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
