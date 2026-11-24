import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from 'deepspace'
import { ExternalLink, Loader2, LockKeyhole, ShieldCheck } from 'lucide-react'
import { GlassCard } from '../../../../components/aidex/GlassCard'
import { PageHeader, ProgressBar, TruncatedAddress } from '../../../../components/aidex/PageKit'
import { StatusPill } from '../../../../components/aidex/StatusPill'
import { useAidexProfile } from '../../../../contexts/AidexProfileContext'
import { callAidexAction } from '../../../../lib/aidex-actions'
import { depositToEscrow, explorerAddress, explorerTransaction } from '../../../../lib/solana'
import type { Campaign, Milestone } from '../../../../types/aidex'
import { lamportsToSol, solToLamports } from '../../../../types/aidex'

export default function CampaignDetailPage() {
  const { campaignId = '' } = useParams()
  const { profile } = useAidexProfile()
  const { records } = useQuery<Campaign>('campaigns', { limit: 100 })
  const { records: milestones } = useQuery<Milestone>('milestones', { where: { campaignId }, limit: 10 })
  const campaign = records.find(row => row.recordId === campaignId)?.data
  const [amount, setAmount] = useState('0.25')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  async function fund() { if (!campaign) return; setBusy(true); setMessage(''); try { const lamports=solToLamports(amount); const tx=await depositToEscrow(campaign.escrowPda,lamports); await callAidexAction('record-aidex-deposit',{campaignId,amountLamports:lamports.toString(),txSignature:tx.signature}); setMessage(`Deposit confirmed: ${tx.signature}`) } catch(e) { setMessage(e instanceof Error?e.message:'Deposit failed') } finally { setBusy(false) } }
  if (!campaign) return <div className="aidex-page"><GlassCard className="p-10 text-center text-white/45">Campaign not found or still loading.</GlassCard></div>
  const percent=Number(BigInt(campaign.fundedLamports||0)*100n/BigInt(campaign.goalLamports||1))
  const sorted=[...milestones].sort((a,b)=>a.data.orderIndex-b.data.orderIndex)
  return <div className="aidex-page space-y-6 pb-12"><PageHeader eyebrow={`${campaign.category} · ${campaign.location}`} title={campaign.title} description={campaign.description} action={<StatusPill status={campaign.status} />} />
    <div className="grid gap-5 xl:grid-cols-[1fr_23rem]"><div className="space-y-5"><GlassCard className="p-6"><div className="flex justify-between text-sm"><span>{lamportsToSol(campaign.fundedLamports)} SOL protected</span><span className="text-white/40">{percent}% of {lamportsToSol(campaign.goalLamports)} SOL</span></div><div className="mt-4"><ProgressBar value={percent} /></div><div className="mt-6 grid gap-3 sm:grid-cols-3">{[['Donors',String(campaign.donorCount)],['Threshold',`${campaign.approvalThreshold} of 3`],['Trust score',campaign.trustScore?`${campaign.trustScore}/100`:'Pending']].map(([l,v])=><div key={l} className="rounded-xl border border-white/[.08] bg-white/[.025] p-4"><p className="text-[9px] uppercase tracking-[.16em] text-white/32">{l}</p><p className="mt-2 font-semibold">{v}</p></div>)}</div></GlassCard>
      <GlassCard className="overflow-hidden"><div className="border-b border-white/10 p-5"><h3 className="aidex-display text-xl">Contracted milestones</h3><p className="mt-2 text-xs text-white/40">Amounts are sealed before donor funding.</p></div><div className="divide-y divide-white/[.07]">{sorted.map((row,i)=><div key={row.recordId} className="p-5"><div className="flex items-start gap-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[.04] text-xs font-bold">{i+1}</span><div className="flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold">{row.data.title}</p><p className="mt-1 text-sm leading-6 text-white/42">{row.data.description}</p></div><StatusPill status={row.data.status} /></div><div className="mt-3 flex flex-wrap gap-4 text-[10px] text-white/35"><span>{lamportsToSol(row.data.amountLamports)} SOL</span><span>Due {new Date(row.data.dueDate).toLocaleDateString()}</span><span>{row.data.approvalCount}/2 approvals</span></div></div></div></div>)}</div></GlassCard></div>
      <div className="space-y-5"><GlassCard className="p-5"><div className="flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-orange-300" /><h3 className="font-semibold">Fund this escrow</h3></div><p className="mt-2 text-xs leading-5 text-white/40">Uses Devnet SOL with no real-money value. Your wallet signs the deposit directly.</p>{profile?.participantRole==='donor'?<><label className="mt-5 block text-[10px] font-bold uppercase tracking-[.15em] text-white/40">Amount in Devnet SOL</label><input className="aidex-input mt-2" value={amount} onChange={e=>setAmount(e.target.value)} /><button className="aidex-primary mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50" disabled={busy||!campaign.escrowPda} onClick={fund}>{busy&&<Loader2 className="h-4 w-4 animate-spin" />}Sign & lock funds</button></>:<p className="mt-5 rounded-xl border border-white/10 bg-white/[.03] p-3 text-xs text-white/45">Use a donor account to demonstrate funding.</p>}{message&&<p className="mt-3 break-all text-xs leading-5 text-cyan-200">{message}</p>}</GlassCard>
      <GlassCard className="p-5"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-cyan-300" /><h3 className="font-semibold">On-chain authority</h3></div><div className="mt-4 space-y-3"><div><p className="text-[9px] uppercase tracking-[.15em] text-white/30">Escrow PDA</p><a href={explorerAddress(campaign.escrowPda)} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-2"><TruncatedAddress value={campaign.escrowPda} /><ExternalLink className="h-3 w-3 text-white/25" /></a></div><div><p className="text-[9px] uppercase tracking-[.15em] text-white/30">Program</p><a href={explorerAddress(campaign.programId)} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-2"><TruncatedAddress value={campaign.programId} /><ExternalLink className="h-3 w-3 text-white/25" /></a></div>{sorted.find(m=>m.data.releaseTxSignature)&&<a className="text-xs text-cyan-200" href={explorerTransaction(sorted.find(m=>m.data.releaseTxSignature)!.data.releaseTxSignature)} target="_blank" rel="noreferrer">View release transaction</a>}</div></GlassCard></div></div>
  </div>
}
