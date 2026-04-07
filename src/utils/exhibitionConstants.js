/**
 * 展覽共用常數 — 所有元件從這裡引入，不要各自定義
 */
export const ZONE_THEME = {
  A: { name: '呼吸', color: '#a78bfa', tailwind: 'violet-400', desc: '感知自我・內在靜觀' },
  B: { name: '蔓延', color: '#f472b6', tailwind: 'pink-400',   desc: '情緒擴散・與他人連結' },
  C: { name: '共生', color: '#34d399', tailwind: 'emerald-400', desc: '相互依存・紮根共存' },
}

export const ZONE_ARTWORKS = {
  A: ['A1', 'A2', 'A3', 'A4', 'A5'],
  B: ['B1', 'B2', 'B3', 'B4', 'B5'],
  C: ['C1', 'C2', 'C3', 'C4', 'C5'],
}

export const ARTWORKS = [
  { zone: 'A', id: 'A1', name: '當我聽見我',           location: '光榮國小外空地' },
  { zone: 'A', id: 'A2', name: '一瞬花綻',             location: '光榮國小陶壺後空地' },
  { zone: 'A', id: 'A3', name: '炎赫',                 location: '千葉素食館' },
  { zone: 'A', id: 'A4', name: '關於情緒的棲息方式',    location: '國小國中外草地（綠廊）' },
  { zone: 'A', id: 'A5', name: '流金歲月',             location: '光榮國小建築物空隙' },
  { zone: 'B', id: 'B1', name: '花落成流',             location: '欄杆區／光榮國小牆外' },
  { zone: 'B', id: 'B2', name: '情緒共振實驗室',        location: '鹽埕國中外牆花圃' },
  { zone: 'B', id: 'B3', name: '這裡有很多按鈕',        location: '克朗德美術館騎樓' },
  { zone: 'B', id: 'B4', name: '著花',                 location: '巴黎花紙行' },
  { zone: 'B', id: 'B5', name: '花鹽',                 location: '雍之川流古董師交易館' },
  { zone: 'C', id: 'C1', name: '聽見花開：聲與光的共存', location: '沙地里空屋一樓' },
  { zone: 'C', id: 'C2', name: '鹽晶．緣進',            location: '老房間（里長）' },
  { zone: 'C', id: 'C3', name: '起家：紮根',            location: '老房間（居民）' },
  { zone: 'C', id: 'C4', name: '聲綻',                 location: '瑞士大飯店' },
  { zone: 'C', id: 'C5', name: '日常的封存',            location: '岸等' },
]
