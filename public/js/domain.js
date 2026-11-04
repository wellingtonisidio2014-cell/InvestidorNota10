export const numberOrNull = value => typeof value === 'number' && Number.isFinite(value) ? value : null;
export function selectAssets(assets, {query = '', type = 'all', favoritesOnly = false, favorites = [], sort = 'ticker'} = {}) {
 const term = query.trim().toLocaleLowerCase('pt-BR');
 const list = assets.filter(a => `${a.ticker} ${a.name}`.toLocaleLowerCase('pt-BR').includes(term) && (type === 'all' || a.type === type) && (!favoritesOnly || favorites.includes(a.id)));
 return list.sort((a,b) => sort === 'ticker' ? a.ticker.localeCompare(b.ticker) : a[sort] === null ? (b[sort] === null ? 0 : 1) : b[sort] === null ? -1 : b[sort]-a[sort]);
}
export function normalizeQuote(raw, asset) {
 if (raw.symbol !== asset.ticker || raw.currency !== 'BRL') throw new Error('Ativo ou moeda incompatível');
 return {...asset, price:numberOrNull(raw.regularMarketPrice), change:numberOrNull(raw.regularMarketChangePercent), pe:numberOrNull(raw.priceEarnings), dy:null, pb:null, asOf: Number.isFinite(Date.parse(raw.regularMarketTime)) ? new Date(raw.regularMarketTime).toISOString() : null};
}
export const money = value => value === null || value === undefined ? '—' : new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(value);
export const decimal = value => value === null || value === undefined ? '—' : new Intl.NumberFormat('pt-BR',{maximumFractionDigits:2}).format(value);
