<!--
Sync Impact Report (2.0.1)
- Version change: 2.0.0 → 2.0.1 (PATCH: esclarecimento, sem mudança de regra)
- Modified sections:
  - Processo Spec Kit → "Estado" atualizado: CLI `specify` 1.4.1,
    integração `opencode` com `--script py`, templates, scripts e
    comandos versionados; comandos `speckit.git.*` não registrados no
    OpenCode
  - Comandos do fluxo → nome dos comandos no OpenCode (`/speckit.plan`)
  - Extensão git → padrão de branch por história (`<autor>/NNN-slug`)
    e branch base da feature
- Resolved TODOs: TODO(SPECIFY_VERSION) → 1.4.1
- Artefatos conferidos: ✅ .specify/memory/knowledge-graph.md
- Follow-up TODOs: TODO(SOFTWARE_REF) continua aberto

Sync Impact Report (2.0.0)
- Version change: 1.0.0 → 2.0.0 (MAJOR: seção "Regras de domínio" removida
  daqui e princípios renumerados)
- Modified principles (antigo → novo):
  - I. A constituição manda → removido como princípio; virou Precedência
    e Governance
  - II. Domínio puro, casca fina → I (agora separa regra pura de
    orquestração transacional)
  - III. Teste antes da regra → II
  - IV. Dois estados → III
  - V. Rastreio sem baixa duplicada → IV
  - VI. Estimativa explícita + VIII. Dado fictício marcado → V
  - VII. Escopo parado → VI (absorveu "nenhuma estrutura além da regra")
  - (novo) VII. Acesso por papel, segredo fora do repositório
- Added sections:
  - Precedência e fonte única
  - Gates verificáveis
  - Processo Spec Kit (CLI `specify`, comandos, dono de cada artefato)
  - Regras para agentes
- Removed sections:
  - Regras de domínio → já estavam em spec.md (FR-004 a FR-023) e em
    data-model.md da feature 001. A única regra sem equivalente
    ("máquina nova entra na capacidade") foi acrescentada aos Edge Cases
    da spec 001.
  - Fluxo de entrega → redistribuído entre os princípios II, V e VI
  - Listas de estados → data-model.md é a fonte
  - Escopo "Dentro" → a spec vigente define; aqui fica só o "Fora"
- Artefatos conferidos nesta emenda:
  - ✅ specs/001-reimplementar-printfarm/plan.md (Constitution Check
    refeito com a numeração nova e evidência)
  - ✅ specs/001-reimplementar-printfarm/research.md (referências a
    princípios renumeradas)
  - ✅ specs/001-reimplementar-printfarm/tasks.md (referência renumerada)
  - ✅ specs/001-reimplementar-printfarm/spec.md (edge case acrescentado;
    Assumptions ajustada)
  - ✅ specs/001-reimplementar-printfarm/data-model.md (tabela de
    transições da impressora estava partida por um parágrafo; só
    formatação)
  - ✅ .specify/memory/knowledge-graph.md (criado)
  - ⚠ .specify/templates/ não existe neste repositório; nada a propagar
- Follow-up TODOs:
  - TODO(SPECIFY_VERSION): resolvido em 2.0.1 (CLI 1.4.1).
  - TODO(SOFTWARE_REF): `docs_apoio/software_ref` não está versionado
    aqui. Registrar onde ele vive ou versioná-lo.
-->

# Farm 3D Constitution

## Core Principles

A numeração abaixo está congelada a partir da versão 2.0.0. Princípio
removido mantém o número, marcado como removido. Princípio novo recebe
o próximo número.

### I. Domínio puro, casca fina (NÃO NEGOCIÁVEL)

Toda decisão de negócio MUST ser uma função pura no núcleo de domínio:
recebe dados já carregados, devolve o resultado ou a recusa, e não
toca banco, rede, relógio do sistema nem interface. O núcleo MUST NOT
referenciar biblioteca de persistência, HTTP ou UI.

A camada de aplicação MAY carregar dados, abrir a transação, chamar a
função pura e gravar o resultado. Ela MUST NOT decidir a regra. Um
`if` de negócio fora do núcleo é violação. Persistência, HTTP e telas
são adaptadores.

Rationale: o comportamento da farm precisa ser verificável sem subir a
aplicação. Orquestrar não é decidir.

### II. Teste antes da regra (NÃO NEGOCIÁVEL)

Toda regra de domínio nova ou alterada MUST começar com um teste
automatizado que falha. O teste MUST aparecer no mesmo commit da regra
ou em commit anterior, nunca depois. Teste que falha MUST NOT ser
apagado, pulado nem enfraquecido para a suíte passar. A orquestração
transacional MUST ter teste próprio, que MAY usar persistência de
teste. Jornada de tela MUST ter roteiro executável em `quickstart.md`
da feature. Cada história de usuário MUST poder ser conferida sozinha,
no máximo com dados semeados.

Rationale: o teste que falha fixa o contrato antes do código.

### III. Dois estados (NÃO NEGOCIÁVEL)

O estado do lote de produção e o estado da impressora MUST ser dois
campos independentes, cada um alterado só por evento explícito. Um
MUST NOT ser calculado a partir do outro. Impressão concluída MUST
manter a máquina ocupada até a retirada e a preparação. A máquina só
volta a receber lote sem bloqueio e sem manutenção pendente. Conclusão
da impressão, confirmação da retirada e conclusão da manutenção MUST
ser eventos distintos.

Rationale: tratar "impressão acabou" como "máquina livre" mente a
capacidade da farm.

### IV. Rastreio sem baixa duplicada

Toda mudança de estado de lote de produção, impressora, orçamento e
pedido MUST ficar registrada com quem agiu, quando, estado anterior e
estado novo. Reserva, consumo e liberação de material MUST ser
movimentações, nunca só um saldo novo. Operação que altera saldo MUST
ser atômica: grava tudo ou nada. Repetir o mesmo comando MUST ser
recusado sem efeito: a mesma reserva MUST NOT ser consumida duas vezes
e a mesma conclusão MUST NOT gerar segunda saída de estoque.

Rationale: custo e saldo deixam de ser discutíveis quando a baixa pode
ser repetida ou ficar pela metade.

### V. Estimativa explícita, dado fictício marcado

Custo estimado e previsão de término MUST mostrar a conta e a
premissa. Premissa ausente MUST impedir o total; o sistema MUST NOT
substituí-la por zero nem por valor padrão. Custo estimado MUST
permanecer distinto do preço de venda. Cada parcela do custo MUST
declarar o que inclui, para nada entrar duas vezes. Limite, tarifa e
taxa MUST ser dado cadastrado; a implementação MUST NOT inventar esse
número.

Volume, frota, custo e prazo usados como exemplo MUST aparecer
marcados como fictícios. Ganho de produtividade MUST NOT ser
apresentado como resultado medido. Esta segunda regra vale até a
operação real fornecer a série; retirá-la exige emenda.

Rationale: um total opaco não serve para decidir preço nem prazo, e
exemplo não é métrica.

### VI. Escopo parado

O que a seção "Fora de escopo" lista MUST NOT entrar por conveniência
de implementação, nem desligado, nem como esqueleto. Comportamento do
software de referência entra só quando a spec vigente o inclui.
Uma história MUST NOT acrescentar estrutura, dependência ou
projeto que a regra atual não exija. Complexidade além da história
atual MUST estar justificada na tabela Complexity Tracking do plan,
citando o princípio ou o requisito que a exige.

Rationale: o legado é grande; copiar módulo sem spec reabre o escopo.

### VII. Acesso por papel, segredo fora do repositório

Toda ação MUST exigir sessão, exceto a identificação. Toda ação MUST
declarar no contrato os papéis que a executam, e a recusa MUST
acontecer no servidor; esconder o botão na tela não é controle de
acesso. Senha MUST ser guardada de forma irreversível. Segredo (senha,
chave de assinatura, string de conexão) MUST vir de configuração e
MUST NOT ser versionado, nem em exemplo, nem em teste.

Rationale: a trilha do princípio IV só vale se o autor da ação for
quem a sessão diz que é.

## Precedência e fonte única

Ordem de precedência: constituição → spec → plan → data-model e
contracts → tasks → código. Quando dois artefatos se contradizem, vale
o de cima. O agente MUST parar, corrigir o artefato de cima primeiro e
só então o de baixo. Ajustar o de baixo para esconder a contradição é
proibido.

Cada fato tem um só dono. Os outros artefatos citam, não reescrevem.

| Fato | Dono | Quem cita |
|------|------|-----------|
| Princípios, escopo fora, vocabulário, processo | esta constituição | todos |
| O que o sistema faz e por quê (US, FR, SC, edge cases) | `spec.md` | plan, tasks |
| Stack, estrutura de pastas, decisões técnicas | `plan.md` e `research.md` | tasks |
| Entidades, campos, enums, transições, fórmulas | `data-model.md` | contracts, tasks, código |
| Rotas, papéis por rota, códigos de resposta | `contracts/*.md` | tasks, código |
| Ordem de execução e arquivos tocados | `tasks.md` | código |
| Roteiro de prova por história | `quickstart.md` | tasks |
| Mapa de relações entre os artefatos | `.specify/memory/knowledge-graph.md` | agentes |

Classe, assinatura, formato de arquivo, algoritmo e stack MUST NOT
aparecer nesta constituição.

## Vocabulário

Spec, plan e interface MUST usar o termo em português. Código, API e
banco MUST usar o identificador em inglês desta tabela, exatamente
como escrito. "Lote" sozinho é proibido em qualquer lugar onde lote de
produção e lote de material possam se confundir. Termo novo entra
primeiro aqui.

| Termo (spec e tela) | Identificador (código) | Significado |
|---------------------|------------------------|-------------|
| Modelo | `Product` | Item de catálogo, com cores, tamanhos e perfil de produção |
| Configuração | `ColorId` e `Size` na linha | Cor e tamanho escolhidos na compra, quando o modelo os oferece |
| Orçamento | `Quote` | Proposta com linhas; gera no máximo um pedido |
| Pedido | `SalesOrder` | Compra com linhas, quantidades e configurações |
| Confirmação pendente | `QuotePending` | Estado do pedido manual antes da confirmação |
| Confirmado | `Approved` | Estado do pedido que já admite produção e financeiro |
| Lote de produção | `ProductionLot` | Porção executável de uma linha de pedido, limitada pela prancha |
| Prancha | sem entidade; `*PerPlate` | Uma ocupação de impressão |
| Perfil de produção | `PrintProfile` | Peças, tempo e material por prancha |
| Lote de material | `MaterialLot` | Porção recebida de material, com saldo em gramas |
| Saldo | `StockItem` | Quantidade e reservado; livre = quantidade − reservado |
| Movimentação | `StockMovement` | Registro de entrada, saída, reserva ou liberação |
| Impressora | `Printer` | Máquina da farm, com compatibilidade e estado operacional |
| Execução | `PrintRun` | Uma tentativa de imprimir um lote de produção numa impressora |
| Retirada, preparação | eventos da impressora | Passos entre o fim da impressão e a máquina disponível |
| Manutenção | `InMaintenance` | Parada por horas acumuladas, com limite cadastrado |
| Custo estimado | `CostEstimate` | Custo de produzir. Não é preço de venda |
| Backlog | `BacklogForecast` | Carga pendente em horas de máquina |
| Trilha | `AuditLog` | Registro de mudança de estado |

Os valores dos estados e dos demais enums pertencem a `data-model.md`.
Código MUST copiá-los de lá sem traduzir, abreviar nem acrescentar.

## Fora de escopo

Emissão de NF-e ou NFS-e, boleto, conciliação bancária, gateway de
pagamento, e-commerce, RH e folha, controle estatístico de qualidade,
CNC, telemetria de impressora, otimização automática da fila,
assistente de IA e cálculo de frete. Frete e embalagem podem ser
valores digitados no pedido, não uma cotação.

O que está dentro é o que a spec vigente inclui. Tirar um item desta
lista exige emenda MINOR antes da spec que o usar.

O software de referência (`docs_apoio/software_ref`) é fonte de
comportamento, só para leitura, e hoje não está versionado neste
repositório. Código dele MUST NOT ser copiado. Agente que não consegue
abrir o arquivo de referência MUST NOT supor o que ele diz: vale a
spec, e a lacuna vira `[NEEDS CLARIFICATION: …]`.

## Gates verificáveis

O Constitution Check do plan e a revisão de cada entrega MUST
responder a cada linha com a evidência (arquivo, teste ou tarefa), não
com "passa".

| Princípio | Pergunta | Evidência aceita |
|-----------|----------|------------------|
| I | O núcleo compila sem persistência, HTTP e UI? | Teste automatizado de pureza do núcleo, verde |
| I | Existe decisão de negócio fora do núcleo? | Cada caso de uso chama uma regra nomeada do núcleo |
| II | Cada regra tem teste que nasceu antes dela? | Em `tasks.md`, a tarefa do teste precede a da regra; no histórico, o teste não é posterior |
| II | Cada história tem roteiro próprio? | Seção numerada em `quickstart.md` |
| III | Algum estado é derivado do outro? | Duas tabelas de transição em `data-model.md`; teste de que concluir impressão não leva a disponível |
| IV | Toda mudança de saldo é movimentação, atômica e não repetível? | Teste de saldo insuficiente sem reserva parcial; teste de segunda conclusão recusada |
| IV | Toda mudança de estado grava trilha? | Teste da trilha com autor, estado anterior e novo |
| V | Há total sem premissa, ou número inventado? | Teste de total ausente quando falta premissa; nenhum valor padrão para limite, tarifa ou taxa |
| V | Exemplo aparece marcado? | Roteiro do quickstart confere a marca |
| VI | Algo da lista "Fora" foi criado? | Nenhum projeto, rota ou dependência correspondente |
| VI | Há estrutura sem requisito? | Complexity Tracking preenchido |
| VII | Toda rota declara papéis e recusa no servidor? | Matriz de papéis em `contracts/`; roteiro com 401 e 403 |
| VII | Há segredo versionado? | Nenhum segredo em arquivo rastreado; exemplo só com nomes de variáveis |

## Processo Spec Kit

### CLI `specify`

A CLI é o pacote Python `specify-cli` (Python 3.11 ou mais novo). Ela
prepara e mantém a infraestrutura do repositório. Ela não escreve
spec, plan nem tasks; isso é feito pelos comandos `/speckit-*` dentro
do agente.

| Para | Comando |
|------|---------|
| Instalar | `uv tool install specify-cli`, ou `pipx install specify-cli`, ou `pip install specify-cli` |
| Fixar versão | `uv tool install specify-cli==X.Y.Z` |
| Ver versão e ambiente | `specify version`, `specify check` |
| Ver se há versão nova | `specify self check` |
| Atualizar a CLI | `specify self upgrade --dry-run`, depois `specify self upgrade` |
| Instalar os comandos de um agente neste repositório | `specify integration install <agente> --script py` |
| Ver agentes instalados e arquivos alterados | `specify integration status` |
| Trocar o agente padrão | `specify integration use <agente>` |
| Atualizar os arquivos de um agente | `specify integration upgrade <agente>` |
| Listar extensões | `specify extension list` |
| Instalar, atualizar, desligar extensão | `specify extension add <nome>`, `specify extension update [<nome>]`, `specify extension disable <nome>` |
| Recuperar infraestrutura ausente | `specify init --here --force --integration <agente> --script py` |

Regras:

- O tipo de script deste repositório é `py`. Todo agente MUST instalar
  com `--script py`, para Windows e Linux rodarem o mesmo script.
- `specify init --here --force` sobrescreve comandos, scripts e
  templates sem conferir alterações locais. Ele MUST rodar só com a
  árvore de trabalho limpa e MUST ser seguido de revisão do diff. Ele
  preserva `specs/` e esta constituição.
- `.specify/extensions.yml`, `.specify/extensions/.registry`,
  `.specify/integration.json` e os arquivos de comando gerados para
  cada agente MUST ser alterados só pela CLI, nunca à mão.
- Atualizar a CLI ou uma integração MUST ser um commit separado, sem
  mudança de spec ou código junto.
- Estado em 2026-11-17: CLI `specify` 1.4.1; integração padrão
  `opencode`, instalada com `--script py`; extensão `git` 1.0.4.
  Comandos em `.opencode/commands/speckit.*.md`, templates em
  `.specify/templates/` e scripts em `.specify/scripts/`, todos
  versionados. Quem clona já tem os comandos; a CLI só é necessária
  para atualizar a integração ou as extensões. `specify integration
  status` MUST responder sem arquivo modificado ou ausente.
- Os comandos da extensão git (`speckit.git.*`) não estão registrados
  na integração OpenCode. Os hooks de commit automático podem não
  rodar; nesse caso o commit é manual, com a mesma mensagem
  `conventional`.

### Comandos do fluxo

O nome muda com o agente: `/speckit-plan` (skills, como Claude Code e
Copilot), `/speckit.plan` (arquivos de comando), `$speckit-plan`
(Codex). O comando é o mesmo. Neste repositório, com a integração
`opencode`, o formato é `/speckit.plan`.

| Ordem | Comando | Lê | Escreve | Obrigatório |
|-------|---------|----|---------|-------------|
| 0 | `/speckit-constitution` | esta constituição | esta constituição | Uma vez, e a cada emenda |
| 1 | `/speckit-specify` | constituição | `spec.md`, `checklists/requirements.md`, `.specify/feature.json` | Sim |
| 2 | `/speckit-clarify` | `spec.md` | `spec.md`, `checklists/requirements.md` | Se houver `[NEEDS CLARIFICATION]` |
| 3 | `/speckit-plan` | constituição, `spec.md` | `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md` | Sim |
| 4 | `/speckit-checklist` | `spec.md`, `plan.md` | `checklists/<tema>.md` | Opcional |
| 5 | `/speckit-tasks` | plan e artefatos de desenho | `tasks.md` | Sim |
| 6 | `/speckit-analyze` | spec, plan, tasks, constituição | nada (só leitura) | Sim neste projeto, antes do passo 7 |
| 7 | `/speckit-implement` | `tasks.md` e o que ele cita | código; em `tasks.md` só `[ ]` → `[X]` | Sim |
| 8 | `/speckit-converge` | código, spec, plan, tasks | acrescenta tarefas ao fim de `tasks.md` | Sim, até responder `Converged` |

Regras:

- A feature ativa é a de `.specify/feature.json`
  (`feature_directory`). A variável `SPECIFY_FEATURE_DIRECTORY` tem
  precedência sobre o arquivo. Trocar de branch não troca a feature
  ativa. O agente MUST conferir a feature ativa antes de qualquer
  comando.
- Um comando MUST NOT escrever artefato que a tabela não lhe atribui.
  Mudança em `spec.md` passa por `/speckit-specify` ou
  `/speckit-clarify`; mudança de desenho, por `/speckit-plan`.
- Depois de mudar um artefato, os de baixo na ordem de precedência
  MUST ser regenerados ou conferidos antes de implementar.
- `/speckit-constitution` não propaga a emenda para templates nem para
  comandos. A propagação é manual e fica registrada no Sync Impact
  Report.
- Achado CRITICAL do `/speckit-analyze` bloqueia `/speckit-implement`.

### Extensão git

- Uma feature, uma branch `NNN-slug`, criada por `speckit.git.feature`
  uma única vez. O número vem do script; `--number` MUST NOT ser
  passado. O diretório é `specs/NNN-slug/`.
- `speckit.git.commit` roda `git add .` e commita tudo o que estiver
  na árvore. Antes de qualquer comando `/speckit-*`, a árvore MUST
  conter só mudanças do próprio agente.
- O estilo de commit é `conventional`: a mensagem é uma linha
  `tipo(escopo): assunto`, escrita em arquivo temporário e passada ao
  script, nunca interpolada na linha de comando.
- Commit automático está ligado depois de constitution, specify,
  clarify, plan, tasks, checklist e analyze, e desligado depois de
  implement. Durante a implementação o commit é manual, ao fim de cada
  checkpoint de `tasks.md`, com os testes verdes.
- `speckit.git.validate` confere se a branch segue o padrão.
- A branch `NNN-slug` é a base de integração da feature. Cada
  história ou fase é implementada numa branch `<autor>/NNN-<história>`
  criada a partir da base e volta por pull request. Branch de história
  MUST NOT alterar artefato de desenho; correção de desenho vai num
  commit só de documentação, antes do código que depende dela.

## Regras para agentes

Valem para qualquer agente ou modelo que escreva neste repositório.

1. **Ler antes de escrever.** Antes de alterar qualquer arquivo, ler
   esta constituição, `.specify/memory/knowledge-graph.md` e os
   artefatos da feature ativa que o arquivo cita.
2. **Um escritor por artefato.** Dois agentes MUST NOT editar o mesmo
   arquivo ao mesmo tempo. Tarefas marcadas `[P]` em `tasks.md` são as
   únicas que rodam em paralelo. Arquivo tocado por várias histórias
   tem um escritor por vez.
3. **Só o que a tarefa nomeia.** O agente MUST alterar só os arquivos
   que a tarefa em execução nomeia. Precisou de outro arquivo: parar e
   registrar a tarefa que falta.
4. **Identificadores não mudam.** `FR-nnn`, `SC-nnn`, `Tnnn`, número
   de história e número de princípio MUST NOT ser renumerados nem
   reaproveitados. Item removido mantém o identificador com a marca
   "removido em AAAA-MM-DD". Item novo recebe o próximo número livre.
5. **Nome vem da fonte.** Nome de entidade, campo, valor de enum, rota
   e papel MUST ser copiado de `data-model.md` e `contracts/`. Precisa
   de outro nome: mudar a fonte primeiro.
6. **Não adivinhar.** Regra, número, limite ou comportamento ausente
   MUST virar `[NEEDS CLARIFICATION: pergunta]` no artefato dono. O
   agente MUST NOT preencher com suposição nem com o que o legado
   "provavelmente" faz.
7. **Dependência só com registro.** Pacote, projeto ou serviço novo
   MUST estar em `plan.md` ou `research.md` antes de entrar no código.
8. **Tarefa pronta é tarefa provada.** Marcar `[X]` exige os testes
   que a tarefa cita verdes e a suíte inteira verde. Tarefa
   parcialmente feita fica `[ ]`.
9. **Migração já commitada não se reescreve.** Mudança de esquema é
   migração nova.
10. **Não desfazer o trabalho alheio.** O agente MUST NOT reverter,
    reformatar nem reorganizar código ou artefato que a tarefa não
    pede. Discordância vira nota para o mantenedor, não edição.
11. **Violação bloqueia.** Mudança que quebra um princípio MUST NOT
    ser entregue com a justificativa de que é provisória.

## Governance

Esta constituição prevalece sobre qualquer prática do repositório.
Emenda MUST ser feita neste arquivo antes de spec, plan ou código que
dependam da regra alterada. Agente MAY propor emenda. Só um mantenedor
humano do repositório a ratifica, por revisão do commit ou do pull
request que a contém.

Toda emenda MUST atualizar o Sync Impact Report no topo, a versão, a
data e os artefatos que citam o que mudou, na mesma entrega.

Versionamento semântico:

- MAJOR: princípio removido, redefinido ou renumerado; seção
  normativa removida.
- MINOR: princípio, regra, termo do vocabulário ou limite de escopo
  acrescentado.
- PATCH: esclarecimento sem mudança de regra.

Conferência obrigatória:

- No plan: tabela Constitution Check com a evidência de cada gate,
  antes da pesquisa e depois do desenho.
- Antes de implementar: `/speckit-analyze` sem achado CRITICAL.
- A cada checkpoint de `tasks.md`: gates dos princípios I, II e IV
  verdes.
- Antes de encerrar a feature: `/speckit-converge` responde
  `Converged`.

**Version**: 2.0.1 | **Ratified**: 2026-11-16 | **Last Amended**: 2026-11-17
