import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { createPlayer } from '../store/slices/playersSlice'
import Field, { inputCls } from '../components/Field'
import { PLAYER_ROLES } from '../components/Navbar'

export default function Manage() {
  const dispatch = useDispatch()
  const nav = useNavigate()
  const { user } = useSelector((s) => s.auth)
  const { error } = useSelector((s) => s.players)
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({
    name: '', age: '', playerRole: 'Batsman', batting: 'Right-Handed', bowling: 'Right-Handed',
    jerseyNumber: '', city: '', phoneNumber: '', password: 'kings123', role: 'player',
  })
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setMsg('')
    const payload = {
      ...form,
      age: Number(form.age),
      jerseyNumber: form.jerseyNumber === '' ? undefined : Number(form.jerseyNumber),
    }
    const res = await dispatch(createPlayer(payload))
    if (res.meta.requestStatus === 'fulfilled') {
      setMsg(`✅ ${form.name} crowned! Royal card created.`)
      nav(`/players/${res.payload._id}`)
    } else setMsg(`❌ ${res.payload}`)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-crown-400">👑 King's War Room • admin only</p>
      <h1 className="mt-1 font-display text-4xl font-bold text-white">CROWN A NEW KING</h1>
      <p className="mt-1 text-sm text-royal-100/70">POST /api/players — admin creates a profile directly. Signed in as <b>{user?.role}</b>.</p>
      {msg && <div className="mt-4 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm">{msg}</div>}
      {error && <div className="mt-2 rounded-xl border border-out/50 bg-out/15 px-4 py-3 text-sm text-red-200">{error}</div>}
      <form onSubmit={submit} className="mt-6 grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 sm:grid-cols-2">
        <Field label="Name *"><input className={inputCls} value={form.name} onChange={set('name')} required /></Field>
        <Field label="Age *"><input className={inputCls} type="number" min="5" value={form.age} onChange={set('age')} required /></Field>
        <Field label="Player Role *">
          <select className={inputCls} value={form.playerRole} onChange={set('playerRole')}>
            {PLAYER_ROLES.map((r) => <option key={r} className="text-black">{r}</option>)}
          </select>
        </Field>
        <Field label="Phone *"><input className={inputCls} value={form.phoneNumber} onChange={set('phoneNumber')} required /></Field>
        <Field label="Batting">
          <select className={inputCls} value={form.batting} onChange={set('batting')}>
            <option className="text-black">Right-Handed</option><option className="text-black">Left-Handed</option>
          </select>
        </Field>
        <Field label="Bowling">
          <select className={inputCls} value={form.bowling} onChange={set('bowling')}>
            <option className="text-black">Right-Handed</option><option className="text-black">Left-Handed</option>
          </select>
        </Field>
        <Field label="Jersey"><input className={inputCls} type="number" value={form.jerseyNumber} onChange={set('jerseyNumber')} /></Field>
        <Field label="City"><input className={inputCls} value={form.city} onChange={set('city')} /></Field>
        <Field label="Temp Password *" hint="Player can change it later via PUT"><input className={inputCls} value={form.password} onChange={set('password')} required /></Field>
        <Field label="Access Role (admin only)">
          <select className={inputCls} value={form.role} onChange={set('role')}>
            <option value="player" className="text-black">player</option>
            <option value="captain" className="text-black">captain</option>
            <option value="admin" className="text-black">admin</option>
          </select>
        </Field>
        <div className="sm:col-span-2">
          <button className="w-full rounded-xl bg-crown-400 py-3 font-display text-lg font-bold text-royal-950 hover:bg-crown-500">CROWN THE KING 👑</button>
        </div>
      </form>
    </div>
  )
}
