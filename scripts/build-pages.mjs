import {cp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {SOURCES,parseRegistry} from '../server/official-sources.js';

const root=fileURLToPath(new URL('../',import.meta.url));
const out=join(root,'dist-pages');
// Only this known generated directory may be replaced.
await rm(out,{recursive:true,force:true});
await cp(join(root,'public'),out,{recursive:true});
await mkdir(join(out,'providers'),{recursive:true});
await mkdir(join(out,'data'),{recursive:true});
for(const name of ['provider.js','catalog.js','market-list.js','official-sources.js']) {
  const code=(await readFile(join(root,'server',name),'utf8')).replace('../public/js/domain.js','../js/domain.js');
  await writeFile(join(out,'providers',name),code);
}
const source=SOURCES.cvm;
const response=await fetch(source.url,{signal:AbortSignal.timeout(30000)});
if(!response.ok)throw new Error(`CVM HTTP ${response.status}: publicação interrompida`);
const data=parseRegistry(new TextDecoder('windows-1252').decode(await response.arrayBuffer()));
const modified=response.headers.get('last-modified');
await writeFile(join(out,'data/cvm.json'),JSON.stringify({id:'cvm',name:source.name,reference:source.reference,endpoint:source.url,scope:source.scope,status:'snapshot',fetchedAt:new Date().toISOString(),sourceUpdatedAt:modified&&Number.isFinite(Date.parse(modified))?new Date(modified).toISOString():null,data}));
const html=(await readFile(join(out,'index.html'),'utf8')).replace(/(href|src)="\/(?!\/)/g,'$1="./').replace('Cache de até 6 horas para fontes oficiais; em falhas, dados preservados ficam identificados.','BCB e IBGE: cache de até 6 horas nesta aba; CVM: cópia da publicação com data de coleta. Em falhas, dados preservados ficam identificados.');
await writeFile(join(out,'index.html'),html);
function replaceOnce(code,from,to) {
  if(!code.includes(from))throw new Error(`Contrato de build mudou: ${from}`);
  return code.replace(from,to);
}
let app=await readFile(join(out,'js/app.js'),'utf8');
app=replaceOnce(app,"const response = await fetch('/api/assets', {signal:AbortSignal.timeout(90000)});\n    if (!response.ok) throw new Error('Fonte indisponível');\n    const data = await response.json();",'const data = await loadAssets();');
app=app.replace('FIIs exigem configuração. ','FIIs precisam de um servidor com chave; indisponíveis nesta versão estática. ');
await writeFile(join(out,'js/app.js'),"import {loadAssets} from './pages-data.js';\n"+app);
let sources=await readFile(join(out,'js/sources.js'),'utf8');
sources=replaceOnce(sources,"const response=await fetch('/api/context',{signal:AbortSignal.timeout(25000)});\n      if(!response.ok)throw new Error('Fonte indisponível');\n      const data=await response.json();",'const data=await loadContext();');
sources=replaceOnce(sources,"return source.status==='available'", "return source.status==='snapshot'?'Cópia da publicação · consulte a data de coleta':source.status==='available'");
await writeFile(join(out,'js/sources.js'),"import {loadContext} from './pages-data.js';\n"+sources);
await cp(join(root,'scripts/pages-data.js'),join(out,'js/pages-data.js'));
await writeFile(join(out,'.nojekyll'),'');
// main/(root) publishing also works: the root entry redirects into this generated site.
await rm(join(root,'site'),{recursive:true,force:true});
await cp(out,join(root,'site'),{recursive:true});
console.log(JSON.stringify({directory:out,registryRecords:data.length,mode:'public APIs without credentials'}));
