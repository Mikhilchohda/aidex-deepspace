import type { CollectionSchema } from 'deepspace/schema'

const lockedMember = { read: true, create: false, update: false, delete: false } as const
const adminAll = { read: true, create: true, update: true, delete: true } as const

export const aidexProfilesSchema: CollectionSchema = {
  name: 'aidex_profiles',
  columns: [
    { name: 'userId', storage: 'text', interpretation: 'plain' },
    { name: 'participantRole', storage: 'text', interpretation: { kind: 'select', options: ['donor', 'ngo', 'verifier'] } },
    { name: 'organizationName', storage: 'text', interpretation: 'plain' },
    { name: 'walletAddress', storage: 'text', interpretation: 'plain' },
    { name: 'walletVerifiedAt', storage: 'text', interpretation: { kind: 'date' } },
    { name: 'onboardingComplete', storage: 'number', interpretation: { kind: 'boolean' } },
    { name: 'verificationStatus', storage: 'text', interpretation: { kind: 'select', options: ['unverified', 'pending', 'verified', 'suspended'] } },
  ],
  ownerField: 'userId',
  permissions: {
    member: { read: 'own', create: false, update: false, delete: false },
    admin: adminAll,
  },
}

export const campaignsSchema: CollectionSchema = {
  name: 'campaigns',
  columns: [
    { name: 'ngoId', storage: 'text', interpretation: 'plain' },
    { name: 'ngoName', storage: 'text', interpretation: 'plain' },
    { name: 'ngoWallet', storage: 'text', interpretation: 'plain' },
    { name: 'title', storage: 'text', interpretation: 'plain' },
    { name: 'description', storage: 'text', interpretation: 'plain' },
    { name: 'category', storage: 'text', interpretation: 'plain' },
    { name: 'location', storage: 'text', interpretation: 'plain' },
    { name: 'goalLamports', storage: 'text', interpretation: 'plain' },
    { name: 'fundedLamports', storage: 'text', interpretation: 'plain' },
    { name: 'releasedLamports', storage: 'text', interpretation: 'plain' },
    { name: 'refundedLamports', storage: 'text', interpretation: 'plain' },
    { name: 'donorCount', storage: 'number', interpretation: 'plain' },
    { name: 'status', storage: 'text', interpretation: 'plain' },
    { name: 'visibility', storage: 'text', interpretation: 'plain' },
    { name: 'escrowPda', storage: 'text', interpretation: 'plain' },
    { name: 'programId', storage: 'text', interpretation: 'plain' },
    { name: 'verifierWallets', storage: 'text', interpretation: { kind: 'json' } },
    { name: 'approvalThreshold', storage: 'number', interpretation: 'plain' },
    { name: 'trustScore', storage: 'number', interpretation: 'plain' },
    { name: 'heroImageUrl', storage: 'text', interpretation: 'plain' },
  ],
  ownerField: 'ngoId',
  visibilityField: { field: 'visibility', value: 'public' },
  permissions: {
    '*': { read: 'published', create: false, update: false, delete: false },
    viewer: { read: 'published', create: false, update: false, delete: false },
    // Signed-in participants can inspect drafts needed for the NGO/verifier
    // workflow; anonymous visitors remain restricted to published records.
    member: { read: true, create: false, update: false, delete: false },
    admin: adminAll,
  },
}

export const milestonesSchema: CollectionSchema = {
  name: 'milestones',
  columns: [
    { name: 'campaignId', storage: 'text', interpretation: 'plain' },
    { name: 'ngoId', storage: 'text', interpretation: 'plain' },
    { name: 'title', storage: 'text', interpretation: 'plain' },
    { name: 'description', storage: 'text', interpretation: 'plain' },
    { name: 'orderIndex', storage: 'number', interpretation: 'plain' },
    { name: 'amountLamports', storage: 'text', interpretation: 'plain' },
    { name: 'dueDate', storage: 'text', interpretation: { kind: 'date' } },
    { name: 'status', storage: 'text', interpretation: 'plain' },
    { name: 'evidenceManifestHash', storage: 'text', interpretation: 'plain' },
    { name: 'evidenceCount', storage: 'number', interpretation: 'plain' },
    { name: 'approvalCount', storage: 'number', interpretation: 'plain' },
    { name: 'rejectionCount', storage: 'number', interpretation: 'plain' },
    { name: 'submittedAt', storage: 'text', interpretation: { kind: 'date' } },
    { name: 'releasedAt', storage: 'text', interpretation: { kind: 'date' } },
    { name: 'releaseTxSignature', storage: 'text', interpretation: 'plain' },
    { name: 'visibility', storage: 'text', interpretation: 'plain' },
  ],
  ownerField: 'ngoId',
  visibilityField: { field: 'visibility', value: 'public' },
  permissions: {
    '*': { read: 'published', create: false, update: false, delete: false },
    viewer: { read: 'published', create: false, update: false, delete: false },
    member: { read: true, create: false, update: false, delete: false },
    admin: adminAll,
  },
}

export const evidenceSchema: CollectionSchema = {
  name: 'evidence',
  columns: [
    { name: 'campaignId', storage: 'text', interpretation: 'plain' },
    { name: 'milestoneId', storage: 'text', interpretation: 'plain' },
    { name: 'submittedBy', storage: 'text', interpretation: 'plain' },
    { name: 'fileKey', storage: 'text', interpretation: 'plain' },
    { name: 'fileName', storage: 'text', interpretation: 'plain' },
    { name: 'mimeType', storage: 'text', interpretation: 'plain' },
    { name: 'sizeBytes', storage: 'number', interpretation: 'plain' },
    { name: 'sha256', storage: 'text', interpretation: 'plain' },
    { name: 'description', storage: 'text', interpretation: 'plain' },
    { name: 'capturedAt', storage: 'text', interpretation: { kind: 'date' } },
    { name: 'latitude', storage: 'text', interpretation: 'plain' },
    { name: 'longitude', storage: 'text', interpretation: 'plain' },
  ],
  ownerField: 'submittedBy',
  permissions: {
    member: lockedMember,
    admin: adminAll,
  },
}

export const verifierAssignmentsSchema: CollectionSchema = {
  name: 'verifier_assignments',
  columns: [
    { name: 'campaignId', storage: 'text', interpretation: 'plain' },
    { name: 'verifierUserId', storage: 'text', interpretation: 'plain' },
    { name: 'verifierWallet', storage: 'text', interpretation: 'plain' },
    { name: 'verifierType', storage: 'text', interpretation: 'plain' },
    { name: 'status', storage: 'text', interpretation: 'plain' },
  ],
  ownerField: 'verifierUserId',
  permissions: {
    member: { read: 'own', create: false, update: false, delete: false },
    admin: adminAll,
  },
}

export const verificationVotesSchema: CollectionSchema = {
  name: 'verification_votes',
  columns: [
    { name: 'campaignId', storage: 'text', interpretation: 'plain' },
    { name: 'milestoneId', storage: 'text', interpretation: 'plain' },
    { name: 'verifierUserId', storage: 'text', interpretation: 'plain' },
    { name: 'verifierWallet', storage: 'text', interpretation: 'plain' },
    { name: 'decision', storage: 'text', interpretation: 'plain' },
    { name: 'notes', storage: 'text', interpretation: 'plain' },
    { name: 'evidenceManifestHash', storage: 'text', interpretation: 'plain' },
    { name: 'onchainTxSignature', storage: 'text', interpretation: 'plain' },
    { name: 'votedAt', storage: 'text', interpretation: { kind: 'date' } },
  ],
  ownerField: 'verifierUserId',
  permissions: {
    member: lockedMember,
    admin: adminAll,
  },
}

export const donationsSchema: CollectionSchema = {
  name: 'donations',
  columns: [
    { name: 'campaignId', storage: 'text', interpretation: 'plain' },
    { name: 'ngoId', storage: 'text', interpretation: 'plain' },
    { name: 'donorId', storage: 'text', interpretation: 'plain' },
    { name: 'donorWallet', storage: 'text', interpretation: 'plain' },
    { name: 'amountLamports', storage: 'text', interpretation: 'plain' },
    { name: 'depositTxSignature', storage: 'text', interpretation: 'plain' },
    { name: 'status', storage: 'text', interpretation: 'plain' },
    { name: 'collaborators', storage: 'text', interpretation: { kind: 'json' } },
  ],
  ownerField: 'donorId',
  collaboratorsField: 'collaborators',
  permissions: {
    member: { read: 'shared', create: false, update: false, delete: false },
    admin: adminAll,
  },
}

export const ledgerEventsSchema: CollectionSchema = {
  name: 'ledger_events',
  columns: [
    { name: 'campaignId', storage: 'text', interpretation: 'plain' },
    { name: 'milestoneId', storage: 'text', interpretation: 'plain' },
    { name: 'actorId', storage: 'text', interpretation: 'plain' },
    { name: 'eventType', storage: 'text', interpretation: 'plain' },
    { name: 'amountLamports', storage: 'text', interpretation: 'plain' },
    { name: 'txSignature', storage: 'text', interpretation: 'plain' },
    { name: 'evidenceManifestHash', storage: 'text', interpretation: 'plain' },
    { name: 'summary', storage: 'text', interpretation: 'plain' },
    { name: 'visibility', storage: 'text', interpretation: 'plain' },
  ],
  visibilityField: { field: 'visibility', value: 'public' },
  permissions: {
    '*': { read: 'published', create: false, update: false, delete: false },
    viewer: { read: 'published', create: false, update: false, delete: false },
    member: { read: 'published', create: false, update: false, delete: false },
    admin: adminAll,
  },
}

export const aiAssessmentsSchema: CollectionSchema = {
  name: 'ai_assessments',
  columns: [
    { name: 'campaignId', storage: 'text', interpretation: 'plain' },
    { name: 'milestoneId', storage: 'text', interpretation: 'plain' },
    { name: 'requestedBy', storage: 'text', interpretation: 'plain' },
    { name: 'evidenceManifestHash', storage: 'text', interpretation: 'plain' },
    { name: 'recommendation', storage: 'text', interpretation: 'plain' },
    { name: 'confidence', storage: 'number', interpretation: 'plain' },
    { name: 'riskScore', storage: 'number', interpretation: 'plain' },
    { name: 'missingEvidence', storage: 'text', interpretation: { kind: 'json' } },
    { name: 'inconsistencies', storage: 'text', interpretation: { kind: 'json' } },
    { name: 'summary', storage: 'text', interpretation: 'plain' },
    { name: 'model', storage: 'text', interpretation: 'plain' },
    { name: 'createdAt', storage: 'text', interpretation: { kind: 'date' } },
  ],
  ownerField: 'requestedBy',
  permissions: {
    member: lockedMember,
    admin: adminAll,
  },
}

export const disputesSchema: CollectionSchema = {
  name: 'disputes',
  columns: [
    { name: 'campaignId', storage: 'text', interpretation: 'plain' },
    { name: 'milestoneId', storage: 'text', interpretation: 'plain' },
    { name: 'openedBy', storage: 'text', interpretation: 'plain' },
    { name: 'reason', storage: 'text', interpretation: 'plain' },
    { name: 'status', storage: 'text', interpretation: 'plain' },
    { name: 'resolution', storage: 'text', interpretation: 'plain' },
    { name: 'collaborators', storage: 'text', interpretation: { kind: 'json' } },
  ],
  ownerField: 'openedBy',
  collaboratorsField: 'collaborators',
  permissions: {
    member: { read: 'shared', create: false, update: false, delete: false },
    admin: adminAll,
  },
}
