# Brief: US5, executar sem liberar a máquina cedo

**Branch**: `<autor>/001-us5-execucao`, a partir de `001-reimplementar-printfarm`
**Depende de**: US1 mesclada na base
**Tarefas, nesta ordem** (`tasks.md`, "Phase 7"): T052, T053, T055, T086, T087, T054, T056, T057, T058, T088
**Migração reservada**: `0006-runs.sql`

Este brief só aponta. A regra está nos documentos citados. É a história mais longa: faça uma tarefa por vez e rode os testes a cada uma.

## Bloqueios

- **T052 tem uma pergunta aberta (achado A2)**: execução que falha soma o tempo real às horas acumuladas da impressora? Está marcado `[NEEDS CLARIFICATION]` em `data-model.md`. Escreva os demais casos de T052 e pergunte antes de decidir esse.
- **Achado C1**: o cenário 9 da US1 (reimpressão preserva os parâmetros da prancha) é provado aqui, em T055.

## Leia só isto

- `tasks.md`: seção "Phase 7"
- `data-model.md`: "Produção", "Transições do lote de produção", "Transições da impressora", "Consumo e reimpressão"
- `contracts/producao.md`: de "POST /api/lots/{id}/runs" até o fim
- `quickstart.md`: seção 5 inteira, com as subseções "Material real e reimpressão" e "Atomicidade e concorrência"
- `research.md`: itens 17, 18 e 19

## Arquivos novos

- `server/tests/domain/printer-state.test.ts`, `material-consumption.test.ts`, `reprint-reservation.test.ts`
- `server/src/domain/rules/printer-state.ts`, `material-consumption.ts`, `reprint-reservation.ts`
- `server/src/domain/entities/print-run.ts`
- `server/tests/application/run-execution.test.ts`, `concurrency.test.ts`
- `server/src/application/use-cases/run-execution.ts`
- `server/migrations/0006-runs.sql`, `server/src/infrastructure/repositories/runs-repo.ts`
- `server/src/api/routes/runs.ts`, `server/src/api/routes/printer-events.ts`
- `web/src/pages/ExecucaoPage.vue`

## Arquivos que já existem: só acrescente

- `server/src/domain/rules/lot-state.ts` e `server/tests/domain/lot-state.test.ts`: já têm `enqueue` e `queueAction`. Acrescente os eventos novos ao tipo `LotEvent` e à tabela; não reescreva o que existe.
- `server/src/infrastructure/repositories/production-repo.ts`, `stock-repo.ts`, `catalog-repo.ts`
- `server/src/api/app.ts`, `web/src/router/index.ts`, `web/src/App.vue`, `web/src/labels.ts`

## Já pronto, reutilize

- `allocateFifo` (mesma ordem para consumo e complemento), `checkPrinterCompatibility`
- `listFreeLots`, `addReservedMg`, `insertMovement`, `getQueueItem`, `lotReservations`
- `buildScenario` em `server/tests/helpers/fixtures.ts` monta pedido, material, saldo e duas impressoras

## Armadilhas

- A liberação já deixa o lote **Queued**, com item de fila sem impressora. Iniciar a execução remove o item da fila.
- A 0006 precisa de `ALTER TABLE printers ADD COLUMN occupying_print_run_id` e de `material_lot_id` em `stock_movements` (o `data-model.md` exige; a tabela atual só tem `stock_item_id`).
- O índice único de reserva (lote de produção + saldo) **já existe** na 0002. Não repita.
- O índice único de consumo é parcial: só para `kind` ProductionOut e Waste.
- Estado do lote e estado da impressora são dois campos. Nunca calcule um pelo outro. A retirada decide pelo `OccupyingPrintRunId`, não pelo estado do lote.
- Falha aceita material real igual a zero e não grava movimento nesse caso. Conclusão recusa zero.
- Falta de saldo para o **consumo** desfaz tudo (`abort`). Falta de saldo só para o **complemento da reimpressão** não desfaz: a falha é gravada e o lote fica com material faltante.
- Consumo e complemento são regras puras que devolvem um plano; o caso de uso só grava o plano. Padrão: `server/src/domain/rules/release-plan.ts` com `release-lots.ts`.
- `concurrency.test.ts`: o banco é síncrono. Uma segunda conexão que espera a primeira dentro do mesmo processo nunca é atendida. Abra a segunda conexão com `PRAGMA busy_timeout = 0` e teste a recusa imediata, ou intercale as operações em ordem.
- Horas acumuladas ficam em segundos (`accumulated_seconds`); o limite está em horas inteiras.

## Pronto quando

- `npm test` e `npm run typecheck` verdes.
- `quickstart.md` seção 5, passos 1 a 8, conferidos na tela, com o estado do lote e o da impressora em campos separados.
- A tabela "Material real e reimpressão" coberta por `run-execution.test.ts`.
- T052–T058 e T086–T088 marcadas `[X]`.
