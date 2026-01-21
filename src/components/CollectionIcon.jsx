// SVG圖鑑圖標組件
const CollectionIcon = ({ className = "w-6 h-6", color = "currentColor" }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 書本外框 */}
      <path
        d="M4 6C4 4.89543 4.89543 4 6 4H18C19.1046 4 20 4.89543 20 6V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V6Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 書脊 */}
      <path
        d="M8 4V20"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* 卡片格子 */}
      <rect x="10" y="7" width="3" height="3" fill={color} opacity="0.6" />
      <rect x="14" y="7" width="3" height="3" fill={color} opacity="0.6" />
      <rect x="10" y="11" width="3" height="3" fill={color} opacity="0.6" />
      <rect x="14" y="11" width="3" height="3" fill={color} opacity="0.6" />
      <rect x="10" y="15" width="3" height="3" fill={color} opacity="0.6" />
      <rect x="14" y="15" width="3" height="3" fill={color} opacity="0.6" />
    </svg>
  )
}

export default CollectionIcon
