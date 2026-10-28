import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../api/auth'
import type { Role } from '../api/auth'

export default function Signup() {
  const go = useNavigate()
  const [role, setRole] = useState<Role>('customer')
  const [f, setF] = useState({ name: '', email: '', phone: '+234', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value })

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (f.name.trim().length < 2) return setError('Please enter your full name.')
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return setError('Please enter a valid email address.')
    if (!/^\+?\d{10,15}$/.test(f.phone.replace(/\s/g, ''))) return setError('Please enter a valid phone number, for example +2348012345678.')
    if (f.password.length < 8) return setError('Your password needs at least 8 characters.')
    setBusy(true)
    try {
      await register({ ...f, role })
      go('/verify-email', { state: { email: f.email } })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="screen">
      <form onSubmit={submit} style={{ display: 'contents' }} noValidate>
        <div><div className="muted">Step 1 of 2</div><h1>Create your account</h1></div>

        <div className="field" role="group" aria-label="How will you use the app?">
          <span className="label">I am here to</span>
          <button type="button" className="choice" aria-pressed={role === 'customer'} onClick={() => setRole('customer')}>
            <b>Book a stylist</b><span className="muted">Find trusted makeup artists and stylists who come to you.</span>
          </button>
          <button type="button" className="choice" aria-pressed={role === 'provider'} onClick={() => setRole('provider')}>
            <b>Offer my services</b><span className="muted">Get booked and paid safely. We verify your ID first.</span>
          </button>
        </div>

        <div className="field"><label className="label" htmlFor="name">Full name</label>
          <input id="name" className="input" autoComplete="name" value={f.name} onChange={set('name')} /></div>
        <div className="field"><label className="label" htmlFor="email">Email</label>
          <input id="email" className="input" type="email" autoComplete="email" value={f.email} onChange={set('email')} /></div>
        <div className="field"><label className="label" htmlFor="phone">Phone number</label>
          <input id="phone" className="input" type="tel" autoComplete="tel" value={f.phone} onChange={set('phone')} />
          <span className="muted">Required. Used for bookings, safety and support. Never shown to other users.</span></div>
        <div className="field"><label className="label" htmlFor="password">Password</label>
          <input id="password" className="input" type="password" autoComplete="new-password" value={f.password} onChange={set('password')} />
          <span className="muted">At least 8 characters.</span></div>

        {error && <div className="error" role="alert">{error}</div>}

        <div className="bottom-bar"><div>
          <button className="btn" type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
          <div className="muted center">Already have an account? <Link to="/login" style={{ fontWeight: 700 }}>Log in</Link></div>
        </div></div>
      </form>
    </main>
  )
}
