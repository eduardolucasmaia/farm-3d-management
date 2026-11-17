# Research: Reimplementar o núcleo da farm

**Feature**: `specs/001-reimplementar-printfarm`  
**Date**: 2026-11-17

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

- **Decision**: Manter SQL Server em Docker Compose no desenvolvimento e usar bancos SQL Server exclusivos e descartáveis para integração transacional. InMemory não serve como evidência de rollback, restrições relacionais ou concorrência. Não há segundo banco de jobs.
- **Rationale**: As clarificações de consumo, complemento e cancelamento exigem atomicidade entre várias leituras e gravações. O provedor InMemory não suporta transações, conforme a [documentação oficial de testes](https://learn.microsoft.com/en-us/ef/core/testing/testing-without-the-database#inmemory). A [comparação de estratégias](https://learn.microsoft.com/en-us/ef/core/testing/choosing-a-testing-strategy) fundamenta testar essas garantias no mesmo provedor da aplicação.
- **Alternatives considered**: InMemory descartado para testes transacionais. SQLite não comprova o isolamento e as diferenças de SQL Server. Regras puras continuam sem banco. Hangfire segue fora pelo item 5.

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
- **Rationale**: A constituição manda a regra escrita antes da implementação. Proporção fecha o cenário de referência sem inventar tempo mínimo. Na liberação, copiar os três parâmetros da prancha para o lote de produção. Seus PlannedGrams e PlannedMinutes, inclusive na reimpressão, não são recalculados após editar o perfil, conforme FR-011.
- **Alternatives considered**: Última prancha com tempo cheio. Descartada porque cobra capacidade que a prancha não usou. Recusar quantidade que não fecha prancha. Descartada porque o cenário de 10 com 4 deixaria de existir.

## 7. Reserva FIFO

- **Decision**: Função pura ordena lotes de material por `ReceivedAt` e depois por `Id`, e aloca gramas até cobrir o necessário. Se a soma do livre não cobre, devolve recusa e alocação vazia. A aplicação grava reservas e movimentações na mesma transação.
- **Rationale**: FR-012. Ordem por data e desempate por identificador torna o teste estável. A mesma ordenação vale para consumo da reserva própria, excesso em saldo livre e complemento da reimpressão. A reserva de outro lote de produção nunca fica disponível para cobrir excesso.
- **Alternatives considered**: Reserva parcial do que houver. A spec recusa. Média de custo sem lote. A spec exige o lote mais antigo.

## 8. Estados da impressora

- **Decision**: Campo operacional novo, além de ativa/inativa. Transições só pelos eventos da spec (iniciar, concluir impressão, confirmar retirada, concluir preparação, entrar em manutenção, confirmar manutenção, marcar indisponível). O legado só tinha `IsActive` e "impressoras rodando" no painel. O estado operacional é exigência da constituição, não cópia do legado.
- **Rationale**: Princípio III. Sem esse campo, "impressão concluída" vira "máquina livre".
- **Alternatives considered**: Derivar o estado da execução aberta. Descartado porque a spec proíbe inferir um estado do outro. A retirada e a preparação não são uma execução. `Printer.OccupyingPrintRunId` identifica a execução física da mesa até a retirada; a criação de uma reimpressão Planned não troca esse vínculo nem libera a impressora. A retirada de uma falha não muda o estado atual do lote de produção ou de uma reimpressão.

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

- **Decision**: Cada regra dos itens 6 a 10 nasce como teste xUnit vermelho em `src/Farm3d.Tests/Domain`. A orquestração com persistência nasce como teste em `src/Farm3d.Tests/Stock` com SQL Server isolado. Cobrir rollback após gravação intermediária, consumo concorrente, conclusão/falha repetidas e cancelamento disputando com início, fatura ou pagamento. Os novos cálculos e condições de cancelamento começam em xUnit puro antes de suas implementações. Vitest cobre só o guarda de rota: usuário sem papel não abre a tela. O restante da jornada está em `quickstart.md`.
- **Rationale**: Princípio II. A spec não pede suíte de ponta a ponta de HTTP.
- **Alternatives considered**: Só teste manual. Viola a constituição. `WebApplicationFactory` para todo endpoint. Fica fora desta feature; o referência também não tinha.

## 14. O que não entra no desenho

- **Decision**: Sem projeto de assistente, sem cliente de nota fiscal, sem SDK de impressora, sem fila automática.
- **Rationale**: FR-026 e a seção "Fora de escopo" da constituição.
- **Alternatives considered**: Deixar o endpoint de chat desligado. Mesmo desligado, o módulo seria estrutura sem regra. Não criar.

## 15. Transações e concorrência

- **Decision**: Operações de estoque e as transições que podem disputar um cancelamento usam transações SQL Server curtas em `Serializable`. Leituras de pedido, execução, financeiro, reservas e saldos ocorrem dentro da transação; mudanças, movimentos e trilha são confirmados juntos. Acesso em ordem estável de pedido, lote de produção, impressora e saldos reduz deadlocks. Sem retries automáticos nesta primeira implementação; conflito com rollback confirmado vira 409, falha de infraestrutura ou commit incerto vira 503 e exige consultar o estado antes de repetir.
- **Rationale**: Escolha de desenho inferida das garantias de [transações do EF Core](https://learn.microsoft.com/en-us/ef/core/saving/transactions) e do [isolamento Serializable no SQL Server](https://learn.microsoft.com/en-us/sql/t-sql/statements/set-transaction-isolation-level-transact-sql?view=sql-server-ver16#serializable). Proteger só SaveChanges não inclui as leituras de saldo e de ausência de execução ou fatura feitas antes dele.
- **Alternatives considered**: Somente rowversion nas linhas existentes não cobre por si só a ausência de registros relacionados. Retries automáticos poderiam ser adicionados envolvendo a operação inteira, com contexto novo e verificação de commit incerto, como explica a [documentação de resiliência](https://learn.microsoft.com/en-us/ef/core/miscellaneous/connection-resiliency). Repetir apenas SaveChanges foi descartado.

## 16. Consumo real e reserva de reimpressão

- **Decision**: Regra pura planeja o consumo sobre as reservas próprias e o excesso sobre saldo livre FIFO. Quantidade positiva gera uma baixa lógica por execução, detalhada em movimentos por lote de material, com o custo de cada origem. Conclusão usa ProductionOut; falha usa Waste. Falha aceita zero sem movimento de saída. O vínculo PrintRunId agrupa os movimentos da baixa e o estado terminal impede reaplicação. MaterialLotId singular na execução deixa de ser a fonte do consumo quando ele abrange vários lotes.
- **Rationale**: FR-017, FR-018 e FR-024 exigem consumo único, proteção das reservas alheias e custo rastreável. Insuficiência para o consumo aborta a operação inteira. Insuficiência somente para o complemento da reimpressão não desfaz a falha nem o consumo; mantém a sobra reservada e bloqueia o início.
- **Alternatives considered**: Baixar o estimado em silêncio, permitir estoque negativo, usar reserva alheia ou devolver material já gasto ao livre contrariam as respostas da clarificação. Gravar uma saída para um lote de material arbitrário perde a rastreabilidade.

## 17. Preservação do perfil e retomada da reserva

- **Decision**: Copiar os três valores da prancha para cada ProductionLot na liberação, sem criar um subsistema de versões de perfil. Calcular o complemento como max de zero e PlannedGrams menos reserva restante. Tentar o complemento integral ao registrar reimpressão e novamente na tentativa de início; se couber, ativar a PrintRun Planned existente. `missingMaterialG` é calculado, sem acrescentar estado ao enum.
- **Rationale**: A quarta resposta preserva o trabalho liberado e a segunda bloqueia início com reserva incompleta. Repetir a tentativa de início após entrada de material fornece um caminho de recuperação sem endpoint de reserva manual ou job adicional.
- **Alternatives considered**: Recalcular a fila após editar perfil foi rejeitado pelo usuário. Versões completas de perfil acrescentariam estrutura desnecessária para preservar três valores. Complemento parcial foi descartado pela reserva integral.

## 18. Cancelamento antes de produção ou financeiro

- **Decision**: O caso de uso CancelOrder é acionado pelo PATCH comercial para Cancelled e exige ausência de execução com StartedAt, fatura e pagamento. Pedido pode estar QuotePending, Approved ou InProduction apenas por planejamento na fila. Cancelar pedido e lotes pendentes, remover itens de fila e planejamentos não iniciados, liberar reservas e gravar trilha na mesma transação. Toda operação de início ou financeiro verifica o pedido no mesmo isolamento.
- **Rationale**: FR-009 permite cancelar trabalho pendente e não abre fluxo de estorno financeiro ou reversão de produção. Histórico de execução iniciada impede cancelamento, mesmo após fim ou falha. A auditoria acompanha a escrita desde US1; a consulta completa permanece em US8.
- **Alternatives considered**: Cancelar só QuotePending foi rejeitado. Cancelamento após execução ou lançamento exigiria regras de reversão que não foram autorizadas. Cancela-se a execução Planned removendo apenas o planejamento sem início, sem alterar os estados terminais históricos.
