import { useState } from 'react'
import { api } from '../api/client'
import { ErrorBox, Loading } from '../components/States'
import { useFetch } from '../lib/useFetch'
import { dayLabel } from '../lib/format'
import type { Verification } from '../api/types'

const ID_LABEL: Record<string, string> = { nin: 'NIN', passport: 'Passport', drivers_licence: 'Driver’s licence', voters_card: 'Voter’s card' }
const MATCH: Record<string, [string, boolean]> = { match: ['Match', false], review: ['Review', true], no_match: ['No match', true] }

export default function AdminVerifications() {
  const { data, error, loading, retry } = useFetch<Verification[]>('/admin/verifications')
  const [done, setDone] = useState<string[]>([])
  const [rejecting, setRejecting] = useState('')
  const [reason, setReason] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState('')
  const rows = (data ?? []).filter((v) => !done.includes(v.id))

  async function decide(v: Verification, approve: boolean) {
    setErr('')
    if (!approve && reason.trim().length < 5) return setErr('Tell the stylist what to fix (at least 5 characters).')
    setBusy(v.id)
    try { await api(`/admin/verifications/${v.id}/${approve ? 'approve' : 'reject'}`, { method: 'POST', body: approve ? undefined : { reason: reason.trim() } }); setDone((d) => [...d, v.id]); setRejecting(''); setReason('') }
    catch (e) { setErr((e as Error).message) } finally { setBusy('') }
  }

  return (
    <>
      <h1>Verification queue</h1>
      {loading && <Loading />}
      {error && <ErrorBox message={error} retry={retry} />}
      {err && <div className="error" role="alert">{err}</div>}
      {data && rows.length === 0 && <div className="panel"><b>The queue is empty</b><span className="muted">New stylist verifications show up here.</span></div>}
      {rows.length > 0 && (
        <div className="card table-wrap" role="region" aria-label="Waiting for verification" tabIndex={0}>
          <table className="admin-table"><thead><tr><th scope="col">Name</th><th scope="col">Role</th><th scope="col">ID type</th><th scope="col">Selfie match</th><th scope="col">Sent</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>{rows.map((v) => {
              const [m, warn] = MATCH[v.selfie_match]
              return (
                <tr key={v.id}><td><b>{v.user_name}</b></td><td style={{ textTransform: 'capitalize' }}>{v.role}</td><td>{ID_LABEL[v.id_type] ?? v.id_type}</td>
                  <td><span className={warn ? 'tag tag-warn' : 'tag'}>{m}</span></td><td>{dayLabel(v.submitted_at)}</td>
                  <td>{rejecting === v.id ? (
                    <div className="actions"><label className="sr-only" htmlFor={`r-${v.id}`}>Reason for rejecting {v.user_name}</label>
                      <input id={`r-${v.id}`} className="input" style={{ minHeight: 40, width: 220 }} placeholder="What should they fix?" value={reason} onChange={(e) => setReason(e.target.value)} />
                      <button className="btn btn-sm" disabled={busy === v.id} onClick={() => decide(v, false)}>Send rejection</button>
                      <button className="btn btn-sm btn-alt" onClick={() => { setRejecting(''); setErr('') }}>Cancel</button></div>
                  ) : (
                    <div className="actions"><button className="btn btn-sm" disabled={busy === v.id} onClick={() => decide(v, true)} aria-label={`Approve ${v.user_name}`}>Approve</button>
                      <button className="btn btn-sm btn-alt" onClick={() => { setRejecting(v.id); setReason(''); setErr('') }} aria-label={`Reject ${v.user_name}`}>Reject</button></div>
                  )}</td></tr>
              )
            })}</tbody></table>
        </div>
      )}
    </>
  )
}
