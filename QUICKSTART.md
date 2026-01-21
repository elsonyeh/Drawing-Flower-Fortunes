# 快速開始指南

## 📦 安裝

```bash
# 克隆或下載專案後，安裝依賴
npm install
```

## 🚀 啟動開發

```bash
# 啟動開發伺服器
npm run dev
```

開啟瀏覽器訪問 `http://localhost:3000`

## 🎨 自訂內容

### 修改花語資料

編輯 `src/data/flowers.json`，可以：
- 新增更多花語
- 修改現有花語的訊息
- 更新推薦地點

### 調整顏色主題

修改 `tailwind.config.js` 中的 `colors` 設定。

### 修改動畫時間

在 `src/App.jsx` 中調整 `setTimeout` 的數值：

```javascript
setTimeout(() => {
  setStage('result')
}, 4000) // 改變這個數值（毫秒）
```

## 📱 測試手機版

開發伺服器會顯示 Network URL，使用手機瀏覽器訪問該地址進行測試。

## 🏗️ 建置部署

```bash
# 建置生產版本
npm run build

# 預覽建置結果
npm run preview
```

## 🚢 部署選項

### Vercel（推薦）
1. 安裝 Vercel CLI：`npm i -g vercel`
2. 執行：`vercel`
3. 跟隨指示完成部署

### Netlify
1. 拖放 `dist` 資料夾到 Netlify
2. 或使用 Netlify CLI

### GitHub Pages
1. 修改 `vite.config.js` 加入 `base: '/repository-name/'`
2. 執行 `npm run build`
3. 將 `dist` 資料夾內容推送到 `gh-pages` 分支

## ⚡ 效能優化建議

1. **圖片優化**：如使用實際花朵圖片，請壓縮至適當大小
2. **3D 模型**：如使用自訂 3D 模型，確保檔案小於 500KB
3. **字體**：考慮使用系統字體或子集化中文字體

## 🐛 常見問題

### 3D 效果不顯示
- 確認瀏覽器支援 WebGL
- 檢查 Console 是否有錯誤訊息

### 動畫卡頓
- 減少背景粒子數量（在 `LandingPage.jsx` 中）
- 簡化 3D 花瓣數量（在 `FlowerBloom.jsx` 中）

### 手機版樣式問題
- 使用瀏覽器開發者工具的裝置模擬器測試
- 調整 Tailwind 的響應式斷點

## 📞 需要協助？

查看 `CONTRIBUTING.md` 或開啟 Issue 討論。
