import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { ErrorBox, Loading } from '../components/States'
import { useFetch } from '../lib/useFetch'
import { uploadFile } from '../lib/upload'
import type { Bank, Onboarding, StepStatus } from '../api/types'

const LABEL: Record<StepStatus, [string, boolean]> = { todo: ['To do', true], submitted: ['In review', true], done: ['Done', false], rejected: ['Needs attention', true] }
const ID_TYPES = [['nin', 'NIN slip or card'], ['passport', 'International passport'], ['drivers_licence', 'Driver’s licence'], ['voters_card', 'Voter’s card']]

export default function ProOnboarding() {
  const ob = useFetch<Onboarding>('/provider/onboarding')
  const banks = useFetch<Bank[]>('/banks')
  const [open, setOpen] = useState<'id' | 'selfie' | 'bank' | null>(null)
  const [idType, setIdType] = useState('nin')
  const [idNo, setIdNo] = useState('')
  const [bank, setBank] = useState('')
  const [acct, setAcct] = useState('')
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const idFile = useRef<HTMLInputElement>(null)
  const selfie = useRef<HTMLInputElement>(null)

  async function run(fn: () => Promise<string | void>) {
    setBusy(true); setErr(''); setMsg('')
    try { const m = await fn(); if (m) setMsg(m); setOpen(null); ob.reload() } catch (e) { setErr((e as Error).message) } finally { setBusy(false) }
  }
  const submitId = (e: FormEvent) => { e.preventDefault(); run(async () => {
    const f = idFile.current?.files?.[0]
    if (idNo.trim().length < 6) throw new Error('Enter the number on your ID.')
    if (!f) throw new Error('Take or choose a clear photo of your ID.')
    await api('/provider/onboarding/id', { method: 'POST', body: { id_type: idType, id_number: idNo.trim(), image_url: await uploadFile(f, 'id_document') } })
    return 'ID sent. We usually check it within a day.' }) }
  const submitSelfie = (e: FormEvent) => { e.preventDefault(); run(async () => {
    const f = selfie.current?.files?.[0]
    if (!f) throw new Error('Take a selfie to continue.')
    await api('/provider/onboarding/selfie', { method: 'POST', body: { image_url: await uploadFile(f, 'selfie') } })
    return 'Selfie sent. We will match it to your ID.' }) }
  const submitBank = (e: FormEvent) => { e.preventDefault(); run(async () => {
    if (!bank) throw new Error('Choose your bank.')
    if (!/^\d{10}$/.test(acct)) throw new Error('Your account number must be 10 digits.')
    const r = await api<{ account_name: string; bank_name: string }>('/provider/bank-account', { method: 'PUT', body: { bank_code: bank, account_number: acct } })
    return `Account found: ${r.account_name} (${r.bank_name}). The name must match your ID.` }) }

  const o = ob.data
  const row = (key: 'id' | 'selfie' | 'bank' | null, title: string, sub: string, status: StepStatus) => {
    const [text, warn] = LABEL[status]
    return (
      <div className="card row">
        <div><b>{title}</b><div className="muted">{sub}</div></div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className={warn ? 'tag tag-warn' : 'tag'}>{text}</span>
          {key && status !== 'done' && <button className="chip" onClick={() => { setOpen(key); setErr(''); setMsg('') }} aria-label={`${status === 'todo' ? 'Start' : 'Update'} ${title}`}>{status === 'todo' ? 'Start' : 'Update'}</button>}
        </div>
      </div>
    )
  }

  return (
    <main className="screen">
      <Link to="/pro" className="back">← Back</Link>
      <div><h1 style={{ fontSize: 30 }}>Get verified</h1><div className="muted">Customers book verified stylists. This keeps everyone safe.</div></div>
      {ob.loading && <Loading />}
      {ob.error && <ErrorBox message={ob.error} retry={ob.retry} />}
      {msg && <div className="panel" role="status">{msg}</div>}
      {o && <>
        {o.overall === 'approved' && <div className="panel" style={{ background: 'var(--success-bg)', color: 'var(--success-text)' }}><b>You are verified</b></div>}
        {o.overall === 'in_review' && <div className="panel"><b>We are reviewing your details</b><span className="muted">You will get an email when you are approved.</span></div>}
        {o.overall === 'rejected' && <div className="panel"><b>Something needs attention</b><span className="muted">Update the steps marked “Needs attention”.</span></div>}
        {row('id', 'ID card', 'NIN, passport, licence or voter’s card', o.id_status)}
        {row('selfie', 'Selfie check', 'Takes 30 seconds', o.selfie_status)}
        {row('bank', 'Bank account', 'Where you get paid', o.bank_status)}
        <Link to="/pro/portfolio" className="card row" style={{ textDecoration: 'none' }}><div><b>Portfolio</b><div className="muted">At least 5 photos of your work</div></div>
          <span className={LABEL[o.portfolio_status][1] ? 'tag tag-warn' : 'tag'}>{LABEL[o.portfolio_status][0]}</span></Link>
      </>}

      {open === 'id' && <form className="card stack" onSubmit={submitId} noValidate><b>Your ID</b>
        <div className="field"><label className="label" htmlFor="it">ID type</label><select id="it" className="input" value={idType} onChange={(e) => setIdType(e.target.value)}>{ID_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div className="field"><label className="label" htmlFor="in">ID number</label><input id="in" className="input" value={idNo} onChange={(e) => setIdNo(e.target.value)} /></div>
        <div className="field"><label className="label" htmlFor="if">Photo of your ID</label><input id="if" ref={idFile} type="file" accept="image/*" capture="environment" className="input" style={{ paddingTop: 12 }} /></div>
        <button className="btn" disabled={busy}>{busy ? 'Sending…' : 'Send ID'}</button></form>}
      {open === 'selfie' && <form className="card stack" onSubmit={submitSelfie} noValidate><b>Selfie</b>
        <div className="field"><label className="label" htmlFor="sf">Take a clear selfie in good light</label><input id="sf" ref={selfie} type="file" accept="image/*" capture="user" className="input" style={{ paddingTop: 12 }} /></div>
        <button className="btn" disabled={busy}>{busy ? 'Sending…' : 'Send selfie'}</button></form>}
      {open === 'bank' && <form className="card stack" onSubmit={submitBank} noValidate><b>Payout account</b>
        <div className="field"><label className="label" htmlFor="bk">Bank</label><select id="bk" className="input" value={bank} onChange={(e) => setBank(e.target.value)}><option value="">Choose…</option>{banks.data?.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}</select></div>
        <div className="field"><label className="label" htmlFor="ac">Account number</label><input id="ac" className="input" inputMode="numeric" maxLength={10} value={acct} onChange={(e) => setAcct(e.target.value.replace(/\D/g, ''))} /></div>
        <button className="btn" disabled={busy}>{busy ? 'Checking…' : 'Check account'}</button></form>}
      {err && <div className="error" role="alert">{err}</div>}
    </main>
  )
}
