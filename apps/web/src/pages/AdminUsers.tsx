import { useState } from 'react'
import type { FormEvent } from 'react'
import { api } from '../api/client'
import { ErrorBox, Loading } from '../components/States'
import { useFetch } from '../lib/useFetch'
import type { AdminUser } from '../api/types'

export default function AdminUsers() {
  const [text, setText] = useState('')
  const [q, setQ] = useState('')
  const [role, setRole] = useState('')
  const qs = new URLSearchParams(); if (q) qs.set('q', q); if (role) qs.set('role', role)
  const { data, error, loading, retry, reload } = useFetch<AdminUser[]>(`/admin/users${qs.size ? `?${qs}` : ''}`)
  const [sure, setSure] = useState('')
  const [err, setErr] = useState('')
  const rows = (data ?? []).filter((u) => !role || u.role === role)

  async function toggle(u: AdminUser) {
    const path = u.status === 'active' ? 'suspend' : 'reinstate'
    if (path === 'suspend' && sure !== u.id) return setSure(u.id)
    setErr(''); setSure('')
    try { await api<void>(`/admin/users/${u.id}/${path}`, { method: 'POST' }); reload() } catch (e) { setErr((e as Error).message) }
  }

  return (
    <>
      <h1>Users</h1>
      <form className="row" role="search" onSubmit={(e: FormEvent) => { e.preventDefault(); setQ(text.trim()) }} style={{ justifyContent: 'flex-start' }}>
        <input className="input" type="search" aria-label="Search users" placeholder="Search by name, email or phone" value={text} onChange={(e) => setText(e.target.value)} style={{ maxWidth: 380 }} />
        <button className="btn btn-sm">Search</button>
      </form>
      <div className="chips" role="group" aria-label="Filter by role">
        {[['', 'Everyone'], ['customer', 'Customers'], ['provider', 'Stylists']].map(([v, l]) => <button key={v} className="chip" aria-pressed={role === v} onClick={() => setRole(v)}>{l}</button>)}
      </div>
      {loading && <Loading />}
      {error && <ErrorBox message={error} retry={retry} />}
      {err && <div className="error" role="alert">{err}</div>}
      {data && rows.length === 0 && <div className="panel"><b>No users found</b></div>}
      {rows.length > 0 && (
        <div className="card table-wrap" role="region" aria-label="Users" tabIndex={0}>
          <table className="admin-table"><thead><tr><th scope="col">Name</th><th scope="col">Email</th><th scope="col">Role</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Action</span></th></tr></thead>
            <tbody>{rows.map((u) => (
              <tr key={u.id}><td><b>{u.name}</b></td><td>{u.email}</td><td style={{ textTransform: 'capitalize' }}>{u.role}</td>
                <td><span className={u.status === 'active' ? 'tag' : 'tag tag-warn'}>{u.status === 'active' ? 'Active' : 'Suspended'}</span></td>
                <td><button className="btn btn-sm btn-alt" onClick={() => toggle(u)} aria-label={`${u.status === 'active' ? 'Suspend' : 'Reinstate'} ${u.name}`}>{u.status === 'active' ? (sure === u.id ? 'Tap again to suspend' : 'Suspend') : 'Reinstate'}</button></td></tr>
            ))}</tbody></table>
        </div>
      )}
    </>
  )
}
