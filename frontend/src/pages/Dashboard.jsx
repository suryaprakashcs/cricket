import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { fetchMatches, fetchMatchDetail, remindPending } from '../store/slices/matchesSlice'
import { fetchNotifications } from '../store/slices/notificationsSlice'
import RespondButtons from '../components/RespondButtons'

const fmtD = (d) => new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

function NextMatchCard({ match }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-crown-400/25 bg-gradient-to-r from-royal-900 via-royal-800 to-black p-6">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-crown-400">Next Match</p>
      <h1 className="mt-1 font-display text-4xl font-bold text-white md:text-5xl">
        ROYAL KINGS <span className="text-crown-400">vs {match.opponent}</span>
      </h1>
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-royal-50/90">
        <span>📅 {fmtD(match.date)}</span>
        <span>⏰ {match.time}</span>
        <span>📍 {match.venue}</span>
        {match.reportingTime && <span>🕗 Report: {match.reportingTime}</span>}
      </div>
    </div>
  )
}

function myStatus(availability, userId) {
  if (!availability) return null
  for (const k of ['available', 'maybe', 'not_available', 'pending']) {
    if (availability.groups[k]?.some((p) => p._id === userId)) return k
  }
  return null
}

export default function Dashboard() {
  const dispatch = useDispatch()
  const nav = useNavigate()
  const { user } = useSelector((s) => s.auth)
  const { list, current, status } = useSelector((s) => s.matches)
  const { unread } = useSelector((s) => s.notifications)
  const isLeader = user?.role === 'admin' || user?.role === 'captain'

  useEffect(() => {
    dispatch(fetchMatches('upcoming'))
    dispatch(fetchNotifications(false))
  }, [dispatch])

  const next = list[0]
  useEffect(() => {
    if (next) dispatch(fetchMatchDetail(next._id))
  }, [dispatch, next?._id]) // eslint-disable-line react-hooks/exhaustive-deps

  const counts = current?.availability?.counts
  const confirmed = counts ? counts.available + counts.maybe : 0

  const quickRemind = async () => {
    if (!next) return
    const res = await dispatch(remindPending({ id: next._id }))
    if (res.meta.requestStatus === 'fulfilled') {
      await dispatch(fetchMatchDetail(next._id))
      nav(`/matches/${next._id}?tab=availability`)
    }
  }

  const mine = useMemo(() => myStatus(current?.availability, user?._id), [current, user])

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      {status === 'loading' && !next && <p className="text-center text-royal-100/70">Loading kingdom…</p>}

      {!next && status === 'succeeded' && (
        <div className="rounded-3xl border border-dashed border-white/15 p-12 text-center">
          <p className="font-display text-3xl font-bold text-white">🏟️ No upcoming battles</p>
          <p className="mt-2 text-sm text-royal-100/70">
            {isLeader ? 'Create the next match to rally the Kings.' : 'Your captain will announce the next match soon.'}
          </p>
          {isLeader && (
            <Link to="/matches/new" className="mt-4 inline-block rounded-xl bg-crown-400 px-6 py-3 font-bold text-royal-950 hover:bg-crown-500">
              ＋ Create Match
            </Link>
          )}
        </div>
      )}

      {next && (
        <>
          <NextMatchCard match={next} />

          {isLeader ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h2 className="font-display text-2xl font-bold text-white">Availability</h2>
                {counts ? (
                  <>
                    <p className="mt-1 text-sm text-royal-100/70">{confirmed} / {counts.total} Confirmed</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-center text-sm font-bold">
                      <span className="rounded-xl bg-emerald-600/20 px-3 py-2 text-emerald-200">🟢 {counts.available}</span>
                      <span className="rounded-xl bg-crown-400/15 px-3 py-2 text-crown-400">🟡 {counts.maybe}</span>
                      <span className="rounded-xl bg-out/15 px-3 py-2 text-red-200">🔴 {counts.not_available}</span>
                      <span className="rounded-xl bg-white/10 px-3 py-2 text-royal-50">⏳ {counts.pending}</span>
                    </div>
                    <p className="mt-3 text-xs text-royal-100/60">
                      Playing XI: {current?.match.squad?.playingXI?.length || 0}/11 • Reserves: {current?.match.squad?.reserves?.length || 0}
                    </p>
                  </>
                ) : <p className="mt-2 text-sm text-royal-100/60">Loading counts…</p>}
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h2 className="font-display text-2xl font-bold text-white">Captain's Actions</h2>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link to={`/matches/${next._id}?tab=availability`} className="rounded-xl bg-royal-700 px-4 py-3 text-center text-sm font-bold text-white hover:bg-royal-600">View Availability</Link>
                  <button onClick={quickRemind} className="rounded-xl bg-crown-400/20 px-4 py-3 text-sm font-bold text-crown-400 ring-1 ring-crown-400/40 hover:bg-crown-400/30">Send Reminder</button>
                  <Link to={`/matches/${next._id}?tab=squad`} className="rounded-xl bg-purple-600/80 px-4 py-3 text-center text-sm font-bold text-white hover:bg-purple-600">Select Squad</Link>
                  <Link to={`/matches/${next._id}?tab=squad`} className="rounded-xl bg-crown-400 px-4 py-3 text-center text-sm font-bold text-royal-950 hover:bg-crown-500">Notify Team 📣</Link>
                </div>
                {unread > 0 && (
                  <Link to="/notifications" className="mt-3 block text-center text-xs font-bold text-crown-400 hover:underline">
                    🔔 {unread} unread notifications
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h2 className="font-display text-2xl font-bold text-white">Are you available?</h2>
                <p className="mb-3 text-xs text-royal-100/60">
                  {mine && mine !== 'pending' ? `You responded: ${mine.replace('_', ' ')}` : 'Tap one — no free text needed.'}
                </p>
                <RespondButtons matchId={next._id} currentStatus={mine} />
                <Link to={`/matches/${next._id}?tab=squad`} className="mt-4 block text-center text-sm font-bold text-crown-400 hover:underline">
                  View selected squad →
                </Link>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-2xl font-bold text-white">My Inbox</h2>
                  <Link to="/notifications" className="text-xs font-bold text-crown-400 hover:underline">View all</Link>
                </div>
                <p className="mt-2 text-sm text-royal-100/70">
                  {unread > 0 ? `🔔 ${unread} unread — squad news, reminders, results.` : 'All caught up. No new decrees. 👑'}
                </p>
                <Link to="/stats" className="mt-3 block text-center text-sm font-bold text-crown-400 hover:underline">
                  My statistics →
                </Link>
              </div>
            </div>
          )}

          {list.length > 1 && (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="font-display text-2xl font-bold text-white">More upcoming battles</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {list.slice(1, 5).map((m) => (
                  <Link key={m._id} to={`/matches/${m._id}`} className="rounded-2xl bg-black/30 p-4 ring-1 ring-white/10 hover:ring-crown-400/40">
                    <p className="font-bold text-white">vs {m.opponent} <span className="ml-1 text-[11px] font-bold uppercase text-crown-400">{m.matchType}</span></p>
                    <p className="text-xs text-royal-100/70">📅 {fmtD(m.date)} ⏰ {m.time} 📍 {m.venue}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
