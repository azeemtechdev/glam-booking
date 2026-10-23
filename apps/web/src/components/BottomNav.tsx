import { NavLink } from 'react-router-dom'

export default function BottomNav() {
  return (
    <nav className="nav" aria-label="Main"><div>
      <NavLink to="/home">Home</NavLink>
      <NavLink to="/bookings">Bookings</NavLink>
      <NavLink to="/messages">Messages</NavLink>
      <NavLink to="/profile">Profile</NavLink>
    </div></nav>
  )
}
