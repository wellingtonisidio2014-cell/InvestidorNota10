import { selectAssets, money, decimal, upcomingDividends } from './domain.js';
const $ = id => document.getElementById(id);
const state = { assets: [], favorites: [], selected: [], query: '', type: 'all', sort: 'ticker', favoritesOnly: false, chartId: '', data: null };
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
function toggleFavorite(id) {
  state.favorites = state.favorites.includes(id) ? state.favorites.filter(item => item !== id) : [...state.favorites, id];
  try { localStorage.setItem('in10-favorites', JSON.stringify(state.favorites)); } catch { $('notice').textContent = 'Favoritos mantidos apenas nesta sessão: armazenamento indisponível.'; }
  renderTable(); renderWatchlist();
}
function showDetails(asset) {
  $('detail-content').replaceChildren(
    element('p', asset.sector, 'muted'), element('h2', `${asset.ticker} · ${asset.name}`),
    element('h2', money(asset.price)), element('p', `Variação: ${percent(asset.change)} · P/L: ${decimal(asset.pe)}`),
    element('p', `Fonte: ${state.data.source}. Horário da cotação: ${timestamp(asset.asOf)} (Brasília).`),
    element('p', `Última consulta bem-sucedida: ${timestamp(state.data.fetchedAt)}.`),
    element('p', 'Atualização da tela a cada 60 segundos. A cotação pode estar atrasada; o horário da fonte prevalece. DY e P/VP não são fornecidos nesta integração inicial.')
  );
  $('details').showModal();
}
function renderTable() {
  const assets = selectAssets(state.assets, state);
  $('rows').replaceChildren();
  $('count').textContent = `${assets.length} ${assets.length === 1 ? 'ativo encontrado' : 'ativos encontrados'}${state.favoritesOnly ? ' · favoritos' : ''}`;
  $('favorites').setAttribute('aria-pressed', String(state.favoritesOnly));
  for (const asset of assets) {
    const row = element('tr');
    const identity = element('td');
    const button = element('button', asset.ticker, 'ticker');
    button.onclick = () => showDetails(asset);
    identity.append(button, element('small', asset.name));
    row.append(identity, element('td', money(asset.price)), element('td', percent(asset.change), tone(asset.change)), element('td', decimal(asset.pe)));
    row.append(element('td', timestamp(asset.asOf)));
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
  const container = $('comparison'); container.replaceChildren();
  for (const id of state.selected) {
    const asset = state.assets.find(a => a.id === id); if (!asset) continue;
    const card = element('article', undefined, 'compare-item'); card.append(element('h3', asset.ticker));
    for (const [label, value] of [['Cotação', money(asset.price)], ['Variação', percent(asset.change)], ['P/L', decimal(asset.pe)], ['P/VP', decimal(asset.pb)]]) {
      const row = element('p'); row.append(element('span', label), element('strong', value)); card.append(row);
    }
    card.append(element('small', timestamp(asset.asOf), 'muted')); container.append(card);
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
        element('p', 'Fonte: brapi.dev. Confirme as condições no comunicado do emissor; esta lista não calcula seu direito ao recebimento.'));
      $('details').showModal();
    };
    row.append(button, element('span', `${money(event.amount)} · ${event.type}`), element('span', dateLabel(event.paymentDate), 'date-chip')); container.append(row);
  }
  if (!events.length) container.append(element('p', 'Nenhum pagamento futuro informado para a cobertura disponível. Isso não significa ausência de proventos.', 'empty'));
}
function svgNode(tag, attributes, text) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key,value] of Object.entries(attributes)) node.setAttribute(key, String(value));
  if (text !== undefined) node.textContent = text;
  return node;
}
function renderChart() {
  const select = $('chart-asset'); select.replaceChildren();
  for (const asset of state.assets) { const option = element('option', asset.ticker); option.value = asset.id; select.append(option); }
  if (!state.assets.some(a => a.id === state.chartId)) state.chartId = state.assets[0]?.id || '';
  select.value = state.chartId;
  const asset = state.assets.find(a => a.id === state.chartId);
  const container = $('chart'); container.replaceChildren();
  $('chart-price').textContent = money(asset?.price);
  $('chart-change').textContent = percent(asset?.change); $('chart-change').className = `change ${tone(asset?.change)}`;
  $('chart-source').textContent = asset ? `brapi.dev · cotação em ${timestamp(asset.asOf)} (Brasília)` : '';
  const history = asset?.history || [];
  if (history.length < 2) { container.append(element('p', 'Histórico não disponível para este ativo.', 'empty')); return; }
  const low = Math.min(...history.map(p => p.close)), high = Math.max(...history.map(p => p.close));
  const spread = high - low || 1, start = history[0].date, end = history.at(-1).date;
  const x = date => 52 + (date-start)/(end-start || 1)*328;
  const y = price => 130-(price-low)/spread*100;
  const svg = svgNode('svg', { viewBox: '0 0 400 165', role:'img', 'aria-label':`Histórico de ${asset.ticker}: primeiro fechamento ${money(history[0].close)}, último ${money(history.at(-1).close)}.` });
  for (let i=0; i<3; i++) {
    const value=low+spread*i/2, yy=y(value);
    svg.append(svgNode('line',{x1:52,x2:380,y1:yy,y2:yy,stroke:'#343044','stroke-dasharray':'3 4'}),svgNode('text',{x:0,y:yy+4},decimal(value)));
  }
  svg.append(svgNode('polyline',{points:history.map(p=>`${x(p.date)},${y(p.close)}`).join(' '),class:'line'}));
  svg.append(svgNode('text',{x:52,y:157},new Date(start).toLocaleDateString('pt-BR',{day:'2-digit',month:'short',timeZone:'America/Sao_Paulo'})),svgNode('text',{x:380,y:157,'text-anchor':'end'},new Date(end).toLocaleDateString('pt-BR',{day:'2-digit',month:'short',timeZone:'America/Sao_Paulo'})));
  container.append(svg);
}
async function load() {
  if (loading) return;
  loading = true; $('refresh').disabled = true;
  try {
    const response = await fetch('/api/assets', {signal:AbortSignal.timeout(90000)});
    if (!response.ok) throw new Error('Fonte indisponível');
    const data = await response.json();
    if (!Array.isArray(data.assets)) throw new Error('Resposta inválida');
    state.data = data; state.assets = data.assets;
    $('connection').textContent = data.stale ? 'Dados preservados · fonte indisponível' : data.mode === 'demo' ? 'Demonstração · dados fictícios' : 'Fonte conectada · brapi.dev';
    const restricted = data.restrictedTickers?.length ? 'Cobertura sem chave: PETR4, VALE3, ITUB4 e MGLU3. FIIs exigem configuração. ' : '';
    $('notice').textContent = `${data.mode === 'demo' ? 'VALORES FICTÍCIOS. ' : ''}${restricted}${data.stale ? 'Falha na fonte: últimos dados preservados. ' : ''}${data.partial ? `Consulta parcial: ${data.failedTickers.join(', ')} indisponíveis. ` : ''}Consulta: ${timestamp(data.fetchedAt)}. Atraso conforme fornecedor; confira o horário de cada cotação.`;
    renderTable(); renderWatchlist(); renderComparison(); renderDividends(); renderChart();
  } catch {
    $('connection').textContent = 'Atualização indisponível';
    $('notice').textContent = `Não foi possível atualizar. ${state.assets.length ? 'Últimos dados preservados; podem estar desatualizados.' : 'Nenhum dado foi substituído por exemplos.'} Tente novamente em instantes.`;
    if (!state.assets.length) { $('dividend-list').replaceChildren(element('p','Fonte indisponível. Tente atualizar.','empty')); renderTable(); renderWatchlist(); renderComparison(); }
  } finally { loading = false; $('refresh').disabled = false; }
}
$('search').oninput = e => { state.query = e.target.value; renderTable(); };
$('type').onchange = e => { state.type = e.target.value; renderTable(); };
$('sort').onchange = e => { state.sort = e.target.value; renderTable(); };
$('chart-asset').onchange = e => { state.chartId = e.target.value; renderChart(); };
$('favorites').onclick = () => { state.favoritesOnly = !state.favoritesOnly; renderTable(); $('explorar').scrollIntoView(); };
$('clear').onclick = () => { state.selected = []; renderTable(); renderComparison(); };
$('refresh').onclick = load;
$('close').onclick = () => $('details').close();
document.addEventListener('visibilitychange', () => { if (!document.hidden) load(); });
setInterval(() => { if (!document.hidden) load(); }, 60000);
load();
