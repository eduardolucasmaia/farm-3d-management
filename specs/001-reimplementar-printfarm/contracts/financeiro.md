# Contract: Financeiro

Sessão obrigatória. Escrita e leitura: Sales, Admin. Convenções de erro, números e datas: contracts/auth.md. Valores em reais com até 2 casas.

Não existe recurso de nota fiscal, boleto ou cobrança.

## POST /api/sales-orders/{id}/invoices

Corpo: `{ "number": string, "amount": decimal, "issuedAt": string, "documentReference": string|null }`

- amount > 0.
- 201 quando o pedido não está QuotePending nem Cancelled.
- 409 quando está. "Pedido em confirmação pendente não gera lote de produção, fatura nem pagamento."

## GET /api/sales-orders/{id}/invoices

## POST /api/sales-orders/{id}/payments

Corpo: `{ "amount": decimal, "method": "Cash"|"Card"|"Pix"|"BankTransfer"|"Other", "paidAt": string, "reference": string|null }`

- amount > 0. method fora da lista: 400.
- 409 nas mesmas condições da fatura.

## GET /api/sales-orders/{id}/payments

O total pago pode ser menor, igual ou maior que a soma das faturas. O sistema não concilia banco e não bloqueia produção por inadimplência nesta feature.

Fatura e pagamento verificam o pedido e gravam o lançamento na mesma transação de escrita exclusiva, na disciplina de `comercial.md`. Se o cancelamento vencer a disputa, o lançamento é recusado; se o lançamento for confirmado primeiro, o cancelamento é recusado. Não basta validar o pedido fora da transação. Esta regra não adiciona estornos. FR-009 e FR-021.
