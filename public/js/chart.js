import {money, decimal} from './domain.js';
import {drawLine} from './motion.js';
const node = (tag, attributes = {}, text) => {
  const result = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key,value] of Object.entries(attributes)) result.setAttribute(key, value);
  if (text !== undefined) result.textContent = text;
  return result;
};
export function renderHistory(container, asset, count = 0) {
  container.replaceChildren();
  const history = count ? (asset?.history || []).slice(-count) : asset?.history || [];
  if (history.length < 2) {
    const message = document.createElement('p'); message.className = 'empty';
    message.textContent = 'O histórico aparecerá quando a fonte retornar dados para este ativo.'; container.append(message); return;
  }
  const low = Math.min(...history.map(p => p.close)), high = Math.max(...history.map(p => p.close));
  const spread = high - low || 1;
  const x = index => 58 + index / (history.length - 1) * 500;
  const y = value => 180 - (value - low) / spread * 145;
  const date = value => new Date(value).toLocaleDateString('pt-BR', {day:'2-digit',month:'short',timeZone:'UTC'});
  const svg = node('svg', {viewBox:'0 0 580 220','aria-hidden':'true'});
  const defs = node('defs'), gradient = node('linearGradient',{id:'chart-fill',x1:0,y1:0,x2:0,y2:1});
  gradient.append(node('stop',{offset:'0%','stop-color':'#a779ff','stop-opacity':'.3'}),node('stop',{offset:'100%','stop-color':'#a779ff','stop-opacity':'0'})); defs.append(gradient); svg.append(defs);
  for (let i = 0; i < 4; i++) {
    const value = low + spread * i / 3, yy = y(value);
    svg.append(node('line',{x1:58,x2:558,y1:yy,y2:yy,stroke:'#343044','stroke-dasharray':'3 5'}),node('text',{x:0,y:yy+4},decimal(value)));
  }
  const points = history.map((p,i) => `${x(i)},${y(p.close)}`).join(' ');
  svg.append(node('polygon',{points:`58,190 ${points} 558,190`,fill:'url(#chart-fill)'}));
  const line = node('polyline',{points,class:'line'}); svg.append(line);
  svg.append(node('text',{x:58,y:212},date(history[0].date)),node('text',{x:558,y:212,'text-anchor':'end'},date(history.at(-1).date)));
  const guide = node('line',{x1:558,x2:558,y1:25,y2:190,stroke:'#9283ac','stroke-dasharray':'3 4'});
  const dot = node('circle',{cx:558,cy:y(history.at(-1).close),r:5,fill:'#8cf2ce',stroke:'#111122','stroke-width':3}); svg.append(guide,dot);
  const readout = document.createElement('p'); readout.className = 'chart-readout'; readout.setAttribute('aria-live','polite');
  const slider = document.createElement('input'); slider.type = 'range'; slider.min = 0; slider.max = history.length - 1; slider.value = history.length - 1; slider.step = 1;
  slider.className = 'chart-scrubber'; slider.setAttribute('aria-label',`Explorar fechamentos de ${asset.ticker}`);
  function inspect(index) {
    const i = Math.max(0,Math.min(history.length-1,index)), point = history[i];
    slider.value = i; slider.setAttribute('aria-valuetext',`${date(point.date)}: ${money(point.close)}`);
    readout.textContent = `${date(point.date)} · ${money(point.close)} · ${history.length} pregões disponíveis`;
    guide.setAttribute('x1',x(i)); guide.setAttribute('x2',x(i)); dot.setAttribute('cx',x(i)); dot.setAttribute('cy',y(point.close));
  }
  svg.addEventListener('pointermove', event => {
    const point = svg.createSVGPoint(); point.x=event.clientX; point.y=event.clientY;
    const matrix = svg.getScreenCTM(); if (matrix) inspect(Math.round((point.matrixTransform(matrix.inverse()).x-58)/500*(history.length-1)));
  });
  slider.addEventListener('input', () => inspect(Number(slider.value)));
  container.append(svg,readout,slider); inspect(history.length-1); drawLine(line);
}
