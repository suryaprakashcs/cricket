import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  fetchMatchDetail, respondAvailability, remindPending,
  selectSquad, announceSquad, recordResult, cancelMatch, clearCurrent,
} from '../store/slices/matchesSlice'
import RespondButtons from '../components/RespondButtons'
import Field, { inputCls } from '../components/Field'

const fmtD = (d) => new Date(d).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })

function GroupList({ title, emoji, players }) {
  return (
    <div className="rounded-2xl bg-black/30 p-4 ring-1 ring-white/10">
      <p className="font-bold text-white">{emoji} {title} <span className="text-crown-400">({players.length})</span></p>
      <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto text-sm">
        {players.map((p) => (
          <li key={p._id} className="flex justify-between gap-2 text-royal-50/90">
            <span>{p.name} <span className="text-royal-100/50">• {p.playerRole}{p.jerseyNumber != null ? ` #${p.jerseyNumber}` : ''}</span></span>
          </li>
        ))}
        {players.length === 0 && <li className="text-xs text-royal-100/40">— none —</li>}
      </ul>
    </div>
  )
}

export default function MatchDetail() {
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const dispatch = useDispatch()
  const nav = useNavigate()
  const { current, lastReminder, status, error } = useSelector((s) => s.matches)
  const { user } = useSelector((s) => s.auth)
  const isLeader = user?.role === 'admin' || user?.role === 'captain'

  const tab = params.get('tab') || 'overview'
  const setTab = (t) => setParams({ tab: t })
  const [msg, setMsg] = useState('')

  // squad draft state
  const [xi, setXi] = useState([])
  const [res, setRes] = useState([])
  const [roles, setRoles] = useState({ captain: '', viceCaptain: '', wicketKeeper: '' })

  // result form
  const [result, setResult] = useState({ ourScore: '', opponentScore: '', outcome: 'win', summary: '', manOfTheMatch: '' })

  useEffect(() => {
    dispatch(fetchMatchDetail(id))
    return () => dispatch(clearCurrent())
  }, [dispatch, id])

  const match = current?.match
  const avail = current?.availability

  useEffect(() => {
    if (match?.squad) {
      setXi((match.squad.playingXI || []).map((p) => (p._id || p).toString()))
      setRes((match.squad.reserves || []).map((p) => (p._id || p).toString()))
      setRoles({
        captain: match.squad.captain?._id || match.squad.captain || '',
        viceCaptain: match.squad.viceCaptain?._id || match.squad.viceCaptain || '',
        wicketKeeper: match.squad.wicketKeeper?._id || match.squad.wicketKeeper || '',
      })
    }
  }, [match?.squad]) // eslint-disable-line react-hooks/exhaustive-deps

  const eligible = useMemo(() => {
    if (!avail) return []
    return [...avail.groups.available, ...avail.groups.maybe]
  }, [avail])

  const byId = useMemo(() => {
    const m = {}
    for (const p of eligible) m[p._id] = p
    return m
  }, [eligible])

  const myStatus = useMemo(() => {
    if (!avail) return null
    for (const k of ['available', 'maybe', 'not_available', 'pending']) {
      if (avail.groups[k]?.some((p) => p._id === user?._id)) return k
    }
    return null
  }, [avail, user])

  if (status === 'loading' && !match) return <p className="py-16 text-center text-royal-100/70">Loading battle plans…</p>
  if (!match) return <p className="py-16 text-center text-red-300">{error || 'Match not found'}</p>

  const toggle = (pid, list, setList, other) => {
    pid = pid.toString()
    if (list.includes(pid)) setList(list.filter((x) => x !== pid))
    else {
      if (other.includes(pid)) { setMsg('❌ A player cannot be in both XI and reserves'); return }
      if (list === xi && list.length >= 11) { setMsg('❌ Playing XI cannot exceed 11'); return }
      if (list === res && list.length >= 5) { setMsg('❌ Reserves cannot exceed 5'); return }
      setList([...list, pid])
    }
    setMsg('')
  }

  const saveSquad = async () => {
    setMsg('')
    const payload = {
      playingXI: xi, reserves: res,
      captain: roles.captain || undefined,
      viceCaptain: roles.viceCaptain || undefined,
      wicketKeeper: roles.wicketKeeper || undefined,
    }
    const r = await dispatch(selectSquad({ id, squad: payload }))
    setMsg(r.meta.requestStatus === 'fulfilled' ? '✅ Squad draft saved.' : `❌ ${r.payload}`)
    if (r.meta.requestStatus === 'fulfilled') dispatch(fetchMatchDetail(id))
  }

  const announce = async () => {
    if (!confirm('Announce the squad? Selected + reserve players will be notified.')) return
    const r = await dispatch(announceSquad(id))
    setMsg(r.meta.requestStatus === 'fulfilled' ? `✅ ${r.payload.message}` : `❌ ${r.payload}`)
    if (r.meta.requestStatus === 'fulfilled') dispatch(fetchMatchDetail(id))
  }

  const remind = async (final) => {
    const r = await dispatch(remindPending({ id, final }))
    setMsg(r.meta.requestStatus === 'fulfilled' ? `✅ ${r.payload.message}` : `❌ ${r.payload}`)
    if (r.meta.requestStatus === 'fulfilled') dispatch(fetchMatchDetail(id))
  }

  const saveResult = async (e) => {
    e.preventDefault()
    const r = await dispatch(recordResult({ id, result: { ...result, manOfTheMatch: result.manOfTheMatch || undefined } }))
    setMsg(r.meta.requestStatus === 'fulfilled' ? '✅ Result recorded. Team notified.' : `❌ ${r.payload}`)
    if (r.meta.requestStatus === 'fulfilled') dispatch(fetchMatchDetail(id))
  }

  const cancel = async () => {
    if (!confirm('Cancel this match?')) return
    const r = await dispatch(cancelMatch(id))
    if (r.meta.requestStatus === 'fulfilled') nav('/matches')
  }

  const counts = avail?.counts
  const xiPop = match.squad?.playingXI || []

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {msg && <div className="mb-4 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm">{msg}</div>}
      {error && <div className="mb-4 rounded-xl border border-out/50 bg-out/15 px-4 py-3 text-sm text-red-200">{error}</div>}

      <div className="overflow-hidden rounded-3xl border border-crown-400/25 bg-gradient-to-r from-royal-900 via-royal-800 to-black p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-crown-400">{match.matchType} • {match.status.replace('_', ' ')}</p>
            <h1 className="mt-1 font-display text-4xl font-bold text-white">KINGS vs {match.opponent}</h1>
            <p className="mt-2 text-sm text-royal-50/90">📅 {fmtD(match.date)} ⏰ {match.time} 📍 {match.venue}</p>
            {match.reportingTime && <p className="text-sm text-royal-50/90">🕗 Report by {match.reportingTime}</p>}
            {match.matchFee > 0 && <p className="text-sm text-crown-400">💰 Match fee ₹{match.matchFee}</p>}
          </div>
          {isLeader && !['completed', 'cancelled'].includes(match.status) && (
            <button onClick={cancel} className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold hover:bg-white/20">Cancel match</button>
          )}
        </div>
        <div className="mt-4 flex gap-2">
          {['overview', 'availability', 'squad', 'result'].map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`rounded-xl px-4 py-2 text-sm font-bold capitalize ${tab === t ? 'bg-crown-400 text-royal-950' : 'bg-white/10 text-royal-50 hover:bg-white/20'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === 'overview' && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="font-display text-2xl font-bold text-white">Match card</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-royal-100/60">Deadline</dt><dd className="font-bold text-white">{new Date(match.availabilityDeadline).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</dd></div>
              <div className="flex justify-between"><dt className="text-royal-100/60">XI selected</dt><dd className="font-bold text-white">{xiPop.length}/11</dd></div>
              <div className="flex justify-between"><dt className="text-royal-100/60">Announced</dt><dd className="font-bold text-white">{match.squad?.announcedAt ? new Date(match.squad.announcedAt).toLocaleString('en-GB') : 'Not yet'}</dd></div>
            </dl>
            {match.notes && <p className="mt-3 rounded-xl bg-black/30 p-3 text-sm text-royal-100/80">📝 {match.notes}</p>}
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="font-display text-2xl font-bold text-white">Your availability</h2>
            <p className="mb-3 text-xs text-royal-100/60">{myStatus && myStatus !== 'pending' ? `Responded: ${myStatus.replace('_', ' ')}` : 'One tap — no free text.'}</p>
            <RespondButtons matchId={id} currentStatus={myStatus} />
          </div>
        </div>
      )}

      {tab === 'availability' && (
        <div className="mt-6 space-y-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-bold text-white">
                {counts ? `${counts.available + counts.maybe} / ${counts.total} Confirmed` : 'Availability'}
              </h2>
              {isLeader && (
                <div className="flex gap-2">
                  <button onClick={() => remind(false)} className="rounded-xl bg-crown-400/20 px-4 py-2 text-sm font-bold text-crown-400 ring-1 ring-crown-400/40 hover:bg-crown-400/30">
                    ⏰ Remind pending ({counts?.pending || 0})
                  </button>
                  <button onClick={() => remind(true)} className="rounded-xl bg-out/20 px-4 py-2 text-sm font-bold text-red-200 ring-1 ring-out/50 hover:bg-out/30">
                    Final reminder
                  </button>
                </div>
              )}
            </div>
            {lastReminder && (
              <div className="mt-3 rounded-xl bg-black/30 p-3 text-xs">
                <p className="font-bold text-crown-400">{lastReminder.message}</p>
                <p className="mt-1 text-royal-100/60">Forward via WhatsApp manually:</p>
                <ul className="mt-1 space-y-1">
                  {lastReminder.data.map((r) => (
                    <li key={r.playerId}><a href={r.whatsappLink} target="_blank" rel="noreferrer" className="text-emerald-300 hover:underline">📲 {r.name}</a></li>
                  ))}
                </ul>
              </div>
            )}
            {counts && (
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-black/40">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-crown-400" style={{ width: `${counts.total ? Math.round(((counts.available + counts.maybe) / counts.total) * 100) : 0}%` }} />
              </div>
            )}
          </div>
          {avail && (
            <div className="grid gap-4 sm:grid-cols-2">
              <GroupList title="Available" emoji="🟢" players={avail.groups.available} />
              <GroupList title="Maybe" emoji="🟡" players={avail.groups.maybe} />
              <GroupList title="Not Available" emoji="🔴" players={avail.groups.not_available} />
              <GroupList title="Pending" emoji="⏳" players={avail.groups.pending} />
            </div>
          )}
        </div>
      )}

      {tab === 'squad' && (
        <div className="mt-6 space-y-4">
          {match.status === 'squad_announced' || match.status === 'completed' ? (
            <div className="rounded-3xl border border-crown-400/30 bg-white/5 p-6">
              <h2 className="font-display text-2xl font-bold text-white">👑 Announced Squad {match.status === 'completed' && <span className="text-sm text-royal-100/60">(final)</span>}</h2>
              <ol className="mt-3 space-y-1.5">
                {xiPop.map((p, i) => (
                  <li key={p._id || p} className="flex items-center justify-between rounded-xl bg-black/30 px-4 py-2 text-sm">
                    <span className="font-bold text-white">{i + 1}. {p.name || p} <span className="font-normal text-royal-100/60">{p.playerRole || ''}</span></span>
                    <span className="space-x-1 text-[11px] font-bold">
                      {(match.squad?.captain?._id || match.squad?.captain)?.toString() === (p._id || p)?.toString() && <span className="rounded bg-crown-400 px-1.5 py-0.5 text-royal-950">C</span>}
                      {(match.squad?.viceCaptain?._id || match.squad?.viceCaptain)?.toString() === (p._id || p)?.toString() && <span className="rounded bg-white/20 px-1.5 py-0.5 text-white">VC</span>}
                      {(match.squad?.wicketKeeper?._id || match.squad?.wicketKeeper)?.toString() === (p._id || p)?.toString() && <span className="rounded bg-white/20 px-1.5 py-0.5 text-white">WK 🧤</span>}
                    </span>
                  </li>
                ))}
              </ol>
              {(match.squad?.reserves?.length > 0) && (
                <>
                  <h3 className="mt-4 font-bold text-royal-100/80">Reserves</h3>
                  <ul className="mt-2 space-y-1.5">
                    {match.squad.reserves.map((p, i) => (
                      <li key={p._id || p} className="rounded-xl bg-black/30 px-4 py-2 text-sm text-royal-50">Reserve #{i + 1} — {p.name || p}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ) : isLeader ? (
            <>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h2 className="font-display text-2xl font-bold text-white">Select Playing XI <span className="text-crown-400">({xi.length}/11)</span></h2>
                <p className="text-xs text-royal-100/60">Only Available 🟢 / Maybe 🟡 players are listed. Tap to add/remove.</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {eligible.map((p) => (
                    <button key={p._id} onClick={() => toggle(p._id, xi, setXi, res)}
                      className={`rounded-xl px-3 py-2 text-left text-sm font-semibold ring-1 ${xi.includes(p._id.toString()) ? 'bg-crown-400 text-royal-950 ring-crown-400' : 'bg-black/30 text-royal-50 ring-white/10 hover:ring-crown-400/50'}`}>
                      {xi.includes(p._id.toString()) ? `${xi.indexOf(p._id.toString()) + 1}. ` : ''}{p.name} • {p.playerRole}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h2 className="font-display text-2xl font-bold text-white">Reserves <span className="text-crown-400">({res.length}/5)</span></h2>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {eligible.filter((p) => !xi.includes(p._id.toString())).map((p) => (
                    <button key={p._id} onClick={() => toggle(p._id, res, setRes, xi)}
                      className={`rounded-xl px-3 py-2 text-left text-sm font-semibold ring-1 ${res.includes(p._id.toString()) ? 'bg-purple-500 text-white ring-purple-400' : 'bg-black/30 text-royal-50 ring-white/10 hover:ring-purple-400/50'}`}>
                      {p.name} • {p.playerRole}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 sm:grid-cols-3">
                {[['captain', 'Captain (C)'], ['viceCaptain', 'Vice-Captain (VC)'], ['wicketKeeper', 'Wicket-Keeper (WK)']].map(([k, label]) => (
                  <Field key={k} label={label}>
                    <select className={inputCls} value={roles[k]} onChange={(e) => setRoles({ ...roles, [k]: e.target.value })}>
                      <option value="" className="text-black">— select from XI —</option>
                      {xi.map((pid) => <option key={pid} value={pid} className="text-black">{byId[pid]?.name || pid}</option>)}
                    </select>
                  </Field>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={saveSquad} className="flex-1 rounded-xl bg-royal-700 py-3 font-bold text-white hover:bg-royal-600">💾 Save Draft</button>
                <button onClick={announce} className="flex-1 rounded-xl bg-crown-400 py-3 font-bold text-royal-950 hover:bg-crown-500">📣 Announce Squad</button>
              </div>
            </>
          ) : (
            <p className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-royal-100/70">Squad not announced yet. Your captain will reveal the XI soon. 👑</p>
          )}
        </div>
      )}

      {tab === 'result' && (
        <div className="mt-6">
          {match.status === 'completed' && match.result ? (
            <div className="rounded-3xl border border-crown-400/30 bg-white/5 p-6 text-center">
              <p className="font-display text-4xl font-bold text-white">
                {match.result.outcome === 'win' ? '🏆 KINGS WIN!' : match.result.outcome === 'loss' ? '😞 Kings fall short' : `🤝 ${match.result.outcome}`}
              </p>
              <p className="mt-2 text-lg text-royal-50">Kings: <b>{match.result.ourScore || '–'}</b> • {match.opponent}: <b>{match.result.opponentScore || '–'}</b></p>
              {match.result.summary && <p className="mx-auto mt-3 max-w-xl text-sm text-royal-100/80">{match.result.summary}</p>}
            </div>
          ) : isLeader ? (
            <form onSubmit={saveResult} className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 sm:grid-cols-2">
              <p className="text-xs text-royal-100/60 sm:col-span-2">Available after squad announcement. Recording notifies the whole team.</p>
              <Field label="Kings Score"><input className={inputCls} value={result.ourScore} onChange={(e) => setResult({ ...result, ourScore: e.target.value })} placeholder="180/6 (20)" /></Field>
              <Field label={`${match.opponent} Score`}><input className={inputCls} value={result.opponentScore} onChange={(e) => setResult({ ...result, opponentScore: e.target.value })} placeholder="175/9 (20)" /></Field>
              <Field label="Outcome">
                <select className={inputCls} value={result.outcome} onChange={(e) => setResult({ ...result, outcome: e.target.value })}>
                  <option value="win" className="text-black">win</option>
                  <option value="loss" className="text-black">loss</option>
                  <option value="draw" className="text-black">draw</option>
                  <option value="tie" className="text-black">tie</option>
                  <option value="no_result" className="text-black">no_result</option>
                </select>
              </Field>
              <Field label="Man of the Match">
                <select className={inputCls} value={result.manOfTheMatch} onChange={(e) => setResult({ ...result, manOfTheMatch: e.target.value })}>
                  <option value="" className="text-black">—</option>
                  {xiPop.map((p) => <option key={p._id || p} value={p._id || p} className="text-black">{p.name || p}</option>)}
                </select>
              </Field>
              <div className="sm:col-span-2"><Field label="Summary"><textarea className={inputCls} rows={3} value={result.summary} onChange={(e) => setResult({ ...result, summary: e.target.value })} placeholder="Kings win by 5 runs! 🎉" /></Field></div>
              <div className="sm:col-span-2"><button className="w-full rounded-xl bg-crown-400 py-3 font-bold text-royal-950 hover:bg-crown-500">RECORD RESULT 🏁</button></div>
            </form>
          ) : (
            <p className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-royal-100/70">No result yet — check back after match day. 🏏</p>
          )}
        </div>
      )}
    </div>
  )
}
