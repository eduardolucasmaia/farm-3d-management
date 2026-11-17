import type { Db } from '../db/database.ts'
import { AppRole } from '../../domain/enums.ts'
import { checkPasswordPolicy } from '../../domain/rules/password-policy.ts'
import { hashPassword } from '../auth/password.ts'
import { findUserByEmail, insertUser } from '../repositories/users-repo.ts'

// Um usuário por papel, com os e-mails de quickstart.md. Só em development (T011).
export const SEED_USERS = [
  { email: 'admin@farm3d.local', name: 'Admin (semente)', role: AppRole.Admin },
  { email: 'vendas@farm3d.local', name: 'Vendas (semente)', role: AppRole.Sales },
  { email: 'producao@farm3d.local', name: 'Produção (semente)', role: AppRole.Production },
  { email: 'compras@farm3d.local', name: 'Compras (semente)', role: AppRole.Purchasing },
  { email: 'operador@farm3d.local', name: 'Operador (semente)', role: AppRole.Operator },
] as const

/** Cria os usuários que ainda não existem. Devolve quantos criou. */
export function seedIdentity(db: Db, password: string, now: string): number {
  const policy = checkPasswordPolicy(password)
  if (!policy.ok) {
    throw new Error(`FARM3D_SEED_PASSWORD fora da política: ${policy.message}`)
  }
  let created = 0
  for (const user of SEED_USERS) {
    if (findUserByEmail(db, user.email)) continue
    insertUser(db, { ...user, passwordHash: hashPassword(password), createdAt: now })
    created++
  }
  return created
}
