import { useEffect, useState } from 'react'
import ProNav from '../components/ProNav'
import { api } from '../api/client'
import { ErrorBox, Loading } from '../components/States'
import { useFetch } from '../lib/useFetch'
import type { Hours } from '../api/types'

const ORDER = [1, 2, 3, 4, 5, 6, 0]
const NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
type Day = { on: boolean; start: string; end: string }

export default function ProCalendar() {
  const hours = useFetch<Hours[]>('/provider/availability')
  const blocked = useFetch<string[]>('/provider/blocked-dates')
  const [days, setDays] = useState<Record<number, Day>>({})
  const [date, setDate] = useState('')
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!hours.data) return
    const d: Record<number, Day> = {}
    for (const n of ORDER) { const h = hours.data.find((x) => x.day_of_week === n); d[n] = { on: !!h, start: h?.start_time ?? '09:00', end: h?.end_time ?? '18:00' } }
    setDays(d)
  }, [hours.data])

  const set = (n: number, patch: Partial<Day>) => setDays((d) => ({ ...d, [n]: { ...d[n], ...patch } }))

  async function save() {
    setErr(''); setMsg('')
    for (const n of ORDER) if (days[n]?.on && days[n].end <= days[n].start) return setErr(`${NAMES[n]}: the end time must be after the start time.`)
    setBusy(true)
    try {
      await api<void>('/provider/availability', { method: 'PUT', body: ORDER.filter((n) => days[n]?.on).map((n) => ({ day_of_week: n, start_time: days[n].start, end_time: days[n].end })) })
      setMsg('Your hours are saved.')
    } catch (e) { setErr((e as Error).message) } finally { setBusy(false) }
  }
  async function block() {
    setErr(''); setMsg('')
    if (!date) return setErr('Choose a date to block.')
    try { await api('/provider/blocked-dates', { method: 'POST', body: { date } }); setDate(''); blocked.reload() } catch (e) { setErr((e as Error).message) }
  }
  async function unblock(d: string) {
    try { await api<void>(`/provider/blocked-dates/${d}`, { method: 'DELETE' }); blocked.reload() } catch (e) { setErr((e as Error).message) }
  }

  return (
    <main className="screen has-nav">
      <h1>Availability</h1>
      {hours.loading && <Loading />}
      {hours.error && <ErrorBox message={hours.error} retry={hours.retry} />}
      {hours.data && ORDER.map((n) => days[n] && (
        <div key={n} className="card stack" style={{ gap: 8 }}>
          <label className="row" style={{ cursor: 'pointer' }}><b>{NAMES[n]}</b>
            <input type="checkbox" checked={days[n].on} onChange={(e) => set(n, { on: e.target.checked })} aria-label={`Available on ${NAMES[n]}`} style={{ width: 24, height: 24 }} /></label>
          {days[n].on
            ? <div className="row"><input type="time" className="input" aria-label={`${NAMES[n]} start time`} value={days[n].start} onChange={(e) => set(n, { start: e.target.value })} />
                <span className="muted">to</span><input type="time" className="input" aria-label={`${NAMES[n]} end time`} value={days[n].end} onChange={(e) => set(n, { end: e.target.value })} /></div>
            : <span className="muted">Off</span>}
        </div>
      ))}
      {hours.data && <button className="btn" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save hours'}</button>}

      <h2 style={{ fontSize: 20, marginTop: 8 }}>Days off</h2>
      <div className="row"><input type="date" className="input" aria-label="Date to block" value={date} onChange={(e) => setDate(e.target.value)} />
        <button className="chip" onClick={block}>Block</button></div>
      <div className="chips">{blocked.data?.map((d) => <button key={d} className="chip" onClick={() => unblock(d)} aria-label={`Unblock ${d}`}>{d} ✕</button>)}</div>
      {err && <div className="error" role="alert">{err}</div>}
      {msg && <div className="panel" role="status">{msg}</div>}
      <ProNav />
    </main>
  )
}
