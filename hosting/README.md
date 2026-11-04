# Adaptador de hospedagem

O Site publicado usa o starter Vinext/Cloudflare Workers. O arquivo route.ts desta pasta é uma cópia de referência: instale-o em app/api/assets/route.ts, preservando a estrutura public/ e server/. A rota app/route.ts entrega o HTML de public/index.html (importado como raw no build). Configure BRAPI_TOKEN exclusivamente no ambiente do servidor; sua ausência habilita as quatro ações gratuitas.

O projeto Node na raiz é independente do starter e continua executável por npm start. O código completo da hospedagem é versionado no repositório de origem do Site.
