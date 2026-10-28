import { NavLink } from 'react-router-dom'

export default function ProNav() {
  return (
    <nav className="nav" aria-label="Stylist"><div>
      <NavLink to="/pro" end>Today</NavLink>
      <NavLink to="/pro/requests">Requests</NavLink>
      <NavLink to="/pro/calendar">Calendar</NavLink>
      <NavLink to="/pro/earnings">Earnings</NavLink>
    </div></nav>
  )
}
