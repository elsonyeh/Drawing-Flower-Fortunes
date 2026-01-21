# 圖標組件使用說明

## CollectionIcon - 圖鑑圖標

### 設計概念
專業的書本造型圖鑑圖標，包含：
- 📖 書本外框
- 📚 左側書脊
- 🎴 6個卡片格子（象徵收藏的卡片）

### 視覺預覽
```
┌────────────┐
│ │  ▪️ ▪️  │
│ │  ▪️ ▪️  │
│ │  ▪️ ▪️  │
└────────────┘
```

### 基本使用

```jsx
import CollectionIcon from './components/CollectionIcon'

// 預設使用（白色，24x24px）
<CollectionIcon />

// 自訂大小
<CollectionIcon className="w-4 h-4" />  // 小
<CollectionIcon className="w-5 h-5" />  // 中（推薦）
<CollectionIcon className="w-6 h-6" />  // 大

// 自訂顏色
<CollectionIcon color="white" />
<CollectionIcon color="#FFD700" />
<CollectionIcon color="currentColor" />
```

### 使用場景

#### 1. 首頁圖鑑按鈕
```jsx
<button className="bg-gradient-to-r from-primary-600 to-pink-600">
  <CollectionIcon className="w-5 h-5" color="white" />
  <span>圖鑑</span>
</button>
```

#### 2. 抽卡頁面圖鑑按鈕
```jsx
<button className="absolute top-6 right-6">
  <CollectionIcon className="w-5 h-5" color="white" />
  <span className="hidden sm:inline">圖鑑</span>
</button>
```

#### 3. 其他用途
```jsx
// 導航選單
<nav>
  <CollectionIcon className="w-6 h-6" color="#9370DB" />
</nav>

// 工具提示
<Tooltip icon={<CollectionIcon />}>
  查看收藏
</Tooltip>
```

### Props

| Prop | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| className | string | "w-6 h-6" | Tailwind CSS 類名（控制大小） |
| color | string | "currentColor" | SVG 填充/描邊顏色 |

### 設計細節

**SVG 結構：**
- viewBox: `0 0 24 24`
- stroke-width: `2`
- 6個格子：3行2列布局
- 格子尺寸：3x3
- 格子透明度：60%

**顏色使用：**
- 外框和書脊：實色
- 卡片格子：60% 透明度
- 支持任何顏色值

### 響應式建議

```jsx
// 手機：只顯示圖標
<button className="flex items-center gap-2">
  <CollectionIcon className="w-5 h-5" />
  <span className="hidden sm:inline">圖鑑</span>
</button>

// 平板以上：顯示圖標+文字
<button className="flex items-center gap-2">
  <CollectionIcon className="w-5 h-5 sm:w-6 sm:h-6" />
  <span className="hidden md:inline">查看圖鑑</span>
</button>
```

### 動畫效果

```jsx
// Hover 動畫
<motion.div whileHover={{ scale: 1.1 }}>
  <CollectionIcon />
</motion.div>

// 旋轉動畫
<motion.div
  animate={{ rotate: 360 }}
  transition={{ duration: 2, repeat: Infinity }}
>
  <CollectionIcon />
</motion.div>
```

### 可訪問性

```jsx
// 添加 aria-label
<button aria-label="開啟圖鑑">
  <CollectionIcon />
</button>

// 添加視覺隱藏文字
<button>
  <CollectionIcon />
  <span className="sr-only">圖鑑</span>
</button>
```

### 與其他圖標搭配

```jsx
// 與其他圖標一起使用
<div className="flex gap-4">
  <CollectionIcon className="w-6 h-6" />
  <HomeIcon className="w-6 h-6" />
  <SettingsIcon className="w-6 h-6" />
</div>
```

### 注意事項

1. ✅ **使用 className 控制大小**，不要用內聯樣式
2. ✅ **color prop 支持任何 CSS 顏色值**
3. ✅ **保持寬高比 1:1**
4. ⚠️ 不要過度縮小（最小建議 16x16px）
5. ⚠️ 在深色背景使用淺色，淺色背景使用深色
