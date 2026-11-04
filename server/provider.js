import {catalog,demo} from './catalog.js';
import {normalizeQuote} from '../public/js/domain.js';
export function createProvider({mode='brapi',token='',fetcher=fetch,now=()=>Date.now()}={}) {
 if(!['demo','brapi'].includes(mode)) throw new Error('DATA_PROVIDER inválido');
 let cache,expires=0,pending,failed=false;
 async function refresh() {
  if(mode==='demo') return {mode,source:'Exemplos fictícios',fetchedAt:new Date(now()).toISOString(),assets:demo,partial:false,failedTickers:[],restrictedTickers:[]};
  const available=token?catalog:catalog.filter(a=>['PETR4','VALE3','ITUB4','MGLU3'].includes(a.ticker));
  const results=[];
  // The free provider rejects simultaneous requests: query one asset at a time.
  for (const asset of available) {
   try {
   const response=await fetcher(`https://brapi.dev/api/quote/${asset.ticker}?range=1mo&interval=1d&dividends=true`,{headers:token?{Authorization:`Bearer ${token}`}:{},signal:AbortSignal.timeout(10000)});
   if(!response.ok) throw new Error(`Fonte HTTP ${response.status}`);
   const body=await response.json();
   if(!Array.isArray(body.results)||!body.results.length) throw new Error('Resposta inválida');
   results.push({status:"fulfilled",value:normalizeQuote(body.results[0],asset)});
   } catch(error) { results.push({status:"rejected",reason:error}); }
  }
  const assets=results.filter(r=>r.status==='fulfilled').map(r=>r.value);
  if(!assets.length) { console.warn('Cotações indisponíveis', results.map(r=>r.reason?.name || 'UnknownError')); throw new Error('Não foi possível consultar a fonte de cotações.'); }
  return {mode,source:'brapi.dev',fetchedAt:new Date(now()).toISOString(),assets,partial:assets.length!==available.length,failedTickers:available.filter((_,i)=>results[i].status==='rejected').map(a=>a.ticker),restrictedTickers:catalog.filter(a=>!available.includes(a)).map(a=>a.ticker)};
 }
 return async()=>{
  if(cache&&now()<expires)return {...cache,stale:failed};
  if(!pending)pending=refresh().then(data=>{cache=data;failed=false;expires=now()+60000;return {...data,stale:false}}).catch(error=>{failed=true;expires=now()+15000;if(cache)return {...cache,stale:true};throw error}).finally(()=>{pending=null});
  // A failure never substitutes fabricated prices for market data.
  return pending;
 };
}
