# Contrato da API

`GET /api/assets`: 200 JSON; 503 sem snapshot válido. No servidor Node, outros métodos retornam 405.

| Campo | Semântica |
|---|---|
| mode | brapi (padrão) ou demo explícito |
| source | Fornecedor |
| fetchedAt | Última coleta bem-sucedida ISO UTC; não é horário da cotação |
| stale | Falha ao atualizar; snapshot anterior preservado |
| partial | Parte do conjunto consultado falhou |
| failedTickers | Códigos consultados sem resposta válida |
| restrictedTickers | Catálogo excluído da consulta por ausência de chave |
| assets | Ativos normalizados |

Ativo: id, ticker, name, type (stock/fii), sector, price em BRL, change percentual do fornecedor, pe, dy, pb e asOf ISO UTC. Valores ausentes são null. DY e P/VP não são fornecidos nesta integração.

`history`: lista ordenada de `{date, close}`; date em milissegundos UTC, close numérico positivo do histórico diário de um mês. Não é retorno total. A API é responsável pelos ajustes da série; o aplicativo não recalcula ajustes de eventos corporativos.

`dividends`: `{type, amount, paymentDate, recordDate, deadline}`. amount em BRL por unidade, datas YYYY-MM-DD. recordDate deriva de lastDatePrior (data-com). deadline identifica paymentDateIsDeadline. A interface filtra pagamentos a partir da data corrente de Brasília, deduplica eventos idênticos e mostra os cinco próximos. Não infere direito ao pagamento, valores líquidos, cancelamentos ou cobertura completa.

Consultas sequenciais a `/api/quote/{ticker}?range=1mo&interval=1d&dividends=true`, timeout de 10 s por ativo. Quatro consultas sem chave; oito com chave. A interface aguarda até 90 s. Cache de 60 s por processo/isolate, pausa de 15 s após falha quando há cache, promise compartilhada. Não há cache distribuído nem limite global de tráfego.

Referência consultada em 04/11/2026: https://brapi.dev/docs/acoes. O contrato/licença e os limites do plano devem ser verificados antes de ampliar o serviço. Atualização a cada minuto não garante cotação em tempo real.

## GET /api/context

Retorna 200 com `sources[]`: id, name, reference (página oficial), endpoint, scope, status (available/stale/unavailable), fetchedAt (último sucesso UTC), sourceUpdatedAt (Last-Modified do arquivo, se disponível) e data. A indisponibilidade é representada por fonte; não bloqueia /api/assets.

BCB: label, value, unit=% a.a., referenceDate=YYYY-MM-DD, series=SGS 432. IPCA: unit=% no mês, referenceDate=YYYY-MM, referenceLabel e series=SIDRA 1737/63. CVM: lista de ticker, cvmCode, cnpj, legalName, registrationStatus, sector, registrationDate e statusSince. Mapeamento ticker/emissor explícito; não extraído da tabela CVM. Duplicatas por código/CNPJ usam a situação de data mais recente.

Cache por fonte: 6 horas; pausa de 15 minutos após falha; solicitações simultâneas deduplicadas. A interface consulta o contexto ao abrir, ao atualizar manualmente e a cada hora com a aba visível. Estado stale mantém a data original da coleta. Timeout externo 15 s; fontes consultadas em paralelo.

Referências verificadas em 04/11/2026:
- BCB: https://dadosabertos.bcb.gov.br/dataset/432-taxa-de-juros---meta-selic-definida-pelo-copom
- IBGE API: https://servicodados.ibge.gov.br/api/docs/agregados?versao=3 ; tabela: https://sidra.ibge.gov.br/tabela/1737
- CVM: https://dados.cvm.gov.br/dataset/cia_aberta-cad ; arquivo https://dados.cvm.gov.br/dados/CIA_ABERTA/CAD/DADOS/cad_cia_aberta.csv

BCB e CVM identificam licença ODbL no catálogo; origem e links são preservados na UI. Não há scraping do concorrente. O contexto oficial é complementar, não triangulação de preços.

## Expansão da lista de mercado

/api/assets consulta em sequência os ativos detalhados e `/api/quote/list?type=stock&sortBy=volume&sortOrder=desc&limit=50&page=1`. Cada ativo inclui coverage (summary/detailed) e quoteSource. Resumidos incluem volume quando disponível, asOf=null, pe/pb/dy=null e listas de histórico/proventos vazias. marketListCount é a contagem válida retornada; marketListUnavailable indica falha específica. partial inclui falhas da lista ou dos detalhes. A quantidade após junção pode superar 50 se um ativo do catálogo detalhado estiver fora da lista por volume.

A lista é validada por tipo, código e números finitos; timestamps não são derivados do horário da requisição. Referência consultada em 04/11/2026: https://brapi.dev/docs/acoes/list (endpoint sem token, preço de fechamento e variação). Resumo de mercado não garante tempo real.
