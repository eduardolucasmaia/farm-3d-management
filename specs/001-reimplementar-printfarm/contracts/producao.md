# Contract: Produção

Sessão obrigatória.

| Ação | Papéis |
|------|--------|
| Liberar, enfileirar, cancelar lote | Production, Admin |
| Iniciar, pausar, retomar, concluir, falhar, retirada, preparação | Operator, Production, Admin |
| Confirmar manutenção, marcar indisponível | Production, Admin |

## POST /api/sales-orders/{id}/lots/release

Só pedido Approved (ou estado comercial já em produção). Corta cada linha ainda sem lotes.

- 201: lotes com qtyPlanned, plannedGrams, plannedMinutes, status Released.
- 409: saldo insuficiente, com corpo `{ "lotIndex": n, "neededGrams": decimal, "freeGrams": decimal }` e nenhuma reserva gravada para essa linha.
- 409: peças por prancha ausente. 409: pedido QuotePending ou Cancelled.
- Repetir para linha já liberada: 409. "Repetir a liberação já reservada é recusado."

O cenário de prova: 10 peças, 4 por prancha → três lotes, o último com metade das gramas e metade dos minutos da prancha cheia.

## POST /api/lots/{id}/queue

Corpo: `{ "printerId": number|null, "priority": number }`.

- 201: status Queued.
- 409: impressora inativa, indisponível, ocupada, em manutenção, ou incompatível. Lista vazia de materiais da impressora aceita qualquer material.

## POST /api/lots/{id}/runs

Inicia execução. Impressora vai a Printing, lote a Printing.

- 409 se a impressora não está Available.

## POST /api/runs/{id}/pause e /resume

Só Running ↔ Paused. PausedSeconds acumula.

## POST /api/runs/{id}/complete

Corpo: `{ "actualMaterialG": decimal, "actualMinutes": decimal }`. actualMaterialG > 0, senão 400.

Lote vai a AwaitingPickup. Impressora vai a AwaitingPickup. Uma StockMovement ProductionOut. Segunda chamada: 409.

## POST /api/printers/{id}/pickup

De AwaitingPickup para Preparing. 409 nos demais estados. Se a execução que ocupava a mesa está Completed, o lote vai a Completed. Se a execução está Failed, o lote permanece Failed.

## POST /api/printers/{id}/preparation-complete

Se horas acumuladas < limite: Available. Se ≥ limite: InMaintenance.

## POST /api/printers/{id}/maintenance-complete

Corpo: `{ "note": string }` com note não vazio. Zera horas acumuladas. Vai a Available se não estiver bloqueada como indisponível.

## POST /api/runs/{id}/fail

Corpo: `{ "reason": "None"|"BedAdhesion"|"Clog"|"LayerShift"|"OutOfMaterial"|"Other", "notes": string|null, "scheduleReprint": bool }`

Só Running ou Paused. Já terminal: 400.

- scheduleReprint false: lote Failed, Unreserve do restante, impressora AwaitingPickup.
- scheduleReprint true: lote Queued, reserva permanece, nova PrintRun Planned com reprintOfPrintRunId.

## POST /api/lots/{id}/cancel

Só de AwaitingPlanning, Released ou Queued. Se havia reserva, Unreserve. 409 se Printing ou depois.
