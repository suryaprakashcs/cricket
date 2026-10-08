import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../store/slices/authSlice'
import { fetchNotifications } from '../store/slices/notificationsSlice'

export const PLAYER_ROLES = ['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper']
export const ACCESS_ROLES = ['player', 'captain', 'admin']

export function roleColor(role) {
  switch (role) {
    case 'admin': return 'bg-purple-600/20 text-purple-200 border-purple-400/40'
    case 'captain': return 'bg-crown-400/20 text-crown-400 border-crown-400/40'
    default: return 'bg-royal-600/30 text-royal-100 border-royal-600/40'
  }
}

export function playerRoleIcon(playerRole) {
  switch (playerRole) {
    case 'Batsman': return '🏏'
    case 'Bowler': return '🎯'
    case 'All-Rounder': return '⚡'
    case 'Wicket-Keeper': return '🧤'
    default: return '🏏'
  }
}

export default function Navbar() {
  const { user, token } = useSelector((s) => s.auth)
  const { unread } = useSelector((s) => s.notifications)
  const dispatch = useDispatch()
  const nav = useNavigate()

  useEffect(() => {
    if (token) dispatch(fetchNotifications(false))
  }, [dispatch, token])

  const handleLogout = () => {
    dispatch(logout())
    nav('/login')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-crown-400/25 bg-royal-950/90 backdrop-blur">
      <div className="overflow-hidden border-b border-white/5 bg-black/40">
        <div className="animate-ticker flex w-max gap-8 whitespace-nowrap py-1 px-4 text-[11px] font-semibold tracking-widest text-crown-400 uppercase">
          <span>👑 ROYAL KINGS Live • {new Date().getFullYear()} Season</span>
          <span>● Batsmen ready at the crease</span>
          <span>● Bowlers warming up in the nets</span>
          <span>● Admins rule the palace</span>
          <span>👑 ROYAL KINGS Live • {new Date().getFullYear()} Season</span>
          <span>● Batsmen ready at the crease</span>
          <span>● Bowlers warming up in the nets</span>
          <span>● Admins rule the palace</span>
        </div>
      </div>
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-crown-400 to-crown-600 text-2xl shadow-lg shadow-crown-500/20">
            👑
          </div>
          <div>
            <p className="font-display text-xl font-bold leading-none text-white">
              ROYAL<span className="text-crown-400"> KINGS</span>
            </p>
            <p className="text-[11px] tracking-[0.25em] text-royal-100/70 uppercase">Royal Squad Manager</p>
          </div>
        </Link>
        <div className="flex items-center gap-1 text-sm">
          {user ? (
            <>
              <Link to="/" className="rounded-lg px-3 py-2 text-royal-50 hover:bg-white/10">Home</Link>
              <Link to="/matches" className="rounded-lg px-3 py-2 text-royal-50 hover:bg-white/10">Matches</Link>
              <Link to="/squad" className="hidden rounded-lg px-3 py-2 text-royal-50 hover:bg-white/10 sm:inline">Squad</Link>
              <Link to="/stats" className="hidden rounded-lg px-3 py-2 text-royal-50 hover:bg-white/10 sm:inline">Stats</Link>
              <Link to="/notifications" className="relative rounded-lg px-3 py-2 text-royal-50 hover:bg-white/10">
                🔔
                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-out px-1 text-[10px] font-bold text-white">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </Link>
              {user.role === 'admin' && (
                <Link to="/manage" className="hidden rounded-lg px-3 py-2 text-royal-50 hover:bg-white/10 md:inline">War Room</Link>
              )}
              <Link to="/me" className="hidden rounded-lg px-3 py-2 text-royal-50 hover:bg-white/10 lg:inline">My Card</Link>
              <span className={`ml-1 hidden rounded-full border px-2.5 py-1 text-xs font-semibold capitalize md:inline ${roleColor(user.role)}`}>
                {user.role} • #{user.jerseyNumber ?? '–'}
              </span>
              <button onClick={handleLogout} className="ml-2 rounded-lg bg-out px-3.5 py-2 font-semibold text-white hover:brightness-110">
                Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-lg px-3 py-2 text-royal-50 hover:bg-white/10">Login</Link>
              <Link to="/register" className="rounded-lg bg-crown-400 px-4 py-2 font-bold text-royal-950 hover:bg-crown-500">
                Join Kings
              </Link>
            </>
          )}
        </div>
      </nav>
      <div className="seam opacity-60" />
    </header>
  )
}
