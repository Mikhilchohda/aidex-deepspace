import { useState } from 'react'
import { Building2, Check, HandCoins, Loader2, ShieldCheck } from 'lucide-react'
import { callAidexAction } from '../../lib/aidex-actions'
import type { ParticipantRole } from '../../types/aidex'
import { GlassCard } from './GlassCard'

const roles = [
  { id: 'donor' as const, icon: HandCoins, title: 'Donor', description: 'Fund verified campaigns and follow every lamport through escrow.' },
  { id: 'ngo' as const, icon: Building2, title: 'NGO', description: 'Create milestone plans, submit evidence, and receive approved releases.' },
  { id: 'verifier' as const, icon: ShieldCheck, title: 'Verifier', description: 'Review evidence and sign independent on-chain attestations.' },
]

export function RoleSelect() {
  const [selected, setSelected] = useState<ParticipantRole>('donor')
  const [organizationName, setOrganizationName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function finish() {
    setBusy(true)
    setError('')
    try {
      await callAidexAction('set-aidex-profile', { participantRole: selected, organizationName })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save your role')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="aidex-shell relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10">
      <div className="aidex-grid pointer-events-none absolute inset-0 opacity-40" />
      <GlassCard className="relative z-10 w-full max-w-4xl p-6 md:p-9">
        <div className="mx-auto max-w-2xl text-center">
          <span className="aidex-chip inline-flex px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.18em] text-white/65">Identity layer</span>
          <h1 className="aidex-display mt-4 text-4xl text-white">Choose how you participate</h1>
          <p className="mt-3 text-sm leading-6 text-white/52">DeepSpace manages your account and permissions. Your Solana wallet is linked separately by a signed message.</p>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {roles.map(({ id, icon: Icon, title, description }) => {
            const active = selected === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => setSelected(id)}
                className={`relative rounded-2xl border p-5 text-left transition-all ${active ? 'border-orange-300/45 bg-orange-400/[.09]' : 'border-white/10 bg-white/[.025] hover:border-white/20'}`}
              >
                {active && <Check className="absolute right-4 top-4 h-4 w-4 text-orange-300" />}
                <Icon className="h-6 w-6 text-white/65" />
                <h2 className="mt-4 font-semibold text-white">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-white/46">{description}</p>
              </button>
            )
          })}
        </div>

        {selected !== 'donor' && (
          <div className="mx-auto mt-6 max-w-lg">
            <label className="mb-2 block text-xs font-bold uppercase tracking-[.15em] text-white/45">Organization or professional name</label>
            <input className="aidex-input" value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} placeholder={selected === 'ngo' ? 'Clean Water Initiative' : 'Dr. Asha Rao — Field Engineer'} />
          </div>
        )}
        {error && <p className="mt-4 text-center text-sm text-red-300">{error}</p>}
        <button type="button" onClick={finish} disabled={busy} className="aidex-primary mx-auto mt-7 flex h-12 min-w-52 items-center justify-center gap-2 rounded-xl px-6 text-sm font-bold transition-all disabled:opacity-60">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Enter AIDEX
        </button>
      </GlassCard>
    </div>
  )
}
