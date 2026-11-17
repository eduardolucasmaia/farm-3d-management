<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from './stores/session'
import { roleLabel } from './labels'

const session = useSessionStore()
const router = useRouter()

const canSeeOrders = computed(() => ['Sales', 'Production', 'Admin'].some((r) => session.hasRole(r)))
const canSeeQueue = computed(() => ['Production', 'Operator', 'Admin'].some((r) => session.hasRole(r)))
const roleText = computed(() => session.roles.map((r) => roleLabel[r] ?? r).join(', '))

async function sair() {
  session.clearSession()
  await router.push('/entrar')
}
</script>

<template>
  <header v-if="session.hasSession" class="topbar">
    <strong>Farm 3D</strong>
    <nav class="row">
      <RouterLink v-if="canSeeOrders" to="/pedidos">Pedidos</RouterLink>
      <RouterLink v-if="canSeeQueue" to="/fila">Fila</RouterLink>
    </nav>
    <span class="muted user">{{ session.email }} · {{ roleText }}</span>
    <button class="secondary" type="button" @click="sair">Sair</button>
  </header>
  <RouterView />
</template>

<style scoped>
.topbar {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 10px 16px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
}
.topbar nav a {
  color: var(--accent);
  text-decoration: none;
  padding: 4px 8px;
  border-radius: 6px;
}
.topbar nav a.router-link-active {
  background: var(--bg);
}
.user {
  margin-left: auto;
  font-size: 14px;
}
</style>
