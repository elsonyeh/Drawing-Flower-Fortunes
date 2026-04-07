// Exhibition mode state management

const STORAGE_KEY = 'exhibitionState'

const defaultState = () => ({
  visited: [],       // e.g. ['A3', 'B1']
  tickets: 1,        // start with 1 free draw
  initialized: true,
})

export const getExhibitionState = () => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return null  // null = not in exhibition mode
  return JSON.parse(stored)
}

export const initExhibition = () => {
  const existing = getExhibitionState()
  if (existing) return existing
  const state = defaultState()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
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

export const getDrawTickets = () => {
  const state = getExhibitionState()
  return state ? state.tickets : Infinity
}

export const recordVisit = (workId) => {
  const state = getExhibitionState()
  if (!state) return
  if (!state.visited.includes(workId)) {
    state.visited.push(workId)
    state.tickets += 1  // +1 ticket per new scan
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  return state
}

export const consumeTicket = () => {
  const state = getExhibitionState()
  if (!state || state.tickets <= 0) return false
  state.tickets -= 1
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  return true
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
