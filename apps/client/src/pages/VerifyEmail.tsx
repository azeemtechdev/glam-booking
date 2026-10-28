import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { verifyEmail, resendVerification, saveSession, homeFor } from '../api/auth'

export default function VerifyEmail() {
  const go = useNavigate()
  const email: string = useLocation().state?.email ?? ''
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [wait, setWait] = useState(30)

  useEffect(() => {
    if (wait <= 0) return
    const t = setTimeout(() => setWait(wait - 1), 1000)
    return () => clearTimeout(t)
  }, [wait])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!/^\d{6}$/.test(code)) return setError('Enter the 6-digit code from your email.')
    setBusy(true)
    try {
      const r = await verifyEmail(email, code)
      saveSession(r)
      go(homeFor(r.user.role))
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function resend() {
    setError('')
    try { await resendVerification(email); setWait(30) } catch (err) { setError((err as Error).message) }
  }

  return (
    <main className="screen">
      <form onSubmit={submit} style={{ display: 'contents' }} noValidate>
        <div><div className="muted">Step 2 of 2</div><h1>Check your email</h1></div>
        <p className="muted" style={{ fontSize: 15, margin: 0 }}>
          We sent a 6-digit code to <b>{email || 'your email'}</b>. Enter it below.
        </p>
        <div className="field"><label className="label" htmlFor="code">6-digit code</label>
          <input id="code" className="input" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
            value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            style={{ fontSize: 24, letterSpacing: '.4em', textAlign: 'center' }} /></div>
        {error && <div className="error" role="alert">{error}</div>}
        <div className="bottom-bar"><div>
          <button className="btn" type="submit" disabled={busy}>{busy ? 'Checking…' : 'Verify email'}</button>
          <div className="muted center">
            {wait > 0 ? `Resend email in 0:${String(wait).padStart(2, '0')}` : <button type="button" className="btn-link" onClick={resend}>Resend email</button>}
          </div>
        </div></div>
      </form>
    </main>
  )
}
