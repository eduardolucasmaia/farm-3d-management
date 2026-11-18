# Brief: US8, auditar quem mudou o estado

**Branch**: `<autor>/001-us8-trilha`, a partir de `001-reimplementar-printfarm`
**Depende de**: US1, US3, US5 e o cancelamento mesclados na base. Faça por último: ela toca casos de uso de todas as outras histórias
**Tarefas, nesta ordem** (`tasks.md`, "Phase 10"): T069, T070, T071, T072
**Migração reservada**: `0009-audit.sql`

Este brief só aponta. A regra está nos documentos citados.

## Bloqueios

Nenhum. Combine com a equipe uma janela sem outra história aberta nos casos de uso, para não conflitar.

## Leia só isto

- `tasks.md`: seção "Phase 10"
- `contracts/painel.md`: "GET /api/audit?entity=&id="
- `contracts/estoque-compras.md`: "GET /api/stock/movements?materialId="
- `data-model.md`: "Leitura operacional" (AuditLog) e "Material e estoque" (StockMovement)
- `quickstart.md`: seção 8

## Arquivos novos

- `server/tests/application/audit.test.ts`
- `server/src/domain/entities/audit.ts`, `server/src/application/use-cases/audit-writer.ts`
- `server/migrations/0009-audit.sql`, `server/src/infrastructure/repositories/audit-repo.ts`
- `server/src/api/routes/audit.ts`

## Arquivos que já existem: só acrescente

- Todo caso de uso que muda estado de orçamento, pedido, lote de produção ou impressora, em `server/src/application/use-cases/`: uma chamada ao gravador da trilha por mudança
- `server/tests/api/authz.test.ts`: 403 para Sales, Purchasing e Operator
- `server/src/api/app.ts`

## Armadilhas

- A trilha é gravada dentro da mesma `transact` da mudança. Se a operação é desfeita, a trilha também é.
- Cada caso de uso já recebe ou precisa receber o `userId` da sessão (`request.user.id` na rota). Não grave trilha sem autor.
- A liberação tem duas mudanças por lote (Released e Queued); as duas ficam na trilha.
- Não mude o comportamento dos casos de uso; só acrescente a gravação. Todos os testes existentes continuam verdes.
- Numa baixa que usa vários lotes de material, há uma linha de movimento por lote, com o custo de cada um.

## Pronto quando

- `npm test` e `npm run typecheck` verdes.
- `quickstart.md` seção 8 conferida.
- T069–T072 marcadas `[X]`.
