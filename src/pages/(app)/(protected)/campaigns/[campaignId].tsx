import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from 'deepspace'
import { ArrowLeft, Check, ExternalLink, FileCheck2, Loader2, LockKeyhole, MapPin, RotateCcw, ShieldCheck, Users, WalletCards } from 'lucide-react'
import { GlassCard } from '../../../../components/aidex/GlassCard'
import { ProgressBar, TruncatedAddress } from '../../../../components/aidex/PageKit'
import { StatusPill } from '../../../../components/aidex/StatusPill'
import { useAidexProfile } from '../../../../contexts/AidexProfileContext'
import { findShowcaseCampaign, withShowcaseMilestones } from '../../../../data/showcase'
import { callAidexAction } from '../../../../lib/aidex-actions'
import { depositToEscrow, explorerAddress, explorerTransaction } from '../../../../lib/solana'
import type { Campaign, Milestone } from '../../../../types/aidex'
import { lamportsToSol, solToLamports } from '../../../../types/aidex'

type FundingPhase = 'idle' | 'checking' | 'wallet' | 'confirming' | 'indexing' | 'success' | 'error'

const phaseCopy = {
  checking: 'Checking Devnet escrow…',
  wallet: 'Approve in Phantom…',
  confirming: 'Confirming on Devnet…',
  indexing: 'Indexing receipt…',
} as const

export default function CampaignDetailPage() {
  const { campaignId = '' } = useParams()
  const { profile } = useAidexProfile()
  const { records } = useQuery<Campaign>('campaigns', { limit: 100 })
  const { records: queriedMilestones } = useQuery<Milestone>('milestones', { where: { campaignId }, limit: 10 })
  const persistedCampaign = records.find((row) => row.recordId === campaignId)
  const campaign = persistedCampaign?.data ?? findShowcaseCampaign(campaignId)
  const milestones = useMemo(
    () => withShowcaseMilestones(queriedMilestones, campaignId).sort((a, b) => a.data.orderIndex - b.data.orderIndex),
    [queriedMilestones, campaignId],
  )
  const [amount, setAmount] = useState('0.1')
  const [phase, setPhase] = useState<FundingPhase>('idle')
  const [message, setMessage] = useState('')
  const [signature, setSignature] = useState('')

  if (!campaign) return <div className="aidex-page"><GlassCard className="p-10 text-center text-white/45">Campaign not found or still loading.</GlassCard></div>

  const percent = Math.min(100, Number(BigInt(campaign.fundedLamports || 0) * 100n / BigInt(campaign.goalLamports || 1)))
  const remainingSol = lamportsToSol(BigInt(campaign.goalLamports) - BigInt(campaign.fundedLamports))
  const busy = !['idle', 'success', 'error'].includes(phase)

  async function fund() {
    if (!campaign) return
    let receiptWindow: Window | null = null
    setPhase('checking')
    setMessage('')
    setSignature('')
    try {
      const lamports = solToLamports(amount)
      if (lamports <= 0n) throw new Error('Enter a donation amount greater than zero')
      setPhase('wallet')
      receiptWindow = window.open('', 'aidex-solana-receipt')
      if (receiptWindow) {
        receiptWindow.document.title = 'AIDEX · Waiting for Solana confirmation'
        receiptWindow.document.body.innerHTML = '<div style="min-height:100vh;display:grid;place-items:center;background:#07090e;color:#fff;font:16px system-ui"><p>Waiting for your confirmed Solana Devnet receipt…</p></div>'
      }
      const transaction = await depositToEscrow(campaign.escrowPda, lamports)
      setPhase('confirming')
      setSignature(transaction.signature)
      setPhase('indexing')
      await callAidexAction('record-aidex-deposit', { campaignId, amountLamports: lamports.toString(), txSignature: transaction.signature })
      setPhase('success')
      setMessage('Donation locked in escrow. Your receipt is confirmed on Solana Devnet.')
      const url = explorerTransaction(transaction.signature)
      if (receiptWindow) receiptWindow.location.href = url
      else window.open(url, '_blank', 'noopener,noreferrer')
    } catch (error) {
      receiptWindow?.close()
      setPhase('error')
      setMessage(error instanceof Error ? error.message : 'The escrow deposit failed')
    }
  }

  return <div className="aidex-page space-y-6 pb-12">
    <Link to="/campaigns" className="inline-flex items-center gap-2 text-xs font-semibold text-white/45 transition hover:text-white"><ArrowLeft className="h-4 w-4" />Back to campaign discovery</Link>

    <GlassCard className="relative min-h-[22rem] overflow-hidden p-7 md:p-10">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/25 via-[#0b0c12] to-cyan-400/20" />
      <div className="aidex-grid absolute inset-0 opacity-30" />
      <div className="absolute right-[12%] top-1/2 -translate-y-1/2 text-[12rem] font-semibold text-white/[.035]">{campaign.category.charAt(0)}</div>
      <div className="relative flex min-h-[17rem] flex-col justify-between">
        <div className="flex flex-wrap gap-2"><StatusPill status={campaign.status} /><span className="aidex-chip px-3 py-1.5 text-[10px] font-bold text-emerald-200"><ShieldCheck className="mr-1 inline h-3 w-3" />{campaign.trustScore}% trust</span><span className="aidex-chip px-3 py-1.5 text-[10px] text-cyan-100">0/3 failures</span></div>
        <div className="max-w-5xl"><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-white/46"><MapPin className="h-3.5 w-3.5" />{campaign.location}</p><h1 className="aidex-display mt-4 text-4xl leading-[1.03] text-white md:text-6xl">{campaign.title}</h1><p className="mt-4 text-sm text-white/45">by {campaign.ngoName} · {campaign.category}</p></div>
      </div>
    </GlassCard>

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[
      ['Goal', `${lamportsToSol(campaign.goalLamports)} SOL`],
      ['Protected', `${lamportsToSol(campaign.fundedLamports)} SOL`],
      ['Milestones', String(milestones.length)],
      ['Donors', String(campaign.donorCount)],
    ].map(([label, value]) => <GlassCard key={label} className="p-5 text-center"><p className="aidex-display text-2xl">{value}</p><p className="mt-2 text-[9px] font-bold uppercase tracking-[.18em] text-white/32">{label}</p></GlassCard>)}</div>

    <div className="grid gap-5 xl:grid-cols-[1fr_25rem]">
      <div className="space-y-5">
        <GlassCard className="p-6 md:p-7"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/35">Campaign narrative</p><h2 className="aidex-display mt-2 text-2xl">What this escrow delivers</h2><p className="mt-4 text-sm leading-7 text-white/50">{campaign.description} Evidence is packaged with cryptographic hashes, independently reviewed by a two-of-three verifier committee, and attached to the public ledger before any milestone payment can be released.</p><div className="mt-6 grid gap-3 sm:grid-cols-3">{['Geotagged field evidence', 'Independent 2-of-3 review', 'Automatic refund guardrail'].map((item) => <div key={item} className="rounded-xl border border-white/[.08] bg-white/[.025] p-3 text-xs text-white/54"><Check className="mr-2 inline h-3.5 w-3.5 text-emerald-300" />{item}</div>)}</div></GlassCard>

        <GlassCard className="overflow-hidden"><div className="border-b border-white/10 p-5"><div className="flex items-center gap-2"><FileCheck2 className="h-4 w-4 text-cyan-200" /><h2 className="aidex-display text-xl">Milestone release plan</h2></div><p className="mt-2 text-xs text-white/40">Payment amounts and evidence conditions are sealed before donor funding.</p></div><div className="divide-y divide-white/[.07]">{milestones.map((row, index) => <div key={row.recordId} className="p-5"><div className="flex items-start gap-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[.04] text-xs font-bold">{index + 1}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{row.data.title}</p><p className="mt-2 text-sm leading-6 text-white/42">{row.data.description}</p></div><StatusPill status={row.data.status} /></div><div className="mt-4 flex flex-wrap gap-4 text-[10px] text-white/35"><span>{lamportsToSol(row.data.amountLamports)} SOL</span><span>Due {new Date(row.data.dueDate).toLocaleDateString()}</span><span>{row.data.approvalCount}/{campaign.approvalThreshold} approvals</span></div></div></div></div>)}</div></GlassCard>
      </div>

      <div className="space-y-5 xl:sticky xl:top-5 xl:h-fit">
        <GlassCard className="p-5">
          <div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/35">Funding progress</p><p className="mt-2 text-sm text-white/58">{lamportsToSol(campaign.fundedLamports)} of {lamportsToSol(campaign.goalLamports)} SOL</p></div><span className="aidex-display text-2xl">{percent}%</span></div>
          <div className="mt-4"><ProgressBar value={percent} /></div>
          {persistedCampaign ? <p className="mt-3 text-[10px] text-emerald-200/70">Live DeepSpace campaign record</p> : <p className="mt-3 text-[10px] text-orange-200/70">Indexed showcase campaign · Devnet activation required</p>}
          {profile?.participantRole === 'donor' ? <>
            <label className="mt-6 block text-[10px] font-bold uppercase tracking-[.16em] text-white/40">Amount (Devnet SOL)</label>
            <input type="number" min="0.000001" step="0.1" className="aidex-input mt-2 text-lg" value={amount} onChange={(event) => setAmount(event.target.value)} disabled={busy} />
            <div className="mt-2 grid grid-cols-4 gap-2">{['0.1', '0.5', '1', remainingSol].map((value, index) => <button key={`${value}-${index}`} type="button" onClick={() => setAmount(value)} disabled={busy} className="rounded-xl border border-white/10 bg-white/[.03] py-2 text-[11px] text-white/55 transition hover:border-white/25 hover:text-white">{index === 3 ? 'Max' : value}</button>)}</div>
            <button type="button" className="aidex-primary mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50" disabled={busy || !campaign.escrowPda} onClick={fund}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : phase === 'success' ? <Check className="h-4 w-4" /> : <WalletCards className="h-4 w-4" />}{busy ? phaseCopy[phase as keyof typeof phaseCopy] : phase === 'success' ? 'Donation confirmed' : 'Donate to Escrow'}</button>
          </> : <div className="mt-5 rounded-xl border border-white/10 bg-white/[.03] p-4 text-xs leading-5 text-white/45">Sign in with a donor profile to demonstrate the complete funding transaction.</div>}
          {message && <div className={`mt-4 rounded-xl border p-3 text-xs leading-5 ${phase === 'error' ? 'border-red-400/20 bg-red-400/[.06] text-red-200' : 'border-emerald-300/20 bg-emerald-300/[.05] text-emerald-100'}`}>{message}{phase === 'error' && <button type="button" onClick={() => { setPhase('idle'); setMessage('') }} className="mt-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"><RotateCcw className="h-3 w-3" />Try again</button>}</div>}
          {signature && <a href={explorerTransaction(signature)} target="_blank" rel="noreferrer" className="mt-3 flex items-center justify-between rounded-xl border border-cyan-300/15 bg-cyan-300/[.045] p-3 text-xs text-cyan-100"><span>Open Solana receipt</span><ExternalLink className="h-3.5 w-3.5" /></a>}
          <p className="mt-4 flex gap-2 text-[11px] leading-5 text-white/35"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />Devnet SOL has no real-money value. Funds remain program-controlled and follow milestone or refund rules.</p>
        </GlassCard>

        <GlassCard className="p-5"><div className="flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-orange-300" /><h3 className="font-semibold">On-chain authority</h3></div><div className="mt-4 space-y-4"><div><p className="text-[9px] uppercase tracking-[.15em] text-white/30">Escrow PDA</p><a href={explorerAddress(campaign.escrowPda)} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-2"><TruncatedAddress value={campaign.escrowPda} /><ExternalLink className="h-3 w-3 text-white/25" /></a></div><div><p className="text-[9px] uppercase tracking-[.15em] text-white/30">Program</p><a href={explorerAddress(campaign.programId)} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-2"><TruncatedAddress value={campaign.programId} /><ExternalLink className="h-3 w-3 text-white/25" /></a></div><div className="flex items-center gap-2 text-[11px] text-white/38"><Users className="h-3.5 w-3.5" />{campaign.approvalThreshold}-of-{campaign.verifierWallets.length} verifier quorum</div></div></GlassCard>
      </div>
    </div>
  </div>
}
