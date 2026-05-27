import { useState, useEffect } from 'react'
import { supabase, isSupabaseEnabled } from '../lib/supabase'
import { ZONE_THEME, ZONE_ARTWORKS, ARTWORKS } from '../utils/exhibitionConstants'

const VALID_ARTWORK_IDS = new Set(Object.values(ZONE_ARTWORKS).flat()) // A1–A5, B1–B5, C1–C5

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
      <div className="space-y-1.5">
        {days.map(day => {
          const total = day.draw + day.face + day.qr
          let left = 0
          const segs = SERIES.map(({ key, color }) => {
            const w = (day[key] / maxTotal) * 100
            const seg = { key, color, w, left, count: day[key] }
            if (day[key] > 0) left += w
            return seg
          }).filter(s => s.count > 0)

          return (
            <div key={day.date} className="flex items-center gap-2">
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', minWidth: 30, textAlign: 'right', flexShrink: 0 }}>
                {day.label}
              </span>
              <div className="relative flex-1" style={{ height: 18, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                {segs.map((s, idx) => {
                  const first = idx === 0
                  const last  = idx === segs.length - 1
                  return (
                    <div
                      key={s.key}
                      className="absolute top-0 bottom-0 flex items-center justify-center overflow-hidden transition-all duration-500"
                      style={{
                        left: `${s.left}%`,
                        width: `${s.w}%`,
                        background: s.color,
                        borderRadius: `${first ? 4 : 0}px ${last ? 4 : 0}px ${last ? 4 : 0}px ${first ? 4 : 0}px`,
                      }}
                    >
                      <span style={{ fontSize: 7, color: 'rgba(0,0,0,0.65)', fontWeight: 700, lineHeight: 1 }}>
                        {s.count}
                      </span>
                    </div>
                  )
                })}
              </div>
              <span style={{ fontSize: 9, minWidth: 20, flexShrink: 0, color: total > 0 ? 'rgba(255,255,255,0.4)' : 'transparent' }}>
                {total || ''}
              </span>
            </div>
          )
        })}
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

      // 先取管理員 ID，所有統計數據排除管理員的測試行為
      const { data: adminRows } = await supabase.from('admins').select('user_id')
      const adminSet = new Set((adminRows || []).map(a => a.user_id))
      const adminList = [...adminSet]

      const withoutAdmins = (query, field = 'user_id') =>
        adminList.length > 0 ? query.not(field, 'in', `(${adminList.join(',')})`) : query

      // events 的 user_id 可為 null（匿名），要保留；只排管理員
      const withoutAdminsEvents = (query) =>
        adminList.length > 0
          ? query.or(`user_id.is.null,user_id.not.in.(${adminList.join(',')})`)
          : query

      const [
        { count: userCount },
        { data: drawDistRaw },
        { data: rawFaceEvents },
        { data: rawQrRows },
        { data: rawTutorialEvents },
        { data: rawDailyRows },
        { data: rawRatingEvents },
        ,                          // profiles.completion_notified — 未使用，completionCount 來自 sessions
        { data: rawExhibitionCols },
        { data: rawExhibitionSessions },
        { data: drawStatsRaw },
      ] = await Promise.all([
        withoutAdmins(supabase.from('profiles').select('*', { count: 'exact', head: true }), 'id'),
        supabase.rpc('get_draw_distribution_for_admin'),
        withoutAdminsEvents(supabase.from('events').select('user_id').eq('event_type', 'face_scan_complete').order('created_at', { ascending: false })).limit(5000),
        supabase.rpc('get_qr_stats_for_admin'),
        withoutAdminsEvents(supabase.from('events').select('user_id').eq('event_type', 'tutorial_complete').order('created_at', { ascending: false })).limit(5000),
        supabase.rpc('get_daily_events_for_admin', { since_ts: since }),
        supabase.from('events').select('user_id, payload, created_at').eq('event_type', 'rating').order('created_at', { ascending: false }).limit(5000),
        withoutAdmins(supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('completion_notified', true), 'id'),
        supabase.rpc('get_exhibition_collections_for_admin'),
        supabase.from('exhibition_sessions').select('visitor_id, visited, user_id').limit(10000),
        supabase.rpc('get_draw_stats_for_admin'),
      ])

      // 過濾掉管理員的事件（僅剩 PostgREST 查詢需要）
      const notAdmin = e => !adminSet.has(e.user_id)
      const faceEvents     = (rawFaceEvents     || []).filter(notAdmin)
      const tutorialEvents = (rawTutorialEvents || []).filter(notAdmin)
      const ratingEvents   = (rawRatingEvents   || []).filter(notAdmin)

      const tutorialCount = tutorialEvents.length

      // ── 抽卡統計（精確數字來自 SQL 函式）──
      const drawStats      = drawStatsRaw || {}
      const totalDraws     = Number(drawStats.total      || 0)
      const loginDraws     = Number(drawStats.login      || 0)
      const anonDraws      = Number(drawStats.anon       || 0)
      const normalDraws    = Number(drawStats.normal     || 0)
      const exhibitionDraws= Number(drawStats.exhibition || 0)
      const ssrDraws       = Number(drawStats.ssr        || 0)

      // ── 抽卡次數分布（完整資料，來自 SQL 函式）──
      const drawDist       = drawDistRaw || {}
      const loggedInUserCount = Number(drawDist.total_users || 0)
      const avgDraws       = drawDist.avg_draws != null ? String(drawDist.avg_draws) : '0'
      const drawBuckets    = [
        { label: '1–2 次',  count: Number(drawDist.bucket_1_2  || 0) },
        { label: '3–5 次',  count: Number(drawDist.bucket_3_5  || 0) },
        { label: '6–10 次', count: Number(drawDist.bucket_6_10 || 0) },
        { label: '11+ 次',  count: Number(drawDist.bucket_11p  || 0) },
      ]
      const maxBucket = Math.max(...drawBuckets.map(b => b.count), 1)

      // ── 面相統計 ──
      const faceTotal = faceEvents?.length || 0
      const faceLogin = faceEvents?.filter(e => e.user_id).length || 0
      const faceAnon  = faceTotal - faceLogin

      // ── QR 展區統計（完整資料，來自 SQL 函式，僅合法 ID）──
      const zoneCounts = { A: 0, B: 0, C: 0 }
      const workCounts = {}
      ;(rawQrRows || []).forEach(r => {
        if (r.work_id) workCounts[r.work_id] = Number(r.cnt)
        if (r.zone && zoneCounts[r.zone] !== undefined) zoneCounts[r.zone] += Number(r.cnt)
      })
      const zoneData = ['A', 'B', 'C'].map(z => ({
        label: `${z} ${ZONE_THEME[z].name}`,
        value: zoneCounts[z],
        color: ZONE_THEME[z].color,
        artworks: ZONE_ARTWORKS[z].map(id => ({
          id,
          name: ARTWORKS.find(a => a.id === id)?.name || id,
          count: workCounts[id] || 0,
        })),
      }))
      const maxZone = Math.max(...zoneData.map(z => z.value), 1)

      // ── 每日時間序列（從 SQL 函式取得，Asia/Taipei 時區）──
      const dailyRpcMap = {}
      ;(rawDailyRows || []).forEach(r => {
        dailyRpcMap[r.day] = { draw: Number(r.draw_cnt), face: Number(r.face_cnt), qr: Number(r.qr_cnt) }
      })

      const nowTaipei = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Taipei' }))
      const dailyData = []
      for (let i = daysRange - 1; i >= 0; i--) {
        const d = new Date(nowTaipei.getTime() - i * 24 * 60 * 60 * 1000)
        const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        dailyData.push({
          date:  dayKey,
          label: `${d.getMonth() + 1}/${d.getDate()}`,
          ...(dailyRpcMap[dayKey] || { draw: 0, face: 0, qr: 0 }),
        })
      }

      // ── 貼紙兌換資格 & 集滿成就：只計合法展品 ID，排除無效測試掃描 ──
      const validVisited = s => (s.visited || []).filter(id => VALID_ARTWORK_IDS.has(id)).length
      const zoneUnlockCount = (rawExhibitionSessions || [])
        .filter(s => validVisited(s) >= 1 && !adminSet.has(s.user_id))
        .length

      // ── 展覽蒐集花種分布（登入用戶，雲端資料）──
      const exhibitionCols = (rawExhibitionCols || []).filter(r => !adminSet.has(r.user_id))
      const perUserFlowers = {}
      exhibitionCols.forEach(r => {
        if (!perUserFlowers[r.user_id]) perUserFlowers[r.user_id] = new Set()
        perUserFlowers[r.user_id].add(r.flower_id)
      })
      const flowerCounts = Object.values(perUserFlowers).map(s => s.size)
      const exhibitionFlowerBuckets = [
        { label: '1–5 種',  count: flowerCounts.filter(n => n >= 1  && n <= 5).length },
        { label: '6–10 種', count: flowerCounts.filter(n => n >= 6  && n <= 10).length },
        { label: '11–14 種',count: flowerCounts.filter(n => n >= 11 && n <= 14).length },
        { label: '15 種 ✦', count: flowerCounts.filter(n => n >= 15).length },
      ]
      const exhibitionUserCount = flowerCounts.length

      // ── 評分統計 ──
      const ratingDist = [1, 2, 3, 4, 5].map(s => ({
        score: s,
        count: ratingEvents.filter(e => e.payload?.score === s).length,
      }))
      const ratingTotal = ratingEvents.length
      const ratingAvg = ratingTotal > 0
        ? (ratingEvents.reduce((sum, e) => sum + (e.payload?.score || 0), 0) / ratingTotal).toFixed(1)
        : null

      // ── 評分用戶明細 ──
      const raterIds = [...new Set(ratingEvents.filter(e => e.user_id).map(e => e.user_id))]
      let raterProfiles = {}
      if (raterIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, display_name, email').in('id', raterIds)
        ;(profiles || []).forEach(p => { raterProfiles[p.id] = p.display_name || p.email || p.id.slice(0, 8) })
      }
      const ratingList = ratingEvents.map(e => ({
        score: e.payload?.score ?? '?',
        name: e.user_id ? (raterProfiles[e.user_id] || e.user_id.slice(0, 8)) : '訪客',
        time: e.created_at ? new Date(e.created_at).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '',
      }))

      const users = userCount || 0
      setKpi({
        userCount: users,
        totalDraws,
        loginDraws,
        anonDraws,
        loggedInUserCount,
        avgDraws,
        drawBuckets,
        maxBucket,
        faceTotal,
        faceLogin,
        faceAnon,
        normalDraws,
        exhibitionDraws,
        zoneData,
        maxZone,
        tutorialCount,
        tutorialRate: users > 0 ? Math.round((tutorialCount / users) * 100) : 0,
        dailyData,
        ratingDist,
        ratingTotal,
        ratingAvg,
        ratingList,
        completionCount: (rawExhibitionSessions || []).filter(s => validVisited(s) >= 15 && !adminSet.has(s.user_id)).length,
        exhibitionFlowerBuckets,
        exhibitionUserCount,
        ssrDraws,
        zoneUnlockCount,
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
    normalDraws, exhibitionDraws,
    zoneData, maxZone,
    tutorialCount, tutorialRate,
    dailyData,
    ratingDist, ratingTotal, ratingAvg, ratingList,
    completionCount, exhibitionFlowerBuckets, exhibitionUserCount,
    ssrDraws, zoneUnlockCount,
  } = kpi

  return (
    <div className="space-y-5">
      {/* 總覽卡片 */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="累計用戶數"    value={userCount}       color="#a8c4e0" />
        <StatCard label="累計抽卡次數"  value={totalDraws}      sub={`登入 ${loginDraws} ／ 匿名 ${anonDraws}`} color="#F27E93" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="普通模式抽卡"  value={normalDraws}     color="#F2BE5C" />
        <StatCard label="展覽模式抽卡"  value={exhibitionDraws} color="#a78bfa" />
        <StatCard label="SSR 抽中次數"  value={ssrDraws}        sub={`${totalDraws > 0 ? ((ssrDraws / totalDraws) * 100).toFixed(1) : 0}%`} color="#F2BE5C" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="面相掃描次數"  value={faceTotal}       sub={`登入 ${faceLogin} ／ 匿名 ${faceAnon}`}  color="#c4b5fd" />
        <StatCard label="引導完成次數"  value={tutorialCount}   sub={`${tutorialRate}% 完成率`}                 color="#6ee7b7" />
        <StatCard label="貼紙兌換資格"  value={zoneUnlockCount} sub="掃過任一裝置藝術，排除管理員"               color="#34d399" />
        <StatCard label="集滿成就達成"  value={completionCount} sub="掃完全部 15 件裝置藝術"                    color="#fbbf24" />
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
          {userCount} 位登入用戶中，有 {loggedInUserCount} 人曾抽卡，平均 {avgDraws} 次
        </p>
        <div className="space-y-2.5">
          {drawBuckets.map((b, i) => (
            <BarRow key={b.label} label={b.label} value={b.count} max={maxBucket}
              color={['#F27E93', '#F2BE5C', '#a8c4e0', '#c4b5fd'][i]} />
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-white/5">
          <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>全部抽卡次數（累計，含匿名）</p>
          <SplitBar loggedIn={loginDraws} anon={anonDraws} color="#F27E93" />
        </div>
        <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
          <BarRow label="普通模式" value={normalDraws}     max={totalDraws || 1} color="#F2BE5C" />
          <BarRow label="展覽模式" value={exhibitionDraws} max={totalDraws || 1} color="#a78bfa" />
        </div>
      </div>

      {/* 面相 登入/匿名 */}
      <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <p className="text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.7)' }}>面相掃描 登入／匿名</p>
        <SplitBar loggedIn={faceLogin} anon={faceAnon} color="#c4b5fd" />
      </div>

      {/* 展區 QR 掃描 */}
      <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <p className="text-sm font-semibold mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>各展區 QR 掃描次數</p>
        <div className="space-y-3">
          {zoneData.map(z => (
            <div key={z.label}>
              <BarRow label={z.label} value={z.value} max={maxZone} color={z.color} />
              <div className="mt-1 space-y-0.5" style={{ paddingLeft: '5rem', paddingRight: '2.5rem' }}>
                {z.artworks.map(a => (
                  <div key={a.id} className="flex items-center gap-1.5">
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', width: 18, flexShrink: 0 }}>{a.id}</span>
                    <div className="flex-1 rounded-full overflow-hidden" style={{ height: 4, background: 'rgba(255,255,255,0.05)' }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${z.value > 0 ? (a.count / z.value) * 100 : 0}%`, background: z.color + '70' }} />
                    </div>
                    <span style={{ fontSize: 9, width: 22, textAlign: 'right', flexShrink: 0, color: a.count > 0 ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.15)' }}>{a.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 展覽蒐集花種分布 */}
      <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <p className="text-sm font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>展覽蒐集花種分布</p>
        <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
          有展覽蒐集記錄的登入用戶 {exhibitionUserCount} 人（全部用戶 {userCount} 人，未抽展覽或未登入不計）
        </p>
        {exhibitionUserCount === 0 ? (
          <p className="text-xs text-center py-3" style={{ color: 'rgba(255,255,255,0.25)' }}>尚無展覽蒐集資料</p>
        ) : (
          <div className="space-y-2.5">
            {exhibitionFlowerBuckets.map((b, i) => (
              <BarRow key={b.label} label={b.label} value={b.count}
                max={Math.max(...exhibitionFlowerBuckets.map(x => x.count), 1)}
                color={['#a8c4e0', '#6ee7b7', '#F2BE5C', '#F27E93'][i]} />
            ))}
          </div>
        )}
      </div>

      {/* 體驗評分 */}
      <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>體驗評分</p>
          {ratingTotal > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(242,190,92,0.15)', color: '#F2BE5C' }}>
              共 {ratingTotal} 份
            </span>
          )}
        </div>
        {ratingTotal === 0 ? (
          <p className="text-xs text-center py-3" style={{ color: 'rgba(255,255,255,0.25)' }}>尚無評分資料</p>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl font-bold tabular-nums" style={{ color: '#F2BE5C' }}>{ratingAvg}</span>
              <div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(i => (
                    <span key={i} style={{ fontSize: 16, opacity: i <= Math.round(ratingAvg) ? 1 : 0.2 }}>🌸</span>
                  ))}
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>平均分數</p>
              </div>
            </div>
            <div className="space-y-2">
              {[...ratingDist].reverse().map(({ score, count }) => (
                <BarRow key={score} label={`${'🌸'.repeat(score)}`} value={count}
                  max={Math.max(...ratingDist.map(r => r.count), 1)} color="#F2BE5C" />
              ))}
            </div>

            {/* 評分明細列表 */}
            <div className="mt-4 pt-3 border-t border-white/5">
              <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>評分明細</p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {ratingList.map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span style={{ color: 'rgba(255,255,255,0.55)' }}>{r.name}</span>
                    <div className="flex items-center gap-2">
                      <span style={{ color: 'rgba(255,255,255,0.3)' }}>{r.time}</span>
                      <span style={{ minWidth: 40, textAlign: 'right' }}>
                        {'🌸'.repeat(r.score)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
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
