import {money, decimal} from './domain.js';
import {drawLine} from './motion.js';
import {monotonePath} from './curve.js';
const selection = new Map();
const node = (tag, attributes = {}, text) => {
  const result = document.createElementNS('http://www.w3.org/2000/svg',tag);
  for (const [key,value] of Object.entries(attributes)) result.setAttribute(key,value);
  if (text !== undefined) result.textContent=text;
  return result;
};
export function renderHistory(container,asset,count=0) {
  container.replaceChildren();
  const history=count ? (asset?.history || []).slice(-count) : asset?.history || [];
  if (history.length<2) {
    const message=document.createElement('p'); message.className='empty';
    message.textContent='O histórico aparecerá quando a fonte retornar dados para este ativo.'; container.append(message); return;
  }
  const low=Math.min(...history.map(p=>p.close)),high=Math.max(...history.map(p=>p.close));
  const padding=(high-low)*.1 || Math.max(low*.01,.1),bottom=low-padding,span=high-low+padding*2;
  const x=index=>58+index/(history.length-1)*500;
  const y=value=>185-(value-bottom)/span*145;
  const date=value=>new Date(value).toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'});
  const shortDate=value=>new Date(value).toLocaleDateString('pt-BR',{day:'2-digit',month:'short',timeZone:'UTC'});
  const tooltip=document.createElement('div'); tooltip.className='chart-tooltip'; tooltip.setAttribute('aria-live','polite'); tooltip.setAttribute('aria-atomic','true');
  const day=document.createElement('span'),value=document.createElement('strong'),caption=document.createElement('small'); caption.textContent='Fechamento do pregão'; tooltip.append(day,value,caption);
  const svg=node('svg',{viewBox:'0 0 580 232',tabindex:0,role:'group','aria-label':`Histórico de ${asset.ticker}. Use as setas esquerda e direita para escolher o pregão; Home e End vão ao primeiro e último ponto.`});
  const defs=node('defs'),gradient=node('linearGradient',{id:'chart-fill',x1:0,y1:0,x2:0,y2:1});
  gradient.append(node('stop',{offset:'0%','stop-color':'#a779ff','stop-opacity':'.32'}),node('stop',{offset:'100%','stop-color':'#a779ff','stop-opacity':'0'}));defs.append(gradient);svg.append(defs);
  for (let i=0;i<4;i++) {
    const number=low+(high-low)*i/3,yy=y(number);
    svg.append(node('line',{x1:58,x2:558,y1:yy,y2:yy,stroke:'#343044','stroke-dasharray':'3 5'}),node('text',{x:0,y:yy+4},decimal(number)));
  }
  const path=monotonePath(history.map((p,i)=>({x:x(i),y:y(p.close)})));
  svg.append(node('path',{d:`${path} L 558 190 L 58 190 Z`,fill:'url(#chart-fill)'}));
  const band=node('rect',{y:28,width:24,height:162,fill:'#a574ff',opacity:'.09'});svg.append(band);
  const line=node('path',{d:path,class:'line'});svg.append(line);
  svg.append(node('text',{x:58,y:228},shortDate(history[0].date)),node('text',{x:558,y:228,'text-anchor':'end'},shortDate(history.at(-1).date)));
  const guide=node('line',{y1:28,y2:196,stroke:'#d9bcff','stroke-width':1.3,'stroke-dasharray':'4 4'});
  const halo=node('circle',{r:12,fill:'#9b73ec',opacity:'.24'});
  const dot=node('circle',{r:5,fill:'#a0f7d7',stroke:'#fff','stroke-width':2});
  const tag=node('g'),tagBox=node('rect',{y:196,width:86,height:21,rx:5,fill:'#513078',stroke:'#ad85e0'}),tagText=node('text',{y:210,'text-anchor':'middle',class:'selected-day'});
  tag.append(tagBox,tagText);svg.append(guide,halo,dot,tag);
  let index=history.findIndex(p=>p.date===selection.get(asset.id)); if(index<0)index=history.length-1;
  function inspect(next) {
    index=Math.max(0,Math.min(history.length-1,next)); const point=history[index],xx=x(index),yy=y(point.close);
    selection.set(asset.id,point.date);
    day.textContent=date(point.date);value.textContent=money(point.close);
    guide.setAttribute('x1',xx);guide.setAttribute('x2',xx);band.setAttribute('x',xx-12);
    for (const marker of [halo,dot]) {marker.setAttribute('cx',xx);marker.setAttribute('cy',yy);}
    const labelX=Math.max(58,Math.min(472,xx-43));tagBox.setAttribute('x',labelX);tagText.setAttribute('x',labelX+43);tagText.textContent=shortDate(point.date);
  }
  function inspectPointer(event) {
    const point=svg.createSVGPoint();point.x=event.clientX;point.y=event.clientY;
    const matrix=svg.getScreenCTM();if(matrix)inspect(Math.round((point.matrixTransform(matrix.inverse()).x-58)/500*(history.length-1)));
  }
  svg.addEventListener('pointermove',inspectPointer);
  svg.addEventListener('pointerdown',event=>{inspectPointer(event);svg.focus({preventScroll:true});});
  svg.addEventListener('keydown',event=>{
    const next={ArrowLeft:index-1,ArrowRight:index+1,Home:0,End:history.length-1}[event.key];
    if(next!==undefined){event.preventDefault();inspect(next);}
  });
  const hint=document.createElement('p');hint.className='chart-hint';hint.textContent=`${history.length} pregões · passe o cursor, toque ou use ← →. Curva suavizada; pontos preservados.`;
  container.append(tooltip,svg,hint);inspect(index);drawLine(line);
}
