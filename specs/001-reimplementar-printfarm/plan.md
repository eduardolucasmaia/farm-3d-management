# Implementation Plan: Reimplementar o núcleo da farm

**Branch**: `001-reimplementar-printfarm` | **Date**: 2026-11-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-reimplementar-printfarm/spec.md`

## Summary

Reimplementar o núcleo do PrintFarm (cadastro, orçamento, pedido, lote de produção, fila, execução, estoque, compra, fatura e painel) num código novo, sem copiar o legado. As regras de prancha, reserva integral, compatibilidade, dois estados e custo ficam em funções puras. A API e a SPA só traduzem. A primeira fatia demonstrável é o pedido aprovado virando 3 lotes na fila para 10 peças com 4 por prancha.

## Technical Context

**Language/Version**: C# / .NET 8 (API e domínio); TypeScript no Vue 3 + Vite 6 (SPA)

**Primary Dependencies**: ASP.NET Core, EF Core 8, ASP.NET Core Identity, JWT Bearer, Vue 3, Vue Router, Vitest, xUnit

**Storage**: SQL Server (Docker Compose no desenvolvimento). Testes de orquestração: EF Core InMemory. Arquivo 3D em disco, caminho relativo no banco. Sem banco de jobs.

**Testing**: xUnit para regras puras e para reserva com InMemory, escritos antes da regra. Vitest para o guarda de rota. Jornadas em `quickstart.md`.

**Target Platform**: Navegador moderno contra API HTTP local ou de oficina. Windows é o ambiente de desenvolvimento deste repositório.

**Project Type**: Aplicação web (API + SPA)

**Performance Goals**: Cadastro e consulta simples respondem em tempo de uso interativo na rede local da oficina (ordem de algumas centenas de milissegundos). Sem meta de vazão pública.

**Constraints**: Núcleo de domínio sem EF, HTTP ou UI. HTTPS em produção. Senha só como hash do Identity. Chave de assinatura do JWT só por configuração, nunca no repositório. CORS com origem explícita fora de desenvolvimento. Sem NF-e, boleto, telemetria, otimização de fila ou assistente. Exemplos de tela marcados como fictícios.

**Scale/Scope**: Uma oficina. Alvo de desenho, não métrica medida: até 20 pessoas ao mesmo tempo e 50 impressoras. Oito histórias. Fora o que a spec lista em FR-026.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Conferido contra a constituição 2.0.0 em 2026-11-17. Cada linha é um gate da seção "Gates verificáveis" e aponta a evidência.

| Princípio | Gate | Antes da pesquisa | Depois do desenho (evidência) |
|-----------|------|-------------------|-------------------------------|
| I. Domínio puro, casca fina | Núcleo sem persistência, HTTP e UI | A estrutura separa `Farm3d.Domain` dos demais projetos | T007 `DomainPurityTests.cs`; T001 proíbe pacote de EF, HTTP ou UI no Domain |
| I | Nenhuma decisão fora do núcleo | research.md item 2 | `ReleaseLots` chama `LotSplit` e `FifoReservation` (T026); `EnqueueLot` chama `PrinterCompatibility` (T028); `QuoteLifecycle` chama `QuoteState` (T041); `RunExecution` usa `PrinterState` e `LotState` (T054, T055) |
| II. Teste antes da regra | Teste da regra precede a regra | research.md item 13 | T016–T018 antes de T022–T024; T032 antes de T033; T039 antes de T040; T046 antes de T047; T052–T053 antes de T054; T059 antes de T060; T063–T064 antes de T065 |
| II | Orquestração com teste próprio | Testes com EF InMemory em `Farm3d.Tests/Stock` | T027, T056 e T069. Observação: T027 e T056 vêm depois do caso de uso; a regra pura que eles orquestram já tem teste anterior |
| II | Roteiro por história | quickstart.md previsto | Seções 1 a 8 de quickstart.md, uma por história |
| III. Dois estados | Nenhum estado derivado do outro | FR-014 | Duas tabelas de transição em data-model.md; T052 e T053; quickstart seção 5 passos 3 a 5 |
| IV. Rastreio sem baixa duplicada | Saldo atômico e não repetível | FR-012 e FR-017 | T017 e T027 (saldo insuficiente, zero reservas; repetição recusada); T056 (saída única) |
| IV | Trilha em toda mudança de estado | FR-024 | T069, T070; `AuditLog` e `StockMovement` em data-model.md |
| V. Estimativa explícita, dado fictício marcado | Sem total sem premissa, sem número inventado | FR-023, FR-005 | T063 (`total` nulo e `missingPremises`); T032 (limite de manutenção obrigatório, sem padrão) |
| V | Exemplo marcado | FR-025 | `FarmSettings.ExamplesAreFictional` (T009); quickstart seção 7 passo 5 |
| VI. Escopo parado | Nada da lista "Fora" criado | FR-026 | research.md item 14; notas de tasks.md |
| VI | Sem estrutura sem requisito | — | Complexity Tracking abaixo |
| VII. Acesso por papel, segredo fora do repositório | Papéis por rota, recusa no servidor | FR-001, FR-002 | Matriz de papéis em contracts/auth.md, cadastros.md e producao.md; 401 e 403 em contracts/cadastros.md; quickstart seções 2 e 8. Observação: a recusa 403 não tem teste automatizado, só o roteiro |
| VII | Nenhum segredo versionado | Constraints acima | T004 e T006 (`.env.example` só com nomes; `.env` ignorado); T011 (senha de semente só por variável, só em Development) |

Nenhuma violação. Duas observações ficam registradas na tabela (ordem de T027 e T056; 403 sem teste automatizado). A tabela de Complexity Tracking justifica só o número de projetos, que o princípio I exige.

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
src/
├── Farm3d.Domain/
│   ├── Entities/
│   ├── Enums/
│   └── Rules/
├── Farm3d.Application/
│   └── UseCases/
├── Farm3d.Infrastructure/
│   ├── Persistence/
│   └── Identity/
├── Farm3d.Api/
│   └── Controllers/
└── Farm3d.Tests/
    ├── Domain/
    └── Stock/
web/
├── src/
│   ├── pages/
│   ├── router/
│   └── stores/
└── tests/
docker-compose.yml
```

**Structure Decision**: API e SPA separados, com o domínio em projeto próprio. Os nomes são Farm3d, não PrintFarm. `docs_apoio/software_ref` permanece só como leitura. A SPA usa rótulos da constituição; a API usa os recursos em inglês listados nos contratos, para bater com o vocabulário já estável do referência (Quote, SalesOrder, MaterialLot) sem colidir com "lote".

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Cinco projetos .NET mais a SPA | O princípio I separa regra, caso de uso, persistência, HTTP e tela | Um projeto único colocaria EF e HTTP no mesmo assembly da regra, e o teste deixaria de ser puro |
