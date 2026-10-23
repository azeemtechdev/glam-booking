import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import ProviderCard from '../components/ProviderCard'
import { ErrorBox, Loading } from '../components/States'
import { useFetch } from '../lib/useFetch'
import { greeting } from '../lib/format'
import type { Category, ProviderSummary } from '../api/types'

export default function Home() {
  const name = localStorage.getItem('user_name')?.split(' ')[0] ?? ''
  const [cat, setCat] = useState('')
  const [text, setText] = useState('')
  const [q, setQ] = useState('')
  const cats = useFetch<Category[]>('/categories')
  const list = useFetch<{ items: ProviderSummary[] }>(
    `/providers?limit=20${cat ? `&category=${encodeURIComponent(cat)}` : ''}${q ? `&q=${encodeURIComponent(q)}` : ''}`,
  )
  const search = (e: FormEvent) => { e.preventDefault(); setQ(text.trim()) }

  return (
    <main className="screen has-nav">
      <div><div className="muted">Lagos</div><h1>{greeting()}{name ? `, ${name}` : ''}</h1></div>

      <form onSubmit={search} role="search" className="row">
        <input className="input" type="search" aria-label="Search stylists" placeholder="Search makeup, braids, wigs"
          value={text} onChange={(e) => setText(e.target.value)} />
        <Link to="/search" className="chip" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>Filters</Link>
      </form>

      <div className="chips" role="group" aria-label="Categories">
        <button className="chip" aria-pressed={cat === ''} onClick={() => setCat('')}>All</button>
        {cats.data?.map((c) => (
          <button key={c.id} className="chip" aria-pressed={cat === c.name} onClick={() => setCat(cat === c.name ? '' : c.name)}>{c.name}</button>
        ))}
      </div>

      <h2 style={{ fontSize: 20 }}>{q ? `Results for “${q}”` : 'Available this weekend'}</h2>
      {list.loading && <Loading />}
      {list.error && <ErrorBox message={list.error} retry={list.retry} />}
      {list.data && list.data.items.length === 0 && (
        <div className="panel"><b>No stylists found</b><span className="muted">Try a different category or search.</span></div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {list.data?.items.map((p, i) => <ProviderCard key={p.id} p={p} i={i} />)}
      </div>
      <BottomNav />
    </main>
  )
}
