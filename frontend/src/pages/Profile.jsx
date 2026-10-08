import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchMe } from '../store/slices/authSlice'
import { roleColor } from '../components/Navbar'

export default function Profile() {
  const dispatch = useDispatch()
  const { user, token } = useSelector((s) => s.auth)

  useEffect(() => {
    if (token) dispatch(fetchMe()) // GET /api/auth/me
  }, [dispatch, token])

  if (!user) return <p className="py-16 text-center text-royal-100/70">Loading your royal card…</p>

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="overflow-hidden rounded-3xl border border-crown-400/30 bg-gradient-to-b from-royal-800 to-black">
        <div className="bg-royal-stripes p-6 text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-royal-950 text-4xl ring-4 ring-crown-400">👑</div>
          <h1 className="mt-3 font-display text-3xl font-bold text-white">{user.name}</h1>
          <p className="text-sm text-royal-50/80">Jersey #{user.jerseyNumber ?? '–'} • {user.playerRole} • {user.city || '—'}</p>
          <span className={`mt-2 inline-block rounded-full border px-3 py-1 text-xs font-bold uppercase ${roleColor(user.role)}`}>{user.role}</span>
        </div>
        <dl className="grid grid-cols-2 gap-px bg-white/10 text-sm">
          {[
            ['Age', user.age], ['Batting', user.batting || '–'], ['Bowling', user.bowling || '–'],
            ['Phone', user.phoneNumber], ['City', user.city || '–'],
            ['Member since', user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '–'],
          ].map(([k, v]) => (
            <div key={k} className="bg-royal-950/90 p-4">
              <dt className="text-[11px] font-bold uppercase tracking-widest text-royal-100/60">{k}</dt>
              <dd className="mt-0.5 font-semibold text-white">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="px-6 py-4 text-center text-xs text-royal-100/50">Source: GET /api/auth/me • id: {user._id}</p>
      </div>
    </div>
  )
}
