import test from 'node:test';
import assert from 'node:assert/strict';
import {monotonePath} from '../public/js/curve.js';
test('curva passa pelos pontos sem ultrapassar extremos de cada trecho',()=>{
 const points=[{x:0,y:15},{x:10,y:10},{x:20,y:13},{x:30,y:3},{x:40,y:3},{x:50,y:4}];
 const segments=monotonePath(points).split(' C ').slice(1);
 for(let i=0;i<segments.length;i++){
  const [x1,y1,x2,y2,x3,y3]=segments[i].split(' ').map(Number);assert.equal(x3,points[i+1].x);assert.equal(y3,points[i+1].y);assert.ok(x1<=x2);
  for(let n=0;n<=100;n++){const t=n/100,y=(1-t)**3*points[i].y+3*(1-t)**2*t*y1+3*(1-t)*t*t*y2+t**3*y3;assert.ok(y>=Math.min(points[i].y,y3)-1e-9&&y<=Math.max(points[i].y,y3)+1e-9);}
 }
});
test('curva lida com série vazia, um ponto e dois pontos',()=>{assert.equal(monotonePath([]),'');assert.equal(monotonePath([{x:1,y:2}]),'M 1 2');assert.match(monotonePath([{x:0,y:0},{x:3,y:3}]),/C 1 1 2 2 3 3/)});
