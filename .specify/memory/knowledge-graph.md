# Knowledge Graph: Farm 3D

**Gerado em**: 2026-11-17
**Fontes**: constituição 2.0.0 e os artefatos de `specs/001-reimplementar-printfarm/`
**Feature ativa**: `specs/001-reimplementar-printfarm` (de `.specify/feature.json`)
**Progresso**: 0 de 119 tarefas concluídas

## Como usar

Este arquivo é um índice de relações. Ele diz onde cada fato mora e o
que depende do quê. Ele não contém regra.

- Em conflito com a fonte, vale a fonte. Corrija este arquivo.
- Leia a seção 1 para saber qual arquivo abrir. Leia a seção 5 antes
  de tocar em código. Leia a seção 6 antes de trabalhar em paralelo.
- Atualize este arquivo na mesma entrega que mudar: um princípio, um
  FR, uma entidade, uma tarefa ou o dono de um artefato.
- Cada aresta é uma linha `origem | relação | destino`. Identificadores
  são os das fontes e não mudam.

## 1. Artefatos

| Nó | Caminho | Dono do quê | Escrito por |
|----|---------|-------------|-------------|
| CONST | `.specify/memory/constitution.md` | Princípios, vocabulário, fora de escopo, processo | `/speckit-constitution`, com emenda ratificada por humano |
| KG | `.specify/memory/knowledge-graph.md` | Relações entre artefatos | quem mudar uma fonte |
| FEAT | `.specify/feature.json` | Feature ativa | `/speckit-specify` |
| SPEC | `specs/001-…/spec.md` | US1–US8, FR-001–FR-026, SC-001–SC-009, edge cases | `/speckit-specify`, `/speckit-clarify` |
| REQCHK | `specs/001-…/checklists/requirements.md` | Qualidade da spec | `/speckit-specify`, `/speckit-clarify` |
| PLAN | `specs/001-…/plan.md` | Stack, estrutura, Constitution Check | `/speckit-plan` |
| RES | `specs/001-…/research.md` | 18 decisões técnicas e alternativas | `/speckit-plan` |
| DM | `specs/001-…/data-model.md` | Entidades, enums, transições, fórmulas | `/speckit-plan` |
| CTR | `specs/001-…/contracts/*.md` | Rotas, papéis, respostas | `/speckit-plan` |
| QS | `specs/001-…/quickstart.md` | Roteiro de prova, seções 1–8 | `/speckit-plan` |
| TASKS | `specs/001-…/tasks.md` | T001–T119, ordem e arquivos | `/speckit-tasks`; `/speckit-implement` só marca `[X]`; `/speckit-converge` só acrescenta |
| ANALYSIS | `specs/001-…/analysis.md` | Registro histórico dos sete achados do estado 454feb2; requer nova análise após emenda | salvo por solicitação explícita do usuário |
| GITCFG | `.specify/extensions/git/git-config.yml` | Numeração de branch e commit automático | humano |
| EXT | `.specify/extensions.yml`, `.specify/extensions/.registry` | Extensões e hooks | CLI `specify extension` |

| Origem | Relação | Destino |
|--------|---------|---------|
| CONST | prevalece sobre | SPEC |
| SPEC | prevalece sobre | PLAN |
| PLAN | prevalece sobre | DM, CTR |
| DM, CTR | prevalecem sobre | TASKS |
| TASKS | prevalece sobre | código |
| SPEC | é entrada de | PLAN |
| PLAN, DM, CTR, QS | são entrada de | TASKS |
| TASKS | cita regras entre aspas de | DM |
| CTR | cita papéis e regras de | DM, SPEC |
| QS | prova | SPEC (uma seção por US) |
| PLAN | confere gates de | CONST |
| FEAT | aponta para | `specs/001-reimplementar-printfarm` |

## 2. Princípios, gates e evidência

Os IDs abaixo são os de TASKS na integração dos commits locais com a constituição 2.0.0. São evidências planejadas; não são testes executados.

| Princípio | Requisitos | Evidência, tarefa ou artefato |
|-----------|------------|-------------------------------|
| I. Domínio puro, casca fina | todos os FR com regra | T002, T025; RES item 2; regras da seção 5 |
| II. Teste antes da regra | todos os FR com regra | tarefas de teste da seção 5; QS seções 1 a 8; T030/T056/T069/T082/T083/T096 antes das operações SQL |
| III. Dois estados | FR-014, FR-015, FR-016, FR-018 | DM Transições; T078, T079, T085, T090; QS seção 5 |
| IV. Rastreio sem baixa duplicada | FR-012, FR-017, FR-018, FR-024 | T013, T023, T030, T080, T081, T082, T083, T113 |
| V. Estimativa explícita, dado fictício marcado | FR-005, FR-023, FR-025 | T009, T010, T029, T103, T104, T106, T112; QS seção 7 |
| VI. Escopo parado | FR-026 | RES item 14; TASKS regras de execução; Complexity Tracking em PLAN |
| VII. Acesso por papel, segredo fora do repositório | FR-001, FR-002 | CTR matrizes; T005, T007, T011, T016, T018, T019, T031, T044, T045, T114; QS seções 2 e 8 |

Lacunas conhecidas e estado da integração:

- ANALYSIS registra sete achados em aberto, inclusive C1 CRITICAL. O registro foi produzido contra a constituição 1.0.0 e precisa de nova análise após a emenda 2.0.0; não autoriza implementação.
- As tarefas atuais preveem testes 403 e testes SQL antes dos casos de uso. As antigas lacunas de ausência desses testes e de sua ordem não descrevem mais TASKS.
- A branch ativa é `001-reimplementar-printfarm`. A tabela de correspondência em TASKS liga os IDs da lista antiga de 75 tarefas aos da lista atual de 119; este merge não renumera a lista local.
- `docs_apoio/software_ref` é citado em SPEC, RES e TASKS e não está versionado neste repositório.
- `.specify/templates/`, `.specify/scripts/` e os comandos locais de agente não estão versionados. A infraestrutura local preexistente não faz parte deste merge.
- `__pycache__` da extensão git continua versionado. T005 prevê o .gitignore; nenhuma limpeza desse histórico foi feita.

## 3. Histórias, requisitos e tarefas

O vínculo FR com US é derivado dos cenários e das referências explícitas de TASKS. O roteiro de cada história está em QS. Os IDs e as dependências são os do arquivo atual.

| História | Prioridade | FR | Tarefas | Prova | Depende de |
|----------|-----------|----|---------|-------|------------|
| Setup | compartilhado | configuração | T001 a T007 | checkpoint da fase 1 | início |
| Fundação | compartilhado | FR-001, FR-002, FR-023, FR-024, FR-025 | T008 a T025 | checkpoint da fase 2 | Setup |
| US1 Pedido vira lotes na fila | P1, MVP | FR-009, FR-011, FR-012, FR-013 | T026 a T042 | QS 1 | Fundação |
| US2 Base da operação | P2 | FR-001, FR-002, FR-003, FR-004, FR-005 | T043 a T052 | QS 2 | US1, modelos compartilhados |
| US3 Orçamento vira um pedido | P2 | FR-006, FR-007, FR-008, FR-009, FR-010 | T053 a T066 | QS 3 | US1, US2 |
| US4 Compra entra em lote de material | P2 | FR-019, FR-020 | T067 a T077 | QS 4 | US1, fornecedor e material |
| US5 Executar sem liberar a máquina cedo | P3 | FR-009, FR-013, FR-014, FR-015, FR-016, FR-017, FR-018 | T078 a T094 | QS 5 | US2, US3, US4 |
| US6 Fatura e pagamento | P3 | FR-009, FR-021 | T095 a T102 | QS 6 | US3, schema e cancelamento |
| US7 Painel com premissa | P3 | FR-020, FR-022, FR-023, FR-025 | T103 a T112 | QS 7 | US4, US5 |
| US8 Consulta da trilha | P4 | FR-024 | T113 a T116 | QS 8 | US3, US4, US5; captura desde T023 |
| Polimento | compartilhado | FR-025, FR-026 e evidências | T117 a T119 | QS Pronto quando | incremento entregue |

FR-025 e FR-026 são transversais. US1-AS9 permanece apontado para US5 na lista atual, objeto do achado C1. US3 testa fatos semeados de execução/financeiro; os comandos reais e suas disputas de cancelamento são implementados nas US5/US6.

## 4. Domínio

Nomes de `data-model.md`. Termo em português entre parênteses, do
vocabulário da constituição.

### Entidades

| Origem | Relação | Destino |
|--------|---------|---------|
| Quote (orçamento) | pertence a | Customer |
| Quote | tem | QuoteLine |
| QuoteLine | refere | Product; Material (opcional) |
| SalesOrder (pedido) | pertence a | Customer |
| SalesOrder | nasce de, no máximo um por | Quote (opcional) |
| SalesOrder | tem | OrderLine |
| OrderLine | refere | Product, Material, Color (se oferecida) |
| Product (modelo) | usa | PrintProfile (perfil de produção) |
| PrintProfile | refere | Material (opcional) |
| ProductionLot (lote de produção) | pertence a | SalesOrder, OrderLine |
| ProductionLot | refere | Product, Material |
| ProductionLot | preserva da liberação | ReleasedPiecesPerPlate, ReleasedMinutesPerPlate, ReleasedGramsPerPlate |
| ProductionMaterialReservation | liga | ProductionLot → StockItem |
| StockItem (saldo) | refere | Material; MaterialLot (opcional) |
| MaterialLot (lote de material) | pertence a | Material, Supplier |
| StockMovement (movimentação) | tem origem em | ProductionLot, PrintRun ou PurchaseReceipt; detalhes por StockItem e MaterialLot |
| PrintQueueItem | enfileira | ProductionLot; Printer (opcional) |
| PrintRun (execução) | executa | ProductionLot em Printer |
| PrintRun | refere | Operator opcional; consumo rastreado por StockMovement, sem MaterialLotId singular como fonte de verdade |
| PrintRun | reimprime | PrintRun (`ReprintOfPrintRunId`) |
| Printer | identifica a execução na mesa por | OccupyingPrintRunId até a retirada, inclusive após falha |
| PrinterMaterial | liga | Printer ↔ Material (lista vazia = qualquer material) |
| Operator | refere | usuário (opcional) |
| File3D | tem | File3DVersion |
| PurchaseOrder | pertence a | Supplier |
| PurchaseOrder | tem | PurchaseOrderLine → Material |
| PurchaseReceipt | pertence a | PurchaseOrder |
| PurchaseReceiptLine | cria | MaterialLot |
| Invoice, Payment | pertencem a | SalesOrder |
| AuditLog (trilha) | registra mudança de estado de | Quote, SalesOrder, ProductionLot, Printer |
| FarmSettings | fornece premissa para | CostEstimate, BacklogForecast |
| DeadlineAlert, RestockSuggestion | gravados por | processamento periódico |

### Estados

Os valores e as tabelas de transição estão em DM. Aqui só o que liga
uma coisa à outra.

| Enum | Dono do estado | Alterado por |
|------|----------------|--------------|
| `ProductionLotStatus` | ProductionLot | liberar, enfileirar, iniciar, pausar, retomar, concluir impressão, confirmar retirada, falhar, cancelar |
| `PrinterOperationalStatus` | Printer | iniciar, concluir impressão ou falhar, confirmar retirada, concluir preparação, confirmar manutenção, marcar indisponível, reativar |
| `PrintRunStatus` | PrintRun | iniciar, pausar, retomar, concluir, falhar |
| `QuoteStatus` | Quote | enviar, aprovar, rejeitar, expirar (periódico), gerar pedido |
| `CommercialOrderStatus` | SalesOrder | confirmar, cancelar e demais `PATCH` de CTR comercial |
| `PurchaseOrderStatus` | PurchaseOrder | enviar, receber, cancelar |

| Origem | Relação | Destino |
|--------|---------|---------|
| `ProductionLotStatus` | independente de (princípio III) | `PrinterOperationalStatus` |
| concluir impressão | leva | lote a `AwaitingPickup` e impressora a `AwaitingPickup` |
| confirmar retirada | leva | impressora a `Preparing`; lote a `Completed` só se a execução concluiu |
| concluir preparação | leva | impressora a `Available` ou a `InMaintenance`, conforme horas acumuladas |
| pausar | não altera | `PrinterOperationalStatus` |
| "confirmação pendente" (spec) | é | `CommercialOrderStatus.QuotePending` |
| "confirmado" (spec) | é | `CommercialOrderStatus.Approved` |

## 5. Regra, teste e arquivo

Regras puras estão previstas em `src/Farm3d.Domain/Rules/`, testes puros em `src/Farm3d.Tests/Domain/`, casos de uso em `src/Farm3d.Application/UseCases/`, testes SQL em `src/Farm3d.Tests/Stock/` e contratos HTTP em `src/Farm3d.Tests/Contracts/`.

| Regra pura | Teste, tarefa | Implementação, tarefa | FR | Usada por |
|------------|---------------|------------------------|----|-----------|
| LotSplit | LotSplitTests, T026 | T036 | FR-011 | ReleaseLots |
| FifoReservation | FifoReservationTests, T027 | T036 | FR-012 | ReleaseLots |
| PrinterCompatibility | PrinterCompatibilityTests, T028 | T036 | FR-005, FR-013 | EnqueueLot e início |
| Dados de produção e parâmetros preservados | ProductionDataTests, T029 | T033, T035 | FR-004, FR-005, FR-011 | criação/liberação |
| OrderReleaseGuard | OrderReleaseGuardTests, T032 | T036 | FR-009 | ConfirmOrder, ReleaseLots |
| MasterDataRules | MasterDataRulesTests, T043 | T046 | FR-003, FR-004, FR-005 | MaintainMasterData |
| QuoteState | QuoteStateTests, T053 | T058 | FR-006, FR-007, FR-008 | QuoteLifecycle, CreateOrderFromQuote, HourlyFarmJob |
| OrderCancellation | OrderCancellationTests, T054 | T058 | FR-009 | CancelOrder |
| ReceiptMath | ReceiptMathTests, T067 | T071 | FR-019 | ReceivePurchase |
| RestockSuggestion | RestockSuggestionTests, T068 | T071 | FR-020 | HourlyFarmJob |
| PrinterState | PrinterStateTests, T078 | T085 | FR-014, FR-015, FR-016 | StartRun, CompleteRun, FailRun, PreparePrinter |
| LotState | LotStateTests, T079 | T085 | FR-014, FR-015, FR-018 | operações de execução |
| MaterialConsumption | MaterialConsumptionTests, T080 | T085 | FR-017, FR-018, FR-024 | CompleteRun, FailRun |
| ReprintReservation | ReprintReservationTests, T081 | T085 | FR-018 | FailRun, StartRun |
| BillingGuard | BillingGuardTests, T095 | T098 | FR-009, FR-021 | RecordInvoice, RecordPayment |
| CostEstimate | CostEstimateTests, T103 | T107 | FR-023 | painel |
| BacklogForecast | BacklogForecastTests, T104 | T107 | FR-022, FR-023 | painel |

| Caso de uso ou verificação | Implementação, tarefa | Prova, tarefa | Contrato |
|---------------------------|------------------------|---------------|----------|
| ReleaseLots, ConfirmOrder, EnqueueLot | T038 | ReleaseLotsTests T030, contrato T031 | producao.md, comercial.md |
| QuoteLifecycle, CreateOrderFromQuote | T061 | CommercialLifecycleTests T056, contrato T057 | comercial.md |
| CancelOrder | T062 | OrderCancellationTests T054, SQL T056 | comercial.md |
| ReceivePurchase | T073 | ReceivePurchaseTests T069, contrato T070 | estoque-compras.md |
| StartRun, PauseRun | T087 | RunConcurrencyTests T083, contrato T084 | producao.md |
| CompleteRun, FailRun | T088, T089 | RunExecutionTests T082, concorrência T083 | producao.md |
| PreparePrinter | T090 | T078, T079, contrato T084 | producao.md |
| CancelLot | T092 | casos de cancelamento em T082 | producao.md |
| RecordInvoice, RecordPayment | T099 | BillingConcurrencyTests T096, contrato T097 | financeiro.md |
| AuditWriter, captura | T023 e as escritas de cada história | T030, T056, T069, T082, T113 | painel.md, estoque-compras.md |
| Consulta de trilha | T115 | AuditContractTests T114 | painel.md |
| Pureza do núcleo | T002, T025 | DomainPurityTests, T025 | constituição, gate I |
| Guarda de rota | T020 | route-guard.spec.ts, T017 | auth.md |

## 6. Arquivos com mais de um escritor

Um escritor por arquivo. As tarefas marcadas P não autorizam edições simultâneas de DbContext, migrations, Program, job, router ou componentes compartilhados. As escolhas visuais precedem a implementação dos respectivos componentes.

| Arquivo | Tarefas |
|---------|---------|
| `src/Farm3d.Api/Program.cs` | T019, T024 e registro das dependências de cada história |
| `src/Farm3d.Infrastructure/Persistence/Farm3dDbContext.cs` | T012 e configuração dos mapeamentos T023, T037, T047, T060, T072, T086, T108 |
| `src/Farm3d.Infrastructure/Persistence/Migrations/` | T012, T023, T037, T047, T060, T072, T086, T108 |
| `src/Farm3d.Infrastructure/Jobs/HourlyFarmJob.cs` | T024, T064, T075, T109 |
| `src/Farm3d.Api/Controllers/LotsController.cs` | T039, T092 |
| `src/Farm3d.Api/Controllers/SalesOrdersController.cs` | T039, T063 |
| `src/Farm3d.Api/Controllers/PrintersController.cs` | T049, T091 |
| `src/Farm3d.Domain/Entities/PrintRun.cs`, `Invoice.cs`, `Payment.cs` | criados em T059 para cancelamento; usados por US5/US6 |
| `web/src/pages/PedidoPage.vue` | T042, T066 |
| `web/src/pages/FilaPage.vue` | T042, T094 |
| `web/src/router/index.ts` | T020 e registro das páginas T042, T052, T066, T077, T094, T102, T112 |
| `.env.example` | T005, T007 |
| `specs/001-…/tasks.md`, `pr.md` | cada tarefa concluída e comprovada |

Os exemplos de paralelismo e seus pré-requisitos estão na tabela Oportunidades e exemplos de paralelismo de TASKS. Os arquivos de testes distintos podem ser escritos em paralelo; a execução SQL usa bancos isolados e não simula transações com InMemory.

## 7. Processo

| Comando | Lê | Escreve | Hook da extensão git depois |
|---------|----|---------|-----------------------------|
| `/speckit-constitution` | CONST | CONST | commit automático |
| `/speckit-specify` | CONST | SPEC, REQCHK, FEAT | antes: `speckit.git.feature`; depois: commit automático |
| `/speckit-clarify` | SPEC | SPEC, REQCHK | commit automático |
| `/speckit-plan` | CONST, SPEC | PLAN, RES, DM, CTR, QS | commit automático |
| `/speckit-checklist` | SPEC, PLAN | `checklists/<tema>.md` | commit automático |
| `/speckit-tasks` | PLAN, DM, CTR, QS | TASKS | commit automático |
| `/speckit-analyze` | CONST, SPEC, PLAN, TASKS | nada | commit automático |
| `/speckit-implement` | TASKS e o que ele cita | código; `[X]` em TASKS | sem commit automático; commit manual por checkpoint |
| `/speckit-converge` | código, SPEC, PLAN, TASKS | tarefas novas ao fim de TASKS | — |

Próximo passo da feature 001: repetir `/speckit-analyze` contra a constituição 2.0.0 e os artefatos integrados. Achado CRITICAL bloqueia `/speckit-implement`; a geração atual mantém C1 em aberto no registro histórico da análise.

A CLI `specify` e a instalação dos comandos estão descritas na seção
"Processo Spec Kit" da constituição.
