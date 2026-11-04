import test from 'node:test';
import assert from 'node:assert/strict';
import {createProvider} from '../server/provider.js';
const response=url=>({ok:true,json:async()=>({results:[{symbol:url.split('/').at(-1),currency:'BRL',regularMarketPrice:42,regularMarketTime:'2026-01-01T12:00:00Z'}]})});
test('demo é rotulada e não possui horário de mercado',async()=>{const p=createProvider();const d=await p();assert.equal(d.mode,'demo');assert.equal(d.assets.length,8);assert.ok(d.assets.every(a=>a.asOf===null))});
test('deduplica concorrência, cache e recuperação stale',async()=>{let n=0,time=0,fail=false;const p=createProvider({mode:'brapi',now:()=>time,fetcher:async url=>{n++;if(fail)throw Error();return response(url)}});await Promise.all([p(),p()]);assert.equal(n,4);await p();assert.equal(n,4);time=61000;fail=true;const d=await p();assert.equal(d.stale,true);assert.equal(d.fetchedAt,'1970-01-01T00:00:00.000Z');assert.equal(d.assets.length,4)});
test('falha inicial não inventa dados e parcial é explícito',async()=>{await assert.rejects(createProvider({mode:'brapi',fetcher:async()=>{throw Error()}})());const p=createProvider({mode:'brapi',fetcher:async url=>{if(url.endsWith('VALE3'))throw Error();return response(url)}});const d=await p();assert.equal(d.partial,true);assert.deepEqual(d.failedTickers,['VALE3']);assert.equal(d.assets.length,3)});
