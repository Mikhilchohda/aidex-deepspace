import type { ReactNode } from 'react'
import { ArrowUpRight, Inbox } from 'lucide-react'
import { Link } from 'react-router-dom'
import { GlassCard } from './GlassCard'

export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="flex flex-col gap-5 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between"><div className="max-w-3xl"><p className="text-[10px] font-bold uppercase tracking-[.22em] text-orange-300/85">{eyebrow}</p><h2 className="aidex-display mt-2 text-3xl text-white md:text-[2.6rem]">{title}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-white/48">{description}</p></div>{action}</div>
}

export function Metric({ label, value, note, tone = 'orange' }: { label: string; value: string; note: string; tone?: 'orange' | 'cyan' | 'green' | 'white' }) {
  const colors = { orange: 'from-orange-400/20', cyan: 'from-cyan-400/20', green: 'from-emerald-400/20', white: 'from-white/10' }
  return <GlassCard className={`relative overflow-hidden bg-gradient-to-br ${colors[tone]} to-transparent p-5`}><p className="text-[10px] font-bold uppercase tracking-[.17em] text-white/38">{label}</p><p className="aidex-display mt-3 text-3xl text-white">{value}</p><p className="mt-2 text-xs text-white/40">{note}</p></GlassCard>
}

export function EmptyState({ title, body, to, action }: { title: string; body: string; to?: string; action?: string }) {
  return <GlassCard className="flex min-h-56 flex-col items-center justify-center p-8 text-center"><span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[.04]"><Inbox className="h-5 w-5 text-white/38" /></span><h3 className="mt-4 font-semibold text-white">{title}</h3><p className="mt-2 max-w-md text-sm leading-6 text-white/43">{body}</p>{to && action && <Link to={to} className="aidex-primary mt-5 inline-flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-bold transition-all">{action}<ArrowUpRight className="h-3.5 w-3.5" /></Link>}</GlassCard>
}

export function ProgressBar({ value }: { value: number }) {
  return <div className="h-1.5 overflow-hidden rounded-full bg-white/[.07]"><div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-cyan-400" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>
}

export function TruncatedAddress({ value }: { value: string }) {
  return <span className="font-mono text-[11px] text-white/52">{value ? `${value.slice(0, 5)}…${value.slice(-5)}` : 'Not linked'}</span>
}
