import { randomUUID } from 'node:crypto'
import type { Db } from '../db/database.ts'
import type { AppRole } from '../../domain/enums.ts'

export interface UserRow {
  id: string
  email: string
  name: string
  password_hash: string
  role: AppRole
  failed_login_count: number
  locked_until: string | null
  created_at: string
}

export function findUserByEmail(db: Db, email: string): UserRow | undefined {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase()) as UserRow | undefined
}

export function insertUser(
  db: Db,
  user: { email: string; name: string; passwordHash: string; role: AppRole; createdAt: string },
): UserRow {
  const id = randomUUID()
  db.prepare(
    `INSERT INTO users (id, email, name, password_hash, role, failed_login_count, locked_until, created_at)
     VALUES (?, ?, ?, ?, ?, 0, NULL, ?)`,
  ).run(id, user.email.trim().toLowerCase(), user.name, user.passwordHash, user.role, user.createdAt)
  return findUserByEmail(db, user.email) as UserRow
}

export function updateLoginState(db: Db, id: string, failedCount: number, lockedUntil: string | null): void {
  db.prepare('UPDATE users SET failed_login_count = ?, locked_until = ? WHERE id = ?').run(failedCount, lockedUntil, id)
}

export function listUsers(db: Db): Pick<UserRow, 'id' | 'email' | 'name'>[] {
  return db.prepare('SELECT id, email, name FROM users ORDER BY email').all() as Pick<UserRow, 'id' | 'email' | 'name'>[]
}
