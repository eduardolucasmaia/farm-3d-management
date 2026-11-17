import axios, { AxiosError } from 'axios'
import { useSessionStore } from './stores/session'

// Cliente HTTP da SPA. O Vite encaminha /api para a API em localhost:5088.
export const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const session = useSessionStore()
  if (session.token) config.headers.Authorization = `Bearer ${session.token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) useSessionStore().clearSession()
    return Promise.reject(error)
  },
)

/** Texto da regra violada (campo `detail` do problem+json), ou uma mensagem genérica. */
export function problemMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { detail?: string } | undefined
    if (data?.detail) return data.detail
    if (!error.response) return 'Não foi possível falar com a API. Ela está rodando?'
  }
  return 'Erro inesperado.'
}
