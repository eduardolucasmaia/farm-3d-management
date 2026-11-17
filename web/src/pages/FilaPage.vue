<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { api, problemMessage } from '../api'
import { useSessionStore } from '../stores/session'
import { formatNumber, lotStatusLabel, printerStatusLabel } from '../labels'

interface QueueLot {
  id: number
  orderNumber: string
  productName: string
  materialName: string
  lotIndex: number
  qtyPlanned: number
  plannedGrams: number
  plannedMinutes: number
  status: string
  printerName: string | null
  position: number | null
}
interface Printer {
  id: number
  name: string
  operationalStatus: string
  isActive: boolean
  compatibleMaterials: { id: number; name: string }[]
}

const session = useSessionStore()
const lots = ref<QueueLot[]>([])
const printers = ref<Printer[]>([])
const choice = reactive<Record<number, number | ''>>({})
const rowError = reactive<Record<number, string>>({})
const loadError = ref('')

const canEnqueue = computed(() => session.hasRole('Production') || session.hasRole('Admin'))

function printerLabel(p: Printer): string {
  const materials = p.compatibleMaterials.length > 0 ? p.compatibleMaterials.map((m) => m.name).join(', ') : 'qualquer material'
  return `${p.name} (${printerStatusLabel[p.operationalStatus] ?? p.operationalStatus}; aceita ${materials})`
}

async function load() {
  loadError.value = ''
  try {
    const [lotsRes, printersRes] = await Promise.all([api.get<QueueLot[]>('/lots'), api.get<Printer[]>('/printers')])
    lots.value = lotsRes.data
    printers.value = printersRes.data
  } catch (e) {
    loadError.value = problemMessage(e)
  }
}

async function enqueue(lot: QueueLot) {
  rowError[lot.id] = ''
  const selected = choice[lot.id]
  try {
    await api.post(`/lots/${lot.id}/queue`, { printerId: selected === '' || selected === undefined ? null : selected, priority: 0 })
    await load()
  } catch (e) {
    rowError[lot.id] = problemMessage(e)
  }
}

onMounted(load)
</script>

<template>
  <main>
    <div class="row">
      <h1>Fila de produção</h1>
      <span class="fictional">Dados de exemplo fictícios</span>
    </div>
    <p class="muted">
      Lotes liberados aguardam uma impressora. A fila só aceita impressora ativa, disponível e compatível com o material do lote.
    </p>
    <p v-if="loadError" class="error" role="alert">{{ loadError }}</p>

    <section class="card">
      <table>
        <thead>
          <tr>
            <th>Posição</th><th>Pedido</th><th>Lote</th><th>Modelo</th><th>Peças</th><th>Material</th><th>Tempo</th>
            <th>Estado</th><th>Impressora</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="lot in lots" :key="lot.id">
            <td>{{ lot.position ?? '—' }}</td>
            <td>{{ lot.orderNumber }}</td>
            <td>{{ lot.lotIndex }}</td>
            <td>{{ lot.productName }}</td>
            <td>{{ lot.qtyPlanned }}</td>
            <td>{{ formatNumber(lot.plannedGrams) }} g de {{ lot.materialName }}</td>
            <td>{{ formatNumber(lot.plannedMinutes) }} min</td>
            <td>{{ lotStatusLabel[lot.status] ?? lot.status }}</td>
            <td>
              <template v-if="lot.status === 'Released' && canEnqueue">
                <div class="row">
                  <select v-model="choice[lot.id]" :aria-label="`Impressora para o lote ${lot.lotIndex} de ${lot.orderNumber}`">
                    <option value="">Sem impressora definida</option>
                    <option v-for="p in printers" :key="p.id" :value="p.id">{{ printerLabel(p) }}</option>
                  </select>
                  <button type="button" @click="enqueue(lot)">Enfileirar</button>
                </div>
                <p v-if="rowError[lot.id]" class="error" role="alert">{{ rowError[lot.id] }}</p>
              </template>
              <template v-else>{{ lot.printerName ?? '—' }}</template>
            </td>
          </tr>
          <tr v-if="lots.length === 0"><td colspan="9" class="muted">Nenhum lote liberado ou na fila.</td></tr>
        </tbody>
      </table>
    </section>
  </main>
</template>

<style scoped>
select {
  max-width: 320px;
}
td p.error {
  margin: 4px 0 0;
  font-size: 13px;
}
</style>
