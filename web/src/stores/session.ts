import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface Session {
  token: string
  email: string
  roles: string[]
}

export const useSessionStore = defineStore('session', () => {
  const token = ref<string>(localStorage.getItem('farm3d_token') || '')
  const email = ref<string>(localStorage.getItem('farm3d_email') || '')
  const roles = ref<string[]>(JSON.parse(localStorage.getItem('farm3d_roles') || '[]'))

  const hasSession = computed(() => token.value.length > 0)

  function setSession(session: Session) {
    token.value = session.token
    email.value = session.email
    roles.value = session.roles
    localStorage.setItem('farm3d_token', session.token)
    localStorage.setItem('farm3d_email', session.email)
    localStorage.setItem('farm3d_roles', JSON.stringify(session.roles))
  }

  function clearSession() {
    token.value = ''
    email.value = ''
    roles.value = []
    localStorage.removeItem('farm3d_token')
    localStorage.removeItem('farm3d_email')
    localStorage.removeItem('farm3d_roles')
  }

  function hasRole(role: string): boolean {
    return roles.value.includes(role)
  }

  return { token, email, roles, hasSession, setSession, clearSession, hasRole }
})
