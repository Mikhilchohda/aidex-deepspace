import { getAuthToken } from 'deepspace'

type ActionSuccess<T> = { success: true; data: T }
type ActionFailure = { success: false; error: string; code?: string }

export async function callAidexAction<T>(name: string, params: Record<string, unknown>): Promise<T> {
  const token = await getAuthToken()
  if (!token) throw new Error('Sign in to continue')
  const response = await fetch(`/api/actions/${name}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  })
  const body = (await response.json().catch(() => null)) as ActionSuccess<T> | ActionFailure | { error?: string } | null
  if (!response.ok || !body || !('success' in body) || !body.success) {
    throw new Error(body && 'error' in body && body.error ? body.error : `Action failed (${response.status})`)
  }
  return body.data
}
