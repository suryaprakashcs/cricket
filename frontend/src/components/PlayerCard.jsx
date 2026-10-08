import { Link } from 'react-router-dom'
import { playerRoleIcon, roleColor } from './Navbar'

export default function PlayerCard({ player }) {
  return (
    <Link
      to={`/players/${player._id}`}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-royal-900 to-royal-950 p-5 shadow-xl transition hover:-translate-y-1 hover:border-crown-400/50 hover:shadow-crown-500/10"
    >
      {/* jersey watermark */}
      <span className="pointer-events-none absolute -right-2 -top-4 font-display text-[88px] font-bold text-white/5 group-hover:text-crown-400/10">
        {player.jerseyNumber ?? '–'}
      </span>
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-royal-800 text-2xl ring-2 ring-crown-400/40">
          {playerRoleIcon(player.playerRole)}
        </div>
        <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${roleColor(player.role)}`}>
          {player.role}
        </span>
      </div>
      <h3 className="mt-3 font-display text-xl font-semibold text-white">{player.name}</h3>
      <p className="text-sm text-royal-100/80">
        {player.playerRole} {player.city ? `• ${player.city}` : ''} {player.age ? `• ${player.age} yrs` : ''}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-semibold">
        {player.batting && <span className="rounded bg-white/10 px-2 py-1">Bat: {player.batting.replace('-Handed','')}</span>}
        {player.bowling && <span className="rounded bg-white/10 px-2 py-1">Bowl: {player.bowling.replace('-Handed','')}</span>}
        {player.jerseyNumber != null && <span className="rounded bg-crown-400/20 px-2 py-1 text-crown-400">#{player.jerseyNumber}</span>}
      </div>
      <p className="mt-3 text-xs text-royal-100/60">📞 {player.phoneNumber}</p>
    </Link>
  )
}
