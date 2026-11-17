# Research: Reimplementar o núcleo da farm

**Feature**: `specs/001-reimplementar-printfarm`  
**Date**: 2026-11-16

Cada item fecha uma escolha técnica. A spec não cita stack. Aqui a escolha fica escrita, com o que foi descartado.

## 1. Stack da reimplementação

- **Decision**: .NET 8 (ASP.NET Core) + Vue 3 + Vite + TypeScript + SQL Server + EF Core. Testes de regra em xUnit. Testes de tela mínimos em Vitest.
- **Rationale**: O software de referência (`docs_apoio/software_ref/tecnica/arquitetura.md`) já descreve esse desenho e os comportamentos que a spec pede (reserva, orçamento, papéis). Reimplementar na mesma família permite comparar jornada com a documentação sem copiar o código, que não está neste repositório. A constituição exige núcleo puro: as regras ficam em `Farm3d.Domain`, sem EF e sem HTTP.
- **Alternatives considered**: Um único script, como no laboratório da aula, não comporta papéis, estoque e fila. Outra stack (por exemplo Python + SPA) afastaria a comparação com o referência sem ganho para o experimento. Copiar o fonte do PrintFarm, se aparecesse, violaria "reimplementar".

## 2. Onde vive cada regra

- **Decision**: Funções puras em `src/Farm3d.Domain` para corte de prancha, compatibilidade, custo, máquinas de estado do lote e da impressora, e ordenação FIFO sobre uma lista já carregada. `Farm3d.Application` orquestra o caso de uso e a transação. `Farm3d.Infrastructure` persiste. `Farm3d.Api` e `web/` só traduzem.
- **Rationale**: Princípio I da constituição. O teste vermelho da regra não sobe banco nem navegador.
- **Alternatives considered**: Regra dentro do controller, como partes do legado fazem ao falar com o EF direto. Foi descartado porque o teste deixaria de ser só da regra.

## 3. Persistência e ambiente local

- **Decision**: SQL Server em Docker Compose para o desenvolvimento. Testes de orquestração de estoque usam EF Core InMemory. Não há segundo banco de jobs.
- **Rationale**: O referência fixa SQL Server e transação nas mudanças de estoque e pedido. InMemory basta para provar reserva e recusa sem Docker no teste.
- **Alternatives considered**: SQLite no desenvolvimento. Descartado porque tipo decimal, data com fuso e a comparação com o referência ficam mais fiéis no SQL Server. Hangfire foi descartado no item 5.

## 4. Identidade e papéis

- **Decision**: ASP.NET Core Identity, senha com o hash do Identity, travamento de login após tentativas falhas, sessão por JWT Bearer. Papéis exatamente: Admin, Sales, Production, Purchasing, Operator. Seed de um usuário por papel, com senha só em configuração de desenvolvimento, nunca documentada como senha de produção.
- **Rationale**: A spec pede identificação e os cinco papéis. O referência já separa assim. A spec também pede que admin crie usuário, lacuna da SPA legada, e isso entra em `UsersController`.
- **Alternatives considered**: Sessão por cookie. Descartada porque a SPA e a API sobem separados no desenvolvimento, e o referência já usa bearer. Lista de papéis diferente da spec foi descartada.

## 5. Processamento periódico

- **Decision**: Um `BackgroundService` na API, intervalo de uma hora, que expira orçamentos elegíveis e grava sugestões de recompra e a contagem de prazos. Sem Hangfire.
- **Rationale**: A spec pede o efeito (expirar, sugerir, contar), não um painel de jobs. Hangfire traz armazenamento e painel que a constituição chama de complexidade além da regra. Um serviço hospedado cobre o intervalo horário descrito no módulo comercial do referência.
- **Alternatives considered**: Hangfire, igual ao legado. Descartado pelo princípio VI: não acrescentar estrutura que a regra não exige. Disparo só manual foi descartado porque orçamento vencido ficaria aprovado até alguém lembrar.

## 6. Corte da prancha e prancha parcial

- **Decision**: `LotSplit.Split(pieces, piecesPerPlate, minutesPerPlate, gramsPerPlate)` devolve a lista de lotes. Quantidade de lotes = teto(peças / peças por prancha). Lotes cheios levam os minutos e as gramas da prancha. O último, se incompleto, leva `peçasDoLote / peçasPorPrancha` de ambos. 10 e 4 produzem (4, 100%), (4, 100%), (2, 50%).
- **Rationale**: A constituição manda a regra escrita antes da implementação. Proporção é a conta que fecha o cenário de referência sem inventar tempo mínimo.
- **Alternatives considered**: Última prancha com tempo cheio. Descartada porque cobra capacidade que a prancha não usou. Recusar quantidade que não fecha prancha. Descartada porque o cenário de 10 com 4 deixaria de existir.

## 7. Reserva FIFO

- **Decision**: Função pura ordena lotes de material por `ReceivedAt` e depois por `Id`, e aloca gramas até cobrir o necessário. Se a soma do livre não cobre, devolve recusa e alocação vazia. A aplicação grava reservas e movimentações na mesma transação.
- **Rationale**: FR-012. Ordem por data e desempate por identificador torna o teste estável.
- **Alternatives considered**: Reserva parcial do que houver. A spec recusa. Média de custo sem lote. A spec exige o lote mais antigo.

## 8. Estados da impressora

- **Decision**: Campo operacional novo, além de ativa/inativa. Transições só pelos eventos da spec (iniciar, concluir impressão, confirmar retirada, concluir preparação, entrar em manutenção, confirmar manutenção, marcar indisponível). O legado só tinha `IsActive` e "impressoras rodando" no painel. O estado operacional é exigência da constituição, não cópia do legado.
- **Rationale**: Princípio III. Sem esse campo, "impressão concluída" vira "máquina livre".
- **Alternatives considered**: Derivar o estado da execução aberta. Descartado porque a spec proíbe inferir um estado do outro. A retirada e a preparação não são uma execução.

## 9. Motivos de falha

- **Decision**: Lista fechada `None`, `BedAdhesion`, `Clog`, `LayerShift`, `OutOfMaterial`, `Other`.
- **Rationale**: O dicionário do referência corta a lista em "BedAdhesion, Clog, … Other". A spec precisa de uma lista testável. Estes seis cobrem os nomes que o documento mostra e os dois casos que a operação de impressão 3D não consegue registrar sem eles (deslocamento e falta de material).
- **Alternatives considered**: Texto livre. Descartado porque a spec pede lista fechada. Inventariar o enum no fonte do legado. O fonte não está neste repositório.

## 10. Custo e calendário

- **Decision**: `CostEstimate.Compute` recebe gramas, preço por grama, horas, kWh por hora, tarifa e taxa de hora-máquina. Qualquer premissa nula devolve lacuna, sem total. A taxa não inclui filamento nem energia; o tipo do resultado carrega essa frase. Previsão de término: horas pendentes dos lotes compatíveis com cada máquina disponível no calendário, em paralelo. Se todas as máquinas consideradas têm a mesma taxa de peças por hora no perfil em uso, o painel pode mostrar a aproximação "horas ÷ máquinas equivalentes" e MUST exibir essa frase. Calendário padrão segunda–sexta 08:00–18:00, gravado nos parâmetros da farm.
- **Rationale**: FR-023 e princípio V.
- **Alternatives considered**: Total sempre numérico com tarifa zero. A spec proíbe número sem premissa.

## 11. Dinheiro e gramas

- **Decision**: Dinheiro em `decimal`, quantizado a `0.01` com metade para cima. Gramas em `decimal` com três casas. Comparação de saldo usa o valor exato antes de quantizar a exibição.
- **Rationale**: Edge case da spec. Três casas evitam que 0,001 g suma e libere uma reserva que não cabe.
- **Alternatives considered**: `double`. Descartado em dinheiro e em saldo.

## 12. Arquivos 3D

- **Decision**: Metadado e rótulo de versão. O arquivo em si fica em disco sob um diretório configurado, fora do banco. O banco guarda o caminho relativo.
- **Rationale**: A spec pede nome e versão, não processamento de malha.
- **Alternatives considered**: Blob no banco. Descartado como complexidade sem regra que o exija.

## 13. Testes que a constituição exige

- **Decision**: Cada regra dos itens 6 a 10 nasce como teste xUnit vermelho em `src/Farm3d.Tests/Domain`. A orquestração de reserva com persistência nasce como teste em `src/Farm3d.Tests/Stock` com EF InMemory. Vitest cobre só o guarda de rota: usuário sem papel não abre a tela. O restante da jornada está em `quickstart.md`.
- **Rationale**: Princípio II. A spec não pede suíte de ponta a ponta de HTTP.
- **Alternatives considered**: Só teste manual. Viola a constituição. `WebApplicationFactory` para todo endpoint. Fica fora desta feature; o referência também não tinha.

## 14. O que não entra no desenho

- **Decision**: Sem projeto de assistente, sem cliente de nota fiscal, sem SDK de impressora, sem fila automática.
- **Rationale**: FR-026 e a seção "Fora de escopo" da constituição.
- **Alternatives considered**: Deixar o endpoint de chat desligado. Mesmo desligado, o módulo seria estrutura sem regra. Não criar.
