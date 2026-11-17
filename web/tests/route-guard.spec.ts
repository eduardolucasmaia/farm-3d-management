import { beforeEach, describe, expect, test } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
})

describe('route-guard', () => {
  test('visita a /fila sem sessão cai em /entrar', async () => {
    const { createAppRouter } = await import('../src/router')
    const router = createAppRouter('memory')
    await router.push('/fila')
    expect(router.currentRoute.value.path).toBe('/entrar')
  })

  test('com sessão, /fila abre', async () => {
    const { createAppRouter } = await import('../src/router')
    const { useSessionStore } = await import('../src/stores/session')
    useSessionStore().setSession({ token: 't', email: 'producao@farm3d.local', roles: ['Production'] })
    const router = createAppRouter('memory')
    await router.push('/fila')
    expect(router.currentRoute.value.path).toBe('/fila')
  })
})
