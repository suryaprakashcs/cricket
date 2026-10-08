import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser } from '../store/slices/authSlice'
import Field, { inputCls } from '../components/Field'
import { PLAYER_ROLES } from '../components/Navbar'

export default function Register() {
  const dispatch = useDispatch()
  const nav = useNavigate()
  const { status, error, user } = useSelector((s) => s.auth)
  const isAdmin = user?.role === 'admin'

  const [form, setForm] = useState({
    name: '', age: '', playerRole: 'Batsman', batting: 'Right-Handed',
    bowling: 'Right-Handed', jerseyNumber: '', city: '', phoneNumber: '', password: '',
    role: 'player',
  })
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    const payload = {
      ...form,
      age: Number(form.age),
      jerseyNumber: form.jerseyNumber === '' ? undefined : Number(form.jerseyNumber),
      batting: form.batting || undefined,
      bowling: form.bowling || undefined,
      city: form.city || undefined,
      // backend: only admins may set role, others forced to player
      ...(isAdmin ? {} : { role: undefined }),
    }
    const res = await dispatch(registerUser(payload))
    if (res.meta.requestStatus === 'fulfilled') nav('/')
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-crown-400">👑 New Royal King • Claim your throne</p>
        <h2 className="mt-1 font-display text-4xl font-bold text-white">Kings Registration</h2>
        <p className="mt-1 text-sm text-royal-100/70">POST /api/auth/register — name, age, playerRole, phoneNumber, password required</p>
        {error && <div className="mt-4 rounded-xl border border-out/50 bg-out/15 px-4 py-3 text-sm text-red-200">{error}</div>}
        <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Full Name *"><input className={inputCls} value={form.name} onChange={set('name')} required placeholder="Virat Sharma" /></Field>
          <Field label="Age *"><input className={inputCls} type="number" min="5" value={form.age} onChange={set('age')} required placeholder="24" /></Field>
          <Field label="Player Role *">
            <select className={inputCls} value={form.playerRole} onChange={set('playerRole')}>
              {PLAYER_ROLES.map((r) => <option key={r} value={r} className="text-black">{r}</option>)}
            </select>
          </Field>
          <Field label="Phone Number *"><input className={inputCls} value={form.phoneNumber} onChange={set('phoneNumber')} required placeholder="9876543210" /></Field>
          <Field label="Batting Style">
            <select className={inputCls} value={form.batting} onChange={set('batting')}>
              <option value="" className="text-black">—</option>
              <option className="text-black">Right-Handed</option>
              <option className="text-black">Left-Handed</option>
            </select>
          </Field>
          <Field label="Bowling Style">
            <select className={inputCls} value={form.bowling} onChange={set('bowling')}>
              <option value="" className="text-black">—</option>
              <option className="text-black">Right-Handed</option>
              <option className="text-black">Left-Handed</option>
            </select>
          </Field>
          <Field label="Jersey Number"><input className={inputCls} type="number" value={form.jerseyNumber} onChange={set('jerseyNumber')} placeholder="18" /></Field>
          <Field label="City"><input className={inputCls} value={form.city} onChange={set('city')} placeholder="Mumbai" /></Field>
          <Field label="Password * (min 6)"><input className={inputCls} type="password" value={form.password} onChange={set('password')} required placeholder="••••••••" /></Field>
          {isAdmin ? (
            <Field label="Access Role (admin only)" hint="You are admin — you may assign captain / admin">
              <select className={inputCls} value={form.role} onChange={set('role')}>
                <option value="player" className="text-black">player</option>
                <option value="captain" className="text-black">captain</option>
                <option value="admin" className="text-black">admin</option>
              </select>
            </Field>
          ) : (
            <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-royal-100/70">
              Access role defaults to <b className="text-crown-400">player</b>. Only an admin (logged in with a token) can register captain / admin accounts.
            </div>
          )}
          <div className="sm:col-span-2">
            <button disabled={status === 'loading'} className="w-full rounded-xl bg-crown-400 py-3 font-display text-lg font-bold text-royal-950 hover:bg-crown-500 disabled:opacity-60">
              {status === 'loading' ? 'Claiming throne…' : 'REGISTER  →  JOIN ROYAL KINGS 👑'}
            </button>
            <p className="mt-3 text-center text-sm text-royal-100/70">Already a King? <Link to="/login" className="font-bold text-crown-400 hover:underline">Login</Link></p>
          </div>
        </form>
      </div>
    </div>
  )
}
