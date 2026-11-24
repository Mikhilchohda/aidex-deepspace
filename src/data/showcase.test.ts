import { describe, expect, it } from 'vitest'
import { PublicKey } from '@solana/web3.js'
import { SHOWCASE_CAMPAIGN_IDS, findShowcaseCampaign, showcaseCampaigns, withShowcaseCampaigns, withShowcaseMilestones } from './showcase'

describe('showcase campaign dataset', () => {
  it('provides complete public discovery content', () => {
    expect(showcaseCampaigns).toHaveLength(2)
    expect(showcaseCampaigns.every((row) => row.data.visibility === 'public')).toBe(true)
    expect(withShowcaseMilestones([], SHOWCASE_CAMPAIGN_IDS[0])).toHaveLength(2)
  })

  it('does not duplicate persisted records', () => {
    const persisted = showcaseCampaigns[0]
    expect(withShowcaseCampaigns([persisted])).toHaveLength(2)
  })

  it('uses valid Solana addresses for every on-chain identity', () => {
    for (const row of showcaseCampaigns) {
      expect(() => new PublicKey(row.data.escrowPda)).not.toThrow()
      expect(() => new PublicKey(row.data.ngoWallet)).not.toThrow()
      expect(() => new PublicKey(row.data.programId)).not.toThrow()
      row.data.verifierWallets.forEach((wallet) => expect(() => new PublicKey(wallet)).not.toThrow())
    }
    expect(findShowcaseCampaign(SHOWCASE_CAMPAIGN_IDS[1])?.trustScore).toBe(95)
  })
})
