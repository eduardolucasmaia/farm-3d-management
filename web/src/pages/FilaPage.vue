<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { api, problemMessage } from '../api'
import { useSessionStore } from '../stores/session'
import { formatDuration, formatNumber, plainName, printerStatusLabel, printerStatusTone } from '../labels'

interface QueueLot {
  id: number
  orderNumber: string
  productName: string
  materialName: string
  lotIndex: number
  qtyPlanned: number
  plannedGrams: number
  plannedMinutes: number
  reservedGrams: number
  missingMaterialG: number
  status: string
  printerId: number | null
  printerName: string | null
  position: number | null
}
interface Printer {
  id: number
  name: string
  model: string | null
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
const loaded = ref(false)

const canEnqueue = computed(() => session.hasRole('Production') || session.hasRole('Admin'))

// Indicadores do topo.
const unassigned = computed(() => lots.value.filter((l) => l.printerId === null).length)
const pendingMinutes = computed(() => lots.value.reduce((sum, l) => sum + l.plannedMinutes, 0))
const reservedGrams = computed(() => lots.value.reduce((sum, l) => sum + l.reservedGrams, 0))
const availablePrinters = computed(
  () => printers.value.filter((p) => p.isActive && p.operationalStatus === 'Available').length,
)

// Frota: contagem por estado, na ordem do ciclo da máquina.
const STATUS_ORDER = ['Available', 'Printing', 'AwaitingPickup', 'Preparing', 'InMaintenance', 'Unavailable']
const fleetSummary = computed(() =>
  STATUS_ORDER.map((status) => ({
    status,
    count: printers.value.filter((p) => p.isActive && p.operationalStatus === status).length,
  })).filter((s) => s.count > 0),
)
const inactiveCount = computed(() => printers.value.filter((p) => !p.isActive).length)
const queuedByPrinter = computed(() => {
  const counts = new Map<number, number>()
  for (const lot of lots.value) if (lot.printerId !== null) counts.set(lot.printerId, (counts.get(lot.printerId) ?? 0) + 1)
  return counts
})

// Fila agrupada por pedido, na ordem da fila.
const groups = computed(() => {
  const byOrder = new Map<string, QueueLot[]>()
  for (const lot of lots.value) {
    const list = byOrder.get(lot.orderNumber) ?? []
    list.push(lot)
    byOrder.set(lot.orderNumber, list)
  }
  return [...byOrder.entries()].map(([orderNumber, items]) => ({
    orderNumber,
    items,
    minutes: items.reduce((sum, l) => sum + l.plannedMinutes, 0),
    pieces: items.reduce((sum, l) => sum + l.qtyPlanned, 0),
    missing: items.some((l) => l.missingMaterialG > 0),
  }))
})

function accepts(printer: Printer, materialName: string): boolean {
  return printer.compatibleMaterials.length === 0 || printer.compatibleMaterials.some((m) => m.name === materialName)
}

/** Sugestão visual; quem decide é a API. */
function suggested(lot: QueueLot): Printer[] {
  return printers.value.filter((p) => p.isActive && p.operationalStatus === 'Available' && accepts(p, lot.materialName))
}
function others(lot: QueueLot): Printer[] {
  const ok = new Set(suggested(lot).map((p) => p.id))
  return printers.value.filter((p) => !ok.has(p.id))
}
function otherLabel(p: Printer): string {
  return `${p.name} · ${p.isActive ? (printerStatusLabel[p.operationalStatus] ?? p.operationalStatus) : 'Inativa'}`
}
function materialsText(p: Printer): string {
  return p.compatibleMaterials.length > 0 ? p.compatibleMaterials.map((m) => plainName(m.name)).join(' · ') : 'Qualquer material'
}

async function load() {
  loadError.value = ''
  try {
    const [lotsRes, printersRes] = await Promise.all([api.get<QueueLot[]>('/lots'), api.get<Printer[]>('/printers')])
    lots.value = lotsRes.data
    printers.value = printersRes.data
    for (const lot of lotsRes.data) choice[lot.id] = lot.printerId ?? ''
  } catch (e) {
    loadError.value = problemMessage(e)
  } finally {
    loaded.value = true
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
    <div class="page-head">
      <h1>Fila e frota</h1>
      <span class="fictional">Dados de exemplo fictícios</span>
    </div>
    <p class="lead">
      A liberação coloca os lotes na fila sem impressora. A fila só aceita impressora ativa, disponível e compatível com o material do lote.
    </p>
    <p v-if="loadError" class="error" role="alert">{{ loadError }}</p>

    <section class="kpis" aria-label="Resumo da fila">
      <div class="kpi">
        <div class="kpi-label">Lotes na fila</div>
        <div class="kpi-value">{{ lots.length }}</div>
        <div class="kpi-note">{{ groups.length }} pedido(s)</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Sem impressora</div>
        <div class="kpi-value">{{ unassigned }}</div>
        <div class="kpi-note">aguardando atribuição</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Carga pendente</div>
        <div class="kpi-value">{{ formatNumber(Math.round(pendingMinutes / 6) / 10) }}<span class="kpi-unit">h de máquina</span></div>
        <div class="kpi-note">soma do tempo planejado dos lotes</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Material reservado</div>
        <div class="kpi-value">{{ formatNumber(Math.round(reservedGrams)) }}<span class="kpi-unit">g</span></div>
        <div class="kpi-note">para os lotes desta fila</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Impressoras disponíveis</div>
        <div class="kpi-value">{{ availablePrinters }}<span class="kpi-unit">de {{ printers.length }}</span></div>
        <div class="kpi-note">ativas e livres agora</div>
      </div>
    </section>

    <section class="card" aria-labelledby="frota-titulo">
      <div class="section-head">
        <h2 id="frota-titulo">Frota</h2>
        <div class="row legend">
          <span v-for="s in fleetSummary" :key="s.status" class="status" :class="`tone-${printerStatusTone[s.status]}`">
            {{ printerStatusLabel[s.status] }} <strong>{{ s.count }}</strong>
          </span>
          <span v-if="inactiveCount > 0" class="status tone-idle">Inativa <strong>{{ inactiveCount }}</strong></span>
        </div>
      </div>
      <ul class="fleet">
        <li
          v-for="p in printers"
          :key="p.id"
          class="printer"
          :class="[`tone-${p.isActive ? printerStatusTone[p.operationalStatus] : 'idle'}`, { inactive: !p.isActive }]"
        >
          <div class="printer-top">
            <span class="printer-name">{{ p.name }}</span>
            <span v-if="queuedByPrinter.get(p.id)" class="queued" :title="`${queuedByPrinter.get(p.id)} lote(s) na fila desta impressora`">
              {{ queuedByPrinter.get(p.id) }} na fila
            </span>
          </div>
          <div class="printer-state">
            {{ p.isActive ? (printerStatusLabel[p.operationalStatus] ?? p.operationalStatus) : 'Inativa' }}
          </div>
          <div class="printer-meta">{{ plainName(p.model) }}</div>
          <div class="printer-meta wrap">{{ materialsText(p) }}</div>
        </li>
      </ul>
      <p v-if="loaded && printers.length === 0" class="muted">Nenhuma impressora cadastrada.</p>
    </section>

    <h3>Fila por pedido</h3>
    <section v-for="g in groups" :key="g.orderNumber" class="card flush">
      <header class="order-head">
        <div>
          <span class="order-number">{{ g.orderNumber }}</span>
          <span class="muted"> · {{ plainName(g.items[0]?.productName ?? '') }}<template v-if="new Set(g.items.map((l) => l.productName)).size > 1"> e outros</template></span>
        </div>
        <div class="row">
          <span v-if="g.missing" class="status tone-critical">Falta material</span>
          <span class="chip">{{ g.items.length }} lote(s)</span>
          <span class="chip">{{ g.pieces }} peça(s)</span>
          <span class="chip">{{ formatDuration(g.minutes) }}</span>
        </div>
      </header>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Fila</th><th>Lote</th><th>Modelo</th><th>Peças</th><th>Material</th><th>Tempo</th><th>Reserva</th><th>Impressora</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="lot in g.items" :key="lot.id">
              <td class="num muted">{{ lot.position ?? '—' }}</td>
              <td class="num">{{ lot.lotIndex }}</td>
              <td>{{ plainName(lot.productName) }}</td>
              <td class="num">{{ lot.qtyPlanned }}</td>
              <td>{{ plainName(lot.materialName) }}</td>
              <td class="num">{{ formatDuration(lot.plannedMinutes) }}</td>
              <td class="num">
                {{ formatNumber(lot.reservedGrams) }} g
                <span v-if="lot.missingMaterialG > 0" class="error"> · faltam {{ formatNumber(lot.missingMaterialG) }} g</span>
              </td>
              <td>
                <template v-if="(lot.status === 'Released' || lot.status === 'Queued') && canEnqueue">
                  <div class="assign">
                    <select v-model="choice[lot.id]" :aria-label="`Impressora para o lote ${lot.lotIndex} de ${lot.orderNumber}`">
                      <option value="">Sem impressora</option>
                      <optgroup label="Disponíveis para este material">
                        <option v-for="p in suggested(lot)" :key="p.id" :value="p.id">{{ p.name }}</option>
                      </optgroup>
                      <optgroup label="Outras (a fila deve recusar)">
                        <option v-for="p in others(lot)" :key="p.id" :value="p.id">{{ otherLabel(p) }}</option>
                      </optgroup>
                    </select>
                    <button
                      type="button"
                      class="small"
                      :class="{ secondary: choice[lot.id] === (lot.printerId ?? '') }"
                      :disabled="choice[lot.id] === (lot.printerId ?? '')"
                      @click="enqueue(lot)"
                    >
                      Atribuir
                    </button>
                  </div>
                  <p v-if="rowError[lot.id]" class="error row-error" role="alert">{{ rowError[lot.id] }}</p>
                </template>
                <template v-else>
                  <span v-if="lot.printerName" class="chip">{{ lot.printerName }}</span>
                  <span v-else class="muted">Sem impressora</span>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
    <section v-if="loaded && lots.length === 0" class="card muted">Nenhum lote liberado ou na fila.</section>
  </main>
</template>

<style scoped>
.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}
.section-head h2 {
  margin: 0;
}
.legend strong {
  font-variant-numeric: tabular-nums;
}
.fleet {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(168px, 1fr));
  gap: 10px;
}
.printer {
  border: 1px solid var(--border);
  border-left: 4px solid var(--tone, var(--idle));
  border-radius: 10px;
  padding: 10px 12px;
  background: var(--surface-2);
}
.printer.inactive {
  opacity: 0.6;
  border-left-style: dashed;
}
.printer-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
}
.printer-name {
  font-weight: 650;
  font-size: 15px;
}
.queued {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--accent);
  background: var(--accent-soft);
  padding: 1px 7px;
  border-radius: 999px;
  white-space: nowrap;
}
.printer-state {
  font-size: 13px;
  font-weight: 500;
  margin: 2px 0 6px;
}
.printer-meta {
  font-size: 12px;
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.printer-meta.wrap {
  white-space: normal;
}
.order-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
}
.order-number {
  font-weight: 650;
}
.order-head .chip {
  margin: 0;
}
.assign {
  display: flex;
  gap: 6px;
  align-items: center;
}
.assign select {
  padding: 5px 8px;
  font-size: 13px;
  max-width: 190px;
}
.row-error {
  margin: 4px 0 0;
  font-size: 12.5px;
}
</style>
