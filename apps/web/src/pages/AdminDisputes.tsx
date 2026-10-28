import { Link } from 'react-router-dom'
import { ErrorBox, Loading } from '../components/States'
import { useFetch } from '../lib/useFetch'
import { dayLabel, naira } from '../lib/format'
import type { AdminPayout, Dispute, Verification } from '../api/types'

export const REASON: Record<string, string> = { no_show: 'Stylist did not arrive', not_as_agreed: 'Result not as agreed', late: 'Arrived very late', other: 'Something else' }

export default function AdminDisputes() {
  const disputes = useFetch<Dispute[]>('/admin/disputes')
  const verifs = useFetch<Verification[]>('/admin/verifications')
  const held = useFetch<AdminPayout[]>('/admin/payouts?status=held')
  const open = (disputes.data ?? []).filter((d) => d.status === 'open')
  const heldTotal = (held.data ?? []).filter((p) => p.status === 'held').reduce((s, p) => s + p.amount_kobo + p.fee_kobo, 0)
  return (
    <>
      <h1>Disputes</h1>
      <div className="tiles">
        <div className="card"><div className="muted">Open disputes</div><b>{disputes.data ? open.length : '–'}</b></div>
        <div className="card"><div className="muted">Verifications waiting</div><b>{verifs.data ? verifs.data.length : '–'}</b></div>
        <div className="card"><div className="muted">Payouts held</div><b>{held.data ? naira(heldTotal) : '–'}</b></div>
      </div>
      {disputes.loading && <Loading />}
      {disputes.error && <ErrorBox message={disputes.error} retry={disputes.retry} />}
      {disputes.data && open.length === 0 && <div className="panel"><b>No open disputes</b><span className="muted">Nothing needs your attention.</span></div>}
      {open.length > 0 && (
        <div className="card table-wrap" role="region" aria-label="Open disputes" tabIndex={0}>
          <table className="admin-table"><thead><tr><th scope="col">Booking</th><th scope="col">Customer</th><th scope="col">Stylist</th><th scope="col">Amount</th><th scope="col">Reason</th><th scope="col">Opened</th><th scope="col"><span className="sr-only">Action</span></th></tr></thead>
            <tbody>{open.map((d) => (
              <tr key={d.id}><td>#{d.booking_id.replace('bk_', '')}</td><td>{d.customer_name}</td><td>{d.provider_name}</td><td>{naira(d.amount_kobo)}</td>
                <td>{REASON[d.reason] ?? d.reason}</td><td>{dayLabel(d.created_at)}</td>
                <td><Link to={`/admin/disputes/${d.id}`} className="btn btn-sm" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }} aria-label={`Review dispute for booking ${d.booking_id}`}>Review</Link></td></tr>
            ))}</tbody></table>
        </div>
      )}
    </>
  )
}
