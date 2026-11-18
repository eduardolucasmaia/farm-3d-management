# Implementation Plan: Reimplementar o núcleo da farm

**Branch**: `001-reimplementar-printfarm` | **Date**: 2026-11-16 | **Revisado**: 2026-11-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-reimplementar-printfarm/spec.md`

**Revisão de 2026-11-17**: a stack mudou de .NET 8 + SQL Server para Node.js + TypeScript + SQLite (research.md item 1). Spec, contratos de rota e roteiros do quickstart não mudaram de comportamento.

**Integração de 2026-11-17**: a revisão de desenho publicada em paralelo (clarify, plan, tasks e analyze sobre .NET) foi integrada. As cinco clarificações da spec e as regras derivadas entraram em data-model.md, contracts/, quickstart.md, research.md (itens 17 a 20) e tasks.md (T080–T088). As decisões específicas de .NET e SQL Server foram traduzidas para o desenho em SQLite; a lista de tarefas em C# foi substituída. `analysis.md` é o relatório daquela revisão; a situação de cada achado está em "Achados de analysis.md" abaixo.

## Summary

Reimplementar o núcleo do PrintFarm (cadastro, orçamento, pedido, lote de produção, fila, execução, estoque, compra, fatura e painel) num código novo, sem copiar o legado. As regras de prancha, reserva integral, compatibilidade, dois estados e custo ficam em funções puras. A API e a SPA só traduzem. A primeira fatia demonstrável é o pedido aprovado virando 3 lotes na fila para 10 peças com 4 por prancha.

## Technical Context

**Language/Version**: TypeScript executado direto pelo Node.js 24 LTS ou mais novo (API e domínio); TypeScript no Vue 3 + Vite 6 (SPA)

**Primary Dependencies**: servidor: `fastify` 5, `@fastify/cors`, `@fastify/multipart`, `jose`. Desenvolvimento: `typescript` 5.9, `vitest` 4.1.12 ou mais novo (versões anteriores têm falhas críticas conhecidas), `@types/node` 24. SPA: as de `web/package.json`, com `vue-tsc` 3 e sem `@vue/test-utils`, que nenhum teste usa e trazia dependências vulneráveis. `npm audit` MUST ficar sem achado alto ou crítico. Nenhuma outra dependência sem registro neste plan ou em research.md

**Storage**: SQLite embutido do Node (`node:sqlite`), arquivo em `FARM3D_DB_PATH`. Testes de orquestração: o mesmo SQLite em `:memory:`. Migrações SQL numeradas em `server/migrations/`. Arquivo 3D em disco, caminho relativo no banco. Sem Docker

**Testing**: Vitest. Regras puras e orquestração escritas antes da implementação. Teste de arquitetura para a pureza do núcleo. Teste de 401 e 403 com `app.inject`. Vitest para o guarda de rota da SPA. Jornadas em `quickstart.md`

**Target Platform**: Navegador moderno contra API HTTP local ou de oficina, num único processo Node. Windows é o ambiente de desenvolvimento deste repositório; nada no desenho depende de Windows

**Project Type**: Aplicação web (API + SPA), dois workspaces npm

**Performance Goals**: Cadastro e consulta simples respondem em tempo de uso interativo na rede local da oficina (ordem de algumas centenas de milissegundos). Sem meta de vazão pública

**Constraints**: Núcleo de domínio sem banco, HTTP, relógio ou UI. Valores numéricos inteiros em escala fixa (research.md item 11). Transação síncrona (research.md item 3). Sintaxe TypeScript apagável (research.md item 14). HTTPS em produção, por proxy à frente do processo. Senha só como hash `scrypt`. Chave do JWT só por variável de ambiente, nunca no repositório. CORS com origem explícita fora de desenvolvimento. Sem NF-e, boleto, telemetria, otimização de fila ou assistente. Exemplos de tela marcados como fictícios

**Scale/Scope**: Uma oficina, um processo, um arquivo de banco. Alvo de desenho, não métrica medida: até 20 pessoas ao mesmo tempo e 50 impressoras. Oito histórias. Fora o que a spec lista em FR-026

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Conferido contra a constituição 2.0.0 em 2026-11-17, depois da troca de stack. Cada linha é um gate da seção "Gates verificáveis" e aponta a evidência.

| Princípio | Gate | Antes da pesquisa | Depois do desenho (evidência) |
|-----------|------|-------------------|-------------------------------|
| I. Domínio puro, casca fina | Núcleo sem persistência, HTTP, relógio e UI | A estrutura separa `server/src/domain/` das demais pastas | T007 `domain-purity.test.ts` proíbe import fora do domínio, `node:*`, pacote npm, `Date.now()`, `new Date()` sem argumento, `Math.random()`, `process` e `console` |
| I | Nenhuma decisão fora do núcleo | research.md item 2 | `release-lots` chama `splitLots` e `allocateFifo` (T027); `enqueue-lot` chama `checkPrinterCompatibility` (T028); `quote-lifecycle` chama `transitionQuote` (T041); `run-execution` chama `transitionPrinter` e `transitionLot` (T056); `PATCH` de pedido chama `transitionSalesOrder` (T078) |
| II. Teste antes da regra | Teste da regra precede a regra | research.md item 13 | T009, T011, T016–T018, T032, T039, T046, T052–T053, T059, T063–T064, T077 vêm antes da tarefa que implementa a regra |
| II | Orquestração com teste próprio, antes | Testes com SQLite `:memory:` em `server/tests/application/` | T026 antes de T027; T055 antes de T056; T069 antes de T070; T010 testa migração e rollback |
| II | Roteiro por história | quickstart.md previsto | Seções 1 a 8 de quickstart.md, uma por história |
| III. Dois estados | Nenhum estado derivado do outro | FR-014 | Duas tabelas de transição em data-model.md; T052 e T053; quickstart seção 5 passos 3 a 5 |
| IV. Rastreio sem baixa duplicada | Saldo atômico e não repetível | FR-012 e FR-017 | T010 prova o rollback de `withTransaction`; T017 e T026 (saldo insuficiente, zero reservas; repetição recusada); T055 (saída única, consumo acima da reserva sem tocar reserva alheia); T085 (Unreserve uma vez no cancelamento); T088 (disputas com duas conexões, research.md item 17) |
| IV | Trilha em toda mudança de estado | FR-024 | T069, T070; `AuditLog` e `StockMovement` em data-model.md |
| V. Estimativa explícita, dado fictício marcado | Sem total sem premissa, sem número inventado | FR-023, FR-005 | T063 (`total` nulo e `missingPremises`; parcelas arredondadas uma vez); T032 (limite de manutenção obrigatório, sem padrão) |
| V | Exemplo marcado | FR-025 | `farm_settings.examples_are_fictional` com `CHECK (= 1)` (T010); quickstart seção 7 passo 5 |
| VI. Escopo parado | Nada da lista "Fora" criado | FR-026 | research.md item 16; T076 |
| VI | Sem estrutura sem requisito | FR-003 | T033 (`MasterDataRules`); T034 (Masters) e T035 (rotas de cadastro) em `server/src/api/routes/cadastros/`; Key Entities em spec.md |
| V | Custo estimado MUST permanecer distinto do preço de venda | FR-004 | T032 (`master-data-rules.test.ts`) valida preço de venda ≠ custo e peças/minutos/gramas por prancha > 0; FR-004 adicionado nesta edição |
| VI | Sem estrutura sem requisito | FR-006 | T041 implementa quote-lifecycle com rascunho → enviado → aprovado/rejeitado; rejeição registra motivo em Notes |
| VI | Sem estrutura sem requisito | — | Sem ORM, fila, cron, compilação nem Docker; Complexity Tracking vazio |
| VII. Acesso por papel, segredo fora do repositório | Papéis por rota, recusa no servidor | FR-001, FR-002 | Matriz de papéis em contracts/; `requireRoles` por rota (T013); T013 `authz.test.ts` cobre 401 e 403; quickstart seções 2 e 8 |
| VII | Nenhum segredo versionado | Constraints acima | T004 (`.env.example` sem valor de segredo; `.env` e `data/` ignorados); T006 recusa subir sem `JWT_SIGNING_KEY`; T011 (senha de semente só por variável, só em development) |

Nenhuma violação. As duas observações da revisão anterior foram resolvidas: o teste de orquestração agora precede o caso de uso (T026 → T027, T055 → T056) e a recusa 403 tem teste automatizado (T013).

## Achados de analysis.md

| ID | Severidade | Situação neste desenho | Encaminhamento |
|----|-----------|------------------------|----------------|
| C1 | CRITICAL | Aberto. O cenário 9 da US1 (reimpressão preserva os parâmetros) só pode ser provado quando existir reimpressão (US5). A parte que a US1 consegue provar (perfil editado não muda lotes liberados) está em T083 | Mover o cenário 9 da US1 para a US5 por `/speckit.clarify`, ou aceitar a prova em T055. Decisão da equipe antes de mesclar a US1 |
| I1 | HIGH | Aberto. A geração de pedido por orçamento recebe só a data prometida, mas cor e tamanho são obrigatórios quando o modelo os oferece | Decidir antes de T041: guardar cor e tamanho na linha do orçamento, ou pedir na geração do pedido. Corrigir contracts/comercial.md primeiro |
| U1 | HIGH | Aberto. A previsão devolve horas pendentes e uma nota, sem término estimado verificável | Definir a saída de `GET /api/dashboard/backlog` antes de T064 |
| G1 | MEDIUM | Parcial. Product já tem material padrão; falta o vínculo com o arquivo 3D | Acrescentar `File3DId` a Product em T034 (migração 0003) |
| I2 | MEDIUM | Não se aplica: referia-se à numeração da lista em C# | — |
| A1 | MEDIUM | Resolvido: valores inteiros em mg, prancha parcial arredondada para cima (research.md itens 6 e 11) | — |
| A2 | MEDIUM | Resolvido: "Sim, execução que falha também soma o tempo real de impressão às horas acumuladas. AccumulatedSeconds é uma métrica da impressora, independente do estado do lote de produção." (contexto: FR-017 "uma única saída de estoque"; estado Preparing → InMaintenance verifica AccumulatedSeconds ≥ MaintenanceLimitHours × 3600) | — |

## Project Structure

### Documentation (this feature)

```text
specs/001-reimplementar-printfarm/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── auth.md
│   ├── cadastros.md
│   ├── comercial.md
│   ├── producao.md
│   ├── estoque-compras.md
│   ├── financeiro.md
│   └── painel.md
└── tasks.md
```

### Source Code (repository root)

```text
package.json                 # workspaces: server, web
package-lock.json            # versionado; versões fixadas aqui
.env.example                 # só nomes de variáveis e valores não secretos
server/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── migrations/              # 0001-foundation.sql … 0009-audit.sql
├── src/
│   ├── domain/              # puro: sem import fora daqui
│   │   ├── enums.ts
│   │   ├── units.ts
│   │   ├── result.ts
│   │   ├── entities/        # só tipos
│   │   └── rules/           # um arquivo por regra, kebab-case
│   ├── application/
│   │   └── use-cases/       # um arquivo por caso de uso
│   ├── infrastructure/
│   │   ├── config.ts
│   │   ├── db/              # único lugar que importa node:sqlite
│   │   ├── repositories/
│   │   ├── auth/            # scrypt e JWT
│   │   ├── seed/
│   │   ├── files/
│   │   └── jobs/
│   └── api/
│       ├── app.ts           # buildApp(deps): usado pela subida e pelos testes
│       ├── main.ts
│       └── routes/          # um arquivo por contrato ou recurso
└── tests/
    ├── architecture/
    ├── domain/
    ├── application/
    ├── infrastructure/
    └── api/
web/
├── src/
│   ├── pages/
│   ├── router/
│   └── stores/
└── tests/
```

**Structure Decision**: API e SPA em workspaces separados, com o domínio numa pasta que só importa a si mesma. Nomes de arquivo em kebab-case; função exportada em camelCase; tipo em PascalCase com o identificador do vocabulário da constituição. `docs_apoio/software_ref` permanece só como leitura. A SPA usa rótulos da constituição; a API usa os recursos em inglês listados nos contratos (Quote, SalesOrder, MaterialLot) sem colidir com "lote". O código C# e os arquivos .NET deixados por uma implementação anterior (`Farm3d.sln`, `src/`, `docker-compose.yml`) não fazem parte deste desenho; T001 os remove.

## Complexity Tracking

Vazio. A separação em pastas dentro de um único pacote atende o princípio I sem projeto extra.
