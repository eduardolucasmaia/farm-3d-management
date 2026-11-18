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
const initial = computed(() => (session.email[0] ?? '?').toUpperCase())

async function sair() {
  session.clearSession()
  await router.push('/entrar')
}
</script>

<template>
  <header v-if="session.hasSession" class="topbar">
    <div class="inner">
      <RouterLink to="/" class="brand" aria-label="Farm 3D, início">
        <span class="mark" aria-hidden="true"></span>
        Farm 3D
      </RouterLink>
      <nav aria-label="Principal">
        <RouterLink v-if="canSeeQueue" to="/fila">Fila e frota</RouterLink>
        <RouterLink v-if="canSeeOrders" to="/pedidos">Pedidos</RouterLink>
      </nav>
      <div class="user">
        <span class="avatar" aria-hidden="true">{{ initial }}</span>
        <span class="who">
          <span class="email">{{ session.email }}</span>
          <span class="role">{{ roleText }}</span>
        </span>
        <button class="secondary small" type="button" @click="sair">Sair</button>
      </div>
    </div>
  </header>
  <RouterView />
</template>

<style scoped>
.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: color-mix(in srgb, var(--surface) 88%, transparent);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border);
}
.inner {
  max-width: 1180px;
  margin: 0 auto;
  padding: 10px 20px;
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}
.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: 16px;
  letter-spacing: -0.01em;
  color: var(--text);
  text-decoration: none;
}
.mark {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background:
    linear-gradient(var(--accent-ink), var(--accent-ink)) 5px 6px / 12px 2px no-repeat,
    linear-gradient(var(--accent-ink), var(--accent-ink)) 5px 10px / 12px 2px no-repeat,
    linear-gradient(var(--accent-ink), var(--accent-ink)) 5px 14px / 8px 2px no-repeat,
    var(--accent);
}
nav {
  display: flex;
  gap: 4px;
}
nav a {
  color: var(--muted);
  text-decoration: none;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 8px;
}
nav a:hover {
  color: var(--text);
  background: var(--surface-2);
}
nav a.router-link-active {
  color: var(--accent);
  background: var(--accent-soft);
}
.user {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
}
.avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 700;
  font-size: 13px;
}
.who {
  display: grid;
  line-height: 1.2;
}
.email {
  font-size: 13px;
  font-weight: 500;
}
.role {
  font-size: 12px;
  color: var(--muted);
}
@media (max-width: 620px) {
  .who {
    display: none;
  }
}
</style>
