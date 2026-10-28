import { useState } from 'react'
import { api } from '../api/client'
import { ErrorBox, Loading } from '../components/States'
import { useFetch } from '../lib/useFetch'
import { dayLabel, naira } from '../lib/format'
import type { AdminPayout, Summary } from '../api/types'

const TAGS: Record<string, [string, boolean]> = { held: ['Held', true], released: ['Released', false], failed: ['Failed', true] }

export default function AdminPayouts() {
  const [filter, setFilter] = useState('')
  const list = useFetch<AdminPayout[]>(`/admin/payouts${filter ? `?status=${filter}` : ''}`)
  const sum = useFetch<Summary>('/admin/reports/summary')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const rows = (list.data ?? []).filter((p) => !filter || p.status === filter)
  const held = (list.data ?? []).filter((p) => p.status === 'held').reduce((s, p) => s + p.amount_kobo + p.fee_kobo, 0)

  async function retryPayout(id: string) {
    setErr(''); setMsg('')
    try { await api(`/admin/payouts/${id}/retry`, { method: 'POST' }); setMsg('Retrying the payout. Check back in a minute.') } catch (e) { setErr((e as Error).message) }
  }

  return (
    <>
      <h1>Payouts</h1>
      <div className="tiles">
        <div className="card"><div className="muted">Held now</div><b>{list.data ? naira(held) : '–'}</b></div>
        <div className="card"><div className="muted">Fees earned</div><b>{sum.data ? naira(sum.data.fees_kobo) : '–'}</b></div>
        <div className="card"><div className="muted">Bookings</div><b>{sum.data ? sum.data.bookings : '–'}</b></div>
      </div>
      <div className="chips" role="group" aria-label="Filter by status">
        {[['', 'All'], ['held', 'Held'], ['released', 'Released'], ['failed', 'Failed']].map(([v, l]) => <button key={v} className="chip" aria-pressed={filter === v} onClick={() => setFilter(v)}>{l}</button>)}
      </div>
      {list.loading && <Loading />}
      {list.error && <ErrorBox message={list.error} retry={list.retry} />}
      {err && <div className="error" role="alert">{err}</div>}
      {msg && <div className="panel" role="status">{msg}</div>}
      {list.data && rows.length === 0 && <div className="panel"><b>No payouts here</b></div>}
      {rows.length > 0 && (
        <div className="card table-wrap" role="region" aria-label="Payouts" tabIndex={0}>
          <table className="admin-table"><thead><tr><th scope="col">Booking</th><th scope="col">Stylist</th><th scope="col">Payout</th><th scope="col">Fee</th><th scope="col">Status</th><th scope="col">Paid on</th><th scope="col"><span className="sr-only">Action</span></th></tr></thead>
            <tbody>{rows.map((p) => {
              const [t, warn] = TAGS[p.status]
              return (
                <tr key={p.id}><td>#{p.booking_id.replace('bk_', '')}</td><td>{p.provider_name}</td><td>{naira(p.amount_kobo)}</td><td>{naira(p.fee_kobo)}</td>
                  <td><span className={warn ? 'tag tag-warn' : 'tag'}>{t}</span></td><td>{p.released_at ? dayLabel(p.released_at) : '–'}</td>
                  <td>{p.status === 'failed' && <button className="btn btn-sm" onClick={() => retryPayout(p.id)} aria-label={`Retry payout for booking ${p.booking_id}`}>Retry</button>}</td></tr>
              )
            })}</tbody></table>
        </div>
      )}
    </>
  )
}
