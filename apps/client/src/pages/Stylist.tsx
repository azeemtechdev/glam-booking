import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Photo } from '../components/Photo'
import { ErrorBox, Loading } from '../components/States'
import { useFetch } from '../lib/useFetch'
import { duration, naira } from '../lib/format'
import type { ProviderDetail } from '../api/types'

export default function Stylist() {
  const { id } = useParams()
  const go = useNavigate()
  const { data: p, error, loading, retry } = useFetch<ProviderDetail>(`/providers/${id}`)
  const [picked, setPicked] = useState('')

  if (loading) return <main className="screen"><Loading /></main>
  if (error || !p) return <main className="screen"><button className="back" onClick={() => go(-1)}>← Back</button><ErrorBox message={error} retry={retry} /></main>

  const sel = picked || p.services[0]?.id || ''
  const chosen = p.services.find((s) => s.id === sel)
  const shots = [0, 1, 2].map((i) => p.portfolio[i])

  return (
    <main className="screen">
      <div className="gallery">
        {shots.map((s, i) => <Photo key={i} i={i} src={s?.image_url} label={s?.caption ?? 'Portfolio photo'} />)}
      </div>

      <div className="stack" style={{ gap: 6, paddingTop: 6 }}>
        <div className="row"><h1 style={{ fontSize: 28 }}>{p.name}</h1>{p.verified && <span className="tag">ID verified</span>}</div>
        <div className="muted">{p.categories.join(' and ')} · {p.areas.join(', ')} · comes to you</div>
        <div className="muted">
          {p.rating_avg != null ? `★ ${p.rating_avg.toFixed(1)} · ${p.review_count} reviews · ` : 'New on the app · '}{p.completed_bookings} bookings completed
        </div>
        {p.bio && <p style={{ margin: '8px 0 0' }}>{p.bio}</p>}
      </div>

      <h2 style={{ fontSize: 19, marginTop: 8 }}>Services</h2>
      <div className="stack" role="group" aria-label="Choose a service">
        {p.services.map((s) => (
          <button key={s.id} className="choice" aria-pressed={sel === s.id} onClick={() => setPicked(s.id)}>
            <span className="row" style={{ width: '100%' }}><b>{s.title}</b><b>{naira(s.price_kobo)}</b></span>
            <span className="muted">{duration(s.duration_minutes)}</span>
          </button>
        ))}
      </div>

      <div className="bottom-bar"><div>
        <button className="btn" disabled={!chosen} onClick={() => go(`/stylists/${p.id}/book?service=${sel}`)}>
          Book {chosen ? `· ${naira(chosen.price_kobo)}` : ''}
        </button>
        <div className="muted center">Your payment is held safely until the job is done</div>
      </div></div>
    </main>
  )
}
