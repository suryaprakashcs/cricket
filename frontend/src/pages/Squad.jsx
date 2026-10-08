import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchPlayers, setFilters } from '../store/slices/playersSlice'
import PlayerCard from '../components/PlayerCard'
import { ACCESS_ROLES, PLAYER_ROLES } from '../components/Navbar'

export default function Squad() {
  const dispatch = useDispatch()
  const { list, count, status, error, filters } = useSelector((s) => s.players)
  const { user } = useSelector((s) => s.auth)

  useEffect(() => {
    dispatch(fetchPlayers({ role: filters.role, playerRole: filters.playerRole }))
  }, [dispatch, filters.role, filters.playerRole])

  const visible = useMemo(() => {
    const q = filters.search.trim().toLowerCase()
    if (!q) return list
    return list.filter((p) =>
      [p.name, p.city, p.phoneNumber, String(p.jerseyNumber ?? '')].join(' ').toLowerCase().includes(q)
    )
  }, [list, filters.search])

  const stats = useMemo(() => ({
    Batsman: list.filter((p) => p.playerRole === 'Batsman').length,
    Bowler: list.filter((p) => p.playerRole === 'Bowler').length,
    'All-Rounder': list.filter((p) => p.playerRole === 'All-Rounder').length,
    'Wicket-Keeper': list.filter((p) => p.playerRole === 'Wicket-Keeper').length,
  }), [list])

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="overflow-hidden rounded-3xl border border-crown-400/25 bg-gradient-to-r from-royal-900 via-royal-800 to-black p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-crown-400">
              Royal Team Sheet • {count} kings
            </p>
            <h1 className="mt-1 font-display text-4xl font-bold text-white md:text-5xl">
              THE PLAYING <span className="text-crown-400">XI… & BEYOND</span>
            </h1>
            <div className="mt-3 flex gap-2 text-xs font-bold">
              {Object.entries(stats).map(([k, v]) => (
                <span key={k} className="rounded-full bg-black/40 px-3 py-1.5 text-royal-50 ring-1 ring-white/10">
                  {k}: <span className="text-crown-400">{v}</span>
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-black/50 px-5 py-4 text-center ring-1 ring-crown-400/30">
            <p className="text-[11px] font-bold uppercase tracking-widest text-royal-100/70">Kingdom Strength</p>
            <p className="font-display text-4xl font-bold text-white">{count}<span className="text-crown-400 text-2xl">/{Math.max(count, 11)}</span></p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <select
          value={filters.playerRole}
          onChange={(e) => dispatch(setFilters({ playerRole: e.target.value }))}
          className="rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
        >
          <option value="" className="text-black">All playing roles</option>
          {PLAYER_ROLES.map((r) => <option key={r} value={r} className="text-black">{r}</option>)}
        </select>
        <select
          value={filters.role}
          onChange={(e) => dispatch(setFilters({ role: e.target.value }))}
          className="rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
        >
          <option value="" className="text-black">All access roles</option>
          {ACCESS_ROLES.map((r) => <option key={r} value={r} className="text-black">{r}</option>)}
        </select>
        <input
          value={filters.search}
          onChange={(e) => dispatch(setFilters({ search: e.target.value }))}
          placeholder="Search name / city / jersey… 🔍"
          className="min-w-[200px] flex-1 rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-royal-100/40"
        />
        <button
          onClick={() => dispatch(fetchPlayers({ role: filters.role, playerRole: filters.playerRole }))}
          className="rounded-xl bg-royal-800 px-4 py-2 text-sm font-bold text-white ring-1 ring-crown-400/40 hover:bg-royal-700"
        >
          ↻ Refresh
        </button>
      </div>

      {status === 'loading' && <p className="mt-8 text-center text-royal-100/70">🎙️ Royal heralds reading the team sheet…</p>}
      {error && <p className="mt-6 rounded-xl border border-out/50 bg-out/15 px-4 py-3 text-sm text-red-200">{error}</p>}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((p) => <PlayerCard key={p._id} player={p} />)}
      </div>
      {status === 'succeeded' && visible.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-white/15 p-10 text-center text-royal-100/70">
          🏟️ Empty arena — no kings match this filter. {user?.role === 'admin' ? 'Head to the War Room to sign players.' : 'Ask your admin to add the squad.'}
        </div>
      )}
    </div>
  )
}
