# Research: Reimplementar o núcleo da farm

**Feature**: `specs/001-reimplementar-printfarm`
**Date**: 2026-11-16 | **Revisado**: 2026-11-17 (troca de .NET 8 + SQL Server por Node.js + TypeScript + SQLite; integração das clarificações e da revisão de desenho publicadas na mesma data, itens 17 a 20)

Cada item fecha uma escolha técnica. A spec não cita stack. Aqui a escolha fica escrita, com o que foi descartado. Quem implementa MUST seguir estes itens literalmente; mudar um deles é mudar o plan.

## 1. Stack da reimplementação

- **Decision**: Node.js 24 LTS ou mais novo, TypeScript, Fastify 5 na API, SQLite embutido do Node (`node:sqlite`), Vue 3 + Vite na SPA. Testes em Vitest nos dois lados. Um repositório com dois workspaces npm: `server/` e `web/`.
- **Rationale**: Nenhum requisito da spec nem princípio da constituição depende de .NET. A máquina de desenvolvimento não tem o SDK do .NET nem Docker, e o SQL Server do desenho anterior dependia de Docker. Node já é obrigatório para a SPA: com ele no servidor a equipe tem uma linguagem, um gerenciador de pacotes e um executor de testes. Banco, hash de senha e execução de TypeScript já vêm no Node; não há instalação além de `npm install`.
- **Alternatives considered**: .NET 8 + SQL Server, o desenho anterior, descartado por exigir SDK e Docker que a equipe não tem. Python + FastAPI, descartado por acrescentar uma segunda linguagem e um segundo executor de testes; o único ganho seria o `Decimal` nativo, resolvido no item 11. Copiar o fonte do PrintFarm, se aparecesse, violaria "reimplementar".

## 2. Onde vive cada regra

- **Decision**: Funções puras em `server/src/domain/` para corte de prancha, compatibilidade, custo, máquinas de estado, FIFO sobre lista já carregada, política de senha e travamento de login. `server/src/application/` orquestra o caso de uso e a transação. `server/src/infrastructure/` persiste, faz hash, assina token e roda o job. `server/src/api/` e `web/` só traduzem.
- **Rationale**: Princípio I. O teste da regra não abre banco nem servidor HTTP.
- **Regras de pureza** (verificadas pelo teste de arquitetura da tarefa T007): arquivo em `server/src/domain/` só importa caminho relativo que continue dentro de `server/src/domain/`; não importa `node:*` nem pacote npm; não chama `Date.now()`, `new Date()` sem argumento, `Math.random()`, `process` nem `console`. O instante atual chega como parâmetro `now`.
- **Alternatives considered**: Regra no handler da rota. Descartado porque o teste deixaria de ser só da regra. Classe de entidade com método que muda o próprio estado. Descartado: a regra devolve o novo estado e o caso de uso grava, o que mantém a regra testável sem objeto persistido.

## 3. Persistência e ambiente local

- **Decision**: SQLite por `node:sqlite` (`DatabaseSync`), um arquivo em `FARM3D_DB_PATH` (padrão `data/farm3d.db`), uma conexão por processo, com `PRAGMA foreign_keys = ON`, `journal_mode = WAL` e `busy_timeout = 5000`. Sem ORM. SQL escrito à mão nos repositórios de `server/src/infrastructure/repositories/`. Testes de orquestração usam o mesmo SQLite em `:memory:` com todas as migrações aplicadas.
- **Migrações**: arquivos `server/migrations/NNNN-nome.sql`, aplicados em ordem por `server/src/infrastructure/db/migrate.ts`, que registra cada um em `schema_migrations`. Migração já mesclada na branch base MUST NOT ser editada; mudança de esquema é arquivo novo. Os números 0001 a 0009 já estão reservados em `tasks.md`, um por história, para branches paralelas não colidirem.
- **Transação**: `withTransaction(db, fn)` executa `BEGIN IMMEDIATE`, chama `fn` e faz `COMMIT`, ou `ROLLBACK` se `fn` lançar. `fn` MUST ser síncrona: se devolver `Promise`, o helper faz rollback e lança erro. Um `await` dentro da transação deixaria outra requisição usar a mesma conexão no meio dela.
- **Rationale**: SQLite em memória executa transação de verdade, então o teste de "nenhuma reserva parcial" prova o rollback; o InMemory do EF Core não provava (objeção correta da revisão .NET, que pedia SQL Server real nos testes). Como o banco de produção também é SQLite, testar com SQLite prova o comportamento do banco que roda, sem diferença de dialeto. Uma oficina com até 20 pessoas e 50 impressoras cabe em um escritor por vez.
- **Alternatives considered**: SQL Server em Docker, descartado no item 1. PostgreSQL, descartado por exigir instalação e serviço. ORM (Prisma, Drizzle, TypeORM), descartado como estrutura sem regra que a exija e por esconder o SQL da transação. `better-sqlite3`, descartado porque exige compilação nativa e o Node já traz SQLite.
- **Risco aceito**: `node:sqlite` ainda pode mudar de API entre versões do Node. Todo uso fica em `server/src/infrastructure/db/`; nenhum outro diretório o importa.

## 4. Identidade e papéis

- **Decision**: Tabela `users` própria. Senha com `scrypt` de `node:crypto` (sal aleatório de 16 bytes, chave de 64 bytes, comparação com `timingSafeEqual`), guardada como `scrypt$<saltBase64>$<hashBase64>`. Um papel por usuário, exatamente: Admin, Sales, Production, Purchasing, Operator. Sessão por JWT HS256 assinado com `jose`, chave em `JWT_SIGNING_KEY` (mínimo 32 bytes), validade de 8 horas, `sub` = id do usuário e `role` = papel. A checagem de papel acontece no servidor, num `preHandler` por rota.
- **Política de senha**: mínimo de 6 caracteres, com pelo menos uma maiúscula, uma minúscula, um dígito e um símbolo. Mesmos números do padrão do ASP.NET Identity que o desenho anterior herdava sem escrever.
- **Travamento de login**: 5 falhas seguidas travam o usuário por 5 minutos. Login certo zera o contador. Durante o travamento a resposta é a mesma 401 genérica, sem dizer se o e-mail existe. Também são os números padrão do Identity.
- **Semente**: um usuário por papel, criada só quando `NODE_ENV=development`, com a senha de `FARM3D_SEED_PASSWORD`. Sem essa variável a semente não roda.
- **Rationale**: A spec pede identificação e os cinco papéis. O referência usa bearer. Hash e travamento como código explícito deixam os números visíveis e testáveis.
- **Alternatives considered**: Sessão por cookie, descartada porque a SPA e a API sobem separados no desenvolvimento. `bcrypt` ou `argon2`, descartados porque exigem pacote nativo e o `scrypt` embutido atende. Biblioteca de autenticação completa (Passport, Auth.js), descartada como estrutura além da regra.
- **Confirmado pelo mantenedor em 2026-11-17**: política de senha (6 caracteres e quatro classes), travamento (5 falhas, 5 minutos) e validade do token (8 horas). Mudar qualquer um desses números exige alterar este item antes do código.

## 5. Processamento periódico

- **Decision**: `runHourlyPass(db, now)` em `server/src/infrastructure/jobs/hourly-farm-job.ts`, agendado com `setInterval` de uma hora no processo da API e também executado uma vez na subida. O script `npm run job:hourly --workspace server` executa uma passagem e sai; é o gancho de desenvolvimento citado no quickstart. A passagem expira orçamentos elegíveis, grava sugestões de recompra e grava a contagem de prazos.
- **Rationale**: A spec pede o efeito (expirar, sugerir, contar), não um painel de jobs.
- **Alternatives considered**: Biblioteca de fila ou cron (BullMQ, node-cron), descartada pelo princípio VI. Disparo só manual, descartado porque orçamento vencido ficaria aprovado até alguém lembrar.

## 6. Corte da prancha e prancha parcial

- **Decision**: `splitLots(pieces, piecesPerPlate, secondsPerPlate, mgPerPlate)` em `server/src/domain/rules/lot-split.ts` devolve a lista de lotes. Quantidade de lotes = teto(peças / peças por prancha). Lotes cheios levam os segundos e os miligramas da prancha. O último, se incompleto, leva `peçasDoLote / peçasPorPrancha` de ambos, arredondado **para cima** ao segundo e ao miligrama inteiros. 10 e 4 produzem (4, 3600 s, 40000 mg), (4, 3600 s, 40000 mg), (2, 1800 s, 20000 mg).
- **Rationale**: A proporção fecha o cenário de referência sem inventar tempo mínimo. Arredondar para cima nunca reserva menos material do que a prancha usa, o que segue o edge case "gramas reservadas não arredondam para esconder falta de saldo". Isso também fecha o achado A1 de analysis.md: o valor persistido é o inteiro em mg, arredondado para cima. Na liberação, os três parâmetros da prancha são copiados para o lote de produção (item 19).
- **Alternatives considered**: Última prancha com tempo cheio, descartada porque cobra capacidade que a prancha não usou. Recusar quantidade que não fecha prancha, descartada porque o cenário 10/4 deixaria de existir. Arredondamento ao mais próximo, descartado porque pode reservar 1 mg a menos.

## 7. Reserva FIFO

- **Decision**: `allocateFifo(neededMg, lots)` em `server/src/domain/rules/fifo-reservation.ts` ordena os lotes de material por `receivedAt` e depois por `id`, e aloca miligramas até cobrir o necessário. Se a soma do livre não cobre, devolve recusa e alocação vazia. O caso de uso grava reservas e movimentações na mesma transação.
- **Rationale**: FR-012. Ordem por data e desempate por identificador tornam o teste estável. `receivedAt` em ISO-8601 UTC ordena corretamente também como texto. A mesma ordem vale para consumo da reserva própria, excesso em saldo livre e complemento da reimpressão. A reserva de outro lote de produção nunca cobre excesso.
- **Alternatives considered**: Reserva parcial do que houver: a spec recusa. Média de custo sem lote: a spec exige o lote mais antigo.

## 8. Estados da impressora

- **Decision**: Campo operacional próprio, além de ativa/inativa. Transições só pelos eventos da spec (iniciar, concluir impressão, confirmar retirada, concluir preparação, entrar em manutenção, confirmar manutenção, marcar indisponível). O legado só tinha `IsActive` e "impressoras rodando" no painel. O estado operacional é exigência da constituição, não cópia do legado.
- **Rationale**: Princípio III. Sem esse campo, "impressão concluída" vira "máquina livre".
- **Alternatives considered**: Derivar o estado da execução aberta, descartado porque a spec proíbe inferir um estado do outro. A retirada e a preparação não são uma execução. `Printer.OccupyingPrintRunId` identifica a execução física da mesa até a retirada; criar uma reimpressão Planned não troca esse vínculo.

## 9. Motivos de falha

- **Decision**: Lista fechada `None`, `BedAdhesion`, `Clog`, `LayerShift`, `OutOfMaterial`, `Other`.
- **Rationale**: O dicionário do referência corta a lista em "BedAdhesion, Clog, … Other". A spec precisa de uma lista testável. Estes seis cobrem os nomes que o documento mostra e os dois casos que a operação de impressão 3D não consegue registrar sem eles.
- **Alternatives considered**: Texto livre, descartado porque a spec pede lista fechada. Inventariar o enum no fonte do legado: o fonte não está neste repositório.

## 10. Custo e calendário

- **Decision**: `estimateCost(input)` em `server/src/domain/rules/cost-estimate.ts` recebe miligramas, centavos por kg, segundos, Wh por hora, centavos por MWh e centavos por hora. Cada parcela é calculada exata e arredondada uma vez ao centavo, metade para cima. O total é a soma das três parcelas já arredondadas, para a tela somar o que mostra. Qualquer premissa nula devolve a lacuna, sem total. O resultado carrega a frase "A taxa de hora-máquina não inclui filamento nem energia."
  - filamento = mg × centavosPorKg ÷ 1.000.000
  - energia = segundos × WhPorHora × centavosPorMWh ÷ 3.600.000.000
  - máquina = segundos × centavosPorHora ÷ 3.600
- **Previsão de término**: horas pendentes dos lotes compatíveis com cada máquina disponível no calendário, em paralelo. Se todas as máquinas consideradas têm a mesma taxa de peças por hora no perfil em uso, o painel pode mostrar a aproximação "horas ÷ máquinas equivalentes" e MUST exibir essa frase.
- **Calendário e fuso**: padrão segunda a sexta, 08:00–18:00, no fuso `America/Sao_Paulo`, gravados em `farm_settings` e editáveis. "Hoje" e "vencendo hoje" são calculados no fuso da farm com `Intl.DateTimeFormat`, fora do domínio, e entram na regra como data `AAAA-MM-DD`.
- **Rationale**: FR-023 e princípio V.
- **Alternatives considered**: Total sempre numérico com tarifa zero: a spec proíbe número sem premissa. Total arredondado separado das parcelas: a soma exibida poderia diferir do total por um centavo.

## 11. Dinheiro, peso e tempo

- **Decision**: Todo valor gravado ou calculado no domínio é **inteiro**, numa escala fixa. Nenhum número fracionário entra no domínio.

  | Grandeza | Unidade inteira | Sufixo no nome |
  |----------|-----------------|----------------|
  | Dinheiro | centavo | `Cents` |
  | Preço ou custo por quilo | centavo por kg | `CentsPerKg` |
  | Taxa de hora-máquina | centavo por hora | `CentsPerHour` |
  | Tarifa de energia | centavo por MWh (R$ 0,65632/kWh = 65632) | `CentsPerMwh` |
  | Peso | miligrama | `Mg` |
  | Energia por hora | Wh por hora | `WhPerHour` |
  | Tempo | segundo | `Seconds` |
  | Diâmetro | micrômetro | `Um` |

- **Aritmética**: multiplicação seguida de divisão passa por `mulDivRoundHalfUp` ou `mulDivCeil` de `server/src/domain/units.ts`, que calculam com `BigInt` e devolvem `number` inteiro seguro. Nenhum outro arquivo divide valores monetários ou de peso.
- **Fronteira da API**: o JSON segue os contratos em unidades humanas (reais, gramas, minutos, kg, R$/kWh, kWh por hora). A rota converte na entrada com `parseScaled(valor, casas)`, que lê o número pela sua forma de texto e recusa com 400 casas decimais além do permitido, e na saída com `formatScaled`. Casas aceitas: dinheiro 2; gramas 3; quilos 6; minutos 2; tarifa por kWh 5; kWh por hora 3; diâmetro em mm 3.
- **SQLite**: colunas desses valores são `INTEGER`. `SUM` e comparação em SQL são seguros porque o valor é inteiro.
- **Rationale**: Edge case da spec: centavo metade para cima e três casas nas gramas. Inteiros evitam erro de ponto flutuante sem biblioteca decimal, e o SQLite não tem tipo decimal.
- **Alternatives considered**: `number` fracionário, descartado em dinheiro e em saldo. Biblioteca decimal (`decimal.js`) com valor gravado como texto, descartada porque `SUM` e `ORDER BY` em SQL converteriam o texto para ponto flutuante sem aviso.

## 12. Arquivos 3D

- **Decision**: Metadado e rótulo de versão no banco. O binário fica em disco sob `FARM3D_FILES_DIR` (padrão `data/files3d`), recebido por `@fastify/multipart`. O banco guarda o caminho relativo.
- **Rationale**: A spec pede nome e versão, não processamento de malha.
- **Alternatives considered**: Blob no banco, descartado como complexidade sem regra que o exija.

## 13. Testes que a constituição exige

- **Decision**:
  - Regra pura: Vitest em `server/tests/domain/`, escrito e visto falhando antes da regra.
  - Orquestração: Vitest em `server/tests/application/`, com SQLite `:memory:` e migrações aplicadas, escrito antes do caso de uso.
  - Pureza do núcleo: `server/tests/architecture/domain-purity.test.ts`.
  - Acesso por papel: `server/tests/api/authz.test.ts` com `app.inject` do Fastify, cobrindo 401 sem sessão e 403 com papel errado.
  - SPA: Vitest só no guarda de rota.
  - O restante da jornada está em `quickstart.md`.
- **Rationale**: Princípio II. O teste de 401 e 403 fecha a lacuna do princípio VII que o desenho anterior deixava só no roteiro manual.
- **Alternatives considered**: Só teste manual: viola a constituição. Teste HTTP de todo endpoint: fica fora desta feature.

## 14. TypeScript sem etapa de build

- **Decision**: O servidor roda com o TypeScript nativo do Node (`node --env-file-if-exists=.env src/api/main.ts`), sem compilar. Isso impõe, e o `tsconfig.json` verifica com `erasableSyntaxOnly`:
  - sem `enum` do TypeScript: cada enum é `export const X = { A: 'A', … } as const` mais `export type X = (typeof X)[keyof typeof X]`, com os valores exatos de `data-model.md`;
  - sem `namespace` e sem propriedade declarada no parâmetro do construtor;
  - import relativo com a extensão `.ts`; import só de tipo com `import type`.
- **Verificação de tipos**: `npm run typecheck` (`tsc --noEmit`) nos dois workspaces, obrigatório verde junto com os testes.
- **Rationale**: Uma etapa de build a menos e o mesmo arquivo roda no teste e na produção.
- **Alternatives considered**: `tsc` para `dist/`, ou `tsx`, descartados como etapa ou dependência sem regra que a exija.

## 15. Erros e respostas

- **Decision**: A regra devolve `{ ok: true, value }` ou `{ ok: false, code, message }`, sem lançar exceção para recusa de negócio. A rota traduz `code` no status do contrato (400, 404 ou 409) e responde `application/problem+json` com `type`, `title`, `status`, `detail` e `code`. `message` é o texto estável citado nos contratos.
- **Rationale**: Os contratos pedem "a regra violada em texto estável". Recusa como valor deixa o teste da regra conferir o código sem `try`.
- **Alternatives considered**: Exceções tipadas: espalham `try` pelo caso de uso e escondem qual recusa cada regra pode dar.

## 16. O que não entra no desenho

- **Decision**: Sem módulo de assistente, cliente de nota fiscal, SDK ou leitura de impressora, fila automática, ORM, biblioteca de fila ou cron, nem pacote nativo compilado.
- **Rationale**: FR-026 e a seção "Fora de escopo" da constituição; itens 3, 4 e 5 acima.
- **Alternatives considered**: Deixar o endpoint de chat desligado. Mesmo desligado, o módulo seria estrutura sem regra. Não criar.

## 17. Transações e concorrência

- **Decision**: Toda operação que lê e grava estoque, pedido, execução ou financeiro roda inteira dentro de `withTransaction` (item 3), com `BEGIN IMMEDIATE`. As leituras que decidem a regra (pedido, execuções, faturas, pagamentos, reservas, saldos) acontecem dentro da transação; mudanças, movimentos e trilha são confirmados juntos. Como o SQLite admite uma única transação de escrita por vez e a conexão é síncrona, duas operações nunca se intercalam: o efeito é o isolamento serializável. `SQLITE_BUSY` além do `busy_timeout` vira 503, e o cliente consulta o estado antes de repetir.
- **Rationale**: As clarificações de consumo, complemento e cancelamento exigem atomicidade entre várias leituras e gravações, e que cancelamento e início, fatura ou pagamento nunca confirmem juntos. A revisão .NET resolvia isso com `Serializable` no SQL Server; aqui a garantia vem do próprio modelo de escrita do SQLite.
- **Prova**: testes de orquestração com SQLite real (item 13), inclusive um arquivo temporário com duas conexões para as disputas descritas no quickstart (seção "Atomicidade e concorrência").
- **Alternatives considered**: SQL Server com `Serializable`, descartado no item 1. Controle otimista por versão de linha, descartado porque não cobre a ausência de registros relacionados (por exemplo, "não existe fatura") e a escrita exclusiva já resolve.

## 18. Consumo real e reserva de reimpressão

- **Decision**: Regra pura planeja o consumo sobre as reservas próprias e o excesso sobre saldo livre FIFO. Quantidade positiva gera uma baixa lógica por execução, detalhada em movimentos por lote de material, com o custo de cada origem. Conclusão usa ProductionOut; falha usa Waste. Falha aceita zero sem movimento de saída. Insuficiência para o consumo aborta a operação inteira.
- **Rationale**: FR-017, FR-018 e FR-024 exigem consumo único, proteção das reservas alheias e custo rastreável. Insuficiência só para o complemento da reimpressão não desfaz a falha nem o consumo; mantém a sobra reservada e bloqueia o início.
- **Alternatives considered**: Baixar o estimado em silêncio, permitir estoque negativo, usar reserva alheia ou devolver material já gasto ao livre contrariam as respostas da clarificação. Gravar a saída num lote de material arbitrário perde a rastreabilidade.

## 19. Preservação do perfil e retomada da reserva

- **Decision**: Copiar os três valores da prancha (`ReleasedPiecesPerPlate`, `ReleasedSecondsPerPlate`, `ReleasedMgPerPlate`) para cada ProductionLot na liberação, sem criar versões de perfil. Complemento = max(0, PlannedMg − reserva restante). Tentar o complemento integral ao registrar reimpressão e de novo na tentativa de início; se couber, ativar a Planned existente.
- **Rationale**: A quarta resposta da clarificação preserva o trabalho liberado e a segunda bloqueia início com reserva incompleta. Repetir a tentativa no início, depois de entrada de material, dá um caminho de recuperação sem endpoint manual de reserva nem job extra.
- **Alternatives considered**: Recalcular a fila após editar o perfil, rejeitado pelo usuário na clarificação. Versões completas de perfil, estrutura desnecessária para preservar três valores. Complemento parcial, descartado pela reserva integral.

## 20. Cancelamento antes de produção ou financeiro

- **Decision**: O `PATCH /api/sales-orders/{id}/status` para Cancelled aciona a regra de cancelamento, que exige ausência de execução com StartedAt, de fatura e de pagamento. O pedido pode estar QuotePending, Approved ou InProduction só por planejamento. Cancela pedido e lotes pendentes, remove itens de fila e execuções Planned sem início, libera as reservas com Unreserve uma única vez e grava a trilha, tudo numa transação.
- **Rationale**: FR-009 permite cancelar trabalho pendente e não abre estorno financeiro nem reversão de produção. Execução iniciada impede cancelamento mesmo depois de encerrada.
- **Alternatives considered**: Cancelar só QuotePending, rejeitado na clarificação. Cancelamento após execução ou lançamento exigiria regras de reversão não autorizadas.
- **Pendente**: a revisão .NET registrava a trilha desde a US1 ("a auditoria acompanha a escrita desde US1"). Neste desenho a trilha entra na US8 (T069–T072) e é acrescentada às transições já existentes. Antecipar a captura para a US1 é decisão da equipe; enquanto não houver decisão, vale tasks.md.
