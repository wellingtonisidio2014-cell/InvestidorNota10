import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeMarketList} from '../server/market-list.js';
import {createProvider} from '../server/provider.js';
test('lista ampliada valida tipo e números, sem inventar horário ou fundamentos',()=>{
 const list=normalizeMarketList({stocks:[{stock:'BBDC4',type:'stock',name:'Bradesco',close:13,change:-2},{stock:'BBDC4',type:'stock',close:14,change:-3},{stock:'MXRF11',type:'fund',close:10},{stock:'FAKE3',type:'stock',close:'12'}]});
 assert.equal(list.length,1);assert.equal(list[0].price,14);assert.equal(list[0].asOf,null);assert.equal(list[0].pe,null);assert.equal(list[0].coverage,'summary');
});
test('cotação detalhada prevalece na junção; ações da lista continuam disponíveis',async()=>{
 const p=createProvider({fetcher:async url=>({ok:true,json:async()=>url.includes('/list?')?{stocks:[{stock:'PETR4',type:'stock',close:40,change:1},{stock:'BBDC4',type:'stock',close:14,change:6}]}:{results:[{symbol:new URL(url).pathname.split('/').at(-1),currency:'BRL',regularMarketPrice:42}]}})});
 const d=await p();assert.equal(d.assets.length,5);assert.equal(d.assets.find(a=>a.ticker==='PETR4').price,42);assert.equal(d.assets.find(a=>a.ticker==='BBDC4').asOf,null);assert.equal(d.marketListCount,2);assert.equal(d.partial,false);
});
test('lista disponível não esconde falha nas cotações detalhadas',async()=>{
 const d=await createProvider({fetcher:async url=>{if(!url.includes('/list?'))throw Error();return {ok:true,json:async()=>({stocks:[{stock:'BBDC4',type:'stock',close:14,change:6}]})}}})();
 assert.equal(d.assets.length,1);assert.equal(d.partial,true);assert.equal(d.failedTickers.length,4);
});
