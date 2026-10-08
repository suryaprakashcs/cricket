import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { fetchNotifications, markRead, markAllRead } from '../store/slices/notificationsSlice'

const typeEmoji = { match_created: '🏏', availability_reminder: '⏰', squad_selected: '👑', squad_reserve: '🙏', match_result: '🏁', general: '📢' }

export default function Notifications() {
  const dispatch = useDispatch()
  const { items, unread } = useSelector((s) => s.notifications)

  useEffect(() => {
    dispatch(fetchNotifications(false))
  }, [dispatch])

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-crown-400">🔔 Royal decrees</p>
          <h1 className="font-display text-4xl font-bold text-white">INBOX {unread > 0 && <span className="text-crown-400">({unread})</span>}</h1>
        </div>
        {unread > 0 && (
          <button onClick={() => dispatch(markAllRead())} className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold hover:bg-white/20">
            Mark all read
          </button>
        )}
      </div>
      <div className="mt-4 space-y-3">
        {items.map((n) => (
          <div key={n._id} className={`rounded-2xl border p-4 ${n.read ? 'border-white/10 bg-white/5' : 'border-crown-400/40 bg-crown-400/5'}`}>
            <div className="flex items-start justify-between gap-3">
              <p className="font-bold text-white">{typeEmoji[n.type] || '📢'} {n.title}</p>
              {!n.read && (
                <button onClick={() => dispatch(markRead(n._id))} className="shrink-0 rounded-lg bg-crown-400/20 px-2.5 py-1 text-[11px] font-bold text-crown-400 hover:bg-crown-400/30">
                  Mark read
                </button>
              )}
            </div>
            <p className="mt-1 whitespace-pre-line text-sm text-royal-100/80">{n.message}</p>
            <div className="mt-2 flex items-center gap-3 text-xs">
              <span className="text-royal-100/50">{new Date(n.createdAt).toLocaleString('en-GB')}</span>
              {n.link && <Link to={n.link} className="font-bold text-crown-400 hover:underline">Open →</Link>}
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-royal-100/60">No decrees yet. Play a match to get notified. 👑</p>
        )}
      </div>
    </div>
  )
}
