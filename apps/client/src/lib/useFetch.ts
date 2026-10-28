import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api/client'

// Loads data from the server and tracks loading and error states.
// `poll` (milliseconds) quietly refreshes the data on a timer, used for chat.
export function useFetch<T>(path: string | null, opts: { poll?: number } = {}) {
  const [state, setState] = useState<{ data?: T; error?: string; loading: boolean }>({ loading: path !== null })
  const seq = useRef(0)

  const load = useCallback(async (silent: boolean) => {
    if (path === null) return
    const mine = ++seq.current
    if (!silent) setState((s) => ({ ...s, loading: true, error: undefined }))
    try {
      const data = await api<T>(path)
      if (mine === seq.current) setState({ data, loading: false })
    } catch (e) {
      if (mine === seq.current && !silent) setState({ error: (e as Error).message, loading: false })
    }
  }, [path])

  useEffect(() => {
    load(false)
    const timer = opts.poll ? setInterval(() => load(true), opts.poll) : undefined
    return () => { seq.current++; if (timer) clearInterval(timer) }
  }, [load, opts.poll])

  return { ...state, retry: () => load(false), reload: () => load(true) }
}
