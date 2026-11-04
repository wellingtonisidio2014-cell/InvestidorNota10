// Protect spreadsheet consumers from formula injection in provider text.
function cell(value) {
  let text = value == null ? '' : String(value);
  if (typeof value === 'string' && /^[\s]*[=+\-@]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"','""') + '"';
}
export function assetsToCSV(assets, metadata = {}) {
  const rows = [['Ativo','Nome','Classe','Preço (BRL)','Variação (%)','P/L','Horário da fonte (UTC)','Fonte','Consulta (UTC)','Dados preservados']];
  for (const asset of assets) rows.push([asset.ticker,asset.name,asset.type,asset.price,asset.change,asset.pe,asset.asOf,metadata.source,metadata.fetchedAt,metadata.stale ? 'Sim' : 'Não']);
  return rows.map(row=>row.map(cell).join(';')).join('\r\n');
}
