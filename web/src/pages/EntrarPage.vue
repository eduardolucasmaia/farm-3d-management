<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api, problemMessage } from '../api'
import { useSessionStore } from '../stores/session'

const email = ref('')
const password = ref('')
const error = ref('')
const busy = ref(false)
const router = useRouter()
const route = useRoute()
const session = useSessionStore()

async function entrar() {
  error.value = ''
  busy.value = true
  try {
    const { data } = await api.post('/auth/login', { email: email.value, password: password.value })
    session.setSession(data)
    const voltar = typeof route.query.voltar === 'string' ? route.query.voltar : '/fila'
    await router.push(voltar)
  } catch (e) {
    error.value = problemMessage(e)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main class="narrow">
    <h1>Farm 3D</h1>
    <form class="card" @submit.prevent="entrar">
      <label>
        E-mail
        <input v-model="email" type="email" autocomplete="username" required />
      </label>
      <label>
        Senha
        <input v-model="password" type="password" autocomplete="current-password" required />
      </label>
      <button type="submit" :disabled="busy">Entrar</button>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </form>
  </main>
</template>
