import axios from 'axios'
import qs from 'qs'

const CLIENT_ID = process.env.HUMAND_M2M_CLIENT_ID!
const CLIENT_SECRET = process.env.HUMAND_M2M_CLIENT_SECRET!
const API_URL = process.env.HUMAND_API_URL!
const POSTGREST_BASE_URL = process.env.POSTGREST_BASE_URL!
const INSTANCE_ID = process.env.HUMAND_INSTANCE_ID!

let cachedToken: string | null = null
let tokenExpiresAt = 0

export function hasPostgrestConfig(): boolean {
  return !!(CLIENT_ID && CLIENT_SECRET && API_URL && POSTGREST_BASE_URL && INSTANCE_ID)
}

export async function getM2MToken(): Promise<string> {
  const now = Date.now()
  if (cachedToken && tokenExpiresAt - now > 30_000) {
    return cachedToken
  }

  const { data } = await axios.post(
    `${API_URL}/api/v1/janus/oauth2/token`,
    qs.stringify({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      audience: 'views-cx',
      instance_id: INSTANCE_ID,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
  )

  if (!data.access_token) throw new Error('Token fetch failed: no access_token in response')

  cachedToken = data.access_token
  tokenExpiresAt = now + data.expires_in * 1000
  return cachedToken!
}

export function invalidateM2MToken(): void {
  cachedToken = null
}

export async function queryPostgrest<T>(path: string, params: Record<string, string>): Promise<T> {
  const token = await getM2MToken()
  const url = new URL(`${POSTGREST_BASE_URL}/${path}`)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  const res = await axios.get(url.toString(), {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    validateStatus: () => true,
  })

  if (res.status === 401) {
    invalidateM2MToken()
    const retryToken = await getM2MToken()
    const retryRes = await axios.get(url.toString(), {
      headers: { Authorization: `Bearer ${retryToken}`, Accept: 'application/json' },
      validateStatus: () => true,
    })
    if (retryRes.status >= 400) throw new Error(`PostgREST ${retryRes.status}: ${JSON.stringify(retryRes.data)}`)
    return retryRes.data as T
  }

  if (res.status >= 400) throw new Error(`PostgREST ${res.status}: ${JSON.stringify(res.data)}`)
  return res.data as T
}

/**
 * Admin = has the MANAGE_INSTANCE capability in Humand.
 * Works for the legacy capability model; not yet confirmed under Cerberus (Roles & Permissions) —
 * see project memory for the production-instance migration checklist.
 */
export async function isInstanceAdmin(email: string): Promise<boolean> {
  try {
    const users = await queryPostgrest<Array<{ id: number }>>('users', {
      email: `eq.${email}`,
      select: 'id',
    })
    if (!users.length) return false

    const caps = await queryPostgrest<Array<{ capabilityName: string }>>('user_capabilities', {
      userId: `eq.${users[0].id}`,
      capabilityName: 'eq.MANAGE_INSTANCE',
      select: 'capabilityName',
    })
    return caps.length > 0
  } catch (error) {
    console.error('isInstanceAdmin check failed:', error)
    return false
  }
}
