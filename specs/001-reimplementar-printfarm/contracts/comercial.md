# Contract: Comercial

Sessão obrigatória. Escrita de orçamento e pedido: Sales, Admin. Leitura: Sales, Production, Admin. Convenções de erro, números e datas: contracts/auth.md. Preços em reais com até 2 casas; `validUntil` e `promisedDate` como data `AAAA-MM-DD`.

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

## Cancelamento de pedido por PATCH /api/sales-orders/{id}/status

Corpo: `{ "status": "Cancelled" }`. Papéis Sales ou Admin. FR-009.

- Aceitar QuotePending, Approved ou InProduction apenas por planejamento, se não houver execução com StartedAt, fatura nem pagamento. Uma execução iniciada que já terminou ou falhou também impede cancelamento. Execução Planned sem início não impede.
- 200: pedido Cancelled; lotes de produção pendentes Cancelled; itens de fila e execuções Planned sem início removidos; reservas liberadas uma única vez com Unreserve e trilha das mudanças. A operação é uma transação, sem cancelamento parcial.
- 409: `code: ORDER_CANCELLATION_BLOCKED` com `blockers` entre `EXECUTION_STARTED`, `INVOICE_EXISTS` e `PAYMENT_EXISTS`. Pedido já Cancelled continua imutável e não libera reservas novamente.
- Na recusa, não mudar pedido, lotes, fila, reservas nem lançamentos financeiros.
- Consultar as condições e aplicar mudanças dentro de uma única transação de escrita exclusiva (`BEGIN IMMEDIATE`, research.md item 3). Início de execução, liberação e lançamento de fatura ou pagamento consultam o pedido dentro da própria transação de escrita. Como só uma transação de escrita existe por vez, um cancelamento e uma ação que deveria bloqueá-lo nunca confirmam juntos. Recusa de regra: 409; falha de infraestrutura: 503 e consulta do estado antes de repetir.

Não há estorno financeiro nem reversão de produção. O orçamento de origem continua OrderGenerated; cancelar o pedido não permite gerar outro pelo mesmo orçamento.
