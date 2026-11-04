import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createProvider} from './provider.js';
const files=new Map([['/',['index.html','text/html']],['/styles.css',['styles.css','text/css']],['/js/app.js',['js/app.js','text/javascript']],['/js/domain.js',['js/domain.js','text/javascript']]]);
export function makeServer(provider=createProvider({mode:process.env.DATA_PROVIDER||'demo',token:process.env.BRAPI_TOKEN||''})) {
 return createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
  if(req.method!=='GET'){res.writeHead(405,{'Allow':'GET'});res.end();return;}
  const path=new URL(req.url,'http://localhost').pathname;
  try {
   if(path==='/api/assets') {const data=await provider();res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));return;}
   const entry=files.get(path);
   if(!entry){res.writeHead(404);res.end('Página não encontrada');return;}
   const content=await readFile(new URL('../public/'+entry[0],import.meta.url));
   res.writeHead(200,{'Content-Type':entry[1]+'; charset=utf-8'});res.end(content);
  }catch {res.writeHead(503,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify({error:'Fonte indisponível. Tente novamente em instantes.'}));}
 });
}
if(process.argv[1]===fileURLToPath(import.meta.url)) makeServer().listen(Number(process.env.PORT||3000),()=>console.log('InvestidorNota10 disponível na porta '+(process.env.PORT||3000)));
