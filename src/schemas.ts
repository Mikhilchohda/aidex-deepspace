/**
 * Collection Schemas
 *
 * All collections with columns and RBAC permissions.
 * Single source of truth — imported by both worker and frontend.
 *
 * Add schemas by creating a file in src/schemas/ and importing it here.
 */

import type { CollectionSchema } from 'deepspace/schema'
import { usersSchema } from './schemas/users-schema'
import { settingsSchema } from './schemas/admin-schema'
import {
  aidexProfilesSchema,
  aiAssessmentsSchema,
  campaignsSchema,
  disputesSchema,
  donationsSchema,
  evidenceSchema,
  ledgerEventsSchema,
  milestonesSchema,
  verificationVotesSchema,
  verifierAssignmentsSchema,
} from './schemas/aidex-schema'

export const schemas: CollectionSchema[] = [
  usersSchema,
  settingsSchema,
  aidexProfilesSchema,
  campaignsSchema,
  milestonesSchema,
  evidenceSchema,
  verifierAssignmentsSchema,
  verificationVotesSchema,
  donationsSchema,
  ledgerEventsSchema,
  aiAssessmentsSchema,
  disputesSchema,
]
