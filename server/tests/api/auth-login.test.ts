import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp, TEST_PASSWORD } from '../helpers/test-app.ts'
import { verifyToken } from '../../src/infrastructure/auth/jwt.ts'
import { TEST_SIGNING_KEY } from '../helpers/test-app.ts'

let app: FastifyInstance
let clock: { now: string }

beforeEach(async () => {
  ;({ app, clock } = await buildTestApp({ seedUsers: true }))
  await app.ready()
})

afterEach(async () => {
  await app.close()
})

function login(email: string, password: string) {
  return app.inject({ method: 'POST', url: '/api/auth/login', payload: { email, password } })
}

describe('POST /api/auth/login (contracts/auth.md)', () => {
  it('devolve token, e-mail e papéis', async () => {
    const res = await login('Vendas@Farm3d.local', TEST_PASSWORD)
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.email).toBe('vendas@farm3d.local')
    expect(body.roles).toEqual(['Sales'])
    const claims = await verifyToken(body.token, TEST_SIGNING_KEY)
    expect(claims.role).toBe('Sales')
  })

  it('senha errada e e-mail inexistente dão a mesma 401', async () => {
    const wrong = await login('vendas@farm3d.local', 'Errada1!')
    const missing = await login('ninguem@farm3d.local', 'Errada1!')
    expect(wrong.statusCode).toBe(401)
    expect(missing.statusCode).toBe(401)
    expect(wrong.json().detail).toBe(missing.json().detail)
  })

  it('cinco falhas travam por 5 minutos, com a mesma 401', async () => {
    for (let i = 0; i < 5; i++) await login('vendas@farm3d.local', 'Errada1!')
    const locked = await login('vendas@farm3d.local', TEST_PASSWORD)
    expect(locked.statusCode).toBe(401)
    clock.now = '2026-11-17T12:05:01.000Z'
    const after = await login('vendas@farm3d.local', TEST_PASSWORD)
    expect(after.statusCode).toBe(200)
  })
})
