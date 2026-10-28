// Creates (or resets) an admin account and prints the authenticator secret.
// Usage: npm run admin:create -- admin@example.com "Admin Name" "a-strong-password"
import { eq } from 'drizzle-orm'
import { db, sql } from '../db/index.js'
import { users } from '../db/schema.js'
import { hashPassword } from '../lib/crypto.js'
import { newId } from '../lib/ids.js'
import { newTotpSecret, otpauthUrl } from '../lib/totp.js'

const [emailArg, name, password] = process.argv.slice(2)
if (!emailArg || !name || !password || password.length < 12) {
  console.error('Usage: npm run admin:create -- <email> "<name>" "<password of 12+ characters>"')
  process.exit(1)
}
const email = emailArg.toLowerCase()
const secret = newTotpSecret()
const values = { name, passwordHash: await hashPassword(password), role: 'admin' as const, emailVerified: true, status: 'active' as const, totpSecret: secret }
const existing = await db.query.users.findFirst({ where: eq(users.email, email) })
if (existing) await db.update(users).set(values).where(eq(users.id, existing.id))
else await db.insert(users).values({ id: newId('us'), email, ...values })

console.log(`Admin ready: ${email}`)
console.log(`Add this to your authenticator app (manual entry): ${secret}`)
console.log(`Or as a link: ${otpauthUrl(secret, email)}`)
await sql.end()
