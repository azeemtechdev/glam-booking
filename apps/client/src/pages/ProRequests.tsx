import { useState } from 'react'
import ProNav from '../components/ProNav'
import { api } from '../api/client'
import { ErrorBox, Loading } from '../components/States'
import { useFetch } from '../lib/useFetch'
import { naira, whenLabel } from '../lib/format'
import type { Booking } from '../api/types'

export default function ProRequests() {
  const { data, error, loading, retry } = useFetch<{ items: Booking[] }>('/bookings?status=requested&limit=50')
  const [gone, setGone] = useState<string[]>([])
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const items = (data?.items ?? []).filter((b) => b.status === 'requested' && !gone.includes(b.id))

  async function decide(id: string, action: 'accept' | 'decline') {
    setBusy(id); setErr('')
    try { await api(`/bookings/${id}/${action}`, { method: 'POST' }); setGone((g) => [...g, id]) }
    catch (e) { setErr((e as Error).message) } finally { setBusy('') }
  }

  return (
    <main className="screen has-nav">
      <h1>New requests</h1>
      {loading && <Loading />}
      {error && <ErrorBox message={error} retry={retry} />}
      {err && <div className="error" role="alert">{err}</div>}
      {data && items.length === 0 && <div className="panel"><b>No new requests</b><span className="muted">When a customer books you, it appears here. Reply within 12 hours.</span></div>}
      {items.map((b) => (
        <div key={b.id} className="card stack">
          <div className="row"><b>{b.customer?.name ?? 'Customer'}</b><b>{naira(b.price_kobo)}</b></div>
          <div className="muted">{b.service.title} · {whenLabel(b.scheduled_at)} · {b.area}</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-alt" style={{ minHeight: 46 }} disabled={busy === b.id} onClick={() => decide(b.id, 'decline')} aria-label={`Decline ${b.service.title}`}>Decline</button>
            <button className="btn" style={{ minHeight: 46 }} disabled={busy === b.id} onClick={() => decide(b.id, 'accept')} aria-label={`Accept ${b.service.title}`}>Accept</button>
          </div>
          <span className="muted">After you accept, the customer has 2 hours to pay.</span>
        </div>
      ))}
      <ProNav />
    </main>
  )
}
