# Contract: Comercial

Sessão obrigatória. Escrita de orçamento e pedido: Sales, Admin. Leitura: Sales, Production, Admin.

## Orçamentos

- `POST /api/quotes` cria em Draft. Corpo: customerId, validUntil opcional, notes, lines[] com productId, quantity > 0, unitPrice ≥ 0, materialId opcional.
- `POST /api/quotes/{id}/send` só de Draft para Sent.
- `POST /api/quotes/{id}/approve` só de Draft ou Sent para Approved.
- `POST /api/quotes/{id}/reject` de Draft, Sent ou Approved. Corpo opcional `{ "reason": string }`. O motivo é acrescentado a Notes como `Rejeição: …`.
- `GET /api/quotes` e `GET /api/quotes/{id}` incluem linhas com modelo, material, quantidade, preço unitário e subtotal.
- Transição ilegal: 409.

## Pedidos

- `POST /api/sales-orders` cria em QuotePending. Linha grava colorId se o modelo oferece cores e size se oferece tamanhos; senão 400.
- `POST /api/sales-orders/from-quote/{quoteId}` exige `{ "promisedDate": string }`. Orçamento precisa estar Approved e não vencido. Nasce Approved. Orçamento vai a OrderGenerated. Segunda chamada: 409 e um único pedido.
- `PATCH /api/sales-orders/{id}/status` de QuotePending só para Approved ou Cancelled. Cancelled posterior: 409. Não existe volta para QuotePending.

Estados comerciais seguintes (InProduction, AwaitingFinishing, ReadyToShip, Delivered) são atualizados pela produção ao concluir o conjunto de lotes e pela expedição manual:

- todos os lotes Completed → ReadyToShip, se ainda não entregue nem cancelado
- `PATCH` para Delivered só a partir de ReadyToShip, papel Sales ou Admin
- InProduction quando o primeiro lote sai de AwaitingPlanning
- AwaitingFinishing quando todos os lotes estão Completed ou AwaitingPickup e ainda falta encerrar algum

Pedido QuotePending ou Cancelled recusa criação de lote, fatura e pagamento com 409.
