import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultRule,validateRule,evaluateAlerts} from '../public/js/alert-rules.js';
const now=Date.parse('2026-11-04T15:00:00Z');
const asset={id:'BR-TEST3',ticker:'TEST3',type:'stock',price:10,change:5,asOf:'2026-11-04T14:59:00Z'};
const snapshot={mode:'brapi',stale:false,source:'brapi.dev',fetchedAt:new Date(now).toISOString(),assets:[asset]};
test('atingir o limite é inclusivo para alta e queda, com escopo de favoritos',()=>{
 assert.equal(evaluateAlerts(snapshot,defaultRule,[],[],now).length,1);
 assert.equal(evaluateAlerts({...snapshot,assets:[{...asset,change:-5}]},defaultRule,[],[],now).length,1);
 assert.equal(evaluateAlerts(snapshot,{...defaultRule,scope:'favorites'},[],[],now).length,0);
 assert.equal(evaluateAlerts(snapshot,{...defaultRule,direction:'down'},[],[],now).length,0);
 assert.equal(evaluateAlerts(snapshot,{...defaultRule,enabled:false},[],[],now).length,0);
});
test('deduplica por ativo/direção/limite/dia de verificação e não por preço',()=>{
 const first=evaluateAlerts(snapshot,defaultRule,[],[],now)[0];
 assert.equal(evaluateAlerts({...snapshot,assets:[{...asset,price:11,change:6}]},defaultRule,[],[first.key],now).length,0);
 assert.equal(evaluateAlerts({...snapshot,assets:[{...asset,change:-6}]},defaultRule,[],[first.key],now).length,1);
 const next=now+86400000;
 assert.equal(evaluateAlerts({...snapshot,fetchedAt:new Date(next).toISOString(),assets:[{...asset,asOf:new Date(next).toISOString()}]},defaultRule,[],[first.key],next).length,1);
});
test('ignora demonstração, cache antigo, preço ausente e horário vencido',()=>{
 for(const value of [{...snapshot,mode:'demo'},{...snapshot,stale:true},{...snapshot,fetchedAt:new Date(now-180000).toISOString()},{...snapshot,assets:[{...asset,price:null}]},{...snapshot,assets:[{...asset,asOf:'2026-11-01T12:00:00Z'}]},{...snapshot,assets:[{...asset,change:null}]}])assert.equal(evaluateAlerts(value,defaultRule,[],[],now).length,0);
});
test('lista sem horário preserva desconhecido e separa momento da verificação',()=>{
 const [event]=evaluateAlerts({...snapshot,assets:[{...asset,asOf:null,quoteSource:'lista'}]},defaultRule,[],[],now);
 assert.equal(event.asOf,null);assert.equal(event.observedAt,new Date(now).toISOString());assert.equal(event.source,'lista');
});
test('regra rejeita percentuais inválidos e limita opções',()=>{for(const threshold of ['',0,.1,31,NaN])assert.throws(()=>validateRule({threshold}));assert.equal(validateRule({threshold:'5',direction:'x',scope:'x',enabled:true}).threshold,5)});
