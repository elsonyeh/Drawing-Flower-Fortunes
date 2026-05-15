# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**埕花 (Cheng Flowers)** - 鹽夏不夜埕花語抽籤互動網站

A gacha-style digital flower fortune-telling game for Yancheng Night Market. Features complete collection system with SSR rarity cards, animated card drawing mechanics, and persistent collection tracking via localStorage.

## Tech Stack

- **React 18** - Component-based UI framework
- **Vite** - Build tool and dev server
- **Framer Motion** - 2D animations (card flip, transitions)
- **React Three Fiber + Three.js** - 3D flower blooming effects
- **Tailwind CSS** - Utility-first styling
- **React Router** - (if multi-page navigation needed)

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Project Structure

```
src/
├── components/          # React components
│   ├── LandingPage.jsx      # Landing page with 60 falling petals
│   ├── GachaAnimation.jsx   # Multi-card shuffle & draw animation
│   ├── CardBack.jsx         # Unique card back for each flower
│   ├── FlowerBloom.jsx      # 3D flower bloom effect (Three.js)
│   ├── FortuneResult.jsx    # Result display with SSR effects
│   └── CollectionPage.jsx   # Collection gallery (20 cards)
├── data/
│   └── flowers.json    # 20 flowers (15 common + 5 SSR)
├── utils/
│   └── fortuneHelper.js # Gacha system & collection management
└── App.jsx             # Main app with stage management
```

## Architecture Notes

### Gacha Flow (Game-style Card Drawing)
1. **Landing Page** - 60 falling petals + draw button + collection button
2. **Gacha Animation** - 7-card shuffle → draw → flip → reveal (5-6 seconds total)
3. **SSR Detection** - If SSR, trigger golden effects (rays, particles, congrats)
4. **Result Display** - 3D flower (enlarged) + flower info + SSR special styling
5. **Auto-save** - Card saved to localStorage collection immediately

### Collection System
- **localStorage key**: `collectedFlowers_v2`
- **Key format**: `"${flowerId}:${source}"`（e.g. `"3:exhibition"`）— 同一花朵在不同 source 各自獨立記錄
- **Gallery**: 按當前模式（`normal` / `exhibition`）過濾顯示，普通模式只顯示普通模式抽到的花，展覽模式同理；同花兩模式都抽過則兩邊皆解鎖
- **Statistics**: 只計算當前模式的花；zone unlock / 集滿成就使用 `getCollectionStats('exhibition')`
- **Grid**: 2-5 column grid, locked/unlocked states, NEW badges
- **Filtering**: All / SSR / Common tabs

### Gacha Probability System
- **SSR (5 cards)**: 1% each = **5% total**
  - ID 101-105: 曇花, 藍色妖姬, 鳳凰花, 彼岸花, 虞美人
- **Common (15 cards)**: 95% total ≈ 6.3% each
  - ID 1-15: Regular flowers

### Face Reading System（面相解讀）`src/utils/faceReader.js`

流程：privacy → loading → scanning（4秒擷取 68-point landmarks）→ revealing（自動 2.8 秒後進入抽卡）

#### 六種原型與對應花朵
| 原型 | 代碼 | 花朵 ID |
|------|------|---------|
| ☀️ 陽光型 | sunny | 4 向日葵、14 牡丹、103 鳳凰花 |
| 🌙 智慧型 | wise | 7 蓮花、15 菊花、10 桔梗 |
| 🌸 浪漫型 | romantic | 101 曇花、105 虞美人、3 薰衣草 |
| ✨ 神秘型 | mysterious | 102 藍色妖姬、104 彼岸花、11 紫羅蘭 |
| 🌿 溫柔型 | gentle | 12 康乃馨、6 繡球花、9 玉蘭花 |
| 🦋 自由型 | free | 8 鬱金香、5 茉莉、13 玫瑰 |

#### 評分參數（7 項特徵）

**臉型比例** `faceRatio = 臉寬 / 臉高`
- `> 0.92` 圓臉：☀️+2 🌿+1
- `< 0.68` 長臉：🌙+2 ✨+1
- `0.80~0.92` 偏寬鵝蛋：🦋+2 🌸+1
- `0.68~0.80` 偏窄鵝蛋：🌿+1 🌙+1

**眉梢角度** `browSlope`（負 = 上揚）
- `< -0.08` 上揚：✨+2 🌙+1
- `> 0.08` 下垂：🌿+2 🌸+1
- 平眉（其他）：🦋+1 🌙+1

**眼睛開合** `eyeOpenness = 眼高 / 眼寬`
- `> 0.38` 大眼：🌸+2 ☀️+1
- `< 0.22` 細長眼：🌙+2 ✨+1
- 中等（其他）：🌙+1 🌿+1

**眼距** `eyeGap = 內眼角間距 / 臉寬`
- `> 0.24` 寬：🦋+2 🌸+1
- `< 0.16` 近：✨+2 🌙+1
- 中等（其他）：🌿+1 🦋+1

**嘴角弧度** `mouthCurve`（負 = 上揚）
- `< -0.005` 上揚：☀️+2 🦋+1
- `> 0.035` 下垂：🌿+2 🌸+1
- 中性（其他）：🦋+1 🌙+1

**嘴巴寬度** `mouthWidth = 嘴寬 / 臉寬`
- `> 0.50` 大：☀️+1 🦋+1
- `< 0.36` 小：🌙+2 ✨+1
- 中等（其他）：🌿+1

**鼻翼寬度** `noseWidth = 鼻翼寬 / 臉寬`
- `> 0.30` 寬：🌿+2 ☀️+1
- `< 0.22` 窄：🌸+1 ✨+1
- 中等（其他）：🌙+1

### Animation Architecture
1. **Shuffle Stage** (1.5s): 7 cards spread and shuffle
2. **Draw Stage** (1s): One card elevates with glow
3. **Flip Stage** (1.2s): 3D card flip rotation
4. **Reveal Stage** (2-2.5s):
   - SSR: Golden rays + burst particles + 3D flower
   - Common: 3D flower bloom
5. **Auto-transition**: Jump to result page

### Data Structure
Each flower contains:
- `id`: Unique ID (1-15 common, 101-105 SSR)
- `flower`: Flower name (Chinese)
- `meaning`: Flower language meaning
- `story`: Story with Yancheng local context
- `message`: Personalized guidance message
- `locations`: 3 recommended Yancheng locations
- `color`: Primary color (hex)
- `gradientColors`: Array[3] for SSR gradient (optional)
- `model`: 3D model reference
- `rarity`: "common" | "ssr"

## Design Principles

- **Mobile-first**: Optimized for QR code mobile access
- **Performance**: Lazy load 3D models, optimize bundle size
- **Accessibility**: Touch-friendly interactions, readable text
- **Atmospheric**: Use particles, gradients, and smooth transitions for immersive experience

## Key Implementation Details

- 3D models should be lightweight (optimized GLB/GLTF)
- Random fortune selection ensures unique experience
- Animations should be smooth on mobile devices (60fps target)
- Consider preloading critical assets for seamless experience

## 3D Model Loading (GLB/GLTF)

### Current Implementation

Models are configured in `FlowerBloom.jsx` via `flower3DConfigs`:

```javascript
const flower3DConfigs = {
  // OBJ format (legacy)
  sunflower: {
    type: 'obj',
    mtl: '/models/sunflower/xxx.mtl',
    obj: '/models/sunflower/xxx.obj',
    scale: 0.019,
    position: [0, -2.0, 0],
    rotation: [-Math.PI / 2, 0, 0],
  },
  // GLB format (recommended)
  rose: {
    type: 'glb',
    glb: '/models/rose/rose.glb',
    scale: 2.5,
    position: [0, -0.8, 0],
    rotation: [0, 0, 0],
    autoRotateSpeed: 0.8,
  },
}
```

### Loading Methods

| Format | Loader | Usage |
|--------|--------|-------|
| `.glb` | `useGLTF` (drei) | Preferred - binary, smaller, faster |
| `.obj/.mtl` | `OBJLoader` + `MTLLoader` | Legacy support |

### Adding New 3D Models

1. Place model in `public/models/<flower-name>/`
2. Add config to `flower3DConfigs` in `FlowerBloom.jsx`
3. Update `flowerConfigs.js` if needed (petalType mapping)

---

## Onboarding Tutorial System

### 元件位置
`src/components/TutorialOverlay.jsx`

### 觸發條件
localStorage `chenghua_tutorial_v2` 不存在時，首次進站自動顯示。完成或跳過後寫入此 key。
同一 session 中斷後，透過 sessionStorage `chenghua_tutorial_step` 恢復進度。

### 16 步流程（步驟 0–15）

| # | type | target (`data-tutorial`) | 觸發下一步 | 說明 |
|---|------|--------------------------|-----------|------|
| 0 | fullscreen | — | 點擊「開始導覽」 | 歡迎畫面 |
| 1 | spotlight | `flowers` | stage → gacha | 引導點擊花束（引導抽籤不計入圖鑑）|
| 2 | spotlight | `gacha-card` | 點擊卡牌（advanceOnClick）| 引導翻牌揭曉 |
| 3 | spotlight | `flower-name` | 點擊「下一步」 | 介紹花名與花語 |
| 4 | spotlight | `flower-story` | 點擊「下一步」 | 介紹花之物語（鹽埕在地故事）|
| 5 | spotlight | `locations` | 點擊「下一步」 | 介紹裝置藝術展覽推薦作品 |
| 6 | spotlight | `share-btn` | 點擊「知道了」 | 介紹分享花語按鈕 |
| 7 | spotlight | `return-btn` | stage → landing | 引導返回主頁 |
| 8 | spotlight | `collection-btn` | stage → collection | 引導點擊圖鑑 |
| 9 | spotlight | `collection-progress` | 點擊「下一步」 | 介紹蒐集進度 |
| 10 | spotlight | `collection-card` | 點擊「下一步」 | 介紹卡片詳情（`blockClicks: true`，不可點開卡片）|
| 11 | spotlight | `back-btn` | stage → landing | 引導關閉圖鑑 |
| 12 | spotlight | `auth-btn` | 點擊按鈕（advanceOnClick）| 引導點擊登入/註冊 |
| 13 | spotlight | `login-buttons` | 用戶完成登入（advanceOnUser）| 等待選擇 LINE 或 Google 登入（`blockClicks: true`）|
| 14 | spotlight | `emotion-btn` | 點擊「知道了」 | 介紹相由花緣（面相掃描）|
| 15 | fullscreen | — | 點擊「出發探索！」| 完成導覽 |

### data-tutorial 錨點位置

| 屬性值 | 元件 | 位置說明 |
|--------|------|---------|
| `flowers` | `LandingPage.jsx` | 花束容器 div |
| `collection-btn` | `LandingPage.jsx` | 右上角圖鑑按鈕 |
| `auth-btn` | `LandingPage.jsx` | 右上角登入按鈕 |
| `emotion-btn` | `LandingPage.jsx` | 相由花緣（面相掃描）按鈕 |
| `flower-name` | `FortuneResult.jsx` | 花名 + 花語區塊 |
| `flower-story` | `FortuneResult.jsx` | 花之物語區塊 |
| `locations` | `FortuneResult.jsx` | 推薦裝置藝術作品區塊 |
| `share-btn` | `FortuneResult.jsx` | 分享花語按鈕 |
| `return-btn` | `FortuneResult.jsx` | 返回/再抽按鈕 |
| `gacha-card` | `GachaAnimation.jsx` | 翻牌容器（show_card 階段）|
| `login-buttons` | `AuthModal.jsx` | LINE / Google 登入按鈕組 |
| `collection-progress` | `CollectionPage.jsx` | 三格蒐集統計 |
| `collection-card` | `CollectionPage.jsx` | 第一張已收集卡片 |
| `view-detail-btn` | `CollectionPage.jsx` | 查看完整內容按鈕（flip modal 內）|
| `back-btn` | `CollectionPage.jsx` | 關閉圖鑑按鈕（×）|

### 調整方式
- **修改文字**：直接改 `STEPS` 陣列內的 `title` / `body` / `bodyHtml` / `cta`
- **新增步驟**：在 `STEPS` 插入新物件，`type` 可為 `fullscreen` / `spotlight` / `banner`
- **刪除步驟**：從 `STEPS` 移除，progress dots 自動更新；記得同步更新 `STEP_STAGE_MAP`
- **改觸發條件**：
  - `advanceOnStage`：等 app stage 變化（如 `'landing'`, `'gacha'`, `'collection'`）
  - `advanceOnClick`：等點擊指定 data-tutorial 錨點
  - `advanceOnUser`：等用戶登入完成（user prop 從 null 變為非 null；已登入則立即跳過）
  - `cta`：顯示手動推進按鈕
- **`blockClicks`（步驟旗標）**：設為 `true` 時，overlay 的 `pointer-events:none` 改為 `auto`，攔截所有背景點擊，只有 spotlight 框內（`data-tutorial` 錨點）的元素可操作。步驟 10（卡片不可開）與步驟 13（只能點登入按鈕）使用此旗標。
- **`scrollBlock`（步驟旗標）**：控制 `scrollIntoView({ block })` 參數，預設 `'center'`。步驟 10 設為 `'start'`，使目標卡片滾至畫面頂部，避免被底部 tooltip 遮住。
- **`onStepChange` prop**：`TutorialOverlay` 每次換步驟時呼叫 `onStepChange(step)`，讓 `App.jsx` 保有 `tutorialStep` state，用於驅動其他元件的 tutorial 連動行為（如 `AuthModal` 的 `tutorialLock`）。
- **中斷防呆**：`STEP_STAGE_MAP` 定義每步驟預期的 app stage；中途返回主頁時自動跳回對應步驟（steps 2–7 → step 1，steps 9–11 → step 8）
- **重置導覽**：清除 localStorage `chenghua_tutorial_v2`

### 引導抽籤暫存花朵
步驟 1 引導用戶點花進入抽卡時，抽到的花會：
1. 透過 `saveCollectedFlower(flower)` 正常寫入 localStorage（讓步驟 10 的圖鑑有卡片可 spotlight）
2. 花 ID 同步存入 sessionStorage `chenghua_tutorial_flower`

導覽結束或跳過（`tutorialActive` 變為 `false`）時，`App.jsx` 的 cleanup effect 會呼叫 `removeCollectedFlower(id)` 移除該筆暫存花，不污染真實圖鑑。

### AuthModal tutorialLock
`AuthModal` 的 `tutorialLock={tutorialActive && tutorialStep === 13}` prop 啟用時：
- 背景點擊（backdrop）不關閉 modal
- 「稍後再說」按鈕隱藏
- 強制用戶選擇 LINE 或 Google 登入後，tutorial 才推進

### GachaAnimation 注意事項
從主頁點花進入抽卡（`skipFlowerPick=true`）時，`pick_flower` 階段不渲染，避免花盆在白光消退時短暫顯現。展覽掃碼流程（`skipFlowerPick=false`）仍正常顯示選花階段。

---

## SSR 吉祥物 GLB 模型

### 五隻 SSR 花與對應模型

| SSR ID | 花名 | 模型檔案 | 壓縮後大小 |
|--------|------|---------|-----------|
| 101 | 百合花 | `public/models/epiphyllum/epiphyllum.glb` | 0.8 MB |
| 102 | 藍色妖姬 | `public/models/blue_rose/blue_rose.glb` | 0.8 MB |
| 103 | 鳳凰花 | `public/models/phoenix_flower/phoenix_flower.glb` | 0.7 MB |
| 104 | 彼岸花 | `public/models/red_spider_lily/red_spider_lily.glb` | 0.8 MB |
| 105 | 虞美人 | `public/models/corn_poppy/corn_poppy.glb` | 1.0 MB |

原始吉祥物檔案共 51.6 MB，經 Draco geometry + WebP texture 壓縮後合計 4.1 MB（-92%）。

### 架構說明
`FlowerBloom.jsx` 所有花朵現在全部使用 GLB 流程，程式碼從約 2,700 行精簡至 ~850 行：
- 移除：程式生成的花瓣 / 花莖 / 葉片 mesh code（petalProfiles、createPetalShape 等）
- 移除：`OBJLoader`、`MTLLoader`、`FBXLoader` 及相關 import
- 保留：`FlowerGLBModel`（useGLTF）、`ModelErrorBoundary`、`FlowerSkeleton`

---

## 展區進度條 & 區域解鎖動畫

### 兩段式進度條（CollectionPage.jsx）
圖鑑中每個展區（A / B / C）的掃描進度條依解鎖狀態顯示不同顏色：

| 狀態 | 條件 | 顏色 |
|------|------|------|
| 預設 | 尚未完成 | 展區主題色 |
| 完成 | 全 5 件掃完 | 金色 `#F2BE5C`，顯示 ★ |

### 區域解鎖動畫
**觸發條件**：任意一件裝置藝術已掃描（A / B / C 任一展區 ≥ 1 件）且已抽到至少一朵花語，第一次同時滿足時觸發全螢幕恭喜彈窗。

- localStorage key：`chenghua_zone_unlock_seen`（寫入後不再重複觸發）
- 彈窗位置：`CollectionPage.jsx`（`showZoneModal` state）；App 層級亦可透過 `testZoneModal` 獨立觸發
- 兌換說明文字：已掃描裝置藝術並解鎖花語 → 服務台出示圖鑑頁面換貼紙；走遍全部 + 集 15 種花語 → 隱藏好禮

### Admin 測試：區域解鎖動畫
`/elsontest` → 🧪 測試 tab → **🎉 區域解鎖動畫** 按鈕：
- 在 App 層級渲染 modal（`testZoneModal` state），不依賴 CollectionPage 是否開啟
- **不寫 localStorage**，可反覆測試
- 觸發方式：`onTestZoneUnlock()` → App `setTestZoneModal(true)`

---

## 集滿成就系統 (Completion Achievement)

### 觸發條件
同時滿足以下兩項，抽卡存檔時自動觸發。每台裝置僅顯示一次動畫（localStorage `chenghua_completion_seen`）：
1. **展覽模式花語 ≥ 15 種**（透過 QR 掃碼抽到，`source='exhibition'`；SSR 非必要，普通花即可達成）
2. **全部 15 件裝置藝術皆掃描過**（A1–A5、B1–B5、C1–C5 全在 `visited`）

判斷由 `isCompletionMet()` 統一處理（`collectionSync.js`），內部呼叫 `getCollectionStats('exhibition')`。

### 流程

| 步驟 | 說明 |
|------|------|
| 1 | `handleDraw` / `handleExhibitionDraw` 儲存花朵後呼叫 `checkAndNotifyCompletion(user)` |
| 2 | `isCompletionMet()` 確認花 ≥ 15 且裝置全掃；本裝置未看過動畫；雲端 `completion_notified = false` |
| 3 | 回傳 `{ showAnimation: true, needsEmail: !user.email }`，App 設 `completionData` |
| 4 | `CollectionComplete` 以全螢幕 z-200 覆蓋顯示動畫（約 4 秒） |
| 5 | 動畫結束後顯示 content card |
| 6a | **有 email 用戶**：自動呼叫 `sendCompletionEmail(user)` |
| 6b | **LINE 無 email 用戶**：顯示 EmailForm 讓用戶填寫後再呼叫 |
| 7 | `sendCompletionEmail` 查詢已獲獎人數，前 10 人寄信；所有人更新 `completion_notified = true` |

### 動畫階段（CollectionComplete.jsx）

| Phase | 延遲 | 內容 |
|-------|------|------|
| 1 | 300ms | 52 顆粒子從中心爆散（多色彩） |
| 2 | 1000ms | 「埕花」標題 spring 動畫放大登場 + 三圈光環 |
| 3 | 2000ms | 「走遍鹽埕 · 花語任務達成」上滑出現 |
| 4 | 2900ms | 「✨ 隱藏成就解鎖 ✨」淡入 |
| 5 | 3700ms | content card 上滑，開始傳送郵件或顯示 Email 表單 |

### 獎品限額邏輯
- `sendCompletionEmail` 先 count `profiles.completion_notified = true`
- `count < 10` → 寄出恭賀信（含第 N 位、領獎說明）；`count >= 10` → 顯示名額已滿
- 無論是否有獎，都更新 `completion_notified = true` + localStorage 旗標，防止重複觸發

### 郵件（Edge Function: send-completion-email）
- 寄件方：`"埕花 花轟" <elson921121@gmail.com>`（Gmail SMTP port 465）
- 主旨：`🌸 恭喜！你是第 N 位解鎖埕花隱藏成就的旅人`
- 內容：稱謂（登入姓名）、第 N 位、探訪 15 件裝置 + 蒐集 15 種花語、獎品名稱（鹽夏不夜埕限定杯套＋環保杯 乙組）、領獎時間、回覆郵件預約步驟、活動規則（逾期恕不補發）
- 領獎時間：`2026/5/16（六）、5/17（日）、5/23（六）17:00–21:00`
- 頁尾：「領獎請以回覆本信方式聯繫」
- 機密：`GMAIL_USER` / `GMAIL_APP_PASSWORD` 存於 Supabase secrets

### 獎品順序（第 N 位）計算方式
`sendCompletionEmail` 呼叫當下執行：
```sql
SELECT COUNT(*) FROM profiles WHERE completion_notified = true
```
count + 1 即為該用戶的名次。**測試期間若需要重置：**
```sql
-- Supabase SQL Editor
UPDATE public.profiles SET completion_notified = false WHERE email = 'elson921121@gmail.com';
```
```javascript
// 瀏覽器 console
localStorage.removeItem('chenghua_completion_seen')
```

### 相關 SQL
```sql
-- profiles 新增完成通知欄位
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS completion_notified boolean DEFAULT false;
```

---

## 資料庫 Schema

### collections 表
| 欄位 | 類型 | 說明 |
|------|------|------|
| `id` | uuid PK | |
| `user_id` | uuid → profiles | |
| `flower_id` | integer | 花朵 ID（1–15 common，101–105 SSR）|
| `source` | text | `'normal'` \| `'exhibition'` |
| `collected_at` | timestamptz | |

**Constraints / Indexes**
```sql
-- 同一用戶、同一花、同一 source 只有一筆
UNIQUE (user_id, flower_id, source)

-- source 只允許合法值
CHECK (source IN ('normal', 'exhibition'))

-- 加速圖鑑按模式過濾
CREATE INDEX idx_collections_user_source ON public.collections (user_id, source);
```

### localStorage Keys（前端）
| Key | 格式 | 說明 |
|-----|------|------|
| `collectedFlowers_v2` | `{ "${id}:${source}": { collectedAt } }` | 花朵蒐集（主要） |
| `viewedFlowers` | `[id, ...]` | 已查看詳情的花（NEW badge 用） |
| `chenghua_tutorial_v2` | `'1'` | 導覽完成旗標 |
| `chenghua_completion_seen` | `'1'` | 集滿成就動畫已播旗標 |
| `chenghua_zone_unlock_seen` | `'1'` | 展區解鎖動畫已播旗標 |

### 檔案位置
| 檔案 | 用途 |
|------|------|
| `src/components/CollectionComplete.jsx` | 全螢幕動畫組件 |
| `src/utils/collectionSync.js` | `checkAndNotifyCompletion` / `sendCompletionEmail` |
| `supabase/functions/send-completion-email/index.ts` | Gmail SMTP Edge Function |
| `src/App.jsx` | `completionData` state + 組件掛載 |

### Admin 測試功能
`/elsontest` → 🧪 測試 tab → **集滿成就動畫** 區塊：
- 🌸 **有 Email**：模擬有 email 用戶，動畫播完直接顯示「第 1 位恭賀」
- 🔗 **LINE 無 Email**：模擬 LINE 用戶，動畫播完顯示 email 輸入表單

兩種模式均為本地預覽（`isTest=true`），**不寄信、不寫資料庫**，可反覆測試。
觸發方式：`onTestCompletion(needsEmail)` → App `setCompletionData({ needsEmail, isTest: true })`

### 重置測試方式（詳見上方「獎品順序」）

---

### Performance Optimization (Completed)

#### Draco + WebP Texture Compression（已完成）
2025-05 完成批次壓縮：96 MB → 15 MB（縮減 84%）
```bash
# 一次壓縮 geometry + texture
npx @gltf-transform/cli optimize input.glb output.glb --compress draco --texture-compress webp
```

#### 牡丹模型減面（已完成）
2025-05-11 對頂點數過高的牡丹模型額外做 mesh simplification：4.06 MB → 1.73 MB（縮減 57%）
```bash
# 1. 減面（ratio=0.1 = 保留 10% 頂點）
npx @gltf-transform/cli simplify --ratio 0.1 --error 0.001 input.glb simplified.glb
# 2. 重新套 Draco + WebP（simplify 會先解壓 Draco）
npx @gltf-transform/cli optimize simplified.glb output.glb --compress draco --texture-compress webp
```
其他偏大模型若未來視覺品質可接受，可比照處理（荷花 2.4 MB、繡球花 2.2 MB、向日葵 1.8 MB）。

#### 展覽模式預載修正（已完成）
`ExhibitionScanPage.jsx` mount 後即預載該 pool 可能出現的所有花模型，
利用使用者閱讀作品介紹頁的時間完成下載，reveal 時秒速顯示。

---

### Performance Optimization (Future)

#### Draco Compression (Recommended)
Compress GLB files to reduce size by 70-90%:
```bash
# Using gltf.report online tool
# Or gltf-pipeline CLI:
npx gltf-pipeline -i model.glb -o model-draco.glb --draco.compressionLevel 10
```

Enable Draco loader:
```javascript
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/')
```

#### Instanced Rendering (For Multiple Flowers)
When displaying 20+ identical flowers, use `InstancedMesh`:
```javascript
const mesh = new THREE.InstancedMesh(geometry, material, count)
// Set transforms per instance
mesh.setMatrixAt(index, matrix)
```

#### Texture Optimization
- Use 512px-1024px textures (not 4K)
- Consider KTX2 format for GPU-optimized textures
- Lazy load textures when needed

#### Loading Progress
Use `LoadingManager` to show progress bar:
```javascript
const manager = new THREE.LoadingManager()
manager.onProgress = (url, loaded, total) => {
  setProgress(loaded / total * 100)
}
```

---

## Vercel 免費額度容量評估（2025-05-11）

### 免費方案（Hobby）硬上限

| 項目 | 月限制 | 換算每日 |
|------|--------|---------|
| **頻寬（Bandwidth）** | 100 GB | ~3.33 GB |
| **Edge Requests** | 1,000,000 次 | ~33,333 次 |
| Serverless Functions | 1,000,000 次 | 本專案不適用（純 SPA） |
| Build 時間 | 6,000 分鐘 | 不是瓶頸 |

### 目前資產大小（2025-05-11 實測）

**JS / CSS Bundle（gzip 後）**

| 資源 | gzip 大小 | 說明 |
|------|----------|------|
| HTML | 4.4 kB | |
| CSS | 6.7 kB | |
| 主 JS（index chunk） | 426 kB | Three.js / Framer Motion / Supabase SDK |
| QRScanPage | 102 kB | 僅 QR 掃碼路徑載入 |
| EmotionScanPage | 344 kB | 面相掃描路徑，face-api 大 chunk |
| 其餘 lazy chunks | ~26 kB | CollectionPage、AuthModal 等 |

**3D 模型（GLB，不再 gzip）**

| 花朵 | 大小 |
|------|------|
| 荷花 | 2.4 MB |
| 繡球花 | 2.2 MB |
| 向日葵 | 1.8 MB |
| 百合花 | 1.7 MB |
| 牡丹（減面後） | 1.7 MB |
| 桜花 | 1.4 MB |
| 薰衣草 | 1.2 MB |
| 虞美人 | 1.0 MB |
| 其餘花朵 | 72 kB – 880 kB |
| **全部合計** | **~20 MB** |
| **平均每朵** | **~1.0 MB** |

### 每位用戶頻寬消耗估算

**首次訪問（瀏覽器無快取）**
- JS/CSS 核心：~438 kB（gzip）
- Lazy chunks：~120 kB
- 一個 3D 模型（均值）：~1,000 kB
- **合計：~1.6 MB / 人**

**回訪用戶（JS/CSS 已快取）**
- 僅模型：~1,000 kB（若瀏覽器未快取）

**面相掃描用戶**
- 額外 +344 kB（EmotionScanPage chunk）

### 每日可承受人數

| 瓶頸 | 計算 | 每日安全上限 |
|------|------|------------|
| 頻寬 3.33 GB/天 | ÷ 1.6 MB/人 | **~2,000 人/天** |
| Edge Requests 33,333 次/天 | ~15 req/人 | **~2,200 人/天** |

**瓶頸在頻寬，安全上限約 1,500–2,000 位新用戶/天。**

### Supabase 免費額度（另計）

| 項目 | 免費額度 | 預估使用量 |
|------|---------|----------|
| MAU | 50,000 人/月 | 遠低於上限 |
| DB 頻寬 | 2 GB/月 | 輕量 JSON，無壓力 |
| Edge Functions | 500,000 次/月 | 僅 `send-completion-email` / `line-auth` |
| DB 大小 | 500 MB | 數千筆 profiles 無問題 |

### 鹽夏不夜埕活動評估（2026/5/16、5/17、5/23）

- 預估單日掃碼人數 500–800 人 → 頻寬消耗 ~1.3 GB（月額度 1.3%）
- 即使爆滿達 1,500 人/天，三天合計 ~7 GB，月底前仍有 93 GB 餘量
- **結論：Vercel 免費方案對本活動規模完全足夠**，不需升級付費方案
