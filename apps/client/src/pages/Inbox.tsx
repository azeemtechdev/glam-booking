import { Link } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { ErrorBox, Loading } from '../components/States'
import { useFetch } from '../lib/useFetch'
import { dayLabel } from '../lib/format'
import type { Conversation } from '../api/types'

export default function Inbox() {
  const { data, error, loading, retry } = useFetch<Conversation[]>('/conversations', { poll: 15000 })
  return (
    <main className="screen has-nav">
      <h1>Messages</h1>
      {loading && <Loading />}
      {error && <ErrorBox message={error} retry={retry} />}
      {data && data.length === 0 && <div className="panel"><b>No messages yet</b><span className="muted">When you book a stylist, your chat appears here.</span></div>}
      {data?.map((c) => (
        <Link key={c.id} to={`/messages/${c.id}`} className="card row" style={{ textDecoration: 'none' }}>
          <div style={{ minWidth: 0 }}><b>{c.other_party.name}</b>
            <div className="muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.last_message}</div></div>
          {c.unread > 0 ? <span className="tag" aria-label={`${c.unread} unread`}>New</span> : <span className="muted">{dayLabel(c.updated_at)}</span>}
        </Link>
      ))}
      <BottomNav />
    </main>
  )
}
