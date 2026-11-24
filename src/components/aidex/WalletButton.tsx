import { useState } from 'react'
import { CheckCircle2, Loader2, Wallet } from 'lucide-react'
import { callAidexAction } from '../../lib/aidex-actions'
import { preferredWallet, rememberWallet, signWalletLink, type WalletChoice } from '../../lib/solana'
import { useAidexProfile } from '../../contexts/AidexProfileContext'
import { cn } from '../../lib/utils'

export function WalletButton({ compact = false }: { compact?: boolean }) {
  const { user, profile } = useAidexProfile()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [choice, setChoice] = useState<WalletChoice | ''>(() => preferredWallet() ?? '')
  const linked = profile?.walletAddress

  async function link() {
    if (!user) return
    setBusy(true)
    setError('')
    try {
      const selected = compact ? undefined : choice || 'auto'
      const signed = await signWalletLink(user.id, selected)
      await callAidexAction('link-aidex-wallet', signed)
      if (selected) rememberWallet(selected)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not link wallet')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={cn('relative', compact ? '' : 'w-full')}>
      {!compact && (
        <label className="mb-3 block text-sm text-white/75">
          Devnet wallet
          <select
            className="aidex-input mt-2"
            value={choice}
            disabled={busy}
            onChange={(event) => { setChoice(event.target.value as WalletChoice | ''); setError('') }}
          >
            <option value="">Auto-detect</option>
            <option value="solflare">Solflare</option>
            <option value="phantom">Phantom</option>
          </select>
        </label>
      )}
      <button
        type="button"
        onClick={link}
        disabled={busy}
        className={cn(
          'flex items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-all disabled:opacity-60',
          compact ? 'h-9 px-3' : 'h-11 w-full px-4',
          linked
            ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200'
            : 'border-white/15 bg-white/[.05] text-white/75 hover:bg-white/[.09]',
        )}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : linked ? <CheckCircle2 className="h-4 w-4" /> : <Wallet className="h-4 w-4" />}
        {linked ? (compact ? `${linked.slice(0, 4)}…${linked.slice(-4)}` : 'Link selected wallet') : 'Link Devnet wallet'}
      </button>
      {error && !compact && <p className="mt-2 text-xs text-red-300">{error}</p>}
    </div>
  )
}
