# Contract: Identificação

Base: `/api`. JSON. Sessão: cabeçalho `Authorization: Bearer <token>`, exceto o login.

## POST /api/auth/login

Público.

Pedido: `{ "email": string, "password": string }`

- 200: `{ "token": string, "email": string, "roles": string[] }`
- 401: e-mail ou senha inválidos. Após a política de travamento do Identity, 401 com a mesma mensagem genérica, sem dizer se o e-mail existe.

## POST /api/users

Papel: Admin.

Pedido: `{ "email": string, "name": string, "password": string, "role": "Admin"|"Sales"|"Production"|"Purchasing"|"Operator" }`

- 201: `{ "id": string, "email": string, "name": string, "role": string }`
- 400: papel fora da lista, e-mail repetido ou senha recusada pela política do Identity.
- 403: outro papel.

## GET /api/users

Papéis: Admin, Production.

- 200: lista de `{ "id", "email", "name" }` sem senha e sem hash.
- 403: demais papéis.

Regra citada do data-model: leitura da trilha é Admin e Production; a lista de usuários para vínculo segue os mesmos dois papéis na spec (FR-002). Produção não cria usuário.
