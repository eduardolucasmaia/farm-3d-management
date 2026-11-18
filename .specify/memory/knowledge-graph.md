# Knowledge Graph: Farm 3D

**Gerado em**: 2026-11-17 | **Revisado**: 2026-11-17 (Fundação e US1 implementadas)
**Fontes**: constituição 2.1.0, os artefatos de `specs/001-reimplementar-printfarm/` e o código em `server/` e `web/`
**Feature ativa**: `specs/001-reimplementar-printfarm` (de `.specify/feature.json`)
**Stack**: Node.js 24+, TypeScript 5.9 sem build, Fastify 5, `node:sqlite`, Vue 3, Vitest 4.1.12+ (plan.md e research.md)
**Progresso**: 39 de 89 tarefas concluídas (Setup, Fundação, US1, T079–T083, T089: fábrica simulada). Desenho integrado com a revisão paralela em 2026-11-17 (research.md itens 17–20). Pendentes: 50 tarefas, uma por brief em `briefs/`

## Como usar

Este arquivo é um índice de relações. Ele diz onde cada fato mora e o
que depende do quê. Ele não contém regra.

- **Vai implementar uma história? Não comece por aqui.** Leia
  `AGENTS.md` na raiz e o brief da história em
  `specs/001-reimplementar-printfarm/briefs/`. Este grafo é para quem
  muda desenho ou precisa achar algo que o brief não responde.
- Em conflito com a fonte, vale a fonte. Corrija este arquivo.
- Leia a seção 1 para saber qual arquivo abrir. Leia a seção 5 antes
  de tocar em código. Leia a seção 6 antes de trabalhar em paralelo.
  Leia a seção 8 para saber o que já existe e em qual branch.
- Atualize este arquivo na mesma entrega que mudar: um princípio, um
  FR, uma entidade, uma tarefa, um arquivo compartilhado ou o dono de
  um artefato.
- Cada aresta é uma linha `origem | relação | destino`. Identificadores
  são os das fontes e não mudam.

## 1. Artefatos

| Nó | Caminho | Dono do quê | Escrito por |
|----|---------|-------------|-------------|
| CONST | `.specify/memory/constitution.md` | Princípios, vocabulário, fora de escopo, processo | `/speckit.constitution`, com emenda ratificada por humano |
| KG | `.specify/memory/knowledge-graph.md` | Relações entre artefatos e estado da implementação | quem mudar uma fonte |
| GUIA | `AGENTS.md` (e `CLAUDE.md`, que só o importa) | Ponto de entrada do agente: pré-voo, o que ler, ciclo da tarefa, regras resumidas, exemplos a copiar, estado das histórias | quem fechar uma história ou mudar uma regra de trabalho |
| BRIEF | `specs/001-…/briefs/<história>.md` | Por história: tarefas em ordem, bloqueios, seções a ler, arquivos novos e compartilhados, armadilhas | quem mudar desenho que a história cita |
| CMD | `.opencode/commands/farm.historia.md` | Comando `/farm.historia <brief>`: conduz o ciclo de uma história | humano |
| FEAT | `.specify/feature.json` | Feature ativa | `/speckit.specify` |
| INTEG | `.specify/integration.json`, `.specify/integrations/`, `.opencode/commands/` | Integração `opencode` e seus comandos | CLI `specify integration` |
| SPEC | `specs/001-…/spec.md` | US1–US8, FR-001–FR-026, SC-001–SC-009, edge cases | `/speckit.specify`, `/speckit.clarify` |
| REQCHK | `specs/001-…/checklists/requirements.md` | Qualidade da spec | `/speckit.specify`, `/speckit.clarify` |
| BIZCHK | `specs/001-…/checklists/core-business.md` | Revisão de qualidade dos requisitos de negócio (itens CHK) | `/speckit.checklist`; marcado pelo revisor. Não versionado ainda |
| PLAN | `specs/001-…/plan.md` | Stack, versões mínimas, estrutura, Constitution Check | `/speckit.plan` |
| RES | `specs/001-…/research.md` | 16 decisões técnicas e alternativas | `/speckit.plan` |
| DM | `specs/001-…/data-model.md` | Entidades, enums, unidades inteiras, transições, fórmulas | `/speckit.plan` |
| CTR | `specs/001-…/contracts/*.md` | Rotas, papéis, respostas, convenções (em auth.md) | `/speckit.plan` |
| QS | `specs/001-…/quickstart.md` | Comandos de arranque e roteiro de prova, seções 1–8 | `/speckit.plan` |
| TASKS | `specs/001-…/tasks.md` | T001–T079, ordem, arquivos e migrações reservadas | `/speckit.tasks`; `/speckit.implement` só marca `[X]`; `/speckit.converge` só acrescenta |
| GITCFG | `.specify/extensions/git/git-config.yml` | Numeração de branch e commit automático | humano |
| EXT | `.specify/extensions.yml`, `.specify/extensions/.registry` | Extensões e hooks | CLI `specify extension` |
| CODE | `server/`, `web/`, `package.json` da raiz | Implementação | `/speckit.implement`, seguindo TASKS |

| Origem | Relação | Destino |
|--------|---------|---------|
| CONST | prevalece sobre | SPEC |
| SPEC | prevalece sobre | PLAN |
| PLAN | prevalece sobre | DM, CTR |
| DM, CTR | prevalecem sobre | TASKS |
| TASKS | prevalece sobre | CODE |
| SPEC | é entrada de | PLAN |
| PLAN, DM, CTR, QS | são entrada de | TASKS |
| TASKS | cita regras entre aspas de | DM |
| CTR | cita papéis e regras de | DM, SPEC |
| QS | prova | SPEC (uma seção por US) |
| PLAN | confere gates de | CONST |
| BIZCHK | revisa | SPEC |
| GUIA | aponta para | BRIEF, QS, CODE (exemplos) |
| BRIEF | aponta seções de | TASKS, DM, CTR, QS, RES |
| CMD | executa | GUIA + BRIEF |
| FEAT | aponta para | `specs/001-reimplementar-printfarm` |

## 2. Princípios, gates e evidência

| Princípio | Requisitos | Evidência (tarefa ou artefato) | Estado |
|-----------|------------|--------------------------------|--------|
| I. Domínio puro, casca fina | todos os FR com regra | T007 (`domain-purity.test.ts`); RES itens 2 e 14; regras da seção 5 | ✅ teste verde |
| II. Teste antes da regra | todos os FR com regra | tarefas de teste da seção 5; QS seções 1–8 | ✅ na Fundação e US1 |
| III. Dois estados | FR-014, FR-015, FR-016, FR-018 | DM "Transições"; T052, T053, T054; QS seção 5 | pendente (US5) |
| IV. Rastreio sem baixa duplicada | FR-012, FR-017, FR-024 | T010 (rollback), T017, T026, T055, T069, T070, T072 | ✅ reserva atômica; pendente execução e trilha |
| V. Estimativa explícita, dado fictício marcado | FR-005, FR-023, FR-025 | T009 (unidades), T010 (`CHECK`), T030 (semente marcada), T032, T063, T064, T068; QS seção 7 | ✅ unidades e marca; pendente custo |
| VI. Escopo parado | FR-026 | RES item 16; T076; Complexity Tracking vazio em PLAN | aberto até T076 |
| VII. Acesso por papel, segredo fora do repositório | FR-001, FR-002 | CTR (matriz de papéis e convenções em auth.md); T004, T006, T011, T012, T013 (`authz.test.ts`), T014; QS seções 2 e 8 | ✅ 401/403 testados |

Lacunas conhecidas:

- `docs_apoio/software_ref` é citado em SPEC, RES e TASKS e não existe
  neste repositório (TODO(SOFTWARE_REF) na constituição).
- QS seção 1, passo 6, pede zerar o saldo manualmente; não há tela
  para isso. A semente traz o pedido `PED-DEMO-002` (1000 peças) para
  provar a recusa sem reserva parcial.
- A API escuta só em `127.0.0.1` (`server/src/api/main.ts`). Uso na
  rede da oficina exige tornar o host configurável.
- BIZCHK foi gerado por `/speckit.checklist` e ainda não está
  versionado nem revisado.

## 3. Histórias, requisitos e tarefas

O vínculo FR ↔ US é derivado dos cenários de aceitação; a spec não o
declara em tabela.

| História | Prioridade | FR | Tarefas | Prova | Depende de | Estado |
|----------|-----------|----|---------|-------|------------|--------|
| Setup | — | — | T001–T006 | — | — | ✅ |
| Fundação | — | FR-001 (login, papéis, guarda) | T007–T015, T079 | checkpoint da fase 2 | Setup | ✅ |
| US1 Pedido vira lotes na fila | P1 (MVP) | FR-009 (confirmação), FR-011, FR-012, FR-013 | T016–T031, T077, T078, T080–T083 | QS 1 | Fundação | ✅ QS 1 conferida; liberação já enfileira, parâmetros da prancha preservados |
| US2 Base da operação | P2 | FR-001, FR-002, FR-003, FR-004, FR-005 | T032–T038 | QS 2 | US1 (migração 0002) | pendente |
| US3 Orçamento vira um pedido | P2 | FR-006, FR-007, FR-008, FR-009, FR-010 | T039–T045 | QS 3 | US1 | pendente |
| US4 Compra entra em lote de material | P2 | FR-019, FR-020 | T046–T051 | QS 4 | US1 | pendente |
| US5 Executar sem liberar a máquina cedo | P3 | FR-013, FR-014, FR-015, FR-016, FR-017, FR-018 | T052–T058, T086–T088 | QS 5 | US1 | pendente |
| Cancelamento de pedido (fase 8.5) | — | FR-009 | T084, T085 | QS 3 passos 7–8 | US3, US5, US6 | pendente |
| US6 Fatura e pagamento | P3 | FR-021, FR-009 | T059–T062 | QS 6 | US1 | pendente |
| US7 Painel com premissa | P3 | FR-022, FR-023, FR-025 | T063–T068 | QS 7 | US1, US4, US5 | pendente |
| US8 Trilha | P4 | FR-024 | T069–T072 | QS 8 | US1, US3, US5 | pendente |
| Polimento | — | FR-026 (conferência) | T073–T076 | QS "Pronto quando" | histórias entregues | pendente |

FR-025 e FR-026 são transversais: valem em toda tela e em toda fase.

## 4. Domínio

Nomes de `data-model.md`. Termo em português entre parênteses, do
vocabulário da constituição. Valores numéricos são inteiros com sufixo
de unidade (`Mg`, `Seconds`, `Cents`…), convertidos só na API.

### Entidades

| Origem | Relação | Destino |
|--------|---------|---------|
| User | tem um | AppRole |
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
| `CommercialOrderStatus` | SalesOrder | confirmar, cancelar, primeira liberação (→ InProduction) e demais `PATCH` de CTR comercial |
| `PurchaseOrderStatus` | PurchaseOrder | enviar, receber, cancelar |

| Origem | Relação | Destino |
|--------|---------|---------|
| `ProductionLotStatus` | independente de (princípio III) | `PrinterOperationalStatus` |
| liberar (US1) | cria lotes já em | `Released`, com reserva integral |
| enfileirar (US1) | leva | lote de `Released` a `Queued` |
| concluir impressão | leva | lote a `AwaitingPickup` e impressora a `AwaitingPickup` |
| confirmar retirada | leva | impressora a `Preparing`; lote a `Completed` só se a execução concluiu |
| concluir preparação | leva | impressora a `Available` ou a `InMaintenance`, conforme horas acumuladas |
| pausar | não altera | `PrinterOperationalStatus` |
| "confirmação pendente" (spec) | é | `CommercialOrderStatus.QuotePending` |
| "confirmado" (spec) | é | `CommercialOrderStatus.Approved` |
| impressora "ocupada" (CTR producao) | é | fora de `Available` (Printing, AwaitingPickup, Preparing) |

## 5. Regra, teste e arquivo

Regra pura mora em `server/src/domain/rules/`. Teste de regra em
`server/tests/domain/`. Caso de uso em
`server/src/application/use-cases/`, sempre dentro de `transact`
(`server/src/application/transaction.ts`). Teste de orquestração em
`server/tests/application/`, com SQLite `:memory:`. Teste de rota em
`server/tests/api/`, com `app.inject`.

| Regra pura (função, arquivo) | Teste (tarefa) | Implementação (tarefa) | FR | Usada por | Estado |
|------------------------------|----------------|------------------------|----|-----------|--------|
| aritmética inteira (`domain/units.ts`) | `units.test.ts` (T009) | T009 | edge cases de arredondamento | regras com dinheiro, peso ou tempo; `api/format.ts` | ✅ |
| `checkPasswordPolicy` (`password-policy.ts`) | `password-policy.test.ts` (T011) | T011 | FR-001, FR-002 | `identity-seed.ts`; `users.ts` (T036) | ✅ |
| `evaluateLogin` (`login-lockout.ts`) | `login-lockout.test.ts` (T011) | T011 | FR-001 | `routes/auth.ts` | ✅ |
| `splitLots` (`lot-split.ts`) | `lot-split.test.ts` (T016) | T022 | FR-011 | `planRelease` | ✅ |
| `allocateFifo` (`fifo-reservation.ts`) | `fifo-reservation.test.ts` (T017) | T023 | FR-012 | `planRelease` | ✅ |
| `checkPrinterCompatibility` (`printer-compatibility.ts`) | `printer-compatibility.test.ts` (T018) | T024 | FR-013, FR-005 | `enqueue-lot` | ✅ |
| `transitionSalesOrder`, `canReleaseLots` (`sales-order-state.ts`) | `sales-order-state.test.ts` (T077) | T078 | FR-009 | `change-sales-order-status`, `planRelease` | ✅ (T043 acrescenta Delivered) |
| `planRelease` (`release-plan.ts`) | `release-lots.test.ts` (T026) | T027 | FR-009, FR-011, FR-012 | `release-lots` | ✅ |
| `transitionLot` (`lot-state.ts`) | `lot-state.test.ts` (T028 enfileirar; T053 o resto) | T028; T054 | FR-014, FR-015, FR-018 | `enqueue-lot`; `run-execution` | parcial: só enfileirar |
| `master-data-rules.ts` | `master-data-rules.test.ts` (T032) | T033 | FR-004, FR-005 | rotas de cadastro | pendente |
| `transitionQuote` (`quote-state.ts`) | `quote-state.test.ts` (T039) | T040 | FR-006, FR-007, FR-008 | `quote-lifecycle`, `create-order-from-quote`, job horário | pendente |
| `receipt-math.ts`, `restock.ts` | `receipt-math.test.ts` (T046) | T047 | FR-019, FR-020 | `receive-purchase`, job horário | pendente |
| `transitionPrinter` (`printer-state.ts`) | `printer-state.test.ts` (T052) | T054 | FR-014, FR-015, FR-016 | `run-execution` | pendente |
| `billing-guard.ts` | `billing-guard.test.ts` (T059) | T060 | FR-021, FR-009 | `billing.ts` | pendente |
| `estimateCost` (`cost-estimate.ts`) | `cost-estimate.test.ts` (T063) | T065 | FR-023 | `dashboard.ts` | pendente |
| `forecastBacklog` (`backlog-forecast.ts`) | `backlog-forecast.test.ts` (T064) | T065 | FR-022, FR-023 | `dashboard.ts`, job horário | pendente |

| Caso de uso ou peça | Teste (tarefa) | Implementação (tarefa) | Contrato | Estado |
|---------------------|----------------|------------------------|----------|--------|
| `release-lots` | `release-lots.test.ts` (T026); `us1-flow.test.ts` | T027 | producao.md | ✅ |
| `enqueue-lot` | `us1-flow.test.ts` (regra coberta por T018) | T028 | producao.md | ✅ |
| `change-sales-order-status` | `us1-flow.test.ts`; `demo-seed.test.ts` | T078 | comercial.md | ✅ |
| `quote-lifecycle`, `create-order-from-quote` | — (regra coberta por T039) | T041 | comercial.md | pendente |
| `receive-purchase` | — (regra coberta por T046) | T048 | estoque-compras.md | pendente |
| `run-execution` | `run-execution.test.ts` (T055) | T056 | producao.md | pendente |
| `audit-writer` | `audit.test.ts` (T069) | T070 | painel.md | pendente |
| banco, migração, `withTransaction` | `db.test.ts` (T010) | T010 | — | ✅ |
| pureza do núcleo | `domain-purity.test.ts` (T007) | T007 | — | ✅ |
| login e travamento | `auth-login.test.ts` (T012) | T012 | auth.md | ✅ |
| 401 e 403 | `authz.test.ts` (T013); `us1-flow.test.ts` | T013 | auth.md (convenções) | ✅ |
| semente de demonstração | `demo-seed.test.ts` (T030) | T030 | QS seção 1 | ✅ |
| guarda de rota da SPA | `route-guard.spec.ts` (T014) | T014 | auth.md | ✅ |

## 6. Arquivos com mais de um escritor

Cada arquivo abaixo é tocado por várias tarefas. Um escritor por vez,
na ordem das tarefas, só acréscimo.

| Arquivo | Tarefas |
|---------|---------|
| `server/src/api/app.ts` (registro de rotas) | T013, T012, T029 ✅; T035, T036, T043, T049, T057, T061, T067, T071 |
| `server/src/api/main.ts` | T013, T015, T030 ✅ |
| `server/src/infrastructure/jobs/hourly-farm-job.ts` | T015 ✅; T044, T050, T066 |
| `server/src/api/routes/sales-orders.ts` | T029, T078 ✅; T043 |
| `server/src/api/routes/cadastros/printers.ts` | T029 ✅ (leitura); T035 (escrita) |
| `server/src/api/routes/cadastros/files3d.ts` | T035, T037 |
| `server/src/domain/rules/lot-state.ts` e `server/tests/domain/lot-state.test.ts` | T028 ✅; T053, T054 |
| `server/src/domain/rules/sales-order-state.ts` | T078 ✅; T043 |
| `server/src/domain/enums.ts` | T008 ✅ (depois, só leitura) |
| `server/src/domain/result.ts`, `server/src/application/transaction.ts`, `server/src/api/format.ts`, `server/src/api/problem.ts` | Fundação e US1 ✅ (depois, só leitura) |
| `server/src/application/use-cases/release-lots.ts` | T027 ✅; T070 |
| `server/src/application/use-cases/run-execution.ts` | T056, T070, T072 |
| `server/src/application/use-cases/receive-purchase.ts` | T048, T072 |
| `server/src/infrastructure/repositories/*.ts` | uma história por arquivo novo; acréscimo nos existentes |
| `server/tests/helpers/fixtures.ts`, `server/tests/helpers/test-app.ts` | US1 ✅; toda história com teste de orquestração ou de rota |
| `server/tests/api/authz.test.ts` | T013 ✅; T071 |
| `web/src/router/index.ts` | T014, T031 ✅; T038, T045, T051, T058, T062, T068 |
| `web/src/App.vue` (menu) e `web/src/labels.ts` | T031 ✅; toda tarefa que cria página |
| `package.json` da raiz, `server/package.json`, `web/package.json`, `package-lock.json` | T001, T003 ✅; atualização de dependência só em commit próprio |
| `specs/001-…/tasks.md` | toda tarefa, ao marcar `[X]` |

Migrações não conflitam: cada história tem um número reservado em
tasks.md ("Migrações reservadas"), e o executor aplica todo arquivo
ainda não registrado, mesmo com número menor que o último aplicado.
Aplicadas até agora: `0001-foundation.sql`, `0002-production-lots.sql`.

Paralelo permitido, de TASKS: os testes T039, T046, T052, T053, T059,
T063, T064 e T069; US2 a US6 em branches separadas, cada uma a partir
da base com a US1 mesclada.

## 7. Processo

Comandos no formato da integração `opencode` (constituição, "Comandos
do fluxo").

| Comando | Lê | Escreve | Hook da extensão git depois |
|---------|----|---------|-----------------------------|
| `/speckit.constitution` | CONST | CONST | commit automático |
| `/speckit.specify` | CONST | SPEC, REQCHK, FEAT | antes: `speckit.git.feature`; depois: commit automático |
| `/speckit.clarify` | SPEC | SPEC, REQCHK | commit automático |
| `/speckit.plan` | CONST, SPEC | PLAN, RES, DM, CTR, QS | commit automático |
| `/speckit.checklist` | SPEC, PLAN | `checklists/<tema>.md` | commit automático |
| `/speckit.tasks` | PLAN, DM, CTR, QS | TASKS | commit automático |
| `/speckit.analyze` | CONST, SPEC, PLAN, TASKS | nada | commit automático |
| `/speckit.implement` | TASKS e o que ele cita | CODE; `[X]` em TASKS | sem commit automático; commit manual por checkpoint |
| `/speckit.converge` | CODE, SPEC, PLAN, TASKS | tarefas novas ao fim de TASKS | — |

Os hooks `speckit.git.*` não estão registrados no OpenCode; se não
rodarem, o commit é manual (constituição, "Processo Spec Kit").

A CLI `specify` e a instalação dos comandos estão descritas na seção
"Processo Spec Kit" da constituição.

## 8. Estado da implementação

| Branch | Base | Conteúdo | Remoto |
|--------|------|----------|--------|
| `001-reimplementar-printfarm` | `main` | desenho integrado: stack Node.js, clarificações de 2026-11-17, `analysis.md` | publicada |
| `pedro/001-fundacao` | `001-reimplementar-printfarm` | T001–T015, T079 | publicada; aguardando PR |
| `pedro/001-us1-lotes-fila` | `pedro/001-fundacao` | T016–T031, T077, T078, T080–T083; Vitest 4 e `npm audit` limpo; constituição 2.0.1 | publicada; aguardando PR |
| `pedro/001-guia-agentes` | `pedro/001-us1-lotes-fila` | `AGENTS.md`, briefs, comando `/farm.historia`, `tasks.md` resumido, constituição 2.1.0 | local |
| `rascunho/csharp-anterior` | `001-reimplementar-printfarm` | tentativa anterior em C#, só referência | local |

Ordem de mescla: `pedro/001-fundacao` → base; `pedro/001-us1-lotes-fila`
→ base; `pedro/001-guia-agentes` → base. As próximas histórias partem
da base com as três mescladas.

Como rodar e como verificar: `AGENTS.md`, seções 1 e 7.

Decisões de equipe em aberto (`plan.md`, "Achados de analysis.md"): C1,
I1 (bloqueia T041), U1 (bloqueia T064) e A2 (parte de T052).

Próximo passo da feature 001: mesclar as três branches; decidir os
achados; depois US5, ou US2, US4 e US6 em paralelo, cada uma com
`/farm.historia <brief>`.
