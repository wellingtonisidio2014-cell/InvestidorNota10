import {catalog,demo} from './catalog.js';
import {normalizeQuote} from '../public/js/domain.js';
export function createProvider({mode='demo',token='',fetcher=fetch,now=()=>Date.now()}={}) {
 if (!['demo','brapi'].includes(mode)) throw new Error('DATA_PROVIDER inválido');
 let cache, expires=0, pending;
 async function refresh() {
  if(mode==='demo') return {mode,source:'Exemplos fictícios para demonstração',fetchedAt:new Date(now()).toISOString(),assets:demo,partial:false,failedTickers:[]};
  const available=token?catalog:catalog.filter(a=>a.type==='stock');
  const results=await Promise.allSettled(available.map(async asset=>{
   const response=await fetcher(`https://brapi.dev/api/quote/${asset.ticker}`,{headers:token?{Authorization:`Bearer ${token}`}:{},signal:AbortSignal.timeout(8000)});
   if(!response.ok) throw new Error('Fonte indisponível');
   const body=await response.json();
   if(!Array.isArray(body.results)||!body.results.length) throw new Error('Resposta inválida');
   return normalizeQuote(body.results[0],asset);
  }));
  const assets=results.filter(r=>r.status==='fulfilled').map(r=>r.value);
  if(!assets.length) throw new Error('Não foi possível consultar a fonte de cotações.');
  return {mode,source:'brapi.dev · atraso conforme fornecedor',fetchedAt:new Date(now()).toISOString(),assets,partial:assets.length!==available.length,failedTickers:available.filter((_,i)=>results[i].status==='rejected').map(a=>a.ticker)};
 }
 return async ()=>{
  if(cache && now()<expires) return {...cache,stale:false};
  if(!pending) pending=refresh().then(data=>{cache=data;expires=now()+60000;return {...data,stale:false}}).catch(error=>{if(cache)return {...cache,stale:true};throw error}).finally(()=>{pending=null});
  return pending;
 };
}
