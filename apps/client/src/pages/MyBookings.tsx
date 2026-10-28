import { useState } from 'react'
import { Link } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { ErrorBox, Loading } from '../components/States'
import { useFetch } from '../lib/useFetch'
import { naira, whenLabel } from '../lib/format'
import type { Booking, BookingStatus } from '../api/types'

const PAST: BookingStatus[] = ['confirmed', 'released', 'declined', 'expired', 'cancelled', 'refunded']
const TAG: Record<BookingStatus, [string, boolean]> = {
  requested: ['Awaiting reply', true], accepted: ['Pay now', true], paid: ['Paid', false], on_the_way: ['On the way', false],
  completed_by_provider: ['Please confirm', true], confirmed: ['Completed', false], released: ['Completed', false],
  declined: ['Declined', true], expired: ['Expired', true], cancelled: ['Cancelled', true], disputed: ['Under review', true], refunded: ['Refunded', false],
}

export default function MyBookings() {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
  const { data, error, loading, retry } = useFetch<{ items: Booking[] }>('/bookings?limit=50')
  const items = (data?.items ?? []).filter((b) => PAST.includes(b.status) === (tab === 'past'))

  return (
    <main className="screen has-nav">
      <h1>My bookings</h1>
      <div className="chips" role="group" aria-label="Show">
        <button className="chip" aria-pressed={tab === 'upcoming'} onClick={() => setTab('upcoming')}>Upcoming</button>
        <button className="chip" aria-pressed={tab === 'past'} onClick={() => setTab('past')}>Past</button>
      </div>
      {loading && <Loading />}
      {error && <ErrorBox message={error} retry={retry} />}
      {data && items.length === 0 && (
        <div className="panel"><b>{tab === 'upcoming' ? 'No upcoming bookings' : 'No past bookings yet'}</b>
          <span className="muted">{tab === 'upcoming' ? 'Find a stylist and book your first appointment.' : 'Completed bookings show up here.'}</span>
          {tab === 'upcoming' && <Link to="/home" style={{ fontWeight: 700 }}>Browse stylists</Link>}</div>
      )}
      {items.map((b) => {
        const [label, warn] = TAG[b.status]
        return (
          <div key={b.id} className="card stack" style={{ gap: 10 }}>
            <Link to={`/bookings/${b.id}`} style={{ textDecoration: 'none' }} aria-label={`${b.service.title} with ${b.provider.name}, ${label}`}>
              <div className="row"><b>{b.service.title}</b><span className={warn ? 'tag tag-warn' : 'tag'}>{label}</span></div>
              <div className="muted">{b.provider.name} · {whenLabel(b.scheduled_at)}</div>
              <div className="muted">{naira(b.price_kobo)}</div>
            </Link>
            {tab === 'past' && <Link to={`/stylists/${b.provider.id}`} className="chip" style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', textDecoration: 'none' }}>Rebook</Link>}
          </div>
        )
      })}
      <BottomNav />
    </main>
  )
}
