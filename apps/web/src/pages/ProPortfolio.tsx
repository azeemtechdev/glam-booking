import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { Photo } from '../components/Photo'
import { ErrorBox, Loading } from '../components/States'
import { useFetch } from '../lib/useFetch'
import { uploadFile } from '../lib/upload'
import type { PortfolioItem } from '../api/types'

const MIN = 5

export default function ProPortfolio() {
  const { data, error, loading, retry } = useFetch<PortfolioItem[]>('/provider/portfolio')
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const file = useRef<HTMLInputElement>(null)
  useEffect(() => { if (data) setItems([...data].sort((a, b) => a.sort_order - b.sort_order)) }, [data])

  async function add(f: File | undefined) {
    if (!f) return
    setBusy(true); setErr('')
    try {
      const url = await uploadFile(f, 'portfolio')
      const item = await api<PortfolioItem>('/provider/portfolio', { method: 'POST', body: { image_url: url } })
      setItems((x) => [...x, { ...item, caption: item.caption ?? 'New photo' }])
    } catch (e) { setErr((e as Error).message) } finally { setBusy(false); if (file.current) file.current.value = '' }
  }
  async function move(i: number, d: -1 | 1) {
    const j = i + d
    if (j < 0 || j >= items.length) return
    const next = [...items]; [next[i], next[j]] = [next[j], next[i]]
    setItems(next)
    try { await api<void>('/provider/portfolio/order', { method: 'PUT', body: { ids: next.map((x) => x.id) } }) } catch (e) { setErr((e as Error).message) }
  }
  async function remove(id: string) {
    try { await api<void>(`/provider/portfolio/${id}`, { method: 'DELETE' }); setItems((x) => x.filter((y) => y.id !== id)) } catch (e) { setErr((e as Error).message) }
  }

  return (
    <main className="screen">
      <Link to="/pro" className="back">← Back</Link>
      <div><h1 style={{ fontSize: 30 }}>Your portfolio</h1><div className="muted">Best work first. Use the arrows to reorder. Minimum {MIN} photos.</div></div>
      {loading && <Loading />}
      {error && <ErrorBox message={error} retry={retry} />}
      <div className="panel" role="status"><b>{items.length} of {MIN} photos</b><span className="muted">{items.length >= MIN ? 'You have enough photos to be listed.' : `Add ${MIN - items.length} more to finish your profile.`}</span></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {items.map((it, i) => (
          <div key={it.id} className="stack" style={{ gap: 6 }}>
            <Photo src={it.image_url} label={it.caption ?? 'Photo'} i={i} style={{ height: 160 }} />
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="chip" style={{ padding: '0 12px' }} onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${it.caption ?? 'photo'} earlier`}>←</button>
              <button className="chip" style={{ padding: '0 12px' }} onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label={`Move ${it.caption ?? 'photo'} later`}>→</button>
              <button className="chip" style={{ padding: '0 12px' }} onClick={() => remove(it.id)} aria-label={`Remove ${it.caption ?? 'photo'}`}>✕</button>
            </div>
          </div>
        ))}
      </div>
      {err && <div className="error" role="alert">{err}</div>}
      <input ref={file} type="file" accept="image/*" hidden onChange={(e) => add(e.target.files?.[0])} aria-label="Choose a photo" />
      <div className="bottom-bar"><div><button className="btn" disabled={busy} onClick={() => file.current?.click()}>{busy ? 'Uploading…' : 'Add photos'}</button></div></div>
    </main>
  )
}
