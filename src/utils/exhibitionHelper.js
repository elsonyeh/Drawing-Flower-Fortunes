// Exhibition mode state management
import { syncExhibitionToCloud, loadExhibitionFromCloud } from './exhibitionSync'

const STORAGE_KEY = 'exhibitionState'

const defaultState = () => ({
  visited: [],       // e.g. ['A3', 'B1']
  initialized: true,
})

export const getExhibitionState = () => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return null  // null = not in exhibition mode
  return JSON.parse(stored)
}

const saveState = (state) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  // Fire-and-forget sync to cloud
  syncExhibitionToCloud(state).catch(console.error)
}

/**
 * 同步版初始化（首次進展覽時呼叫）
 * 若 localStorage 無資料，嘗試從 Supabase 還原
 */
export const initExhibitionWithCloud = async () => {
  const existing = getExhibitionState()
  if (existing) return existing  // localStorage 有資料，直接用

  // localStorage 消失了，嘗試從雲端還原
  const cloud = await loadExhibitionFromCloud()
  if (cloud) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cloud))
    return cloud
  }

  // 全新訪客
  const state = defaultState()
  saveState(state)
  return state
}

export const isExhibitionMode = () => !!getExhibitionState()

export const getUnlockedPools = () => {
  const state = getExhibitionState()
  if (!state) return ['A', 'B', 'C']  // no restriction outside exhibition
  const { visited } = state
  const aCount = visited.filter(w => w.startsWith('A')).length
  const bCount = visited.filter(w => w.startsWith('B')).length
  const pools = ['A']
  if (aCount >= 2) pools.push('B')
  if (bCount >= 2) pools.push('C')
  return pools
}

// 測試用：從已拜訪清單移除某件作品，讓下次掃描視為新拜訪
export const clearWorkVisit = (workId) => {
  const state = getExhibitionState()
  if (!state) return
  state.visited = state.visited.filter(id => id !== workId)
  saveState(state)
}

export const recordVisit = (workId) => {
  const state = getExhibitionState()
  if (!state) return
  if (!state.visited.includes(workId)) {
    state.visited.push(workId)
  }
  saveState(state)
  return state
}

export const getZoneProgress = () => {
  const state = getExhibitionState()
  if (!state) return null
  const { visited } = state
  return {
    A: visited.filter(w => w.startsWith('A')),
    B: visited.filter(w => w.startsWith('B')),
    C: visited.filter(w => w.startsWith('C')),
  }
}

export const isWorkVisited = (workId) => {
  const state = getExhibitionState()
  return state ? state.visited.includes(workId) : false
}

export const enterExhibitionMode = () => {
  const state = defaultState()
  saveState(state)
  return state
}

export const exitExhibitionMode = () => {
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * 重置展覽進度：先清雲端再清 localStorage
 * 若只清 localStorage，重新載入時 initAppMode 會從雲端把舊資料還原回來
 */
export const resetExhibitionState = async () => {
  await syncExhibitionToCloud({ visited: [] })
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * 根據全域模式初始化用戶狀態
 * - 'exhibition'：新訪客自動進入展覽模式（1 張票）；已有狀態則保持不動
 * - 'normal'：清除展覽狀態，回到自由抽籤模式
 * App 啟動時及 Realtime 收到模式變更時皆呼叫
 */
export const initAppMode = async (mode) => {
  if (mode === 'exhibition') {
    const existing = getExhibitionState()
    if (existing) return  // 已有進度，保持不動

    // 嘗試從雲端還原（清除 localStorage 後的回訪者）
    const cloud = await loadExhibitionFromCloud()
    if (cloud) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cloud))
      return
    }

    // 全新訪客 → 自動進入展覽模式
    const state = defaultState()
    saveState(state)
  } else {
    // normal mode：移除展覽限制
    localStorage.removeItem(STORAGE_KEY)
  }
}
