import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'

const REASONS = [['no_show', 'Stylist did not arrive'], ['not_as_agreed', 'Result not as agreed'], ['late', 'Arrived very late'], ['other', 'Something else']] as const

export default function Dispute() {
  const { id } = useParams()
  const [reason, setReason] = useState<string>('')
  const [text, setText] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault(); setErr('')
    if (!reason) return setErr('Please choose what went wrong.')
    if (text.trim().length < 10) return setErr('Please tell us a little more about what happened (at least 10 characters).')
    setBusy(true)
    try { await api(`/bookings/${id}/disputes`, { method: 'POST', body: { reason, description: text.trim() } }); setDone(true) }
    catch (e2) { setErr((e2 as Error).message) } finally { setBusy(false) }
  }

  if (done) return (
    <main className="screen"><h1>Report received</h1>
      <div className="panel"><b>We are looking into it</b><span className="muted">Your payment stays held while our team reviews this. We will message you with the outcome.</span></div>
      <Link to={`/bookings/${id}?preview=disputed`} className="chip" style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', textDecoration: 'none' }}>Back to booking</Link></main>
  )
  return (
    <main className="screen">
      <form onSubmit={submit} style={{ display: 'contents' }} noValidate>
        <h1 style={{ fontSize: 30 }}>What went wrong?</h1>
        <div className="chips" role="radiogroup" aria-label="Reason">
          {REASONS.map(([v, l]) => <button type="button" key={v} role="radio" aria-checked={reason === v} aria-pressed={reason === v} className="chip" onClick={() => setReason(v)}>{l}</button>)}
        </div>
        <div className="field"><label className="label" htmlFor="dt">Tell us what happened</label>
          <textarea id="dt" className="input" style={{ minHeight: 140 }} value={text} onChange={(e) => setText(e.target.value)} /></div>
        {err && <div className="error" role="alert">{err}</div>}
        <div className="bottom-bar"><div>
          <button className="btn" disabled={busy}>{busy ? 'Sending…' : 'Submit report'}</button>
          <div className="muted center">Payment stays held while we review</div>
        </div></div>
      </form>
    </main>
  )
}
