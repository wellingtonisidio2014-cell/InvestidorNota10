import test from 'node:test';
import assert from 'node:assert/strict';
import {selectAssets,normalizeQuote,numberOrNull} from '../public/js/domain.js';
const assets=[{id:'a',ticker:'ABCD3',name:'Empresa Alfa',type:'stock',dy:null},{id:'b',ticker:'ZZZZ11',name:'Fundo Beta',type:'fii',dy:9}];
test('combina busca, classe e favoritos sem alterar entrada',()=>{assert.deepEqual(selectAssets(assets,{query:' beta ',type:'fii',favoritesOnly:true,favorites:['b']}).map(a=>a.id),['b']);assert.equal(assets[0].id,'a');assert.equal(selectAssets(assets,{query:'inexistente'}).length,0)});
test('ausentes ficam no final na ordenação numérica',()=>assert.equal(selectAssets(assets,{sort:'dy'})[1].id,'a'));
test('não transforma ausência ou texto em zero',()=>{for(const v of [null,undefined,'',NaN,Infinity,'3.5'])assert.equal(numberOrNull(v),null);assert.equal(numberOrNull(0),0)});
test('rejeita instrumento/moeda incorretos e preserva ausência',()=>{assert.throws(()=>normalizeQuote({symbol:'OUTRO',currency:'BRL'},assets[0]));assert.throws(()=>normalizeQuote({symbol:'ABCD3',currency:'USD'},assets[0]));const a=normalizeQuote({symbol:'ABCD3',currency:'BRL',regularMarketPrice:10,regularMarketTime:'inválido'},assets[0]);assert.equal(a.price,10);assert.equal(a.asOf,null);assert.equal(a.dy,null)});
