// One place that talks to the server. To use the real back end later,
// set VITE_API_URL in a .env file. Until then it uses the fake server.
const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4010'

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

export async function api<T>(
  path: string,
  init: { method?: string; body?: unknown; headers?: Record<string, string> } = {},
): Promise<T> {
  const token = getToken()
  let res: Response
  try {
    res = await fetch(BASE + '/v1' + path, {
      method: init.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
    })
  } catch {
    throw new ApiError('NETWORK', 'Could not reach the server. Check your connection and try again.')
  }
  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(data?.error?.code ?? 'ERROR', data?.error?.message ?? 'Something went wrong. Please try again.')
  return data as T
}
