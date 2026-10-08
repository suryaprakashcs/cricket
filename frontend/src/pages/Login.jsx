import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { loginUser, clearError } from '../store/slices/authSlice'
import Field, { inputCls } from '../components/Field'

export default function Login() {
  const dispatch = useDispatch()
  const nav = useNavigate()
  const { status, error } = useSelector((s) => s.auth)
  const [form, setForm] = useState({ phoneNumber: '', password: '' })

  const submit = async (e) => {
    e.preventDefault()
    const res = await dispatch(loginUser(form))
    if (res.meta.requestStatus === 'fulfilled') nav('/')
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 md:grid-cols-2">
      <div className="hidden flex-col justify-center rounded-3xl border border-crown-400/25 bg-royal-stripes p-8 md:flex">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-crown-400">👑 Royal Kings • Home of Kings</p>
        <h1 className="mt-2 font-display text-5xl font-bold leading-tight text-white">
          WEAR THE<br />CROWN.<br /><span className="text-crown-400">RULE THE GAME.</span>
        </h1>
        <p className="mt-4 text-sm text-royal-50/80">
          Log in with your registered phone number to view the Kings squad, check your player card and rule the palace.
        </p>
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          {[['Batsmen', '🏏'], ['Bowlers', '🎯'], ['All-Round', '⚡']].map(([t, i]) => (
            <div key={t} className="rounded-2xl bg-black/40 p-4 backdrop-blur">
              <div className="text-2xl">{i}</div>
              <div className="mt-1 text-xs font-bold uppercase tracking-widest text-royal-50">{t}</div>
            </div>
          ))}
        </div>
      </div>
      <form onSubmit={submit} className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
        <h2 className="font-display text-3xl font-bold text-white">Enter the Palace</h2>
        <p className="mt-1 text-sm text-royal-100/70">POST /api/auth/login — phoneNumber + password</p>
        {error && (
          <div className="mt-4 rounded-xl border border-out/50 bg-out/15 px-4 py-3 text-sm text-red-200">
            {error} <button type="button" onClick={() => dispatch(clearError())} className="ml-2 underline">dismiss</button>
          </div>
        )}
        <div className="mt-6 space-y-4">
          <Field label="Phone Number">
            <input className={inputCls} placeholder="e.g. 9876543210" value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} required />
          </Field>
          <Field label="Password">
            <input className={inputCls} type="password" placeholder="••••••••" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </Field>
          <button disabled={status === 'loading'}
            className="w-full rounded-xl bg-crown-400 py-3 font-display text-lg font-bold text-royal-950 hover:bg-crown-500 disabled:opacity-60">
            {status === 'loading' ? 'Entering the arena…' : 'LOGIN  →  PLAY FOR THE KINGS'}
          </button>
          <p className="text-center text-sm text-royal-100/70">
            New to the Kings? <Link to="/register" className="font-bold text-crown-400 hover:underline">Register here</Link>
          </p>
        </div>
      </form>
    </div>
  )
}
