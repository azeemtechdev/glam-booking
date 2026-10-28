import { randomBytes } from 'node:crypto'

const ALPHABET = '0123456789abcdefghijkmnpqrstuvwxyz'

// Short prefixed ids like us_k3j9x2m4q8p1, matching the style in the API contract.
export function newId(prefix: string, length = 12): string {
  const bytes = randomBytes(length)
  let out = ''
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length]
  return `${prefix}_${out}`
}
