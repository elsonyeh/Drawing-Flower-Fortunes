# 貢獻指南

感謝你有興趣為「埕花」專案做出貢獻！

## 新增花語資料

1. 編輯 `src/data/flowers.json`
2. 遵循現有的資料結構：
```json
{
  "id": 編號,
  "flower": "花名",
  "meaning": "花語",
  "story": "花的故事（2-3句話）",
  "message": "給使用者的訊息（一句話）",
  "locations": ["地點1", "地點2", "地點3"],
  "color": "#HEX色碼",
  "model": "模型名稱"
}
```

## 調整動畫效果

### 2D 動畫
- 修改 `src/components/FortuneCard.jsx`
- 使用 Framer Motion 的 `motion` 組件

### 3D 動畫
- 修改 `src/components/FlowerBloom.jsx`
- 調整 `FlowerPetals` 組件的參數

## 樣式修改

- 全域樣式：`src/index.css`
- Tailwind 配置：`tailwind.config.js`
- 自訂顏色在 `tailwind.config.js` 的 `theme.extend.colors`

## 測試流程

1. 啟動開發伺服器：`npm run dev`
2. 測試各個流程階段
3. 確保手機版顯示正常
4. 檢查動畫流暢度

## 提交變更

1. 確保程式碼符合 ESLint 規範：`npm run lint`
2. 建置測試：`npm run build`
3. 提供清晰的提交訊息

## 需要幫助？

如有問題，歡迎開 Issue 討論。
