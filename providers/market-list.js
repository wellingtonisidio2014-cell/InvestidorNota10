import {numberOrNull} from '../js/domain.js';
export function normalizeMarketList(body) {
  if(!Array.isArray(body?.stocks))throw new Error('Lista de mercado inválida');
  const unique=new Map();
  for(const raw of body.stocks.slice(0,50)) {
    if(raw.type!=='stock'||!/^\w{4}\d{1,2}$/.test(raw.stock||''))continue;
    const price=numberOrNull(raw.close);if(price===null||price<=0)continue;
    unique.set(raw.stock,{id:`BR-${raw.stock}`,ticker:raw.stock,name:String(raw.name||raw.stock),type:'stock',sector:String(raw.subsector||raw.sector||'Não informado'),price,change:numberOrNull(raw.change),volume:numberOrNull(raw.volume),pe:null,pb:null,dy:null,asOf:null,history:[],dividends:[],coverage:'summary',quoteSource:'brapi.dev · lista de mercado'});
  }
  if(!unique.size)throw new Error('Nenhuma cotação válida na lista');
  return [...unique.values()];
}
