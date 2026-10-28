import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { saveSession } from '../api/auth'
import type { AuthResult } from '../api/auth'

export default function AdminLogin() {
  const go = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [challenge, setChallenge] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault(); setErr('')
    setBusy(true)
    try {
      if (!challenge) {
        if (!email || !password) throw new Error('Enter your email and password.')
        const r = await api<{ challenge_id: string }>('/admin/auth/login', { method: 'POST', body: { email, password } })
        setChallenge(r.challenge_id)
      } else {
        if (!/^\d{6}$/.test(code)) throw new Error('Enter the 6-digit security code.')
        const r = await api<AuthResult>('/admin/auth/verify-2fa', { method: 'POST', body: { challenge_id: challenge, code } })
        if (r.user.role !== 'admin') throw new Error('This account does not have admin access.')
        saveSession(r); go('/admin')
      }
    } catch (e2) { setErr((e2 as Error).message) } finally { setBusy(false) }
  }

  return (
    <form className="admin-login" onSubmit={submit} noValidate>
      <h1>[App name] Admin</h1>
      {!challenge ? <>
        <div className="field"><label className="label" htmlFor="ae">Email</label><input id="ae" className="input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="field"><label className="label" htmlFor="ap">Password</label><input id="ap" className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
      </> : (
        <div className="field"><label className="label" htmlFor="ac">Security code</label><input id="ac" className="input" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
          <span className="muted">Enter the 6-digit code from your authenticator app.</span></div>
      )}
      {err && <div className="error" role="alert">{err}</div>}
      <button className="btn" disabled={busy}>{busy ? 'Please wait…' : challenge ? 'Verify and sign in' : 'Sign in'}</button>
      {!challenge && <div className="muted">You will be asked for a security code after signing in.</div>}
    </form>
  )
}
