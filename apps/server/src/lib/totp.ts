import { createHmac, randomBytes } from 'node:crypto'

// RFC 6238 time-based codes, compatible with Google Authenticator, Authy, 1Password and similar apps.
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function newTotpSecret(): string {
  let bits = '', out = ''
  for (const b of randomBytes(20)) bits += b.toString(2).padStart(8, '0')
  for (let i = 0; i + 5 <= bits.length; i += 5) out += B32[parseInt(bits.slice(i, i + 5), 2)]
  return out
}

function decode(secret: string): Buffer {
  let bits = ''
  for (const c of secret.replace(/=+$/, '').toUpperCase()) {
    const v = B32.indexOf(c)
    if (v >= 0) bits += v.toString(2).padStart(5, '0')
  }
  const bytes: number[] = []
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2))
  return Buffer.from(bytes)
}

function codeAt(key: Buffer, counter: number): string {
  const msg = Buffer.alloc(8)
  msg.writeBigUInt64BE(BigInt(counter))
  const h = createHmac('sha1', key).update(msg).digest()
  const o = h[h.length - 1]! & 0xf
  const n = (h.readUInt32BE(o) & 0x7fffffff) % 1_000_000
  return String(n).padStart(6, '0')
}

// Accepts the current 30-second window and one either side for clock drift.
export function verifyTotp(secret: string, code: string, now = Date.now()): boolean {
  const key = decode(secret), step = Math.floor(now / 30_000)
  return [-1, 0, 1].some((d) => codeAt(key, step + d) === code)
}

export const otpauthUrl = (secret: string, email: string) =>
  `otpauth://totp/GlamBooking:${encodeURIComponent(email)}?secret=${secret}&issuer=GlamBooking`
