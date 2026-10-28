// One place that talks to the server. Set VITE_API_URL in a .env file to point somewhere else.
const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export class ApiError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

export function getToken(): string | null {
  return localStorage.getItem('access_token')
}

// Access tokens are short-lived. When one expires, swap the refresh token for a new pair once,
// sharing a single request between parallel calls; if that fails the user must sign in again.
let refreshing: Promise<boolean> | null = null
function refreshSession(): Promise<boolean> {
  const rt = localStorage.getItem('refresh_token')
  if (!rt) return Promise.resolve(false)
  refreshing ??= fetch(BASE + '/v1/auth/refresh', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: rt }),
  })
    .then(async (r) => {
      if (!r.ok) return false
      const d = await r.json()
      localStorage.setItem('access_token', d.access_token)
      localStorage.setItem('refresh_token', d.refresh_token)
      return true
    })
    .catch(() => false)
    .finally(() => { refreshing = null })
  return refreshing
}

export async function api<T>(
  path: string,
  init: { method?: string; body?: unknown; headers?: Record<string, string> } = {},
  retried = false,
): Promise<T> {
  const token = getToken()
  let res: Response
  try {
    res = await fetch(BASE + '/v1' + path, {
      method: init.method ?? 'GET',
      headers: {
        ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    })
  } catch {
    throw new ApiError('NETWORK', 'Could not reach the server. Check your connection and try again.')
  }
  if (res.status === 401 && token && !retried) {
    if (await refreshSession()) return api<T>(path, init, true)
    const admin = localStorage.getItem('user_role') === 'admin'
    localStorage.clear()
    window.location.assign(admin ? '/admin/login' : '/login')
  }
  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(data?.error?.code ?? 'ERROR', data?.error?.message ?? 'Something went wrong. Please try again.')
  return data as T
}
