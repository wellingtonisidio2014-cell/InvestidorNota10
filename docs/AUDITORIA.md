# Auditoria inicial e especificação independente

Data: 04/11/2026. Escopo: repositório InvestidorNota10 e reavaliação crítica do levantamento externo registrado nesta conversa. Não é auditoria interna do Investidor10, pentest ou varredura integral de todos os ativos. As páginas de referência abaixo foram observadas na etapa anterior; os números nelas não são cotações validadas nem dados de produção deste projeto.

## Estado inicial

GitHub retornou `This repository is empty` em GET /contents. Sem código legado, dependências, banco de dados ou instruções AGENTS.md no repositório. Portanto esta entrega é uma fundação nova; não alegamos refatoração de código inexistente.

REA não foi definido pelo solicitante. Usamos provisoriamente uma matriz de requisitos, evidências e aceite, sem atribuir significado oficial à sigla.

## Registro de evidências

| ID | Requisito / observação | Evidência pública | Estado nesta entrega |
|---|---|---|---|
| E01 | Navegação por classes | https://investidor10.com.br/ | Ações/FIIs no catálogo inicial |
| E02 | Ficha com indicadores | https://investidor10.com.br/acoes/petr4/ | Modal com cotação, origem e horários; histórico pendente |
| E03 | Ficha de fundo | https://investidor10.com.br/fiis/mxrf11/ | Catálogo manual e cotação via plano compatível |
| E04 | Filtros | https://investidor10.com.br/acoes/rastreador-acoes/ | Nome, ticker, classe e ordenação; faixas numéricas pendentes |
| E05 | Até cinco ativos comparados | https://investidor10.com.br/fiis/comparar/ | Comparação tabular implementada |
| E06 | Data-com e pagamento distintos | https://investidor10.com.br/fiis/dividendos/ | Modelo futuro, sem calendário fictício |
| E07 | Carteira autenticada | https://investidor10.com.br/wallet | Redirecionamento observado; interior não auditado; implementação pendente |
| E08 | Divergência R$ 1,19/R$ 1,20 em resumos de MXRF11 | https://investidor10.com.br/fiis/mxrf11/ | Indício, não erro confirmado; investigar cortes/arredondamento |
| E09 | Cotações, autenticação, ativos de teste | https://brapi.dev/docs/acoes | Documentação consultada nesta entrega; adaptador v1 |

Busca, ordenação e ausência de dados têm testes automatizados. E05 requer também validação de navegador, ainda não executada. Nenhum teste contra fixture comprova correção dos dados reais do fornecedor.

## Correções ao levantamento anterior

- Menus e HTML extraído comprovam presença de controles; não comprovam funcionamento de todos os fluxos.
- Não conhecemos stack, banco, APIs privadas, SLA, licença contratada ou fórmulas internas do concorrente.
- Dois valores distintos não bastam para declarar erro: podem refletir corte temporal, método ou cache.
- Atualização automática é distinta de mercado em tempo real. Este MVP usa polling.
- Valores do levantamento não foram importados: fixtures são sintéticas e rotuladas.
- Um observador/implementador único não comprova segregação formal clean room. Esta entrega usa implementação original baseada em descrição funcional pública; para clean room estrita, separar equipes e entregar apenas especificação revisada.

## Riscos e tratamento

| Prioridade | Risco | Tratamento |
|---|---|---|
| Alta | Demo confundida com mercado | Aviso persistente, mode=demo, asOf=null |
| Alta | Vazamento de token | Somente variável de ambiente no backend; .env ignorado |
| Alta | Ausentes convertidos em zero | Normalização estrita e símbolo — |
| Alta | Atraso oculto | Fonte, horário de cotação/coleta e stale explícitos |
| Alta | Dados parciais escondidos | failedTickers e aviso de cobertura parcial |
| Alta | Dados não licenciados | Não usar scraping do concorrente; validar redistribuição antes da operação pública |
| Média | Falhas simultâneas multiplicam requisições | Cache e promise compartilhada |
| Média | API responde formato inesperado | Validação de ticker/moeda/números; rejeição de entradas inválidas |
| Média | Dependência de formato v1 | Adaptador isolado; migração v2 antes de expansão |
| Pendente | Abuso, logs e operação pública | Rate limiting, métricas e alertas antes da produção |

## Clean Code e fronteiras

public/index.html: semântica e estrutura; styles.css: visual responsivo; js/app.js: estado e DOM; js/domain.js: filtros e normalização; server/catalog.js: catálogo/fixtures; server/provider.js: fonte/cache; server/index.js: HTTP e arquivos permitidos. Evitar acoplar fórmulas ao DOM. Ao expandir, separar favoritos, comparação e renderização em módulos; adicionar persistência apenas com requisito definido.

## Dados futuros e aceite financeiro

Cada indicador deve identificar fonte, moeda, unidade, período, data da publicação, data da coleta e versão da fórmula. Instrumento separado de emissor; ticker com vigência. Provento distingue anúncio, data-com, data-ex, pagamento, retificação e cancelamento. Carteira deriva posições de movimentações auditáveis. Testar desdobramento, grupamento, venda parcial, taxa, reapresentação, evento repetido e ausência de cotação. Não calcular retorno real por simples subtração da inflação; não confundir valorização com retorno total.

Fontes candidatas: CVM DFP https://dados.cvm.gov.br/dataset/cia_aberta-doc-dfp ; informes FII https://dados.cvm.gov.br/dataset/fii-doc-inf_mensal ; condições B3 https://www.b3.com.br/pt_br/market-data-e-indices/servicos-de-dados/market-data/distribuidores/politica-comercial-e-contratos/ . Sem conectores CVM/B3 implementados nesta entrega. Consultar documentação e termos vigentes antes de integrar.

## Próximas etapas

1. Validar visual em desktop/celular e navegação por teclado; homologar brapi real no ambiente de destino.
2. Migrar adaptador v2, catalogar cobertura e contratos; adicionar campos apenas quando verificáveis.
3. Ingestão CVM versionada, fórmulas documentadas, histórico e eventos corporativos.
4. Agenda de proventos, filtros numéricos, gráficos com metodologia e unidades explícitas.
5. Carteira persistente, autenticação e autorização por proprietário; observabilidade e operação.

Identidade e recursos visuais foram escritos para este projeto. Nenhum HTML, CSS, JavaScript, texto editorial ou imagem do concorrente foi copiado. Não foram acessadas áreas privadas ou burlados controles. Fontes acima são páginas web sem paginação; são identificadas por URL/seção, sem páginas inventadas.

## Atualização Radar Noturno — 04/11/2026

Layout refeito conforme proposta visual escolhida pelo usuário, com estrutura responsiva, cores roxa/verde e sidebar própria. Padrão alterado de demo para brapi. Histórico de um mês e proventos conectados; agenda distingue passado/futuro, data-com e pagamento. Teste externo retornou os quatro ativos gratuitos com 20 pontos históricos cada; horário fornecido: 2026-11-04T00:04:30Z, portanto não foi comprovado feed em tempo real. Respostas 429 de concorrência motivaram consultas sequenciais e teste específico.

Treze testes automatizados passaram: filtros, normalização, histórico, deduplicação de proventos, cache, stale, resposta parcial, concorrência e rotas HTTP. Validação inicial no navegador confirmou layout e tratamento de indisponibilidade; o preview não obteve dados externos, embora o adaptador Node tenha recebido os quatro ativos. Homologação da API no ambiente publicado permanece necessária. As pendências históricas acima devem ser lidas à luz desta atualização.

Homologação publicada concluída em 04/11/2026: GET /api/assets retornou HTTP 200, mode=brapi, partial=false e stale=false, com PETR4, VALE3, ITUB4 e MGLU3; cada ativo trouxe 20 fechamentos históricos. Acesso de serviço autenticado manteve a audiência privada. O navegador de QA não tinha sessão ChatGPT para abrir a página publicada; fluxos interativos com dados reais nesse navegador permanecem sem homologação.
