// ── Estado del importador ─────────────────────────────────────────
let importMode = 'excel', importParsedRows = [], importHeaders = [];
let importColMap = { group:'-', name:'-', tag:'-', length:'-', width:'-', qty:'-' };
let importUnit = 'cm';
const IMP_FIELDS = [
  {key:'group',  label:'Grupo'},
  {key:'name',   label:'Nombre'},
  {key:'tag',    label:'Etiqueta'},
  {key:'length', label:'Largo'},
  {key:'width',  label:'Ancho'},
  {key:'qty',    label:'Cantidad'},
];

// ── Abrir modal ───────────────────────────────────────────────────
function openImport() {
  importParsedRows = []; importHeaders = [];
  importColMap = { group:'-', name:'-', tag:'-', length:'-', width:'-', qty:'-' };
  importUnit = 'cm';
  document.getElementById('importRaw').value = '';
  document.getElementById('colPreviewArea').style.display = 'none';
  document.querySelectorAll('.unit-badge').forEach(b => b.classList.remove('active'));
  document.getElementById('ubtn-cm').classList.add('active');
  updateUnitConvMsg();
  showStep(1);
  openModal('import');
}

function setImportMode(mode) {
  importMode = mode;
  document.getElementById('tabExcelBtn').classList.toggle('active', mode === 'excel');
  document.getElementById('tabCsvBtn').classList.toggle('active',  mode === 'csv');
  document.getElementById('imp-hint-excel').style.display = mode === 'excel' ? '' : 'none';
  document.getElementById('imp-hint-csv').style.display   = mode === 'csv'   ? '' : 'none';
  document.getElementById('importRaw').value = '';
  document.getElementById('colPreviewArea').style.display = 'none';
}

// ── Pasos del wizard ──────────────────────────────────────────────
function showStep(n) {
  [1,2,3,4].forEach(i => {
    document.getElementById('imp-step' + i).style.display = i === n ? '' : 'none';
    const ind = document.getElementById('step' + i + '-ind');
    ind.className = 'step' + (i === n ? ' active' : i < n ? ' done' : '');
  });
}

function goStep(n) {
  if (n === 2) { if (!parseRawData()) return; buildMapperTable(); }
  if (n === 3) { if (!validateMapping()) return; updateUnitConvMsg(); }
  if (n === 4) { buildImportSummary(); }
  showStep(n);
}

// ── Parseo ────────────────────────────────────────────────────────
function detectColumns() {
  const raw = document.getElementById('importRaw').value.trim();
  if (!raw) { document.getElementById('colPreviewArea').style.display = 'none'; return; }
  const rows = splitRows(raw);
  if (!rows.length) return;
  document.getElementById('colPreviewArea').style.display = '';
  buildSimplePreview(rows.slice(0, 5));
  document.getElementById('colCountMsg').textContent =
    `${rows.length} fila${rows.length !== 1 ? 's' : ''} · ${rows[0].length} columna${rows[0].length !== 1 ? 's' : ''}`;
}

function splitRows(raw) {
  const sep = importMode === 'excel' ? '\t' : ',';
  return raw.split('\n').map(l => l.trim()).filter(l => l.length).map(l => l.split(sep).map(c => c.trim()));
}

function buildSimplePreview(rows) {
  const maxCols = Math.max(...rows.map(r => r.length));
  let html = '<thead><tr><th>#</th>';
  for (let c = 0; c < maxCols; c++) html += `<th>Col ${c+1}</th>`;
  html += '</tr></thead><tbody>';
  rows.forEach((row, ri) => {
    html += `<tr><td style="color:#aaa;">${ri+1}</td>`;
    for (let c = 0; c < maxCols; c++) html += `<td title="${row[c]||''}">${row[c]||''}</td>`;
    html += '</tr>';
  });
  document.getElementById('colPreviewTable').innerHTML = html + '</tbody>';
}

function parseRawData() {
  const raw = document.getElementById('importRaw').value.trim();
  if (!raw) { notify('Sin datos'); return false; }
  const rows = splitRows(raw);
  if (!rows.length) { notify('Sin filas'); return false; }
  importParsedRows = rows; autoDetect(rows); return true;
}

function autoDetect(rows) {
  importColMap = { group:'-', name:'-', tag:'-', length:'-', width:'-', qty:'-' };
  const firstAllText = rows[0].every(c => isNaN(parseFloat(c)));
  importHeaders = firstAllText ? rows[0] : [];

  // 1. Keyword matching from headers
  const kw = {
    group:  /grupo|group|colecci|categor|familia/i,
    name:   /nombre|name|pieza|item|descripci|desc/i,
    tag:    /etiq|tag|tipo|zona|area|ambien/i,
    length: /largo|long|length|altura|alto|height/i,
    width:  /ancho|width|wide/i,
    qty:    /cant|qty|cantidad|num|unit/i,
  };
  if (importHeaders.length)
    importHeaders.forEach((h, i) => {
      Object.keys(kw).forEach(k => { if (kw[k].test(h) && importColMap[k] === '-') importColMap[k] = String(i); });
    });

  // 2. Positional fallback: Grupo | Nombre | Etiqueta | Largo | Ancho | Cantidad
  const positional = ['group', 'name', 'tag', 'length', 'width', 'qty'];
  const dataRow = importHeaders.length ? (rows[1] || rows[0]) : rows[0];
  positional.forEach((field, colIdx) => {
    if (importColMap[field] === '-' && colIdx < dataRow.length) {
      const alreadyUsed = Object.values(importColMap).includes(String(colIdx));
      if (!alreadyUsed) importColMap[field] = String(colIdx);
    }
  });
}

// ── Tabla de mapeo ────────────────────────────────────────────────
function buildMapperTable() {
  const maxCols    = Math.max(...importParsedRows.map(r => r.length));
  const previewRows = (importHeaders.length ? importParsedRows.slice(1) : importParsedRows).slice(0, 5);
  const startRow   = importHeaders.length ? 1 : 0;

  function fieldOpts(colIdx) {
    const assigned = Object.entries(importColMap).find(([k, v]) => v === String(colIdx));
    const cur = assigned ? assigned[0] : 'none';
    let o = `<option value="none"${cur === 'none' ? ' selected' : ''}>— sin asignar —</option>`;
    IMP_FIELDS.forEach(f => { o += `<option value="${f.key}"${cur === f.key ? ' selected' : ''}>${f.label}</option>`; });
    return o;
  }

  let html = '<thead><tr><th class="map-th idx-th">#</th>';
  for (let c = 0; c < maxCols; c++) {
    const hdr    = importHeaders[c] || `Col ${c+1}`;
    const mapped = !!Object.entries(importColMap).find(([k, v]) => v === String(c));
    html += `<th class="map-th" id="mth-${c}"><div class="th-inner">
      <div class="th-col-label">columna ${c+1}</div>
      <div class="th-col-header" title="${hdr}">${hdr.length > 15 ? hdr.slice(0,15) + '…' : hdr}</div>
      <select class="th-field-select${mapped ? ' mapped' : ''}" data-col="${c}" onchange="onColFieldChange(this)">${fieldOpts(c)}</select>
    </div></th>`;
  }
  html += '</tr></thead><tbody>';
  previewRows.forEach((row, ri) => {
    html += `<tr><td style="color:#aaa;border:1px solid var(--border);padding:3px 7px;">${startRow + ri + 1}</td>`;
    for (let c = 0; c < maxCols; c++)
      html += `<td style="border:1px solid var(--border);" title="${row[c]||''}">${row[c]||''}</td>`;
    html += '</tr>';
  });
  document.getElementById('mapTable').innerHTML = html + '</tbody>';
}

function onColFieldChange(sel) {
  const col = sel.dataset.col, newField = sel.value;
  Object.keys(importColMap).forEach(k => { if (importColMap[k] === col) importColMap[k] = '-'; });
  if (newField !== 'none') {
    Object.keys(importColMap).forEach(k => { if (k === newField) importColMap[k] = '-'; });
    importColMap[newField] = col;
    sel.classList.add('mapped');
  } else { sel.classList.remove('mapped'); }
}

function validateMapping() {
  if (importColMap.length === '-' || importColMap.width === '-') { notify('Asigna al menos Largo y Ancho'); return false; }
  return true;
}

// ── Unidad de importación ─────────────────────────────────────────
function setImportUnit(u) {
  importUnit = u;
  document.querySelectorAll('.unit-badge').forEach(b => b.classList.remove('active'));
  document.getElementById('ubtn-' + u).classList.add('active');
  updateUnitConvMsg();
}

function updateUnitConvMsg() {
  const toMm = { mm:1, cm:10, m:1000, in:25.4 };
  const el = document.getElementById('unitConvMsg');
  if (!el) return;
  if (importUnit === 'mm') { el.textContent = 'Datos en mm — sin conversión.'; return; }
  const ex = +(100 * toMm[importUnit]).toFixed(2);
  el.textContent = `100 ${importUnit} → ${ex} mm internamente.`;
}

// ── Resumen (tabla) y confirmar importación ───────────────────────
function buildImportSummary() {
  const toMm = { mm:1, cm:10, m:1000, in:25.4 };
  const factor   = toMm[importUnit];
  const startRow = importHeaders.length ? 1 : 0;
  const dataRows = importParsedRows.slice(startRow);
  let okCount = 0, errRows = [];

  let tbody = '';
  dataRows.forEach((row, i) => {
    const rawGroup = importColMap.group  !== '-' ? (row[+importColMap.group] || '').trim()  : '';
    const rawName  = importColMap.name   !== '-' ? (row[+importColMap.name]  || '') : `Pieza ${i+1}`;
    const rawL     = importColMap.length !== '-' ? parseFloat(row[+importColMap.length]) : NaN;
    const rawW     = importColMap.width  !== '-' ? parseFloat(row[+importColMap.width])  : NaN;
    const rawQ     = importColMap.qty    !== '-' ? parseInt(row[+importColMap.qty])       : 1;
    const rawTag   = importColMap.tag    !== '-' ? (row[+importColMap.tag]   || '').trim() : '';
    const name = (rawName || `Pieza ${i+1}`).trim();
    const lMm  = isNaN(rawL) ? null : +(rawL * factor).toFixed(2);
    const wMm  = isNaN(rawW) ? null : +(rawW * factor).toFixed(2);
    const q    = (!rawQ || rawQ < 1) ? 1 : rawQ;
    const ok   = !!(lMm && wMm);
    if (ok) okCount++; else errRows.push(startRow + i + 1);
    tbody += `<tr class="${ok ? '' : 'import-err-row'}">
      <td>${startRow + i + 1}</td>
      <td title="${rawGroup}">${rawGroup || '—'}</td>
      <td title="${name}">${name.length > 20 ? name.slice(0,20)+'…' : name}</td>
      <td>${rawTag || '—'}</td>
      <td>${lMm !== null ? lMm : '<span style="color:var(--red)">✕</span>'}</td>
      <td>${wMm !== null ? wMm : '<span style="color:var(--red)">✕</span>'}</td>
      <td>${q}</td>
      <td class="${ok ? 'imp-ok' : 'imp-err'}">${ok ? '✓' : '✕'}</td>
    </tr>`;
  });

  const html = dataRows.length
    ? `<table class="import-summary-table">
        <thead><tr><th>#</th><th>Grupo</th><th>Nombre</th><th>Etiqueta</th><th>Largo mm</th><th>Ancho mm</th><th>Cant.</th><th></th></tr></thead>
        <tbody>${tbody}</tbody>
       </table>`
    : '<div style="color:var(--text-muted);padding:7px;font-size:0.79rem;">Sin filas procesables.</div>';

  document.getElementById('importSummary').innerHTML = html;

  const wb = document.getElementById('importWarnBox');
  wb.style.display = errRows.length ? '' : 'none';
  if (errRows.length) wb.textContent = `${errRows.length} fila${errRows.length > 1 ? 's' : ''} con error no se importarán.`;

  const mb = document.getElementById('importMergeBox');
  if (pieces.length > 0 && okCount > 0) { mb.style.display = ''; document.getElementById('existingCount').textContent = pieces.length; }
  else mb.style.display = 'none';

  const btn = document.getElementById('confirmImportBtn');
  btn.disabled    = okCount === 0;
  btn.textContent = okCount > 0 ? `✓ Importar ${okCount} pieza${okCount > 1 ? 's' : ''}` : 'Sin piezas válidas';
}

function confirmImport() {
  const toMm = { mm:1, cm:10, m:1000, in:25.4 };
  const factor   = toMm[importUnit];
  const startRow = importHeaders.length ? 1 : 0;
  const action   = document.getElementById('rdReplace')?.checked ? 'replace' : 'merge';
  const newPieces = [];

  importParsedRows.slice(startRow).forEach((row, i) => {
    const rawGroup = importColMap.group  !== '-' ? (row[+importColMap.group] || '').trim()   : '';
    const rawName  = importColMap.name   !== '-' ? (row[+importColMap.name]  || '') : `Pieza ${i+1}`;
    const rawL     = importColMap.length !== '-' ? parseFloat(row[+importColMap.length]) : NaN;
    const rawW     = importColMap.width  !== '-' ? parseFloat(row[+importColMap.width])  : NaN;
    const rawQ     = importColMap.qty    !== '-' ? parseInt(row[+importColMap.qty])       : 1;
    const rawTag   = importColMap.tag    !== '-' ? (row[+importColMap.tag]   || '').trim() : '';
    const name  = (rawName || `Pieza ${i+1}`).trim();
    const lMm   = isNaN(rawL) ? null : +(rawL * factor).toFixed(2);
    const wMm   = isNaN(rawW) ? null : +(rawW * factor).toFixed(2);
    const q     = (!rawQ || rawQ < 1) ? 1 : rawQ;
    if (!lMm || !wMm) return;
    // Si el grupo importado no existe aún, crearlo automáticamente
    const grp = rawGroup || '';
    if (grp && !groups.includes(grp)) groups.push(grp);
    newPieces.push({ name, length: lMm, width: wMm, qty: q, tag: rawTag, color: '', group: grp });
  });

  if (action === 'replace') pieces = newPieces;
  else pieces = [...pieces, ...newPieces];
  recolor();
  closeModal('import');
  renderPieceList();
  notify(`${newPieces.length} pieza${newPieces.length > 1 ? 's' : ''} importada${newPieces.length > 1 ? 's' : ''}${action === 'replace' ? ' (reemplazó lista anterior)' : ''}`);
}
