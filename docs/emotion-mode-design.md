# 情緒解籤模式設計文件

> 最後更新：2026-03-08（已實作完成）

## 功能概述

新增「情緒解籤」模式：透過鏡頭掃描使用者臉部情緒，根據偵測結果推薦對應的花卉，再使用相同的抽卡動畫展示。此模式與原有隨機抽卡完全獨立，不影響原有流程。

---

## 技術選型

### 選用：`@vladmandic/face-api`

| 方案 | 優點 | 缺點 | 選用？ |
|------|------|------|--------|
| `@vladmandic/face-api` | 持續維護、TF.js 後端、模型輕量、支援 7 種情緒 | 模型需複製至 public/ | **選用** |
| `face-api.js`（原版） | 文件豐富 | 2021 後停止維護 | 不選 |
| `TensorFlow.js` + 自訓練 | 可針對微表情最佳化 | 需學術資料集、複雜度高 | 不選 |
| 後端雲端 API | 準確度高 | 隱私疑慮、需網路、延遲高 | 不選 |

### 為何不用純微表情模型

真正的微表情（FACS Action Units）偵測需要高速攝影機（200fps+）與學術資料集（CASME、SAMM），手機瀏覽器中不可行。

**替代方案：多幀累積加權平均**
- 掃描 3.5 秒，每 200ms 取一幀，共約 17 幀
- 後期幀權重較高（線性遞增，最高 3×）
- 可捕捉閃現的短暫表情，比單次偵測穩定

---

## 使用的模型檔案

放置於 `public/models/face-api/`（從 node_modules 複製）：

| 檔案 | 大小 | 用途 |
|------|------|------|
| `tiny_face_detector_model.bin` + manifest | ~190 KB | 人臉偵測（輕量，適合手機） |
| `face_landmark_68_tiny_model.bin` + manifest | ~90 KB | 68 點臉部特徵（強化表情精度） |
| `face_expression_model.bin` + manifest | ~310 KB | 7 種情緒分類 |

**複製指令（npm install 後執行一次）：**
```bash
cp node_modules/@vladmandic/face-api/model/tiny_face_detector_model* public/models/face-api/
cp node_modules/@vladmandic/face-api/model/face_landmark_68_tiny_model* public/models/face-api/
cp node_modules/@vladmandic/face-api/model/face_expression_model* public/models/face-api/
```

---

## 情緒 → 花卉映射

每種情緒對應 2~3 種性質相近的花，從中隨機選一種。實作於 `src/utils/emotionMapper.js`。

| 情緒 | 中文 | 顏色 | 候選花卉（ID） |
|------|------|------|--------------|
| `happy` | 開心 | #FFD700 | 向日葵(4)、牡丹(14)、鳳凰花(103) |
| `sad` | 憂愁 | #8B6DC6 | 薰衣草(3)、虞美人(105)、彼岸花(104) |
| `neutral` | 平靜 | #7DAE9A | 蓮花(7)、茉莉花(5)、玉蘭花(9) |
| `surprised` | 驚喜 | #5B9BD8 | 曇花(101)、藍色妖姬(102)、鬱金香(8) |
| `angry` | 激動 | #FF4500 | 鳳凰花(103)、彼岸花(104)、菊花(15) |
| `fearful` | 緊張 | #9B8EC2 | 薰衣草(3)、繡球花(6)、康乃馨(12) |
| `disgusted` | 冷靜 | #7B5FC7 | 紫羅蘭(11)、桔梗(10)、菊花(15) |

---

## 使用者流程

```
LandingPage
    ├── [原有] 點擊花束 → GachaAnimation → FortuneResult
    └── [新增] 點擊「情緒解籤」按鈕（Face ID SVG 圖示）
              ↓
        EmotionScanPage
              ↓
        [隱私聲明] → 點擊「開啟鏡頭」
              ↓
        [模型載入中（轉圈動畫）]
              ↓
        [鏡頭畫面 + 橢圓對齊框 + 3.5秒掃描進度條]
              ↓
        [情緒揭示（主情緒 + 情緒分布條形圖）]
              ↓
        [按下「開始解籤」]
              ↓
        GachaAnimation（同原有，花卉已由情緒決定）
              ↓
        FortuneResult（顯示「根據你的情緒推薦」標籤）
```

---

## 實作架構

### 新增檔案

**`src/utils/emotionMapper.js`**
- `EMOTION_META` — 7 種情緒的中文標籤、顏色、描述
- `averageExpressions(frames)` — 多幀加權平均
- `getFlowerByEmotion(expressions)` — 回傳 `{ flower, emotion, confidence }`

**`src/components/EmotionScanPage.jsx`**

Phase 狀態機（`AnimatePresence mode="wait"`，任何時刻只有一個 phase）：

| Phase | 說明 |
|-------|------|
| `privacy` | 隱私聲明，點擊後進入 loading |
| `loading` | 並行載入 3 個 face-api 模型 + 取得相機串流 |
| `scanning` | 鏡頭畫面 + 橢圓框 + 掃描線 + 進度條 |
| `revealing` | 情緒結果動畫 + 情緒分布條形圖 |
| `ready` | 確認按鈕，點擊後進入 gacha |
| `error` | 統一錯誤畫面（可重試） |

**關鍵實作細節：**
- 模型懶加載，僅首次進入才載入
- `setPhase('scanning')` 先執行讓 video 進入 DOM，再由 `useEffect` 接上 stream（解決 videoRef 為 null 的問題）
- 離開頁面時 `stream.getTracks().forEach(t => t.stop())` 立即停止鏡頭

**掃描視窗 UI（280 × 340px）：**
- SVG 橢圓遮罩（`cx:140, cy:165, rx:98, ry:125`）暗化橢圓外區域
- 未偵測到臉：虛線橢圓 + 底部提示文字
- 偵測到臉：實線橢圓 + 紫色光暈濾鏡
- 掃描線限制在橢圓 clipPath 內移動
- 四角框裝飾（CornerFrame，接受 w/h 非正方形）

**Icon：** Face ID 風格 SVG（四角框 + 臉部橢圓 + 眼睛 + 嘴巴），取代原有 emoji

### 修改檔案

**`src/App.jsx`**
- 新增 stage：`'emotionScan'`
- 新增 state：`emotionData`
- 新增 handler：`handleEmotionScan`、`handleEmotionComplete`
- render `<EmotionScanPage>` 並傳遞 `emotionData` 給 `<FortuneResult>`

**`src/components/LandingPage.jsx`**
- 新增 `onEmotionScan` prop
- 花束下方加入副按鈕（Face ID SVG + 「情緒解籤」文字）

**`src/components/FortuneResult.jsx`**
- 新增 `emotionData` prop（可選）
- 若有 emotionData，在花名上方顯示情緒推薦標籤（顏色與情緒對應）

---

## 隱私設計

- 鏡頭僅在 EmotionScanPage 的 scanning phase 期間開啟
- 離開頁面（返回、確認解籤）時立即呼叫 `stopCamera()` 停止串流
- 所有推理在瀏覽器本地執行，不上傳任何影像或資料
- 首次進入顯示隱私聲明，使用者主動點擊才開啟鏡頭

---

## 邊界情況處理

| 情況 | 處理方式 |
|------|---------|
| 使用者拒絕相機權限 | 進入 error phase，提供「返回」與「重試」 |
| 模型載入失敗 | 進入 error phase，顯示錯誤訊息 |
| 掃描 3.5 秒內未偵測到臉 | 進入 error phase，提示重新嘗試 |
| 多人在鏡頭前 | `detectSingleFace` 自動取最顯著的臉 |
| 手機前鏡頭影像翻轉 | video + canvas 皆套用 `transform: scaleX(-1)` |
| 重試時 stream 仍存在 | 直接切回 scanning phase，useEffect 重新接上 stream |
