import test from 'node:test';
import assert from 'node:assert/strict';
import {parseSelic,parseIpca,parseRegistry,parseCSV,createOfficialProvider} from '../server/official-sources.js';
const selic=[{data:'04/11/2026',valor:'13.75'}];
const ipca=[{NC:'1',D1C:'1',D2C:'63',MN:'%',D3C:'202609',D3N:'setembro 2026',V:'0.82'}];
const registry='CD_CVM;CNPJ_CIA;DENOM_SOCIAL;SIT;SETOR_ATIV;DT_REG;DT_INI_SIT\n9512;33.000.167/0001-01;PETROBRAS;ATIVO;Petróleo;1977-07-20;1977-07-20\n9512;99.999.999/0001-99;OUTRA;ATIVO;Outro;2000-01-01;2026-01-01';
test('BCB preserva unidade anual e separa referência de coleta',()=>{assert.deepEqual(parseSelic(selic),{label:'Meta Selic',value:13.75,unit:'% a.a.',referenceDate:'2026-11-04',series:'SGS 432'});assert.throws(()=>parseSelic([{data:'04/11/2026',valor:''}]))});
test('IPCA valida variável, território e unidade; ausência não vira zero',()=>{assert.equal(parseIpca(ipca).value,.82);assert.throws(()=>parseIpca([{...ipca[0],D2C:'2266',MN:'Número-índice'}]));assert.throws(()=>parseIpca([{...ipca[0],V:'...'}]));assert.equal(parseIpca([{...ipca[0],V:'-0.15'}]).value,-.15)});
test('CSV aceita campos entre aspas, ponto e vírgula e quebra de linha',()=>{assert.deepEqual(parseCSV('A;B\r\n"X;Y";"a\n""b"""'),[['A','B'],['X;Y','a\n"b"']])});
test('CVM cruza código e CNPJ e não expõe contatos ou responsáveis',()=>{const result=parseRegistry(registry);assert.equal(result.length,1);assert.equal(result[0].ticker,'PETR4');assert.equal(result[0].legalName,'PETROBRAS');assert.equal(result[0].email,undefined);assert.throws(()=>parseRegistry('x;y\n1;2'))});
test('fontes têm cache e falhas independentes, sem substituir valor preservado',async()=>{
 let time=0,fail=false,calls=0;
 const provider=createOfficialProvider({now:()=>time,ttl:1000,fetcher:async url=>{calls++;if(fail&&url.includes('bcb.gov'))throw new Error();return new Response(url.includes('bcb.gov')?JSON.stringify(selic):url.includes('ibge.gov')?JSON.stringify(ipca):registry);}});
 await Promise.all([provider(),provider()]);assert.equal(calls,3);time=2000;fail=true;
 const result=await provider();assert.equal(result.sources[0].status,'stale');assert.equal(result.sources[0].fetchedAt,'1970-01-01T00:00:00.000Z');assert.equal(result.sources[1].status,'available');await provider();assert.equal(calls,6);
});
test('indisponibilidade inicial é explícita e respeita pausa de repetição',async()=>{let calls=0;const provider=createOfficialProvider({fetcher:async()=>{calls++;throw new Error()}});const result=await provider();assert.ok(result.sources.every(s=>s.status==='unavailable'&&s.data===null));await provider();assert.equal(calls,3)});

test('rejeita datas oficiais inválidas em vez de normalizá-las silenciosamente',()=>{assert.throws(()=>parseSelic([{data:'31/02/2026',valor:'10'}]));assert.throws(()=>parseIpca([{...ipca[0],D3C:'202613'}]));});
