import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { ErrorBox, Loading } from '../components/States'
import { useFetch } from '../lib/useFetch'
import { duration, naira } from '../lib/format'
import type { Category, Service } from '../api/types'

type Draft = { id?: string; title: string; category: string; price: string; minutes: string; description: string }
const blank: Draft = { title: '', category: '', price: '', minutes: '60', description: '' }

export default function ProServices() {
  const list = useFetch<Service[]>('/provider/services')
  const cats = useFetch<Category[]>('/categories')
  const [draft, setDraft] = useState<Draft | null>(null)
  const [confirm, setConfirm] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setDraft({ ...draft!, [k]: e.target.value })

  async function save(e: FormEvent) {
    e.preventDefault(); setErr('')
    const d = draft!, price = Number(d.price), mins = Number(d.minutes)
    if (d.title.trim().length < 3) return setErr('Give the service a name, for example “Knotless braids”.')
    if (!d.category) return setErr('Choose a category.')
    if (!(price >= 500)) return setErr('Enter the price in naira (at least ₦500).')
    if (!(mins >= 15 && mins <= 720)) return setErr('Enter how long it takes, in minutes (15 to 720).')
    const body = { title: d.title.trim(), category: d.category, description: d.description.trim() || undefined, price_kobo: Math.round(price * 100), duration_minutes: mins }
    setBusy(true)
    try {
      await api(d.id ? `/provider/services/${d.id}` : '/provider/services', { method: d.id ? 'PATCH' : 'POST', body })
      setDraft(null); list.reload()
    } catch (e2) { setErr((e2 as Error).message) } finally { setBusy(false) }
  }
  async function remove(id: string) {
    if (confirm !== id) return setConfirm(id)
    try { await api<void>(`/provider/services/${id}`, { method: 'DELETE' }); setConfirm(''); list.reload() } catch (e) { setErr((e as Error).message) }
  }

  if (draft) return (
    <main className="screen">
      <form onSubmit={save} style={{ display: 'contents' }} noValidate>
        <button type="button" className="back" onClick={() => { setDraft(null); setErr('') }}>← Back</button>
        <h1 style={{ fontSize: 30 }}>{draft.id ? 'Edit service' : 'Add a service'}</h1>
        <div className="field"><label className="label" htmlFor="st">Service name</label><input id="st" className="input" value={draft.title} onChange={set('title')} /></div>
        <div className="field"><label className="label" htmlFor="sc">Category</label>
          <select id="sc" className="input" value={draft.category} onChange={set('category')}><option value="">Choose…</option>{cats.data?.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
        <div className="field"><label className="label" htmlFor="sp">Price (₦)</label><input id="sp" className="input" inputMode="numeric" value={draft.price} onChange={set('price')} /></div>
        <div className="field"><label className="label" htmlFor="sm">How long it takes (minutes)</label><input id="sm" className="input" inputMode="numeric" value={draft.minutes} onChange={set('minutes')} /></div>
        <div className="field"><label className="label" htmlFor="sd">Description (optional)</label><textarea id="sd" className="input" value={draft.description} onChange={set('description')} /></div>
        {err && <div className="error" role="alert">{err}</div>}
        <div className="bottom-bar"><div><button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save service'}</button></div></div>
      </form>
    </main>
  )

  return (
    <main className="screen">
      <Link to="/pro" className="back">← Back</Link>
      <h1 style={{ fontSize: 30 }}>Your services</h1>
      {list.loading && <Loading />}
      {list.error && <ErrorBox message={list.error} retry={list.retry} />}
      {list.data && list.data.length === 0 && <div className="panel"><b>No services yet</b><span className="muted">Add what you offer so customers can book you.</span></div>}
      {list.data?.map((s) => (
        <div key={s.id} className="card stack" style={{ gap: 8 }}>
          <div className="row"><div><b>{s.title}</b><div className="muted">{duration(s.duration_minutes)} · {naira(s.price_kobo)}</div></div></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="chip" onClick={() => setDraft({ id: s.id, title: s.title, category: s.category, price: String(s.price_kobo / 100), minutes: String(s.duration_minutes), description: s.description ?? '' })}>Edit {s.title}</button>
            <button className="chip" onClick={() => remove(s.id)}>{confirm === s.id ? 'Tap again to remove' : 'Remove'}</button>
          </div>
        </div>
      ))}
      {err && <div className="error" role="alert">{err}</div>}
      <div className="bottom-bar"><div><button className="btn" onClick={() => setDraft({ ...blank })}>Add a service</button></div></div>
    </main>
  )
}
