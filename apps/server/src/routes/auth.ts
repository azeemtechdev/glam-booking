import { and, desc, eq, gt, isNull } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { config } from '../config.js'
import { db } from '../db/index.js'
import { adminChallenges, emailCodes, users, type UserRow } from '../db/schema.js'
import { DUMMY_HASH, hashPassword, randomToken, safeEqual, sha256, sixDigitCode, verifyPassword } from '../lib/crypto.js'
import { sendEmail } from '../lib/email.js'
import { conflict, forbidden, invalid, parse, unauthorized } from '../lib/errors.js'
import { newId } from '../lib/ids.js'
import { issueSession, requireUser, revokeAllSessions, rotateSession, userDto } from '../lib/session.js'
import { verifyTotp } from '../lib/totp.js'

const CODE_TTL_MS = 15 * 60_000
const RESET_TTL_MS = 60 * 60_000
const MAX_ATTEMPTS = 5
const RESEND_GAP_MS = 30_000

const email = z.string().trim().toLowerCase().pipe(z.email('enter a valid email address'))
const password = z.string().min(8, 'use at least 8 characters').max(200)
const emailTaken = () => conflict('EMAIL_TAKEN', 'An account with this email already exists. Try signing in instead.')

const findByEmail = (e: string) => db.query.users.findFirst({ where: eq(users.email, e) })

async function sendVerificationCode(u: UserRow) {
  const code = sixDigitCode()
  await db.update(emailCodes).set({ usedAt: new Date() })
    .where(and(eq(emailCodes.userId, u.id), eq(emailCodes.purpose, 'verify_email'), isNull(emailCodes.usedAt)))
  await db.insert(emailCodes).values({
    id: newId('ec'), userId: u.id, purpose: 'verify_email', codeHash: sha256(code), expiresAt: new Date(Date.now() + CODE_TTL_MS),
  })
  await sendEmail({ to: u.email, subject: 'Your verification code', text: `Hi ${u.name},\n\nYour code is ${code}. It expires in 15 minutes.` })
}

export default async function authRoutes(app: FastifyInstance) {
  app.post('/auth/register', async (req, reply) => {
    const b = parse(z.object({
      name: z.string().trim().min(2, 'enter your full name').max(100),
      email,
      phone: z.string().transform((s) => s.replace(/\s/g, '')).pipe(z.string().regex(/^\+?\d{10,15}$/, 'enter a valid phone number')),
      password,
      role: z.enum(['customer', 'provider']),
    }), req.body)
    if (await findByEmail(b.email)) throw emailTaken()
    const [u] = await db.insert(users).values({
      id: newId('us'), name: b.name, email: b.email, phone: b.phone, role: b.role, passwordHash: await hashPassword(b.password),
    }).onConflictDoNothing().returning()
    if (!u) throw emailTaken()
    await sendVerificationCode(u)
    return reply.code(201).send(userDto(u))
  })

  app.post('/auth/verify-email', async (req) => {
    const b = parse(z.object({ email, code: z.string().regex(/^\d{6}$/, 'enter the 6-digit code') }), req.body)
    const wrong = invalid('CODE_INVALID', 'That code is wrong or has expired. Check your email or send a new code.')
    const u = await findByEmail(b.email)
    if (!u) throw wrong
    if (u.emailVerified) throw invalid('ALREADY_VERIFIED', 'Your email is already confirmed. Please sign in.')
    const row = await db.query.emailCodes.findFirst({
      where: and(eq(emailCodes.userId, u.id), eq(emailCodes.purpose, 'verify_email'), isNull(emailCodes.usedAt), gt(emailCodes.expiresAt, new Date())),
      orderBy: desc(emailCodes.createdAt),
    })
    if (!row || row.attempts >= MAX_ATTEMPTS) throw wrong
    if (!safeEqual(row.codeHash, sha256(b.code))) {
      await db.update(emailCodes).set({ attempts: row.attempts + 1 }).where(eq(emailCodes.id, row.id))
      throw wrong
    }
    await db.update(emailCodes).set({ usedAt: new Date() }).where(eq(emailCodes.id, row.id))
    const [verified] = await db.update(users).set({ emailVerified: true }).where(eq(users.id, u.id)).returning()
    return issueSession(verified!)
  })

  app.post('/auth/resend-verification', async (req, reply) => {
    const b = parse(z.object({ email }), req.body)
    const u = await findByEmail(b.email)
    if (u && !u.emailVerified) {
      const last = await db.query.emailCodes.findFirst({
        where: and(eq(emailCodes.userId, u.id), eq(emailCodes.purpose, 'verify_email')), orderBy: desc(emailCodes.createdAt),
      })
      if (!last || Date.now() - last.createdAt.getTime() > RESEND_GAP_MS) await sendVerificationCode(u)
    }
    return reply.code(204).send()   // same answer either way, so emails cannot be probed
  })

  app.post('/auth/login', async (req) => {
    const b = parse(z.object({ email, password: z.string().min(1) }), req.body)
    const u = await findByEmail(b.email)
    const ok = await verifyPassword(b.password, u?.passwordHash ?? DUMMY_HASH)
    if (!u || !ok) throw unauthorized('That email and password do not match.', 'INVALID_CREDENTIALS')
    if (u.role === 'admin') throw forbidden('Admins sign in from the admin panel.', 'USE_ADMIN_LOGIN')
    if (u.status !== 'active') throw forbidden('This account has been suspended. Please contact support.', 'ACCOUNT_SUSPENDED')
    if (!u.emailVerified) throw forbidden('Please confirm your email first. We can send you a new code.', 'EMAIL_NOT_VERIFIED')
    return issueSession(u)
  })

  app.post('/auth/refresh', async (req) => {
    const b = parse(z.object({ refresh_token: z.string().min(1) }), req.body)
    return rotateSession(b.refresh_token)
  })

  app.post('/auth/logout', async (req, reply) => {
    const u = await requireUser(req)
    await revokeAllSessions(u.id)
    return reply.code(204).send()
  })

  app.post('/auth/forgot-password', async (req, reply) => {
    const b = parse(z.object({ email }), req.body)
    const u = await findByEmail(b.email)
    if (u && u.role !== 'admin') {
      const token = randomToken()
      await db.insert(emailCodes).values({
        id: newId('ec'), userId: u.id, purpose: 'reset_password', codeHash: sha256(token), expiresAt: new Date(Date.now() + RESET_TTL_MS),
      })
      await sendEmail({
        to: u.email, subject: 'Reset your password',
        text: `Hi ${u.name},\n\nOpen this link to choose a new password (valid for 1 hour):\n${config.webOrigin}/reset-password?token=${token}\n\nIf you did not ask for this, ignore this email.`,
      })
    }
    return reply.code(204).send()
  })

  app.post('/auth/reset-password', async (req, reply) => {
    const b = parse(z.object({ token: z.string().min(1), password }), req.body)
    const row = await db.query.emailCodes.findFirst({
      where: and(eq(emailCodes.codeHash, sha256(b.token)), eq(emailCodes.purpose, 'reset_password'), isNull(emailCodes.usedAt), gt(emailCodes.expiresAt, new Date())),
    })
    if (!row) throw invalid('TOKEN_INVALID', 'This reset link is invalid or has expired. Please ask for a new one.')
    await db.update(emailCodes).set({ usedAt: new Date() }).where(eq(emailCodes.id, row.id))
    await db.update(users).set({ passwordHash: await hashPassword(b.password) }).where(eq(users.id, row.userId))
    await revokeAllSessions(row.userId)
    return reply.code(204).send()
  })

  // Admin sign-in: password first, then a code from an authenticator app.
  app.post('/admin/auth/login', async (req) => {
    const b = parse(z.object({ email, password: z.string().min(1) }), req.body)
    const u = await findByEmail(b.email)
    const ok = await verifyPassword(b.password, u?.passwordHash ?? DUMMY_HASH)
    if (!u || !ok || u.role !== 'admin' || !u.totpSecret) throw unauthorized('That email and password do not match.', 'INVALID_CREDENTIALS')
    if (u.status !== 'active') throw forbidden('This account has been suspended.', 'ACCOUNT_SUSPENDED')
    const id = newId('ch', 20)
    await db.insert(adminChallenges).values({ id, userId: u.id, expiresAt: new Date(Date.now() + 5 * 60_000) })
    return { challenge_id: id }
  })

  app.post('/admin/auth/verify-2fa', async (req) => {
    const b = parse(z.object({ challenge_id: z.string(), code: z.string().regex(/^\d{6}$/, 'enter the 6-digit code') }), req.body)
    const expired = unauthorized('Your sign-in expired. Please start again.', 'CHALLENGE_INVALID')
    const ch = await db.query.adminChallenges.findFirst({
      where: and(eq(adminChallenges.id, b.challenge_id), isNull(adminChallenges.usedAt), gt(adminChallenges.expiresAt, new Date())),
    })
    if (!ch || ch.attempts >= MAX_ATTEMPTS) throw expired
    const u = await db.query.users.findFirst({ where: eq(users.id, ch.userId) })
    if (!u?.totpSecret || u.status !== 'active') throw expired
    if (!verifyTotp(u.totpSecret, b.code)) {
      await db.update(adminChallenges).set({ attempts: ch.attempts + 1 }).where(eq(adminChallenges.id, ch.id))
      throw unauthorized('That security code is not right. Try the newest code in your app.', 'CODE_INVALID')
    }
    await db.update(adminChallenges).set({ usedAt: new Date() }).where(eq(adminChallenges.id, ch.id))
    return issueSession(u)
  })
}
