import test from 'node:test';
import assert from 'node:assert/strict';
import {assetsToCSV} from '../public/js/export.js';
test('CSV preserva ausências, decimais, horários e origem',()=>{
 const result=assetsToCSV([{ticker:'ABCD3',name:'Nome "A"; B',price:12.34,change:-1.5,pe:null,asOf:'2026-11-04T00:00:00Z'}],{source:'brapi.dev',stale:true});
 assert.ok(result.includes('"12.34";"-1.5";""'));assert.ok(result.includes('"Nome ""A""; B"'));assert.ok(result.includes('"brapi.dev";"";"Sim"'));
});
test('CSV neutraliza fórmulas em campos textuais externos',()=>{
 const result=assetsToCSV([{ticker:'=1+1',name:' @SUM(A1)',price:0}]);
 assert.ok(result.includes('"\'=1+1"'));assert.ok(result.includes('"\' @SUM(A1)"'));assert.ok(result.includes('"0"'));
});
