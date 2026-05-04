import { useState, useEffect } from 'react'
import { supabase, isSupabaseEnabled } from '../lib/supabase'
import { ZONE_THEME } from '../utils/exhibitionConstants'

// ── 子元件 ───────────────────────────────────────────────

function StatCard({ label, value, sub, color }) {
  return (
    <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</p>
      <p className="text-3xl font-bold tabular-nums" style={{ color }}>{value ?? '—'}</p>
      {sub && <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{sub}</p>}
    </div>
  )
}

function BarRow({ label, value, max, color }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs w-16 shrink-0 text-right" style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</span>
      <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs w-8 text-right tabular-nums" style={{ color: 'rgba(255,255,255,0.6)' }}>{value}</span>
    </div>
  )
}

function SplitBar({ loggedIn, anon, color }) {
  const total = loggedIn + anon
  if (total === 0) return null
  const loginPct = (loggedIn / total) * 100
  const anonPct  = (anon  / total) * 100
  return (
    <div className="mt-2 space-y-1">
      <div className="flex h-2 rounded-full overflow-hidden gap-px">
        <div className="h-full transition-all duration-700" style={{ width: `${loginPct}%`, background: color }} />
        <div className="h-full transition-all duration-700" style={{ width: `${anonPct}%`, background: 'rgba(255,255,255,0.18)' }} />
      </div>
      <div className="flex gap-3 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
        <span><span style={{ color }}>■</span> 登入 {loggedIn}</span>
        <span><span style={{ color: 'rgba(255,255,255,0.4)' }}>■</span> 匿名 {anon}</span>
      </div>
    </div>
  )
}

// 每日堆疊長條圖
const CHART_H = 80
const SERIES = [
  { key: 'draw', color: '#F27E93', label: '抽卡' },
  { key: 'face', color: '#c4b5fd', label: '面相' },
  { key: 'qr',   color: '#a78bfa', label: 'QR 掃描' },
]

function DailyChart({ days }) {
  if (!days?.length) return null
  const maxTotal = Math.max(...days.map(d => d.draw + d.face + d.qr), 1)

  return (
    <div>
      <div className="overflow-x-auto">
        <div
          className="flex gap-0.5 items-end"
          style={{ minWidth: `${Math.max(days.length * 24, 200)}px`, paddingBottom: 4 }}
        >
          {days.map(day => {
            // 從底部堆疊各系列
            let bottom = 0
            const segs = SERIES.map(({ key, color }) => {
              const h = Math.max(Math.round((day[key] / maxTotal) * CHART_H), day[key] > 0 ? 2 : 0)
              const seg = { key, color, h, bottom }
              if (day[key] > 0) bottom += h
              return seg
            }).filter(s => s.h > 0)

            return (
              <div key={day.date} className="flex-1 flex flex-col items-center" style={{ minWidth: 22 }}>
                <div className="relative w-full" style={{ height: CHART_H }}>
                  {segs.map(({ key, color, h, bottom: b }) => (
                    <div
                      key={key}
                      className="absolute left-0 right-0 transition-all duration-500"
                      style={{ bottom: b, height: h, background: color, borderRadius: b === 0 ? '2px 2px 0 0' : 0 }}
                    />
                  ))}
                </div>
                <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.28)', marginTop: 3, textAlign: 'center', whiteSpace: 'nowrap' }}>
                  {day.label}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* 圖例 */}
      <div className="flex gap-4 mt-3 flex-wrap">
        {SERIES.map(s => (
          <span key={s.key} className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
            <span className="w-2.5 h-2.5 rounded-sm inline-block shrink-0" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── 主元件 ───────────────────────────────────────────────

function KPIDashboard() {
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [kpi, setKpi]           = useState(null)
  const [daysRange, setDaysRange] = useState(14)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const since = new Date(Date.now() - daysRange * 24 * 60 * 60 * 1000).toISOString()

      const [
        { count: userCount },
        { data: drawEvents },
        { data: faceEvents },
        { data: qrEvents },
        { count: tutorialCount },
        { data: timeEvents },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('user_id').eq('event_type', 'draw').limit(10000),
        supabase.from('events').select('user_id').eq('event_type', 'face_scan_complete').limit(5000),
        supabase.from('events').select('payload').eq('event_type', 'qr_scan').limit(10000),
        supabase.from('events').select('*', { count: 'exact', head: true }).eq('event_type', 'tutorial_complete'),
        // 時間序列：只撈選定日期範圍
        supabase.from('events')
          .select('event_type, created_at')
          .gte('created_at', since)
          .in('event_type', ['draw', 'face_scan_complete', 'qr_scan'])
          .order('created_at', { ascending: true })
          .limit(10000),
      ])

      // ── 抽卡統計 ──
      const drawLogin = drawEvents?.filter(e => e.user_id) || []
      const drawAnon  = drawEvents?.filter(e => !e.user_id) || []
      const totalDraws = (drawEvents?.length) || 0

      const perUser = {}
      drawLogin.forEach(e => { perUser[e.user_id] = (perUser[e.user_id] || 0) + 1 })
      const counts = Object.values(perUser)
      const avgDraws = counts.length > 0 ? (counts.reduce((s, n) => s + n, 0) / counts.length).toFixed(1) : '0'
      const drawBuckets = [
        { label: '1–2 次', count: counts.filter(n => n <= 2).length },
        { label: '3–5 次', count: counts.filter(n => n >= 3 && n <= 5).length },
        { label: '6–10 次', count: counts.filter(n => n >= 6 && n <= 10).length },
        { label: '11+ 次', count: counts.filter(n => n > 10).length },
      ]
      const maxBucket = Math.max(...drawBuckets.map(b => b.count), 1)

      // ── 面相統計 ──
      const faceTotal = faceEvents?.length || 0
      const faceLogin = faceEvents?.filter(e => e.user_id).length || 0
      const faceAnon  = faceTotal - faceLogin

      // ── QR 展區統計 ──
      const zoneCounts = { A: 0, B: 0, C: 0 }
      qrEvents?.forEach(e => {
        const z = e.payload?.zone
        if (z && zoneCounts[z] !== undefined) zoneCounts[z]++
      })
      const zoneData = ['A', 'B', 'C'].map(z => ({
        label: `${z} ${ZONE_THEME[z].name}`,
        value: zoneCounts[z],
        color: ZONE_THEME[z].color,
      }))
      const maxZone = Math.max(...zoneData.map(z => z.value), 1)

      // ── 每日時間序列（本地時區）──
      const dailyMap = {}
      timeEvents?.forEach(e => {
        const d   = new Date(e.created_at)
        const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        if (!dailyMap[day]) dailyMap[day] = { draw: 0, face: 0, qr: 0 }
        if (e.event_type === 'draw')               dailyMap[day].draw++
        else if (e.event_type === 'face_scan_complete') dailyMap[day].face++
        else if (e.event_type === 'qr_scan')       dailyMap[day].qr++
      })

      const now = new Date()
      const dailyData = []
      for (let i = daysRange - 1; i >= 0; i--) {
        const d   = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        dailyData.push({
          date:  day,
          label: `${d.getMonth() + 1}/${d.getDate()}`,
          ...(dailyMap[day] || { draw: 0, face: 0, qr: 0 }),
        })
      }

      const users = userCount || 0
      setKpi({
        userCount: users,
        totalDraws,
        loginDraws: drawLogin.length,
        anonDraws:  drawAnon.length,
        loggedInUserCount: counts.length,
        avgDraws,
        drawBuckets,
        maxBucket,
        faceTotal,
        faceLogin,
        faceAnon,
        zoneData,
        maxZone,
        tutorialCount: tutorialCount || 0,
        tutorialRate:  users > 0 ? Math.round((tutorialCount / users) * 100) : 0,
        dailyData,
      })
    } catch (e) {
      setError(e.message || '查詢失敗，請確認 Supabase RLS 設定')
    } finally {
      setLoading(false)
    }
  }

  // daysRange 變更時重新載入
  useEffect(() => {
    if (!isSupabaseEnabled) { setLoading(false); return }
    load()
  }, [daysRange]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!isSupabaseEnabled) {
    return <p className="text-center py-8 text-white/40 text-sm">Supabase 未啟用，無法載入數據</p>
  }

  if (loading) {
    return <p className="text-center py-8 text-white/40 text-sm animate-pulse">載入數據中…</p>
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-sm mb-3" style={{ color: 'rgba(252,165,165,0.7)' }}>{error}</p>
        <button onClick={load} className="text-xs text-white/30 hover:text-white/50 transition-colors">↻ 重試</button>
      </div>
    )
  }

  const {
    userCount, totalDraws, loginDraws, anonDraws, loggedInUserCount, avgDraws,
    drawBuckets, maxBucket,
    faceTotal, faceLogin, faceAnon,
    zoneData, maxZone,
    tutorialCount, tutorialRate,
    dailyData,
  } = kpi

  return (
    <div className="space-y-5">
      {/* 總覽卡片 */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="累計用戶數"   value={userCount}     color="#a8c4e0" />
        <StatCard label="累計抽卡次數" value={totalDraws}    sub={`登入 ${loginDraws} ／ 匿名 ${anonDraws}`} color="#F27E93" />
        <StatCard label="面相掃描次數" value={faceTotal}     sub={`登入 ${faceLogin} ／ 匿名 ${faceAnon}`}   color="#c4b5fd" />
        <StatCard label="引導完成次數" value={tutorialCount} sub={`${tutorialRate}% 完成率`}                  color="#6ee7b7" />
      </div>

      {/* 每日事件趨勢 */}
      <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>每日使用趨勢</p>
          <div className="flex gap-1">
            {[7, 14, 30].map(d => (
              <button
                key={d}
                onClick={() => setDaysRange(d)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                style={daysRange === d
                  ? { background: 'rgba(242,126,147,0.3)', color: '#F27E93', border: '1px solid rgba(242,126,147,0.4)' }
                  : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }
                }
              >
                {d}天
              </button>
            ))}
          </div>
        </div>
        <DailyChart days={dailyData} />
      </div>

      {/* 抽卡次數分布（登入用戶） */}
      <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <p className="text-sm font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>抽卡次數分布</p>
        <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
          登入用戶 {loggedInUserCount} 人，平均 {avgDraws} 次
        </p>
        <div className="space-y-2.5">
          {drawBuckets.map((b, i) => (
            <BarRow key={b.label} label={b.label} value={b.count} max={maxBucket}
              color={['#F27E93', '#F2BE5C', '#a8c4e0', '#c4b5fd'][i]} />
          ))}
        </div>
        <SplitBar loggedIn={loginDraws} anon={anonDraws} color="#F27E93" />
      </div>

      {/* 面相 登入/匿名 */}
      <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <p className="text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.7)' }}>面相掃描 登入／匿名</p>
        <SplitBar loggedIn={faceLogin} anon={faceAnon} color="#c4b5fd" />
      </div>

      {/* 展區 QR 掃描 */}
      <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <p className="text-sm font-semibold mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>各展區 QR 掃描次數</p>
        <div className="space-y-2.5">
          {zoneData.map(z => (
            <BarRow key={z.label} label={z.label} value={z.value} max={maxZone} color={z.color} />
          ))}
        </div>
      </div>

      <div className="text-right pt-1">
        <button
          onClick={load}
          className="text-xs transition-colors"
          style={{ color: 'rgba(255,255,255,0.25)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
        >
          ↻ 重新整理
        </button>
      </div>
    </div>
  )
}

export default KPIDashboard
