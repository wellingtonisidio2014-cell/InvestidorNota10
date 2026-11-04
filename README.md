# InvestidorNota10 · Radar Noturno

Painel independente em HTML, CSS e JavaScript modular: tema escuro, identidade roxa e verde, menu lateral, gráfico histórico, radar de proventos, favoritos e comparação de até cinco ativos.

## Executar a versão Node do repositório

Node.js 22 ou superior. `npm start` abre o servidor em http://localhost:3000; `npm test` executa a suíte. A fonte padrão é **brapi.dev com dados reais**. Para desenvolvimento offline, defina explicitamente `DATA_PROVIDER=demo`; a interface identifica os exemplos fictícios.

Sem chave, o catálogo consulta PETR4, VALE3, ITUB4 e MGLU3. Para os FIIs MXRF11, HGLG11, XPML11 e KNCR11, configure `BRAPI_TOKEN` apenas no servidor e confirme cobertura e limites do plano. Não envie a chave ao navegador ou ao Git. Na versão Node, copie `.env.example` para `.env`. Na hospedagem, configure a variável secreta `BRAPI_TOKEN` no ambiente de produção e publique uma nova versão.

## Dados e comportamento

- Preço, variação, P/L e horário fornecidos pela API; valores ausentes aparecem como “—”.
- Histórico de fechamentos do último mês. O gráfico não representa retorno total nem índice Ibovespa.
- Proventos futuros informados pela fonte, com data-com e data de pagamento nos detalhes. Data-limite de pagamento é identificada; a agenda não calcula direito ao recebimento.
- Consultas sequenciais para respeitar o limite de concorrência do provedor gratuito. Cache de 60 s por processo/isolate e deduplicação de chamadas simultâneas.
- A tela consulta a API a cada 60 s enquanto visível. **Não é streaming nem garantia de mercado em tempo real**; cada cotação informa seu horário de origem em Brasília.
- Falha total retorna 503 ou último snapshot marcado como antigo. Falha parcial informa os tickers indisponíveis. Não existe substituição silenciosa por preços inventados.
- Busca, filtros, favoritos locais e comparação. Favoritos não sincronizam entre dispositivos.

## Limites

Catálogo manual de oito ativos, quatro disponíveis sem chave; não é toda a B3. DY e P/VP não são fornecidos por este adaptador. API v1 isolada em `server/provider.js`; migração v2 permanece no backlog antes de ampliar cobertura. Sem carteira contábil, autenticação própria, CVM ou integração direta B3.

Consulte `docs/API.md` e `docs/AUDITORIA.md`. Antes de ampliar a audiência, validar direitos de redistribuição, cotas do plano, limitação de tráfego e observabilidade. Cache por isolate não é limite global de uso da API.

## Hospedagem

A cópia publicada usa Vinext/Cloudflare Workers para servir o mesmo HTML e `GET /api/assets`. O backend Node original permanece disponível em `server/index.js`; GitHub Pages sozinho não o executa. `hosting/route.ts` no repositório documenta o adaptador de hospedagem.
