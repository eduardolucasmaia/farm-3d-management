# Farm 3D: guia do agente

Gestão de uma farm de impressão 3D: pedido, lotes de produção, fila,
estoque. Node.js 24+, TypeScript sem build, Fastify, SQLite, Vue 3.
Feature ativa: `specs/001-reimplementar-printfarm/`.

Este arquivo é o ponto de entrada. Ele não contém regra de negócio; em
conflito com `spec.md`, `data-model.md` ou `contracts/`, vale a fonte.

## 1. Antes de escrever qualquer coisa

Rode e confira. Se algum falhar, pare e avise; não escreva código.

```powershell
node --version          # 24 ou mais
npm install
npm test                # tudo verde
npm run typecheck       # sem erro
git status              # árvore limpa
git branch --show-current
```

Código que não foi executado não está pronto. Nunca escreva várias
tarefas antes de rodar os testes da primeira.

## 2. O que ler

Leia só isto, nesta ordem:

1. Este arquivo.
2. O brief da sua história, em `specs/001-reimplementar-printfarm/briefs/`.
3. As seções que o brief aponta, e nada além delas.

Não leia inteiros, a menos que o brief mande: `spec.md`, `research.md`,
`constitution.md`, `knowledge-graph.md`, `analysis.md`, `checklists/`.

| História | Brief | Tarefas | Estado |
|----------|-------|---------|--------|
| Setup, Fundação, US1 | — | T001–T031, T077–T083 | pronto |
| US2 Cadastros | `briefs/us2.md` | T032–T038 | pendente |
| US3 Orçamento | `briefs/us3.md` | T039–T045 | pendente |
| US4 Compras | `briefs/us4.md` | T046–T051 | pendente |
| US5 Execução | `briefs/us5.md` | T052–T058, T086–T088 | pendente |
| US6 Financeiro | `briefs/us6.md` | T059–T062 | pendente |
| Cancelamento de pedido | `briefs/cancelamento.md` | T084, T085 | pendente, depois de US3, US5, US6 |
| US7 Painel | `briefs/us7.md` | T063–T068 | pendente, depois de US4, US5 |
| US8 Trilha | `briefs/us8.md` | T069–T072 | pendente, por último |
| Polimento | `briefs/polimento.md` | T073–T076 | pendente |

## 3. Ciclo de cada tarefa

Uma tarefa por vez, na ordem em que aparecem em `tasks.md`.

1. Leia a linha da tarefa. Ela nomeia os arquivos.
2. Se a tarefa pede teste: escreva o teste, rode, veja falhar.
3. Implemente o mínimo para o teste passar.
4. Rode `npm test` e `npm run typecheck` na raiz. Os dois verdes.
5. Marque `- [X]` só nessa tarefa, em `tasks.md`.
6. Passe para a próxima. No fim da fase, confira a seção do
   `quickstart.md` que o brief indica e faça um commit.

## 4. Regras que não se quebram

- **Só os arquivos da tarefa.** Precisou de outro: pare e avise.
- **Nomes vêm de `data-model.md` e `contracts/`.** Não traduza, não
  abrevie, não invente estado, campo, rota ou código de erro.
- **Não adivinhe.** Regra ou número ausente: escreva
  `[NEEDS CLARIFICATION: pergunta]` no artefato dono e pare.
- **IDs não mudam.** Nunca renumere `Tnnn`, `FR-nnn`, `SC-nnn`. Tarefa
  nova recebe o próximo número livre, no fim da fase.
- **Não mexa em desenho numa branch de história.** `spec.md`,
  `plan.md`, `research.md`, `data-model.md`, `contracts/` e a
  constituição mudam em commit próprio, antes do código.
- **Migração mesclada na base não se edita.** Mudança de esquema é
  arquivo novo, com o número reservado em `tasks.md`.
- **Arquivo compartilhado: só acréscimo.** `server/src/api/app.ts`,
  `hourly-farm-job.ts`, `web/src/router/index.ts`, `web/src/App.vue`,
  `web/src/labels.ts`. Não reformate nem reordene.
- **Dependência nova só com registro em `plan.md`.** Sem ORM, fila,
  cron, nem pacote nativo.
- **Teste que falha não se apaga nem se enfraquece.**
- **Fora de escopo:** nota fiscal, boleto, gateway, frete cotado,
  telemetria, otimização de fila, assistente de IA.

## 5. Onde cada coisa mora

| O quê | Onde | Regra |
|-------|------|-------|
| Decisão de negócio | `server/src/domain/rules/` | Função pura. Não importa nada fora de `domain/`. Recebe `now` por parâmetro. Devolve `ok(valor)` ou `fail(code, mensagem)`; não lança exceção para recusa |
| Tipos | `server/src/domain/entities/` | Só tipos |
| Orquestração | `server/src/application/use-cases/` | Dentro de `transact(db, () => …)`. Carrega, chama a regra, grava. Recusa: `abort(falha)`. Nenhum `if` de negócio aqui. Nenhum `await` |
| SQL | `server/src/infrastructure/repositories/` | Único lugar com SQL |
| Esquema | `server/migrations/NNNN-nome.sql` | Colunas inteiras com sufixo de unidade; `CHECK` nos enums |
| Rota | `server/src/api/routes/` | Valida entrada, converte unidade, chama o caso de uso, traduz a recusa. Registrada em `api/app.ts` |
| Tela | `web/src/pages/` | Rótulos em português de `web/src/labels.ts` |

Detalhes que derrubam quem chega:

- **Números são inteiros.** Centavos, miligramas, segundos. Conversão
  para reais, gramas e minutos só na rota: saída por
  `server/src/api/format.ts`, entrada por `parseScaled` de
  `domain/units.ts`. Divisão só por `mulDivRoundHalfUp` e `mulDivCeil`.
- **TypeScript roda sem build.** Sem `enum` (use objeto `as const`),
  sem `namespace`, import relativo com `.ts`, `import type` para tipo.
- **Código de erro em MAIÚSCULAS_COM_SUBLINHADO.** `*_NOT_FOUND` vira
  404; os outros viram 409 (`statusForCode`).
- **Booleano no banco é 0 ou 1.**

## 6. Copie estes exemplos

| Para fazer | Copie o padrão de |
|------------|-------------------|
| Regra pura e seu teste | `server/src/domain/rules/printer-compatibility.ts`, `server/tests/domain/printer-compatibility.test.ts` |
| Máquina de estados | `server/src/domain/rules/sales-order-state.ts` |
| Caso de uso | `server/src/application/use-cases/enqueue-lot.ts` |
| Teste de orquestração (SQLite em memória) | `server/tests/application/release-lots.test.ts`, com `migratedDb` e `buildScenario` de `server/tests/helpers/` |
| Repositório | `server/src/infrastructure/repositories/production-repo.ts` |
| Migração | `server/migrations/0002-production-lots.sql` |
| Rota com papéis e conversão | `server/src/api/routes/lots.ts` |
| Teste de rota (401, 403, fluxo) | `server/tests/api/us1-flow.test.ts`, com `buildTestApp` e `tokenFor` |
| Página | `web/src/pages/FilaPage.vue` |

## 7. Comandos

```powershell
npm test                              # servidor e tela
npm test --workspace server           # só o servidor
npm run typecheck
npm audit                             # sem achado alto ou crítico
npm run dev --workspace server        # API em http://127.0.0.1:5088
npm run dev --workspace web           # tela em http://localhost:5173
npm run job:hourly --workspace server # uma passagem do job periódico
Remove-Item data\farm3d.db*           # recomeçar o banco
```

Usuários de teste e roteiros: `specs/001-reimplementar-printfarm/quickstart.md`.

## 8. Pare e pergunte quando

- o brief lista um bloqueio para a tarefa;
- dois documentos se contradizem;
- a tarefa exige arquivo que ela não nomeia, ou dependência nova;
- um teste que já passava começa a falhar e a causa não é a sua mudança;
- você está prestes a apagar ou reescrever código que não é da tarefa.

## 9. Branches e commits

- Base da feature: `001-reimplementar-printfarm`. Ninguém commita
  direto nela; tudo entra por pull request.
- Uma história, uma branch: `<autor>/001-<história>`, criada a partir
  da base atualizada. Faça `git fetch` e rebase sobre a base todo dia.
- Commit no fim de cada fase, com os testes verdes, no formato
  `tipo(escopo): assunto`.
- Não rode `/speckit.specify` nem `speckit.git.feature`: eles criariam
  outra feature.

## 10. Mudar o desenho

Só quem for alterar spec, plan, data-model, contratos ou tarefas lê
`.specify/memory/constitution.md` inteira e
`.specify/memory/knowledge-graph.md`. O fluxo é `/speckit.clarify`,
`/speckit.plan`, `/speckit.tasks`, `/speckit.analyze`, sempre com
`git fetch` antes: outra pessoa pode ter publicado desenho na base.
