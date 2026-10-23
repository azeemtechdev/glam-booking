import { Link } from 'react-router-dom'
import { Photo } from './Photo'
import { naira } from '../lib/format'
import type { ProviderSummary } from '../api/types'

export default function ProviderCard({ p, i }: { p: ProviderSummary; i: number }) {
  return (
    <Link to={`/stylists/${p.id}`} style={{ textDecoration: 'none' }} aria-label={`${p.name}, from ${naira(p.from_price_kobo)}`}>
      <Photo src={p.cover_photo_url} label="Portfolio photo" i={i} style={{ height: 190 }} />
      <b style={{ display: 'block', marginTop: 8 }}>{p.name}</b>
      <div className="muted">{p.categories.join(', ')} · from {naira(p.from_price_kobo)}</div>
      {p.rating_avg != null && <div className="muted">★ {p.rating_avg.toFixed(1)} ({p.review_count})</div>}
    </Link>
  )
}
