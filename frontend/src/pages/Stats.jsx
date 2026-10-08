import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { fetchTeamStats, fetchPlayerStats, fetchHistory } from '../store/slices/matchesSlice'

export default function Stats() {
  const dispatch = useDispatch()
  const { user } = useSelector((s) => s.auth)
  const { teamStats, myStats, history } = useSelector((s) => s.matches)

  useEffect(() => {
    dispatch(fetchTeamStats())
    dispatch(fetchHistory())
    if (user?._id) dispatch(fetchPlayerStats(user._id))
  }, [dispatch, user?._id])

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-crown-400">📊 Kingdom records</p>
        <h1 className="font-display text-4xl font-bold text-white">STATISTICS</h1>
      </div>

      {teamStats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            ['Matches', teamStats.played], ['🏆 Wins', teamStats.wins], ['😞 Losses', teamStats.losses],
            ['🤝 Draws', teamStats.draws], ['📅 Upcoming', teamStats.upcoming],
          ].map(([k, v]) => (
            <div key={k} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
              <p className="text-[11px] font-bold uppercase tracking-widest text-royal-100/60">{k}</p>
              <p className="font-display text-3xl font-bold text-crown-400">{v}</p>
            </div>
          ))}
        </div>
      )}

      {myStats && (
        <div className="rounded-3xl border border-crown-400/25 bg-white/5 p-6">
          <h2 className="font-display text-2xl font-bold text-white">My record — {user.name}</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
            <div className="rounded-2xl bg-black/30 p-3"><p className="text-[11px] font-bold uppercase text-royal-100/60">Caps (XI)</p><p className="font-display text-2xl font-bold text-white">{myStats.appearances}</p></div>
            <div className="rounded-2xl bg-black/30 p-3"><p className="text-[11px] font-bold uppercase text-royal-100/60">Wins</p><p className="font-display text-2xl font-bold text-white">{myStats.wins}</p></div>
            <div className="rounded-2xl bg-black/30 p-3"><p className="text-[11px] font-bold uppercase text-royal-100/60">MOTM ⭐</p><p className="font-display text-2xl font-bold text-white">{myStats.manOfTheMatch}</p></div>
            <div className="rounded-2xl bg-black/30 p-3"><p className="text-[11px] font-bold uppercase text-royal-100/60">Response rate</p><p className="font-display text-2xl font-bold text-white">{myStats.availability.responseRate}%</p></div>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="font-display text-2xl font-bold text-white">Match history</h2>
        <div className="mt-3 space-y-2">
          {history.map((m) => (
            <Link key={m._id} to={`/matches/${m._id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-black/30 px-4 py-2.5 hover:ring-1 hover:ring-crown-400/40">
              <span className="text-sm font-bold text-white">vs {m.opponent} <span className="font-normal text-royal-100/60">• {new Date(m.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span></span>
              <span className="text-sm font-bold text-crown-400">
                {m.result?.outcome === 'win' ? '🏆 Won' : m.result?.outcome} • {m.result?.ourScore} vs {m.result?.opponentScore}
              </span>
            </Link>
          ))}
          {history.length === 0 && <p className="text-sm text-royal-100/60">No completed matches yet.</p>}
        </div>
      </div>
    </div>
  )
}
