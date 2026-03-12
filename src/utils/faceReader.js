import flowersData from '../data/flowers.json'

// ─── 68-point landmark index reference (dlib / face-api) ────────────
// 0-16:  jawline
// 17-21: right brow (inner→outer), 22-26: left brow (outer→inner)
// 27-35: nose
// 36-41: right eye, 42-47: left eye
// 48-59: outer lips, 60-67: inner lips
// ─────────────────────────────────────────────────────────────────────

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

/** Average multiple frames of landmark positions */
export function averageLandmarks(frames) {
  if (frames.length === 0) return null
  const n = frames[0].length
  return Array.from({ length: n }, (_, i) => ({
    x: frames.reduce((s, f) => s + f[i].x, 0) / frames.length,
    y: frames.reduce((s, f) => s + f[i].y, 0) / frames.length,
  }))
}

/**
 * Extract geometric face features from averaged 68-point landmarks.
 * All ratios are dimensionless (relative to face width or height).
 */
export function extractFeatures(pts) {
  // ── 臉型比例 ──────────────────────────────────────────────
  const faceWidth  = dist(pts[0], pts[16])
  const faceHeight = pts[8].y - Math.min(pts[19].y, pts[24].y)  // chin → brow top
  const faceRatio  = faceWidth / Math.max(faceHeight, 1)
  // > 0.85 → 圓潤；< 0.72 → 修長；中間 → 鵝蛋

  // ── 眉梢角度（相對臉寬，y 朝下為正）────────────────────
  // Right brow: 17(inner) → 21(outer)；Left brow: 22(outer) → 26(inner)
  // 負值 = 眉尾上揚（有主見）；正值 = 眉尾下垂（溫柔）
  const rBrowSlope = (pts[21].y - pts[17].y) / Math.max(dist(pts[17], pts[21]), 1)
  const lBrowSlope = (pts[22].y - pts[26].y) / Math.max(dist(pts[22], pts[26]), 1)
  const browSlope  = (rBrowSlope + lBrowSlope) / 2

  // ── 眼睛開合度 ────────────────────────────────────────────
  // Right eye: 36(left)–39(right)；Top: 37,38；Bottom: 40,41
  const rEyeW  = dist(pts[36], pts[39])
  const rEyeH  = (dist(pts[37], pts[41]) + dist(pts[38], pts[40])) / 2
  const lEyeW  = dist(pts[42], pts[45])
  const lEyeH  = (dist(pts[43], pts[47]) + dist(pts[44], pts[46])) / 2
  const eyeOpenness = ((rEyeH / Math.max(rEyeW, 1)) + (lEyeH / Math.max(lEyeW, 1))) / 2
  // 高 → 大眼；低 → 細長眼

  // ── 眼距（內眼角間距 / 臉寬）───────────────────────────
  const eyeGap = dist(pts[39], pts[42]) / Math.max(faceWidth, 1)
  // 高 → 眼距寬（心胸開闊）；低 → 眼距近（專注）

  // ── 嘴角弧度（正規化，正值 = 嘴角上揚/笑；負值 = 嘴角下垂）──
  // 唇峰(50,52)在圖像坐標中 y 較小（位置較高），嘴角(48,54)通常略低
  // 嘴角上揚時 cornerAvgY 減小，(cornerAvgY - topLipY) 趨近 0 或負
  // 除以 faceWidth 正規化，消除拍攝距離影響
  const cornerAvgY = (pts[48].y + pts[54].y) / 2
  const topLipY    = (pts[50].y + pts[52].y) / 2
  const mouthCurve = (cornerAvgY - topLipY) / Math.max(faceWidth, 1)
  // 正 = 嘴角低於唇峰（中性或下垂）
  // 趨近 0 或負 = 嘴角已接近或高於唇峰（上揚/笑容）

  // ── 嘴巴相對寬度 ─────────────────────────────────────────
  const mouthWidth = dist(pts[48], pts[54]) / Math.max(faceWidth, 1)
  // 高 → 嘴巴寬（熱情外向）；低 → 嘴巴窄（內斂精緻）

  // ── 鼻翼寬度 ─────────────────────────────────────────────
  const noseWidth = dist(pts[31], pts[35]) / Math.max(faceWidth, 1)
  // 高 → 鼻翼寬（務實豐盛）；低 → 鼻翼窄（細膩）

  return { faceRatio, browSlope, eyeOpenness, eyeGap, mouthCurve, mouthWidth, noseWidth }
}

// ─── 六種面相原型 ─────────────────────────────────────────────────────
export const ARCHETYPES = {
  sunny: {
    zh: '陽光型',
    icon: '☀️',
    color: '#FFD700',
    desc: '你的面相透露出溫暖的光芒，天生親和力十足，讓人感到如沐春風。笑容是你最有力的語言。',
    traits: ['親和力強', '樂觀開朗', '熱情待人'],
    flowerIds: [4, 14, 103],   // 向日葵、牡丹、鳳凰花
  },
  wise: {
    zh: '智慧型',
    icon: '🌙',
    color: '#7BAFD4',
    desc: '眉眼間藏著深邃的思緒，沉靜中蘊含力量。你善於觀察，三思而後行，是值得信賴的存在。',
    traits: ['思慮深遠', '洞察力強', '意志堅定'],
    flowerIds: [7, 15, 10],    // 蓮花、菊花、桔梗
  },
  romantic: {
    zh: '浪漫型',
    icon: '🌸',
    color: '#E8A0BF',
    desc: '你的臉龐透著豐富的感情與細膩的感知，對美好事物有著天生的敏銳，靈魂裡住著詩人。',
    traits: ['感情豐富', '想像力強', '心思細膩'],
    flowerIds: [101, 105, 3],  // 曇花、虞美人、薰衣草
  },
  mysterious: {
    zh: '神秘型',
    icon: '✨',
    color: '#A78BFA',
    desc: '你的五官帶著獨特的氣場，不輕易示人卻令人難以忘懷，自有一股難以言說的攝人魅力。',
    traits: ['個性獨特', '魅力非凡', '不拘一格'],
    flowerIds: [102, 104, 11], // 藍色妖姬、彼岸花、紫羅蘭
  },
  gentle: {
    zh: '溫柔型',
    icon: '🌿',
    color: '#7DAE9A',
    desc: '你的面相散發著包容與溫柔，善於體察他人的感受，是身邊人心中最溫暖的避風港。',
    traits: ['溫柔體貼', '善解人意', '包容心強'],
    flowerIds: [12, 6, 9],     // 康乃馨、繡球花、玉蘭花
  },
  free: {
    zh: '自由型',
    icon: '🦋',
    color: '#67C5A0',
    desc: '你的神情帶著一股自由的靈氣，好奇心旺盛，天生對新事物充滿熱情，像風一樣無拘無束。',
    traits: ['好奇心旺', '適應力強', '心胸開闊'],
    flowerIds: [8, 5, 13],     // 鬱金香、茉莉、玫瑰
  },
}

/**
 * Score each archetype by geometric face features.
 * Returns the winning archetype and matched flower.
 */
export function getFlowerByFace(features) {
  const { faceRatio, browSlope, eyeOpenness, eyeGap, mouthCurve, mouthWidth, noseWidth } = features

  const scores = { sunny: 0, wise: 0, romantic: 0, mysterious: 0, gentle: 0, free: 0 }

  // ── 臉型 ──────────────────────────────────────────────────
  if      (faceRatio > 0.92) { scores.sunny += 2; scores.gentle += 1 }     // 圓臉
  else if (faceRatio < 0.68) { scores.wise += 2; scores.mysterious += 1 }  // 長臉
  else if (faceRatio >= 0.80) { scores.free += 2; scores.romantic += 1 }   // 偏寬鵝蛋 → 自由
  else                         { scores.gentle += 1; scores.wise += 1 }     // 偏窄鵝蛋 → 溫柔/智慧

  // ── 眉梢角度 ──────────────────────────────────────────────
  if      (browSlope < -0.08) { scores.mysterious += 2; scores.wise += 1 } // 眉尾上揚
  else if (browSlope >  0.08) { scores.gentle += 2; scores.romantic += 1 } // 眉尾下垂
  else                         { scores.free += 1; scores.wise += 1 }       // 平眉 → 自由/智慧

  // ── 眼睛開合 ──────────────────────────────────────────────
  if      (eyeOpenness > 0.38) { scores.romantic += 2; scores.sunny += 1 } // 大眼
  else if (eyeOpenness < 0.22) { scores.wise += 2; scores.mysterious += 1 }// 細長眼
  else                          { scores.wise += 1; scores.gentle += 1 }    // 中等眼 → 智慧/溫柔

  // ── 眼距 ──────────────────────────────────────────────────
  if      (eyeGap > 0.24) { scores.free += 2; scores.romantic += 1 }       // 眼距寬 → 自由（降低門檻）
  else if (eyeGap < 0.16) { scores.mysterious += 2; scores.wise += 1 }     // 眼距近
  else                     { scores.gentle += 1; scores.free += 1 }         // 中等眼距 → 溫柔/自由

  // ── 嘴角弧度 ──────────────────────────────────────────────
  if      (mouthCurve < -0.005) { scores.sunny += 2; scores.free += 1 }    // 真正上揚（提高門檻，減少陽光型）
  else if (mouthCurve > 0.035)  { scores.gentle += 2; scores.romantic += 1 }// 下垂（降低門檻，更多溫柔型）
  else                           { scores.free += 1; scores.wise += 1 }     // 中性嘴角 → 自由/智慧

  // ── 嘴巴寬度 ──────────────────────────────────────────────
  if      (mouthWidth > 0.50) { scores.sunny += 1; scores.free += 1 }      // 大嘴
  else if (mouthWidth < 0.36) { scores.wise += 2; scores.mysterious += 1 } // 小嘴 → 智慧加強
  else                         { scores.gentle += 1 }                       // 中等 → 溫柔

  // ── 鼻翼寬度 ──────────────────────────────────────────────
  if      (noseWidth > 0.30) { scores.gentle += 2; scores.sunny += 1 }     // 鼻翼寬 → 溫柔（降低門檻）
  else if (noseWidth < 0.22) { scores.romantic += 1; scores.mysterious += 1}
  else                        { scores.wise += 1 }                          // 中等鼻翼 → 智慧

  // ── 無明顯特徵時隨機選原型，避免永遠陽光型 ──────────────
  const total = Object.values(scores).reduce((s, v) => s + v, 0)
  if (total === 0) {
    const keys = Object.keys(scores)
    scores[keys[Math.floor(Math.random() * keys.length)]] = 1
  }

  console.log('[FaceReader] scores:', scores, 'features:', features)

  // ── 選出最高分原型 ────────────────────────────────────────
  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a)
  const [archetypeName] = sorted[0]
  const archetype = ARCHETYPES[archetypeName]

  const randomId = archetype.flowerIds[Math.floor(Math.random() * archetype.flowerIds.length)]
  const flower = flowersData.find(f => f.id === randomId)

  return { flower, archetypeName, archetype, scores }
}
