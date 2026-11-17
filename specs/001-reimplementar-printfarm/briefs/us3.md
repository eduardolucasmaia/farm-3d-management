# Brief: US3, orçamento vira no máximo um pedido

**Branch**: `<autor>/001-us3-orcamento`, a partir de `001-reimplementar-printfarm`
**Depende de**: US1 mesclada na base
**Tarefas, nesta ordem** (`tasks.md`, "Phase 5"): T039, T040, T041, T042, T043, T044, T045
**Migração reservada**: `0004-quotes.sql`

Este brief só aponta. A regra está nos documentos citados.

## Bloqueios

- **T041 está bloqueada pelo achado I1** (`plan.md`, "Achados de analysis.md"): a geração de pedido por orçamento recebe só a data prometida, mas cor e tamanho são obrigatórios quando o modelo os oferece. Faça T039 e T040 e pare antes de T041 até a equipe decidir e `contracts/comercial.md` ser corrigido.
- **Formato de `Number`** de orçamento e de pedido não está definido em nenhum documento. Não invente: pergunte.
- O cancelamento de pedido confirmado **não** é desta fase; é o brief `cancelamento.md`.

## Leia só isto

- `tasks.md`: seção "Phase 5"
- `contracts/comercial.md`: "Orçamentos" e "Pedidos" (pare antes de "Cancelamento de pedido")
- `data-model.md`: "Comercial"
- `quickstart.md`: seção 3, passos 1 a 6

## Arquivos novos

- `server/tests/domain/quote-state.test.ts`, `server/src/domain/rules/quote-state.ts`
- `server/src/domain/entities/commercial.ts`
- `server/src/application/use-cases/quote-lifecycle.ts`, `create-order-from-quote.ts`
- `server/migrations/0004-quotes.sql`, `server/src/infrastructure/repositories/quotes-repo.ts`
- `server/src/api/routes/quotes.ts`
- `server/src/infrastructure/clock/farm-date.ts` (se ainda não existir; a US7 reutiliza)
- `web/src/pages/OrcamentosPage.vue`

## Arquivos que já existem: só acrescente

- `server/src/api/routes/sales-orders.ts`: já tem `GET` e o `PATCH` de status; acrescente criação manual, geração por orçamento e Delivered
- `server/src/domain/rules/sales-order-state.ts` e seu teste: acrescente ReadyToShip → Delivered, sem mudar o que já passa
- `server/src/infrastructure/repositories/sales-repo.ts`
- `server/src/infrastructure/jobs/hourly-farm-job.ts`: acrescente a expiração
- `server/src/api/app.ts`, `web/src/router/index.ts`, `web/src/App.vue`, `web/src/labels.ts`

## Armadilhas

- "Hoje" para a expiração é a data no fuso de `farm_settings.time_zone`. Calcule fora do domínio (`farm-date.ts`, com `Intl.DateTimeFormat`) e passe para a regra como `AAAA-MM-DD`. O domínio não lê relógio.
- `sales_orders.quote_id` já existe; a 0004 cria `quotes` e `quote_lines`.
- Segunda geração do mesmo orçamento: recuse dentro da transação, lendo o estado do orçamento antes de gravar.
- Subtotal = quantidade × preço em centavos. Sem divisão, sem arredondamento.
- O motivo da rejeição vai em `Notes`, no formato do contrato.

## Pronto quando

- `npm test` e `npm run typecheck` verdes; os testes da US1 continuam verdes.
- `quickstart.md` seção 3, passos 1 a 6, conferidos.
- T039–T045 marcadas `[X]`.
