export type ParticipantRole = 'donor' | 'ngo' | 'verifier'

export type CampaignStatus =
  | 'draft'
  | 'under_review'
  | 'approved_for_funding'
  | 'funded'
  | 'active'
  | 'completed'
  | 'disputed'
  | 'refunded'

export type MilestoneStatus =
  | 'pending'
  | 'submitted'
  | 'under_review'
  | 'revision_requested'
  | 'approved'
  | 'released'
  | 'rejected'
  | 'disputed'

export interface AidexProfile extends Record<string, unknown> {
  userId: string
  participantRole: ParticipantRole
  organizationName: string
  walletAddress: string
  walletVerifiedAt: string
  onboardingComplete: boolean
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'suspended'
}

export interface Campaign extends Record<string, unknown> {
  ngoId: string
  ngoName: string
  ngoWallet: string
  title: string
  description: string
  category: string
  location: string
  goalLamports: string
  fundedLamports: string
  releasedLamports: string
  refundedLamports: string
  donorCount: number
  status: CampaignStatus
  visibility: 'draft' | 'public'
  escrowPda: string
  programId: string
  verifierWallets: string[]
  approvalThreshold: number
  trustScore: number
  heroImageUrl: string
}

export interface Milestone extends Record<string, unknown> {
  campaignId: string
  ngoId: string
  title: string
  description: string
  orderIndex: number
  amountLamports: string
  dueDate: string
  status: MilestoneStatus
  evidenceManifestHash: string
  evidenceCount: number
  approvalCount: number
  rejectionCount: number
  submittedAt: string
  releasedAt: string
  releaseTxSignature: string
  visibility: 'draft' | 'public'
}

export interface EvidenceItem extends Record<string, unknown> {
  campaignId: string
  milestoneId: string
  submittedBy: string
  fileKey: string
  fileName: string
  mimeType: string
  sizeBytes: number
  sha256: string
  description: string
  capturedAt: string
  latitude: string
  longitude: string
}

export interface VerifierAssignment extends Record<string, unknown> {
  campaignId: string
  verifierUserId: string
  verifierWallet: string
  verifierType: 'field' | 'technical' | 'compliance'
  status: 'invited' | 'accepted' | 'removed'
}

export interface VerificationVote extends Record<string, unknown> {
  campaignId: string
  milestoneId: string
  verifierUserId: string
  verifierWallet: string
  decision: 'approve' | 'reject' | 'revision'
  notes: string
  evidenceManifestHash: string
  onchainTxSignature: string
  votedAt: string
}

export interface Donation extends Record<string, unknown> {
  campaignId: string
  ngoId: string
  donorId: string
  donorWallet: string
  amountLamports: string
  depositTxSignature: string
  status: 'pending' | 'confirmed' | 'partially_released' | 'refunded'
  collaborators: string[]
}

export interface LedgerEvent extends Record<string, unknown> {
  campaignId: string
  milestoneId: string
  actorId: string
  eventType: string
  amountLamports: string
  txSignature: string
  evidenceManifestHash: string
  summary: string
  visibility: 'private' | 'public'
}

export interface AiAssessment extends Record<string, unknown> {
  campaignId: string
  milestoneId: string
  requestedBy: string
  evidenceManifestHash: string
  recommendation: 'approve' | 'reject' | 'manual_review'
  confidence: number
  riskScore: number
  missingEvidence: string[]
  inconsistencies: string[]
  summary: string
  model: string
  createdAt: string
}

export interface Dispute extends Record<string, unknown> {
  campaignId: string
  milestoneId: string
  openedBy: string
  reason: string
  status: 'open' | 'under_review' | 'resolved_release' | 'resolved_refund'
  resolution: string
  collaborators: string[]
}

export function lamportsToSol(value: string | number | bigint): string {
  const lamports = typeof value === 'bigint' ? value : BigInt(value || 0)
  const whole = lamports / 1_000_000_000n
  const fraction = (lamports % 1_000_000_000n).toString().padStart(9, '0').replace(/0+$/, '')
  return fraction ? `${whole}.${fraction}` : whole.toString()
}

export function solToLamports(value: string): bigint {
  const normalized = value.trim()
  if (!/^\d+(\.\d{0,9})?$/.test(normalized)) throw new Error('Enter a valid SOL amount with at most 9 decimals')
  const [whole, fraction = ''] = normalized.split('.')
  return BigInt(whole) * 1_000_000_000n + BigInt(fraction.padEnd(9, '0'))
}
