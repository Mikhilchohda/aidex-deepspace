import { cn } from '../../lib/utils'

const colors: Record<string, string> = {
  active: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300',
  approved: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300',
  released: 'border-cyan-400/25 bg-cyan-400/10 text-cyan-300',
  approved_for_funding: 'border-cyan-400/25 bg-cyan-400/10 text-cyan-300',
  under_review: 'border-amber-400/25 bg-amber-400/10 text-amber-300',
  submitted: 'border-amber-400/25 bg-amber-400/10 text-amber-300',
  disputed: 'border-red-400/25 bg-red-400/10 text-red-300',
  rejected: 'border-red-400/25 bg-red-400/10 text-red-300',
}

export function StatusPill({ status }: { status: string }) {
  return (
    <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.14em]', colors[status] ?? 'border-white/15 bg-white/5 text-white/55')}>
      {status.replaceAll('_', ' ')}
    </span>
  )
}
