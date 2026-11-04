# Radar Pro

O painel prioriza a pesquisa de ativos: gráfico, dados da cotação, alertas e favoritos na primeira seção; tabela e dividendos na seguinte; comparação e fontes oficiais ao final.

## Comportamento

- Períodos de 1 dia a 5 anos no painel principal. A janela ampliada mantém o período escolhido e compartilha o cache de históricos.
- PETR4 é a seleção inicial quando seu histórico está disponível; caso contrário, é usado um ativo com histórico retornado pela fonte.
- Variação diária e variação entre fechamentos do período aparecem separadamente. A segunda não inclui proventos.
- O gráfico adapta a resolução à largura disponível, preserva os pontos da curva e permite seleção por cursor, toque e teclado.
- O controle rápido de alertas usa a mesma preferência do formulário existente. Não solicita permissão de notificações externas.
- Tabela com oito ativos por página; CSV continua exportando todos os resultados filtrados.
- Favoritos e alertas mantêm suas chaves de armazenamento. Valores ausentes continuam representados por “—”.
- A seção de cada fonte permite expandir origem e horário de coleta.

## Validação

- `npm test`: 38 testes aprovados.
- `npm run build:pages`: geração concluída com cadastro CVM de quatro emissores.
- Navegador: histórico de seis meses, expansão preservando o período, busca, favoritos, comparação e sincronização do interruptor de alertas.
- Layout de celular a 390 px: sem transbordamento horizontal do documento; seleção do gráfico por Home e janela ampliada conferidas.

## Publicação e cobertura

GitHub Pages utiliza `main/(root)`. O arquivo raiz redireciona para `site/`, gerado pelo build. Publicar fontes e artefatos `site/` juntos.

Cotações, históricos e proventos vêm da brapi, conforme cobertura. A consulta automática a cada 60 segundos não garante dados em tempo real. BCB e IBGE fornecem contexto; o cadastro CVM é uma cópia da publicação. A integração de carteira pessoal permanece fora desta versão.
