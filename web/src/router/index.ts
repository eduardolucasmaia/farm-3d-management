import { createRouter, createWebHistory } from 'vue-router'
import { useSessionStore } from './stores/session'

const routes = []

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const session = useSessionStore()
  if (to.matched.some(record => record.meta.requiresAuth) && !session.hasSession) {
    next('/entrar')
  } else {
    next()
  }
})

export default router
