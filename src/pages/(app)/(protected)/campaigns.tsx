import { useMemo, useState } from 'react'
import { useQuery } from 'deepspace'
import { Link } from 'react-router-dom'
import { ArrowUpRight, MapPin, Search, ShieldCheck, SlidersHorizontal, Sparkles, Users } from 'lucide-react'
import { ProgressBar } from '../../../components/aidex/PageKit'
import { GlassCard } from '../../../components/aidex/GlassCard'
import { StatusPill } from '../../../components/aidex/StatusPill'
import { withShowcaseCampaigns } from '../../../data/showcase'
import type { Campaign } from '../../../types/aidex'
import { lamportsToSol } from '../../../types/aidex'

const categories = ['All', 'Healthcare', 'Education', 'Water & sanitation', 'Food security', 'Climate']

export default function CampaignsPage() {
  const { records } = useQuery<Campaign>('campaigns', { limit: 100 })
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const campaigns = useMemo(() => withShowcaseCampaigns(records).filter(({ data }) => data.visibility === 'public'), [records])
  const filtered = campaigns.filter(({ data }) => {
    const matchesSearch = `${data.title} ${data.ngoName} ${data.location} ${data.category}`.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category === 'All' || data.category.toLowerCase() === category.toLowerCase()
    return matchesSearch && matchesCategory
  })

  return <div className="aidex-page space-y-6 pb-12">
    <GlassCard className="relative overflow-hidden p-7 md:p-10">
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/12 via-transparent to-cyan-400/12" />
      <div className="aidex-grid absolute inset-0 opacity-30" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-[11px] font-bold uppercase tracking-[.22em] text-orange-300/85">Discovery terminal</p>
          <h2 className="aidex-display mt-3 text-4xl text-white md:text-6xl">Explore campaigns</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/52">Screen verified NGO opportunities, compare trust profiles, and deploy Devnet SOL into milestone-locked impact rails.</p>
        </div>
        <span className="aidex-chip inline-flex w-fit items-center gap-2 px-4 py-2 text-xs font-semibold text-cyan-100"><Sparkles className="h-4 w-4 text-orange-300" />{filtered.length} opportunities indexed</span>
      </div>
    </GlassCard>

    <div className="grid gap-5 xl:grid-cols-[19rem_1fr]">
      <GlassCard className="h-fit p-5 xl:sticky xl:top-5">
        <div className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4 text-orange-300" /><h3 className="aidex-display text-lg">Filters</h3></div>
        <label className="mt-6 block text-[10px] font-bold uppercase tracking-[.18em] text-white/38">Search</label>
        <div className="relative mt-2"><Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" /><input className="aidex-input pl-11" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Project, NGO, or location" /></div>
        <p className="mt-6 text-[10px] font-bold uppercase tracking-[.18em] text-white/38">Category</p>
        <div className="mt-3 grid grid-cols-2 gap-2 xl:grid-cols-1">
          {categories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={`rounded-xl border px-3 py-2.5 text-left text-xs transition ${category === item ? 'border-white/25 bg-white/[.11] text-white' : 'border-white/[.08] bg-white/[.025] text-white/48 hover:border-white/16 hover:text-white/75'}`}>{item}</button>)}
        </div>
        <div className="mt-6 rounded-2xl border border-cyan-300/12 bg-cyan-300/[.045] p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-100"><ShieldCheck className="h-4 w-4" />Escrow guardrails</div>
          <p className="mt-2 text-xs leading-5 text-white/42">Funds can only leave a campaign PDA through the published milestone rules.</p>
        </div>
      </GlassCard>

      <div>
        {filtered.length ? <div className="grid gap-5 lg:grid-cols-2">{filtered.map((row) => {
          const campaign = row.data
          const percent = Number(BigInt(campaign.fundedLamports || 0) * 100n / BigInt(campaign.goalLamports || 1))
          const letter = campaign.category.charAt(0).toUpperCase()
          return <Link key={row.recordId} to={`/campaigns/${row.recordId}`} className="group block">
            <GlassCard className="h-full overflow-hidden transition duration-300 group-hover:-translate-y-1 group-hover:border-white/25">
              <div className="relative h-48 overflow-hidden border-b border-white/10 bg-gradient-to-br from-orange-500/25 via-[#10111a] to-cyan-400/22">
                <div className="aidex-grid absolute inset-0 opacity-35" />
                <div className="absolute inset-0 flex items-center justify-center text-7xl font-semibold text-white/20">{letter}</div>
                <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-2"><StatusPill status={campaign.status} /><span className="aidex-chip px-2.5 py-1 text-[10px] font-bold text-emerald-200"><ShieldCheck className="mr-1 inline h-3 w-3" />{campaign.trustScore}% trust</span></div>
                  <span className="aidex-chip px-2.5 py-1 text-[10px] text-cyan-100">0/3 failures</span>
                </div>
                <span className="absolute bottom-4 left-4 rounded-full border border-white/20 bg-black/30 px-3 py-1 text-[9px] font-bold uppercase tracking-[.17em] text-white/80">{campaign.category}</span>
                <ArrowUpRight className="absolute bottom-4 right-4 h-5 w-5 text-white/55 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
              <div className="p-5">
                <p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/30">NGO · {campaign.ngoName}</p>
                <h3 className="aidex-display mt-2 text-xl leading-7 text-white">{campaign.title}</h3>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/43">{campaign.description}</p>
                <p className="mt-4 flex items-center gap-1.5 text-xs text-white/38"><MapPin className="h-3.5 w-3.5" />{campaign.location}</p>
                <div className="mt-5"><ProgressBar value={percent} /><div className="mt-2 flex justify-between text-[11px] text-white/42"><span>{lamportsToSol(campaign.fundedLamports)} SOL raised</span><span>{percent}% of {lamportsToSol(campaign.goalLamports)} SOL</span></div></div>
                <div className="mt-4 flex items-center justify-between border-t border-white/[.07] pt-4 text-[11px] text-white/35"><span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{campaign.donorCount} donors</span><span>2-of-3 verification</span></div>
              </div>
            </GlassCard>
          </Link>
        })}</div> : <GlassCard className="p-10 text-center"><p className="text-lg font-semibold">No matching campaigns</p><p className="mt-2 text-sm text-white/42">Try a different impact category or search term.</p></GlassCard>}
      </div>
    </div>
  </div>
}
