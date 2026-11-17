# Contract: Estoque e compras

Sessão obrigatória. Escrita: Purchasing, Admin. Leitura de saldo: Purchasing, Production, Admin.

## POST /api/purchase-orders

Corpo: supplierId, lines[] com materialId, quantityKg > 0, unitPrice ≥ 0. Nasce Draft.

## POST /api/purchase-orders/{id}/send

Draft → Sent. 409 caso contrário.

## POST /api/purchase-orders/{id}/receipts

Corpo: `{ "lines": [ { "purchaseOrderLineId": number, "weightG": decimal, "lotCode": string } ] }`

- weightG > 0, senão 400. "Recebimento com peso zero ou negativo é recusado."
- 201: cria MaterialLot (peso inicial = peso atual = weightG, custo por grama = preço do quilo / 1000), StockItem, StockMovement PurchaseIn.
- Estado do pedido: PartiallyReceived enquanto a soma recebida em gramas for menor que quantityKg × 1000; Received quando atingir. Acima do pedido: 409.
- Cancelled ou Received: 409.

## POST /api/purchase-orders/{id}/cancel

Só Draft ou Sent sem recebimento. 409 se já houve entrada.

## GET /api/stock

Lista por material e por lote: quantityG, reservedG, freeG (quantityG − reservedG).

## GET /api/stock/movements?materialId=

Lista com kind, quantityG, unitCost, stockItemId, materialLotId, productionLotId, printRunId quando houver, origem e momento. Movimentos terminais ligados ao mesmo printRunId detalham uma única baixa lógica; quantityG e unitCost preservam quantidade e custo de cada lote de material, sem aplicar custo de uma origem arbitrária ao conjunto.

A reserva em si não tem endpoint solto. Ela ocorre em `POST /api/sales-orders/{id}/lots/release`, documentada em `producao.md`. A ordem dos lotes é ReceivedAt e, no empate, Id. "Saldo insuficiente recusa a liberação inteira, sem reserva parcial."

O complemento de reimpressão também não tem endpoint manual: é tentado no registro da falha com reimpressão e novamente ao iniciar a execução planejada, conforme `producao.md`. Falta para o complemento mantém a reserva restante; não permite reservar apenas parte do complemento.

ProductionOut é consumo de conclusão; Waste é consumo positivo de falha. Zero em falha fica na execução e não cria movimento de saída. Consumo usa a reserva própria e, se necessário, saldo livre FIFO. QuantityG, CurrentWeightG, ReservedG, reservas ativas e movimentações devem fechar na mesma transação. Reserva, consumo e liberação nunca usam o saldo agregado como um segundo estoque movimentável.

Recebimento e outras gravações de saldo participam da mesma disciplina Serializable. Os testes SQL Server isolados precisam provar rollback, disputa pelo saldo e proteção de reservas alheias; o provedor InMemory não comprova essas garantias. FR-012, FR-017, FR-018 e FR-024.
