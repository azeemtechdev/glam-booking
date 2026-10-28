import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { ErrorBox, Loading } from '../components/States'
import { useFetch } from '../lib/useFetch'
import { naira, whenLabel } from '../lib/format'
import { REASON } from './AdminDisputes'
import type { Dispute } from '../api/types'

const OUTCOMES = [['release', 'Release payment to the stylist'], ['refund', 'Refund the customer in full'], ['split', 'Split: refund part to the customer']] as const

export default function AdminDispute() {
  const { id } = useParams()
  const { data: loaded, error, loading, retry } = useFetch<Dispute>(`/admin/disputes/${id}`)
  const [resolved, setResolved] = useState<Dispute | null>(null)
  const [outcome, setOutcome] = useState<string>('')
  const [refund, setRefund] = useState('')
  const [note, setNote] = useState('')
  const [sure, setSure] = useState(false)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  if (loading) return <Loading />
  if (error || !loaded) return <ErrorBox message={error} retry={retry} />
  const d = resolved ?? loaded

  async function resolve() {
    setErr('')
    if (!outcome) return setErr('Choose an outcome.')
    const kobo = Math.round(Number(refund) * 100)
    if (outcome === 'split' && !(kobo > 0 && kobo < d.amount_kobo)) return setErr(`Enter a refund amount between ₦1 and ${naira(d.amount_kobo - 100)}.`)
    if (!sure) return setSure(true)
    setBusy(true)
    try { setResolved(await api<Dispute>(`/admin/disputes/${id}/resolve`, { method: 'POST', body: { outcome, refund_kobo: outcome === 'split' ? kobo : undefined, note: note.trim() || undefined } })); setSure(false) }
    catch (e) { setErr((e as Error).message) } finally { setBusy(false) }
  }

  return (
    <>
      <Link to="/admin" className="back">← Back to disputes</Link>
      <h1>Dispute for booking #{d.booking_id.replace('bk_', '')}</h1>
      <div className="card stack">
        <div className="row"><span className="muted">Customer</span><b>{d.customer_name}</b></div>
        <div className="row"><span className="muted">Stylist</span><b>{d.provider_name}</b></div>
        <div className="row"><span className="muted">Service</span><b>{d.service_title}</b></div>
        <div className="row"><span className="muted">Amount held</span><b>{naira(d.amount_kobo)}</b></div>
        <div className="row"><span className="muted">Opened</span><b>{whenLabel(d.created_at)}</b></div>
        <div className="row"><span className="muted">Reason</span><b>{REASON[d.reason] ?? d.reason}</b></div>
        <div><span className="muted">What the customer said</span><p style={{ margin: '4px 0 0' }}>{d.description}</p></div>
      </div>

      {d.status === 'resolved' ? (
        <div className="panel" role="status"><b>Resolved: {OUTCOMES.find(([v]) => v === d.outcome)?.[1] ?? d.outcome}</b><span className="muted">Both people have been notified. The money has been moved.</span></div>
      ) : (
        <div className="card stack">
          <h2 style={{ fontSize: 20 }}>Decide</h2>
          <div className="stack" role="radiogroup" aria-label="Outcome">
            {OUTCOMES.map(([v, l]) => <button key={v} type="button" role="radio" aria-checked={outcome === v} className="choice" aria-pressed={outcome === v} onClick={() => { setOutcome(v); setSure(false) }}>{l}</button>)}
          </div>
          {outcome === 'split' && <div className="field"><label className="label" htmlFor="rf">Refund to customer (₦)</label><input id="rf" className="input" inputMode="numeric" value={refund} onChange={(e) => { setRefund(e.target.value); setSure(false) }} style={{ maxWidth: 220 }} /></div>}
          <div className="field"><label className="label" htmlFor="nt">Note for the record (optional)</label><textarea id="nt" className="input" value={note} onChange={(e) => setNote(e.target.value)} /></div>
          {err && <div className="error" role="alert">{err}</div>}
          {sure && <div className="panel" role="alert"><b>This moves real money and cannot be undone.</b><span className="muted">Press the button again to confirm.</span></div>}
          <div><button className="btn btn-sm" disabled={busy} onClick={resolve}>{busy ? 'Working…' : sure ? 'Confirm decision' : 'Apply decision'}</button></div>
        </div>
      )}
    </>
  )
}
