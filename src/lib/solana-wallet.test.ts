import { afterEach, expect, it, vi } from 'vitest'
import { PublicKey } from '@solana/web3.js'
import { connectWallet, rememberWallet } from './solana'

afterEach(() => vi.unstubAllGlobals())

it('uses the selected Solflare provider and remembers it for subsequent transactions', async () => {
  const publicKey = new PublicKey('11111111111111111111111111111111')
  const phantom = { connect: vi.fn(async () => ({ publicKey })) }
  const solflare = { publicKey, connect: vi.fn(async () => {}) }
  const storage = new Map<string, string>()
  vi.stubGlobal('window', {
    phantom: { solana: phantom },
    solflare,
    localStorage: {
      getItem: (key: string) => storage.get(key),
      setItem: (key: string, value: string) => storage.set(key, value),
    },
  })

  expect((await connectWallet('solflare')).publicKey.equals(publicKey)).toBe(true)
  rememberWallet('solflare')
  expect((await connectWallet()).provider).toBe(solflare)
  expect(phantom.connect).not.toHaveBeenCalled()
  expect((await connectWallet('auto')).provider).toBe(phantom)
})

it('requires Solflare when explicitly selected even if Phantom is available', async () => {
  vi.stubGlobal('window', { phantom: { solana: { connect: vi.fn() } } })
  await expect(connectWallet('solflare')).rejects.toThrow('Install or enable Solflare')
})
