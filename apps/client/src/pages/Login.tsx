import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login, saveSession, homeFor, resendVerification } from '../api/auth'
import type { ApiError } from '../api/client'

export default function Login() {
  const go = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!email || !password) return setError('Enter your email and password.')
    setBusy(true)
    try {
      const r = await login(email, password)
      saveSession(r)
      go(homeFor(r.user.role))
    } catch (err) {
      if ((err as ApiError).code === 'EMAIL_NOT_VERIFIED') {
        await resendVerification(email).catch(() => {})
        return go('/verify-email', { state: { email } })
      }
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="screen">
      <form onSubmit={submit} style={{ display: 'contents' }} noValidate>
        <div style={{ paddingTop: 40 }}><h1 style={{ fontSize: 34 }}>Welcome back</h1>
          <div className="muted" style={{ marginTop: 6 }}>Log in with your email and password.</div></div>
        <div className="field"><label className="label" htmlFor="email">Email</label>
          <input id="email" className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="field"><label className="label" htmlFor="password">Password</label>
          <input id="password" className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <div className="muted" style={{ textAlign: 'right' }}><Link to="/login" style={{ fontWeight: 700 }}>Forgot password?</Link></div>
        {error && <div className="error" role="alert">{error}</div>}
        <div className="bottom-bar"><div>
          <button className="btn" type="submit" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
          <div className="muted center">New here? <Link to="/signup" style={{ fontWeight: 700 }}>Create an account</Link></div>
        </div></div>
      </form>
    </main>
  )
}
