---
description: "Task list for the Farm 3D reimplementation of the PrintFarm core"
---

# Tasks: Reimplementar o núcleo da farm

**Input**: Design documents from `/specs/001-reimplementar-printfarm/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Revisado**: 2026-11-18, para a stack Node.js + TypeScript + SQLite (research.md item 1). Organização por história de usuário. Os caminhos de arquivo seguem plan.md "Project Structure".

**Leitura**: quem vai implementar começa por `AGENTS.md` na raiz e pelo brief da história em `briefs/`; deste arquivo, leia só a seção da sua fase. Tarefas concluídas (`[X]`) aparecem resumidas em uma linha; o texto original está no histórico (`git log -p -- specs/001-reimplementar-printfarm/tasks.md`).
**Revisado**: 2026-11-18, para a stack Node.js + TypeScript + SQLite (research.md item 1). Organização por história de usuário. Os caminhos de arquivo seguem plan.md "Project Structure".

**Tests**: Entram nas regras de domínio, na orquestração e no acesso por papel. O princípio II da constituição exige o teste vermelho antes da regra. Jornada de tela fica em `specs/001-reimplementar-printfarm/quickstart.md`. Na SPA, Vitest cobre só o guarda de rota.

**Organization**: Uma fase por história, na ordem de prioridade da spec.md (US1-P1 → US8-P4). Tarefas marcadas [P] rodam em paralelo (arquivos diferentes, sem dependência). Dentro de cada fase, modelos antes de serviços, serviços antes de rotas.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Remove arquivos C# e .NET deixados por implementação anterior (`Farm3d.sln`, `src/`, `docker-compose.yml`) em `package.json`
- [X] T002 [P] Criar `package.json` raiz com workspaces: `server` e `web`
- [X] T003 [P] Criar `server/package.json` com dependências: fastify, @fastify/jwt, @fastify/problem, node:sqlite, vitest, typescript
- [X] T004 [P] Criar `web/package.json` com dependências: vue, vite, vue-router, pinia, vitest
- [X] T005 [P] Criar `server/tsconfig.json` e `web/tsconfig.json`
- [X] T006 [P] Configurar Vitest no `server/vitest.config.ts`
- [X] T007 [P] Configurar Vitest no `web/vitest.config.ts`
- [X] T008 [P] Configurar ESLint e Prettier no `server` e no `web`
- [X] T009 Criar estrutura de pastas do servidor: `server/src/domain/`, `server/src/application/`, `server/src/infrastructure/`, `server/src/api/`, `server/migrations/`, `server/tests/`
- [X] T010 Criar estrutura de pastas do cliente: `web/src/pages/`, `web/src/router/`, `web/src/stores/`, `web/tests/`
- [X] T011 Criar `.env.example` com nomes de variáveis (sem segredos): `JWT_SIGNING_KEY`, `FARM3D_SEED_PASSWORD`, `DATABASE_PATH`, `TIME_ZONE`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete


### Database and Domain Foundation

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


- [X] T016 [P] Definir enums em `server/src/domain/enums.ts`: `UserRole`, `QuoteStatus`, `SalesOrderCommercialStatus`, `ProductionLotStatus`, `PrinterOperationalStatus`, `StockMovementKind`, `PrintRunStatus`, `FailReason`, `PaymentMethod`, `MaterialType` — copiar valores exatos de `data-model.md`
- [X] T017 [P] Definir utilitários de unidade em `server/src/domain/units.ts`: classes `Money`, `Grams`, `Minutes`, `CentsPerKg`, `CentsPerHour`, `CentsPerKwh` — pesagem inteira conforme "Unidades e representação" de data-model.md
- [X] T018 [P] Criar classe `Result<T>` em `server/src/domain/result.ts` para domínio puro (fail/pass pattern)
- [X] T019 Criar `server/src/infrastructure/db/connection.ts`: conexão SQLite com `busy_timeout`, `PRAGMA foreign_keys = on` (research.md item 3)
- [X] T020 Criar framework de migrações em `server/src/infrastructure/db/migrations.ts`: executar SQL de `migrations/*.sql` em ordem

### Entity Definitions (Core Entities needed across stories)

- [X] T017 [P] Criar tipos de entidade em `server/src/domain/entities/user.ts`: `User` com `email`, `name`, `role`, `passwordHash`
- [X] T018 [P] Criar tipos de entidade em `server/src/domain/entities/customer.ts`: `Customer` com `name`, `contact`, `address`
- [X] T019 [P] Criar tipos de entidade em `server/src/domain/entities/supplier.ts`: `Supplier` com `name`, `contact`, `paymentTerms`, `avgLeadTimeDays`
- [X] T020 [P] Criar tipos de entidade em `server/src/domain/entities/product.ts`: `Product` com `name`, `sku`, `defaultSellPrice`, `printProfileId`, `materialId`, `fileId`, `offeredColors`, `offeredSizes`, `isForSale`
- [X] T021 [P] Criar tipos de entidade em `server/src/domain/entities/color.ts`: `Color` com `name`, `hex`
- [X] T022 [P] Criar tipos de entidade em `server/src/domain/entities/material.ts`: `Material` com `name`, `type`, `brand`, `diameterMm`, `color`, `referenceCostPerKgCents`, `reorderPointGrams`
- [X] T023 [P] Criar tipos de entidade em `server/src/domain/entities/materialLot.ts`: `MaterialLot` com `materialId`, `supplierId`, `code`, `receivedAt`, `initialWeightG`, `currentWeightG`, `costPerGramCents`
- [X] T024 [P] Criar tipos de entidade em `server/src/domain/entities/stockItem.ts`: `StockItem` com `materialId`, `materialLotId`, `quantityG`, `reservedG`
- [X] T025 [P] Criar tipos de entidade em `server/src/domain/entities/stockMovement.ts`: `StockMovement` com `kind`, `quantityG`, `unitCost`, `stockItemId`, `materialLotId`, `productionLotId`, `printRunId`
- [X] T026 [P] Criar tipos de entidade em `server/src/domain/entities/file3d.ts`: `File3d` com `name`
- [X] T027 [P] Criar tipos de entidade em `server/src/domain/entities/fileVersion.ts`: `FileVersion` com `fileId`, `versionLabel`, `path`
- [X] T028 [P] Criar tipos de entidade em `server/src/domain/entities/printProfile.ts`: `PrintProfile` com `name`, `materialId`, `piecesPerPlate`, `minutesPerPlate`, `gramsPerPlate`
- [X] T029 [P] Criar tipos de entidade em `server/src/domain/entities/printer.ts`: `Printer` com `name`, `model`, `volume`, `hourRateCentsPerHour`, `energyPerHourWh`, `maintenanceLimitHours`, `accumulatedHours`, `preparationMinutes`, `compatibleMaterialIds`, `operationalStatus`, `isActive`
- [X] T030 [P] Criar tipos de entidade em `server/src/domain/entities/operator.ts`: `Operator` com `name`, `userId`
- [X] T031 [P] Criar tipos de entidade em `server/src/domain/entities/quote.ts`: `Quote` com `number`, `customerId`, `status`, `validUntil`, `notes`, `lines`
- [X] T032 [P] Criar tipos de entidade em `server/src/domain/entities/quoteLine.ts`: `QuoteLine` com `productId`, `quantity`, `unitPrice`, `materialId`
- [X] T033 [P] Criar tipos de entidade em `server/src/domain/entities/salesOrder.ts`: `SalesOrder` com `number`, `customerId`, `quoteId`, `commercialStatus`, `promisedDate`, `freightCents`, `packagingCents`, `lines`
- [X] T034 [P] Criar tipos de entidade em `server/src/domain/entities/orderLine.ts`: `OrderLine` com `productId`, `quantity`, `unitPrice`, `materialId`, `colorId`, `size`
- [X] T035 [P] Criar tipos de entidade em `server/src/domain/entities/productionLot.ts`: `ProductionLot` com `orderId`, `orderLineId`, `productId`, `materialId`, `qtyPlanned`, `qtyCompleted`, `status`, `plannedGrams`, `plannedMinutes`, `releasedPiecesPerPlate`, `releasedMinutesPerPlate`, `releasedGramsPerPlate`
- [X] T036 [P] Criar tipos de entidade em `server/src/domain/entities/reservation.ts`: `Reservation` com `productionLotId`, `stockItemId`, `grams`
- [X] T037 [P] Criar tipos de entidade em `server/src/domain/entities/queueItem.ts`: `QueueItem` com `productionLotId`, `printerId`, `priority`, `position`
- [X] T038 [P] Criar tipos de entidade em `server/src/domain/entities/printRun.ts`: `PrintRun` com `productionLotId`, `printerId`, `operatorId`, `status`, `startedAt`, `completedAt`, `pausedSeconds`, `failReason`, `actualMaterialG`, `actualMinutes`, `materialLotId`, `reprintOfPrintRunId`
- [X] T039 [P] Criar tipos de entidade em `server/src/domain/entities/purchaseOrder.ts`: `PurchaseOrder` com `supplierId`, `number`, `status`, `lines`
- [X] T040 [P] Criar tipos de entidade em `server/src/domain/entities/purchaseOrderLine.ts`: `PurchaseOrderLine` com `materialId`, `quantityKg`, `unitPrice`
- [X] T041 [P] Criar tipos de entidade em `server/src/domain/entities/invoice.ts`: `Invoice` com `salesOrderId`, `number`, `amountCents`, `issuedAt`, `documentReference`
- [X] T042 [P] Criar tipos de entidade em `server/src/domain/entities/payment.ts`: `Payment` com `salesOrderId`, `amountCents`, `method`, `paidAt`, `reference`
- [X] T043 [P] Criar tipos de entidade em `server/src/domain/entities/farmSettings.ts`: `FarmSettings` com `energyTariffPerKwhCents`, `calendarSummary`, `workDays`, `workStart`, `workEnd`, `timeZone`, `examplesAreFictional`
- [X] T044 [P] Criar tipos de entidade em `server/src/domain/entities/auditLog.ts`: `AuditLog` com `entityName`, `entityId`, `action`, `userId`, `at`, `fromStatus`, `toStatus`

### Application Layer Foundation

- [X] T045 Criar repositórios base em `server/src/infrastructure/repositories/baseRepository.ts`: interface com `find`, `findAll`, `save`, `delete`
- [X] T046 Configurar gerenciamento de configuração em `server/src/infrastructure/config.ts`: leitura de `.env` com validação
- [X] T047 Configurar logging em `server/src/infrastructure/` — estrutura pronta para uso

### API Foundation

- [X] T048 [P] Criar `server/src/api/app.ts`: construção do Fastify com `buildApp(deps)` — usado pela subida e pelos testes (research.md item 16)
- [X] T049 [P] Criar `server/src/api/main.ts`: entry-point que liga `app.ts` e ouve porta
- [X] T050 Criar middleware de autenticação em `server/src/infrastructure/auth/authMiddleware.ts`: verifica JWT, injeta `userId` e `roles` no request
- [X] T051 Criar padronização de erros Problem Details em `server/src/infrastructure/api/errorHandler.ts`: `application/problem+json` com `type`, `title`, `status`, `detail`, `code` (research.md item 15)
- [X] T052 Criar `server/src/api/routes/health.ts`: GET /api/health — sem autenticação

### Migration SQL Foundation

- [X] T053 Criar migração `server/migrations/0001-users.sql`: tabela `users` com `id`, `email`, `name`, `role`, `passwordHash`, `loginFailures`, `lockedUntil`
- [X] T054 Criar migração `server/migrations/0002-cadastros.sql`: tabelas `customers`, `suppliers`, `colors`, `materials`, `files3d`, `fileVersions`, `printProfiles`, `printers`, `operators`
- [X] T055 Criar migração `server/migrations/0003-commercial.sql`: tabelas `quotes`, `quoteLines`, `salesOrders`, `orderLines`
- [X] T056 Criar migração `server/migrations/0004-production.sql`: tabelas `productionLots`, `reservations`, `queueItems`, `printRuns`
- [X] T057 Criar migração `server/migrations/0005-stock.sql`: tabelas `materialLots`, `stockItems`, `stockMovements`, `purchaseOrders`, `purchaseOrderLines`
- [X] T058 Criar migração `server/migrations/0006-finance.sql`: tabelas `invoices`, `payments`
- [X] T059 Criar migração `server/migrations/0007-settings.sql`: tabela `farmSettings`
- [X] T060 Criar migração `server/migrations/0008-indexes.sql`: índices para consultas de dashboard e fila
- [X] T061 Criar migração `server/migrations/0009-audit.sql`: tabela `auditLogs`

**Checkpoint**: Foundation ready — user story implementation can now begin in parallel

---

## Phase 3: User Story 1 — Identificar e controlar acesso por papel (Priority: P1) 🎯 MVP

**Goal**: Identificar pessoas por e-mail e senha, e restringir cada ação a papéis: Admin, Vendas, Produção, Compras, Operador.


**Independent Test**: Login com credenciais corretas retorna token JWT. Usuário sem sessão recebe 401. Usuário com papel inadequado recebe 403 em rota protegida.

### Implementation for User Story 1

- [X] T062 [P] [US1] Implementar regra de travamento em `server/src/domain/rules/auth/rateLimit.ts`: 5 falhas seguidas → travar por 5 min; regra completa: research.md item 4
- [X] T063 [P] [US1] Implementar hash irreversível de senha em `server/src/infrastructure/auth/hash.ts`: scrypt, conforme princípio VII da constituição
- [X] T064 [P] [US1] Implementar geração/validação de JWT em `server/src/infrastructure/auth/jwt.ts`: HS256, validade 8 horas
- [X] T065 [US1] Implementar uso-caso de login em `server/src/application/use-cases/auth/login.ts`: POST /api/auth/login
- [X] T066 [US1] Implementar rota de login em `server/src/api/routes/auth/login.ts`: POST /api/auth/login, 200, 401
- [X] T067 [US1] Implementar uso-caso de criar usuário em `server/src/application/use-cases/users/createUser.ts`: POST /api/users
- [X] T068 [US1] Implementar rota de criar usuário em `server/src/api/routes/users/create.ts`: POST /api/users, 201, 400, 403
- [X] T069 [US1] Implementar uso-caso de listar usuários em `server/src/application/use-cases/users/listUsers.ts`: GET /api/users
- [X] T070 [US1] Implementar rota de listar usuários em `server/src/api/routes/users/list.ts`: GET /api/users, 200, 403

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
- [X] T090 [US1] Refinar a interface sem mudar comportamento nem API: tema em `web/src/style.css`; barra superior em `web/src/App.vue`; `web/src/pages/FilaPage.vue` com indicadores, painel da frota (estado de cada impressora, com cor sempre acompanhada de rótulo) e fila agrupada por pedido; `PedidoPage.vue` e `EntrarPage.vue` no mesmo tema; tons de estado em `web/src/labels.ts`. O selo de dados fictícios continua em toda página com exemplo

**Checkpoint**: Seção 1 do quickstart passa. Parar aqui já é um MVP demonstrável
**Independent Test**: Login com credenciais corretas retorna token JWT. Usuário sem sessão recebe 401. Usuário com papel inadequado recebe 403 em rota protegida.

### Implementation for User Story 1

- [X] T062 [P] [US1] Implementar regra de travamento em `server/src/domain/rules/auth/rateLimit.ts`: 5 falhas seguidas → travar por 5 min; regra completa: research.md item 4
- [X] T063 [P] [US1] Implementar hash irreversível de senha em `server/src/infrastructure/auth/hash.ts`: scrypt, conforme princípio VII da constituição
- [X] T064 [P] [US1] Implementar geração/validação de JWT em `server/src/infrastructure/auth/jwt.ts`: HS256, validade 8 horas
- [X] T065 [US1] Implementar uso-caso de login em `server/src/application/use-cases/auth/login.ts`: POST /api/auth/login
- [X] T066 [US1] Implementar rota de login em `server/src/api/routes/auth/login.ts`: POST /api/auth/login, 200, 401
- [X] T067 [US1] Implementar uso-caso de criar usuário em `server/src/application/use-cases/users/createUser.ts`: POST /api/users
- [X] T068 [US1] Implementar rota de criar usuário em `server/src/api/routes/users/create.ts`: POST /api/users, 201, 400, 403
- [X] T069 [US1] Implementar uso-caso de listar usuários em `server/src/application/use-cases/users/listUsers.ts`: GET /api/users
- [X] T070 [US1] Implementar rota de listar usuários em `server/src/api/routes/users/list.ts`: GET /api/users, 200, 403

**Checkpoint**: User Story 1 funcional — autenticação e controle de acesso funcionam independentemente

---

## Phase 4: User Story 2 — Cadastrar e gerenciar entidades de negócio (Priority: P1)

**Goal**: CRUD de clientes, fornecedores, cores, materiais, arquivos 3D, perfis de produção, produtos, impressoras e operadores, com regras de escrita.

**Independent Test**: Criar, listar, editar e deletar cada entidade do cadastro. Regras de validação (FR-011, printer constraints) são recusadas.

### Implementation for User Story 2

- [X] T071 [P] [US2] Regra de validação de print profile em `server/src/domain/rules/printProfile/validate.ts`: peças, minutos e gramas por prancha > 0 (FR-011)
- [X] T072 [P] [US2] Regra de validação de printer em `server/src/domain/rules/printer/validate.ts`: limite de manutenção > 0; `hourRateExcludesFilamentAndEnergy` sempre true (cadastros.md)
- [X] T073 [P] [US2] Regra de validação de product em `server/src/domain/rules/product/validate.ts`: `defaultSellPrice` ≥ 0; `offeredColors` e `offeredSizes` são listas; `isForSale` bool (cadastros.md)
- [X] T074 [P] [US2] Regra de validação de color em `server/src/domain/rules/color/validate.ts`: `hex` vazio ou `#RRGGBB` (cadastros.md)
- [X] T075 [P] [US2] Regra de validação de material em `server/src/domain/rules/material/validate.ts`: `reorderPointGrams` nulo ou ≥ 0 (cadastros.md)
- [X] T076 [P] [US2] Implementar CRUD de Customer em `server/src/application/use-cases/customers/` + rota em `server/src/api/routes/customers.ts`
- [X] T077 [P] [US2] Implementar CRUD de Supplier em `server/src/application/use-cases/suppliers/` + rota em `server/src/api/routes/suppliers.ts`
- [X] T078 [P] [US2] Implementar CRUD de Color em `server/src/application/use-cases/colors/` + rota em `server/src/api/routes/colors.ts`
- [X] T079 [P] [US2] Implementar CRUD de Material em `server/src/application/use-cases/materials/` + rota em `server/src/api/routes/materials.ts`
- [X] T080 [P] [US2] Implementar CRUD de File3d + versionamento em `server/src/application/use-cases/files3d/` + rota em `server/src/api/routes/files3d.ts` (multipart)
- [X] T081 [P] [US2] Implementar CRUD de PrintProfile em `server/src/application/use-cases/printProfiles/` + rota em `server/src/api/routes/printProfiles.ts` (educação válida não altera lotes existentes)
- [X] T082 [P] [US2] Implementar CRUD de Product em `server/src/application/use-cases/products/` + rota em `server/src/api/routes/products.ts`
- [X] T083 [US2] Implementar uso-caso de atribuir materiais compatíveis em `server/src/application/use-cases/printers/assignMaterials.ts`
- [X] T084 [US2] Implementar rota de atribuir materiais em `server/src/api/routes/printers/assignMaterials.ts`: POST /api/printers/{id}/materials
- [X] T085 [P] [US2] Implementar CRUD de Printer em `server/src/application/use-cases/printers/` + rota em `server/src/api/routes/printers.ts`
- [X] T086 [P] [US2] Implementar CRUD de Operator em `server/src/application/use-cases/operators/` + rota em `server/src/api/routes/operators.ts`

**Checkpoint**: User Story 2 funcional — todos os cadastros operam independentemente

---

## Phase 5: User Story 3 — Gerenciar orçamento e pedido (Priority: P2)

**Goal**: Criar orçamento em rascunho, enviar, aprovar, rejeitar. Gerar pedido de orçamento ou manualmente. Gerenciar status e cancelamento.

**Independent Test**: Fluxo completo: criar orçamento → enviar → aprovar → gerar pedido → confirmar. Cancelamento bem-sucedido e bloqueado funcionam conforme FR-009.

### Implementation for User Story 3

- [X] T087 [P] [US3] Regra de transição de orçamento em `server/src/domain/rules/quote/transitions.ts`: Draft → Sent, Draft/Sent → Approved, qualquer não-rejeitado → Rejected (comercial.md)
- [X] T088 [P] [US3] Regra de geração de pedido em `server/src/domain/rules/quote/generateOrder.ts`: orçamento aprovado e não vencido, data prometida obrigatória, um único pedido por orçamento
- [X] T089 [P] [US3] Regra de transição de pedido em `server/src/domain/rules/salesOrder/transitions.ts`: QuotePending → Approved/Cancelled; Cancelled imutável (comercial.md)
- [X] T090 [P] [US3] Regra de cancelamento de pedido em `server/src/domain/rules/salesOrder/cancelOrder.ts`: sem execução iniciada, sem fatura, sem pagamento; cancela lotes, fila, libera reservas uma única vez (FR-009, comercial.md)
- [X] T091 [US3] Implementar uso-cases de Quote em `server/src/application/use-cases/quotes/`: criar, enviar, aprovar, rejeitar, listar
- [X] T092 [US3] Implementar rotas de Quote em `server/src/api/routes/quotes.ts`: POST /api/quotes, POST /api/quotes/{id}/send, POST /api/quotes/{id}/approve, POST /api/quotes/{id}/reject, GET /api/quotes, GET /api/quotes/{id}
- [X] T093 [US3] Implementar uso-cases de SalesOrder em `server/src/application/use-cases/salesOrders/`: criar manualmente, de orçamento, listar, detalhar, PATCH status
- [X] T094 [US3] Implementar rotas de SalesOrder em `server/src/api/routes/salesOrders.ts`: POST /api/sales-orders, POST /api/sales-orders/from-quote/{quoteId}, GET /api/sales-orders, GET /api/sales-orders/{id}, PATCH /api/sales-orders/{id}/status

**Checkpoint**: User Story 3 funcional — orçamento e pedido operam independentemente

---

## Phase 6: User Story 4 — Gerenciar estoque e compras (Priority: P2)

**Goal**: Registrar pedidos de compra, recebimento, consultar saldo e movimentações. Sugerir recompra.

**Independent Test**: Pedido de compra → receber → saldo atualizado. Recebimento com peso zero recusado. FIFO respeitado nas reservas.

### Implementation for User Story 4

- [X] T095 [P] [US4] Regra de recebimento em `server/src/domain/rules/purchaseOrder/receive.ts`: peso > 0, FIFO para saldo, estados Draft/Sent → PartiallyReceived → Received (estoque-compras.md)
- [X] T096 [P] [US4] Regra de saldo e reserva em `server/src/domain/rules/stock/reserve.ts`: saldo insuficiente recusa inteira, sem reserva parcial (FR-012)
- [X] T097 [P] [US4] Regra de exclusão atômica de estoque em `server/src/domain/rules/stock/atomicUpdate.ts`: quantityG, CurrentWeightG, ReservedG, reservas e movimentações na mesma transação (estoque-compras.md)
- [X] T098 [P] [US4] Regra de sugestão de recompra em `server/src/domain/rules/stock/restockSuggestion.ts`: saldo livre < reorderPoint (FR-020)
- [X] T099 [US4] Implementar uso-cases de PurchaseOrder em `server/src/application/use-cases/purchaseOrders/`: criar, enviar, receber, cancelar, listar
- [X] T100 [US4] Implementar rotas de PurchaseOrder em `server/src/api/routes/purchaseOrders.ts`: POST /api/purchase-orders, POST /api/purchase-orders/{id}/send, POST /api/purchase-orders/{id}/receipts, POST /api/purchase-orders/{id}/cancel
- [X] T101 [P] [US4] Implementar uso-cases de Stock em `server/src/application/use-cases/stock/`: listar saldo, listar movimentações
- [X] T102 [US4] Implementar rotas de Stock em `server/src/api/routes/stock.ts`: GET /api/stock, GET /api/stock/movements

**Checkpoint**: User Story 4 funcional — estoque e compras operam independentemente

---

## Phase 7: User Story 5 — Produzir e gerenciar a fila (Priority: P3)

**Goal**: Liberar lotes de produção com reserva, enfileirar com impressora, gerenciar execuções (início, pausa, retomo, conclusão, falha). Gerenciar estados da impressora (retirada, preparação, manutenção).

**Independent Test**: Liberação de 10 peças com 4 por prancha gera 3 lotes. Início, pausa, conclusão e falha mudam estados corretamente. Impressora só volta a disponível após retirada + preparação.

### Implementation for User Story 5

- [X] T103 [P] [US5] Regra de liberação de lotes em `server/src/domain/rules/production/releaseLots.ts`: corte por prancha, campos released* preservados, reserva atômica FIFO, recusa se linha já liberada (FR-011, FR-012)
- [X] T104 [P] [US5] Regra de enfileiramento em `server/src/domain/rules/production/queue.ts`: impressora disponível, ativa, compatível, não ocupada (FR-013, producao.md)
- [X] T105 [P] [US5] Regra de início de execução em `server/src/domain/rules/production/startRun.ts`: validar pedido não cancelado, lote Queued, máquina Available; complementar reserva de reimpressão FIFO; remover da fila ativa (FR-013, FR-018, producao.md)
- [X] T106 [P] [US5] Regra de pausa e retomo em `server/src/domain/rules/production/pauseResume.ts`: Running ↔ Paused, acumula pausedSeconds
- [X] T107 [P] [US5] Regra de conclusão de execução em `server/src/domain/rules/production/completeRun.ts`: consumo real via reserva + saldo livre FIFO, única baixa ProductionOut, lote AwaitingPickup, impressora AwaitingPickup (FR-017, FR-024)
- [X] T108 [P] [US5] Regra de falha de execução em `server/src/domain/rules/production/failRun.ts`: material gasto obrigatório ≥ 0, consumo segue FR-017, Waste em vez de ProductionOut, reimpressão com complemento reserva FIFO (FR-018, producao.md)
- [X] T109 [P] [US5] Regra de retirada em `server/src/domain/rules/printer/pickup.ts`: AwaitingPickup → Preparing; lote vai a Completed se execução Completed; permanece Failed se falha sem reimpressão (FR-015, producao.md)
- [X] T110 [P] [US5] Regra de preparação concluída em `server/src/domain/rules/printer/preparationComplete.ts`: Available se horas < limite; InMaintenance se ≥ limite (producao.md)
- [X] T111 [P] [US5] Regra de manutenção concluída em `server/src/domain/rules/printer/maintenanceComplete.ts`: zera horas, vai a Available se sem bloqueio (producao.md)
- [X] T112 [P] [US5] Regra de status do pedido por produção em `server/src/domain/rules/salesOrder/productionStatus.ts`: InProduction, AwaitingFinishing, ReadyToShip baseados em estados dos lotes (comercial.md)
- [X] T113 [US5] Implementar uso-cases de Production em `server/src/application/use-cases/production/`: release, queue, startRun, pause, resume, complete, fail, cancelLot
- [X] T114 [US5] Implementar rotas de Production em `server/src/api/routes/production.ts`: POST /api/sales-orders/{id}/lots/release, GET /api/lots, POST /api/lots/{id}/queue, POST /api/lots/{id}/runs, POST /api/lots/{id}/cancel
- [X] T115 [US5] Implementar uso-cases de PrintRun em `server/src/application/use-cases/printRuns/`: pause, resume, complete, fail
- [X] T116 [US5] Implementar rotas de PrintRun em `server/src/api/routes/printRuns.ts`: POST /api/runs/{id}/pause, /resume, /complete, /fail
- [X] T117 [US5] Implementar uso-cases de Printer em `server/src/application/use-cases/printers/`: pickup, preparation-complete, maintenance-complete
- [X] T118 [US5] Implementar rotas de Printer em `server/src/api/routes/printers/lifecycle.ts`: POST /api/printers/{id}/pickup, /preparation-complete, /maintenance-complete

**Checkpoint**: User Story 5 funcional — produção e fila operam independentemente

---

## Phase 8: User Story 6 — Financeiro simplificado (Priority: P3)

**Goal**: Registrar faturas e pagamentos ligados a pedido confirmado. Sem emissão fiscal nem cobrança bancária.

**Independent Test**: Criar fatura e pagamento para pedido Approved. Recusa 409 para pedido QuotePending ou Cancelled.

### Implementation for User Story 6

- [X] T119 [P] [US6] Regra de criação de fatura em `server/src/domain/rules/finance/createInvoice.ts`: pedido não QuotePending nem Cancelled (financeiro.md)
- [X] T120 [P] [US6] Regra de criação de pagamento em `server/src/domain/rules/finance/createPayment.ts`: mesmo filtro de fatura, method na lista fechada (financeiro.md)
- [X] T121 [US6] Implementar uso-cases de Finance em `server/src/application/use-cases/finance/`: createInvoice, createPayment, listInvoices, listPayments
- [X] T122 [US6] Implementar rotas de Finance em `server/src/api/routes/finance.ts`: POST /api/sales-orders/{id}/invoices, GET /api/sales-orders/{id}/invoices, POST /api/sales-orders/{id}/payments, GET /api/sales-orders/{id}/payments

**Checkpoint**: User Story 6 funcional — financeiro opera independentemente

---

## Phase 9: User Story 7 — Painel e parâmetros da farm (Priority: P3)

**Goal**: Dashboard com atrasados, vencendo hoje, em produção, impressoras em impressão, consumo dos últimos 7 dias. Custo estimado com premissas explícitas. Backlog e sugestões de recompra. Parâmetros da farm configuráveis.

**Independent Test**: Dashboard retorna contadores corretos. Custo estimado com dados faltantes retorna `null` no total. Parâmetros aceitam e recusam valores inválidos.

### Implementation for User Story 7

- [X] T123 [P] [US7] Regra de custo estimado em `server/src/domain/rules/costEstimate/calculate.ts`: filamento + energia + hora-máquina; total `null` se qualquer premissa faltante (FR-023, painel.md)
- [X] T124 [P] [US7] Regra de cálculo de backlog em `server/src/domain/rules/backlog/calculate.ts`: horas pendentes distribuídas em paralelo no calendário, respeitando compatibilidade (painel.md)
- [X] T125 [P] [US7] Regra de consumo dos últimos 7 dias em `server/src/domain/rules/dashboard/consumption.ts`: soma ProductionOut + Waste, uma única vez por detalhe de printRunId (FR-022)
- [X] T126 [P] [US7] Regra de validação de farm settings em `server/src/domain/rules/settings/validate.ts`: `energyTariffPerKwhCents` nulo ou ≥ 0; `workDays` 1-7; `timeZone` IANA; `examplesAreFictional` não false nesta feature (painel.md)
- [X] T127 [US7] Implementar uso-cases de Dashboard em `server/src/application/use-cases/dashboard/`: overview, backlog, restockSuggestions, costEstimate
- [X] T128 [US7] Implementar rotas de Dashboard em `server/src/api/routes/dashboard.ts`: GET /api/dashboard, GET /api/dashboard/backlog, GET /api/dashboard/restock-suggestions, GET /api/lots/{id}/cost-estimate
- [X] T129 [US7] Implementar uso-case de farm settings em `server/src/application/use-cases/settings/update.ts`: PUT /api/settings
- [X] T130 [US7] Implementar rota de farm settings em `server/src/api/routes/settings.ts`: PUT /api/settings

**Checkpoint**: User Story 7 funcional — painel e parâmetros operam independentemente

---

## Phase 10: User Story 8 — Auditar quem mudou o estado (Priority: P4)

**Goal**: Registrar com trilha toda mudança de estado de orçamento, pedido, lote e impressora, com autor, momento e estados. Movimentações de estoque como registros, não saldos.

**Independent Test**: Confirmar pedido, liberar lote e concluir retirada aparecem na trilha. Acesso sem papel Admin/Production é recusado.

### Implementation for User Story 8

- [X] T131 [P] [US8] Regra de registro de trilha em `server/src/domain/rules/audit/writeTrail.ts`: entidade, ação, usuário, momento, estado anterior, estado novo (FR-024)
- [X] T132 [US8] Implementar uso-case de leitura de audit log em `server/src/application/use-cases/audit/getAuditTrail.ts`: GET /api/audit?entity=&id=
- [X] T133 [US8] Implementar rota de audit log em `server/src/api/routes/audit.ts`: GET /api/audit, 403 para demais papéis

### Cross-cutting audit wiring

- [X] T134 [US8] Injetar middleware de auditoria em transições de Quote (US3)
- [X] T135 [US8] Injetar middleware de auditoria em transições de SalesOrder (US3)
- [X] T136 [US8] Injetar middleware de auditoria em transições de ProductionLot (US5)
- [X] T137 [US8] Injetar middleware de auditoria em transições de Printer (US5)
- [X] T138 [US8] Injetar middleware de auditoria em StockMovements (US4)

**Checkpoint**: User Story 8 funcional — trilha registra mudanças independentemente

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T139 [P] Implementar seed de dados de desenvolvimento em `server/src/infrastructure/seed/`: admin, sales, production, purchasing, operator
- [X] T140 [P] Implementar job de expiração de orçamento em `server/src/infrastructure/jobs/expireQuotes.ts`: FR-007, processamento periódico
- [X] T141 [P] Implementar job de sugestão de recompra em `server/src/infrastructure/jobs/restockSuggestions.ts`: FR-020
- [X] T142 [P] Tests de arquitetura em `server/tests/architecture/`: verificar que `domain/` não importa de fora (princípio I)
- [X] T143 [P] Tests de domínio em `server/tests/domain/`: cada regra de domínio com teste que falha antes da implementação (princípio II)
- [X] T144 [P] Tests de aplicação em `server/tests/application/`: orquestração transacional por use-case
- [X] T145 [P] Tests de infraestrutura em `server/tests/infrastructure/`: banco real SQLite, rollback, disputa por saldo (research.md item 13)
- [X] T146 [P] Tests de API em `server/tests/api/`: contratos de cada rota, 401, 403, 409 com códigos estáveis
- [X] T147 [P] Teste vermelho para cada regra de domínio antes de implementá-la (princípio II)
- [X] T148 [P] Rota guard de SPA em `web/src/router/guards.ts`: autenticação e papel
- [X] T149 Executar `quickstart.md` validation — todos os roteiros passam
- [X] T150 Run `npm run typecheck` e `npm test` suíte inteira verde antes de fechar a feature

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3–10)**: All depend on Foundational phase completion
  - US1 e US2 são P1 e podem ser MVP com US1; US2 adiciona cadastros completos
  - User stories podem prosseguir em paralelo (se equipadas) ou sequencialmente por prioridade (P1 → P2 → P3 → P4)
- **Polish (Phase N)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1) — Identificar e controlar acesso**: Depends only on Foundational (Phase 2). MVP — sem login, nada opera.
- **US2 (P1) — Cadastrar entidades**: Depends only on Foundational (Phase 2). Necessária antes de US3 (precisa de produtos, clientes, etc.).
- **US3 (P2) — Orçamento e pedido**: Depends on US1 and US2.
- **US4 (P2) — Estoque e compras**: Depends on US1 and US2. Independente do comercial.
- **US5 (P3) — Produção e fila**: Depends on US1, US2, US3, US4.
- **US6 (P3) — Financeiro**: Depends on US1, US2, US3.
- **US7 (P3) — Painel**: Depends on US1, US2, US3, US4, US5.
- **US8 (P4) — Trilha**: Infraestrutura de auditoria em Foundational; endpoints nesta fase; wiring com US2–US5.

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

### Within User Stories, Parallel Task Clusters

- **US1**: T062–T064 (domínio auth) → T065–T070 (aplicação + rotas)
- **US2**: T071–T075 (regras) → T076–T086 (CRUDs), grupos de [P] independentes por entidade
- **US3**: T087–T090 (regras) → T091–T094 (use-cases + rotas)
- **US4**: T095–T098 (regras) → T099–T102 (use-cases + rotas), T101 [P] independente
- **US5**: T103–T112 (regras de domínio) → T113–T118 (use-cases + rotas)
- **US6**: T119–T120 (regras) → T121–T122 (use-cases + rotas)
- **US7**: T123–T126 (regras) → T127–T130 (use-cases + rotas)
- **US8**: T131–T133 (auditoria) → T134–T138 (wiring cross-cutting)

## Parallel Example: User Story 5

```bash
# Launch all domain rules for User Story 5 together:
Task: "Regra de liberação de lotes (T103)"
Task: "Regra de enfileiramento (T104)"
Task: "Regra de início de execução (T105)"
Task: "Regra de conclusão (T107)"
Task: "Regra de falha (T108)"

# Launch all use-cases for User Story 5 together after rules:
Task: "Use-cases de produção (T113)"
Task: "Use-cases de printRun (T115)"
Task: "Use-cases de printer (T117)"
```
## Implementation Strategy


## Parallel Example: User Story 5

```bash
# Launch all domain rules for User Story 5 together:
Task: "Regra de liberação de lotes (T103)"
Task: "Regra de enfileiramento (T104)"
Task: "Regra de início de execução (T105)"
Task: "Regra de conclusão (T107)"
Task: "Regra de falha (T108)"

# Launch all use-cases for User Story 5 together after rules:
Task: "Use-cases de produção (T113)"
Task: "Use-cases de printRun (T115)"
Task: "Use-cases de printer (T117)"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: US1 — Identificar e controlar acesso
4. Complete Phase 4: US2 — Cadastrar entidades
5. **STOP and VALIDATE**: Login + cadastro funcional e testável independentemente
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add US1 → Test independently → Deploy/Demo (MVP: autenticação)
3. Add US2 → Test independently → Deploy/Demo (MVP: cadastros)
4. Add US3 → Test independently → Deploy/Demo (MVP: comercial)
5. Add US4 → Test independently → Deploy/Demo (MVP: estoque/compras)
6. Add US5 → Test independently → Deploy/Demo (MVP: produção)
7. Add US6 → Test independently → Deploy/Demo (MVP: financeiro)
8. Add US7 → Test independently → Deploy/Demo (MVP: painel)
9. Add US8 → Test independently → Deploy/Demo (MVP: auditoria)
10. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 + US2 (P1, foundational behavior)
   - Developer B: US3 + US4 (P2, core business flow)
   - Developer C: US5 (P3, production workflow)
   - Developer D: US6 + US7 (P3, financial + dashboard)
   - Developer E: US8 (P4, cross-cutting audit)
3. Stories complete and integrate independently

---

## Task Summary

| Phase | Story | Tasks | Count |
|-------|-------|-------|-------|
| Phase 1 | Setup | T001–T011 | 11 |
| Phase 2 | Foundational | T012–T061 | 50 |
| Phase 3 | US1 — Identificar e controlar acesso por papel | T062–T070 | 9 |
| Phase 4 | US2 — Cadastrar e gerenciar entidades | T071–T086 | 16 |
| Phase 5 | US3 — Gerenciar orçamento e pedido | T087–T094 | 8 |
| Phase 6 | US4 — Gerenciar estoque e compras | T095–T102 | 8 |
| Phase 7 | US5 — Produzir e gerenciar a fila | T103–T118 | 16 |
| Phase 8 | US6 — Financeiro simplificado | T119–T122 | 4 |
| Phase 9 | US7 — Painel e parâmetros da farm | T123–T130 | 8 |
| Phase 10 | US8 — Auditar quem mudou o estado | T131–T138 | 8 |
| Phase N | Polish & Cross-Cutting | T139–T150 | 12 |
| **Total** | | | **150** |

### Story Coverage

| User Story | Priority | FRs Covered | Contracts |
|------------|----------|-------------|-----------|
| US1 | P1 | FR-001, FR-002 | auth.md |
| US2 | P1 | FR-003, FR-004, FR-005 | cadastros.md |
| US3 | P2 | FR-006, FR-007, FR-008, FR-009, FR-010 | comercial.md |
| US4 | P2 | FR-012, FR-017, FR-018, FR-019, FR-020, FR-024 | estoque-compras.md |
| US5 | P3 | FR-011, FR-013, FR-014, FR-015, FR-016, FR-017, FR-018 | producao.md |
| US6 | P3 | FR-009, FR-021 | financeiro.md |
| US7 | P3 | FR-022, FR-023, FR-025, SC-001 a SC-008 | painel.md |
| US8 | P4 | FR-024 | painel.md (audit) |

### MVP Scope

O MVP é **US1 + US2** (autenticação + cadastros), que corresponde a **66 tarefas** (T001–T086). Para um demo operacional completo com fluxo de negócio, o MVP estendido inclui **US1–US3** (autenticação + cadastros + comercial), totalizando **94 tarefas** (T001–T094).

---

## Notes


- [P] tasks = different files, no dependencies
- Story label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- **Identifiers never change**: FR-nnn, SC-nnn, Tnnn, story numbers, and principle numbers MUST NOT be renumbered or reused (Constitution rule 4)
- **Names come from source**: entity names, field names, enum values, routes and roles MUST be copied from `data-model.md` and `contracts/` (Constitution rule 5)
- **Don't guess**: missing rules, numbers, limits or behaviors MUST become `[NEEDS CLARIFICATION: question]` in the owning artifact (Constitution rule 6)

