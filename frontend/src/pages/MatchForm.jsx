import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { createMatch } from '../store/slices/matchesSlice'
import Field, { inputCls } from '../components/Field'

const toLocal = (d) => {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

export default function MatchForm() {
  const dispatch = useDispatch()
  const nav = useNavigate()
  const { error } = useSelector((s) => s.matches)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const next = new Date(Date.now() + 7 * 24 * 3600 * 1000)
  const soon = new Date(Date.now() + 3 * 24 * 3600 * 1000)
  const [form, setForm] = useState({
    opponent: '', matchType: 'Friendly', date: toLocal(next).slice(0, 10),
    time: '9:00 AM', venue: 'Kuttathupatti Ground', reportingTime: '8:30 AM',
    matchFee: '100', availabilityDeadline: toLocal(soon), notes: '',
  })
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setMsg('')
    const payload = {
      ...form,
      matchFee: Number(form.matchFee) || 0,
      date: new Date(form.date + 'T00:00:00'),
      availabilityDeadline: new Date(form.availabilityDeadline),
    }
    const res = await dispatch(createMatch(payload))
    setBusy(false)
    if (res.meta.requestStatus === 'fulfilled') {
      nav(`/matches/${res.payload.data._id}`)
    } else {
      setMsg(res.payload)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-crown-400">👑 New battle decree</p>
      <h1 className="mt-1 font-display text-4xl font-bold text-white">CREATE MATCH</h1>
      <p className="mt-1 text-sm text-royal-100/70">
        Saving creates pending availability for every active player and notifies them instantly — no WhatsApp chasing.
      </p>
      {(msg || error) && <div className="mt-4 rounded-xl border border-out/50 bg-out/15 px-4 py-3 text-sm text-red-200">{msg || error}</div>}
      <form onSubmit={submit} className="mt-6 grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 sm:grid-cols-2">
        <Field label="Opponent *"><input className={inputCls} value={form.opponent} onChange={set('opponent')} required placeholder="KFC" /></Field>
        <Field label="Match Type">
          <select className={inputCls} value={form.matchType} onChange={set('matchType')}>
            {['Friendly', 'League', 'Tournament'].map((t) => <option key={t} className="text-black">{t}</option>)}
          </select>
        </Field>
        <Field label="Match Date *"><input type="date" className={inputCls} value={form.date} onChange={set('date')} required /></Field>
        <Field label="Match Time *"><input className={inputCls} value={form.time} onChange={set('time')} required placeholder="9:00 AM" /></Field>
        <Field label="Venue *"><input className={inputCls} value={form.venue} onChange={set('venue')} required /></Field>
        <Field label="Reporting Time"><input className={inputCls} value={form.reportingTime} onChange={set('reportingTime')} placeholder="8:30 AM" /></Field>
        <Field label="Match Fee (₹)"><input type="number" min="0" className={inputCls} value={form.matchFee} onChange={set('matchFee')} /></Field>
        <Field label="Availability Deadline *" hint="Players must respond before this. Auto-reminder fires 24h prior.">
          <input type="datetime-local" className={inputCls} value={form.availabilityDeadline} onChange={set('availabilityDeadline')} required />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Notes"><textarea className={inputCls} rows={3} value={form.notes} onChange={set('notes')} placeholder="Ball type, whites, umpire…" /></Field>
        </div>
        <div className="sm:col-span-2">
          <button disabled={busy} className="w-full rounded-xl bg-crown-400 py-3 font-display text-lg font-bold text-royal-950 hover:bg-crown-500 disabled:opacity-60">
            {busy ? 'Rallying the Kings…' : 'CREATE & NOTIFY ALL 📣'}
          </button>
        </div>
      </form>
    </div>
  )
}
