import {loadAssets} from './pages-data.js';
import {initAlerts, processAlerts} from './alerts.js';
import {loadSources, renderIssuer} from './sources.js';
import {initMotion, reveal} from './motion.js';
import {initInteractions, toast} from './interactions.js';
import {renderHistory} from './chart.js';
import {assetsToCSV} from './export.js';
import { selectAssets, money, decimal, upcomingDividends } from './domain.js';
const $ = id => document.getElementById(id);
const state = { assets: [], favorites: [], selected: [], query: '', type: 'all', sort: 'ticker', favoritesOnly: false, chartId: '', chartCount: 0, page: 1, sector:'all', data: null };
try {
  const saved = JSON.parse(localStorage.getItem('in10-favorites') || '[]');
  if (Array.isArray(saved)) state.favorites = saved.filter(id => typeof id === 'string');
} catch { /* Storage is optional; favorites remain usable for the session. */ }
let loading = false;
function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
const percent = value => value == null ? '—' : `${value > 0 ? '+' : ''}${decimal(value)}%`;
const tone = value => value < 0 ? 'negative' : value > 0 ? 'positive' : '';
const timestamp = value => value ? new Date(value).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : 'Indisponível';
const dateLabel = date => new Date(`${date}T12:00:00Z`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'America/Sao_Paulo' });
function todayInBrazil() {
  const parts = new Intl.DateTimeFormat('en-CA', {timeZone: 'America/Sao_Paulo', year:'numeric', month:'2-digit', day:'2-digit'}).formatToParts(new Date());
  const value = type => parts.find(p => p.type === type).value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}
function toggleFavorite(id, notify = true) {
  const wasFavorite = state.favorites.includes(id);
  state.favorites = state.favorites.includes(id) ? state.favorites.filter(item => item !== id) : [...state.favorites, id];
  try { localStorage.setItem('in10-favorites', JSON.stringify(state.favorites)); } catch { $('notice').textContent = 'Favoritos mantidos apenas nesta sessão: armazenamento indisponível.'; }
  renderTable(); renderWatchlist(); renderSummary();
  if(state.data)processAlerts(state.data,state.favorites);
  if (notify) toast(wasFavorite ? 'Ativo removido dos favoritos.' : 'Ativo adicionado ao seu radar.', () => toggleFavorite(id, false));
}
function showDetails(asset) {
  $('detail-content').replaceChildren(
    element('p', asset.sector, 'muted'), element('h2', `${asset.ticker} · ${asset.name}`),
    element('h2', money(asset.price)), element('p', `Variação: ${percent(asset.change)} · P/L: ${decimal(asset.pe)}`),
    element('p', `Fonte: ${asset.quoteSource||state.data.source}. Horário da cotação: ${timestamp(asset.asOf)} (Brasília).`),
    element('p', `Última consulta bem-sucedida: ${timestamp(state.data.fetchedAt)}.`),
    element('p', 'Atualização da tela a cada 60 segundos. A cotação pode estar atrasada; o horário da fonte prevalece. DY e P/VP não são fornecidos nesta integração inicial.')
  );
  if(asset.coverage==='summary')$('detail-content').append(element('p','Cotação resumida: horário de origem, histórico, P/L e proventos não fornecidos nesta consulta. A data de coleta não substitui o horário da cotação.','coverage'));
  const issuer=element('section',undefined,'issuer-data'); issuer.dataset.issuer=asset.ticker; renderIssuer(issuer,asset.ticker); $('detail-content').append(issuer);
  $('details').showModal(); reveal($('details')); 
}
function renderTable() {
  const assets = selectAssets(state.assets, state);
  $('rows').replaceChildren();
  $('count').textContent = `${assets.length} ${assets.length === 1 ? 'ativo encontrado' : 'ativos encontrados'}${state.favoritesOnly ? ' · favoritos' : ''}`;
  $('favorites').setAttribute('aria-pressed', String(state.favoritesOnly));
  const pages=Math.max(1,Math.ceil(assets.length/15)); state.page=Math.min(state.page,pages);
  $('page-status').textContent=`Página ${state.page} de ${pages} · ${assets.length} ativos`;
  $('page-prev').disabled=state.page===1; $('page-next').disabled=state.page===pages;
  for (const asset of assets.slice((state.page-1)*15,state.page*15)) {
    const row = element('tr');
    const identity = element('td');
    const button = element('button', asset.ticker, 'ticker');
    button.onclick = () => showDetails(asset);
    identity.append(button, element('small', asset.name)); identity.querySelector('small').title=asset.name;
    if(asset.coverage==='summary')identity.append(element('small','Cotação resumida','coverage-chip'));
    row.append(identity, element('td', money(asset.price)), element('td', percent(asset.change), tone(asset.change)), element('td', decimal(asset.pe)));
    row.append(element('td', asset.asOf?timestamp(asset.asOf):'Não informado'));
    const star = element('button', state.favorites.includes(asset.id) ? '★' : '☆', 'star');
    star.setAttribute('aria-label', `Favoritar ${asset.ticker}`);
    star.setAttribute('aria-pressed', String(state.favorites.includes(asset.id)));
    star.onclick = () => toggleFavorite(asset.id);
    const favoriteCell = element('td'); favoriteCell.append(star); row.append(favoriteCell);
    const check = element('input'); check.type = 'checkbox'; check.checked = state.selected.includes(asset.id);
    check.setAttribute('aria-label', `Comparar ${asset.ticker}`);
    check.onchange = () => {
      if (check.checked && state.selected.length >= 5) { check.checked = false; $('count').textContent = 'Selecione no máximo 5 ativos.'; return; }
      state.selected = check.checked ? [...state.selected, asset.id] : state.selected.filter(id => id !== asset.id);
      renderComparison();
    };
    const comparisonCell = element('td'); comparisonCell.append(check); row.append(comparisonCell); $('rows').append(row);
  }
  if (!assets.length) {
    const cell = element('td', state.type === 'fii' && state.data?.restrictedTickers?.length
      ? 'FIIs exigem chave e cobertura do fornecedor. Nenhuma cotação fictícia é exibida.'
      : 'Nenhum ativo encontrado. Ajuste os filtros ou adicione favoritos.');
    cell.colSpan = 7; const row = element('tr'); row.append(cell); $('rows').append(row);
  }
}
function renderWatchlist() {
  const container = $('watchlist'); container.replaceChildren();
  const assets = state.assets.filter(a => state.favorites.includes(a.id));
  for (const asset of assets) {
    const row = element('div', undefined, 'watch-row');
    const link = element('button', asset.ticker); link.onclick = () => showDetails(asset);
    row.append(link, element('span', money(asset.price)), element('span', percent(asset.change), tone(asset.change))); container.append(row);
  }
  if (!assets.length) container.append(element('p', 'Marque a estrela ao lado de um ativo para acompanhar aqui.', 'empty'));
}
function renderComparison() {
  $('compare-tray').hidden = state.selected.length === 0;
  $('compare-total').textContent = `${state.selected.length} de 5 ativos selecionados`;
  const container = $('comparison'); container.replaceChildren();
  for (const id of state.selected) {
    const asset = state.assets.find(a => a.id === id); if (!asset) continue;
    const card = element('article', undefined, 'compare-item'); card.append(element('h3', asset.ticker));
    for (const [label, value] of [['Cotação', money(asset.price)], ['Variação', percent(asset.change)], ['P/L', decimal(asset.pe)], ['P/VP', decimal(asset.pb)]]) {
      const row = element('p'); row.append(element('span', label), element('strong', value)); card.append(row);
    }
    card.append(element('small', timestamp(asset.asOf), 'muted'));
    const remove = element('button', 'Remover', 'remove-compare');
    remove.addEventListener('click', () => { state.selected = state.selected.filter(value => value !== id); renderTable(); renderComparison(); });
    card.append(remove); container.append(card);
  }
  if (!container.children.length) container.append(element('p', 'Sua comparação começa ao selecionar um ativo na tabela.', 'empty'));
}
function renderDividends() {
  const container = $('dividend-list'); container.replaceChildren();
  const events = upcomingDividends(state.assets, todayInBrazil());
  for (const event of events.slice(0, 5)) {
    const row = element('div', undefined, 'dividend-row');
    const button = element('button', event.ticker);
    button.onclick = () => {
      $('detail-content').replaceChildren(element('h2', `${event.ticker} · ${event.type}`),
        element('p', `Valor por unidade: ${new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:8}).format(event.amount)}`),
        element('p', `${event.deadline ? 'Data-limite de pagamento' : 'Pagamento informado'}: ${event.paymentDate.split('-').reverse().join('/')}`),
        element('p', `Data-com: ${event.recordDate ? event.recordDate.split('-').reverse().join('/') : 'Não informada'}`),
        element('p', `Fonte: ${state.data.source}. Confirme as condições no comunicado do emissor; esta lista não calcula seu direito ao recebimento.`));
      $('details').showModal(); reveal($('details')); 
    };
    row.append(button, element('span', `${money(event.amount)} · ${event.type}`), element('span', dateLabel(event.paymentDate), 'date-chip')); container.append(row);
  }
  if (!events.length) container.append(element('p', 'Nenhum pagamento futuro informado para a cobertura disponível. Isso não significa ausência de proventos.', 'empty'));
}
function renderSummary() {
  $('summary-total').textContent = state.assets.length;
  $('summary-breadth').textContent = `${state.assets.filter(a=>a.change>0).length} ↑ / ${state.assets.filter(a=>a.change<0).length} ↓`;
  $('summary-favorites').textContent = state.favorites.length;
  const next = upcomingDividends(state.assets,todayInBrazil())[0];
  $('summary-dividend').textContent = next ? next.ticker : 'Sem evento';
  $('summary-dividend-note').textContent = next ? `${dateLabel(next.paymentDate)} · ${money(next.amount)} por unidade` : 'Nenhum futuro informado pela fonte';
}
function renderChart() {
  const select = $('chart-asset'); select.replaceChildren();
  const chartAssets=state.assets.filter(a=>a.history?.length>1);
  for (const asset of chartAssets) { const option = element('option', asset.ticker); option.value = asset.id; select.append(option); }
  if (!chartAssets.some(a => a.id === state.chartId)) state.chartId = chartAssets[0]?.id || '';
  select.value = state.chartId;
  const asset = state.assets.find(a=>a.id===state.chartId);
  $('chart-price').textContent = money(asset?.price);
  $('chart-change').textContent = percent(asset?.change);
  $('chart-change').className = `change ${tone(asset?.change)}`;
  $('chart-source').textContent = asset ? `${state.data?.source || "Fonte"} · cotação em ${timestamp(asset.asOf)} (Brasília)` : '';
  renderHistory($('chart'),asset,state.chartCount);
}
async function load() {
  if (loading) return;
  loading = true; $('refresh').disabled = true; $('refresh').textContent = 'Consultando…'; $('explorar').setAttribute('aria-busy','true');
  try {
    const data = await loadAssets();
    if (!Array.isArray(data.assets)) throw new Error('Resposta inválida');
    state.data = data; state.assets = data.assets;
    const sectors=[...new Set(data.assets.map(a=>a.sector))].sort();
    $('sector').replaceChildren();
    for(const value of ['all',...sectors]){const option=element('option',value==='all'?'Todos os setores':value);option.value=value;$('sector').append(option);}
    if(!sectors.includes(state.sector))state.sector='all';$('sector').value=state.sector;
    $('connection').textContent = data.stale ? 'Dados preservados · fonte indisponível' : data.mode === 'demo' ? 'Demonstração · dados fictícios' : 'Fonte conectada · brapi.dev';
    const restricted = `${data.marketListCount||0} ações na lista por volume; ${data.assets.filter(a=>a.coverage==='detailed').length} ativos com consulta detalhada. A lista resumida não informa horário da cotação. ${data.restrictedTickers?.length?'FIIs precisam de um servidor com chave; indisponíveis nesta versão estática. ':''}${data.marketListUnavailable?'Lista ampliada indisponível nesta consulta. ':''}`;
    $('notice').textContent = `${data.mode === 'demo' ? 'VALORES FICTÍCIOS. ' : ''}${restricted}${data.stale ? 'Falha na fonte: últimos dados preservados. ' : ''}${data.failedTickers?.length ? `Detalhes indisponíveis: ${data.failedTickers.join(', ')}. ` : ''}Consulta: ${timestamp(data.fetchedAt)}. Atraso conforme fornecedor; confira o horário de cada cotação.`;
    renderTable(); renderWatchlist(); renderComparison(); renderDividends(); renderChart(); renderSummary(); processAlerts(data,state.favorites);
  } catch {
    $('connection').textContent = 'Atualização indisponível';
    $('notice').textContent = `Não foi possível atualizar. ${state.assets.length ? 'Últimos dados preservados; podem estar desatualizados.' : 'Nenhum dado foi substituído por exemplos.'} Tente novamente em instantes.`;
    if (!state.assets.length) { $('dividend-list').replaceChildren(element('p','Fonte indisponível. Tente atualizar.','empty')); renderTable(); renderWatchlist(); renderComparison(); }
  } finally { loading = false; $('refresh').disabled = false; $('refresh').textContent = '↻ Atualizar'; $('explorar').setAttribute('aria-busy','false'); }
}
$('search').addEventListener('input', e => { state.query = e.target.value; state.page=1; renderTable(); });
$('type').onchange = e => { state.type = e.target.value; state.page=1; renderTable(); };
$('sort').onchange = e => { state.sort = e.target.value; state.page=1; renderTable(); };
$('chart-asset').onchange = e => { state.chartId = e.target.value; renderChart(); };
$('favorites').onclick = () => { state.favoritesOnly = !state.favoritesOnly; state.page=1; renderTable(); $('explorar').scrollIntoView(); };
function clearComparison() { state.selected = []; renderTable(); renderComparison(); }
$('clear').addEventListener('click',clearComparison);
$('tray-clear').addEventListener('click',clearComparison);
$('refresh').addEventListener('click',()=>{load();loadSources();});
$('close').onclick = () => $('details').close();
document.addEventListener('visibilitychange', () => { if (!document.hidden) load(); });
setInterval(() => { if (!document.hidden) load(); }, 60000);
$('chart-period').addEventListener('click', event => {
  const button = event.target.closest('[data-count]'); if (!button) return;
  state.chartCount = Number(button.dataset.count);
  for (const item of $('chart-period').querySelectorAll('button')) item.setAttribute('aria-pressed',String(item===button));
  renderChart();
});
$('export-csv').addEventListener('click', () => {
  const assets = selectAssets(state.assets,state);
  if (!assets.length) { toast('Não há ativos visíveis para exportar.'); return; }
  const url = URL.createObjectURL(new Blob(['\uFEFF'+assetsToCSV(assets,state.data)],{type:'text/csv;charset=utf-8'}));
  const link = element('a'); link.href=url; link.download=`radar-n10-${todayInBrazil()}.csv`; link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000); toast(`${assets.length} ${assets.length === 1 ? "ativo exportado" : "ativos exportados"} com origem e horário.`);
});
$('sector').addEventListener('change',event=>{state.sector=event.target.value;state.page=1;renderTable();});
$('page-prev').addEventListener('click',()=>{state.page=Math.max(1,state.page-1);renderTable();});
$('page-next').addEventListener('click',()=>{state.page++;renderTable();});
initAlerts(id=>{const asset=state.assets.find(a=>a.id===id);if(asset)showDetails(asset);else toast('Ativo fora da cobertura carregada neste momento.');});
initMotion(); initInteractions(); load(); loadSources();
setInterval(()=>{if(!document.hidden)loadSources();},3600000);
