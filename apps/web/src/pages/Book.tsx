import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { ErrorBox, Loading } from '../components/States'
import { useFetch } from '../lib/useFetch'
import { dayKey, dayLabel, duration, naira, timeLabel } from '../lib/format'
import type { Booking, ProviderDetail, Slot } from '../api/types'

const isoDay = (offset: number) => new Date(Date.now() + offset * 864e5).toISOString().slice(0, 10)

export default function Book() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const go = useNavigate()
  const prov = useFetch<ProviderDetail>(`/providers/${id}`)
  const serviceId = params.get('service') ?? prov.data?.services[0]?.id ?? null
  const slots = useFetch<Slot[]>(serviceId ? `/providers/${id}/availability?service_id=${serviceId}&from=${isoDay(0)}&to=${isoDay(14)}` : null)

  const [day, setDay] = useState('')
  const [slot, setSlot] = useState('')
  const [area, setArea] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const days = useMemo(() => {
    const m = new Map<string, string>()
    slots.data?.forEach((s) => { const k = dayKey(s.starts_at); if (!m.has(k)) m.set(k, dayLabel(s.starts_at)) })
    return [...m.entries()]
  }, [slots.data])
  const activeDay = day || days[0]?.[0] || ''
  const times = (slots.data ?? []).filter((s) => dayKey(s.starts_at) === activeDay)
  const service = prov.data?.services.find((s) => s.id === serviceId)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    const when = slot && times.some((t) => t.starts_at === slot) ? slot : ''
    const useArea = area || prov.data?.areas[0] || ''
    if (!when) return setError('Please pick a day and time.')
    if (address.trim().length < 5) return setError('Please enter the full address where the stylist should come.')
    if (!useArea) return setError('Please choose your area.')
    setBusy(true)
    try {
      const b = await api<Booking>('/bookings', { method: 'POST', body: { provider_id: id, service_id: serviceId, scheduled_at: when, address: address.trim(), area: useArea, notes: notes.trim() || undefined } })
      go(`/bookings/${b.id}`, { replace: true })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (prov.loading) return <main className="screen"><Loading /></main>
  if (prov.error || !prov.data || !service) return <main className="screen"><ErrorBox message={prov.error ?? 'We could not find that service.'} retry={prov.retry} /></main>

  return (
    <main className="screen">
      <form onSubmit={submit} style={{ display: 'contents' }} noValidate>
        <button type="button" className="back" onClick={() => go(-1)}>← Back</button>
        <div><div className="muted">Step 1 of 2</div><h1 style={{ fontSize: 30 }}>Book {prov.data.name}</h1></div>
        <div className="card row"><div><b>{service.title}</b><div className="muted">{duration(service.duration_minutes)}</div></div><b>{naira(service.price_kobo)}</b></div>

        <div className="stack"><span className="label">Day</span>
          {slots.loading && <Loading />}
          {slots.error && <ErrorBox message={slots.error} retry={slots.retry} />}
          {slots.data && days.length === 0 && <div className="panel"><b>No free times yet</b><span className="muted">This stylist has no open slots in the next two weeks.</span></div>}
          <div className="chips" role="group" aria-label="Day">
            {days.map(([k, label]) => <button type="button" key={k} className="chip" aria-pressed={activeDay === k} onClick={() => { setDay(k); setSlot('') }}>{label}</button>)}
          </div>
        </div>

        {times.length > 0 && <div className="stack"><span className="label">Time</span>
          <div className="chips" role="group" aria-label="Time">
            {times.map((t) => <button type="button" key={t.starts_at} className="chip" aria-pressed={slot === t.starts_at} onClick={() => setSlot(t.starts_at)}>{timeLabel(t.starts_at)}</button>)}
          </div>
        </div>}

        <div className="stack"><span className="label">Your area</span>
          <div className="chips" role="group" aria-label="Area">
            {prov.data.areas.map((a, i) => <button type="button" key={a} className="chip" aria-pressed={(area || prov.data!.areas[0]) === a && (area !== '' || i === 0)} onClick={() => setArea(a)}>{a}</button>)}
          </div>
        </div>
        <div className="field"><label className="label" htmlFor="addr">Full address</label>
          <input id="addr" className="input" autoComplete="street-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House number, street, landmark" /></div>
        <div className="field"><label className="label" htmlFor="notes">Notes for the stylist (optional)</label>
          <textarea id="notes" className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Hair length, style reference, access instructions" /></div>

        {error && <div className="error" role="alert">{error}</div>}
        <div className="bottom-bar"><div>
          <button className="btn" type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send request'}</button>
          <div className="muted center">You pay only after the stylist accepts</div>
        </div></div>
      </form>
    </main>
  )
}
