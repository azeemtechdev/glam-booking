import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { getToken } from '../api/client'

export default function RequireAuth({ children }: { children: ReactNode }) {
  return getToken() ? <>{children}</> : <Navigate to="/login" replace />
}
