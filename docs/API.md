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
