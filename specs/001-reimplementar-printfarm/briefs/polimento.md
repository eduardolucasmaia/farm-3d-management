# Brief: polimento e fechamento da feature

**Branch**: `<autor>/001-polimento`, a partir de `001-reimplementar-printfarm`
**Depende de**: todas as histórias que a entrega decidiu incluir, mescladas na base
**Tarefas, nesta ordem** (`tasks.md`, "Phase 11"): T073, T074, T076, T075

Este brief só aponta. A regra está nos documentos citados.

## Bloqueios

Qualquer achado de T076 bloqueia T075.

## Leia só isto

- `tasks.md`: seção "Phase 11"
- `quickstart.md`: "Pré-requisitos" e "Pronto quando"
- `.specify/memory/constitution.md`: só a seção "Fora de escopo"

## Arquivos

- Novo: `README.md` na raiz, curto, apontando para `AGENTS.md` e para o `quickstart.md`
- Revisão, sem mudar comportamento: `web/src/pages/`

## Armadilhas

- T076 é uma busca, não uma limpeza: liste o que achar e pare. Não apague nada sem a equipe ver.
- Não copie o conteúdo do quickstart para o README; aponte.
- Depois de T075, quem fecha a feature roda `/speckit.converge` até a resposta ser `Converged`, e atualiza a tabela de estado em `AGENTS.md` e o `.specify/memory/knowledge-graph.md`.

## Pronto quando

- `npm test`, `npm run typecheck` e `npm audit` limpos.
- As seções do `quickstart.md` das histórias entregues conferidas.
- T073–T076 marcadas `[X]`.
