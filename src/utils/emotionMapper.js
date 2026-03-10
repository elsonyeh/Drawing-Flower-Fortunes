import flowersData from '../data/flowers.json'

/**
 * 情緒 → 花卉映射
 * 每種情緒對應 2~3 種性質相近的花，隨機挑一種
 */
const EMOTION_FLOWER_IDS = {
  happy:     [4, 14, 103],   // 向日葵、牡丹、鳳凰花  — 燦爛、豐盛、烈火
  sad:       [3, 105, 104],  // 薰衣草、虞美人、彼岸花 — 療癒、哀愁、輪迴
  neutral:   [7, 5, 9],      // 蓮花、茉莉花、玉蘭花   — 平靜、淡雅、純淨
  surprised: [101, 102, 8],  // 曇花、藍色妖姬、鬱金香  — 奇蹟、驚喜、珍稀
  angry:     [103, 104, 15], // 鳳凰花、彼岸花、菊花    — 烈焰、轉化、堅毅
  fearful:   [3, 6, 12],     // 薰衣草、繡球花、康乃馨  — 療癒、包容、關懷
  disgusted: [11, 10, 15],   // 紫羅蘭、桔梗、菊花     — 高潔、誠實、清高
}

/**
 * 情緒中文標籤與描述
 */
export const EMOTION_META = {
  happy:     { zh: '開心',  color: '#FFD700', desc: '你的笑容散發著溫暖的光芒' },
  sad:       { zh: '憂愁',  color: '#8B6DC6', desc: '感受到你內心細膩而深沉的情感' },
  neutral:   { zh: '平靜',  color: '#7DAE9A', desc: '你的心如靜水，沉著而安定' },
  surprised: { zh: '驚喜',  color: '#5B9BD8', desc: '你的眼中閃爍著好奇的光芒' },
  angry:     { zh: '激動',  color: '#FF4500', desc: '感受到你內心強烈奔放的能量' },
  fearful:   { zh: '緊張',  color: '#9B8EC2', desc: '感受到你心中藏著小小的不安' },
  disgusted: { zh: '冷靜',  color: '#7B5FC7', desc: '你有著清醒而挑剔的銳利眼光' },
}

/**
 * 從多幀情緒陣列計算加權平均（後期幀權重較高）
 * @param {Array<Object>} frames - 每幀的情緒機率物件
 * @returns {Object} 加權平均後的情緒機率物件
 */
export const averageExpressions = (frames) => {
  if (frames.length === 0) return null

  const keys = Object.keys(frames[0])
  const total = frames.length
  const result = {}

  keys.forEach(key => {
    let weightedSum = 0
    let weightTotal = 0
    frames.forEach((frame, i) => {
      // 後期幀權重較高（線性增加）
      const weight = 1 + (i / total) * 2
      weightedSum += (frame[key] || 0) * weight
      weightTotal += weight
    })
    result[key] = weightedSum / weightTotal
  })

  return result
}

/**
 * 從情緒機率向量選出對應花卉
 * @param {Object} expressions - 加權平均後的情緒機率
 * @returns {{ flower: Object, emotion: string, confidence: number }}
 */
export const getFlowerByEmotion = (expressions) => {
  // 降低 neutral 的權重，讓輕微表情也能被偵測到
  const NEUTRAL_DISCOUNT = 0.2
  const adjusted = { ...expressions, neutral: (expressions.neutral ?? 0) * NEUTRAL_DISCOUNT }

  // 重新正規化
  const total = Object.values(adjusted).reduce((s, v) => s + v, 0)
  const normalized = Object.fromEntries(
    Object.entries(adjusted).map(([k, v]) => [k, total > 0 ? v / total : 0])
  )

  const sorted = Object.entries(normalized).sort(([, a], [, b]) => b - a)
  const [dominantEmotion, confidence] = sorted[0]

  const candidateIds = EMOTION_FLOWER_IDS[dominantEmotion] ?? EMOTION_FLOWER_IDS.neutral
  const randomId = candidateIds[Math.floor(Math.random() * candidateIds.length)]
  const flower = flowersData.find(f => f.id === randomId)

  return { flower, emotion: dominantEmotion, confidence }
}
