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

| Princípio | Antes da pesquisa | Depois do desenho |
|-----------|-------------------|-------------------|
| I. A constituição manda | Passa. Stack não está na constituição; entra neste plan. | Passa. research.md registra a escolha e o que foi descartado. |
| II. Domínio puro, casca fina | Passa. O plan separa Domain de Api, Infrastructure e web. | Passa. data-model.md e os contratos não colocam regra em controller. |
| III. Teste antes da regra | Passa. Regras de prancha, FIFO, estado, custo e compatibilidade nascem como teste vermelho. | Passa. tasks.md ordena o teste antes da função. quickstart.md cobre a jornada. |
| IV. Dois estados | Passa. A spec separa lote e impressora. | Passa. data-model.md tem as duas máquinas de transição. Concluir impressão não leva a Disponível. |
| V. Rastreio sem baixa duplicada | Passa. FR-012, FR-017 e FR-024. | Passa. Reserva vazia quando falta saldo. Segunda conclusão recusada. AuditLog e StockMovement no modelo. |
| VI. Estimativa explícita | Passa. FR-023. | Passa. CostEstimate sem total se falta premissa. Frase da taxa no resultado. |
| VII. Escopo parado | Passa. FR-026. | Passa. research.md item 14 não cria assistente, fiscal nem telemetria. |
| VIII. Dado fictício marcado | Passa. FR-025. | Passa. FarmSettings.ExamplesAreFictional permanece verdadeiro. |

Nenhuma violação. A tabela de Complexity Tracking justifica só o número de projetos, que o princípio II exige.

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
| Cinco projetos .NET mais a SPA | O princípio II separa regra, caso de uso, persistência, HTTP e tela | Um projeto único colocaria EF e HTTP no mesmo assembly da regra, e o teste deixaria de ser puro |
