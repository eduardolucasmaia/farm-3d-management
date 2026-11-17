import { jwtVerify, SignJWT } from 'jose'
import { isAppRole, type AppRole } from '../../domain/enums.ts'

// research.md item 4: HS256, validade de 8 horas, `sub` = usuário, `role` = papel.
export const TOKEN_LIFETIME = '8h'

export interface TokenClaims {
  sub: string
  role: AppRole
}

function keyBytes(key: string): Uint8Array {
  return new TextEncoder().encode(key)
}

export function signToken(claims: TokenClaims, key: string): Promise<string> {
  return new SignJWT({ role: claims.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(TOKEN_LIFETIME)
    .sign(keyBytes(key))
}

/** Lança se o token for inválido, vencido ou sem papel conhecido. */
export async function verifyToken(token: string, key: string): Promise<TokenClaims> {
  const { payload } = await jwtVerify(token, keyBytes(key), { algorithms: ['HS256'] })
  if (typeof payload.sub !== 'string' || !isAppRole(payload.role)) {
    throw new Error('Token sem sujeito ou papel válido.')
  }
  return { sub: payload.sub, role: payload.role }
}
