# Contract: Painel e parâmetros

Sessão obrigatória. Leitura do painel: Admin, Production, Sales. Escrita dos parâmetros: Admin. Convenções de erro, números e datas: contracts/auth.md.

"Dia local" e "hoje" são calculados no fuso `timeZone` dos parâmetros. Valores de custo saem em reais com 2 casas.

## GET /api/dashboard

```json
{
  "overdueCount": 0,
  "dueTodayCount": 0,
  "inProductionCount": 0,
  "printersPrinting": [ { "id": 1, "name": "..." } ],
  "materialConsumedGLast7Days": 0,
  "examplesAreFictional": true,
  "calendarSummary": "segunda a sexta, 08:00–18:00"
}
```

- Atrasado: data prometida anterior ao dia local e lote em aberto (não Completed e não Cancelled).
- Vencendo hoje: data prometida no dia local.
- printersPrinting: só OperationalStatus Printing. Aguardando retirada não entra.
- examplesAreFictional espelha FarmSettings e MUST ser true nesta feature.

## GET /api/lots/{id}/cost-estimate

```json
{
  "filament": 1.0,
  "energy": 0.5,
  "machine": 2.0,
  "total": 3.5,
  "hourRateStatement": "A taxa de hora-máquina não inclui filamento nem energia.",
  "missingPremises": []
}
```

Se faltar tarifa, preço por grama, energia por hora ou taxa, `total` vem `null`, as parcelas conhecidas vêm preenchidas e `missingPremises` lista os nomes que faltam. Não há total substituto.

## GET /api/dashboard/backlog

```json
{
  "pendingHours": 0,
  "forecastNote": "Horas pendentes distribuídas em paralelo no calendário, respeitando compatibilidade.",
  "equivalentMachinesApproximation": false,
  "calendarSummary": "segunda a sexta, 08:00–18:00"
}
```

`equivalentMachinesApproximation` true só quando o cálculo usou horas ÷ máquinas de capacidade equivalente. Nesse caso `forecastNote` MUST incluir que as capacidades foram tratadas como equivalentes.

## GET /api/dashboard/restock-suggestions

Lista do último processamento: materialId, availableGrams, suggestedOrderGrams, runAt. Vazia se nenhum material está abaixo do ponto.

## GET /api/audit?entity=&id=

Admin e Production. 403 para os demais.

Itens: entityName, entityId, action, userId, at, fromStatus, toStatus.

## PUT /api/settings

Admin. Corpo: energyTariffPerKwh nulo ou ≥ 0 (até 5 casas), calendarSummary não vazio, workDays (lista de 1 a 7, 1 = segunda), workStart e workEnd em `HH:mm`, timeZone (fuso IANA, por exemplo `America/Sao_Paulo`). Não aceita `examplesAreFictional: false` nesta feature; 400 se vier false.
