import type { Campaign, Milestone } from '../types/aidex'

export const SHOWCASE_CAMPAIGN_IDS = ['showcase-clean-water', 'showcase-grain-silos'] as const

export interface CampaignRow {
  recordId: string
  data: Campaign
  showcase?: boolean
}

export interface MilestoneRow {
  recordId: string
  data: Milestone
  showcase?: boolean
}

const programId = 'JAC2dcscjDK6AhCrubUhve9w7ttiUg9zaBzpzFjMHWLh'
const verifiers = [
  '7DzuWpQMbzC1sXek2eu2eKz7pYfyLvjFFWFPxv8jhj1v',
  'HDwnWZVQjm2VvSQgQk3tTXrj8K3sNPYmA8dbUhwuoyit',
  '3rVtmfzXFKTVxFk8wywtU51417EVZvf8wrmFLXUe6QQd',
]

export const showcaseCampaigns: CampaignRow[] = [
  {
    recordId: SHOWCASE_CAMPAIGN_IDS[0],
    showcase: true,
    data: {
      ngoId: 'showcase-ngo-water',
      ngoName: 'Mekong Water Commons',
      ngoWallet: '7v91N7iZRs9fQ5pVogx7nqN3uYxHUVdM8dYdCSQ6NA3h',
      title: 'Deep-Well Extraction: Clean Water for 1,200 Residents',
      description: 'Four solar-powered deep-bore wells, independently verified through geotagged installation evidence, water-quality reports, invoices, and field attestations.',
      category: 'Water & sanitation',
      location: 'Banteay Meanchey, Cambodia',
      goalLamports: '2000000000',
      fundedLamports: '1600000000',
      releasedLamports: '0',
      refundedLamports: '0',
      donorCount: 18,
      status: 'active',
      visibility: 'public',
      escrowPda: '89EDiZBS4HUxds1o7Vas7cpZxkmJM1mGE3UgbVnGKAgQ',
      programId,
      verifierWallets: verifiers,
      approvalThreshold: 2,
      trustScore: 92,
      heroImageUrl: '',
    },
  },
  {
    recordId: SHOWCASE_CAMPAIGN_IDS[1],
    showcase: true,
    data: {
      ngoId: 'showcase-ngo-food',
      ngoName: 'Harvest Shield Cooperative',
      ngoWallet: '4Nd1mEo1kzvE7WJcBQrZUVf1fYgxZraCZJpMm8gzZMMc',
      title: 'Climate-Resilient Grain Silos for 150 Smallholder Farmers',
      description: 'Deploy 150 hermetic grain silos with delivery receipts, installation checks, farmer handover records, and post-harvest loss monitoring.',
      category: 'Food security',
      location: 'Choluteca, Honduras',
      goalLamports: '3000000000',
      fundedLamports: '1300000000',
      releasedLamports: '0',
      refundedLamports: '0',
      donorCount: 11,
      status: 'active',
      visibility: 'public',
      escrowPda: '9XTsMZrF7wYisL4o5Go5cSGvaesfDyFTQKJbV8FgnmvL',
      programId,
      verifierWallets: verifiers,
      approvalThreshold: 2,
      trustScore: 95,
      heroImageUrl: '',
    },
  },
]

export const showcaseMilestones: MilestoneRow[] = [
  {
    recordId: 'showcase-water-survey',
    showcase: true,
    data: {
      campaignId: SHOWCASE_CAMPAIGN_IDS[0],
      ngoId: 'showcase-ngo-water',
      title: 'Hydrogeological survey and borehole drilling',
      description: 'Validate four locations, complete 120-metre drilling, and submit geotagged bore logs plus contractor invoices.',
      orderIndex: 0,
      amountLamports: '900000000',
      dueDate: '2027-02-12T00:00:00.000Z',
      status: 'pending',
      evidenceManifestHash: '',
      evidenceCount: 0,
      approvalCount: 0,
      rejectionCount: 0,
      submittedAt: '',
      releasedAt: '',
      releaseTxSignature: '',
      visibility: 'public',
    },
  },
  {
    recordId: 'showcase-water-install',
    showcase: true,
    data: {
      campaignId: SHOWCASE_CAMPAIGN_IDS[0],
      ngoId: 'showcase-ngo-water',
      title: 'Solar pumps, storage tanks, and quality validation',
      description: 'Install pumps and tanks, complete laboratory water tests, and train the local maintenance committee.',
      orderIndex: 1,
      amountLamports: '1100000000',
      dueDate: '2027-04-30T00:00:00.000Z',
      status: 'pending',
      evidenceManifestHash: '',
      evidenceCount: 0,
      approvalCount: 0,
      rejectionCount: 0,
      submittedAt: '',
      releasedAt: '',
      releaseTxSignature: '',
      visibility: 'public',
    },
  },
  {
    recordId: 'showcase-silos-procure',
    showcase: true,
    data: {
      campaignId: SHOWCASE_CAMPAIGN_IDS[1],
      ngoId: 'showcase-ngo-food',
      title: 'Manufacture and delivery of 150 hermetic silos',
      description: 'Verify supplier batch certificates, delivery manifests, and GPS-tagged warehouse intake evidence.',
      orderIndex: 0,
      amountLamports: '1800000000',
      dueDate: '2027-01-20T00:00:00.000Z',
      status: 'pending',
      evidenceManifestHash: '',
      evidenceCount: 0,
      approvalCount: 0,
      rejectionCount: 0,
      submittedAt: '',
      releasedAt: '',
      releaseTxSignature: '',
      visibility: 'public',
    },
  },
  {
    recordId: 'showcase-silos-handover',
    showcase: true,
    data: {
      campaignId: SHOWCASE_CAMPAIGN_IDS[1],
      ngoId: 'showcase-ngo-food',
      title: 'Farmer handover and post-harvest impact audit',
      description: 'Collect signed handovers, training attendance, and a sixty-day post-harvest loss assessment.',
      orderIndex: 1,
      amountLamports: '1200000000',
      dueDate: '2027-03-31T00:00:00.000Z',
      status: 'pending',
      evidenceManifestHash: '',
      evidenceCount: 0,
      approvalCount: 0,
      rejectionCount: 0,
      submittedAt: '',
      releasedAt: '',
      releaseTxSignature: '',
      visibility: 'public',
    },
  },
]

export function withShowcaseCampaigns(rows: CampaignRow[]): CampaignRow[] {
  const ids = new Set(rows.map((row) => row.recordId))
  return [...rows, ...showcaseCampaigns.filter((row) => !ids.has(row.recordId))]
}

export function withShowcaseMilestones(rows: MilestoneRow[], campaignId?: string): MilestoneRow[] {
  const ids = new Set(rows.map((row) => row.recordId))
  const fallbacks = showcaseMilestones.filter((row) => (!campaignId || row.data.campaignId === campaignId) && !ids.has(row.recordId))
  return [...rows, ...fallbacks]
}

export function findShowcaseCampaign(campaignId: string): Campaign | undefined {
  return showcaseCampaigns.find((row) => row.recordId === campaignId)?.data
}
