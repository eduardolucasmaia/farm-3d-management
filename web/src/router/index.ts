import {
  createMemoryHistory,
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
  type Router,
} from 'vue-router'
import { useSessionStore } from '../stores/session'

// Rotas com meta.requiresAuth exigem sessão. Cada história acrescenta suas rotas aqui, só acréscimo.
const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/fila' },
  { path: '/entrar', name: 'entrar', component: () => import('../pages/EntrarPage.vue') },
  { path: '/fila', name: 'fila', component: () => import('../pages/FilaPage.vue'), meta: { requiresAuth: true } },
]

export function createAppRouter(mode: 'web' | 'memory' = 'web'): Router {
  const router = createRouter({
    history: mode === 'memory' ? createMemoryHistory() : createWebHistory(),
    routes,
  })

  router.beforeEach((to) => {
    const session = useSessionStore()
    if (to.matched.some((record) => record.meta.requiresAuth) && !session.hasSession) {
      return { path: '/entrar', query: { voltar: to.fullPath } }
    }
    return true
  })

  return router
}

export default createAppRouter
