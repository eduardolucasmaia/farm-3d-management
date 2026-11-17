# Contract: Cadastros

Todos exigem sessão. Respostas 401 sem sessão, 403 sem papel, 400 com a regra violada em texto estável.

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

- Print profile: "Peças por prancha, minutos por prancha e gramas por prancha, todos maiores que zero." Edição válida afeta somente novas liberações; não atualiza campos released* de lotes de produção existentes, seus tempos, gramas, reservas ou reimpressões. FR-011.
- Printer: "Limite de horas de manutenção maior que zero." O corpo não aceita alterar `hourRateExcludesFilamentAndEnergy`; a resposta traz esse campo sempre `true` e a frase "A taxa de hora-máquina não inclui filamento nem energia."
- Printer `compatibleMaterialIds`: lista vazia é válida e significa qualquer material.
- Product: `defaultSellPrice` ≥ 0. `offeredColors` e `offeredSizes` são listas. `isForSale` bool.
- Color `hex`: ou vazio ou `#RRGGBB`.
- Material `reorderPointGrams`: nulo ou ≥ 0.

## POST /api/printers/{id}/materials

Papel: Production, Admin. Substitui a lista de materiais compatíveis.

## POST /api/files3d/{id}/versions

Papel: Production, Admin. Multipart com o arquivo e `versionLabel`. Resposta 201 com rótulo e caminho relativo, sem devolver o binário na listagem.
