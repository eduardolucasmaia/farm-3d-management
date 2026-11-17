# Brief: US4, compra entra em lote de material

**Branch**: `<autor>/001-us4-compras`, a partir de `001-reimplementar-printfarm`
**Depende de**: US1 mesclada na base
**Tarefas, nesta ordem** (`tasks.md`, "Phase 6"): T046, T047, T048, T049, T050, T051
**Migração reservada**: `0005-purchasing.sql`

Este brief só aponta. A regra está nos documentos citados.

## Bloqueios

Nenhum.

## Leia só isto

- `tasks.md`: seção "Phase 6"
- `contracts/estoque-compras.md`: inteiro (40 linhas)
- `data-model.md`: "Unidades e representação", "Material e estoque", "Compras e financeiro" (só compras), "Leitura operacional" (só RestockSuggestion)
- `quickstart.md`: seção 4

## Arquivos novos

- `server/tests/domain/receipt-math.test.ts`
- `server/src/domain/entities/purchasing.ts`, `server/src/domain/rules/receipt-math.ts`, `server/src/domain/rules/restock.ts`
- `server/src/application/use-cases/receive-purchase.ts`
- `server/migrations/0005-purchasing.sql`, `server/src/infrastructure/repositories/purchasing-repo.ts`
- `server/src/api/routes/purchase-orders.ts`, `server/src/api/routes/stock.ts`
- `web/src/pages/ComprasPage.vue`, `web/src/pages/EstoquePage.vue`

## Arquivos que já existem: só acrescente

- `server/src/infrastructure/repositories/stock-repo.ts`: `insertMovement` já aceita `purchaseReceiptId`
- `server/src/infrastructure/jobs/hourly-farm-job.ts`: acrescente a sugestão de recompra
- `server/src/api/app.ts`, `web/src/router/index.ts`, `web/src/App.vue`, `web/src/labels.ts`

## Armadilhas

- `suppliers`, `materials`, `material_lots`, `stock_items` e `stock_movements` já existem (migração 0002). A 0005 cria só as tabelas de compra e `restock_suggestions`.
- A API recebe quilos (até 6 casas) e gramas (até 3); o banco guarda mg. 1 kg = 1.000.000 mg. Compare o recebido com o pedido em mg, com inteiros.
- O custo do lote de material é `CostCentsPerKg`, igual ao preço da linha. Não existe "custo por grama" gravado.
- O recebimento cria lote de material, saldo e movimento `PurchaseIn` numa única `transact`.
- A reserva só enxerga saldo ligado a um lote de material (`listFreeLots`). Sempre grave `material_lot_id` no saldo.
- Escreva um teste de orquestração para o recebimento, no padrão de `server/tests/application/release-lots.test.ts`.

## Pronto quando

- `npm test` e `npm run typecheck` verdes.
- `quickstart.md` seção 4 conferida; a sugestão aparece depois de `npm run job:hourly --workspace server`.
- T046–T051 marcadas `[X]`.
