import {defaultRule,validateRule,evaluateAlerts,observationDate} from './alert-rules.js';
import {money,decimal} from './domain.js';
import {toast} from './interactions.js';
const $=id=>document.getElementById(id);
const KEY='n10-alerts-v1',RULE='n10-alert-rule-v1',DESKTOP='n10-alert-desktop';
let rule={...defaultRule},desktop=false,lastSnapshot=null,lastFavorites=[],openAsset=()=>{},memory={entries:[],seen:[]},logWritable=true;
function read(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
function write(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}}
try{rule=validateRule(read(RULE,defaultRule));}catch{}
desktop=read(DESKTOP,false)===true;
function readLog(){
  const value=logWritable?read(KEY,memory):memory;
  return {entries:Array.isArray(value.entries)?value.entries.filter(a=>typeof a?.ticker==='string'&&typeof a.key==='string'&&Number.isFinite(a.change)&&Number.isFinite(a.price)&&Number.isFinite(Date.parse(a.observedAt))).slice(0,50):[],seen:Array.isArray(value.seen)?value.seen.filter(k=>typeof k==='string').slice(-1000):[]};
}
function saveLog(log){memory=log;if(!write(KEY,log)){logWritable=false;$('alerts-status').textContent='Armazenamento indisponível: alertas mantidos somente nesta sessão.';}}
function permissionText(){
  if(!('Notification' in window))return 'Avisos do navegador indisponíveis neste dispositivo.';
  if(Notification.permission==='denied')return 'Permissão bloqueada no navegador. Os avisos no site continuam ativos.';
  return desktop&&Notification.permission==='granted'?'Avisos do navegador ativados enquanto o site estiver aberto.':'Avisos do navegador são opcionais e exigem sua permissão.';
}
function render(){
  const log=readLog(),unread=log.entries.filter(e=>!e.read).length;
  $('alert-badge').textContent=unread?String(unread):'0';$('alert-open').setAttribute('aria-label',`Notificações: ${unread} não lidas`);
  $('alerts-summary').textContent=rule.enabled?`Monitorando ${rule.scope==='favorites'?'ações favoritas':'ações carregadas'} · ${rule.direction==='up'?'altas':rule.direction==='down'?'quedas':'altas e quedas'} a partir de ${decimal(rule.threshold)}%.`:'Monitoramento pausado.';
  $('alert-card-rule').textContent=$('alerts-summary').textContent;
  $('alert-card-state').textContent=unread?`${unread} aviso${unread===1?'':'s'} não lido${unread===1?'':'s'}`:rule.enabled?'Radar ativo':'Radar pausado';
  $('alert-quick-enabled').checked=rule.enabled;
  $('desktop-status').textContent=permissionText();$('desktop-enable').textContent=desktop?'Desativar avisos do navegador':'Ativar avisos do navegador';
  const container=$('alerts-history');container.replaceChildren();
  for(const entry of log.entries){
    const article=document.createElement('article');article.className=`alert-entry ${entry.read?'':'unread'}`;
    const button=document.createElement('button');button.className='ticker';button.textContent=entry.isTest?'TESTE · exemplo de notificação':entry.ticker;
    if(entry.isTest)button.disabled=true;else button.addEventListener('click',()=>{$('alerts-dialog').close();openAsset(entry.assetId);});
    const change=document.createElement('strong');change.className=entry.change<0?'negative':'positive';change.textContent=`${entry.change>0?'+':''}${decimal(entry.change)}%`;
    const row=document.createElement('div');row.className='alert-entry-head';row.append(button,change);article.append(row);
    const info=document.createElement('p');info.textContent=entry.isTest?'Exemplo fictício. Não representa uma oscilação do mercado.':`Preço informado: ${money(entry.price)} · limite: ${decimal(entry.threshold)}%.`;
    const time=document.createElement('small');time.textContent=`Verificação: ${new Date(entry.observedAt).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})} (Brasília).`;
    const source=document.createElement('small');source.textContent=entry.isTest?'Canal de teste local.':entry.asOf?`Fonte: ${entry.source} · cotação: ${new Date(entry.asOf).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})}.`:`Fonte: ${entry.source}. Horário da cotação não informado; o preço pode estar antigo.`;
    article.append(info,time,source);container.append(article);
  }
  if(!log.entries.length){const p=document.createElement('p');p.className='empty';p.textContent='Nenhuma notificação registrada. Ajuste seu limite ou use “Testar aviso”.';container.append(p);}
}
function notify(entries){
  if(!entries.length)return;
  toast(entries.length===1?`${entries[0].ticker}: variação informada de ${decimal(entries[0].change)}%. Veja as notificações.`:`${entries.length} ações com variação informada acima do limite. Veja as notificações.`);
  if(!desktop||!('Notification' in window)||Notification.permission!=='granted')return;
  try {
    const notification=new Notification('Radar N10 · oscilação informada',{body:`${entries.length} ação(ões) alcançaram o limite. Confira origem e horário no site; a cotação pode estar atrasada.`,tag:'n10-market-alerts'});
    notification.addEventListener('click',()=>{window.focus();$('alerts-dialog').showModal();notification.close();});
  }catch{$('desktop-status').textContent='Este navegador não conseguiu mostrar o aviso externo. Confira as notificações no site.';}
}
export async function processAlerts(snapshot,favorites){
  lastSnapshot=snapshot;lastFavorites=[...favorites];
  const process=()=>{
    const log=readLog();const entries=evaluateAlerts(snapshot,rule,favorites,log.seen);
    if(entries.length){
      const today=observationDate(Date.now());
      saveLog({entries:[...entries,...log.entries].slice(0,50),seen:[...log.seen.filter(k=>k.startsWith(today+'|')),...entries.map(a=>a.key)].slice(-1000)});
      render();notify(entries);
    }
  };
  // Web Locks prevents simultaneous tabs from issuing the same local alert.
  try {if(navigator.locks?.request)await navigator.locks.request('n10-alert-log',process);else process();} catch {process();}
}
export function initAlerts(onOpenAsset){
  openAsset=onOpenAsset;
  $('alert-enabled').checked=rule.enabled;$('alert-threshold').value=rule.threshold;$('alert-direction').value=rule.direction;$('alert-scope').value=rule.scope;
  $('alert-open').addEventListener('click',()=>{$('alerts-dialog').showModal();render();});
  $('alert-card-open').addEventListener('click',()=>{$('alerts-dialog').showModal();render();});
  $('alert-quick-enabled').addEventListener('change',event=>{
    rule={...rule,enabled:event.target.checked};$('alert-enabled').checked=rule.enabled;
    const saved=write(RULE,rule);render();
    toast(`${rule.enabled?'Monitoramento ativado.':'Monitoramento pausado.'}${saved?'':' Preferência mantida apenas nesta sessão.'}`);
    if(lastSnapshot)processAlerts(lastSnapshot,lastFavorites);
  });
  $('alerts-close').addEventListener('click',()=>$('alerts-dialog').close());
  $('alerts-form').addEventListener('submit',event=>{
    event.preventDefault();
    try{rule=validateRule({enabled:$('alert-enabled').checked,threshold:$('alert-threshold').value,direction:$('alert-direction').value,scope:$('alert-scope').value});$('alerts-status').textContent=write(RULE,rule)?'Preferências salvas neste navegador.':'Preferências válidas apenas nesta sessão: armazenamento indisponível.';render();if(lastSnapshot)processAlerts(lastSnapshot,lastFavorites);}
    catch(error){$('alerts-status').textContent=error.message;}
  });
  $('desktop-enable').addEventListener('click',async()=>{
    if(desktop){desktop=false;write(DESKTOP,false);render();return;}
    if(!('Notification'in window)){render();return;}
    try{const permission=await Notification.requestPermission();desktop=permission==='granted';write(DESKTOP,desktop);render();}catch{$('desktop-status').textContent='Permissão não disponível. Os avisos internos continuam funcionando.';}
  });
  $('alerts-read').addEventListener('click',()=>{const log=readLog();log.entries=log.entries.map(e=>({...e,read:true}));saveLog(log);render();});
  $('alerts-test').addEventListener('click',()=>{
    const log=readLog();const sample={key:`test-${Date.now()}`,isTest:true,ticker:'TESTE',change:5,price:10,observedAt:new Date().toISOString()};
    saveLog({...log,entries:[sample,...log.entries].slice(0,50)});render();$('alerts-status').textContent='Exemplo fictício adicionado ao histórico. Nenhum evento real foi gerado.';
  });
  window.addEventListener('storage',event=>{if(event.key===KEY)render();if(event.key===RULE){try{rule=validateRule(read(RULE,defaultRule));$('alert-enabled').checked=rule.enabled;$('alert-threshold').value=rule.threshold;$('alert-direction').value=rule.direction;$('alert-scope').value=rule.scope;render();}catch{}}});
  render();
}
