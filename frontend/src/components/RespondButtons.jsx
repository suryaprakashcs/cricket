import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { respondAvailability, fetchMatchDetail, fetchMatches } from '../store/slices/matchesSlice'

// Shared availability responder: Available / Maybe / Not Available only.
// After responding, refreshes match detail so counts update instantly.
export default function RespondButtons({ matchId, currentStatus, compact = false }) {
  const dispatch = useDispatch()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const respond = async (status) => {
    setBusy(true)
    setMsg('')
    const res = await dispatch(respondAvailability({ id: matchId, status }))
    setBusy(false)
    if (res.meta.requestStatus === 'fulfilled') {
      await dispatch(fetchMatchDetail(matchId))
      await dispatch(fetchMatches('upcoming'))
    } else {
      setMsg(res.payload)
    }
  }

  const btn = (status, label, cls, activeCls) => (
    <button
      key={status}
      disabled={busy}
      onClick={() => respond(status)}
      className={`rounded-xl px-3 py-2.5 text-sm font-bold transition disabled:opacity-50 ${
        currentStatus === status ? activeCls : cls
      } ${compact ? 'flex-1' : 'flex-1'}`}
    >
      {label}
    </button>
  )

  return (
    <div>
      <div className="flex gap-2">
        {btn('available', '🟢 YES', 'bg-emerald-600/20 text-emerald-200 ring-1 ring-emerald-400/40 hover:bg-emerald-600/35', 'bg-emerald-500 text-white')}
        {btn('maybe', '🟡 MAYBE', 'bg-crown-400/15 text-crown-400 ring-1 ring-crown-400/40 hover:bg-crown-400/30', 'bg-crown-400 text-royal-950')}
        {btn('not_available', '🔴 NO', 'bg-out/15 text-red-200 ring-1 ring-out/50 hover:bg-out/30', 'bg-out text-white')}
      </div>
      {msg && <p className="mt-2 text-xs text-red-300">{msg}</p>}
    </div>
  )
}
