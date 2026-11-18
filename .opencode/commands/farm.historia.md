---
description: Implementa uma história da feature ativa, uma tarefa por vez, seguindo AGENTS.md e o brief da história
---

## Entrada

```text
$ARGUMENTS
```

A entrada é o nome de um brief: `us2`, `us3`, `us4`, `us5`, `us6`, `cancelamento`, `us7`, `us8` ou `polimento`. Se estiver vazia ou não for um desses, liste os briefs de `specs/001-reimplementar-printfarm/briefs/` e pare.

## Passos

1. Leia `AGENTS.md` na raiz. Siga-o em tudo.
2. Leia `specs/001-reimplementar-printfarm/briefs/<entrada>.md`.
3. Rode o pré-voo da seção 1 de `AGENTS.md` (`node --version`, `npm install`, `npm test`, `npm run typecheck`, `git status`, `git branch --show-current`). Se algo falhar, ou se a branch atual for `main` ou `001-reimplementar-printfarm`, mostre o resultado e pare.
4. Confira "Depende de" e "Bloqueios" no brief. Se uma dependência não está pronta, pare. Se um bloqueio atinge uma tarefa, faça as tarefas anteriores a ela e pare antes dela.
5. Leia só as seções listadas em "Leia só isto" do brief.
6. Em `tasks.md`, ache a primeira tarefa `- [ ]` da lista do brief. Execute o ciclo da seção 3 de `AGENTS.md` para ela: teste primeiro quando a tarefa pedir, implementação mínima, `npm test` e `npm run typecheck` verdes, marcar `- [X]`.
7. Repita o passo 6 até acabar a lista do brief ou até uma condição da seção 8 de `AGENTS.md`.
8. No fim, mostre: tarefas concluídas, resultado de `npm test` e `npm run typecheck`, arquivos alterados que nenhuma tarefa nomeava, e os passos do `quickstart.md` que o brief manda conferir à mão. Não faça commit nem push; quem pede é a pessoa.

## Proibido neste comando

- Editar `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`, a constituição ou outro brief.
- Marcar `- [X]` com teste vermelho ou sem ter rodado os testes.
- Fazer mais de uma tarefa antes de rodar os testes.
- Instalar dependência que `plan.md` não lista.
