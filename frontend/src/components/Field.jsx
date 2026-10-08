export default function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-royal-100/80">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-royal-100/60">{hint}</span>}
    </label>
  )
}

export const inputCls =
  'w-full rounded-xl border border-white/15 bg-black/30 px-3.5 py-2.5 text-sm text-white placeholder:text-royal-100/40 outline-none focus:border-crown-400/70 focus:ring-2 focus:ring-crown-400/20'
