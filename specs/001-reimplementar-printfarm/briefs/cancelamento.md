# Brief: cancelamento de pedido confirmado

**Branch**: `<autor>/001-cancelamento`, a partir de `001-reimplementar-printfarm`
**Depende de**: US3, US5 e US6 mescladas na base (a regra consulta execuções, faturas e pagamentos)
**Tarefas, nesta ordem** (`tasks.md`, "Phase 8.5"): T084, T085
**Migração**: nenhuma

Este brief só aponta. A regra está nos documentos citados.

## Bloqueios

Nenhum, além das dependências.

## Leia só isto

- `tasks.md`: seção "Phase 8.5"
- `contracts/comercial.md`: "Cancelamento de pedido por PATCH /api/sales-orders/{id}/status"
- `data-model.md`: "Comercial" (SalesOrder) e a linha "cancelar" de "Transições do lote de produção"
- `quickstart.md`: seção 3, passos 7 e 8; "Atomicidade e concorrência", item do cancelamento
- `research.md`: item 20

## Arquivos novos

- `server/tests/domain/order-cancellation.test.ts`, `server/src/domain/rules/order-cancellation.ts`
- `server/tests/application/cancel-order.test.ts`, `server/src/application/use-cases/cancel-order.ts`

## Arquivos que já existem: só acrescente

- `server/src/domain/rules/sales-order-state.ts` e seu teste: hoje Approved → Cancelled é recusado; passe a aceitar só por meio da regra nova
- `server/src/application/use-cases/change-sales-order-status.ts`, `server/src/api/routes/sales-orders.ts`
- `server/src/domain/rules/lot-state.ts`: evento de cancelar
- `server/tests/application/concurrency.test.ts`: disputas do cancelamento
- `web/src/pages/PedidoPage.vue`: o botão de cancelar hoje só aparece em confirmação pendente

## Armadilhas

- Execução que já começou bloqueia para sempre, mesmo encerrada. Execução planejada sem início não bloqueia e é removida.
- Cada reserva é liberada uma única vez, com movimento `Unreserve`. Repetir o cancelamento não libera de novo.
- A recusa lista todos os impedimentos em `blockers`, com os códigos do contrato.
- Tudo numa única `transact`. Nunca cancele chamando a rota de cancelar lote várias vezes.
- O orçamento de origem continua em pedido gerado.

## Pronto quando

- `npm test` e `npm run typecheck` verdes.
- `quickstart.md` seção 3, passos 7 e 8, conferidos.
- T084 e T085 marcadas `[X]`.
