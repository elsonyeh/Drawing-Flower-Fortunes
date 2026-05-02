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
- **localStorage**: Persistent collection tracking
- **Statistics**: Total cards, SSR count, common count, completion %
- **Gallery**: 2-5 column grid, locked/unlocked states, NEW badges
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
localStorage `chenghua_tutorial_v1` 不存在時，首次進站自動顯示。完成或跳過後寫入此 key。

### 14 步流程（可逐步調整）

| # | type | target (`data-tutorial`) | 觸發下一步 | 說明 |
|---|------|--------------------------|-----------|------|
| 0 | fullscreen | — | 點擊「開始導覽」 | 歡迎畫面 |
| 1 | spotlight | `flowers` | stage → gacha | 引導點擊花束 |
| 2 | banner（上方）| — | stage → result | Gacha 進行中提示 |
| 3 | spotlight | `flower-name` | 點擊「下一步」 | 介紹花名與花語 |
| 4 | spotlight | `flower-story` | 點擊「下一步」 | 介紹花之物語 |
| 5 | spotlight | `locations` | 點擊「下一步」 | 介紹推薦地點 |
| 6 | spotlight | `return-btn` | stage → landing | 引導返回主頁 |
| 7 | spotlight | `collection-btn` | stage → collection | 引導點擊圖鑑 |
| 8 | spotlight | `collection-progress` | 點擊「下一步」 | 介紹蒐集進度 |
| 9 | spotlight | `collection-card` | 點擊卡片（advanceOnClick）| 引導點擊第一張卡 |
| 10 | banner（下方）| — | 點擊「下一步」 | 說明卡片詳情 |
| 11 | spotlight | `back-btn` | stage → landing | 引導關閉圖鑑 |
| 12 | spotlight | `auth-btn` | 點擊「知道了」 | 介紹登入/註冊 |
| 13 | fullscreen | — | 點擊「出發探索！」| 完成導覽 |

### data-tutorial 錨點位置

| 屬性值 | 元件 | 位置說明 |
|--------|------|---------|
| `flowers` | `LandingPage.jsx` | 花束容器 div |
| `collection-btn` | `LandingPage.jsx` | 右上角圖鑑按鈕 |
| `auth-btn` | `LandingPage.jsx` | 右上角登入按鈕 |
| `flower-name` | `FortuneResult.jsx` | 花名 + 花語區塊 |
| `flower-story` | `FortuneResult.jsx` | 花之物語區塊 |
| `locations` | `FortuneResult.jsx` | 推薦探索地點區塊 |
| `return-btn` | `FortuneResult.jsx` | 返回/再抽按鈕 |
| `collection-progress` | `CollectionPage.jsx` | 三格蒐集統計 |
| `collection-card` | `CollectionPage.jsx` | 第一張已收集卡片 |
| `back-btn` | `CollectionPage.jsx` | 關閉圖鑑按鈕（×）|

### 調整方式
- **修改文字**：直接改 `STEPS` 陣列內的 `title` / `body` / `cta`
- **新增步驟**：在 `STEPS` 插入新物件，`type` 可為 `fullscreen` / `spotlight` / `banner`
- **刪除步驟**：從 `STEPS` 移除，progress dots 自動更新
- **改觸發條件**：`advanceOnStage`（等 app stage 變化）/ `advanceOnClick`（等點擊錨點）/ `cta`（手動按鈕）
- **重置導覽**：清除 localStorage `chenghua_tutorial_v1`

### Performance Optimization (Completed)

#### Draco + WebP Texture Compression（已完成）
2025-05 完成批次壓縮：96 MB → 15 MB（縮減 84%）
```bash
# 一次壓縮 geometry + texture
npx @gltf-transform/cli optimize input.glb output.glb --compress draco --texture-compress webp
```

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
