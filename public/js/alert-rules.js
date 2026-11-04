export const defaultRule = {enabled:true,threshold:5,direction:'both',scope:'all'};
export function validateRule(input={}) {
  const threshold=Number(input.threshold);
  if(!Number.isFinite(threshold)||threshold<.5||threshold>30)throw new Error('Use um limite entre 0,5% e 30%.');
  return {enabled:input.enabled===true,threshold,direction:['both','up','down'].includes(input.direction)?input.direction:'both',scope:input.scope==='favorites'?'favorites':'all'};
}
export function observationDate(value) {
  const date=new Date(value);if(!Number.isFinite(date.getTime()))return null;
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
  return ['year','month','day'].map(type=>parts.find(p=>p.type===type).value).join('-');
}
export function evaluateAlerts(snapshot,rule,favorites,seen=[],now=Date.now()) {
  if(!rule.enabled||snapshot?.stale||snapshot?.mode!=='brapi')return [];
  const fetched=Date.parse(snapshot.fetchedAt);
  if(!Number.isFinite(fetched)||now-fetched>120000||fetched>now+60000)return [];
  const existing=new Set(seen),date=observationDate(now),alerts=[];
  for(const asset of snapshot.assets||[]) {
    if(asset.type!=='stock'||!Number.isFinite(asset.change)||!Number.isFinite(asset.price)||asset.price<=0)continue;
    if(rule.scope==='favorites'&&!favorites.includes(asset.id))continue;
    const direction=asset.change>=0?'up':'down';
    if(rule.direction!=='both'&&rule.direction!==direction||Math.abs(asset.change)<rule.threshold)continue;
    const sourceTime=asset.asOf?Date.parse(asset.asOf):null;
    if(asset.asOf&&(!Number.isFinite(sourceTime)||now-sourceTime>86400000||sourceTime>now+60000))continue;
    const key=[date,asset.ticker,direction,rule.threshold].join('|');
    if(existing.has(key))continue;existing.add(key);
    alerts.push({key,ticker:asset.ticker,assetId:asset.id,change:asset.change,price:asset.price,threshold:rule.threshold,asOf:asset.asOf||null,observedAt:new Date(now).toISOString(),source:asset.quoteSource||snapshot.source});
  }
  return alerts;
}
