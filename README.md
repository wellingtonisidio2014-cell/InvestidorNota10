# InvestidorNota10 · Radar Noturno

Painel independente em HTML, CSS e JavaScript modular: tema escuro, identidade roxa e verde, menu lateral, gráfico histórico, radar de proventos, favoritos e comparação de até cinco ativos.

## Executar a versão Node do repositório

Node.js 22 ou superior. `npm start` abre o servidor em http://localhost:3000; `npm test` executa a suíte. A fonte padrão é **brapi.dev com dados reais**. Para desenvolvimento offline, defina explicitamente `DATA_PROVIDER=demo`; a interface identifica os exemplos fictícios.

Sem chave, a lista de mercado carrega até 50 ações por volume informado, mais consultas detalhadas de PETR4, VALE3, ITUB4 e MGLU3. Para os FIIs MXRF11, HGLG11, XPML11 e KNCR11, configure `BRAPI_TOKEN` apenas no servidor e confirme cobertura e limites do plano. Não envie a chave ao navegador ou ao Git. Na versão Node, copie `.env.example` para `.env`. Na hospedagem, configure a variável secreta `BRAPI_TOKEN` no ambiente de produção e publique uma nova versão.

## Dados e comportamento

- Preço, variação, P/L e horário fornecidos pela API; valores ausentes aparecem como “—”.
- Histórico de fechamentos do último mês. O gráfico não representa retorno total nem índice Ibovespa.
- Proventos futuros informados pela fonte, com data-com e data de pagamento nos detalhes. Data-limite de pagamento é identificada; a agenda não calcula direito ao recebimento.
- Consultas sequenciais para respeitar o limite de concorrência do provedor gratuito. Cache de 60 s por processo/isolate e deduplicação de chamadas simultâneas.
- A tela consulta a API a cada 60 s enquanto visível. **Não é streaming nem garantia de mercado em tempo real**; cada cotação informa seu horário de origem em Brasília.
- Falha total retorna 503 ou último snapshot marcado como antigo. Falha parcial informa os tickers indisponíveis. Não existe substituição silenciosa por preços inventados.
- Busca, filtros, favoritos locais e comparação. Favoritos não sincronizam entre dispositivos.

## Limites

Cobertura resumida de até 50 ações por volume, combinada com o catálogo detalhado inicial; não é toda a B3. DY e P/VP não são fornecidos por este adaptador. API v1 isolada em `server/provider.js`; migração v2 permanece no backlog antes de ampliar cobertura. Sem carteira contábil, autenticação própria, CVM ou integração direta B3.

Consulte `docs/API.md` e `docs/AUDITORIA.md`. Antes de ampliar a audiência, validar direitos de redistribuição, cotas do plano, limitação de tráfego e observabilidade. Cache por isolate não é limite global de uso da API.

## Hospedagem

A cópia publicada usa Vinext/Cloudflare Workers para servir o mesmo HTML e `GET /api/assets`. O backend Node original permanece disponível em `server/index.js`; GitHub Pages sozinho não o executa. `hosting/route.ts` no repositório documenta o adaptador de hospedagem.

## Experiência interativa (v2)

GSAP 3.15.1 é servido localmente, com aviso original de licença em public/vendor/. Animações de entrada e traçado do gráfico respeitam prefers-reduced-motion e o botão para desligar animações. Sem GSAP, os controles continuam funcionando.

Novidades: ilustração SVG original, ícones vetoriais, resumo apenas da cobertura carregada, períodos de 5/10 pregões ou mês disponível, cursor no gráfico e controle acessível por teclado, desfazer favorito, barra de comparação, remoção individual, densidade de tabela, CSV filtrado com fonte/horários e proteção contra fórmulas em campos textuais. Atalhos / (busca), ? (ajuda) e Esc (fechar diálogo).

Módulos: chart.js (gráfico), motion.js (GSAP e preferências), interactions.js (atalhos e feedback), export.js (CSV). Não há imagens externas nem scripts de CDN em tempo de execução.

## Gráfico e fontes oficiais (v3)

A curva usa interpolação cúbica monotônica, preservando os fechamentos e sem criar máximas/mínimas entre pontos. O destaque identifica o pregão real mais próximo, nunca um preço interpolado. Barra inferior removida: mouse/toque selecionam o ponto; com o gráfico em foco, ←/→, Home e End navegam. Data completa, valor, guia vertical e rótulo no eixo destacam a seleção.

`GET /api/context` acrescenta três integrações oficiais independentes: Banco Central (meta Selic SGS 432, % a.a.), IBGE/SIDRA (IPCA mensal nacional, tabela 1737/variável 63, % no mês) e CVM (cadastro dos quatro emissores). A associação ticker/emissor é curada e o cadastro é cruzado por código CVM + CNPJ. Balanços, indicadores contábeis e preço B3 direto ainda não estão integrados. Essas fontes não validam automaticamente a cotação brapi.

Cada fonte mostra unidade, período de referência quando aplicável, origem, coleta e falha/stale. Cache independente de 6 h por processo/isolate; falha preserva snapshot anterior e pausa consultas dessa fonte por 15 min. Janela do IPCA é mensal; não deve ser apresentada como dado em tempo real. CVM retorna apenas campos cadastrais do emissor, sem contatos pessoais.

## Cobertura ampliada e notificações (v4)

O endpoint público /api/quote/list fornece até 50 ações por volume informado, com preço de fechamento, variação e setor. A resposta da lista não informa horário de cotação; asOf permanece null. Na junção, a cotação detalhada prevalece. Histórico/P/L/proventos não são preenchidos com estimativas. Tabela com 15 resultados por página, busca por código/nome e filtro de setor.

Central de notificações no sino: padrão de 5%, configurável de 0,5% a 30%, altas/quedas/ambas, todas as ações carregadas ou favoritas presentes na cobertura. O limite compara a variação informada pela API com o percentual escolhido; não compara com o momento de abertura do site. A primeira observação acima do limite também gera aviso.

Avisos internos ativos por padrão, histórico de até 50 itens no navegador e marcação de lidos. Sem repetição por ação/direção/limite/dia de verificação; Web Locks evita concorrência entre abas quando disponível. Demonstração, resposta stale, coleta anterior a 2 min e cotações com horário conhecido anterior a 24 h não geram alertas. Cotações sem horário são aceitas com advertência explícita; o aviso não confirma oscilação em tempo real. O botão Testar aviso cria exemplo fictício rotulado.

Avisos externos são opcionais via Notification API, só após clique e permissão. Não há service worker, push remoto ou monitoramento com site fechado. Polling ocorre a cada minuto com a aba visível. Dispositivos sem suporte continuam com central interna. Preferências/histórico são locais, sem sincronização entre dispositivos.

## GitHub Pages

`npm run build:pages` gera `dist-pages/` com caminhos relativos compatíveis com `/InvestidorNota10/`. Publique **o conteúdo** dessa pasta na raiz da branch `gh-pages` e selecione Settings → Pages → Deploy from a branch → gh-pages → /(root). `.nojekyll` mantém os arquivos sem processamento Jekyll.

A versão estática consulta brapi, BCB e IBGE diretamente pelo navegador, sem chave nem servidor privado. Ela preserva tratamento de falhas, dados parciais e avisos de atraso; não garante cotações em tempo real. FIIs protegidos por chave não estão disponíveis nessa modalidade. Não adicione tokens ao frontend.

A CVM não autoriza CORS: o build baixa o cadastro e publica apenas os campos dos quatro emissores integrados, com data de coleta e rótulo de cópia. Ele falha se não conseguir obter um cadastro válido. Refazer o build/publicação atualiza essa cópia; não há rotina automática de atualização. Consultas BCB/IBGE continuam independentes.

Favoritos, preferências e histórico de alertas são locais a cada domínio, portanto não migram automaticamente do endereço anterior. Alertas só são avaliados enquanto a página está aberta e visível; avisos do sistema dependem da permissão do navegador.

O backend Node e a hospedagem anterior permanecem compatíveis. O build estático não inclui `.env`, arquivos de servidor HTTP, tokens ou credenciais.

## Gráfico ampliado (v5)

O botão Expandir abre um diálogo que ocupa toda a área da página; Fechar/Esc devolvem o foco ao botão original. Inclui seletor dos ativos com histórico carregado, cursor acessível, oito períodos (1 D, 5 D, 1 M, 3 M, 6 M, ano corrente, 1 A e 5 A) e atualização visível a cada minuto. A visão diária consulta intervalos de 15 minutos; cinco anos usa semanas; os demais usam dias. A fonte pode restringir períodos/tickers: falhas ficam explícitas, sem reutilizar silenciosamente outro período.

A variação do período compara primeiro e último fechamento retornado, sem proventos, e aparece separada da variação diária da cotação. Abertura, máxima/mínima diária, fechamento anterior, volume, valor de mercado, P/L, lucro por ação e faixa de 52 semanas são campos da resposta; ausências permanecem “—”. Cadastro CVM aparece abaixo, com sua própria data de coleta.

A integração reaproveita o endpoint v1 já utilizado pelo projeto. Consultas do gráfico são diretas à brapi, sem token de usuário; cache de 60 segundos por ativo/período, deduplicação de solicitações simultâneas, validação de ticker/moeda/período/intervalo e descarte de respostas antigas após troca rápida. Nenhuma carteira pessoal foi adicionada nesta versão.

### Publicação atual em main/(root)

A configuração do Pages foi verificada nos logs do deploy: ela usa `main` e a raiz. Por isso `index.html` encaminha para `site/`, cópia estática gerada por `npm run build:pages`. Esse comando gera tanto `dist-pages/` quanto `site/`; envie `site/` junto com as mudanças em `main`. O marcador `.nojekyll` preserva os arquivos sem transformação. A branch `gh-pages` continua contendo uma versão estática na raiz, caso a configuração de hospedagem seja alterada depois. Não edite os arquivos de `site/` manualmente; altere `public/` ou os adaptadores em `scripts/` e refaça o build.
