import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { api } from '../api/client'
import { ErrorBox, Loading } from '../components/States'
import { useFetch } from '../lib/useFetch'
import type { Settings } from '../api/types'

const FIELDS: [keyof Settings, string, string, number, number][] = [
  ['commission_percent', 'Commission (%)', 'Taken from the stylist’s side of each booking.', 0, 30],
  ['provider_response_hours', 'Stylist reply time (hours)', 'A request expires if the stylist does not reply in this time.', 1, 72],
  ['payment_window_hours', 'Payment window (hours)', 'How long a customer has to pay after a stylist accepts.', 1, 24],
  ['auto_confirm_hours', 'Auto-confirm after (hours)', 'The job is confirmed automatically if the customer does nothing.', 12, 168],
  ['free_cancel_hours', 'Free cancellation until (hours before)', 'Customers get a full refund if they cancel earlier than this.', 0, 168],
]

export default function AdminSettings() {
  const { data, error, loading, retry } = useFetch<Settings>('/admin/settings')
  const [v, setV] = useState<Record<string, string>>({})
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (data) setV(Object.fromEntries(Object.entries(data).map(([k, x]) => [k, String(x)]))) }, [data])

  async function save(e: FormEvent) {
    e.preventDefault(); setErr(''); setMsg('')
    const body: Record<string, number> = {}
    for (const [k, label, , min, max] of FIELDS) {
      const n = Number(v[k]); if (v[k] === '' || Number.isNaN(n) || n < min || n > max) return setErr(`${label}: enter a number from ${min} to ${max}.`)
      body[k] = n
    }
    setBusy(true)
    try { await api('/admin/settings', { method: 'PUT', body }); setMsg('Settings saved. They apply to new bookings.') } catch (e2) { setErr((e2 as Error).message) } finally { setBusy(false) }
  }

  return (
    <>
      <h1>Settings</h1>
      {loading && <Loading />}
      {error && <ErrorBox message={error} retry={retry} />}
      {data && (
        <form className="card stack" onSubmit={save} noValidate style={{ maxWidth: 560 }}>
          {FIELDS.map(([k, label, help]) => (
            <div key={k} className="field"><label className="label" htmlFor={k}>{label}</label>
              <input id={k} className="input" inputMode="decimal" value={v[k] ?? ''} onChange={(e) => setV({ ...v, [k]: e.target.value })} aria-describedby={`${k}-h`} style={{ maxWidth: 160 }} />
              <span className="muted" id={`${k}-h`}>{help}</span></div>
          ))}
          {err && <div className="error" role="alert">{err}</div>}
          {msg && <div className="panel" role="status">{msg}</div>}
          <div><button className="btn btn-sm" disabled={busy}>{busy ? 'Saving…' : 'Save settings'}</button></div>
        </form>
      )}
    </>
  )
}
