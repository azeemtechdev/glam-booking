import { Link } from 'react-router-dom'
import ProNav from '../components/ProNav'
import { ErrorBox, Loading } from '../components/States'
import { useFetch } from '../lib/useFetch'
import { greeting, naira, timeLabel, dayLabel } from '../lib/format'
import type { Dashboard } from '../api/types'

const manage = [['/pro/services', 'Services and prices'], ['/pro/portfolio', 'Portfolio photos'], ['/pro/onboarding', 'Verification and payout account']] as const

export default function ProDashboard() {
  const name = localStorage.getItem('user_name')?.split(' ')[0] ?? ''
  const { data, error, loading, retry } = useFetch<Dashboard>('/provider/dashboard')
  return (
    <main className="screen has-nav">
      <div><div className="muted">{dayLabel(new Date().toISOString())}</div><h1>{greeting()}{name ? `, ${name}` : ''}</h1></div>
      {loading && <Loading />}
      {error && <ErrorBox message={error} retry={retry} />}
      {data && <>
        <div className="dark-card"><span style={{ fontSize: 13 }}>Earned this week</span><b>{naira(data.earned_this_week_kobo)}</b>
          <span style={{ fontSize: 13 }}>{naira(data.held_kobo)} held, paid after the job</span></div>
        <Link to="/pro/requests" className="card row" style={{ textDecoration: 'none' }}>
          <b>{data.new_requests} new request{data.new_requests === 1 ? '' : 's'}</b><span style={{ color: 'var(--accent)', fontWeight: 700 }}>Review</span></Link>
        <h2 style={{ fontSize: 20 }}>Today</h2>
        {data.today.length === 0 && <div className="panel"><b>No bookings today</b><span className="muted">New bookings show up here.</span></div>}
        {data.today.map((b) => (
          <Link key={b.id} to={`/pro/bookings/${b.id}`} className="card row" style={{ textDecoration: 'none' }}>
            <div><b>{b.service.title}</b><div className="muted">{timeLabel(b.scheduled_at)} · {b.area}</div></div>
            <span className="tag">{b.status === 'paid' ? 'Paid, go' : b.status.replace(/_/g, ' ')}</span></Link>
        ))}
        <h2 style={{ fontSize: 20 }}>Manage</h2>
        {manage.map(([to, label]) => <Link key={to} to={to} className="card row" style={{ textDecoration: 'none' }}><b>{label}</b><span className="muted">›</span></Link>)}
      </>}
      <ProNav />
    </main>
  )
}
