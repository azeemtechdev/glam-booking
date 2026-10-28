import { useState } from 'react'
import { Link } from 'react-router-dom'
import ProviderCard from '../components/ProviderCard'
import { ErrorBox, Loading } from '../components/States'
import { useFetch } from '../lib/useFetch'
import type { Category, ProviderSummary } from '../api/types'

const AREAS = ['Lekki', 'Victoria Island', 'Ikoyi', 'Yaba', 'Ikeja', 'Surulere']
const PRICES = [{ l: 'Any price' }, { l: 'Under ₦20,000', max: 2000000 }, { l: '₦20,000 – ₦50,000', min: 2000000, max: 5000000 }, { l: 'Over ₦50,000', min: 5000000 }]

export default function Search() {
  const [q, setQ] = useState('')
  const [area, setArea] = useState('')
  const [cat, setCat] = useState('')
  const [price, setPrice] = useState(0)
  const [rating, setRating] = useState(0)
  const cats = useFetch<Category[]>('/categories')

  const qs = new URLSearchParams({ limit: '30' })
  if (q.trim()) qs.set('q', q.trim())
  if (area) qs.set('area', area)
  if (cat) qs.set('category', cat)
  if (PRICES[price].min) qs.set('min_price_kobo', String(PRICES[price].min))
  if (PRICES[price].max) qs.set('max_price_kobo', String(PRICES[price].max))
  if (rating) qs.set('min_rating', String(rating))
  const list = useFetch<{ items: ProviderSummary[] }>(`/providers?${qs}`)

  const reset = () => { setQ(''); setArea(''); setCat(''); setPrice(0); setRating(0) }
  const pick = <T,>(cur: T, v: T, set: (x: T) => void, off: T) => () => set(cur === v ? off : v)

  return (
    <main className="screen">
      <div className="row"><Link to="/home" className="back">← Back</Link><button className="btn-link" onClick={reset}>Clear all</button></div>
      <h1 style={{ fontSize: 30 }}>Find a stylist</h1>
      <input className="input" type="search" aria-label="Search" placeholder="Search makeup, braids, wigs" value={q} onChange={(e) => setQ(e.target.value)} />

      <div className="stack"><span className="label">Area</span><div className="chips" role="group" aria-label="Area">
        {AREAS.map((a) => <button key={a} className="chip" aria-pressed={area === a} onClick={pick(area, a, setArea, '')}>{a}</button>)}</div></div>
      <div className="stack"><span className="label">Service</span><div className="chips" role="group" aria-label="Service">
        {cats.data?.map((c) => <button key={c.id} className="chip" aria-pressed={cat === c.name} onClick={pick(cat, c.name, setCat, '')}>{c.name}</button>)}</div></div>
      <div className="stack"><span className="label">Price</span><div className="chips" role="group" aria-label="Price">
        {PRICES.map((p, i) => <button key={p.l} className="chip" aria-pressed={price === i} onClick={() => setPrice(i)}>{p.l}</button>)}</div></div>
      <div className="stack"><span className="label">Rating</span><div className="chips" role="group" aria-label="Rating">
        <button className="chip" aria-pressed={rating === 0} onClick={() => setRating(0)}>Any</button>
        <button className="chip" aria-pressed={rating === 4.5} onClick={() => setRating(4.5)}>4.5★ and up</button></div></div>

      <h2 style={{ fontSize: 20 }}>Results</h2>
      {list.loading && <Loading />}
      {list.error && <ErrorBox message={list.error} retry={list.retry} />}
      {list.data && list.data.items.length === 0 && <div className="panel"><b>No stylists match</b><span className="muted">Try removing a filter.</span></div>}
      <div className="cards">
        {list.data?.items.map((p, i) => <ProviderCard key={p.id} p={p} i={i} />)}
      </div>
    </main>
  )
}
