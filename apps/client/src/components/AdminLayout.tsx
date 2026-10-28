import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { getToken } from '../api/client'
import { logout } from '../api/auth'

export default function AdminLayout() {
  const go = useNavigate()
  if (!getToken() || localStorage.getItem('user_role') !== 'admin') return <Navigate to="/admin/login" replace />
  return (
    <div className="admin">
      <nav className="admin-nav" aria-label="Admin">
        <div className="brand">[App name] Admin</div>
        <NavLink to="/admin" end>Disputes</NavLink>
        <NavLink to="/admin/verifications">Verification queue</NavLink>
        <NavLink to="/admin/payouts">Payouts</NavLink>
        <NavLink to="/admin/users">Users</NavLink>
        <NavLink to="/admin/settings">Settings</NavLink>
        <button onClick={() => { logout(); go('/admin/login') }}>Sign out</button>
      </nav>
      <main className="admin-main"><Outlet /></main>
    </div>
  )
}
