# Contract: Identificação

Base: `/api`. JSON. Sessão: cabeçalho `Authorization: Bearer <token>`, exceto o login.

Convenções que valem para todos os contratos desta pasta:

- Sem sessão válida: 401. Sessão com papel fora da lista da rota: 403. A recusa acontece no servidor.
- Erro: `application/problem+json` com `type`, `title`, `status`, `detail` e `code` (research.md item 15). `detail` traz o texto estável da regra violada. `code` e valores de lista como `blockers` são MAIÚSCULAS_COM_SUBLINHADO (por exemplo `INSUFFICIENT_MATERIAL`). Campos de contexto (como `lotIndex`, `neededGrams`) vêm no mesmo objeto.
- Número decimal no JSON segue as casas da tabela "Unidades e representação" de data-model.md. Mais casas que o permitido: 400.
- Instante no JSON: ISO-8601 em UTC. Data sem hora: `AAAA-MM-DD`.

## POST /api/auth/login

Público.

Pedido: `{ "email": string, "password": string }`

- 200: `{ "token": string, "email": string, "roles": string[] }`
- 200: o token é JWT HS256 com validade de 8 horas.
- 401: e-mail ou senha inválidos. Depois de 5 falhas seguidas o usuário fica travado por 5 minutos; durante o travamento a resposta é a mesma 401 com a mesma mensagem genérica, sem dizer se o e-mail existe nem que houve travamento. Login certo zera o contador. Regra completa: research.md item 4.

## POST /api/users

Papel: Admin.

Pedido: `{ "email": string, "name": string, "password": string, "role": "Admin"|"Sales"|"Production"|"Purchasing"|"Operator" }`

- 201: `{ "id": string, "email": string, "name": string, "role": string }`
- 400: papel fora da lista, e-mail repetido ou senha fora da política (mínimo de 6 caracteres, com maiúscula, minúscula, dígito e símbolo; research.md item 4).
- 403: outro papel.

## GET /api/users

Papéis: Admin, Production.

- 200: lista de `{ "id", "email", "name" }` sem senha e sem hash.
- 403: demais papéis.

Regra citada do data-model: leitura da trilha é Admin e Production; a lista de usuários para vínculo segue os mesmos dois papéis na spec (FR-002). Produção não cria usuário.
