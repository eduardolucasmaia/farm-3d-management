describe('route-guard', () => {
  test('visit /fila without session redirects to /entrar', async () => {
    const { router } = await import('../src/router')
    await router.push('/fila')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/entrar')
  })
})
