import { motion } from 'framer-motion'

export default function LoadingScreen() {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        /* 從右上角琥珀金 → 左下角深桃 → 底部珊瑚，與主背景區隔 */
        background: [
          'radial-gradient(ellipse 80% 70% at 85% 5%, rgba(242,190,92,0.35) 0%, transparent 55%)',
          'radial-gradient(ellipse 70% 60% at 15% 95%, rgba(242,126,147,0.30) 0%, transparent 55%)',
          'linear-gradient(135deg, #100e1c 0%, #1a1228 50%, #0f1020 100%)',
        ].join(', '),
      }}
    >
      {/* 穀物紋理 */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.06,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.78' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='250' height='250' filter='url(%23g)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '250px 250px',
        }}
      />

      {/* 中央文字 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative flex flex-col items-center gap-4"
      >
        <motion.p
          className="text-4xl font-bold tracking-widest"
          style={{ color: 'rgba(242,210,180,0.90)' }}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          埕花
        </motion.p>

        {/* 細線等待指示 */}
        <div className="w-12 h-px overflow-hidden rounded-full" style={{ background: 'rgba(242,190,92,0.25)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'rgba(242,190,92,0.75)', width: '40%' }}
            animate={{ x: ['-100%', '300%'] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>
    </div>
  )
}
