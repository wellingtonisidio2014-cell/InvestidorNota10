# InvestidorNota10

Primeira base independente em HTML, CSS e JavaScript modular, com API Node.js sem dependências de terceiros. Não há código herdado: o repositório estava vazio em 04/11/2026.

## Executar

Instale Node.js 22 ou superior. Na pasta do projeto:

```sh
npm start
```

Abra http://localhost:3000. O modo padrão é **demonstração**: todos os valores numéricos são fictícios e não foram copiados do Investidor10.

Para consultar a brapi, copie `.env.example` para `.env` e altere `DATA_PROVIDER=brapi`. Sem token, o catálogo consultado contém apenas PETR4, VALE3, ITUB4 e MGLU3. Para consultar também os quatro FIIs cadastrados, configure `BRAPI_TOKEN` no servidor e verifique cobertura e condições do plano. Nunca coloque a chave em HTML, JavaScript público ou commits.

```sh
npm test
```

## Incluído

- Busca por nome/ticker, filtro de classe, ordenação com ausentes ao final.
- Favoritos locais, comparação de até 5 ativos, modal acessível de detalhes.
- API `GET /api/assets`, cache compartilhado de 60 segundos, deduplicação de consultas concorrentes, timeout e recuperação do último snapshot válido.
- Atualização por polling a cada minuto com a aba visível. Não é streaming nem promessa de tempo real.
- Modo demonstrativo explícito, metadados de origem, horário de mercado separado de coleta, tratamento de cobertura parcial.
- Cabeçalhos de segurança, rotas estáticas permitidas explicitamente e renderização de texto sem HTML dinâmico de terceiros.

## Limites desta entrega

Catálogo inicial manual de 8 ativos; não representa toda a B3. brapi v1 usado apenas para cotações e P/L, isolado em adaptador substituível. A documentação recomenda v2 para novas integrações: migração fica registrada no backlog. DY e P/VP em modo brapi são indisponíveis, nunca completados com exemplos. Sem gráficos históricos, carteira contábil, dividendos reais, CVM, autenticação, integração B3 ou publicação automática. Favoritos não sincronizam entre dispositivos.

O contrato de dados está em `docs/API.md`; a auditoria e as evidências em `docs/AUDITORIA.md`. Antes de produção, contratar direitos de dados aplicáveis, validar integração real e adicionar observabilidade, limitação de tráfego e armazenamento persistente. GitHub Pages sozinho não executa a API Node; hospede o projeto em ambiente Node e HTTPS.
