import { and, eq, isNull } from 'drizzle-orm'
import { SignJWT, jwtVerify } from 'jose'
import type { FastifyRequest } from 'fastify'
import { config } from '../config.js'
import { db } from '../db/index.js'
import { refreshTokens, users, type UserRow } from '../db/schema.js'
import { randomToken, sha256 } from './crypto.js'
import { forbidden, unauthorized } from './errors.js'
import { newId } from './ids.js'

const ACCESS_TTL = '15m'
const REFRESH_DAYS = 30
type Role = UserRow['role']

export function userDto(u: UserRow) {
  return {
    id: u.id, name: u.name, email: u.email, phone: u.phone ?? undefined, role: u.role,
    photo_url: u.photoUrl, email_verified: u.emailVerified, status: u.status,
    emergency_contact: u.emergencyName && u.emergencyPhone ? { name: u.emergencyName, phone: u.emergencyPhone } : null,
  }
}

// Signs in: a short-lived access token (JWT) plus a long-lived refresh token stored only as a hash.
export async function issueSession(u: UserRow) {
  const access_token = await new SignJWT({ role: u.role })
    .setProtectedHeader({ alg: 'HS256' }).setSubject(u.id).setIssuedAt().setExpirationTime(ACCESS_TTL)
    .sign(config.jwtSecret)
  const refresh_token = randomToken()
  await db.insert(refreshTokens).values({
    id: newId('rt'), userId: u.id, tokenHash: sha256(refresh_token),
    expiresAt: new Date(Date.now() + REFRESH_DAYS * 86_400_000),
  })
  return { access_token, refresh_token, user: userDto(u) }
}

// Swaps a refresh token for a new session. Each refresh token works once; reusing a spent one
// means it may have been stolen, so every session for that user is ended.
export async function rotateSession(token: string) {
  const row = await db.query.refreshTokens.findFirst({ where: eq(refreshTokens.tokenHash, sha256(token)) })
  if (!row || row.expiresAt < new Date()) throw unauthorized()
  if (row.revokedAt) {
    await revokeAllSessions(row.userId)
    throw unauthorized()
  }
  const revoked = await db.update(refreshTokens).set({ revokedAt: new Date() })
    .where(and(eq(refreshTokens.id, row.id), isNull(refreshTokens.revokedAt))).returning({ id: refreshTokens.id })
  if (!revoked.length) throw unauthorized()   // lost a race with a parallel refresh
  const u = await db.query.users.findFirst({ where: eq(users.id, row.userId) })
  if (!u || u.status !== 'active') throw unauthorized()
  return issueSession(u)
}

export async function revokeAllSessions(userId: string) {
  await db.update(refreshTokens).set({ revokedAt: new Date() })
    .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)))
}

// Reads the bearer token, loads the user and checks they are active (and have one of `roles`, if given).
export async function requireUser(req: FastifyRequest, ...roles: Role[]): Promise<UserRow> {
  const h = req.headers.authorization
  if (!h?.startsWith('Bearer ')) throw unauthorized()
  let sub: string | undefined
  try {
    sub = (await jwtVerify(h.slice(7), config.jwtSecret, { algorithms: ['HS256'] })).payload.sub
  } catch {
    throw unauthorized('Your session has expired. Please sign in again.', 'TOKEN_EXPIRED')
  }
  const u = sub ? await db.query.users.findFirst({ where: eq(users.id, sub) }) : undefined
  if (!u) throw unauthorized()
  if (u.status !== 'active') throw forbidden('This account has been suspended. Please contact support.', 'ACCOUNT_SUSPENDED')
  if (roles.length && !roles.includes(u.role)) throw forbidden()
  return u
}
