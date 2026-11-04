import {renderHistory} from './chart.js';
import {money,decimal} from './domain.js';
import {PERIODS,createHistoryLoader,periodSummary} from './history-data.js';
import {renderIssuer} from './sources.js';
const $=id=>document.getElementById(id);
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const stamp=value=>value?new Date(value).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}):'Não informado';
const date=value=>new Date(value).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'});
const pct=value=>value==null?'—':`${value>0?'+':''}${decimal(value)}%`;
export function initExpandedChart(getAssets,getSelected,{getPeriod=()=> '1mo',loadHistory=createHistoryLoader()}={}) {
 const dialog=$('expanded-chart');let asset,period='1mo',request=0,returnFocus;
 const setState=message=>{$('expanded-status').textContent=message;};
 function metrics(current){
  $('expanded-name').textContent=`${current.ticker} · ${current.name}`;
  $('expanded-price').textContent=money(current.price);
  $('expanded-daily').textContent=`${pct(current.change)} no dia`;
  $('expanded-daily').className=current.change==null?'muted':current.change<0?'negative':'positive';
  $('expanded-quote-time').textContent=`Cotação: ${stamp(current.asOf)} (Brasília) · brapi.dev`;
  const facts=$('expanded-facts');facts.replaceChildren();
  for(const [label,value] of [['Abertura',money(current.open)],['Máxima do dia',money(current.dayHigh)],['Mínima do dia',money(current.dayLow)],['Fechamento anterior',money(current.previousClose)],['Volume negociado',decimal(current.volume)],['Valor de mercado',money(current.marketCap)],['P/L',decimal(current.pe)],['Lucro por ação',money(current.eps)],['Máxima em 52 semanas',money(current.week52High)],['Mínima em 52 semanas',money(current.week52Low)]]){const card=el('div');card.append(el('dt',label),el('dd',value));facts.append(card);}
  const issuer=$('expanded-issuer');issuer.dataset.issuer=current.ticker;renderIssuer(issuer,current.ticker);
 }
 async function refresh(){
  const sequence=++request,current=asset,chosen=period;
  $('expanded-history').replaceChildren(el('p','Consultando histórico…','empty'));
  $('expanded-period-change').textContent='—';$('expanded-range').textContent='';$('expanded-range-stats').textContent='';
  $('expanded-history').setAttribute('aria-busy','true');setState('Consultando a fonte…');
  for(const button of $('expanded-periods').children)button.setAttribute('aria-pressed',String(button.dataset.range===chosen));
  try{
   const result=await loadHistory(current,chosen);if(sequence!==request||!dialog.open)return;
   metrics(result.asset);
   renderHistory($('expanded-history'),result.asset,0,{expanded:true,intraday:result.period.intraday,caption:result.period.intraday?'Fechamento do intervalo · Brasília':result.period.caption});
   const summary=periodSummary(result.asset.history);
   $('expanded-period-change').textContent=`${pct(summary.change)} (${money(summary.absolute)}) no período`;
   $('expanded-period-change').className=summary.change<0?'negative':'positive';
   $('expanded-range').textContent=`${result.period.caption} · ${date(summary.first)} a ${date(summary.last)}`;
   $('expanded-range-stats').textContent=`Menor fechamento: ${money(summary.low)} · maior fechamento: ${money(summary.high)} · ${summary.points} pontos`;
   setState(`Consulta: ${stamp(result.fetchedAt)} (Brasília). Variação do período calculada entre o primeiro e o último fechamento retornado; não inclui proventos. Atraso e ajustes conforme fornecedor.`);
  }catch(error){if(sequence!==request||!dialog.open)return;$('expanded-history').replaceChildren(el('p',error.message||'Não foi possível consultar o histórico.','empty'));setState('Histórico não atualizado. Escolha outro período ou use “Atualizar”. Nenhum preço foi estimado.');}
  finally{if(sequence===request)$('expanded-history').setAttribute('aria-busy','false');}
 }
 function choose(id){asset=getAssets().find(a=>a.id===id);if(!asset)return;metrics(asset);$('expanded-asset').value=id;refresh();}
 for(const item of PERIODS){const button=el('button',item.label);button.type='button';button.dataset.range=item.key;button.setAttribute('aria-pressed',String(item.key===period));button.onclick=()=>{period=item.key;refresh();};$('expanded-periods').append(button);}
 $('chart-expand').addEventListener('click',()=>{
  const assets=getAssets().filter(a=>a.history?.length>1);if(!assets.length)return;
  period=getPeriod();returnFocus=document.activeElement;$('expanded-asset').replaceChildren();
  for(const item of assets){const option=el('option',`${item.ticker} · ${item.name}`);option.value=item.id;$('expanded-asset').append(option);}
  dialog.showModal();document.body.classList.add('chart-is-expanded');choose(assets.some(a=>a.id===getSelected())?getSelected():assets[0].id);
 });
 $('expanded-asset').onchange=event=>choose(event.target.value);
 $('expanded-refresh').onclick=()=>refresh();
 $('expanded-close').onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>{request++;document.body.classList.remove('chart-is-expanded');returnFocus?.focus({preventScroll:true});});
 setInterval(()=>{if(dialog.open&&!document.hidden&&$('expanded-history').getAttribute('aria-busy')!=='true')refresh();},60000);
 document.addEventListener('visibilitychange',()=>{if(dialog.open&&!document.hidden)refresh();});
}
