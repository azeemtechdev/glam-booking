import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { logout } from '../api/auth'
import BottomNav from '../components/BottomNav'
import { ErrorBox, Loading } from '../components/States'
import { Photo } from '../components/Photo'
import { useFetch } from '../lib/useFetch'
import type { Me } from '../api/types'

export default function Profile() {
  const go = useNavigate()
  const { data: me, error, loading, retry, reload } = useFetch<Me>('/me')
  const [edit, setEdit] = useState(false)
  const [n, setN] = useState('')
  const [p, setP] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function save(e: FormEvent) {
    e.preventDefault(); setErr('')
    if (n.trim().length < 2) return setErr('Please enter your contact’s name.')
    if (!/^\+?\d{10,15}$/.test(p.replace(/\s/g, ''))) return setErr('Please enter a valid phone number, for example +2348012345678.')
    setBusy(true)
    try { await api<void>('/me/emergency-contact', { method: 'PUT', body: { name: n.trim(), phone: p.trim() } }); setEdit(false); reload() }
    catch (e2) { setErr((e2 as Error).message) } finally { setBusy(false) }
  }

  if (loading) return <main className="screen has-nav"><Loading /><BottomNav /></main>
  if (error || !me) return <main className="screen has-nav"><ErrorBox message={error} retry={retry} /><BottomNav /></main>

  return (
    <main className="screen has-nav">
      <div className="row" style={{ justifyContent: 'flex-start', gap: 14 }}>
        <Photo label="Photo" style={{ width: 72, height: 72, borderRadius: 99 }} />
        <div><h1 style={{ fontSize: 26 }}>{me.name}</h1>{me.email_verified && <span className="tag">Email verified</span>}</div>
      </div>
      <div className="card stack" style={{ gap: 6 }}><div className="muted">Email</div><b>{me.email}</b><div className="muted" style={{ marginTop: 6 }}>Phone</div><b>{me.phone ?? 'Not added'}</b></div>

      {!edit ? (
        <div className="card row">
          <div><b>Emergency contact</b><div className="muted">{me.emergency_contact ? `${me.emergency_contact.name} · ${me.emergency_contact.phone}` : 'Not added yet. We use this to keep you safe on home visits.'}</div></div>
          <button className="chip" onClick={() => { setN(me.emergency_contact?.name ?? ''); setP(me.emergency_contact?.phone ?? '+234'); setEdit(true) }}>{me.emergency_contact ? 'Edit' : 'Add'}</button>
        </div>
      ) : (
        <form className="card stack" onSubmit={save} noValidate>
          <b>Emergency contact</b>
          <div className="field"><label className="label" htmlFor="cn">Name</label><input id="cn" className="input" value={n} onChange={(e) => setN(e.target.value)} /></div>
          <div className="field"><label className="label" htmlFor="cp">Phone number</label><input id="cp" className="input" type="tel" value={p} onChange={(e) => setP(e.target.value)} /></div>
          {err && <div className="error" role="alert">{err}</div>}
          <div style={{ display: 'flex', gap: 10 }}><button type="button" className="btn btn-alt" onClick={() => setEdit(false)}>Cancel</button><button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button></div>
        </form>
      )}

      <div className="card row"><b>Saved stylists</b><span className="muted">Coming soon</span></div>
      <div className="card row"><b>Help and support</b><span className="muted">Coming soon</span></div>
      {import.meta.env.DEV && <Link to="/pro" className="card row" style={{ textDecoration: 'none' }}><b>Preview the stylist side</b><span className="muted">Testing only</span></Link>}
      <button className="btn btn-alt" onClick={() => { logout(); go('/') }}>Log out</button>
      <BottomNav />
    </main>
  )
}
