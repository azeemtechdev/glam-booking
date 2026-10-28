import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { ErrorBox, Loading } from '../components/States'
import { useFetch } from '../lib/useFetch'
import { naira, whenLabel } from '../lib/format'
import type { Booking, BookingStatus, Conversation } from '../api/types'

const NOTE: Partial<Record<BookingStatus, [string, string]>> = {
  accepted: ['Waiting for payment', 'The customer has 2 hours to pay. Do not travel until payment is confirmed.'],
  paid: ['Payment confirmed, you can go', 'The money is held safely. You are paid after the job is confirmed.'],
  on_the_way: ['You are on the way', 'Tap “Mark as done” when the job is finished.'],
  completed_by_provider: ['Waiting for the customer', 'They have 48 hours to confirm. After that, you are paid automatically.'],
  confirmed: ['Confirmed', 'Your payout is being sent.'], released: ['You have been paid', 'The money is on its way to your bank account.'],
  disputed: ['Under review', 'Our team is looking into this. Your payout is on hold until we decide.'],
  declined: ['Declined', ''], cancelled: ['Cancelled', 'The customer’s payment will be refunded.'], expired: ['Expired', ''], refunded: ['Refunded', ''],
}

export default function ProBooking() {
  const { id } = useParams()
  const go = useNavigate()
  const [params, setParams] = useSearchParams()
  const { data: b, error, loading, retry } = useFetch<Booking>(`/bookings/${id}`)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function act(fn: () => Promise<void>) {
    setBusy(true); setErr('')
    try { await fn() } catch (e) { setErr((e as Error).message) } finally { setBusy(false) }
  }
  if (loading) return <main className="screen"><Loading /></main>
  if (error || !b) return <main className="screen"><ErrorBox message={error} retry={retry} /></main>

  const preview = import.meta.env.DEV ? (params.get('preview') as BookingStatus | null) : null
  const status = preview ?? b.status
  const [title, text] = NOTE[status] ?? ['Booking', '']
  const step = (path: string, next: BookingStatus) => () => act(async () => {
    await api(`/bookings/${b.id}/${path}`, { method: 'POST' })
    if (import.meta.env.DEV) setParams({ preview: next }); else retry()   // the fake server never changes status
  })
  const openChat = () => act(async () => { const c = await api<Conversation>(`/bookings/${b.id}/conversation`); go(`/messages/${c.id}`) })
  const paid = ['paid', 'on_the_way', 'completed_by_provider', 'confirmed', 'released'].includes(status)

  return (
    <main className="screen">
      <Link to="/pro" className="back">← Back</Link>
      <div><div className="muted">{whenLabel(b.scheduled_at)}</div><h1 style={{ fontSize: 30 }}>{b.service.title}</h1></div>
      <div className={status === 'paid' ? 'panel' : 'panel'} style={status === 'paid' ? { background: 'var(--success-bg)', color: 'var(--success-text)' } : undefined}><b>{title}</b>{text && <span>{text}</span>}</div>
      <div className="card stack">
        <div className="row"><span className="muted">Customer</span><b>{b.customer?.name ?? 'Customer'}</b></div>
        <div className="row"><span className="muted">Area</span><b>{b.area}</b></div>
        <div className="row"><span className="muted">Address</span><b style={{ textAlign: 'right' }}>{paid ? b.address : 'Shown after payment'}</b></div>
        <div className="row"><span className="muted">Price</span><b>{naira(b.price_kobo)}</b></div>
      </div>
      <button className="card row card-btn" disabled={busy} onClick={openChat}><b>Message {b.customer?.name ?? 'customer'}</b>{' '}<span style={{ color: 'var(--accent)', fontWeight: 700 }}>Open chat</span></button>
      {err && <div className="error" role="alert">{err}</div>}
      {(status === 'paid' || status === 'on_the_way') && (
        <div className="bottom-bar"><div>
          {status === 'paid'
            ? <button className="btn" disabled={busy} onClick={step('on-the-way', 'on_the_way')}>I’m on my way</button>
            : <button className="btn" disabled={busy} onClick={step('complete', 'completed_by_provider')}>Mark as done</button>}
        </div></div>
      )}
    </main>
  )
}
