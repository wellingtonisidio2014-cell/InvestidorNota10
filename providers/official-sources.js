export const SOURCES = {
  bcb: {name:'Banco Central do Brasil',url:'https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json',reference:'https://dadosabertos.bcb.gov.br/dataset/432-taxa-de-juros---meta-selic-definida-pelo-copom',scope:'Meta Selic definida pelo Copom · SGS 432'},
  ibge: {name:'IBGE · SIDRA',url:'https://apisidra.ibge.gov.br/values/t/1737/n1/all/v/63/p/last%201?formato=json',reference:'https://sidra.ibge.gov.br/tabela/1737',scope:'IPCA mensal · Brasil · tabela 1737, variável 63'},
  cvm: {name:'Comissão de Valores Mobiliários',url:'https://dados.cvm.gov.br/dados/CIA_ABERTA/CAD/DADOS/cad_cia_aberta.csv',reference:'https://dados.cvm.gov.br/dataset/cia_aberta-cad',scope:'Cadastro de companhias abertas · identificação dos emissores'}
};
// Curated ticker-to-issuer mapping. CVM registry does not contain tickers.
const issuers = [
  ['PETR4','9512','33000167000101'],['VALE3','4170','33592510000154'],
  ['ITUB4','19348','60872504000123'],['MGLU3','22470','47960950000121']
];
function decimal(value) {
  if(typeof value!=='string'||!/^[-+]?\d+(?:[.,]\d+)?$/.test(value.trim()))throw new Error('Valor oficial inválido');
  const result=Number(value.replace(',','.'));if(!Number.isFinite(result))throw new Error('Valor inválido');return result;
}
export function parseSelic(body) {
  const row=body?.[0];
  if(!row||!/^\d{2}\/\d{2}\/\d{4}$/.test(row.data))throw new Error('Data SGS inválida');
  const [day,month,year]=row.data.split('/');
  const iso=`${year}-${month}-${day}`;
  const parsed=Date.parse(iso+'T00:00:00Z');
  if(!Number.isFinite(parsed)||new Date(parsed).toISOString().slice(0,10)!==iso)throw new Error('Data SGS inválida');
  return {label:'Meta Selic',value:decimal(row.valor),unit:'% a.a.',referenceDate:`${year}-${month}-${day}`,series:'SGS 432'};
}
export function parseIpca(body) {
  // Explicit variable, territory and unit checks avoid confusing the index level with inflation.
  const row=Array.isArray(body)&&body.find(item=>item.D2C==='63'&&item.D1C==='1'&&item.NC==='1'&&item.MN==='%');
  if(!row||!/^(19|20)\d{2}(0[1-9]|1[0-2])$/.test(row.D3C))throw new Error('Série IPCA incompatível');
  return {label:'IPCA mensal',value:decimal(row.V),unit:'% no mês',referenceDate:`${row.D3C.slice(0,4)}-${row.D3C.slice(4)}`,referenceLabel:row.D3N,series:'SIDRA 1737 · variável 63'};
}
export function parseCSV(text) {
  const rows=[];let row=[],field='',quoted=false;
  for(let i=0;i<text.length;i++) {
    const char=text[i];
    if(char==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}
    else if(char===';'&&!quoted){row.push(field);field='';}
    else if((char==='\n'||char==='\r')&&!quoted){if(char==='\r'&&text[i+1]==='\n')i++;row.push(field);if(row.some(Boolean))rows.push(row);row=[];field='';}
    else field+=char;
  }
  if(quoted)throw new Error('CSV incompleto');
  if(field||row.length){row.push(field);rows.push(row);}return rows;
}
export function parseRegistry(text) {
  const [headers,...rows]=parseCSV(text.replace(/^\uFEFF/,''));
  const required=['CD_CVM','CNPJ_CIA','DENOM_SOCIAL','SIT','SETOR_ATIV','DT_REG','DT_INI_SIT'];
  if(!headers||required.some(key=>!headers.includes(key)))throw new Error('Cadastro CVM incompatível');
  const records=rows.map(row=>Object.fromEntries(required.map(key=>[key,row[headers.indexOf(key)]||''])));
  const result=issuers.flatMap(([ticker,code,cnpj])=>{
    const matches=records.filter(row=>row.CD_CVM.replace(/^0+/,'')===code&&row.CNPJ_CIA.replace(/\D/g,'')===cnpj).sort((a,b)=>b.DT_INI_SIT.localeCompare(a.DT_INI_SIT));
    const row=matches[0];if(!row)return [];
    return [{ticker,cvmCode:code,cnpj:row.CNPJ_CIA,legalName:row.DENOM_SOCIAL,registrationStatus:row.SIT,sector:row.SETOR_ATIV,registrationDate:row.DT_REG,statusSince:row.DT_INI_SIT}];
  });
  if(!result.length)throw new Error('Emissores não encontrados no cadastro');return result;
}
export function createOfficialProvider({fetcher=fetch,now=()=>Date.now(),ttl=21600000}={}) {
  const cache=new Map(),pending=new Map();
  async function readSource(id) {
    const previous=cache.get(id);
    if(previous&&now()<previous.nextCheck)return previous.payload;
    if(pending.has(id))return pending.get(id);
    const task=(async()=>{
      const source=SOURCES[id];
      try {
        const response=await fetcher(source.url,{signal:AbortSignal.timeout(15000),headers:{Accept:id==='cvm'?'text/csv':'application/json'}});
        if(!response.ok)throw new Error('Fonte indisponível');
        const data=id==='cvm'?parseRegistry(new TextDecoder('windows-1252').decode(await response.arrayBuffer())):id==='bcb'?parseSelic(await response.json()):parseIpca(await response.json());
        const modified=response.headers?.get('last-modified');
        const payload={id,name:source.name,reference:source.reference,endpoint:source.url,scope:source.scope,status:'available',fetchedAt:new Date(now()).toISOString(),sourceUpdatedAt:modified&&Number.isFinite(Date.parse(modified))?new Date(modified).toISOString():null,data};
        cache.set(id,{payload,nextCheck:now()+ttl});return payload;
      }catch{
        const payload=previous?.payload?.data?{...previous.payload,status:'stale'}:{id,name:source.name,reference:source.reference,endpoint:source.url,scope:source.scope,status:'unavailable',fetchedAt:null,sourceUpdatedAt:null,data:null};
        cache.set(id,{payload,nextCheck:now()+900000});return payload;
      }finally{pending.delete(id);}
    })();pending.set(id,task);return task;
  }
  return async()=>({sources:await Promise.all(Object.keys(SOURCES).map(readSource)),note:'BCB e IBGE fornecem contexto econômico. CVM confirma campos cadastrais, não cotações, balanços ou recomendações. Cotações e proventos continuam provenientes da brapi.'});
}
