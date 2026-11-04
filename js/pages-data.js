// Published browser adapter. No private endpoint, credential or API key is used.
import {createProvider} from '../providers/provider.js';
import {createOfficialProvider,SOURCES} from '../providers/official-sources.js';
export const loadAssets=createProvider({mode:'brapi'});
const liveContext=createOfficialProvider({fetcher:(url,options)=>{
  // CVM does not permit browser CORS; use the dated, sanitized publication copy.
  if(url===SOURCES.cvm.url)return Promise.reject(new Error('Use publication snapshot'));
  return fetch(url,options);
}});
export async function loadContext() {
  const context=await liveContext();
  try {
    const response=await fetch(new URL('../data/cvm.json',import.meta.url),{signal:AbortSignal.timeout(15000)});
    if(!response.ok)throw new Error('Cadastro indisponível');
    const source=await response.json();
    if(source.id!=='cvm'||source.status!=='snapshot'||!Array.isArray(source.data)||!Number.isFinite(Date.parse(source.fetchedAt)))throw new Error('Cadastro inválido');
    context.sources=context.sources.map(item=>item.id==='cvm'?source:item);
  } catch { /* The live provider already supplies an explicit unavailable state. */ }
  context.note+=' Nesta versão GitHub Pages, BCB e IBGE são consultados diretamente; o cadastro CVM é uma cópia coletada na publicação, sem atualização automática. Favoritos e alertas ficam neste navegador e não migram de outro endereço.';
  return context;
}
