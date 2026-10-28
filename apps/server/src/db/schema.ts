import { boolean, index, integer, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

const ts = (name: string) => timestamp(name, { withTimezone: true })
const createdAt = () => ts('created_at').notNull().defaultNow()

export const roleEnum = pgEnum('role', ['customer', 'provider', 'admin'])
export const userStatusEnum = pgEnum('user_status', ['active', 'suspended'])

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),   // always stored lower-case
  phone: text('phone'),
  passwordHash: text('password_hash').notNull(),
  role: roleEnum('role').notNull(),
  photoUrl: text('photo_url'),
  area: text('area'),
  emailVerified: boolean('email_verified').notNull().default(false),
  status: userStatusEnum('status').notNull().default('active'),
  emergencyName: text('emergency_name'),
  emergencyPhone: text('emergency_phone'),
  totpSecret: text('totp_secret'),            // admins only
  createdAt: createdAt(),
})

export const refreshTokens = pgTable('refresh_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: ts('expires_at').notNull(),
  revokedAt: ts('revoked_at'),
  createdAt: createdAt(),
}, (t) => [index().on(t.userId)])

// One-time codes and links sent by email: 6-digit verification codes and password reset tokens.
export const emailCodes = pgTable('email_codes', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  purpose: text('purpose', { enum: ['verify_email', 'reset_password'] }).notNull(),
  codeHash: text('code_hash').notNull(),
  attempts: integer('attempts').notNull().default(0),
  expiresAt: ts('expires_at').notNull(),
  usedAt: ts('used_at'),
  createdAt: createdAt(),
}, (t) => [index().on(t.userId, t.purpose), index().on(t.codeHash)])

// Admin sign-in step 1 creates a challenge; step 2 completes it with an authenticator code.
export const adminChallenges = pgTable('admin_challenges', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  attempts: integer('attempts').notNull().default(0),
  expiresAt: ts('expires_at').notNull(),
  usedAt: ts('used_at'),
  createdAt: createdAt(),
})

export type UserRow = typeof users.$inferSelect
