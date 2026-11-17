---
description: "Task list for the Farm 3D reimplementation of the PrintFarm core"
---

# Tasks: Reimplementar o núcleo da farm

**Input**: Design documents from `/specs/001-reimplementar-printfarm/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Entram nas regras de domínio. O princípio II da constituição exige o teste vermelho antes da regra. Jornada de tela fica em `specs/001-reimplementar-printfarm/quickstart.md`. Vitest cobre só o guarda de rota.

**Organization**: Uma fase por história, na ordem de prioridade da spec. A história 1 é o MVP e usa semente; não espera as telas de cadastro da história 2.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (outro arquivo, sem depender de tarefa incompleta)
- **[Story]**: história da spec (US1…US8)
- Setup, fundação e polimento não levam história

## Path Conventions

- API e domínio: `src/Farm3d.*`
- SPA: `web/src/`
- Contratos: `specs/001-reimplementar-printfarm/contracts/`
- Regras citadas entre aspas vêm de `specs/001-reimplementar-printfarm/data-model.md`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Solução, SPA e compose, sem regra de negócio

- [ ] T001 Criar `Farm3d.sln` e os projetos `src/Farm3d.Domain/Farm3d.Domain.csproj`, `src/Farm3d.Application/Farm3d.Application.csproj`, `src/Farm3d.Infrastructure/Farm3d.Infrastructure.csproj`, `src/Farm3d.Api/Farm3d.Api.csproj` e `src/Farm3d.Tests/Farm3d.Tests.csproj` em `net8.0`, com referências Domain ← Application ← Infrastructure ← Api e Tests referenciando Domain, Application e Infrastructure. Domain sem pacote de EF, HTTP ou UI
- [ ] T002 [P] Criar `src/Directory.Build.props` com `Nullable` enable e `ImplicitUsings` enable
- [ ] T003 [P] Criar a SPA em `web/` (Vue 3, Vite, TypeScript, Vue Router, Vitest) com scripts `dev`, `test` e `build` em `web/package.json`
- [ ] T004 [P] Criar `docker-compose.yml` com o serviço `sql` (SQL Server 2022, porta 1433, senha só pela variável `MSSQL_SA_PASSWORD`) e `.env.example` listando `MSSQL_SA_PASSWORD`, `Jwt__SigningKey` e `FARM3D_SEED_PASSWORD`. Ignorar `.env` e `data/files3d/` no `.gitignore`
- [ ] T005 [P] Criar `.editorconfig` na raiz com indentação de 4 espaços para C# e 2 para `web/**/*.vue`
- [ ] T006 Criar `src/Farm3d.Api/appsettings.json` sem segredo e documentar em `.env.example` as chaves `ConnectionStrings__Farm3d` e `Jwt__SigningKey`. A API escuta `http://localhost:5088`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Identidade, banco, casca da SPA e o job horário vazio

**⚠️ CRITICAL**: Nenhuma história começa antes desta fase

- [ ] T007 Escrever `src/Farm3d.Tests/Domain/DomainPurityTests.cs` lendo `src/Farm3d.Domain/Farm3d.Domain.csproj` e falhando se o texto contiver `EntityFramework`, `AspNetCore` ou `Vue`. Rodar e ver falhar só se a referência proibida existir; com o csproj de T001 o teste passa
- [ ] T008 [P] Criar um arquivo por enum em `src/Farm3d.Domain/Enums/` com os valores exatos da tabela Enums de `specs/001-reimplementar-printfarm/data-model.md` (`AppRole`, `MaterialKind`, `QuoteStatus`, `CommercialOrderStatus`, `ProductionLotStatus`, `PrinterOperationalStatus`, `PrintRunStatus`, `PrintFailureReason`, `PurchaseOrderStatus`, `StockMovementKind`, `PaymentMethod`)
- [ ] T009 [P] Criar `src/Farm3d.Domain/Entities/FarmSettings.cs` com `EnergyTariffPerKwh` opcional, `CalendarSummary` padrão `"segunda a sexta, 08:00–18:00"`, `WorkDays` segunda a sexta, `WorkStart` 08:00, `WorkEnd` 18:00 e `ExamplesAreFictional` verdadeiro sem caminho no domínio para gravar falso
- [ ] T010 Criar `src/Farm3d.Infrastructure/Persistence/Farm3dDbContext.cs` com `FarmSettings` e Identity, e a migration inicial em `src/Farm3d.Infrastructure/Persistence/Migrations/`
- [ ] T011 Implementar `src/Farm3d.Infrastructure/Identity/IdentitySeed.cs` com os papéis Admin, Sales, Production, Purchasing e Operator e os cinco e-mails de `specs/001-reimplementar-printfarm/quickstart.md`. A senha só é lida de `FARM3D_SEED_PASSWORD` quando o ambiente é Development
- [ ] T012 Implementar `POST /api/auth/login` em `src/Farm3d.Api/Controllers/AuthController.cs` conforme `specs/001-reimplementar-printfarm/contracts/auth.md`, com travamento de login e 401 genérico
- [ ] T013 Em `src/Farm3d.Api/Program.cs`, registrar JWT Bearer, Problem Details, CORS permissivo só em Development e a semente de T011
- [ ] T014 Escrever primeiro `web/tests/route-guard.spec.ts` exigindo que visita a `/fila` sem sessão caia em `/entrar`. Depois implementar `web/src/router/index.ts` e `web/src/stores/session.ts` até o teste passar
- [ ] T015 Criar `src/Farm3d.Infrastructure/Jobs/HourlyFarmJob.cs` como hosted service de uma hora, sem efeito ainda, e registrá-lo em `src/Farm3d.Api/Program.cs`

**Checkpoint**: Login devolve token, a SPA desvia quem não entrou, `dotnet test` e `npm test` verdes

---

## Phase 3: User Story 1 - Pedido aprovado vira lotes na fila (Priority: P1) 🎯 MVP

**Goal**: 10 peças com 4 por prancha viram 3 lotes na fila, com reserva integral e recusa de impressora incompatível

**Independent Test**: Seção 1 de `specs/001-reimplementar-printfarm/quickstart.md`

### Tests for User Story 1

- [ ] T016 [P] [US1] Escrever `src/Farm3d.Tests/Domain/LotSplitTests.cs` falhando: 10 peças e 4 por prancha produzem 3 lotes; o último com metade do tempo e metade do material. Regra: "10 peças com 4 por prancha produzem 3 lotes, o último com metade do tempo e metade do material."
- [ ] T017 [P] [US1] Escrever `src/Farm3d.Tests/Domain/FifoReservationTests.cs` falhando: o lote de material mais antigo é alocado primeiro; saldo que não cobre devolve alocação vazia. Regra: "Saldo insuficiente recusa a liberação inteira, sem reserva parcial."
- [ ] T018 [P] [US1] Escrever `src/Farm3d.Tests/Domain/PrinterCompatibilityTests.cs` falhando: lista que não contém o material recusa; lista vazia aceita; impressora inativa ou ocupada recusa

### Implementation for User Story 1

- [ ] T019 [P] [US1] Criar as entidades de catálogo e máquina usadas na liberação em `src/Farm3d.Domain/Entities/Color.cs`, `Product.cs`, `PrintProfile.cs`, `Printer.cs` e `PrinterMaterial.cs`. Perfil: "Peças por prancha, minutos por prancha e gramas por prancha, todos maiores que zero."
- [ ] T020 [P] [US1] Criar `src/Farm3d.Domain/Entities/Material.cs`, `MaterialLot.cs`, `StockItem.cs` e `StockMovement.cs`. Saldo: `ReservedG` ≤ `QuantityG`. Livre = `QuantityG` − `ReservedG`
- [ ] T021 [P] [US1] Criar `src/Farm3d.Domain/Entities/Customer.cs`, `SalesOrder.cs`, `OrderLine.cs`, `ProductionLot.cs`, `ProductionMaterialReservation.cs` e `PrintQueueItem.cs`
- [ ] T022 [US1] Implementar `src/Farm3d.Domain/Rules/LotSplit.cs` até `LotSplitTests` passar
- [ ] T023 [US1] Implementar `src/Farm3d.Domain/Rules/FifoReservation.cs` até `FifoReservationTests` passar. Desempate por `Id` depois de `ReceivedAt`
- [ ] T024 [US1] Implementar `src/Farm3d.Domain/Rules/PrinterCompatibility.cs` até `PrinterCompatibilityTests` passar
- [ ] T025 [US1] Mapear as entidades de T019–T021 em `src/Farm3d.Infrastructure/Persistence/Farm3dDbContext.cs` e adicionar a migration `ProductionLots`
- [ ] T026 [US1] Implementar `src/Farm3d.Application/UseCases/ReleaseLots.cs` numa transação: corta a linha, reserva por `FifoReservation` e, se qualquer lote não couber, não grava reserva. Recusa pedido `QuotePending` ou `Cancelled`. Recusa repetir linha já reservada. Regra: "Repetir a liberação já reservada é recusado."
- [ ] T027 [US1] Escrever `src/Farm3d.Tests/Stock/ReleaseLotsTests.cs` com EF InMemory cobrindo saldo insuficiente (zero linhas reservadas), repetição e o cenário 10/4, e só então ajustar `ReleaseLots` se o teste ainda falhar
- [ ] T028 [US1] Implementar `src/Farm3d.Application/UseCases/EnqueueLot.cs` usando `PrinterCompatibility`
- [ ] T029 [US1] Expor `POST /api/sales-orders/{id}/lots/release` e `POST /api/lots/{id}/queue` em `src/Farm3d.Api/Controllers/LotsController.cs` conforme `specs/001-reimplementar-printfarm/contracts/producao.md`, papéis Production e Admin
- [ ] T030 [US1] Criar `src/Farm3d.Infrastructure/Identity/DemoSeed.cs` com o modelo "Suporte demo (fictício)", 4 peças, 60 min e 40 g por prancha, dois lotes de material e as impressoras "Mesa A" e "Mesa B" descritas na seção 1 de `quickstart.md`. Não rodar fora de Development
- [ ] T031 [US1] Criar `web/src/pages/PedidoPage.vue` e `web/src/pages/FilaPage.vue` para confirmar o pedido semeado, liberar e mostrar os 3 lotes com a marca de dado fictício

**Checkpoint**: Seção 1 do quickstart passa. Parar aqui já é um MVP demonstrável

---

## Phase 4: User Story 2 - Manter a base da operação (Priority: P2)

**Goal**: Cada papel grava só o seu cadastro, impressora sem limite é recusada, admin cria usuário

**Independent Test**: Seção 2 de `specs/001-reimplementar-printfarm/quickstart.md`

### Tests for User Story 2

- [ ] T032 [P] [US2] Escrever `src/Farm3d.Tests/Domain/MasterDataRulesTests.cs` falhando quando o limite de manutenção é zero ou ausente e quando peças por prancha são menores que 1. Regras: "Limite de horas de manutenção maior que zero." e "Peças por prancha, minutos por prancha e gramas por prancha, todos maiores que zero."

### Implementation for User Story 2

- [ ] T033 [US2] Fazer `Printer` e `PrintProfile` recusarem esses valores em `src/Farm3d.Domain/Entities/Printer.cs` e `PrintProfile.cs` até `MasterDataRulesTests` passar. `HourRateExcludesFilamentAndEnergy` permanece verdadeiro. Frase fixa: "A taxa de hora-máquina não inclui filamento nem energia."
- [ ] T034 [P] [US2] Criar `src/Farm3d.Domain/Entities/Supplier.cs`, `Operator.cs`, `File3D.cs` e `File3DVersion.cs` e mapeá-los em `src/Farm3d.Infrastructure/Persistence/Farm3dDbContext.cs` com a migration `Masters`
- [ ] T035 [US2] Implementar os controllers de `specs/001-reimplementar-printfarm/contracts/cadastros.md` em `src/Farm3d.Api/Controllers/` (`CustomersController`, `SuppliersController`, `ColorsController`, `MaterialsController`, `Files3DController`, `PrintProfilesController`, `ProductsController`, `PrintersController`, `OperatorsController`), com a matriz de papéis daquele contrato e `hex` só vazio ou `#RRGGBB`
- [ ] T036 [US2] Implementar `POST /api/users` e `GET /api/users` em `src/Farm3d.Api/Controllers/UsersController.cs` conforme `specs/001-reimplementar-printfarm/contracts/auth.md`. Produção não cria usuário
- [ ] T037 [US2] Guardar o binário da versão do arquivo 3D sob `data/files3d/` e só o caminho relativo em `File3DVersion.StoragePath`, no `Files3DController`
- [ ] T038 [US2] Criar as páginas em `web/src/pages/cadastros/` para cliente, modelo, impressora e operador, escondendo a ação quando o papel da sessão não é o da escrita

**Checkpoint**: Seção 2 do quickstart passa sem usar só a semente

---

## Phase 5: User Story 3 - Orçamento vira no máximo um pedido (Priority: P2)

**Goal**: Enviar, aprovar, rejeitar, expirar e gerar um único pedido

**Independent Test**: Seção 3 de `specs/001-reimplementar-printfarm/quickstart.md`

### Tests for User Story 3

- [ ] T039 [P] [US3] Escrever `src/Farm3d.Tests/Domain/QuoteStateTests.cs` falhando nas transições ilegais e passando nas legais da seção Comercial de `data-model.md`. Incluir: validade vencida em Draft, Sent ou Approved vai a Expired; Rejected e OrderGenerated não expiram. Regra: "Rejeitado e pedido gerado não são expirados."

### Implementation for User Story 3

- [ ] T040 [US3] Criar `src/Farm3d.Domain/Entities/Quote.cs` e `QuoteLine.cs` e `src/Farm3d.Domain/Rules/QuoteState.cs` até `QuoteStateTests` passar. Subtotal quantizado ao centavo, metade para cima
- [ ] T041 [US3] Implementar `src/Farm3d.Application/UseCases/QuoteLifecycle.cs` e `CreateOrderFromQuote.cs`: geração exige Approved, validade não vencida e `promisedDate`; segunda geração recusada; motivo de rejeição acrescentado a Notes como `Rejeição: …`
- [ ] T042 [US3] Mapear Quote na migration `Quotes` em `src/Farm3d.Infrastructure/Persistence/Migrations/`
- [ ] T043 [US3] Implementar os endpoints de `specs/001-reimplementar-printfarm/contracts/comercial.md` em `src/Farm3d.Api/Controllers/QuotesController.cs` e `SalesOrdersController.cs`, inclusive pedido manual em QuotePending e `PATCH` que não sai de Cancelled
- [ ] T044 [US3] Em `src/Farm3d.Infrastructure/Jobs/HourlyFarmJob.cs`, expirar orçamentos elegíveis usando `QuoteState`. Orçamento sem `ValidUntil` não expira
- [ ] T045 [US3] Criar `web/src/pages/OrcamentosPage.vue` com a composição da linha (modelo, material, quantidade, subtotal) e a ação de gerar pedido

**Checkpoint**: Seção 3 do quickstart passa. História 1 continua verde

---

## Phase 6: User Story 4 - Compra entra em lote de material (Priority: P2)

**Goal**: Receber quilos em gramas, formar lote de material e sugerir recompra abaixo do ponto

**Independent Test**: Seção 4 de `specs/001-reimplementar-printfarm/quickstart.md`

### Tests for User Story 4

- [ ] T046 [P] [US4] Escrever `src/Farm3d.Tests/Domain/ReceiptMathTests.cs` falhando: peso ≤ 0 é recusado; 1 kg pedido completa com 1000 g; custo por grama = preço do quilo / 1000; recebimento acima do pedido é recusado. Regra: "Recebimento com peso zero ou negativo é recusado."

### Implementation for User Story 4

- [ ] T047 [US4] Criar `src/Farm3d.Domain/Entities/PurchaseOrder.cs`, `PurchaseOrderLine.cs`, `PurchaseReceipt.cs` e `PurchaseReceiptLine.cs` e `src/Farm3d.Domain/Rules/ReceiptMath.cs` até o teste passar
- [ ] T048 [US4] Implementar `src/Farm3d.Application/UseCases/ReceivePurchase.cs` criando `MaterialLot`, `StockItem` e `StockMovement` `PurchaseIn` na mesma transação, e o estado PartiallyReceived ou Received
- [ ] T049 [US4] Migration `Purchasing` e endpoints de `specs/001-reimplementar-printfarm/contracts/estoque-compras.md` em `src/Farm3d.Api/Controllers/PurchaseOrdersController.cs` e `StockController.cs`
- [ ] T050 [US4] Em `HourlyFarmJob`, gravar `RestockSuggestion` só quando `ReorderPointGrams` não é nulo e o livre está abaixo. `SuggestedOrderGrams` = ponto − livre, mínimo zero
- [ ] T051 [US4] Criar `web/src/pages/ComprasPage.vue` e `web/src/pages/EstoquePage.vue` mostrando livre, reservado e o código do lote de material

**Checkpoint**: Seção 4 do quickstart passa. A reserva da história 1 passa a usar lote recebido de verdade

---

## Phase 7: User Story 5 - Executar sem liberar a máquina cedo (Priority: P3)

**Goal**: Concluir a impressão não devolve a máquina a disponível. Retirada, preparação, manutenção, falha e reimpressão seguem as duas máquinas de estado

**Independent Test**: Seção 5 de `specs/001-reimplementar-printfarm/quickstart.md`

### Tests for User Story 5

- [ ] T052 [P] [US5] Escrever `src/Farm3d.Tests/Domain/PrinterStateTests.cs` falhando nas transições da seção "Transições da impressora" de `data-model.md`. Incluir: pausa não muda a impressora; horas acumuladas ≥ limite no fim da preparação levam a InMaintenance; nota vazia recusa a confirmação da manutenção
- [ ] T053 [P] [US5] Escrever `src/Farm3d.Tests/Domain/LotStateTests.cs` falhando: falha sem reimpressão vai a Failed; falha com reimpressão volta a Queued; segunda conclusão é ilegal; confirmar retirada após execução concluída vai a Completed e após falha não muda o lote

### Implementation for User Story 5

- [ ] T054 [US5] Criar `src/Farm3d.Domain/Entities/PrintRun.cs` e as regras `src/Farm3d.Domain/Rules/PrinterState.cs` e `LotState.cs` até os dois testes passarem
- [ ] T055 [US5] Implementar `src/Farm3d.Application/UseCases/RunExecution.cs`: uma `ProductionOut` na conclusão com `actualMaterialG` > 0; segunda conclusão não grava movimento; falha sem reimpressão faz `Unreserve` do restante; falha com reimpressão mantém a reserva e cria `PrintRun` Planned com `ReprintOfPrintRunId`. Motivos só os de `PrintFailureReason`
- [ ] T056 [US5] Escrever `src/Farm3d.Tests/Stock/RunExecutionTests.cs` com InMemory para a saída única e para a devolução da reserva, antes de considerar T055 pronto
- [ ] T057 [US5] Migration `Runs` e os endpoints de execução, retirada, preparação, manutenção e falha em `src/Farm3d.Api/Controllers/RunsController.cs` e no `PrintersController`, conforme `specs/001-reimplementar-printfarm/contracts/producao.md`
- [ ] T058 [US5] Criar `web/src/pages/ExecucaoPage.vue` com iniciar, pausar, concluir, falhar, retirada e preparação, mostrando o estado do lote e o da impressora em campos separados

**Checkpoint**: Seção 5 do quickstart passa. Máquina disponível só depois da preparação, e não com manutenção vencida

---

## Phase 8: User Story 6 - Registrar fatura e pagamento do pedido (Priority: P3)

**Goal**: Lançar fatura e pagamento sem nota fiscal e sem cobrança

**Independent Test**: Seção 6 de `specs/001-reimplementar-printfarm/quickstart.md`

### Tests for User Story 6

- [ ] T059 [P] [US6] Escrever `src/Farm3d.Tests/Domain/BillingGuardTests.cs` falhando: pedido QuotePending ou Cancelled não aceita fatura nem pagamento; amount ≤ 0 é recusado. Regra: "Pedido em confirmação pendente não gera lote de produção, fatura nem pagamento."

### Implementation for User Story 6

- [ ] T060 [US6] Criar `src/Farm3d.Domain/Entities/Invoice.cs` e `Payment.cs` e `src/Farm3d.Domain/Rules/BillingGuard.cs` até o teste passar. `PaymentMethod` só Cash, Card, Pix, BankTransfer, Other
- [ ] T061 [US6] Migration `Billing` e endpoints de `specs/001-reimplementar-printfarm/contracts/financeiro.md` em `src/Farm3d.Api/Controllers/InvoicesController.cs` e `PaymentsController.cs`. Não criar recurso de nota fiscal
- [ ] T062 [US6] Criar `web/src/pages/FinanceiroPage.vue` com os lançamentos do pedido e sem ação de nota ou boleto

**Checkpoint**: Seção 6 do quickstart passa

---

## Phase 9: User Story 7 - Ver prazo, custo e carga com a premissa (Priority: P3)

**Goal**: Painel com atraso, máquinas em impressão, custo com parcelas e total vazio se falta premissa

**Independent Test**: Seção 7 de `specs/001-reimplementar-printfarm/quickstart.md`

### Tests for User Story 7

- [ ] T063 [P] [US7] Escrever `src/Farm3d.Tests/Domain/CostEstimateTests.cs` falhando: total = filamento + energia + hora-máquina só quando tarifa, preço por grama, energia por hora e taxa existem; senão `total` é nulo e `missingPremises` lista o que falta. A frase do resultado é "A taxa de hora-máquina não inclui filamento nem energia."
- [ ] T064 [P] [US7] Escrever `src/Farm3d.Tests/Domain/BacklogForecastTests.cs` falhando: atraso é data prometida anterior a hoje com lote em aberto; máquina AwaitingPickup não conta como em impressão; aproximação de máquinas equivalentes só com a frase de capacidades equivalentes

### Implementation for User Story 7

- [ ] T065 [US7] Implementar `src/Farm3d.Domain/Rules/CostEstimate.cs` e `BacklogForecast.cs` até os testes passarem
- [ ] T066 [US7] Criar `src/Farm3d.Domain/Entities/DeadlineAlert.cs` e `RestockSuggestion.cs` (se a sugestão ainda não tiver entidade vinda de T050) e gravar `DeadlineAlert` em `HourlyFarmJob`
- [ ] T067 [US7] Implementar `GET /api/dashboard`, `GET /api/lots/{id}/cost-estimate`, `GET /api/dashboard/backlog`, `GET /api/dashboard/restock-suggestions` e `PUT /api/settings` em `src/Farm3d.Api/Controllers/DashboardController.cs` e `SettingsController.cs` conforme `specs/001-reimplementar-printfarm/contracts/painel.md`. `examplesAreFictional: false` responde 400
- [ ] T068 [US7] Criar `web/src/pages/PainelPage.vue` mostrando os contadores, a conta do custo, a premissa ausente e a marca de dado fictício em todo número de exemplo

**Checkpoint**: Seção 7 do quickstart passa

---

## Phase 10: User Story 8 - Auditar quem mudou o estado (Priority: P4)

**Goal**: Trilha com autor e estados, leitura só para Admin e Production

**Independent Test**: Seção 8 de `specs/001-reimplementar-printfarm/quickstart.md`

### Tests for User Story 8

- [ ] T069 [P] [US8] Escrever `src/Farm3d.Tests/Stock/AuditTests.cs` falhando: liberar um lote grava trilha com estado anterior, estado novo e usuário. Regra: "Trilha guarda entidade, ação, usuário, momento, estado anterior e estado novo."

### Implementation for User Story 8

- [ ] T070 [US8] Criar `src/Farm3d.Domain/Entities/AuditLog.cs` e `src/Farm3d.Application/UseCases/AuditWriter.cs`, e chamá-lo nas mudanças de estado de orçamento, pedido, lote e impressora já implementadas
- [ ] T071 [US8] Migration `Audit` e `GET /api/audit` em `src/Farm3d.Api/Controllers/AuditController.cs` conforme `specs/001-reimplementar-printfarm/contracts/painel.md`. Sales, Purchasing e Operator recebem 403
- [ ] T072 [US8] Garantir em `ReceivePurchase` e `RunExecution` que a movimentação persiste kind, quantityG, unitCost e a origem. Regra: "Movimentação guarda tipo, gramas, custo unitário e origem."

**Checkpoint**: Seção 8 do quickstart passa

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Fechar a prova e a leitura de quem chega agora

- [ ] T072.5 [US6] Verificar ausência de módulos fora do escopo: buscar em todo o código referências a NF-e, nota fiscal eletrônica, boleto, gateway de pagamento, cotação de frete, telemetria de impressora, otimização automática da fila, assistente de conversa, Hangfire ou SDK de impressora. Nenhum resultado é esperado; qualquer achado é um bloqueio para T073
- [ ] T073 [P] Atualizar `README.md` na raiz com o arranque de `specs/001-reimplementar-printfarm/quickstart.md` e a frase de que `docs_apoio/software_ref` não é código deste produto
- [ ] T074 [P] Revisar `web/src/pages/` para que preço de venda e custo estimado não compartilhem o mesmo rótulo
- [ ] T075 Rodar `dotnet test src/Farm3d.Tests/Farm3d.Tests.csproj` e `npm test` em `web/`, e executar a seção 1 de `quickstart.md` antes de chamar o MVP de pronto

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: começa imediato
- **Foundational (Phase 2)**: depende do Setup e bloqueia todas as histórias
- **US1 (Phase 3)**: depende da fundação. Não depende das outras histórias
- **US2 (Phase 4)**: depende da fundação. Pode seguir em paralelo com US1 no domínio, mas as telas de cadastro usam o mesmo `web/src/router/index.ts` — nesse arquivo, uma história de cada vez
- **US3 (Phase 5)**: depende da fundação e das entidades de pedido da US1 (`SalesOrder`, `OrderLine`)
- **US4 (Phase 6)**: depende da fundação e de `Material` / `MaterialLot` da US1
- **US5 (Phase 7)**: depende da US1 (lote na fila e reserva)
- **US6 (Phase 8)**: depende da US1 para o pedido confirmado; a guarda de QuotePending já existe no caso de uso da US3
- **US7 (Phase 9)**: depende de US1 e US5 para máquinas em impressão e de US4 para a sugestão já gravada
- **US8 (Phase 10)**: depende dos casos de uso cujas transições vai registrar (US1, US3, US5)
- **Polish**: depois das histórias que a entrega decidiu incluir

### User Story Dependencies

- **US1**: só a fundação. MVP
- **US2**: fundação. Independente da US1 na prova, com os próprios cadastros
- **US3**: fundação + pedido da US1. A prova de orçamento não precisa da fila
- **US4**: fundação + material da US1. A prova de recebimento não precisa de orçamento
- **US5**: US1. Não precisa de fatura nem de painel
- **US6**: pedido confirmado (US1 ou US3). Não precisa da execução
- **US7**: leituras sobre US1, US4 e US5. Sem eles o painel abre vazio e a prova da seção 7 não fecha
- **US8**: atravessa as histórias já entregues. A prova mínima é a trilha da liberação da US1

### Within Each User Story

- Teste da regra falha antes da função em `src/Farm3d.Domain/Rules/`
- Entidades antes do caso de uso
- Caso de uso antes do controller
- Controller antes da página

### Parallel Opportunities

- T002, T003, T004 e T005 em paralelo
- T008 e T009 em paralelo
- T016, T017 e T018 em paralelo; T019, T020 e T021 em paralelo
- T032 sozinho antes de T033; T034 em paralelo com T032
- T039, T046, T052, T053, T059, T063, T064 e T069 podem ser escritos assim que a fundação existir, cada um no seu arquivo de teste
- US2, US3 e US4 podem ser tocadas por pessoas diferentes depois da US1, desde que `Program.cs` e o router tenham um dono

---

## Parallel Example: User Story 1

```text
T016 LotSplitTests.cs
T017 FifoReservationTests.cs
T018 PrinterCompatibilityTests.cs

T019 entidades de catálogo
T020 entidades de estoque
T021 entidades de pedido e lote
```

Os três testes não compilam até as funções existirem: o arquivo de teste referencia `LotSplit`, `FifoReservation` e `PrinterCompatibility`. Criar o teste e a classe vazia que lança `NotImplementedException` conta como vermelho.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 e Phase 2
2. Phase 3
3. Parar e executar a seção 1 de `quickstart.md`
4. Demonstrar os 3 lotes, a recusa da Mesa B e a reserva que não dobra

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
10. T075

### Parallel Team Strategy

1. Todos fecham Setup e Foundational
2. Uma pessoa fica na US1 até o checkpoint
3. Em seguida: uma em US2, uma em US3, uma em US4
4. US5 só depois do checkpoint da US1
5. US7 e US8 por último

---

## Notes

- [P] = outro arquivo, sem dependência incompleta
- A história no rótulo amarra a tarefa à spec
- Não copiar código de `docs_apoio/software_ref`; aquele diretório é leitura
- Não criar projeto de assistente, cliente fiscal, SDK de impressora nem Hangfire
- Commit ao fim de cada checkpoint, não no meio de um teste ainda vermelho por esquecimento
