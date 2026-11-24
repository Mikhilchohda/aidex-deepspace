import { useState } from 'react'
import { useQuery } from 'deepspace'
import { Link } from 'react-router-dom'
import { ArrowUpRight, MapPin, Search, ShieldCheck } from 'lucide-react'
import { EmptyState, PageHeader, ProgressBar } from '../../../components/aidex/PageKit'
import { GlassCard } from '../../../components/aidex/GlassCard'
import { StatusPill } from '../../../components/aidex/StatusPill'
import type { Campaign } from '../../../types/aidex'
import { lamportsToSol } from '../../../types/aidex'

export default function CampaignsPage() {
  const { records } = useQuery<Campaign>('campaigns', { limit: 100 })
  const [search, setSearch] = useState('')
  const filtered = records.filter(({data}) => data.visibility === 'public' && `${data.title} ${data.ngoName} ${data.location} ${data.category}`.toLowerCase().includes(search.toLowerCase()))
  return <div className="aidex-page space-y-6 pb-12"><PageHeader eyebrow="Donor discovery" title="Fund outcomes, not promises" description="Every campaign publishes its escrow, milestone amounts, verifier threshold, and evidence trail before money can move." /><div className="relative max-w-xl"><Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" /><input className="aidex-input pl-11" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search location, NGO, or impact category" /></div>
    {filtered.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map(row => { const c=row.data; const percent=Number(BigInt(c.fundedLamports||0)*100n/BigInt(c.goalLamports||1)); return <GlassCard key={row.recordId} className="group overflow-hidden"><div className="relative h-36 border-b border-white/10 bg-gradient-to-br from-orange-500/25 via-white/[.03] to-cyan-400/20"><div className="aidex-grid absolute inset-0 opacity-40" /><span className="absolute left-4 top-4"><StatusPill status={c.status} /></span><ShieldCheck className="absolute bottom-4 right-4 h-7 w-7 text-white/22" /></div><div className="p-5"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-orange-300/75">{c.category||'Humanitarian impact'}</p><h3 className="mt-2 text-lg font-semibold">{c.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-white/42">{c.description}</p><p className="mt-4 flex items-center gap-1.5 text-xs text-white/36"><MapPin className="h-3.5 w-3.5" />{c.location} · {c.ngoName}</p><div className="mt-5"><ProgressBar value={percent} /><div className="mt-2 flex justify-between text-[10px] text-white/38"><span>{lamportsToSol(c.fundedLamports)} SOL</span><span>Goal {lamportsToSol(c.goalLamports)} SOL</span></div></div><Link to={`/campaigns/${row.recordId}`} className="mt-5 flex h-10 items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[.04] text-xs font-bold text-white/72 transition group-hover:border-orange-300/25 group-hover:bg-orange-400/[.08]">Inspect escrow <ArrowUpRight className="h-3.5 w-3.5" /></Link></div></GlassCard>})}</div> : <EmptyState title="No matching public campaigns" body="Public campaigns appear after an NGO initializes and seals its on-chain escrow." />}</div>
}
