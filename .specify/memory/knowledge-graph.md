# Knowledge Graph: Farm 3D

**Gerado em**: 2026-11-17 | **Revisado**: 2026-11-17 (stack Node.js + TypeScript + SQLite)
**Fontes**: constituição 2.0.0 e os artefatos de `specs/001-reimplementar-printfarm/`
**Feature ativa**: `specs/001-reimplementar-printfarm` (de `.specify/feature.json`)
**Stack**: Node.js 24+, TypeScript sem build, Fastify, `node:sqlite`, Vue 3, Vitest (plan.md e research.md)
**Progresso**: 0 de 78 tarefas concluídas

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
| RES | `specs/001-…/research.md` | 14 decisões técnicas e alternativas | `/speckit-plan` |
| DM | `specs/001-…/data-model.md` | Entidades, enums, transições, fórmulas | `/speckit-plan` |
| CTR | `specs/001-…/contracts/*.md` | Rotas, papéis, respostas | `/speckit-plan` |
| QS | `specs/001-…/quickstart.md` | Roteiro de prova, seções 1–8 | `/speckit-plan` |
| TASKS | `specs/001-…/tasks.md` | T001–T078, ordem, arquivos e migrações reservadas | `/speckit-tasks`; `/speckit-implement` só marca `[X]`; `/speckit-converge` só acrescenta |
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

| Princípio | Requisitos | Evidência (tarefa ou artefato) |
|-----------|------------|--------------------------------|
| I. Domínio puro, casca fina | todos os FR com regra | T007 (`domain-purity.test.ts`); RES itens 2 e 14; regras da seção 5 |
| II. Teste antes da regra | todos os FR com regra | tarefas de teste da seção 5; QS seções 1–8 |
| III. Dois estados | FR-014, FR-015, FR-016, FR-018 | DM "Transições"; T052, T053, T054; QS seção 5 |
| IV. Rastreio sem baixa duplicada | FR-012, FR-017, FR-024 | T010 (rollback), T017, T026, T055, T069, T070, T072 |
| V. Estimativa explícita, dado fictício marcado | FR-005, FR-023, FR-025 | T009 (unidades), T010 (`CHECK`), T032, T063, T064, T068; QS seção 7 |
| VI. Escopo parado | FR-026 | RES item 16; T076; Complexity Tracking vazio em PLAN |
| VII. Acesso por papel, segredo fora do repositório | FR-001, FR-002 | CTR (matriz de papéis e convenções em auth.md); T004, T006, T011, T012, T013 (`authz.test.ts`), T014; QS seções 2 e 8 |

Lacunas conhecidas:

- `docs_apoio/software_ref` é citado em SPEC, RES e TASKS e não existe
  neste repositório.
- Código C# não versionado e restos .NET versionados (`docker-compose.yml`,
  `src/Directory.Build.props`, `src/Farm3d.Api/appsettings.json`)
  continuam na árvore até T001.
- Os números de política de senha, travamento e validade do token (RES
  item 4) são padrão e aguardam confirmação do mantenedor.
- A seção "Processo Spec Kit" da constituição ainda descreve o estado
  anterior à instalação da CLI 1.4.1 e da integração OpenCode.

## 3. Histórias, requisitos e tarefas

O vínculo FR ↔ US é derivado dos cenários de aceitação; a spec não o
declara em tabela.

| História | Prioridade | FR | Tarefas | Prova | Depende de |
|----------|-----------|----|---------|-------|------------|
| Setup | — | — | T001–T006 | — | — |
| Fundação | — | FR-001 (login, papéis, guarda) | T007–T015 | checkpoint da fase 2 | Setup |
| US1 Pedido vira lotes na fila | P1 (MVP) | FR-009 (confirmação), FR-011, FR-012, FR-013 | T016–T031, T077, T078 | QS 1 | Fundação |
| US2 Base da operação | P2 | FR-001, FR-002, FR-003, FR-004, FR-005 | T032–T038 | QS 2 | US1 (migração 0002) |
| US3 Orçamento vira um pedido | P2 | FR-006, FR-007, FR-008, FR-009, FR-010 | T039–T045 | QS 3 | US1 |
| US4 Compra entra em lote de material | P2 | FR-019, FR-020 | T046–T051 | QS 4 | US1 |
| US5 Executar sem liberar a máquina cedo | P3 | FR-013, FR-014, FR-015, FR-016, FR-017, FR-018 | T052–T058 | QS 5 | US1 |
| US6 Fatura e pagamento | P3 | FR-021, FR-009 | T059–T062 | QS 6 | US1 |
| US7 Painel com premissa | P3 | FR-022, FR-023, FR-025 | T063–T068 | QS 7 | US1, US4, US5 |
| US8 Trilha | P4 | FR-024 | T069–T072 | QS 8 | US1, US3, US5 |
| Polimento | — | FR-026 (conferência) | T073–T076 | QS "Pronto quando" | histórias entregues |

FR-025 e FR-026 são transversais: valem em toda tela e em toda fase.

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
| ProductionMaterialReservation | liga | ProductionLot → StockItem |
| StockItem (saldo) | refere | Material; MaterialLot (opcional) |
| MaterialLot (lote de material) | pertence a | Material, Supplier |
| StockMovement (movimentação) | tem origem em | ProductionLot, PrintRun ou PurchaseReceipt |
| PrintQueueItem | enfileira | ProductionLot; Printer (opcional) |
| PrintRun (execução) | executa | ProductionLot em Printer |
| PrintRun | refere | Operator (opcional), MaterialLot (opcional) |
| PrintRun | reimprime | PrintRun (`ReprintOfPrintRunId`) |
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

Regra pura mora em `server/src/domain/rules/`. Teste de regra em
`server/tests/domain/`. Caso de uso em
`server/src/application/use-cases/`. Teste de orquestração em
`server/tests/application/`, com SQLite `:memory:`.

| Regra pura (função, arquivo) | Teste (tarefa) | Implementação (tarefa) | FR | Usada por |
|------------------------------|----------------|------------------------|----|-----------|
| aritmética inteira (`domain/units.ts`) | `units.test.ts` (T009) | T009 | edge cases de arredondamento | toda regra com dinheiro, peso ou tempo; rotas na conversão |
| `checkPasswordPolicy` (`password-policy.ts`) | `password-policy.test.ts` (T011) | T011 | FR-001, FR-002 | semente, `users.ts` |
| `evaluateLogin` (`login-lockout.ts`) | `login-lockout.test.ts` (T011) | T011 | FR-001 | `auth.ts` |
| `splitLots` (`lot-split.ts`) | `lot-split.test.ts` (T016) | T022 | FR-011 | `release-lots` |
| `allocateFifo` (`fifo-reservation.ts`) | `fifo-reservation.test.ts` (T017) | T023 | FR-012 | `release-lots` |
| `checkPrinterCompatibility` (`printer-compatibility.ts`) | `printer-compatibility.test.ts` (T018) | T024 | FR-013, FR-005 | `enqueue-lot` |
| `transitionSalesOrder` (`sales-order-state.ts`) | `sales-order-state.test.ts` (T077) | T078 | FR-009 | `sales-orders.ts` |
| `master-data-rules.ts` | `master-data-rules.test.ts` (T032) | T033 | FR-004, FR-005 | rotas de cadastro |
| `transitionQuote` (`quote-state.ts`) | `quote-state.test.ts` (T039) | T040 | FR-006, FR-007, FR-008 | `quote-lifecycle`, `create-order-from-quote`, job horário |
| `receipt-math.ts`, `restock.ts` | `receipt-math.test.ts` (T046) | T047 | FR-019, FR-020 | `receive-purchase`, job horário |
| `transitionPrinter` (`printer-state.ts`) | `printer-state.test.ts` (T052) | T054 | FR-014, FR-015, FR-016 | `run-execution` |
| `transitionLot` (`lot-state.ts`) | `lot-state.test.ts` (T053) | T054 | FR-014, FR-015, FR-018 | `run-execution` |
| `billing-guard.ts` | `billing-guard.test.ts` (T059) | T060 | FR-021, FR-009 | `billing.ts` |
| `estimateCost` (`cost-estimate.ts`) | `cost-estimate.test.ts` (T063) | T065 | FR-023 | `dashboard.ts` |
| `forecastBacklog` (`backlog-forecast.ts`) | `backlog-forecast.test.ts` (T064) | T065 | FR-022, FR-023 | `dashboard.ts`, job horário |

Os nomes `evaluateLogin` e `checkPasswordPolicy` são sugestão deste
grafo; tasks.md fixa só o arquivo.

| Caso de uso ou peça | Teste (tarefa) | Implementação (tarefa) | Contrato |
|---------------------|----------------|------------------------|----------|
| `release-lots` | `release-lots.test.ts` (T026) | T027 | producao.md |
| `enqueue-lot` | — (regra coberta por T018) | T028 | producao.md |
| `quote-lifecycle`, `create-order-from-quote` | — (regra coberta por T039) | T041 | comercial.md |
| `receive-purchase` | — (regra coberta por T046) | T048 | estoque-compras.md |
| `run-execution` | `run-execution.test.ts` (T055) | T056 | producao.md |
| `audit-writer` | `audit.test.ts` (T069) | T070 | painel.md |
| banco, migração, `withTransaction` | `db.test.ts` (T010) | T010 | — |
| pureza do núcleo | `domain-purity.test.ts` (T007) | T007 | — |
| 401 e 403 | `authz.test.ts` (T013) | T013 | auth.md (convenções) |
| guarda de rota da SPA | `route-guard.spec.ts` (T014) | T014 | auth.md |

## 6. Arquivos com mais de um escritor

Cada arquivo abaixo é tocado por várias tarefas. Um escritor por vez,
na ordem das tarefas, só acréscimo.

| Arquivo | Tarefas |
|---------|---------|
| `server/src/api/app.ts` (registro de rotas) | T013 e toda tarefa que cria rota: T012, T029, T035, T036, T043, T049, T057, T061, T067, T071, T078 |
| `server/src/api/main.ts` | T013, T015 |
| `server/src/infrastructure/jobs/hourly-farm-job.ts` | T015, T044, T050, T066 |
| `server/src/api/routes/sales-orders.ts` | T078, T043 |
| `server/src/api/routes/cadastros/files3d.ts` | T035, T037 |
| `server/src/domain/enums.ts` | T008 (depois, só leitura) |
| `server/src/application/use-cases/release-lots.ts` | T027, T070 |
| `server/src/application/use-cases/run-execution.ts` | T056, T070, T072 |
| `server/src/application/use-cases/receive-purchase.ts` | T048, T072 |
| `server/tests/api/authz.test.ts` | T013, T071 |
| `web/src/router/index.ts` | T014 e toda tarefa que cria página: T031, T038, T045, T051, T058, T062, T068 |
| `package.json` da raiz e `package-lock.json` | T001, T003 |
| `specs/001-…/tasks.md` | toda tarefa, ao marcar `[X]` |

Migrações não conflitam: cada história tem um número reservado em
tasks.md ("Migrações reservadas"), e o executor aplica todo arquivo
ainda não registrado, mesmo com número menor que o último aplicado.

Paralelo permitido, de TASKS: T002–T005; T008–T009; T016–T018;
T019–T021; T032 com T034; os testes T039, T046, T052, T053, T059, T063,
T064 e T069 depois da fundação; US2 a US6 em branches separadas depois
da US1.

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

Próximo passo da feature 001: `/speckit.analyze`, depois
`/speckit.implement` a partir de T001. No OpenCode os comandos usam
ponto: `/speckit.analyze`.

A CLI `specify` e a instalação dos comandos estão descritas na seção
"Processo Spec Kit" da constituição.
