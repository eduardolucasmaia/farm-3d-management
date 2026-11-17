# Brief: US7, ver prazo, custo e carga com a premissa

**Branch**: `<autor>/001-us7-painel`, a partir de `001-reimplementar-printfarm`
**Depende de**: US1, US4 e US5 mescladas na base
**Tarefas, nesta ordem** (`tasks.md`, "Phase 9"): T063, T064, T065, T066, T067, T068
**Migração reservada**: `0008-dashboard.sql`

Este brief só aponta. A regra está nos documentos citados.

## Bloqueios

- **T064 está bloqueada pelo achado U1** (`plan.md`, "Achados de analysis.md"): a saída da previsão de término não está definida de forma verificável. Faça T063 e a parte de custo de T065 e pare antes de T064 até `contracts/painel.md` ser corrigido.

## Leia só isto

- `tasks.md`: seção "Phase 9"
- `contracts/painel.md`: do início até "GET /api/dashboard/restock-suggestions", e "PUT /api/settings"
- `data-model.md`: "Unidades e representação", "FarmSettings", "Leitura operacional", "Custo estimado"
- `research.md`: item 10
- `quickstart.md`: seção 7

## Arquivos novos

- `server/tests/domain/cost-estimate.test.ts`, `backlog-forecast.test.ts`
- `server/src/domain/rules/cost-estimate.ts`, `backlog-forecast.ts`
- `server/src/domain/entities/dashboard.ts`
- `server/migrations/0008-dashboard.sql`, `server/src/infrastructure/repositories/dashboard-repo.ts`
- `server/src/infrastructure/clock/farm-date.ts` (se a US3 ainda não criou)
- `server/src/api/routes/dashboard.ts`, `server/src/api/routes/settings.ts`
- `web/src/pages/PainelPage.vue`

## Arquivos que já existem: só acrescente

- `server/src/infrastructure/jobs/hourly-farm-job.ts`: acrescente o alerta de prazo
- `server/src/api/app.ts`, `web/src/router/index.ts`, `web/src/App.vue`, `web/src/labels.ts`

## Armadilhas

- Premissa ausente impede o total. Nunca troque por zero nem por valor padrão; devolva `total` nulo e a lista do que falta.
- Cada parcela é arredondada uma vez ao centavo, com `mulDivRoundHalfUp`; o total é a soma das parcelas já arredondadas. Os divisores estão em `research.md` item 10.
- Gramas e minutos do custo vêm do lote de produção (`planned_mg`, `planned_seconds`), não do perfil.
- A tarifa chega em reais por kWh com até 5 casas e é gravada em centavos por MWh: `parseScaled(valor, 5)` já dá o inteiro certo.
- Consumo de sete dias soma ProductionOut e Waste; não soma Reserve nem Unreserve.
- Máquina aguardando retirada não conta como em impressão.
- `examplesAreFictional: false` é recusado; o banco também recusa por `CHECK`.
- Todo número de exemplo na tela leva a marca de dado fictício (classe `fictional` de `web/src/style.css`).
- Preço de venda e custo estimado nunca usam o mesmo rótulo.

## Pronto quando

- `npm test` e `npm run typecheck` verdes.
- `quickstart.md` seção 7 conferida.
- T063–T068 marcadas `[X]`.
