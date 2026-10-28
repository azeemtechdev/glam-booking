import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { ErrorBox, Loading } from '../components/States'
import { useFetch } from '../lib/useFetch'
import { timeLabel } from '../lib/format'
import type { Conversation, Me, Message } from '../api/types'

export default function Chat() {
  const { id } = useParams()
  const me = useFetch<Me>('/me')
  const convs = useFetch<Conversation[]>('/conversations')
  const msgs = useFetch<{ items: Message[] }>(`/conversations/${id}/messages?limit=50`, { poll: 5000 })
  const [text, setText] = useState('')
  const [sent, setSent] = useState<Message[]>([])
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const end = useRef<HTMLDivElement>(null)

  const serverItems = msgs.data?.items ?? []
  const all = [...serverItems, ...sent.filter((m) => !serverItems.some((s) => s.id === m.id))]
    .sort((a, b) => a.sent_at.localeCompare(b.sent_at))
  const other = convs.data?.find((c) => c.id === id)?.other_party.name ?? 'Chat'

  useEffect(() => { end.current?.scrollIntoView?.({ block: 'end' }) }, [all.length])

  async function send(e: FormEvent) {
    e.preventDefault()
    const body = text.trim()
    if (!body) return
    setBusy(true); setErr('')
    try {
      const m = await api<Message>(`/conversations/${id}/messages`, { method: 'POST', body: { body } })
      setSent((s) => [...s, m]); setText('')
      msgs.reload()
    } catch (e2) { setErr((e2 as Error).message) } finally { setBusy(false) }
  }

  return (
    <main className="screen" style={{ paddingTop: 24 }}>
      <div className="row" style={{ justifyContent: 'flex-start' }}>
        <Link to="/messages" className="back" aria-label="Back to messages">←</Link><b style={{ fontSize: 18 }}>{other}</b>
      </div>
      <div className="panel" style={{ fontSize: 13 }}>Keep chats and payments here. You are only protected when you pay in the app. Phone numbers and bank details are hidden.</div>
      {msgs.loading && <Loading />}
      {msgs.error && <ErrorBox message={msgs.error} retry={msgs.retry} />}
      {msgs.data && all.length === 0 && <p className="muted center">No messages yet. Say hello.</p>}
      <div className="stack" aria-live="polite" aria-label="Messages">
        {all.map((m) => {
          const mine = m.sender_id === me.data?.id
          return (
            <div key={m.id} className={`bubble ${mine ? 'mine' : 'them'}`}>
              {m.body}
              {m.masked && <small>Contact details are hidden to keep you protected</small>}
              <small>{timeLabel(m.sent_at)}</small>
            </div>
          )
        })}
      </div>
      <div ref={end} />
      <form className="bottom-bar" onSubmit={send}><div className="composer">
        {err && <div className="error" role="alert" style={{ position: 'absolute', bottom: 84, left: 20, right: 20 }}>{err}</div>}
        <input className="input" aria-label="Write a message" placeholder="Write a message" value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} />
        <button className="btn" style={{ width: 90 }} disabled={busy || !text.trim()}>Send</button>
      </div></form>
    </main>
  )
}
