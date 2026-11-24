import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { signOut } from 'deepspace'
import {
  BarChart3,
  CheckSquare,
  FileClock,
  HandCoins,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  Shield,
  Sparkles,
  X,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAidexProfile } from '../../contexts/AidexProfileContext'
import { WalletButton } from './WalletButton'

const titleByPath: Record<string, string> = {
  '/dashboard': 'Mission Control',
  '/campaigns': 'Campaign Discovery',
  '/donations': 'Donation Ledger',
  '/ngo-studio': 'NGO Studio',
  '/verification': 'Verification Console',
  '/ledger': 'Public Trust Ledger',
  '/settings': 'Identity & Settings',
}

export function AidexShell({ children }: { children: ReactNode }) {
  const { profile, user } = useAidexProfile()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  useEffect(() => setOpen(false), [location.pathname])
  const links = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/campaigns', icon: Search, label: 'Explore Campaigns' },
    ...(profile?.participantRole === 'donor' ? [{ to: '/donations', icon: HandCoins, label: 'My Donations' }] : []),
    ...(profile?.participantRole === 'ngo' ? [{ to: '/ngo-studio', icon: BarChart3, label: 'NGO Studio' }] : []),
    ...(profile?.participantRole === 'verifier' ? [{ to: '/verification', icon: CheckSquare, label: 'Verification' }] : []),
    { to: '/ledger', icon: FileClock, label: 'Trust Ledger' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <div className="aidex-shell relative flex h-screen overflow-hidden text-white">
      <div className="aidex-grid pointer-events-none absolute inset-0 opacity-35" />
      {open && <button aria-label="Close navigation" className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={cn('fixed inset-y-0 left-0 z-40 w-[18.5rem] p-3 transition-transform duration-300 lg:static', open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0')}>
        <div className="aidex-glass flex h-full flex-col overflow-hidden rounded-[1.6rem]">
          <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
            <NavLink to="/dashboard" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-cyan-400 shadow-lg shadow-orange-500/20"><Shield className="h-5 w-5 text-black" /></div>
              <div><p className="aidex-display text-base">AIDEX</p><p className="mt-1 text-[9px] uppercase tracking-[.19em] text-white/36">DeepSpace control plane</p></div>
            </NavLink>
            <button className="lg:hidden" onClick={() => setOpen(false)}><X className="h-4 w-4 text-white/55" /></button>
          </div>
          <div className="mx-4 mt-4 rounded-2xl border border-white/10 bg-white/[.035] p-3.5">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-white/72"><Sparkles className="h-3.5 w-3.5 text-orange-300" />Trust-minimized escrow</div>
            <p className="mt-2 text-xs leading-5 text-white/43">AI advises. Independent wallets attest. The PDA alone moves funds.</p>
          </div>
          <nav className="flex-1 space-y-1.5 overflow-y-auto p-3 pt-4">
            <p className="mb-2 px-2 text-[9px] uppercase tracking-[.2em] text-white/28">Navigation</p>
            {links.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} className={({ isActive }) => cn('flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm transition-all', isActive ? 'border-white/25 bg-white/[.1] text-white' : 'border-transparent text-white/52 hover:border-white/10 hover:bg-white/[.035] hover:text-white')}>
                {({ isActive }) => <><span className={cn('flex h-8 w-8 items-center justify-center rounded-xl', isActive ? 'bg-orange-400/15 text-orange-300' : 'bg-white/[.05] text-white/60')}><Icon className="h-4 w-4" /></span><span className="font-medium">{label}</span></>}
              </NavLink>
            ))}
          </nav>
          <div className="border-t border-white/10 p-3">
            <div className="rounded-2xl border border-white/10 bg-white/[.025] p-3">
              <p className="truncate text-sm font-semibold">{user?.name || user?.email}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[.15em] text-white/38">{profile?.participantRole} · {profile?.verificationStatus}</p>
              <div className="mt-3"><WalletButton /></div>
              <button type="button" onClick={() => signOut()} className="mt-2 flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.025] text-xs text-white/58 hover:border-red-300/20 hover:bg-red-400/10 hover:text-red-200"><LogOut className="h-3.5 w-3.5" />Sign out</button>
            </div>
          </div>
        </div>
      </aside>

      <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
        <header data-testid="app-navigation" className="flex h-[4.4rem] items-center justify-between border-b border-white/10 bg-black/20 px-4 backdrop-blur-2xl sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button className="lg:hidden" aria-label="Open navigation" onClick={() => setOpen(true)}><Menu className="h-5 w-5 text-white/65" /></button>
            <div><h1 className="aidex-display truncate text-xl">{titleByPath[location.pathname] ?? 'AIDEX'}</h1><p className="mt-1 text-[9px] uppercase tracking-[.18em] text-white/35">Solana Devnet · DeepSpace live</p></div>
          </div>
          <div className="flex items-center gap-2">
            <span className="aidex-chip hidden px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.15em] text-cyan-200 sm:inline-flex">Devnet only</span>
            <WalletButton compact />
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
