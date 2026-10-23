import { useNavigate } from 'react-router-dom'

export default function Welcome() {
  const go = useNavigate()
  return (
    <main className="screen">
      <div className="hero" role="img" aria-label="Photo of a stylist at work (placeholder)">Hero photo: stylist at work</div>
      <div className="label" style={{ fontWeight: 700, letterSpacing: '.08em' }}>[APP NAME]</div>
      <h1>Beauty that comes to you</h1>
      <p className="muted" style={{ fontSize: 15, margin: 0 }}>
        Book trusted makeup artists and stylists. Pay safely, and they are paid when the job is done.
      </p>
      <div className="bottom-bar"><div>
        <button className="btn" onClick={() => go('/signup')}>Create account</button>
        <button className="btn btn-alt" onClick={() => go('/login')}>Log in</button>
        <div className="muted center">By continuing you agree to the Terms and Privacy Policy.</div>
      </div></div>
    </main>
  )
}
