<!--
Sync Impact Report
- Version change: unratified template + rascunho do brief → 1.0.0
- Modified principles:
  - [PRINCIPLE_1_NAME] → I. A constituição manda
  - [PRINCIPLE_2_NAME] → II. Domínio puro, casca fina
  - [PRINCIPLE_3_NAME] → III. Teste antes da regra
  - [PRINCIPLE_4_NAME] → IV. Dois estados
  - [PRINCIPLE_5_NAME] → V. Rastreio sem baixa duplicada
  - (novos) VI. Estimativa explícita
  - (novos) VII. Escopo parado
  - (novos) VIII. Dado fictício marcado
- Added sections:
  - Vocabulário e estados
  - Escopo
  - Fluxo de entrega
  - Governance (ratificada)
- Removed sections: none
- Follow-up TODOs: none
- O rascunho do brief na raiz foi removido. Este arquivo é a única
  constituição. As regras do brief de 2026-11-13 estão incorporadas aqui,
  com o escopo ampliado para o núcleo do software de referência.
-->

# Farm 3D Constitution

## Core Principles

### I. A constituição manda

Spec, plan e código MUST obedecer esta constituição. Se um artefato
posterior a contradizer, vale esta constituição. Classe, assinatura,
formato de arquivo, algoritmo e stack MUST ficar no plan, não aqui.

Rationale: a lei do projeto não pode ser reescrita por uma spec
apressada nem pela stack do legado.

### II. Domínio puro, casca fina (NÃO NEGOCIÁVEL)

Regra de lote, fila, reserva, compatibilidade, custo, estado da
impressora e estado do lote MUST viver em um núcleo testável sem
interface, sem banco e sem rede. Persistência, HTTP e telas MUST ser
adaptadores. O adaptador MUST NOT decidir essas regras.

Rationale: o comportamento da farm precisa ser verificável sem subir
a aplicação.

### III. Teste antes da regra (NÃO NEGOCIÁVEL)

Toda regra de domínio nova ou alterada MUST começar com um teste
automatizado que falha. A implementação dessa regra só começa depois
dessa falha. Jornada de tela MUST ter um roteiro executável em
`quickstart.md` da feature.

Rationale: o teste que falha fixa o contrato antes do código.

### IV. Dois estados (NÃO NEGOCIÁVEL)

O estado do lote de produção e o estado da impressora MUST ser
independentes. Impressão concluída MUST manter a máquina ocupada até
a retirada e a preparação. A máquina só volta a receber lote sem
bloqueio e sem manutenção pendente. Conclusão da impressão,
confirmação da retirada e conclusão da manutenção MUST ser eventos
distintos.

Rationale: tratar "impressão acabou" como "máquina livre" mente a
capacidade da farm.

### V. Rastreio sem baixa duplicada

Toda mudança de estado de lote, de impressora, de orçamento e de
pedido MUST ficar registrada com quem agiu e quando. Reserva, consumo
e liberação de material MUST ser movimentações. A mesma reserva MUST
NOT ser consumida duas vezes. A mesma conclusão de execução MUST NOT
gerar segunda saída de estoque.

Rationale: custo e saldo deixam de ser discutíveis quando a baixa
pode ser repetida.

### VI. Estimativa explícita

Custo estimado e previsão de término MUST mostrar a conta e a
premissa. Número sem premissa MUST NOT aparecer no painel. Custo
estimado MUST permanecer distinto do preço de venda. A taxa de
hora-máquina MUST declarar o que já inclui, para filamento e energia
não entrarem duas vezes.

Rationale: um total opaco não serve para decidir preço nem prazo.

### VII. Escopo parado

O que esta constituição coloca fora MUST NOT entrar por conveniência
de implementação. Comportamento do software de referência entra só
quando esta constituição ou a spec vigente o incluem.

Rationale: o legado é grande; copiar módulo sem spec reabre o escopo.

### VIII. Dado fictício marcado

Volume, frota, custo e prazo usados como exemplo MUST ser marcados
como fictícios na interface. Ganho de produtividade MUST NOT ser
apresentado como resultado medido enquanto a operação real não
fornecer a série.

Rationale: o brief não trouxe números reais. Exemplo não é métrica.

## Vocabulário e estados

Spec, plan e interface MUST usar estes nomes. "Lote" sozinho é
proibido quando os dois conceitos abaixo puderem se confundir.

- **Modelo**: item de catálogo, com cores, tamanhos e parâmetros de
  produção.
- **Configuração**: cor e tamanho escolhidos na compra, quando o
  modelo os oferece.
- **Pedido**: compra com itens, quantidades e configurações.
- **Lote de produção**: porção executável de uma linha de pedido,
  limitada pela capacidade da prancha.
- **Prancha**: uma ocupação de impressão. A quantidade de pranchas
  arredonda para cima.
- **Lote de material**: porção recebida de filamento ou resina, com
  saldo em gramas.
- **Impressora**: máquina da farm, com compatibilidade e
  disponibilidade.
- **Perfil de produção**: peças por prancha, tempo por prancha e
  material por prancha para um modelo.
- **Custo estimado**: custo de produzir. Não é o preço de venda.
- **Backlog**: carga pendente em horas de máquina.
- **Retirada** e **preparação**: passos depois da impressão e antes
  de a máquina receber outro lote.
- **Manutenção**: parada por horas acumuladas, com limite cadastrado
  na impressora, duração prevista e confirmação.

Estados do lote de produção: Aguardando planejamento, Liberado,
Na fila, Em impressão, Pausado, Aguardando retirada, Concluído,
Falha, Cancelado.

Estados da impressora: Disponível, Em impressão, Aguardando retirada,
Em preparação, Em manutenção, Indisponível.

Um pedido está produzido somente quando todos os seus lotes de
produção estão Concluídos.

A lista curta do brief (sem Liberado, Pausado, Falha e Cancelado) é o
caminho feliz. Os quatro estados extras existem porque o software de
referência já opera pausa, falha, cancelamento e a reserva antes da
fila. Eles não fundem o estado da máquina com o estado do lote.

## Regras de domínio

- A operação vê o modelo cadastrado e habilitado para venda.
- O pedido preserva quantidade, cor e tamanho escolhidos.
- Lote de produção só é atribuído a impressora compatível e sem
  conflito de ocupação. Impressora sem lista de materiais aceita
  qualquer material.
- A quantidade de pranchas é o teto da divisão entre peças e peças por
  prancha. O cenário de referência é 10 peças com 4 por prancha, em
  3 lotes. A última prancha incompleta consome tempo e material na
  proporção peças da prancha / peças por prancha.
- Liberar um lote reserva o material necessário de uma vez, do lote
  de material mais antigo com saldo livre para o mais novo. Se o
  saldo livre não cobre, a liberação é recusada e nada fica reservado
  pela metade.
- A disponibilidade desconta retirada, preparação e manutenção.
- Manutenção vencida bloqueia nova impressão. O limite de horas é
  dado cadastrado na impressora. A implementação MUST NOT inventar
  esse número. A confirmação registra uma nota; a lista de atividades
  de manutenção não é inventada aqui.
- Custo estimado = filamento consumido × preço por grama + energia
  estimada × tarifa + tempo de impressão × taxa de hora-máquina. A
  taxa de hora-máquina não inclui filamento nem energia.
- Backlog é a soma das horas de máquina ainda não executadas. A
  previsão de término considera execução em paralelo, compatibilidade
  e calendário. Dividir horas pelo número de máquinas vale só como
  aproximação de capacidades equivalentes, e o painel declara essa
  premissa.
- Máquina nova entra no controle de capacidade junto com as demais.
- Orçamento convertido gera no máximo um pedido. Pedido em
  confirmação pendente não gera lote de produção, fatura nem
  pagamento. Pedido cancelado não muda mais de estado.

## Escopo

Dentro: cadastros da operação, orçamento, pedido, lotes de produção,
fila, execução com retirada e preparação, manutenção por horas
cadastradas, lote de material, compra, recebimento, reserva e
consumo, fatura e pagamento como registro, painel de atraso, custo
estimado e sugestão de recompra, papéis Admin, Vendas, Produção,
Compras e Operador, auditoria de mudança de estado.

Fora: emissão de NF-e ou NFS-e, boleto, conciliação bancária,
e-commerce, RH e folha, controle estatístico de qualidade, CNC,
telemetria de impressora, otimização automática da fila, assistente
de IA, gateway de pagamento e cálculo de frete. Frete e embalagem
podem ser valores informados no pedido, não uma cotação.

O software de referência em `docs_apoio/software_ref` é a fonte de
comportamento. O código daquele produto não é copiado para cá. Onde
o brief excluía estoque de filamento e financeiro simplificado, esta
constituição os traz de volta porque o experimento é reimplementar
esse núcleo. Pagamento real, frete cotado, fiscal, telemetria e
otimização automática continuam fora.

## Fluxo de entrega

- Uma regra de domínio entra primeiro como teste vermelho e só depois
  como implementação que o torna verde.
- Cada história de usuário MUST poder ser conferida sozinha, no
  máximo com dados semeados, antes da história seguinte.
- Nenhuma história MUST adicionar estrutura que a regra atual não
  exija.
- Exemplo numérico exibido ao usuário carrega a marca de dado
  fictício.
- Stack, persistência e integração externa são escolhidos no plan.
  Outro projeto desta pasta não transfere stack por osmose; a escolha
  precisa estar escrita no plan.

## Governance

Esta constituição prevalece sobre práticas conflitantes no
repositório. Emenda MUST ser feita neste arquivo antes de spec, plan
ou código que dependam da regra alterada.

Versionamento semântico:

- MAJOR: remover ou redefinir uma regra de domínio ou um princípio.
- MINOR: princípio, regra ou limite de escopo acrescentado.
- PATCH: esclarecimento sem mudança de regra.

Toda revisão de spec ou plan MUST conferir vocabulário, os dois
conjuntos de estado, reserva integral, custo distinto do preço, dado
fictício e a lista do que ficou de fora. Complexidade além da história
atual MUST ser justificada por uma regra já escrita aqui ou na spec
vigente.

**Version**: 1.0.0 | **Ratified**: 2026-11-16 | **Last Amended**: 2026-11-16
