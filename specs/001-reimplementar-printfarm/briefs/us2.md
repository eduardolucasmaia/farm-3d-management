# Brief: US2, manter a base da operação

**Branch**: `<autor>/001-us2-cadastros`, a partir de `001-reimplementar-printfarm`
**Depende de**: US1 mesclada na base
**Tarefas, nesta ordem** (`tasks.md`, "Phase 4"): T032, T033, T034, T035, T036, T037, T038
**Migração reservada**: `0003-masters.sql`

Este brief só aponta. A regra está nos documentos citados.

## Bloqueios

Nenhum.

## Leia só isto

- `tasks.md`: seção "Phase 4"
- `contracts/cadastros.md`: inteiro (32 linhas)
- `contracts/auth.md`: "POST /api/users" e "GET /api/users"
- `data-model.md`: "Unidades e representação", "Customer, Supplier, Color", "Material e estoque", "Catálogo de produção"
- `quickstart.md`: seção 2

## Arquivos novos

- `server/tests/domain/master-data-rules.test.ts`, `server/src/domain/rules/master-data-rules.ts`
- `server/src/domain/entities/masters.ts`
- `server/migrations/0003-masters.sql`, `server/src/infrastructure/repositories/masters-repo.ts`
- `server/src/api/routes/cadastros/`: `customers.ts`, `suppliers.ts`, `colors.ts`, `materials.ts`, `files3d.ts`, `print-profiles.ts`, `products.ts`, `operators.ts`
- `server/src/api/routes/users.ts`, `server/src/infrastructure/files/file-store.ts`
- `web/src/pages/cadastros/*.vue`

## Arquivos que já existem: só acrescente

- `server/src/api/routes/cadastros/printers.ts`: já tem o `GET`; acrescente a escrita e `POST /api/printers/{id}/materials`
- `server/src/infrastructure/repositories/catalog-repo.ts`: leitura de impressora já existe
- `server/src/api/app.ts`: registre as rotas novas e o `@fastify/multipart`
- `web/src/router/index.ts`, `web/src/App.vue` (menu), `web/src/labels.ts`

## Já pronto, reutilize

- `checkPasswordPolicy`, `hashPassword`, `insertUser`, `listUsers` (para T036)
- `HOUR_RATE_STATEMENT` em `routes/cadastros/printers.ts`
- `parseScaled` para ler reais, gramas, minutos, mm e kWh; `server/src/api/format.ts` para devolver

## Armadilhas

- As tabelas `customers`, `suppliers`, `colors`, `materials`, `print_profiles`, `products`, `printers` e `printer_materials` já existem (migração 0002). A 0003 cria só `operators`, `files3d`, `file3d_versions` e acrescenta `file3d_id` a `products` (achado G1 de `plan.md`).
- A API recebe minutos, gramas e reais; o banco guarda segundos, mg e centavos. As casas aceitas estão na primeira linha de `contracts/cadastros.md`.
- `hourRateExcludesFilamentAndEnergy` não é aceito no corpo; a resposta sempre traz `true`.
- Editar um perfil não pode tocar em `production_lots`: os lotes guardam os próprios parâmetros.
- Cada rota precisa de `requireRoles` com os papéis da tabela do contrato. Acrescente um caso de 403 em `server/tests/api/`.
- Upload: recuse nome de arquivo que saia de `FARM3D_FILES_DIR`.

## Pronto quando

- `npm test` e `npm run typecheck` verdes.
- `quickstart.md` seção 2, passos 1 a 4, conferidos na tela.
- `quickstart.md` seção 1, passos 7 e 8 (editar o perfil), agora conferíveis na tela.
- T032–T038 marcadas `[X]`.
