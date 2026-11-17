<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { AxiosError } from 'axios'
import { api, problemMessage } from '../api'
import { useSessionStore } from '../stores/session'
import { formatDate, formatNumber, lotStatusLabel, orderStatusLabel } from '../labels'

interface OrderSummary {
  id: number
  number: string
  customerName: string
  commercialStatus: string
  promisedDate: string | null
}
interface OrderDetail extends OrderSummary {
  lines: { id: number; productName: string; quantity: number; materialName: string | null; colorName: string | null; size: string | null }[]
  lots: {
    id: number
    lotIndex: number
    qtyPlanned: number
    plannedGrams: number
    plannedMinutes: number
    status: string
    printerName: string | null
    reservations: { materialLotCode: string | null; grams: number }[]
  }[]
}

const session = useSessionStore()
const orders = ref<OrderSummary[]>([])
const selected = ref<OrderDetail | null>(null)
const message = ref('')
const error = ref('')
const busy = ref(false)

const isSales = computed(() => session.hasRole('Sales') || session.hasRole('Admin'))
const isProduction = computed(() => session.hasRole('Production') || session.hasRole('Admin'))

async function loadOrders() {
  const { data } = await api.get<OrderSummary[]>('/sales-orders')
  orders.value = data
}

async function select(id: number) {
  error.value = ''
  message.value = ''
  const { data } = await api.get<OrderDetail>(`/sales-orders/${id}`)
  selected.value = data
}

async function run(action: () => Promise<string>) {
  if (!selected.value) return
  busy.value = true
  error.value = ''
  message.value = ''
  const id = selected.value.id
  try {
    message.value = await action()
  } catch (e) {
    error.value = problemMessage(e)
    if (e instanceof AxiosError && e.response?.data?.code === 'INSUFFICIENT_STOCK') {
      const d = e.response.data as { lotIndex: number; neededGrams: number; freeGrams: number }
      error.value += ` Lote ${d.lotIndex}: precisa de ${formatNumber(d.neededGrams)} g e há ${formatNumber(d.freeGrams)} g livres. Nada foi reservado.`
    }
  } finally {
    busy.value = false
    await Promise.all([loadOrders(), select(id)]).catch(() => undefined)
    if (error.value === '' && message.value === '') message.value = 'Feito.'
  }
}

const confirmOrder = () =>
  run(async () => {
    await api.patch(`/sales-orders/${selected.value!.id}/status`, { status: 'Approved' })
    return 'Pedido confirmado.'
  })

const cancelOrder = () =>
  run(async () => {
    await api.patch(`/sales-orders/${selected.value!.id}/status`, { status: 'Cancelled' })
    return 'Pedido cancelado.'
  })

const releaseLots = () =>
  run(async () => {
    const { data } = await api.post(`/sales-orders/${selected.value!.id}/lots/release`)
    return `${data.lots.length} lote(s) de produção liberado(s), com material reservado.`
  })

onMounted(loadOrders)
</script>

<template>
  <main>
    <div class="row">
      <h1>Pedidos</h1>
      <span class="fictional">Dados de exemplo fictícios</span>
    </div>

    <div class="layout">
      <section class="card">
        <table>
          <thead>
            <tr><th>Pedido</th><th>Cliente</th><th>Estado</th><th>Prometido</th></tr>
          </thead>
          <tbody>
            <tr
              v-for="o in orders"
              :key="o.id"
              :class="{ active: selected?.id === o.id }"
              tabindex="0"
              @click="select(o.id)"
              @keydown.enter="select(o.id)"
            >
              <td>{{ o.number }}</td>
              <td>{{ o.customerName }}</td>
              <td>{{ orderStatusLabel[o.commercialStatus] ?? o.commercialStatus }}</td>
              <td>{{ formatDate(o.promisedDate) }}</td>
            </tr>
            <tr v-if="orders.length === 0"><td colspan="4" class="muted">Nenhum pedido.</td></tr>
          </tbody>
        </table>
      </section>

      <section v-if="selected" class="card">
        <h2>{{ selected.number }} · {{ orderStatusLabel[selected.commercialStatus] }}</h2>
        <p class="muted">{{ selected.customerName }} · prometido para {{ formatDate(selected.promisedDate) }}</p>

        <h3>Linhas</h3>
        <ul>
          <li v-for="l in selected.lines" :key="l.id">
            {{ l.quantity }} × {{ l.productName }} — {{ l.materialName ?? 'sem material' }}<span v-if="l.colorName">, {{ l.colorName }}</span><span v-if="l.size">, {{ l.size }}</span>
          </li>
        </ul>

        <div class="row actions">
          <template v-if="isSales && selected.commercialStatus === 'QuotePending'">
            <button type="button" :disabled="busy" @click="confirmOrder">Confirmar pedido</button>
            <button type="button" class="secondary" :disabled="busy" @click="cancelOrder">Cancelar pedido</button>
          </template>
          <button
            v-if="isProduction && ['Approved', 'InProduction'].includes(selected.commercialStatus)"
            type="button"
            :disabled="busy"
            @click="releaseLots"
          >
            Liberar lotes de produção
          </button>
        </div>
        <p v-if="message" class="success" role="status">{{ message }}</p>
        <p v-if="error" class="error" role="alert">{{ error }}</p>

        <h3>Lotes de produção</h3>
        <table v-if="selected.lots.length > 0">
          <thead>
            <tr><th>#</th><th>Peças</th><th>Material</th><th>Tempo</th><th>Estado</th><th>Reserva por lote de material</th></tr>
          </thead>
          <tbody>
            <tr v-for="lot in selected.lots" :key="lot.id">
              <td>{{ lot.lotIndex }}</td>
              <td>{{ lot.qtyPlanned }}</td>
              <td>{{ formatNumber(lot.plannedGrams) }} g</td>
              <td>{{ formatNumber(lot.plannedMinutes) }} min</td>
              <td>{{ lotStatusLabel[lot.status] ?? lot.status }}</td>
              <td>
                <span v-for="r in lot.reservations" :key="r.materialLotCode ?? ''" class="chip">
                  {{ r.materialLotCode }}: {{ formatNumber(r.grams) }} g
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else class="muted">Nenhum lote de produção ainda.</p>
      </section>
      <section v-else class="card muted">Escolha um pedido na lista.</section>
    </div>
  </main>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
  gap: 16px;
}
@media (max-width: 760px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
tbody tr {
  cursor: pointer;
}
tbody tr.active {
  background: var(--bg);
}
.actions {
  margin: 12px 0;
}
.chip {
  display: inline-block;
  margin: 2px 4px 2px 0;
  padding: 1px 6px;
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 12px;
}
</style>
