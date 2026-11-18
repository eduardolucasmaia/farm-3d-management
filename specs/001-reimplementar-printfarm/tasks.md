---
description: "Task list for the Farm 3D reimplementation of the PrintFarm core"
---

# Tasks: Reimplementar o núcleo da farm

**Input**: Design documents from `/specs/001-reimplementar-printfarm/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Revisado**: 2026-11-17, para a stack Node.js + TypeScript + SQLite (research.md item 1). Os IDs T001–T075 mantêm o propósito da versão .NET; caminhos e comandos mudaram. A antiga T072.5 virou T076. T077, T078 e T079 são novas. T089 é a fábrica simulada. T080–T088 vêm da integração das clarificações de 2026-11-17 (spec.md, "Clarifications"; research.md itens 17 a 20). A lista de 119 tarefas em C# publicada na mesma data foi substituída por esta; o que nela era regra de negócio está aqui.

**Leitura**: quem vai implementar começa por `AGENTS.md` na raiz e pelo brief da história em `briefs/`; deste arquivo, leia só a seção da sua fase. Tarefas concluídas (`[X]`) aparecem resumidas em uma linha; o texto original está no histórico (`git log -p -- specs/001-reimplementar-printfarm/tasks.md`).

**Tests**: Entram nas regras de domínio, na orquestração e no acesso por papel. O princípio II da constituição exige o teste vermelho antes da regra. Jornada de tela fica em `specs/001-reimplementar-printfarm/quickstart.md`. Na SPA, Vitest cobre só o guarda de rota.

**Organization**: Uma fase por história, na ordem de prioridade da spec. A história 1 é o MVP e usa semente; não espera as telas de cadastro da história 2.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (outro arquivo, sem depender de tarefa incompleta)
- **[Story]**: história da spec (US1…US8)
- Setup, fundação e polimento não levam história

## Path Conventions

- Servidor: `server/src/{domain,application,infrastructure,api}/`; testes em `server/tests/`
- Migrações: `server/migrations/NNNN-nome.sql`, números reservados nesta lista
- SPA: `web/src/`
- Contratos: `specs/001-reimplementar-printfarm/contracts/`
- Regras citadas entre aspas vêm de `specs/001-reimplementar-printfarm/data-model.md`

## Regras para quem implementa

Valem para toda tarefa abaixo, além das "Regras para agentes" da constituição.

- Comandos: `npm test`, `npm run typecheck` e `npm run db:migrate` rodam a partir da raiz. Tarefa só vira `[X]` com `npm test` e `npm run typecheck` verdes na raiz.
- TypeScript apagável (research.md item 14): sem `enum`, sem `namespace`, sem propriedade no parâmetro do construtor; import relativo com extensão `.ts`; `import type` para tipo.
- Números: inteiros nas unidades de data-model.md "Unidades e representação". Divisão de dinheiro, peso ou tempo só por `server/src/domain/units.ts`. Conversão para unidade humana só na rota.
- Domínio: `server/src/domain/` não importa nada fora de si, não lê relógio e não lança exceção para recusa de negócio; devolve `Result` de `server/src/domain/result.ts`.
- Transação: `withTransaction` com função síncrona. Nenhum `await` dentro dela.
- Banco: só `server/src/infrastructure/db/` importa `node:sqlite`. SQL só em `server/src/infrastructure/repositories/`. Migração mesclada não se edita.
- Dependência nova só depois de registrada em plan.md ou research.md. Lista permitida no servidor: `fastify`, `@fastify/cors`, `@fastify/multipart`, `jose`, `typescript`, `vitest`, `@types/node`.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Workspaces, configuração e limpeza do desenho .NET, sem regra de negócio

- [X] T001 Workspaces npm (raiz e `server/`), scripts e remoção dos restos .NET
- [X] T002 [P] `server/tsconfig.json` e `server/vitest.config.ts`
- [X] T003 [P] Script `typecheck` na SPA, `npm install` e `package-lock.json`
- [X] T004 [P] `.env.example` sem segredo; `.gitignore` com `data/`, `*.db` e `__pycache__/`
- [X] T005 [P] `.editorconfig` sem a seção `[*.cs]`
- [X] T006 `server/src/infrastructure/config.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Pureza, unidades, banco, identidade, casca HTTP, casca da SPA e o job horário vazio

**⚠️ CRITICAL**: Nenhuma história começa antes desta fase

- [X] T007 `server/tests/architecture/domain-purity.test.ts` e `server/src/domain/result.ts`
- [X] T008 [P] `server/src/domain/enums.ts`
- [X] T009 [P] `server/tests/domain/units.test.ts` e `server/src/domain/units.ts`
- [X] T010 `server/tests/infrastructure/db.test.ts`, `db/database.ts`, `db/migrate.ts`, `db/migrate-cli.ts` e `0001-foundation.sql`
- [X] T011 Política de senha e travamento de login (teste e regra), `auth/password.ts`, `users-repo.ts`, `identity-seed.ts`
- [X] T012 `POST /api/auth/login` em `routes/auth.ts`, com `auth/jwt.ts`
- [X] T013 `api/app.ts` (`requireRoles`, problem+json, CORS), `api/main.ts` e `tests/api/authz.test.ts`
- [X] T014 `web/tests/route-guard.spec.ts`, router e store de sessão
- [X] T015 `jobs/hourly-farm-job.ts`, agendamento em `main.ts` e `jobs/run-once.ts`

- [X] T079 `web/src/pages/EntrarPage.vue`, `web/src/api.ts` e `web/src/style.css`

**Checkpoint**: Login devolve token, 401 e 403 testados, a SPA desvia quem não entrou, `npm test` e `npm run typecheck` verdes na raiz

---

## Phase 3: User Story 1 - Pedido aprovado vira lotes na fila (Priority: P1) 🎯 MVP

**Goal**: 10 peças com 4 por prancha viram 3 lotes na fila, com reserva integral e recusa de impressora incompatível

**Independent Test**: Seção 1 de `specs/001-reimplementar-printfarm/quickstart.md`

### Tests for User Story 1

- [X] T016 [P] [US1] `server/tests/domain/lot-split.test.ts`
- [X] T017 [P] [US1] `server/tests/domain/fifo-reservation.test.ts`
- [X] T018 [P] [US1] `server/tests/domain/printer-compatibility.test.ts`
- [X] T077 [US1] `server/tests/domain/sales-order-state.test.ts`
- [X] T026 [US1] `server/tests/application/release-lots.test.ts`

### Implementation for User Story 1

- [X] T019 [P] [US1] `server/src/domain/entities/catalog.ts`
- [X] T020 [P] [US1] `server/src/domain/entities/stock.ts`
- [X] T021 [P] [US1] `server/src/domain/entities/sales.ts` e `production.ts`
- [X] T022 [US1] `splitLots` em `rules/lot-split.ts`
- [X] T023 [US1] `allocateFifo` em `rules/fifo-reservation.ts`
- [X] T024 [US1] `checkPrinterCompatibility` em `rules/printer-compatibility.ts`
- [X] T078 [US1] `transitionSalesOrder` em `rules/sales-order-state.ts` e `PATCH /api/sales-orders/{id}/status`
- [X] T025 [US1] `0002-production-lots.sql` e os repositórios `catalog`, `stock`, `sales` e `production`
- [X] T027 [US1] `use-cases/release-lots.ts`, com `planRelease` em `rules/release-plan.ts`
- [X] T028 [US1] Transição Released → Queued em `rules/lot-state.ts` e `use-cases/enqueue-lot.ts`
- [X] T029 [US1] Rotas em `routes/lots.ts`, `routes/sales-orders.ts` (leitura) e `routes/cadastros/printers.ts` (leitura)
- [X] T030 [US1] `seed/demo-seed.ts`, com os dados fictícios da seção 1 do quickstart
- [X] T031 [US1] `web/src/pages/PedidoPage.vue` e `FilaPage.vue`

### Ajustes da US1 pelas clarificações de 2026-11-17

- [X] T080 [US1] Parâmetros da prancha preservados no lote; a liberação já enfileira sem impressora; código `INSUFFICIENT_MATERIAL`
- [X] T081 [US1] `POST /api/lots/{id}/queue`: 201 cria o item, 200 atualiza o mesmo item (`queueAction`)
- [X] T082 [US1] `GET /api/lots` com `reservedGrams`, `missingMaterialG` e os campos `released*`
- [X] T083 [US1] Teste: editar o perfil não muda lotes liberados; liberação nova usa o perfil novo
- [X] T089 [US1] Fábrica simulada opcional para demonstração: escrever primeiro `server/tests/infrastructure/factory-seed.test.ts` (20 impressoras cobrindo os seis estados operacionais, nomes marcados como fictícios, lotes na fila com reserva integral e só em impressora compatível e disponível, carga única). Depois criar `server/src/infrastructure/seed/factory-dataset.ts` (só dados, em unidades inteiras), `factory-seed.ts` (cadastros por SQL; pedidos, lotes e fila pelos casos de uso existentes) e `factory-cli.ts`, com o script `seed:factory` em `server/package.json`. Só com `NODE_ENV=development`. Estado de impressora fora de Disponível é cadastro fictício, sem execução por trás, até a US5

**Checkpoint**: Seção 1 do quickstart passa. Parar aqui já é um MVP demonstrável

---

## Phase 4: User Story 2 - Manter a base da operação (Priority: P2)

**Goal**: Cada papel grava só o seu cadastro, impressora sem limite é recusada, admin cria usuário

**Independent Test**: Seção 2 de `specs/001-reimplementar-printfarm/quickstart.md`

### Tests for User Story 2

- [ ] T032 [P] [US2] Escrever `server/tests/domain/master-data-rules.test.ts` falhando quando o limite de manutenção é zero ou ausente, quando peças por prancha são menores que 1, quando segundos ou miligramas por prancha não são maiores que zero e quando `hex` não é vazio nem `#RRGGBB`. Regras: "Limite de horas de manutenção maior que zero." e "Peças por prancha, minutos por prancha e gramas por prancha, todos maiores que zero."

### Implementation for User Story 2

- [ ] T033 [US2] Implementar `server/src/domain/rules/master-data-rules.ts` até `master-data-rules.test.ts` passar. `hourRateExcludesFilamentAndEnergy` é sempre `true`. Frase fixa: "A taxa de hora-máquina não inclui filamento nem energia."
- [ ] T034 [P] [US2] Criar os tipos `Operator`, `File3D` e `File3DVersion` em `server/src/domain/entities/masters.ts`, a migração `server/migrations/0003-masters.sql` e `server/src/infrastructure/repositories/masters-repo.ts`
- [ ] T035 [US2] Implementar as rotas de `contracts/cadastros.md`, um arquivo por recurso em `server/src/api/routes/cadastros/` (`customers.ts`, `suppliers.ts`, `colors.ts`, `materials.ts`, `files3d.ts`, `print-profiles.ts`, `products.ts`, `printers.ts`, `operators.ts`), com a matriz de papéis do contrato, validação por `master-data-rules` e conversão de unidades por `parseScaled` e `formatScaled`
- [ ] T036 [US2] Implementar `POST /api/users` e `GET /api/users` em `server/src/api/routes/users.ts` conforme `contracts/auth.md`, usando `password-policy`. Produção não cria usuário
- [ ] T037 [US2] Em `server/src/api/routes/cadastros/files3d.ts` e `server/src/infrastructure/files/file-store.ts`, guardar o binário da versão sob `FARM3D_FILES_DIR` com `@fastify/multipart` e só o caminho relativo em `File3DVersion.StoragePath`. Recusar caminho que saia do diretório
- [ ] T038 [US2] Criar as páginas em `web/src/pages/cadastros/` para cliente, modelo, impressora e operador, escondendo a ação quando o papel da sessão não é o da escrita

**Checkpoint**: Seção 2 do quickstart passa sem usar só a semente

---

## Phase 5: User Story 3 - Orçamento vira no máximo um pedido (Priority: P2)

**Goal**: Enviar, aprovar, rejeitar, expirar e gerar um único pedido

**Independent Test**: Seção 3 de `specs/001-reimplementar-printfarm/quickstart.md`

### Tests for User Story 3

- [ ] T039 [P] [US3] Escrever `server/tests/domain/quote-state.test.ts` falhando nas transições ilegais e passando nas legais da seção Comercial de `data-model.md`. Incluir: validade vencida no dia local em Draft, Sent ou Approved vai a Expired; Rejected e OrderGenerated não expiram; sem `validUntil` não expira. Regra: "Rejeitado e pedido gerado não são expirados."

### Implementation for User Story 3

- [ ] T040 [US3] Criar os tipos `Quote` e `QuoteLine` em `server/src/domain/entities/commercial.ts` e `transitionQuote` em `server/src/domain/rules/quote-state.ts` até `quote-state.test.ts` passar. Subtotal = quantidade × `UnitPriceCents`, inteiro exato
- [ ] T041 [US3] Implementar `server/src/application/use-cases/quote-lifecycle.ts` e `server/src/application/use-cases/create-order-from-quote.ts`: geração exige Approved, validade não vencida e `promisedDate`; segunda geração recusada; motivo de rejeição acrescentado a Notes como `Rejeição: …`
- [ ] T042 [US3] Criar `server/migrations/0004-quotes.sql` e `server/src/infrastructure/repositories/quotes-repo.ts`
- [ ] T043 [US3] Implementar os endpoints de orçamento de `contracts/comercial.md` em `server/src/api/routes/quotes.ts` e acrescentar a `server/src/api/routes/sales-orders.ts` o pedido manual em QuotePending, a geração por orçamento e o `PATCH` para Delivered. O `PATCH` de T078 não muda de comportamento
- [ ] T044 [US3] Em `server/src/infrastructure/jobs/hourly-farm-job.ts`, expirar orçamentos elegíveis usando `transitionQuote`, com "hoje" no fuso de `farm_settings.time_zone`. Orçamento sem `validUntil` não expira
- [ ] T045 [US3] Criar `web/src/pages/OrcamentosPage.vue` com a composição da linha (modelo, material, quantidade, subtotal) e a ação de gerar pedido

**Checkpoint**: Seção 3 do quickstart passa. História 1 continua verde

---

## Phase 6: User Story 4 - Compra entra em lote de material (Priority: P2)

**Goal**: Receber quilos em gramas, formar lote de material e sugerir recompra abaixo do ponto

**Independent Test**: Seção 4 de `specs/001-reimplementar-printfarm/quickstart.md`

### Tests for User Story 4

- [ ] T046 [P] [US4] Escrever `server/tests/domain/receipt-math.test.ts` falhando: peso ≤ 0 é recusado; 1 kg pedido (1000000 mg) completa com 1000 g recebidos; o lote criado herda `CostCentsPerKg` do preço da linha; recebimento acima do pedido é recusado; sugestão de recompra = ponto − livre, mínimo zero, e nenhuma sem ponto de reposição. Regra: "Recebimento com peso zero ou negativo é recusado."

### Implementation for User Story 4

- [ ] T047 [US4] Criar os tipos `PurchaseOrder`, `PurchaseOrderLine`, `PurchaseReceipt`, `PurchaseReceiptLine` e `RestockSuggestion` em `server/src/domain/entities/purchasing.ts` e as regras `server/src/domain/rules/receipt-math.ts` e `server/src/domain/rules/restock.ts` até `receipt-math.test.ts` passar
- [ ] T048 [US4] Implementar `server/src/application/use-cases/receive-purchase.ts` criando `MaterialLot`, `StockItem` e `StockMovement` `PurchaseIn` na mesma transação, e o estado PartiallyReceived ou Received
- [ ] T049 [US4] Criar `server/migrations/0005-purchasing.sql` (inclusive `restock_suggestions`), `server/src/infrastructure/repositories/purchasing-repo.ts` e os endpoints de `contracts/estoque-compras.md` em `server/src/api/routes/purchase-orders.ts` e `server/src/api/routes/stock.ts`
- [ ] T050 [US4] Em `hourly-farm-job.ts`, gravar `RestockSuggestion` com `restock.ts`, só quando `ReorderPointMg` não é nulo e o livre está abaixo
- [ ] T051 [US4] Criar `web/src/pages/ComprasPage.vue` e `web/src/pages/EstoquePage.vue` mostrando livre, reservado e o código do lote de material

**Checkpoint**: Seção 4 do quickstart passa. A reserva da história 1 passa a usar lote recebido de verdade

---

## Phase 7: User Story 5 - Executar sem liberar a máquina cedo (Priority: P3)

**Goal**: Concluir a impressão não devolve a máquina a disponível. Retirada, preparação, manutenção, falha e reimpressão seguem as duas máquinas de estado

**Independent Test**: Seção 5 de `specs/001-reimplementar-printfarm/quickstart.md`

### Tests for User Story 5

- [ ] T052 [P] [US5] Escrever `server/tests/domain/printer-state.test.ts` falhando nas transições da seção "Transições da impressora" de `data-model.md`. Incluir: pausa não muda a impressora; `AccumulatedSeconds` ≥ `MaintenanceLimitHours` × 3600 no fim da preparação leva a InMaintenance; nota vazia recusa a confirmação da manutenção
- [ ] T053 [P] [US5] Escrever `server/tests/domain/lot-state.test.ts` falhando: falha sem reimpressão vai a Failed; falha com reimpressão volta a Queued; segunda conclusão é ilegal; confirmar retirada após execução concluída vai a Completed e após falha não muda o lote
- [ ] T055 [US5] Escrever `server/tests/application/run-execution.test.ts` com SQLite `:memory:`, falhando antes de T056, com os casos da tabela "Material real e reimpressão" do quickstart: conclusão grava uma única baixa lógica `ProductionOut` detalhada por lote de material e libera a sobra; segunda conclusão não grava movimento; falha exige material real ≥ 0, grava `Waste` só se positivo; sem reimpressão faz `Unreserve` do restante; com reimpressão mantém a reserva restante, tenta o complemento integral e cria `PrintRun` Planned ligada à anterior; complemento insuficiente confirma a falha e deixa `MissingMg` positivo; início recusado até completar; consumo acima da reserva usa saldo livre FIFO e nunca reserva alheia; retirada usa `OccupyingPrintRunId`

### Implementation for User Story 5

- [ ] T086 [P] [US5] Escrever primeiro `server/tests/domain/material-consumption.test.ts` e ver falhar: consumo usa primeiro a reserva própria por `receivedAt` e id; só o excesso usa saldo livre do mesmo material, FIFO; nunca usa reserva de outro lote de produção; falta de 1 mg recusa tudo; consumo menor que a reserva devolve a sobra a liberar. Depois implementar `planConsumption` em `server/src/domain/rules/material-consumption.ts`
- [ ] T087 [P] [US5] Escrever primeiro `server/tests/domain/reprint-reservation.test.ts` e ver falhar: complemento = max(0, PlannedMg − reserva restante); alocação integral FIFO ou nenhuma; com 40 g planejados, 30 g restantes e 5 g livres, não reserva nada e devolve 10 g faltando. Depois implementar `planReprintComplement` em `server/src/domain/rules/reprint-reservation.ts`
- [ ] T054 [US5] Criar o tipo `PrintRun` em `server/src/domain/entities/print-run.ts` e as regras `transitionPrinter` em `server/src/domain/rules/printer-state.ts` e `transitionLot` em `server/src/domain/rules/lot-state.ts` até os dois testes de domínio passarem
- [ ] T056 [US5] Implementar `server/src/application/use-cases/run-execution.ts` até `run-execution.test.ts` passar, usando `planConsumption` (T086) e `planReprintComplement` (T087): conclusão com `actualMaterialG` > 0; falha com `actualMaterialG` ≥ 0; horas acumuladas somam o tempo real sem a pausa; motivos só os de `PrintFailureReason`
- [ ] T057 [US5] Criar `server/migrations/0006-runs.sql` (tabela `print_runs`; coluna `occupying_print_run_id` em `printers`; índice único de `stock_movements` em `print_run_id` + `stock_item_id` para ProductionOut e Waste; índice único de reserva por lote de produção + saldo), `server/src/infrastructure/repositories/runs-repo.ts`, as rotas de execução e falha em `server/src/api/routes/runs.ts` e as de retirada, preparação, manutenção e indisponível em `server/src/api/routes/printer-events.ts`, conforme `contracts/producao.md`
- [ ] T058 [US5] Criar `web/src/pages/ExecucaoPage.vue` com iniciar, pausar, concluir, falhar, retirada e preparação, mostrando o estado do lote e o da impressora em campos separados

- [ ] T088 [US5] Escrever `server/tests/application/concurrency.test.ts` com um arquivo SQLite temporário e duas conexões, cobrindo a seção "Atomicidade e concorrência" do quickstart para liberação, consumo e encerramento: disputa pelo mesmo saldo livre, duas conclusões da mesma execução, conclusão contra falha e rollback forçado entre movimento e estado. Ajustar `withTransaction` e os casos de uso se algum teste falhar

**Checkpoint**: Seção 5 do quickstart passa, inclusive a tabela "Material real e reimpressão". Máquina disponível só depois da preparação, e não com manutenção vencida

---

## Phase 8: User Story 6 - Registrar fatura e pagamento do pedido (Priority: P3)

**Goal**: Lançar fatura e pagamento sem nota fiscal e sem cobrança

**Independent Test**: Seção 6 de `specs/001-reimplementar-printfarm/quickstart.md`

### Tests for User Story 6

- [ ] T059 [P] [US6] Escrever `server/tests/domain/billing-guard.test.ts` falhando: pedido QuotePending ou Cancelled não aceita fatura nem pagamento; `AmountCents` ≤ 0 é recusado; meio fora de `PaymentMethod` é recusado. Regra: "Pedido em confirmação pendente não gera lote de produção, fatura nem pagamento."

### Implementation for User Story 6

- [ ] T060 [US6] Criar os tipos `Invoice` e `Payment` em `server/src/domain/entities/billing.ts` e `server/src/domain/rules/billing-guard.ts` até o teste passar
- [ ] T061 [US6] Criar `server/migrations/0007-billing.sql`, `server/src/infrastructure/repositories/billing-repo.ts` e os endpoints de `contracts/financeiro.md` em `server/src/api/routes/billing.ts`. Não criar recurso de nota fiscal
- [ ] T062 [US6] Criar `web/src/pages/FinanceiroPage.vue` com os lançamentos do pedido e sem ação de nota ou boleto

**Checkpoint**: Seção 6 do quickstart passa

---

## Phase 8.5: Cancelamento de pedido (US3, depois de US5 e US6)

**Goal**: Cancelar pedido confirmado só com planejamento, nunca depois de execução iniciada, fatura ou pagamento (FR-009; spec, US3 cenários 8 e 9)

**Independent Test**: Seção 3, passos 7 e 8, de `specs/001-reimplementar-printfarm/quickstart.md`

**Por que aqui**: a regra consulta execuções (US5) e lançamentos financeiros (US6); antes deles não há o que bloquear

- [ ] T084 [US3] Escrever primeiro `server/tests/domain/order-cancellation.test.ts` e ver falhar: QuotePending, Approved e InProduction cancelam se não há execução com início, fatura nem pagamento; cada impedimento vira um `blocker` (`EXECUTION_STARTED`, `INVOICE_EXISTS`, `PAYMENT_EXISTS`); execução iniciada e já encerrada também bloqueia; Cancelled continua imutável. Depois implementar `planOrderCancellation` em `server/src/domain/rules/order-cancellation.ts` e fazer `transitionSalesOrder` aceitar Approved e InProduction para Cancelled só por meio dela
- [ ] T085 [US3] Escrever primeiro `server/tests/application/cancel-order.test.ts` e ver falhar: cancela pedido e lotes pendentes, remove itens de fila e execuções Planned sem início, faz `Unreserve` de cada reserva uma única vez e devolve exatamente o reservado ao livre; recusa com 409 `ORDER_CANCELLATION_BLOCKED` sem alterar nada; repetir não libera de novo. Depois implementar `server/src/application/use-cases/cancel-order.ts` e ligá-lo ao `PATCH /api/sales-orders/{id}/status` em `routes/sales-orders.ts`. Incluir no `concurrency.test.ts` (T088) a disputa de cancelamento contra início, fatura e pagamento

**Checkpoint**: Seção 3, passos 7 e 8, do quickstart passam

---

## Phase 9: User Story 7 - Ver prazo, custo e carga com a premissa (Priority: P3)

**Goal**: Painel com atraso, máquinas em impressão, custo com parcelas e total vazio se falta premissa

**Independent Test**: Seção 7 de `specs/001-reimplementar-printfarm/quickstart.md`

### Tests for User Story 7

- [ ] T063 [P] [US7] Escrever `server/tests/domain/cost-estimate.test.ts` falhando: cada parcela segue a fórmula de data-model.md e é arredondada uma vez ao centavo, metade para cima; total = soma das parcelas arredondadas, só quando tarifa, custo por kg, energia por hora e taxa existem; senão `total` é nulo e `missingPremises` lista o que falta. A frase do resultado é "A taxa de hora-máquina não inclui filamento nem energia."
- [ ] T064 [P] [US7] Escrever `server/tests/domain/backlog-forecast.test.ts` falhando: atraso é data prometida anterior a hoje com lote em aberto; vencendo hoje compara a data recebida como "hoje"; máquina AwaitingPickup não conta como em impressão; aproximação de máquinas equivalentes só com a frase de capacidades equivalentes

### Implementation for User Story 7

- [ ] T065 [US7] Implementar `estimateCost` em `server/src/domain/rules/cost-estimate.ts` e `forecastBacklog` em `server/src/domain/rules/backlog-forecast.ts` até os testes passarem
- [ ] T066 [US7] Criar `server/migrations/0008-dashboard.sql` com `deadline_alerts`, o tipo `DeadlineAlert` em `server/src/domain/entities/dashboard.ts` e gravar o alerta em `hourly-farm-job.ts`, com "hoje" calculado no fuso da farm por `server/src/infrastructure/clock/farm-date.ts` (`Intl.DateTimeFormat`)
- [ ] T067 [US7] Implementar `GET /api/dashboard` (consumo de sete dias = ProductionOut + Waste, uma vez por detalhe, sem Reserve e Unreserve), `GET /api/lots/{id}/cost-estimate`, `GET /api/dashboard/backlog`, `GET /api/dashboard/restock-suggestions` e `PUT /api/settings` em `server/src/api/routes/dashboard.ts` e `server/src/api/routes/settings.ts` conforme `contracts/painel.md`, com `server/src/infrastructure/repositories/dashboard-repo.ts`. `examplesAreFictional: false` responde 400
- [ ] T068 [US7] Criar `web/src/pages/PainelPage.vue` mostrando os contadores, a conta do custo, a premissa ausente e a marca de dado fictício em todo número de exemplo

**Checkpoint**: Seção 7 do quickstart passa

---

## Phase 10: User Story 8 - Auditar quem mudou o estado (Priority: P4)

**Goal**: Trilha com autor e estados, leitura só para Admin e Production

**Independent Test**: Seção 8 de `specs/001-reimplementar-printfarm/quickstart.md`

### Tests for User Story 8

- [ ] T069 [P] [US8] Escrever `server/tests/application/audit.test.ts` com SQLite `:memory:`, falhando: liberar um lote grava trilha com estado anterior, estado novo e usuário; o rollback da liberação também desfaz a trilha. Regra: "Trilha guarda entidade, ação, usuário, momento, estado anterior e estado novo."

### Implementation for User Story 8

- [ ] T070 [US8] Criar `server/migrations/0009-audit.sql`, o tipo `AuditLog` em `server/src/domain/entities/audit.ts` e `server/src/application/use-cases/audit-writer.ts`, e chamá-lo, dentro da mesma transação, nas mudanças de estado de orçamento, pedido, lote e impressora já implementadas
- [ ] T071 [US8] Implementar `GET /api/audit` em `server/src/api/routes/audit.ts` conforme `contracts/painel.md`, com `server/src/infrastructure/repositories/audit-repo.ts`. Sales, Purchasing e Operator recebem 403, coberto em `authz.test.ts`
- [ ] T072 [US8] Garantir em `receive-purchase.ts`, `run-execution.ts` e `cancel-order.ts` que a movimentação persiste kind, quantidade, custo unitário, saldo, lote de material e a origem, com uma linha por lote de material numa baixa que usa vários. Regra: "Movimentação guarda tipo, gramas, custo unitário e origem."

**Checkpoint**: Seção 8 do quickstart passa

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Fechar a prova e a leitura de quem chega agora

- [ ] T073 [P] Atualizar `README.md` na raiz com o arranque de `specs/001-reimplementar-printfarm/quickstart.md` e a frase de que `docs_apoio/software_ref` não é código deste produto
- [ ] T074 [P] Revisar `web/src/pages/` para que preço de venda e custo estimado não compartilhem o mesmo rótulo
- [ ] T076 Verificar a ausência de módulos fora do escopo: buscar em `server/`, `web/` e nos `package.json` referências a NF-e, nota fiscal eletrônica, boleto, gateway de pagamento, cotação de frete, telemetria de impressora, otimização automática da fila, assistente de conversa, SDK de impressora, ORM, biblioteca de fila ou cron, e restos do desenho .NET (`.cs`, `.csproj`, `.sln`, `dotnet`). Nenhum resultado é esperado; qualquer achado bloqueia T075. Antes numerada T072.5
- [ ] T075 Rodar `npm test` e `npm run typecheck` na raiz e executar a seção 1 de `quickstart.md` antes de chamar o MVP de pronto

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: começa imediato
- **Foundational (Phase 2)**: depende do Setup e bloqueia todas as histórias
- **US1 (Phase 3)**: depende da fundação. Não depende das outras histórias
- **US2 (Phase 4)**: depende da US1 (tabelas de catálogo da migração 0002)
- **US3 (Phase 5)**: depende da US1 (`sales_orders`, `order_lines` e o `PATCH` de T078)
- **US4 (Phase 6)**: depende da US1 (`materials`, `material_lots`, `stock_items`)
- **US5 (Phase 7)**: depende da US1 (lote na fila e reserva)
- **US6 (Phase 8)**: depende da US1 para o pedido confirmado
- **US7 (Phase 9)**: depende de US1 e US5 para máquinas em impressão e de US4 para a sugestão já gravada
- **Cancelamento de pedido (Phase 8.5)**: depende de US3, US5 e US6
- **US8 (Phase 10)**: depende dos casos de uso cujas transições vai registrar (US1, US3, US5 e o cancelamento)
- **Polish**: depois das histórias que a entrega decidiu incluir

### Within Each User Story

- Teste da regra falha antes da função em `server/src/domain/rules/`
- Teste de orquestração falha antes do caso de uso em `server/src/application/use-cases/`
- Tipos antes do caso de uso
- Migração e repositório antes do caso de uso que grava
- Caso de uso antes da rota
- Rota antes da página

### Migrações reservadas

| Arquivo | Tarefa | História |
|---------|--------|----------|
| `0001-foundation.sql` | T010 | Fundação |
| `0002-production-lots.sql` | T025 | US1 |
| `0003-masters.sql` | T034 | US2 |
| `0004-quotes.sql` | T042 | US3 |
| `0005-purchasing.sql` | T049 | US4 |
| `0006-runs.sql` | T057 | US5 (inclui `printers.occupying_print_run_id` e os índices únicos de consumo e reserva) |
| `0007-billing.sql` | T061 | US6 |
| `0008-dashboard.sql` | T066 | US7 |
| `0009-audit.sql` | T070 | US8 |

Uma história que precise de outra mudança de esquema usa o próximo número livre depois de 0009 e registra a linha nesta tabela.

### Arquivos com mais de um escritor

`server/src/api/app.ts` (registro de rotas), `server/src/api/main.ts`, `server/src/infrastructure/jobs/hourly-farm-job.ts`, `server/src/api/routes/sales-orders.ts`, `server/src/domain/entities/*.ts` já criados, `web/src/router/index.ts` e este `tasks.md`. Neles, uma tarefa por vez e só acréscimo, sem reformatar.

### Parallel Opportunities

- T002, T003, T004 e T005 em paralelo
- T008 e T009 em paralelo
- T016, T017 e T018 em paralelo; T019, T020 e T021 em paralelo
- T032 sozinho antes de T033; T034 em paralelo com T032
- T039, T046, T052, T053, T059, T063, T064 e T069 podem ser escritos assim que a fundação existir, cada um no seu arquivo de teste
- US2, US3, US4, US5 e US6 podem ser tocadas por pessoas diferentes depois da US1, desde que `app.ts`, `hourly-farm-job.ts` e o router tenham um escritor por vez

---

## Implementation Strategy

### Incremental Delivery

1. Fundação
2. US1 → fila real (MVP)
3. US2 → a oficina cadastra sem semente
4. US3 → orçamento único
5. US4 → entrada de material
6. US5 → chão de fábrica com dois estados
7. US6 → registro financeiro
8. US7 → painel com premissa
9. US8 → trilha
10. T076 e T075

### Parallel Team Strategy

1. Uma pessoa fecha Setup e Foundational
2. Uma pessoa fica na US1 até o checkpoint
3. Em seguida: US2, US3, US4, US5 e US6 em branches separadas, uma pessoa por branch
4. US7 e US8 por último

---

## Notes

- [P] = outro arquivo, sem dependência incompleta
- Um teste que importa uma regra inexistente falha na importação. Criar a regra exportando a função que devolve `fail('NOT_IMPLEMENTED', …)` conta como vermelho
- A história no rótulo amarra a tarefa à spec
- T080–T083 corrigem a US1 já implementada; T084–T085 formam a fase 8.5; T086, T087 e T088 entram na US5. A lista em C# publicada em 2026-11-17 tinha outra numeração; não usar aqueles IDs.
- Os IDs não seguem a ordem do arquivo em três pontos: T077 e T026 aparecem entre os testes da US1, T055 entre os testes da US5 e T076 antes de T075. A ordem de execução é a ordem do arquivo
- Não copiar código de `docs_apoio/software_ref`; aquele diretório é leitura
- Não criar módulo de assistente, cliente fiscal, SDK de impressora, ORM nem biblioteca de fila
- Commit ao fim de cada checkpoint, com `npm test` e `npm run typecheck` verdes
