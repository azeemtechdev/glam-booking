import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { ErrorBox, Loading } from '../components/States'
import { useFetch } from '../lib/useFetch'
import { naira, whenLabel } from '../lib/format'
import type { Booking, BookingStatus, Conversation } from '../api/types'

const STAGES: BookingStatus[] = ['requested', 'accepted', 'paid', 'on_the_way', 'completed_by_provider', 'released']
const ENDED: Partial<Record<BookingStatus, string>> = {
  declined: 'The stylist could not take this booking.', expired: 'The stylist did not reply in time.',
  cancelled: 'This booking was cancelled.', refunded: 'Your payment was refunded.',
  disputed: 'Your report is being reviewed. Your payment stays held until we decide.',
}

export default function BookingPage() {
  const { id } = useParams()
  const go = useNavigate()
  const [params, setParams] = useSearchParams()
  const { data: b, error, loading, retry } = useFetch<Booking>(`/bookings/${id}`)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  async function act(fn: () => Promise<void>, ok?: string) {
    setBusy(true); setErr(''); setMsg('')
    try { await fn(); if (ok) setMsg(ok) } catch (e) { setErr((e as Error).message) } finally { setBusy(false) }
  }

  if (loading) return <main className="screen"><Loading /></main>
  if (error || !b) return <main className="screen"><ErrorBox message={error} retry={retry} /></main>

  // While building against the fake server, ?preview=paid shows other stages.
  const preview = import.meta.env.DEV ? (params.get('preview') as BookingStatus | null) : null
  const status = preview ?? b.status
  const who = b.provider.name
  const post = (path: string) => () => api<void>(`/bookings/${b.id}/${path}`, { method: 'POST' })

  const pay = () => act(async () => {
    const r = await api<{ checkout_url: string }>(`/bookings/${b.id}/pay`, { method: 'POST', headers: { 'Idempotency-Key': crypto.randomUUID() } })
    if (r.checkout_url.startsWith('mock:')) setParams({ preview: 'paid' })
    else window.location.href = r.checkout_url
  })

  const openChat = () => act(async () => { const c = await api<Conversation>(`/bookings/${b.id}/conversation`); go(`/messages/${c.id}`) })
  const chatRow = (
    <button className="card row card-btn" disabled={busy} onClick={openChat}><b>Message {who}</b>{' '}<span style={{ color: 'var(--accent)', fontWeight: 700 }}>Open chat</span></button>
  )

  const summary = (
    <div className="card stack">
      <div className="row"><span className="muted">Stylist</span><b>{who}</b></div>
      <div className="row"><span className="muted">Service</span><b>{b.service.title}</b></div>
      <div className="row"><span className="muted">When</span><b>{whenLabel(b.scheduled_at)}</b></div>
      <div className="row"><span className="muted">Where</span><b style={{ textAlign: 'right' }}>{b.area}</b></div>
    </div>
  )
  const feedback = <>{err && <div className="error" role="alert">{err}</div>}{msg && <div className="panel" role="status">{msg}</div>}</>
  const home = <Link to="/home" className="muted center" style={{ fontWeight: 700 }}>Back to home</Link>

  if (status === 'requested') return (
    <main className="screen">
      <div><div className="muted">Request sent</div><h1 style={{ fontSize: 30 }}>Waiting for {who}</h1></div>
      {summary}
      <div className="panel"><b>What happens next</b><span className="muted">{who} has up to 12 hours to reply. You only pay after they accept.</span></div>
      {chatRow}
      {feedback}
      <div className="bottom-bar"><div>
        <button className="btn btn-alt" disabled={busy} onClick={() => act(async () => { await post('cancel')(); go('/home') })}>Cancel request</button>
        {home}
      </div></div>
    </main>
  )

  if (status === 'accepted') return (
    <main className="screen">
      <div><div className="muted">Step 2 of 2</div><h1 style={{ fontSize: 30 }}>Review and pay</h1></div>
      {summary}
      <div className="card stack"><div className="row"><span>{b.service.title}</span><span>{naira(b.price_kobo)}</span></div>
        <div className="row" style={{ borderTop: '1px solid var(--border)', paddingTop: 10, fontSize: 18 }}><b>Total</b><b>{naira(b.price_kobo)}</b></div></div>
      <div className="panel"><b>Your money is protected</b>
        <span className="muted">We hold your payment. {who} is paid only after you tap “Mark as done”. If something goes wrong, you can open a dispute.</span></div>
      {chatRow}
      {feedback}
      <div className="bottom-bar"><div>
        <button className="btn" disabled={busy} onClick={pay}>{busy ? 'Please wait…' : `Pay ${naira(b.price_kobo)}`}</button>
        <div className="muted center">Card, bank transfer or USSD</div>
      </div></div>
    </main>
  )

  if (ENDED[status]) return (
    <main className="screen"><h1 style={{ fontSize: 30 }}>Booking update</h1>{summary}<div className="panel"><b>{ENDED[status]}</b></div>{home}</main>
  )

  const cur = status === 'confirmed' ? STAGES.length - 1 : STAGES.indexOf(status)
  const labels = ['Request sent', `${who} accepted`, 'Payment held', `${who} is on the way`, 'Job done, you confirm', `${who} is paid`]
  const title = status === 'paid' ? `${who} is confirmed` : status === 'on_the_way' ? `${who} is on the way` : status === 'completed_by_provider' ? `${who} says the job is done` : 'All done'
  return (
    <main className="screen">
      <div><div className="muted">{whenLabel(b.scheduled_at)} · {b.area}</div><h1 style={{ fontSize: 30 }}>{title}</h1></div>
      <div className="dark-card"><span style={{ fontSize: 13 }}>{status === 'released' ? 'Paid to your stylist' : 'Held safely for you'}</span><b>{naira(b.price_kobo)}</b></div>
      <ol className="card stack" style={{ listStyle: 'none', margin: 0, gap: 16 }} aria-label="Booking progress">
        {labels.map((l, i) => {
          const s = status === 'released' || i < cur ? 'done' : i === cur ? 'now' : 'todo'
          return <li key={l} className="step" data-state={s}><span className="dot" aria-hidden="true">{s === 'done' ? '✓' : s === 'now' ? '●' : '○'}</span><span>{l}{s === 'now' ? ' (current)' : ''}</span></li>
        })}
      </ol>
      {status !== 'released' && chatRow}
      {status === 'completed_by_provider' && (
        <div className="panel"><b>Happy with the work?</b><span className="muted">Confirm and {naira(b.price_kobo)} is released to {who}. If you do nothing, it is released automatically in 48 hours.</span></div>
      )}
      {feedback}
      <div className="bottom-bar"><div>
        {status === 'completed_by_provider' ? (
          <>
            <button className="btn" disabled={busy} onClick={() => act(async () => { await post('confirm')(); go(`/bookings/${b.id}/review`) })}>Yes, it’s done · release payment</button>
            <button className="btn btn-alt" disabled={busy} onClick={() => go(`/bookings/${b.id}/dispute`)}>Something went wrong</button>
          </>
        ) : status !== 'released' ? (
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-alt" disabled={busy} onClick={() => act(post('share-with-contact'), 'Booking details sent to your emergency contact.')}>Share with contact</button>
            <button className="btn btn-alt" disabled={busy} onClick={() => act(post('help'), 'Our team has been alerted and will contact you.')}>Help</button>
          </div>
        ) : (
          <>
            <Link to={`/bookings/${b.id}/review`} className="btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>Rate {who}</Link>
            {home}
          </>
        )}
      </div></div>
    </main>
  )
}
