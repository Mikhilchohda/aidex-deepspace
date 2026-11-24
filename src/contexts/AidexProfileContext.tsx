import { createContext, useContext, type ReactNode } from 'react'
import { useAuthProfileReady, useQuery } from 'deepspace'
import type { RecordData, UserProfile } from 'deepspace'
import type { AidexProfile } from '../types/aidex'

interface AidexProfileContextValue {
  user: UserProfile | null
  profileRecord: RecordData<AidexProfile> | null
  profile: AidexProfile | null
  loading: boolean
}

const AidexProfileContext = createContext<AidexProfileContextValue | null>(null)

export function AidexProfileProvider({ children }: { children: ReactNode }) {
  const { user, userLoading } = useAuthProfileReady({ requireUser: true })
  const userId = user?.id ?? ''
  const { records, status } = useQuery<AidexProfile>('aidex_profiles', {
    where: userId ? { userId } : { userId: '__not_ready__' },
    limit: 1,
  })
  const profileRecord = records[0] ?? null
  return (
    <AidexProfileContext.Provider
      value={{
        user: user ?? null,
        profileRecord,
        profile: profileRecord?.data ?? null,
        loading: userLoading || status === 'loading',
      }}
    >
      {children}
    </AidexProfileContext.Provider>
  )
}

export function useAidexProfile() {
  const context = useContext(AidexProfileContext)
  if (!context) throw new Error('useAidexProfile must be used inside AidexProfileProvider')
  return context
}
