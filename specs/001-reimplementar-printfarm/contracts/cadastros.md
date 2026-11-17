# Contract: Cadastros

Todos exigem sessão. Respostas 401 sem sessão, 403 sem papel, 400 com a regra violada em texto estável. Convenções de erro, números e datas: contracts/auth.md. Unidades na API: preço em reais (2 casas), custo de referência em reais por kg (2 casas), ponto de reposição em gramas (3 casas), diâmetro em mm (3 casas), minutos por prancha (2 casas), gramas por prancha (3 casas), taxa de hora-máquina em reais por hora (2 casas), energia em kWh por hora (3 casas), minutos de preparação (2 casas), limite de manutenção em horas inteiras.

| Recurso | GET lista e GET id | POST e PUT | Papel de escrita |
|---------|--------------------|------------|------------------|
| /api/customers | Sales, Production, Admin | Sales, Admin | Vendas |
| /api/suppliers | Purchasing, Admin | Purchasing, Admin | Compras |
| /api/colors | qualquer autenticado | Admin, Production | Produção |
| /api/materials | qualquer autenticado | Purchasing, Admin | Compras |
| /api/files3d | Production, Admin | Production, Admin | Produção |
| /api/print-profiles | Production, Admin | Production, Admin | Produção |
| /api/products | Sales, Production, Admin | Sales, Admin | Vendas |
| /api/printers | Production, Operator, Admin | Production, Admin | Produção |
| /api/operators | Production, Operator, Admin | Production, Admin | Produção |

## Regras que a escrita MUST recusar

- Print profile: "Peças por prancha, minutos por prancha e gramas por prancha, todos maiores que zero."
- Printer: "Limite de horas de manutenção maior que zero." O corpo não aceita alterar `hourRateExcludesFilamentAndEnergy`; a resposta traz esse campo sempre `true` e a frase "A taxa de hora-máquina não inclui filamento nem energia."
- Printer `compatibleMaterialIds`: lista vazia é válida e significa qualquer material.
- Product: `defaultSellPrice` ≥ 0. `offeredColors` e `offeredSizes` são listas. `isForSale` bool.
- Color `hex`: ou vazio ou `#RRGGBB`.
- Material `reorderPointGrams`: nulo ou ≥ 0.

## POST /api/printers/{id}/materials

Papel: Production, Admin. Substitui a lista de materiais compatíveis.

## POST /api/files3d/{id}/versions

Papel: Production, Admin. Multipart com o arquivo e `versionLabel`. Resposta 201 com rótulo e caminho relativo, sem devolver o binário na listagem.
