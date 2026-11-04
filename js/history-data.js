import {normalizeQuote} from './domain.js';
export const PERIODS=[
 {key:'1d',label:'1 D',interval:'15m',caption:'Intervalos de 15 minutos',intraday:true},
 {key:'5d',label:'5 D',interval:'1d',caption:'Fechamentos diários'},
 {key:'1mo',label:'1 M',interval:'1d',caption:'Fechamentos diários'},
 {key:'3mo',label:'3 M',interval:'1d',caption:'Fechamentos diários'},
 {key:'6mo',label:'6 M',interval:'1d',caption:'Fechamentos diários'},
 {key:'ytd',label:'No ano',interval:'1d',caption:'Fechamentos diários'},
 {key:'1y',label:'1 A',interval:'1d',caption:'Fechamentos diários'},
 {key:'5y',label:'5 A',interval:'1wk',caption:'Fechamentos semanais'}
];
export function periodSummary(history=[]) {
 if(history.length<2)return null;
 const first=history[0],last=history.at(-1);
 if(!(first.close>0)||!(last.close>0))return null;
 return {first:first.date,last:last.date,change:(last.close/first.close-1)*100,absolute:last.close-first.close,low:Math.min(...history.map(p=>p.close)),high:Math.max(...history.map(p=>p.close)),points:history.length};
}
export function createHistoryLoader({fetcher=fetch,now=()=>Date.now()}={}) {
 const cache=new Map(),pending=new Map();
 return async(asset,range)=>{
  const period=PERIODS.find(p=>p.key===range);
  if(!period||!asset||!/^[A-Z]{4}\d{1,2}$/.test(asset.ticker))throw new Error('Ativo ou período inválido.');
  const key=`${asset.ticker}:${range}`;
  if(cache.has(key)&&now()-cache.get(key).fetchedAt<60000)return cache.get(key);
  if(pending.has(key))return pending.get(key);
  const task=(async()=>{
   const response=await fetcher(`https://brapi.dev/api/quote/${asset.ticker}?range=${range}&interval=${period.interval}`,{signal:AbortSignal.timeout(15000)});
   if(!response.ok)throw new Error([401,403].includes(response.status)?'Este histórico exige acesso adicional do fornecedor.':response.status===429?'Limite de consultas atingido. Aguarde um minuto e tente novamente.':'Histórico indisponível nesta consulta.');
   const body=await response.json(),raw=body.results?.[0];
   if(!raw)throw new Error('A fonte não retornou histórico.');
   if((raw.usedRange&&raw.usedRange!==range)||(raw.usedInterval&&raw.usedInterval!==period.interval))throw new Error('A fonte retornou um período ou intervalo diferente do solicitado.');
   const quote=normalizeQuote(raw,asset);
   if(quote.history.length<2)throw new Error('Não há pontos suficientes para este período. Selecione outro período.');
   const result={asset:quote,fetchedAt:now(),period};cache.set(key,result);return result;
  })().finally(()=>pending.delete(key));
  pending.set(key,task);return task;
 };
}
