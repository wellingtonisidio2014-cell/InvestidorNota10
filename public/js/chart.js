import {money, decimal} from './domain.js';
import {drawLine} from './motion.js';
import {monotonePath} from './curve.js';
const selection = new Map();
let chartId=0;
const node=(tag,attributes={},text)=>{
 const result=document.createElementNS('http://www.w3.org/2000/svg',tag);
 for(const [key,value] of Object.entries(attributes))result.setAttribute(key,value);
 if(text!==undefined)result.textContent=text;return result;
};
export function renderHistory(container,asset,count=0,{expanded=false,intraday=false,caption='Fechamento do pregão'}={}) {
 container.replaceChildren();
 const history=count?(asset?.history||[]).slice(-count):asset?.history||[];
 if(history.length<2){const message=document.createElement('p');message.className='empty';message.textContent='O histórico aparecerá quando a fonte retornar dados para este ativo.';container.append(message);return;}
 const narrow=container.clientWidth<600;
 const width=expanded&&!narrow?1000:Math.max(280,Math.min(580,container.clientWidth)),height=expanded?(narrow?340:400):196,left=expanded&&!narrow?78:48,right=width-22,top=expanded?35:28,base=height-42;
 const low=Math.min(...history.map(p=>p.close)),high=Math.max(...history.map(p=>p.close));
 const padding=(high-low)*.1||Math.max(low*.01,.1),bottom=low-padding,span=high-low+padding*2;
 const x=index=>left+index/(history.length-1)*(right-left),y=value=>base-5-(value-bottom)/span*(base-top-12);
 const date=value=>new Date(value).toLocaleString('pt-BR',{day:'2-digit',month:'short',year:'numeric',...(intraday?{hour:'2-digit',minute:'2-digit'}:{}),timeZone:intraday?'America/Sao_Paulo':'UTC'});
 const shortDate=value=>new Date(value).toLocaleString('pt-BR',intraday?{hour:'2-digit',minute:'2-digit',timeZone:'America/Sao_Paulo'}:{day:'2-digit',month:'short',timeZone:'UTC'});
 const tooltip=document.createElement('div');tooltip.className='chart-tooltip';tooltip.setAttribute('aria-live','polite');tooltip.setAttribute('aria-atomic','true');
 const day=document.createElement('span'),value=document.createElement('strong'),captionNode=document.createElement('small');captionNode.textContent=caption;tooltip.append(day,value,captionNode);
 const svg=node('svg',{viewBox:`0 0 ${width} ${height}`,tabindex:0,role:'group','aria-label':`Histórico de ${asset.ticker}. Use as setas esquerda e direita para escolher o ponto; Home e End vão ao primeiro e último ponto.`});
 const fillId=`chart-fill-${++chartId}`,defs=node('defs'),gradient=node('linearGradient',{id:fillId,x1:0,y1:0,x2:0,y2:1});
 gradient.append(node('stop',{offset:'0%','stop-color':'#a779ff','stop-opacity':'.32'}),node('stop',{offset:'100%','stop-color':'#a779ff','stop-opacity':'0'}));defs.append(gradient);svg.append(defs);
 for(let i=0;i<5;i++){const number=bottom+span*i/4,yy=y(number);svg.append(node('line',{x1:left,x2:right,y1:yy,y2:yy,stroke:'#343044','stroke-dasharray':'3 5'}),node('text',{x:0,y:yy+4},decimal(number)));}
 const path=monotonePath(history.map((p,i)=>({x:x(i),y:y(p.close)})));
 svg.append(node('path',{d:`${path} L ${right} ${base} L ${left} ${base} Z`,fill:`url(#${fillId})`}));
 const band=node('rect',{y:top,width:24,height:base-top,fill:'#a574ff',opacity:'.09'});svg.append(band);
 const line=node('path',{d:path,class:'line'});svg.append(line);
 const ticks=expanded?4:1;
 for(let i=0;i<=ticks;i++){const index=Math.round(i/ticks*(history.length-1));svg.append(node('text',{x:x(index),y:height-4,'text-anchor':i===0?'start':i===ticks?'end':'middle'},shortDate(history[index].date)));}
 const guide=node('line',{y1:top,y2:base+6,stroke:'#d9bcff','stroke-width':1.3,'stroke-dasharray':'4 4'}),halo=node('circle',{r:12,fill:'#9b73ec',opacity:'.24'}),dot=node('circle',{r:5,fill:'#a0f7d7',stroke:'#fff','stroke-width':2});
 const tag=node('g'),tagBox=node('rect',{y:base+6,width:100,height:23,rx:5,fill:'#513078',stroke:'#ad85e0'}),tagText=node('text',{y:base+22,'text-anchor':'middle',class:'selected-day'});tag.append(tagBox,tagText);svg.append(guide,halo,dot,tag);
 const key=`${container.id}:${asset.id}:${intraday}`;let index=history.findIndex(p=>p.date===selection.get(key));if(index<0)index=history.length-1;
 function inspect(next){index=Math.max(0,Math.min(history.length-1,next));const point=history[index],xx=x(index),yy=y(point.close);selection.set(key,point.date);day.textContent=date(point.date);value.textContent=money(point.close);guide.setAttribute('x1',xx);guide.setAttribute('x2',xx);band.setAttribute('x',xx-12);for(const marker of [halo,dot]){marker.setAttribute('cx',xx);marker.setAttribute('cy',yy);}const labelX=Math.max(left,Math.min(right-100,xx-50));tagBox.setAttribute('x',labelX);tagText.setAttribute('x',labelX+50);tagText.textContent=shortDate(point.date);}
 function inspectPointer(event){const point=svg.createSVGPoint();point.x=event.clientX;point.y=event.clientY;const matrix=svg.getScreenCTM();if(matrix)inspect(Math.round((point.matrixTransform(matrix.inverse()).x-left)/(right-left)*(history.length-1)));}
 svg.addEventListener('pointermove',inspectPointer);svg.addEventListener('pointerdown',event=>{inspectPointer(event);svg.focus({preventScroll:true});});
 svg.addEventListener('keydown',event=>{const next={ArrowLeft:index-1,ArrowRight:index+1,Home:0,End:history.length-1}[event.key];if(next!==undefined){event.preventDefault();inspect(next);}});
 const hint=document.createElement('p');hint.className='chart-hint';hint.textContent=`${history.length} pontos · passe o cursor, toque ou use ← →. Curva suavizada; pontos preservados.`;
 container.append(tooltip,svg,hint);inspect(index);drawLine(line);
}
