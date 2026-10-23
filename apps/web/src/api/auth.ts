import { api } from './client'

export type Role = 'customer' | 'provider'
export interface User { id: string; name: string; email: string; role: Role | 'admin'; email_verified: boolean }
export interface AuthResult { access_token: string; refresh_token: string; user: User }

export const register = (b: { name: string; email: string; phone: string; password: string; role: Role }) =>
  api<User>('/auth/register', { method: 'POST', body: b })

export const verifyEmail = (email: string, code: string) =>
  api<AuthResult>('/auth/verify-email', { method: 'POST', body: { email, code } })

export const resendVerification = (email: string) =>
  api<void>('/auth/resend-verification', { method: 'POST', body: { email } })

export const login = (email: string, password: string) =>
  api<AuthResult>('/auth/login', { method: 'POST', body: { email, password } })

export function saveSession(r: AuthResult) {
  localStorage.setItem('access_token', r.access_token)
  localStorage.setItem('refresh_token', r.refresh_token)
  localStorage.setItem('user_name', r.user.name)
  localStorage.setItem('user_role', r.user.role)
}

export function logout() {
  localStorage.clear()
}

export const homeFor = (role: string) => (role === 'provider' ? '/pro' : '/home')
