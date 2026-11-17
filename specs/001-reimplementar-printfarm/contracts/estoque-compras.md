# Contract: Estoque e compras

Sessão obrigatória. Escrita: Purchasing, Admin. Leitura de saldo: Purchasing, Production, Admin. Convenções de erro, números e datas: contracts/auth.md. Quilos com até 6 casas, gramas com até 3, preço por quilo em reais com até 2.

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

Lista com kind, quantityG, unitCost, origem e momento.

A reserva em si não tem endpoint solto. Ela ocorre em `POST /api/sales-orders/{id}/lots/release`, documentada em `producao.md`. A ordem dos lotes é ReceivedAt e, no empate, Id. "Saldo insuficiente recusa a liberação inteira, sem reserva parcial."
