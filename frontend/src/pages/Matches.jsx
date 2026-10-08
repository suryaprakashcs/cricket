import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { fetchMatches } from '../store/slices/matchesSlice'

const fmtD = (d) => new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })

export default function Matches() {
  const dispatch = useDispatch()
  const { list, status } = useSelector((s) => s.matches)
  const { user } = useSelector((s) => s.auth)
  const [tab, setTab] = useState('upcoming')
  const isLeader = user?.role === 'admin' || user?.role === 'captain'

  useEffect(() => {
    dispatch(fetchMatches(tab))
  }, [dispatch, tab])

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-crown-400">👑 Royal fixtures</p>
          <h1 className="font-display text-4xl font-bold text-white">MATCHES</h1>
        </div>
        {isLeader && (
          <Link to="/matches/new" className="rounded-xl bg-crown-400 px-5 py-2.5 font-bold text-royal-950 hover:bg-crown-500">
            ＋ Create Match
          </Link>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        {['upcoming', 'past', 'all'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2 text-sm font-bold capitalize ${tab === t ? 'bg-crown-400 text-royal-950' : 'bg-white/10 text-royal-50 hover:bg-white/20'}`}
          >
            {t === 'past' ? 'History' : t}
          </button>
        ))}
      </div>

      {status === 'loading' && <p className="mt-8 text-center text-royal-100/70">Loading fixtures…</p>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {list.map((m) => (
          <Link key={m._id} to={`/matches/${m._id}`} className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:border-crown-400/50">
            <div className="flex items-center justify-between">
              <p className="font-display text-xl font-bold text-white">KINGS vs {m.opponent}</p>
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold uppercase text-royal-100">{m.status.replace('_', ' ')}</span>
            </div>
            <p className="mt-1 text-sm text-royal-100/80">📅 {fmtD(m.date)} ⏰ {m.time}</p>
            <p className="text-sm text-royal-100/80">📍 {m.venue}</p>
            <p className="mt-2 text-xs font-bold uppercase tracking-wide text-crown-400">{m.matchType}</p>
            {m.result?.outcome && (
              <p className="mt-1 text-sm font-bold text-white">
                {m.result.outcome === 'win' ? '🏆 Won' : m.result.outcome === 'loss' ? '😞 Lost' : m.result.outcome} • {m.result.ourScore} vs {m.result.opponentScore}
              </p>
            )}
          </Link>
        ))}
      </div>
      {status === 'succeeded' && list.length === 0 && (
        <p className="mt-8 rounded-2xl border border-dashed border-white/15 p-10 text-center text-royal-100/60">No matches here yet.</p>
      )}
    </div>
  )
}
