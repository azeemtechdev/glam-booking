import { Link } from 'react-router-dom'
import ProNav from '../components/ProNav'
import { ErrorBox, Loading } from '../components/States'
import { useFetch } from '../lib/useFetch'
import { dayLabel, naira } from '../lib/format'
import type { Earnings } from '../api/types'

export default function ProEarnings() {
  const { data, error, loading, retry } = useFetch<Earnings>('/provider/earnings')
  return (
    <main className="screen has-nav">
      <h1>Earnings</h1>
      {loading && <Loading />}
      {error && <ErrorBox message={error} retry={retry} />}
      {data && <>
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="card" style={{ flex: 1 }}><div className="muted">Pending</div><b style={{ fontSize: 22 }}>{naira(data.pending_kobo)}</b></div>
          <div className="card" style={{ flex: 1 }}><div className="muted">Paid out</div><b style={{ fontSize: 22 }}>{naira(data.paid_out_kobo)}</b></div>
        </div>
        <Link to="/pro/onboarding" className="card row" style={{ textDecoration: 'none' }}><b>Payout account</b><span className="muted">Manage ›</span></Link>
        <h2 style={{ fontSize: 20 }}>History</h2>
        {data.history.length === 0 && <div className="panel"><b>No payouts yet</b><span className="muted">You are paid after each job is confirmed.</span></div>}
        {data.history.map((p) => (
          <div key={p.id} className="row"><div><b>Booking {p.booking_id.replace('bk_', '#')}</b><div className="muted">{p.released_at ? `Paid ${dayLabel(p.released_at)}` : 'Pending'}</div></div><b>{naira(p.amount_kobo)}</b></div>
        ))}
        <div className="muted">Amounts shown after the platform fee.</div>
      </>}
      <ProNav />
    </main>
  )
}
