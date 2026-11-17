# Data Model: Reimplementar o núcleo da farm

**Feature**: `specs/001-reimplementar-printfarm`  
**Date**: 2026-11-16

Nomes de código em inglês, rótulos de tela em português, conforme o vocabulário da constituição. "Lote" sozinho não aparece em rótulo.

Dinheiro: `decimal` quantizado a `0.01`, metade para cima. Gramas: `decimal` com três casas. Instantes: `DateTimeOffset`.

## Enums

| Nome | Valores |
|------|---------|
| AppRole | Admin, Sales, Production, Purchasing, Operator |
| MaterialKind | Filament, Resin, SparePart, Packaging, Other |
| QuoteStatus | Draft, Sent, Approved, Rejected, Expired, OrderGenerated |
| CommercialOrderStatus | QuotePending, Approved, InProduction, AwaitingFinishing, ReadyToShip, Delivered, Cancelled |
| ProductionLotStatus | AwaitingPlanning, Released, Queued, Printing, Paused, AwaitingPickup, Completed, Failed, Cancelled |
| PrinterOperationalStatus | Available, Printing, AwaitingPickup, Preparing, InMaintenance, Unavailable |
| PrintRunStatus | Planned, Running, Paused, Failed, Completed |
| PrintFailureReason | None, BedAdhesion, Clog, LayerShift, OutOfMaterial, Other |
| PurchaseOrderStatus | Draft, Sent, PartiallyReceived, Received, Cancelled |
| StockMovementKind | PurchaseIn, ProductionOut, Adjustment, Reserve, Unreserve, Waste |
| PaymentMethod | Cash, Card, Pix, BankTransfer, Other |

Rótulos de `ProductionLotStatus`: Aguardando planejamento, Liberado, Na fila, Em impressão, Pausado, Aguardando retirada, Concluído, Falha, Cancelado.

Rótulos de `PrinterOperationalStatus`: Disponível, Em impressão, Aguardando retirada, Em preparação, Em manutenção, Indisponível.

## FarmSettings

Uma linha só.

| Campo | Regra |
|-------|--------|
| EnergyTariffPerKwh | decimal opcional. Nulo significa premissa ausente. |
| CalendarSummary | texto obrigatório. Padrão: "segunda a sexta, 08:00–18:00". |
| WorkDays | flags. Padrão: segunda a sexta. |
| WorkStart / WorkEnd | hora local. Padrão: 08:00 e 18:00. |
| ExamplesAreFictional | bool. MUST permanecer verdadeiro enquanto os números de exemplo não forem série medida. |

## Customer, Supplier, Color

- **Customer**: Name obrigatório; Email, Phone, Address opcionais; CreatedAt.
- **Supplier**: Name obrigatório; PaymentTerms e AverageLeadTimeDays opcionais; contato opcional.
- **Color**: Name obrigatório; Hex opcional no formato `#RRGGBB`.

## Material e estoque

- **Material**: Name obrigatório; Kind obrigatório; ReferenceCostPerKg ≥ 0; ReorderPointGrams nulo ou ≥ 0; DiameterMm nulo ou > 0; ColorId opcional.
- **MaterialLot**: MaterialId e SupplierId obrigatórios; LotCode obrigatório e único por material; ReceivedAt obrigatório; InitialWeightG > 0; CurrentWeightG ≥ 0 e ≤ InitialWeightG; CostPerGram ≥ 0.
- **StockItem**: MaterialId obrigatório; MaterialLotId opcional (nulo = agregado do material, não usado na reserva); QuantityG ≥ 0; ReservedG ≥ 0; ReservedG ≤ QuantityG. Livre = QuantityG − ReservedG.
- **StockMovement**: Kind obrigatório; QuantityG > 0; UnitCost ≥ 0; CreatedAt; UserId; origem opcional em ProductionLotId, PrintRunId ou PurchaseReceiptId. "Movimentação guarda tipo, gramas, custo unitário e origem."

## Catálogo de produção

- **File3D**: Name obrigatório. **File3DVersion**: VersionLabel obrigatório; StoragePath obrigatório; CreatedAt.
- **PrintProfile**: Name obrigatório; PiecesPerPlate ≥ 1 inteiro; MinutesPerPlate > 0; GramsPerPlate > 0; MaterialId opcional. "Peças por prancha, minutos por prancha e gramas por prancha, todos maiores que zero."
- **Product** (modelo): Name e Sku obrigatórios, Sku único; DefaultSellPrice ≥ 0; DefaultPrintProfileId obrigatório para liberar; IsForSale bool; listas de ColorId e tamanhos (texto curto) oferecidos. Preço de venda não é custo.
- **Printer**: Name obrigatório; CostPerHour ≥ 0; EnergyKwhPerHour nulo ou ≥ 0; MaintenanceLimitHours > 0; AccumulatedHours ≥ 0; PreparationMinutes ≥ 0; IsActive; OperationalStatus; HourRateExcludesFilamentAndEnergy MUST ser verdadeiro e não editável. "Limite de horas de manutenção maior que zero." "A taxa de hora-máquina não inclui filamento nem energia."
- **PrinterMaterial**: par PrinterId + MaterialId. Lista vazia significa compatível com qualquer material.
- **Operator**: Name obrigatório; UserId opcional.

## Comercial

- **Quote**: Number único; CustomerId; Status; ValidUntil opcional; Notes; CreatedAt; TotalAmount = soma das linhas. Transições: Draft → Sent; Draft ou Sent → Approved; Draft, Sent ou Approved → Rejected; Draft, Sent ou Approved → Expired só pelo processamento periódico quando ValidUntil já passou; Approved → OrderGenerated só na geração do pedido. Rejected, Expired e OrderGenerated não geram pedido. "Rejeitado e pedido gerado não são expirados."
- **QuoteLine**: ProductId; Quantity > 0 inteiro; UnitPrice ≥ 0; MaterialId opcional. Subtotal = Quantity × UnitPrice, quantizado ao centavo, metade para cima.
- **SalesOrder**: Number único; CustomerId; QuoteId opcional; CommercialStatus; PromisedDate opcional no rascunho manual e obrigatória na geração por orçamento; FreightAmount ≥ 0; PackagingAmount ≥ 0; Notes. Pedido manual nasce QuotePending. De QuotePending só para Approved ou Cancelled. Cancelled não muda. "Pedido em confirmação pendente não gera lote de produção, fatura nem pagamento."
- **OrderLine**: ProductId; Quantity > 0; UnitPrice ≥ 0; MaterialId obrigatório na liberação; ColorId obrigatório se o modelo oferece cores; Size obrigatório se o modelo oferece tamanhos. A escolha fica gravada.

## Produção

- **ProductionLot**: SalesOrderId; OrderLineId; ProductId; MaterialId; QtyPlanned > 0; QtyCompleted ≥ 0 e ≤ QtyPlanned; Status; PlannedGrams > 0; PlannedMinutes > 0; CreatedAt; ReleasedAt opcional; CompletedAt opcional.
- **Corte**: quantidade de lotes = teto(peças da linha / peças por prancha). Lote cheio: PlannedGrams = GramsPerPlate e PlannedMinutes = MinutesPerPlate. Lote incompleto: ambos × (peças do lote / peças por prancha). "10 peças com 4 por prancha produzem 3 lotes, o último com metade do tempo e metade do material."
- **ProductionMaterialReservation**: ProductionLotId; StockItemId; GramsReserved > 0. Uma liberação bem-sucedida cobre PlannedGrams. "Saldo insuficiente recusa a liberação inteira, sem reserva parcial." "Repetir a liberação já reservada é recusado."
- **PrintQueueItem**: ProductionLotId único na fila ativa; PrinterId opcional; Priority inteiro; Position inteiro ≥ 1.
- **PrintRun**: ProductionLotId; PrinterId; OperatorId opcional; Status; StartedAt; EndedAt; PausedSeconds ≥ 0; FailureReason; FailureNotes; ActualMaterialG nulo até a conclusão, e na conclusão > 0; ActualMinutes; MaterialLotId opcional; ReprintOfPrintRunId opcional.

### Transições do lote de produção

| De | Evento | Para |
|----|--------|------|
| AwaitingPlanning | liberar com reserva integral | Released |
| Released | enfileirar | Queued |
| Queued | iniciar execução | Printing |
| Printing | pausar | Paused |
| Paused | retomar | Printing |
| Printing | concluir impressão | AwaitingPickup |
| AwaitingPickup | confirmar retirada após execução concluída | Completed |
| Printing ou Paused | falhar sem reimpressão | Failed |
| Printing ou Paused | falhar com reimpressão | Queued |
| AwaitingPlanning ou Released ou Queued | cancelar | Cancelled |

Completed, Failed e Cancelled não mudam, salvo o retorno Queued no caso de reimpressão a partir de Printing ou Paused (o lote que falhou com reimpressão não permanece em Failed).

Um pedido está produzido somente quando todos os seus lotes estão Completed.

### Transições da impressora

| De | Evento | Para |
|----|--------|------|
| Available | iniciar execução | Printing |
| Printing | concluir impressão ou falhar execução | AwaitingPickup |
| AwaitingPickup | confirmar retirada | Preparing |
| Preparing | concluir preparação e horas acumuladas < limite e não bloqueada | Available |
| Preparing | concluir preparação e horas acumuladas ≥ limite | InMaintenance |
| InMaintenance | confirmar manutenção com nota | Available, se não estiver marcada indisponível |
| qualquer exceto InMaintenance | admin marca indisponível | Unavailable |
| Unavailable | admin reativa, sem manutenção vencida e sem execução aberta | Available |

Pausa do lote não muda o estado da impressora: ela permanece Em impressão. Confirmar a retirada depois de uma execução concluída marca o lote como Concluído. Confirmar a retirada depois de uma falha não muda o lote, que já está em Falha.

"Concluir a impressão deixa o lote aguardando retirada e a impressora aguardando retirada." "A impressora só volta a disponível depois da retirada e da preparação, e somente se as horas acumuladas estiverem abaixo do limite."

Horas acumuladas aumentam pelo tempo real de impressão na conclusão, não pela pausa.

## Compras e financeiro

- **PurchaseOrder**: SupplierId; Number único; Status; OrderedAt; ExpectedAt opcional. Draft → Sent → PartiallyReceived → Received. Cancelled a partir de Draft ou Sent, se nada foi recebido.
- **PurchaseOrderLine**: MaterialId; QuantityKg > 0; UnitPrice ≥ 0.
- **PurchaseReceipt**: PurchaseOrderId; ReceivedAt; Notes. **PurchaseReceiptLine**: MaterialLotId; ReceivedWeightG > 0. "Recebimento com peso zero ou negativo é recusado." 1 kg pedido = 1000 g recebidos na comparação de completo.
- **Invoice**: SalesOrderId de pedido que não está QuotePending nem Cancelled; Number; Amount > 0; IssuedAt; DocumentReference opcional. Não há entidade de nota fiscal.
- **Payment**: SalesOrderId nas mesmas condições; Amount > 0; Method; PaidAt; Reference opcional.

## Leitura operacional

- **DeadlineAlert**: RunAt; OverdueCount; DueTodayCount. Atrasado = PromisedDate < hoje e existe lote não Completed e não Cancelled. Vencendo hoje = PromisedDate no dia local da farm.
- **RestockSuggestion**: RunAt; MaterialId; AvailableGrams; SuggestedOrderGrams. Só quando ReorderPointGrams não é nulo e o livre do material está abaixo dele. SuggestedOrderGrams = ReorderPointGrams − livre, mínimo zero.
- **AuditLog**: EntityName; EntityId; Action; UserId; At; FromStatus; ToStatus. "Trilha guarda entidade, ação, usuário, momento, estado anterior e estado novo." Leitura: Admin e Production.

## Custo estimado (valor calculado, não tabela)

Entradas: gramas, preço por grama, horas, kWh por hora, tarifa por kWh, taxa de hora-máquina.

- Filamento = gramas × preço por grama.
- Energia = horas × kWh por hora × tarifa.
- Máquina = horas × taxa.
- Total só existe se tarifa, preço por grama, taxa e energia por hora estão presentes.
- A resposta inclui a frase: "A taxa de hora-máquina não inclui filamento nem energia."

Backlog = soma de PlannedMinutes ainda não executados, em horas. A previsão declara o calendário vigente, o paralelismo e a compatibilidade. Aproximação "horas ÷ máquinas equivalentes" só com a frase de que as capacidades foram tratadas como equivalentes.
