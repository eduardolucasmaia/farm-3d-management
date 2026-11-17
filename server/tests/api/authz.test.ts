import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp, tokenFor } from '../helpers/test-app.ts'

let app: FastifyInstance

beforeEach(async () => {
  ;({ app } = await buildTestApp())
  // Rota só de teste: exige Admin ou Production.
  app.get('/api/__probe', { preHandler: app.requireRoles('Admin', 'Production') }, async () => ({ ok: true }))
  await app.ready()
})

afterEach(async () => {
  await app.close()
})

describe('acesso por papel (princípio VII)', () => {
  it('sem token responde 401 em problem+json', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/__probe' })
    expect(res.statusCode).toBe(401)
    expect(res.headers['content-type']).toContain('application/problem+json')
  })

  it('token inválido responde 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/__probe', headers: { authorization: 'Bearer lixo' } })
    expect(res.statusCode).toBe(401)
  })

  it('papel fora da lista responde 403', async () => {
    const token = await tokenFor('Sales')
    const res = await app.inject({ method: 'GET', url: '/api/__probe', headers: { authorization: `Bearer ${token}` } })
    expect(res.statusCode).toBe(403)
    expect(res.headers['content-type']).toContain('application/problem+json')
  })

  it('papel da lista passa', async () => {
    const token = await tokenFor('Production')
    const res = await app.inject({ method: 'GET', url: '/api/__probe', headers: { authorization: `Bearer ${token}` } })
    expect(res.statusCode).toBe(200)
  })
})
