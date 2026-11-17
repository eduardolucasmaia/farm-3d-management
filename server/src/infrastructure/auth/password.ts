import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

// research.md item 4: scrypt, sal de 16 bytes, chave de 64 bytes.
const KEY_LENGTH = 64

export function hashPassword(plain: string): string {
  const salt = randomBytes(16)
  const hash = scryptSync(plain, salt, KEY_LENGTH)
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`
}

export function verifyPassword(plain: string, stored: string): boolean {
  const [scheme, saltB64, hashB64] = stored.split('$')
  if (scheme !== 'scrypt' || !saltB64 || !hashB64) return false
  const expected = Buffer.from(hashB64, 'base64')
  const actual = scryptSync(plain, Buffer.from(saltB64, 'base64'), expected.length)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

/** Hash descartável para gastar o mesmo tempo quando o e-mail não existe. */
export const DUMMY_HASH = hashPassword('dummy-password-never-matches')
