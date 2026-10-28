import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { ErrorBox, Loading } from '../components/States'
import { useFetch } from '../lib/useFetch'
import type { Booking } from '../api/types'

export default function Review() {
  const { id } = useParams()
  const { data: b, error, loading, retry } = useFetch<Booking>(`/bookings/${id}`)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault(); setErr('')
    if (rating < 1) return setErr('Please choose a star rating.')
    setBusy(true)
    try { await api(`/bookings/${id}/review`, { method: 'POST', body: { rating, comment: comment.trim() || undefined } }); setDone(true) }
    catch (e2) { setErr((e2 as Error).message) } finally { setBusy(false) }
  }

  if (loading) return <main className="screen"><Loading /></main>
  if (error || !b) return <main className="screen"><ErrorBox message={error} retry={retry} /></main>
  if (done) return (
    <main className="screen"><h1>Thank you!</h1><div className="panel"><b>Your review is posted</b><span className="muted">It helps other customers choose, and helps {b.provider.name} grow.</span></div>
      <Link to="/home" className="btn" style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>Back to home</Link></main>
  )
  return (
    <main className="screen">
      <form onSubmit={submit} style={{ display: 'contents' }} noValidate>
        <div><div className="muted">{b.service.title}</div><h1 style={{ fontSize: 30 }}>How was {b.provider.name}?</h1></div>
        <div className="card stack">
          <b id="rl">Rate your experience</b>
          <div className="stars" role="radiogroup" aria-labelledby="rl">
            {[1, 2, 3, 4, 5].map((n) => (
              <button type="button" key={n} role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} className="star" data-on={n <= rating} onClick={() => setRating(n)}>★</button>
            ))}
          </div>
          <div className="field"><label className="label" htmlFor="rc">Tell others how it went (optional)</label>
            <textarea id="rc" className="input" value={comment} onChange={(e) => setComment(e.target.value)} /></div>
        </div>
        {err && <div className="error" role="alert">{err}</div>}
        <div className="bottom-bar"><div>
          <button className="btn" disabled={busy}>{busy ? 'Posting…' : 'Post review'}</button>
          <Link to="/home" className="muted center" style={{ fontWeight: 700 }}>Skip for now</Link>
        </div></div>
      </form>
    </main>
  )
}
