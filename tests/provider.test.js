import test from 'node:test';
import assert from 'node:assert/strict';
import {createProvider} from '../server/provider.js';
const response=url=>({ok:true,json:async()=>({results:[{symbol:new URL(url).pathname.split('/').at(-1),currency:'BRL',regularMarketPrice:42,regularMarketTime:'2026-01-01T12:00:00Z'}]})});
test('demo é rotulada e não possui horário de mercado',async()=>{const p=createProvider({mode:"demo"});const d=await p();assert.equal(d.mode,'demo');assert.equal(d.assets.length,8);assert.ok(d.assets.every(a=>a.asOf===null))});
test('deduplica concorrência, cache e recuperação stale',async()=>{let n=0,time=0,fail=false;const p=createProvider({mode:'brapi',now:()=>time,fetcher:async url=>{n++;if(fail)throw Error();return response(url)}});await Promise.all([p(),p()]);assert.equal(n,4);await p();assert.equal(n,4);time=61000;fail=true;const d=await p();assert.equal(d.stale,true);assert.equal(d.fetchedAt,'1970-01-01T00:00:00.000Z');assert.equal(d.assets.length,4)});
test('falha inicial não inventa dados e parcial é explícito',async()=>{await assert.rejects(createProvider({mode:'brapi',fetcher:async()=>{throw Error()}})());const p=createProvider({mode:'brapi',fetcher:async url=>{if(new URL(url).pathname.endsWith('VALE3'))throw Error();return response(url)}});const d=await p();assert.equal(d.partial,true);assert.deepEqual(d.failedTickers,['VALE3']);assert.equal(d.assets.length,3)});

test('stale permanece explícito durante a pausa após falha',async()=>{let time=0,fail=false;const p=createProvider({now:()=>time,fetcher:async url=>{if(fail)throw Error();return response(url)}});await p();time=61000;fail=true;assert.equal((await p()).stale,true);time=62000;assert.equal((await p()).stale,true)});

test('consultas externas são sequenciais para respeitar o provedor gratuito',async()=>{let active=0,max=0;const p=createProvider({fetcher:async url=>{active++;max=Math.max(max,active);await new Promise(resolve=>setTimeout(resolve,1));active--;return response(url)}});assert.equal((await p()).assets.length,4);assert.equal(max,1)});
