import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchPlayerById, updatePlayer, deletePlayer, updatePlayerRole, clearSelected } from '../store/slices/playersSlice'
import Field, { inputCls } from '../components/Field'
import api from '../services/api'
import { ACCESS_ROLES, PLAYER_ROLES, playerRoleIcon, roleColor } from '../components/Navbar'

export default function PlayerDetail() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const nav = useNavigate()
  const { selected, error } = useSelector((s) => s.players)
  const { user } = useSelector((s) => s.auth)

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [newRole, setNewRole] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    dispatch(fetchPlayerById(id))
    return () => dispatch(clearSelected())
  }, [dispatch, id])

  useEffect(() => {
    if (selected) {
      setForm({
        name: selected.name, age: selected.age, playerRole: selected.playerRole,
        batting: selected.batting || '', bowling: selected.bowling || '',
        jerseyNumber: selected.jerseyNumber ?? '', city: selected.city || '',
        phoneNumber: selected.phoneNumber,
      })
      setNewRole(selected.role)
    }
  }, [selected])

  if (!selected) return <p className="mx-auto max-w-3xl px-4 py-16 text-center text-royal-100/70">Loading royal card… {error && <span className="text-red-300">{error}</span>}</p>

  const isOwner = user?._id === selected._id
  const canEdit = isOwner || user?.role === 'admin'
  const canDelete = user?.role === 'admin'
  const canChangeRole = user?.role === 'admin'

  const save = async (e) => {
    e.preventDefault()
    setMsg('')
    const updates = {
      ...form,
      age: Number(form.age),
      jerseyNumber: form.jerseyNumber === '' ? undefined : Number(form.jerseyNumber),
      batting: form.batting || undefined,
      bowling: form.bowling || undefined,
    }
    const res = await dispatch(updatePlayer({ id, updates }))
    if (res.meta.requestStatus === 'fulfilled') { setEditing(false); setMsg('✅ Royal record updated — profile saved.') }
    else setMsg(`❌ ${res.payload}`)
  }

  const onDelete = async () => {
    if (!confirm(`Banish ${selected.name} from the kingdom?`)) return
    const res = await dispatch(deletePlayer(id))
    if (res.meta.requestStatus === 'fulfilled') nav('/')
  }

  const onRoleChange = async () => {
    setMsg('')
    const res = await dispatch(updatePlayerRole({ id, role: newRole }))
    setMsg(res.meta.requestStatus === 'fulfilled' ? `✅ Role updated to '${newRole}'.` : `❌ ${res.payload}`)
  }

  const onToggleActive = async () => {
    setMsg('')
    try {
      const { data } = await api.patch(`/players/${id}/active`, { isActive: !selected.isActive })
      setMsg(`✅ ${data.message}`)
      dispatch(fetchPlayerById(id))
    } catch (e) {
      setMsg(`❌ ${e.response?.data?.message || 'Failed'}`)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {msg && <div className="mb-4 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm">{msg}</div>}
      {error && <div className="mb-4 rounded-xl border border-out/50 bg-out/15 px-4 py-3 text-sm text-red-200">{error}</div>}

      {/* player hero card */}
      <div className="relative overflow-hidden rounded-3xl border border-crown-400/25 bg-gradient-to-br from-royal-800 via-royal-900 to-black p-8">
        <span className="pointer-events-none absolute -right-4 -top-8 font-display text-[180px] font-bold leading-none text-white/5">
          {selected.jerseyNumber ?? '–'}
        </span>
        <div className="flex flex-wrap items-center gap-5">
          <div className="grid h-24 w-24 place-items-center rounded-3xl bg-royal-700 text-5xl ring-2 ring-crown-400/50">
            {playerRoleIcon(selected.playerRole)}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${roleColor(selected.role)}`}>{selected.role}</span>
              <span className="rounded-full bg-crown-400/20 px-3 py-1 text-xs font-bold text-crown-400">{selected.playerRole}</span>
              {selected.isActive === false && <span className="rounded-full bg-out/20 px-3 py-1 text-xs font-bold text-red-200">DEACTIVATED</span>}
            </div>
            <h1 className="mt-2 font-display text-4xl font-bold text-white">{selected.name}</h1>
            <p className="text-sm text-royal-100/80">
              {selected.age} yrs {selected.city && `• ${selected.city}`} • 📞 {selected.phoneNumber}
            </p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
          {[['Jersey', `#${selected.jerseyNumber ?? '–'}`], ['Batting', selected.batting ?? '–'], ['Bowling', selected.bowling ?? '–'], ['Age', `${selected.age}`]].map(([k, v]) => (
            <div key={k} className="rounded-2xl bg-black/40 p-3 ring-1 ring-white/10">
              <p className="text-[11px] font-bold uppercase tracking-widest text-royal-100/60">{k}</p>
              <p className="font-display text-lg font-bold text-white">{v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* edit — PUT /api/players/:id (owner or admin) */}
      <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-white">Edit Royal Card {isOwner && <span className="text-sm text-crown-400">(your card)</span>}</h2>
          {canEdit && (
            <button onClick={() => setEditing(!editing)} className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold hover:bg-white/20">
              {editing ? 'Cancel' : '✏️ Edit'}
            </button>
          )}
        </div>
        {!canEdit && <p className="mt-2 text-sm text-royal-100/60">Only the player or an admin can edit this card (backend: allowSelfOr admin).</p>}
        {editing && canEdit && (
          <form onSubmit={save} className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Name"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
            <Field label="Age"><input className={inputCls} type="number" min="5" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} required /></Field>
            <Field label="Player Role">
              <select className={inputCls} value={form.playerRole} onChange={(e) => setForm({ ...form, playerRole: e.target.value })}>
                {PLAYER_ROLES.map((r) => <option key={r} className="text-black">{r}</option>)}
              </select>
            </Field>
            <Field label="Phone"><input className={inputCls} value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} required /></Field>
            <Field label="Batting">
              <select className={inputCls} value={form.batting} onChange={(e) => setForm({ ...form, batting: e.target.value })}>
                <option value="" className="text-black">—</option><option className="text-black">Right-Handed</option><option className="text-black">Left-Handed</option>
              </select>
            </Field>
            <Field label="Bowling">
              <select className={inputCls} value={form.bowling} onChange={(e) => setForm({ ...form, bowling: e.target.value })}>
                <option value="" className="text-black">—</option><option className="text-black">Right-Handed</option><option className="text-black">Left-Handed</option>
              </select>
            </Field>
            <Field label="Jersey"><input className={inputCls} type="number" value={form.jerseyNumber} onChange={(e) => setForm({ ...form, jerseyNumber: e.target.value })} /></Field>
            <Field label="City"><input className={inputCls} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
            <div className="sm:col-span-2"><button className="w-full rounded-xl bg-crown-400 py-2.5 font-bold text-royal-950 hover:bg-crown-500">Save Changes</button></div>
          </form>
        )}
      </div>

      {/* role — PATCH /:id/role (admin only) */}
      <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="font-display text-2xl font-bold text-white">👑 King's Decree — Access Role</h2>
        <p className="text-xs text-royal-100/60">PATCH /api/players/:id/role — admin only. Cannot demote the last admin.</p>
        {canChangeRole ? (
          <div className="mt-3 flex gap-3">
            <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="flex-1 rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white">
              {ACCESS_ROLES.map((r) => <option key={r} className="text-black">{r}</option>)}
            </select>
            <button onClick={onRoleChange} className="rounded-xl bg-purple-600 px-5 py-2 text-sm font-bold text-white hover:bg-purple-700">Update Role</button>
          </div>
        ) : <p className="mt-2 text-sm text-royal-100/60">Only admins can change access roles.</p>}
        {canDelete && (
          <>
            <button onClick={onToggleActive} className="mt-4 w-full rounded-xl bg-white/10 py-2.5 text-sm font-bold text-royal-50 hover:bg-white/20">
              {selected.isActive === false ? '✅ Reactivate Player' : '⏸️ Deactivate Player (keeps history, blocks login)'}
            </button>
            <button onClick={onDelete} className="mt-2 w-full rounded-xl border border-out/60 bg-out/15 py-2.5 text-sm font-bold text-red-200 hover:bg-out/25">
              🟥 Banish Player (DELETE /api/players/:id — admin only)
            </button>
          </>
        )}
      </div>
    </div>
  )
}
