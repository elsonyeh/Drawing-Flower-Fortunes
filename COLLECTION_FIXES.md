# 圖鑑功能修復說明

## ✅ 已修復的問題

### 1. NEW 標籤智能管理 🆕
**問題：** NEW 標籤一直顯示，即使已經查看過卡片

**解決方案：**
- ✅ 新增 `viewedFlowers` localStorage 追蹤系統
- ✅ 點擊卡片時自動標記為已查看
- ✅ NEW 標籤只顯示未查看的最新 3 張卡片
- ✅ 查看後 NEW 標籤立即消失

**技術實現：**
```javascript
// 新增函數
markFlowerAsViewed(flowerId)  // 標記為已查看
isFlowerViewed(flowerId)      // 檢查是否已查看
getViewedFlowers()            // 獲取所有已查看的卡片

// NEW 標籤顯示邏輯
{collected &&
 !isFlowerViewed(flower.id) &&
 collectedIds.indexOf(flower.id) >= collectedIds.length - 3 && (
  <div>NEW</div>
)}
```

### 2. 返回圖鑑路徑修復 🔄
**問題：** 從圖鑑點開卡片後，點擊"返回圖鑑"會回到首頁

**解決方案：**
- ✅ 修改 `handleReset()` 邏輯
- ✅ 自動判斷來源（抽卡 vs 圖鑑）
- ✅ 從圖鑑查看 → 返回圖鑑
- ✅ 從抽卡獲得 → 返回首頁（再抽一次）

**邏輯流程：**
```
首頁抽卡流程：
首頁 → 抽卡動畫 → 結果頁 → [再抽一次] → 首頁 ✅

圖鑑查看流程：
首頁 → 圖鑑 → 點擊卡片 → 結果頁 → [返回圖鑑] → 圖鑑 ✅
```

## 🔧 更新的文件

### 1. `fortuneHelper.js` - 新增查看追蹤功能
```javascript
✅ markFlowerAsViewed(flowerId)
✅ getViewedFlowers()
✅ isFlowerViewed(flowerId)
```

### 2. `CollectionPage.jsx` - 智能 NEW 標籤
```javascript
// 點擊時標記為已查看
onClick={() => {
  if (collected) {
    markFlowerAsViewed(flower.id) // 👈 新增
    onSelectFlower?.(flower)
  }
}}

// 只顯示未查看的 NEW
{collected &&
 !isFlowerViewed(flower.id) &&  // 👈 新增檢查
 collectedIds.indexOf(flower.id) >= collectedIds.length - 3 && (
  <div>NEW</div>
)}
```

### 3. `App.jsx` - 智能返回邏輯
```javascript
const handleReset = () => {
  // 如果是從圖鑑查看，返回圖鑑
  if (viewingFlower) {
    setStage('collection')
    setViewingFlower(null)
  } else {
    // 否則返回首頁（抽卡後）
    setStage('landing')
    setSelectedFlower(null)
  }
}
```

## 📊 localStorage 結構

### viewedFlowers（新增）
```json
[1, 5, 12, 101]  // 已查看的卡片 ID 列表
```

### collectedFlowers（既有）
```json
[
  {
    "id": 1,
    "flower": "櫻花",
    "rarity": "common",
    "collectedAt": "2026-01-20T..."
  }
]
```

## 🎯 使用流程

### 場景 1：首次收集卡片
1. 首頁點擊「抽出今夜的花語」
2. 觀看抽卡動畫
3. 自動收藏 → **顯示 NEW 標籤**
4. 查看結果
5. 點擊「再抽一次」→ 回到首頁 ✅

### 場景 2：查看圖鑑中的 NEW 卡片
1. 點擊右上角「圖鑑」
2. 看到帶 NEW 標籤的卡片
3. **點擊卡片** → NEW 標籤消失 ✅
4. 查看卡片詳情
5. 點擊「返回圖鑑」→ 回到圖鑑 ✅

### 場景 3：重複查看已查看的卡片
1. 在圖鑑中點擊已查看過的卡片
2. 不再顯示 NEW 標籤 ✅
3. 正常查看詳情
4. 返回圖鑑 ✅

## ⭐ NEW 標籤邏輯

**顯示條件（全部滿足才顯示）：**
1. ✅ 卡片已收集
2. ✅ 卡片未被查看過（`!isFlowerViewed`）
3. ✅ 是最新收集的 3 張之一

**不顯示情況：**
- ❌ 未收集的卡片
- ❌ 已查看過的卡片
- ❌ 較早收集的卡片（不在最新 3 張內）

## 🧪 測試建議

### 測試 NEW 標籤消失
```bash
1. 抽 3 張新卡（會顯示 3 個 NEW）
2. 點開其中 1 張查看
3. 返回圖鑑 → 該卡 NEW 標籤消失 ✅
4. 其他 2 張仍顯示 NEW ✅
```

### 測試返回路徑
```bash
# 測試 1：抽卡後返回
首頁 → 抽卡 → 結果 → 再抽一次 → 首頁 ✅

# 測試 2：圖鑑查看後返回
首頁 → 圖鑑 → 卡片 → 結果 → 返回圖鑑 → 圖鑑 ✅

# 測試 3：圖鑑查看後抽新卡
首頁 → 圖鑑 → 卡片 → 返回圖鑑 → 關閉 → 抽卡 → 結果 → 再抽一次 → 首頁 ✅
```

## 🎨 按鈕文字變化

### FortuneResult 組件
```jsx
// 根據來源顯示不同文字
{isFromCollection ? '返回圖鑑' : '再抽一次'}

// isFromCollection = true  → "返回圖鑑"
// isFromCollection = false → "再抽一次"
```

## 🗑️ 清除數據（開發測試用）

```javascript
// 在瀏覽器控制台執行

// 清除所有收藏
localStorage.removeItem('collectedFlowers')

// 清除已查看記錄
localStorage.removeItem('viewedFlowers')

// 重新整理頁面
location.reload()
```

## ✨ 改進效果

### 之前 ❌
- NEW 標籤永遠存在
- 從圖鑑查看後回到首頁
- 無法區分已查看/未查看

### 現在 ✅
- NEW 標籤智能消失
- 返回路徑正確
- 清楚標示新收集的卡片
- 用戶體驗更流暢

---

**所有圖鑑功能已完美修復！** 🎉
