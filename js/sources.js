import {loadContext} from './pages-data.js';
import {decimal} from './domain.js';
let snapshot=null,request=null;
const element=(tag,text,className)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;};
const time=value=>value?new Date(value).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}):'Não disponível';
const date=value=>/^\d{4}-\d{2}-\d{2}$/.test(value||'')?value.split('-').reverse().join('/'):value||'Não informada';
function link(source) {
  const a=element('a','Consultar fonte oficial ↗','text-link');a.href=source.reference;a.target='_blank';a.rel='noopener noreferrer';return a;
}
function status(source) {
  return source.status==='snapshot'?'Cópia da publicação · consulte a data de coleta':source.status==='available'?'Consulta concluída':source.status==='stale'?'Falha na atualização · dados anteriores':'Fonte indisponível';
}
function renderSources() {
  const container=document.getElementById('official-cards');container.replaceChildren();
  for(const source of snapshot.sources) {
    const card=element('article',undefined,'official-card');
    card.append(element('span',source.id.toUpperCase(),'source-label'),element('h3',source.name),element('p',status(source),`source-state ${source.status==='available'?'positive':'muted'}`));
    if(source.data&&source.id!=='cvm') {
      card.append(element('p',source.data.label,'muted'),element('strong',`${decimal(source.data.value)} ${source.data.unit}`,'official-value'),element('p',`Referência: ${source.data.referenceLabel||date(source.data.referenceDate)}`,'reference-date'));
    } else if(source.id==='cvm'&&source.data) {
      card.append(element('strong',`${source.data.length} emissores`,'official-value'),element('p','Razão social, CNPJ, situação do registro e setor nos detalhes de cada ação.','muted'));
    } else card.append(element('p','Sem dados disponíveis nesta consulta. Nenhum valor estimado foi inserido.','muted'));
    card.append(element('p',source.scope,'source-scope'),element('small',`Coleta: ${time(source.fetchedAt)} (Brasília)`));
    if(source.sourceUpdatedAt)card.append(element('small',`Arquivo atualizado: ${time(source.sourceUpdatedAt)}`));
    card.append(link(source));container.append(card);
  }
  document.getElementById('sources-note').textContent=snapshot.note;
}
export function renderIssuer(container,ticker) {
  container.replaceChildren();
  container.append(element('h3','Cadastro oficial · CVM'));
  const source=snapshot?.sources?.find(item=>item.id==='cvm');
  const record=source?.data?.find(item=>item.ticker===ticker);
  if(!record){container.append(element('p',source?'Cadastro não disponível para este ativo nesta integração.':'Consultando o cadastro oficial…','muted'));return;}
  container.append(element('p',record.legalName,'issuer-name'));
  const list=element('dl',undefined,'issuer-fields');
  for(const [label,value] of [['CNPJ',record.cnpj],['Código CVM',record.cvmCode],['Situação do registro',record.registrationStatus],['Setor cadastral',record.sector],['Registro inicial',date(record.registrationDate)],['Situação desde',date(record.statusSince)]])list.append(element('dt',label),element('dd',value));
  container.append(list,element('p',`${status(source)} · coleta: ${time(source.fetchedAt)} (Brasília).`,'muted'),element('p','Cadastro do emissor, sem certificação da cotação ou recomendação de investimento.','note'),link(source));
}
export function loadSources() {
  if(request)return request;
  request=(async()=>{
    try {
      const data=await loadContext();if(!Array.isArray(data.sources))throw new Error('Resposta inválida');
      snapshot=data;renderSources();
      const detail=document.querySelector('[data-issuer]');if(detail)renderIssuer(detail,detail.dataset.issuer);
    }catch{
      if(snapshot){snapshot={...snapshot,sources:snapshot.sources.map(source=>({...source,status:source.data?'stale':'unavailable'}))};renderSources();}
      else document.getElementById('official-cards').replaceChildren(element('p','As fontes oficiais estão indisponíveis nesta consulta. Tente atualizar.','empty'));
      document.getElementById('sources-note').textContent='Não foi possível atualizar as fontes oficiais. As cotações usam uma consulta independente.';
    }finally{request=null;}
  })();return request;
}
