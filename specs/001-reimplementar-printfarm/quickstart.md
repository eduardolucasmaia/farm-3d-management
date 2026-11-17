# Quickstart: Reimplementar o núcleo da farm

Roteiro de validação das histórias de `spec.md`, revisado em 2026-11-17. Números de exemplo são fictícios. Os comandos e cenários dependem da implementação; não foram executados nesta revisão de planejamento.

## Pré-requisitos

- .NET 8 SDK
- Node.js 20 ou mais novo
- Docker, para o SQL Server
- Instância SQL Server dedicada a testes, com acesso por `FARM3D_TEST_CONNECTION`. A suíte cria um banco exclusivo `Farm3dTest_<identificador>` por execução e remove apenas o banco que ela criou; não usa o banco da aplicação. A configuração e a separação por Category serão incorporadas em `$speckit-tasks`.

Na raiz do repositório:

```powershell
copy .env.example .env
# preencher MSSQL_SA_PASSWORD, Jwt__SigningKey e FARM3D_SEED_PASSWORD
docker compose up -d sql
dotnet test src/Farm3d.Tests/Farm3d.Tests.csproj --filter "Category=Domain"
# definir FARM3D_TEST_CONNECTION para a instância exclusiva de testes
dotnet test src/Farm3d.Tests/Farm3d.Tests.csproj --filter "Category=StockIntegration"
dotnet run --project src/Farm3d.Api
```

Noutro terminal:

```powershell
cd web
npm install
npm test
npm run dev
```

A API sobe em `http://localhost:5088`. A SPA em `http://localhost:5173`. Usuários semeados em Development: `admin@farm3d.local`, `vendas@farm3d.local`, `producao@farm3d.local`, `compras@farm3d.local`, `operador@farm3d.local`. A senha é a de `FARM3D_SEED_PASSWORD`.

Os testes automatizados MUST estar verdes antes das seções manuais. Ausência de `FARM3D_TEST_CONNECTION` ou falha ao conectar deve falhar a suíte StockIntegration, sem substituição por InMemory nem aprovação com testes ignorados. Cada seção vale sozinha se a semente da história estiver aplicada.

## 1. Pedido aprovado vira 3 lotes (US1)

Semente fictícia: modelo "Suporte demo (fictício)", 4 peças por prancha, 60 minutos e 40 g por prancha, dois lotes de material do mesmo insumo (o mais antigo com saldo), impressora "Mesa A" compatível e "Mesa B" incompatível.

1. Entrar como `vendas@farm3d.local` e confirmar um pedido de 10 peças desse modelo, cor e tamanho oferecidos, data prometida daqui a sete dias.
2. Entrar como `producao@farm3d.local` e liberar os lotes.
3. Esperado: 3 lotes, peças 4, 4 e 2. Minutos 60, 60 e 30. Gramas 40, 40 e 20. Os três na fila. A reserva começa pelo lote de material mais antigo.
4. Enfileirar o primeiro lote na "Mesa B". Esperado: recusa, lote continua sem essa máquina.
5. Repetir a liberação. Esperado: recusa, reserva não dobra.
6. Com a semente de um segundo pedido igual sem saldo livre suficiente, liberar a linha. Esperado: recusa sem reserva parcial, novos lotes ou itens de fila para a linha.
7. Depois da liberação do primeiro pedido, editar o perfil para 5 peças, 90 minutos e 50 g por prancha. Esperado: os lotes já liberados continuam 4/4/2 peças, 60/60/30 minutos e 40/40/20 g, com os parâmetros originais 4/60/40 preservados. A reserva não muda.
8. Liberar um pedido novo de 10 peças. Esperado: 2 lotes de 5 peças, 90 minutos e 50 g cada. Reimpressão do pedido anterior continua usando seus parâmetros originais. US1-AS8 e US1-AS9.

`dotnet test` cobre o corte 10/4, a recusa por saldo e a incompatibilidade sem abrir o navegador.

## 2. Papéis e cadastros (US2)

1. Sem entrar, abrir a fila. Esperado: volta para a identificação.
2. Como `vendas@farm3d.local`, gravar um cliente e um modelo habilitado com preço de venda. Esperado: o modelo aparece para pedido. Tentar gravar impressora. Esperado: recusa.
3. Como `producao@farm3d.local`, gravar impressora sem limite de horas. Esperado: recusa. Gravar com limite 200 horas, taxa de hora-máquina e a frase de que a taxa não inclui filamento nem energia.
4. Como `admin@farm3d.local`, criar `operador2@farm3d.local` com papel Operator. Entrar com ele e tentar gravar cliente. Esperado: recusa.

## 3. Orçamento uma vez só (US3)

1. Como vendas, criar orçamento em rascunho com uma linha, marcar enviado, aprovar. A composição mostra modelo, material, quantidade e subtotal.
2. Gerar pedido com data prometida. Esperado: pedido confirmado, orçamento em pedido gerado.
3. Gerar de novo. Esperado: recusa e um único pedido.
4. Rejeitar outro orçamento com motivo. Esperado: motivo nas observações e nenhuma geração.
5. Aprovar um terceiro com validade no passado e esperar o processamento horário (ou o gancho de desenvolvimento que dispara uma passagem). Esperado: expirado, sem pedido.
6. Criar pedido manual. Esperado: confirmação pendente. Liberar lote, faturar ou pagar. Esperado: as três recusas. Confirmar o pedido. Esperado: confirmado. Cancelar outro ainda pendente e tentar mudar seu estado. Esperado: recusa.
7. Num pedido confirmado com lotes na fila, sem execução iniciada, fatura ou pagamento, registrar o total reservado e cancelar como Vendas. Esperado: pedido e lotes pendentes Cancelled, fila removida, reservas zeradas e saldo livre aumentado exatamente pelo valor liberado. A trilha registra as mudanças e o estoque registra Unreserve. Repetir: recusa sem segunda liberação. US3-AS8.
8. Em três pedidos independentes, registrar respectivamente uma execução iniciada, uma fatura e um pagamento. Tentar cancelar cada um. Esperado: 409 com o impedimento correto, sem alterar pedido, lotes, fila ou reservas. Encerrar a execução do primeiro e repetir: continua recusado. US3-AS9.

## 4. Compra e recebimento (US4)

1. Como `compras@farm3d.local`, criar pedido de 1 kg de filamento e receber 400 g com código de lote. Esperado: lote de material com 400 g, pedido parcialmente recebido, custo por grama = preço do quilo / 1000.
2. Receber 0 g. Esperado: recusa.
3. Receber os 600 g restantes. Esperado: pedido recebido.
4. Material com ponto de reposição acima do livre, depois de uma passagem periódica. Esperado: sugestão com o saldo livre e a diferença até o ponto.

## 5. Dois estados (US5)

1. Como `operador@farm3d.local`, iniciar o primeiro lote da seção 1 na "Mesa A". Esperado: lote em impressão e máquina em impressão.
2. Pausar e retomar. Esperado: o lote pausa e volta; a máquina permanece em impressão.
3. Concluir informando as gramas reais. Esperado: lote aguardando retirada, máquina aguardando retirada, uma saída de estoque. Concluir de novo. Esperado: recusa.
4. Confirmar a retirada. Esperado: lote concluído, máquina em preparação, sem aceitar outro lote.
5. Concluir a preparação com horas abaixo do limite. Esperado: máquina disponível.
6. Repetir uma impressão que leve as horas acumuladas ao limite. No fim da preparação, esperado: em manutenção, e um início novo é recusado. Confirmar a manutenção com uma nota. Esperado: horas zeradas e máquina disponível.
7. Em uma semente separada com 40 g reservados, falhar sem reimpressão informando 10 g reais. Esperado: uma baixa lógica Waste de 10 g, liberação dos 30 g restantes, lote Failed e máquina AwaitingPickup. Repetir falha ou concluir essa execução: recusa sem saída adicional.
8. Em outra semente com 40 g reservados e 10 g livres, falhar com reimpressão informando 10 g. Esperado: execução anterior Failed, nova Planned ligada à anterior, lote Queued, 30 g de reserva restante mais complemento automático integral de 10 g. A impressora permanece AwaitingPickup. Retirar: só a impressora vai a Preparing, sem mudar o lote ou a reimpressão. Após preparar, iniciar: ativa a Planned existente, sem criar outra.

### Material real e reimpressão

Cada linha usa uma semente fictícia independente. Os valores de saldo livre excluem reservas de outros lotes de produção. Os testes de domínio começam vermelhos; a integração deve provar os saldos persistidos. US5-AS10 a US5-AS14, conforme [contrato de produção](contracts/producao.md).

| Caso | Ação | Resultado esperado |
|------|------|--------------------|
| Falha com zero | Informar 0 g em execução Running e repetir a tentativa | Primeira falha registrada sem saída; repetição recusada sem nova reimpressão ou baixa. |
| Dado ausente ou negativo | Falhar omitindo material ou informando -1 g | 400, execução, estados, reserva e saldo intactos. |
| Complemento insuficiente | Reserva 40 g, livre 5 g, consumo 10 g, pedir reimpressão | Falha e Waste de 10 g confirmados; reserva restante 30 g; os 5 g livres não são parcialmente reservados; missingMaterialG 10 g; início recusado. |
| Recuperação do complemento | No caso anterior, receber material suficiente e repetir a tentativa de início após retirar e preparar a máquina | Complemento automático de 10 g FIFO; reserva de 40 g; iniciar a Planned existente. |
| Excesso com saldo | Reserva 40 g, saldo livre do mesmo material em dois lotes com 5 g e 10 g; concluir ou falhar com 50 g | Baixa lógica de 50 g; 40 g da reserva própria, 5 g do saldo livre mais antigo e 5 g do seguinte; custos por origem; reservas alheias intactas. |
| Consumo insuficiente | Reserva 40 g, livre 5 g, tentar concluir ou falhar com 50 g | 409; nenhuma mudança de execução, lote, impressora, reserva, saldo ou movimentos. Regularizar os 5 g que faltam e repetir permite somente uma baixa. |
| Consumo menor na conclusão | Reserva 40 g, concluir com 25 g | ProductionOut de 25 g e liberação dos 15 g restantes, sem reserva residual. |
| Perfil alterado | Reimprimir lote da seção 1 após editar o perfil | Parâmetros, gramas e minutos planejados continuam os da liberação original. |

### Atomicidade e concorrência em SQL Server

Executar a suíte StockIntegration contra banco descartável. Recriar a semente para cada prova; usar conexões independentes e sincronização explícita entre as operações, sem depender de atrasos arbitrários.

- Forçar uma falha de persistência entre as gravações de movimento e estado. Confirmar rollback de execução, reserva, saldo e trilha, inclusive se houver mais de um lote de material.
- Disputar o mesmo saldo livre em duas liberações ou consumos. Não permitir saldo negativo nem consumo de reserva alheia; a ação que perder deve ser recusada sem efeitos parciais.
- Enviar duas conclusões ou uma conclusão e uma falha concorrentes para a mesma execução. Somente um encerramento é confirmado; a soma dos movimentos terminais é o material real desse encerramento.
- Disputar cancelamento com início de execução, fatura e pagamento em testes separados. Nunca confirmar o cancelamento junto de uma ação que o impediria. Recarga do pedido deve mostrar o resultado confirmado e nenhuma reserva liberada duas vezes.
- Na falha com reimpressão e falta só do complemento, confirmar que a transação grava a falha e o consumo, mas não uma reserva parcial nem uma segunda execução Planned.

Essas provas complementam o teste puro de FIFO; um provedor que ignora transações não serve como substituto.

## 6. Fatura e pagamento (US6)

1. No pedido confirmado da seção 1, como vendas, lançar fatura com número, valor e data, e um pagamento Pix.
2. Esperado: os dois ligados ao pedido. Não existe ação de nota fiscal nem de boleto.
3. No pedido em confirmação pendente da seção 3, as mesmas ações. Esperado: recusa.

## 7. Painel (US7)

1. Como `producao@farm3d.local`, abrir o painel com um pedido prometido para ontem e lotes em aberto. Esperado: conta como atrasado. O calendário vigente aparece junto.
2. Máquina em impressão aparece na lista. Máquina só aguardando retirada não aparece.
3. Com tarifa, preço por grama, energia por hora e taxa preenchidos, o custo do lote mostra filamento, energia e hora-máquina separados, mais a frase "A taxa de hora-máquina não inclui filamento nem energia."
4. Limpar a tarifa. Esperado: total vazio e a premissa listada como ausente.
5. Exemplos na tela trazem a marca de dado fictício.
6. Com consumo de produção e Waste de falhas no intervalo de sete dias, conferir que o painel soma ambos uma única vez e ignora Reserve e Unreserve.

## 8. Trilha (US8)

1. Como admin, abrir a trilha do pedido confirmado, do lote liberado e da impressora que saiu de disponível. Esperado: estado anterior, estado novo, usuário e momento.
2. Como `vendas@farm3d.local`, abrir a mesma trilha. Esperado: recusa.
3. As saídas de produção e Waste da seção 5 aparecem com gramas, custo por origem, lote de material e execução. Para uma baixa que usa vários lotes de material, somar os detalhes de um printRunId e conferir o consumo real.
4. Conferir os eventos de cancelamento e as movimentações de liberação sem duplicação. A captura deve existir desde a primeira história; a história 8 valida a consulta restrita.

## Pronto quando

- Suítes Domain e StockIntegration verdes, incluindo cenário 10/4, parâmetros preservados, consumo/falha/reimpressão, cancelamento, rollback e concorrência. Testes SQL Server exigem execução real, sem skip silencioso. Cada teste de regra nova deve registrar a etapa vermelha antes da implementação.
- `npm test` em `web/` verde no guarda de rota.
- As oito seções acima conferidas, ou só a seção 1 se a entrega parou no MVP.
