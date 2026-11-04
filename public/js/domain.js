export const numberOrNull = value => typeof value === 'number' && Number.isFinite(value) ? value : null;
export function selectAssets(assets, {query='',type='all',favoritesOnly=false,favorites=[],sort='ticker'}={}) {
 const term=query.trim().toLocaleLowerCase('pt-BR');
 return assets.filter(a => `${a.ticker} ${a.name}`.toLocaleLowerCase('pt-BR').includes(term) && (type==='all'||a.type===type) && (!favoritesOnly||favorites.includes(a.id))).sort((a,b)=>sort==='ticker'?a.ticker.localeCompare(b.ticker):a[sort]===null?(b[sort]===null?0:1):b[sort]===null?-1:b[sort]-a[sort]);
}
export function normalizeQuote(raw,asset) {
 if(raw.symbol!==asset.ticker||raw.currency!=='BRL') throw new Error('Ativo ou moeda incompatível');
 const history=(Array.isArray(raw.historicalDataPrice)?raw.historicalDataPrice:[]).filter(p=>Number.isFinite(p.date)&&numberOrNull(p.close)!==null&&p.close>0).map(p=>({date:p.date*1000,close:p.close})).sort((a,b)=>a.date-b.date);
 const dividends=(Array.isArray(raw.dividendsData?.cashDividends)?raw.dividendsData.cashDividends:[]).filter(d=>numberOrNull(d.rate)!==null&&d.rate>=0&&Number.isFinite(Date.parse(d.paymentDate))).map(d=>({type:String(d.label||'Provento'),amount:d.rate,paymentDate:d.paymentDate.slice(0,10),recordDate:Number.isFinite(Date.parse(d.lastDatePrior))?d.lastDatePrior.slice(0,10):null,deadline:d.paymentDateIsDeadline===true}));
 return {...asset,price:numberOrNull(raw.regularMarketPrice),change:numberOrNull(raw.regularMarketChangePercent),pe:numberOrNull(raw.priceEarnings),dy:null,pb:null,asOf:Number.isFinite(Date.parse(raw.regularMarketTime))?new Date(raw.regularMarketTime).toISOString():null,history,dividends};
}
export function upcomingDividends(assets,today) {
 const unique=new Map();
 for(const asset of assets) for(const d of asset.dividends||[]) if(d.paymentDate>=today){const event={...d,ticker:asset.ticker,id:asset.id};unique.set([asset.id,d.type,d.paymentDate,d.recordDate,d.amount].join('|'),event);}
 return [...unique.values()].sort((a,b)=>a.paymentDate.localeCompare(b.paymentDate)||a.ticker.localeCompare(b.ticker));
}
export const money=value=>value==null?'—':new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(value);
export const decimal=value=>value==null?'—':new Intl.NumberFormat('pt-BR',{maximumFractionDigits:2}).format(value);
