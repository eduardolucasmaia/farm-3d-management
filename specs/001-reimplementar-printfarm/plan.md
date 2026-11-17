# Implementation Plan: Reimplementar o núcleo da farm

**Branch**: `001-reimplementar-printfarm` | **Date**: 2026-11-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-reimplementar-printfarm/spec.md`

## Summary

Reimplementar o núcleo do PrintFarm (cadastro, orçamento, pedido, lote de produção, fila, execução, estoque, compra, fatura e painel) num código novo, sem copiar o legado. As regras de prancha, reserva integral, compatibilidade, dois estados e custo ficam em funções puras. A API e a SPA só traduzem. A primeira fatia demonstrável é o pedido aprovado virando 3 lotes na fila para 10 peças com 4 por prancha.

A revisão de 2026-11-17 incorpora as cinco respostas de `spec.md#clarifications`. Mantém a stack e a estrutura existentes. Nenhuma implementação ou tarefa foi executada nesta rodada.

| Decisão da clarificação | Efeito no desenho |
|-------------------------|-------------------|
| Material real obrigatório na falha, aceitando zero | `PrintRun.ActualMaterialG` também fecha falhas; consumo positivo gera baixa rastreada e zero não gera movimento de saída. |
| Completar reserva ao registrar reimpressão | Preservar a reserva restante; tentar somente o complemento integral; falta de saldo bloqueia o início, sem desfazer a falha e o consumo. |
| Consumo excedente usa saldo livre FIFO | Planejar a baixa sobre a reserva própria e o saldo livre, sem usar reservas alheias; insuficiência do consumo aborta a operação inteira. |
| Perfil preservado na liberação | Guardar os três parâmetros da prancha em `ProductionLot`; reimpressão não relê o perfil editável. |
| Cancelamento antes da execução e sem financeiro | Uma operação cancela pedido e lotes pendentes, remove a fila, libera reservas e grava a trilha; início, fatura ou pagamento impedem cancelamento. |

## Technical Context

**Language/Version**: C# / .NET 8 (API e domínio); TypeScript no Vue 3 + Vite 6 (SPA)

**Primary Dependencies**: ASP.NET Core, EF Core 8, ASP.NET Core Identity, JWT Bearer, Vue 3, Vue Router, Vitest, xUnit

**Storage**: SQL Server (Docker Compose no desenvolvimento). Testes de orquestração: SQL Server real em banco exclusivo e descartável, separado da aplicação. InMemory não valida transações. Arquivo 3D em disco, caminho relativo no banco. Sem banco de jobs.

**Testing**: xUnit sem banco para corte, FIFO, consumo, complemento, preservação do perfil e condições de cancelamento, começando pelo teste vermelho. Integração xUnit com SQL Server isolado para rollback, repetição e concorrência. Vitest para o guarda de rota. Jornadas em `quickstart.md`. Não substituir integração transacional por EF InMemory.

**Target Platform**: Navegador moderno contra API HTTP local ou de oficina. Desenvolvimento com .NET CLI e Docker; comandos do guia em PowerShell.

**Project Type**: Aplicação web (API + SPA)

**Performance Goals**: Cadastro e consulta simples respondem em tempo de uso interativo na rede local da oficina (ordem de algumas centenas de milissegundos). Sem meta de vazão pública. O alvo de algumas centenas de milissegundos é hipótese de desenho, não SLA aprovado. Registrar medições no piloto; esta revisão não inventa metas de disponibilidade, RPO ou RTO.

**Constraints**: Núcleo de domínio sem EF, HTTP ou UI. HTTPS em produção. Senha só como hash do Identity. Chave de assinatura do JWT só por configuração, nunca no repositório. CORS com origem explícita fora de desenvolvimento. Sem NF-e, boleto, telemetria, otimização de fila ou assistente. Exemplos de tela marcados como fictícios.

**Scale/Scope**: Uma oficina. Alvo de desenho, não métrica medida: até 20 pessoas ao mesmo tempo e 50 impressoras. Oito histórias. Fora o que a spec lista em FR-026.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Antes da pesquisa | Depois do desenho |
|-----------|-------------------|-------------------|
| I. A constituição manda | Passa. Stack não está na constituição; entra neste plan. | Passa. research.md registra a escolha e o que foi descartado. |
| II. Domínio puro, casca fina | Passa. O plan separa Domain de Api, Infrastructure e web. | Passa. data-model.md e os contratos não colocam regra em controller. |
| III. Teste antes da regra | Exige teste vermelho antes de cada regra nova. | Desenho inclui provas unitárias e SQL Server em quickstart.md. A ordem e a cobertura de tasks.md precisam ser atualizadas por `$speckit-tasks` antes da implementação. |
| IV. Dois estados | Passa. A spec separa lote e impressora. | Passa no desenho. Falha com reimpressão devolve o lote à fila, mas deixa a impressora aguardando retirada. A retirada usa a execução que ocupava a mesa e não altera a reimpressão. |
| V. Rastreio sem baixa duplicada | Exige reserva integral, consumo único e trilha em cada mudança. | Passa no desenho. Consumo, complemento, cancelamento e trilha compartilham transações; repetição terminal não grava baixa. Registro mínimo de auditoria acompanha a escrita desde US1, sem esperar a tela de US8. |
| VI. Estimativa explícita | Passa. FR-023. | Passa. CostEstimate sem total se falta premissa. Frase da taxa no resultado. |
| VII. Escopo parado | Passa. FR-026. | Passa. research.md item 14 não cria assistente, fiscal nem telemetria. |
| VIII. Dado fictício marcado | Passa. FR-025. | Passa. FarmSettings.ExamplesAreFictional permanece verdadeiro. |

Nenhuma violação constitucional identificada no desenho revisado. Isso não comprova implementação. A regeneração das tarefas e as provas abaixo são condições para implementar esta revisão.

## Regras e operações atômicas

O domínio recebe valores e devolve decisões e alocações. Não conhece EF, isolamento SQL, HTTP ou o container. A aplicação coordena cada operação por uma interface de transação implementada em Infrastructure; o controller só traduz os resultados.

- `ReleaseLots` copia `PiecesPerPlate`, `MinutesPerPlate` e `GramsPerPlate` para campos próprios de cada lote de produção. Edição posterior não muda corte, reserva, custo estimado baseado nas quantidades planejadas nem reimpressão. A fila inicial sem impressora é criada junto da liberação para cumprir US1-AS1; atribuir uma máquina continua sendo ação explícita.
- `RunExecution` calcula o consumo sobre a reserva do próprio lote de produção, em ordem FIFO, e cobre somente o excesso com saldo livre. Valida a quantidade inteira antes de persistir. Conclusão exige material positivo; falha exige material maior ou igual a zero. Consumo terminal tem uma única baixa lógica por execução, detalhada por lote de material e custo em `StockMovement`.
- Se faltar material para o consumo real, a transação não altera execução, lote de produção, impressora, reserva ou estoque. Se o consumo couber e faltar somente o complemento da reimpressão, a transação confirma a falha, a baixa e a execução nova em Planned; preserva a reserva restante sem complemento parcial. O impedimento é `missingMaterialG`, calculado, sem novo estado de lote.
- O complemento é `max(0, PlannedGrams - reserva restante)`, integral e FIFO. É tentado no registro da reimpressão e novamente na tentativa de início. Sem saldo, o novo início é recusado. Ao iniciar uma reimpressão, ativar a execução Planned já ligada à anterior, sem criar outra execução planejada duplicada.
- Uma conclusão libera eventual sobra da reserva. Falha sem reimpressão libera a sobra; com reimpressão, mantém a sobra e tenta completar. Cada redução de reserva é conciliada com as movimentações na mesma transação.
- `CancelOrder` consulta execuções já iniciadas, faturas e pagamentos do pedido. Se houver qualquer um, recusa sem mudanças. Caso contrário, cancela pedido e lotes pendentes, remove os itens de fila e libera reservas na mesma transação. Uma execução Planned sem StartedAt não impede cancelamento; ela é removida com o planejamento, sem inventar estado novo no enum de execução.
- A trilha é gravada em cada operação desde a primeira história. US8 acrescenta a consulta restrita, não adia a captura dos eventos.

A infraestrutura usa transações curtas `Serializable`, incluindo as leituras que fundamentam a decisão. Início de execução, liberação, consumo, recebimento, faturamento, pagamento e cancelamento seguem a mesma disciplina de consulta do pedido e acesso ordenado aos saldos. Assim, cancelar concorrentemente com iniciar ou faturar não pode confirmar os dois resultados. Não esperar interação humana dentro da transação.

Retentativas automáticas de conexão ficam desabilitadas nesta primeira implementação. Deadlock ou conflito com rollback confirmado vira conflito de aplicação e resposta 409, com recarregamento pelo cliente. Falha de transporte ou commit sem resultado conhecido vira 503; o cliente consulta o estado persistido antes de tentar novamente. Não repetir apenas `SaveChanges` nem traduzir toda falha de banco como conflito. As exceções específicas são traduzidas em Infrastructure, preservando a causa e sem expor SQL ou segredos na API. As fontes e as alternativas estão em `research.md`, itens 3 e 15.

## Rastreabilidade do desenho

Cada linha liga um requisito à decisão e à prova planejada. São provas a implementar, sem marcação de execução concluída.

| Requisito | Responsabilidade e contrato | Prova planejada |
|-----------|----------------------------|-----------------|
| FR-001 | Identidade e políticas por papel em contracts/auth.md | Login, sessão ausente e papel recusado na seção 2 do quickstart. |
| FR-002 | Admin cria usuário; Produção só lista para vínculo | Usuário Operador sem escrita de cliente. |
| FR-003 | Cadastros e validações em contracts/cadastros.md | Cadastrar cliente, modelo, perfil, impressora e operador. |
| FR-004 | Perfil positivo e preço separado de custo | Testes de limite e rótulos distintos. |
| FR-005 | Limite de manutenção e compatibilidade de material | Limite ausente recusado; lista vazia aceita qualquer material. |
| FR-006 | Máquina de estados do orçamento em contracts/comercial.md | Aprovação e rejeição legais e ilegais. |
| FR-007 | Expiração pelo processamento horário | ValidUntil vencido expira só os estados elegíveis. |
| FR-008 | Conversão de orçamento em pedido em transação | Duas tentativas, inclusive concorrentes, geram um único pedido. |
| FR-009 | CancelOrder e bloqueio de pedido pendente | Cancelar com reserva; recusar após execução, fatura ou pagamento; testar corrida entre essas ações. |
| FR-010 | Leitura comercial com composição das linhas | Listagem contém modelo, material, quantidade e subtotal. |
| FR-011 | Corte e campos preservados em ProductionLot | Cenário 10/4; editar perfil sem mudar lotes e reimpressões. |
| FR-012 | Reserva FIFO integral em ReleaseLots | Recusa integral da linha, repetição e disputa do mesmo saldo. |
| FR-013 | Compatibilidade e ocupação em EnqueueLot e início | Máquina incompatível, inativa, ocupada ou indisponível recusada. |
| FR-014 | Estados independentes em RunExecution | Conclusão e falha mantêm a impressora ocupada. |
| FR-015 | Retirada e preparação da execução que ocupava a mesa | Retirada de falha não regride a reimpressão. |
| FR-016 | Manutenção após preparação | Horas no limite bloqueiam; nota obrigatória zera as horas. |
| FR-017 | Consumo real em contracts/producao.md | Excesso FIFO, reservas alheias intactas e rollback integral por insuficiência. |
| FR-018 | Falha e complemento de reimpressão | Zero, omissão, negativos, consumo único, complemento integral ou início bloqueado. |
| FR-019 | Recebimento em contracts/estoque-compras.md | Compra em kg, recebimento em g, custo e saldo no mesmo commit. |
| FR-020 | Sugestão de recompra por saldo livre | Sem ponto não sugere; abaixo do ponto sugere a diferença. |
| FR-021 | Lançamentos em contracts/financeiro.md | Pendência ou cancelamento recusa; lançamento disputa com cancelamento. |
| FR-022 | Consultas em contracts/painel.md | Consumo de sete dias inclui produção e desperdício das falhas. |
| FR-023 | Custo puro e previsão com premissas | Parcelas separadas; ausência impede total; perfil preservado fornece quantidades. |
| FR-024 | Trilha e movimento por lote de material | Autor, estados, gramas, custo e origem persistidos junto da ação. |
| FR-025 | Marca de dados fictícios nos exemplos | Verificação da marca nas jornadas do quickstart. |
| FR-026 | Contratos limitados ao núcleo autorizado | Guia não requer fiscal, banco, telemetria, otimização ou assistente. |

## Próximo ajuste das tarefas

`tasks.md` foi lido, mas não é saída desta execução de `$speckit-plan`. Antes de implementar, `$speckit-tasks` precisa incorporar os parâmetros preservados em T016/T019/T021/T026/T027, substituir InMemory em T027/T056/T069, incluir consumo e complemento em T052–T058, cancelamento e concorrência em T039/T043 e a captura de auditoria desde US1 em vez de somente T070. Reordenar os testes antes das regras e adicionar as provas SQL Server de rollback e concorrência. Os identificadores citados servem para localizar lacunas do arquivo atual; nenhum foi concluído nesta revisão.

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
