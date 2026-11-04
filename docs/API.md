# Contrato inicial da API

`GET /api/assets` → 200 JSON; 503 se nenhuma consulta válida existir. Métodos diferentes de GET retornam 405.

| Campo | Semântica |
|---|---|
| mode | demo ou brapi |
| source | Origem explicitada |
| fetchedAt | Última coleta bem-sucedida ISO UTC; não é horário da cotação |
| stale | Falha ao atualizar; resposta preservada do cache |
| partial | Parte dos ativos consultados falhou |
| failedTickers | Códigos consultados sem resposta válida |
| assets | Lista normalizada |

Cada ativo contém id estável interno, ticker, name, type (stock/fii), sector, price (BRL), change (percentual informado pelo fornecedor), pe, dy (%), pb e asOf (horário da fonte ISO UTC). Ausentes são null, nunca zero presumido. No modo demo asOf é null. price e indicadores são números para exibição; este MVP não implementa contabilidade monetária.

O catálogo é intencionalmente limitado. partial sinaliza falha dentro do conjunto consultado, não cobertura de todo o mercado. Sem token, apenas quatro ações entram na consulta. Cache de 60 segundos reduz chamadas, mas sua política deve ser ajustada ao contrato do fornecedor. Sem endpoints públicos de configuração ou gravação de tokens.

Futuro: paginação do catálogo, endpoints independentes para históricos, dividendos, demonstrações CVM, versão de fórmulas, unidades, moedas e licença por série. Dados contábeis requerem precisão decimal, revisões e períodos explícitos.
