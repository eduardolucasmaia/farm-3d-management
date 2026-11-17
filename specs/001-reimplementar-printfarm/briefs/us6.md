# Brief: US6, registrar fatura e pagamento do pedido

**Branch**: `<autor>/001-us6-financeiro`, a partir de `001-reimplementar-printfarm`
**Depende de**: US1 mesclada na base
**Tarefas, nesta ordem** (`tasks.md`, "Phase 8"): T059, T060, T061, T062
**Migração reservada**: `0007-billing.sql`

Este brief só aponta. A regra está nos documentos citados.

## Bloqueios

Nenhum.

## Leia só isto

- `tasks.md`: seção "Phase 8"
- `contracts/financeiro.md`: inteiro (28 linhas)
- `data-model.md`: "Compras e financeiro" (só Invoice e Payment)
- `quickstart.md`: seção 6

## Arquivos novos

- `server/tests/domain/billing-guard.test.ts`, `server/src/domain/rules/billing-guard.ts`
- `server/src/domain/entities/billing.ts`
- `server/migrations/0007-billing.sql`, `server/src/infrastructure/repositories/billing-repo.ts`
- `server/src/api/routes/billing.ts`
- `web/src/pages/FinanceiroPage.vue`

## Arquivos que já existem: só acrescente

- `server/src/api/app.ts`, `web/src/router/index.ts`, `web/src/App.vue`, `web/src/labels.ts`

## Armadilhas

- Leia o estado do pedido e grave o lançamento dentro da mesma `transact`. Validar fora da transação não vale (`contracts/financeiro.md`, último parágrafo).
- Valor em reais com até 2 casas na API; centavos no banco.
- Não existe nota fiscal, boleto, estorno nem conciliação. Não crie rota, tabela nem botão para isso.
- O total pago pode ser diferente do faturado; não bloqueie.
- Acrescente um caso de 403 para um papel fora de Sales e Admin.

## Pronto quando

- `npm test` e `npm run typecheck` verdes.
- `quickstart.md` seção 6 conferida.
- T059–T062 marcadas `[X]`.
