import type { ActionHandler } from 'deepspace/worker'
import type { Env } from '../../worker'
import {
  acceptVerifierAssignment,
  activateAidexCampaign,
  analyzeAidexEvidence,
  createAidexCampaign,
  linkAidexWallet,
  openAidexDispute,
  recordAidexDeposit,
  recordAidexRelease,
  setAidexProfile,
  submitAidexEvidence,
  submitAidexVote,
} from './aidex'

export const actions: Record<string, ActionHandler<Env>> = {
  'set-aidex-profile': setAidexProfile,
  'link-aidex-wallet': linkAidexWallet,
  'create-aidex-campaign': createAidexCampaign,
  'activate-aidex-campaign': activateAidexCampaign,
  'accept-verifier-assignment': acceptVerifierAssignment,
  'record-aidex-deposit': recordAidexDeposit,
  'submit-aidex-evidence': submitAidexEvidence,
  'analyze-aidex-evidence': analyzeAidexEvidence,
  'submit-aidex-vote': submitAidexVote,
  'record-aidex-release': recordAidexRelease,
  'open-aidex-dispute': openAidexDispute,
}
