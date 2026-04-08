// ── Renderizado del canvas de corte ──────────────────────────────
function renderSheet() {
  if (!optimized.length) return;
  const idx = currentSheetIdx || 0;
  drawSheet(optimized[idx], idx);
}

function applyZoom(val) {
  currentZoom = val / 100;
  document.getElementById('zoomVal').textContent = val + '%';
  renderSheet();
}

function fitCanvasToWidth() {
  if (!optimized.length) return;
  const area  = document.getElementById('canvasArea');
  const sheet = optimized[currentSheetIdx || 0];
  const MARGIN = 60;
  const PAD = 32; // p-4 = 16px each side
  const availW = area.clientWidth - PAD;
  const newScale = Math.max(0.1, Math.min(2.0, (availW - MARGIN * 2) / sheet.matL));
  const newPct = Math.round(newScale * 100);
  currentZoom = newScale;
  const slider = document.getElementById('zoomSlider');
  const label  = document.getElementById('zoomVal');
  if (slider) slider.value = Math.min(150, Math.max(20, newPct));
  if (label)  label.textContent = newPct + '%';
  renderSheet();
  // Scroll canvas into view centered
  const inner = document.getElementById('canvasInner');
  if (inner) inner.scrollIntoView({ block: 'nearest', inline: 'center' });
}


function hexRgba(hex, a) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}

// ── Dibujo principal ──────────────────────────────────────────────
// isExport: cuando es true escala tipografía y márgenes para alta resolución
function drawSheet(sheet, sheetIdx, isExport) {
  const canvas = document.getElementById('cutCanvas');
  const ctx    = canvas.getContext('2d');
  const kerf   = parseFloat(document.getElementById('kerf').value) || 0;
  const presetSel  = document.getElementById('matPreset');
  const presetName = presetSel.options[presetSel.selectedIndex]?.text || 'Material';
  const u = unitLabel();

  const ts = isExport ? EXPORT_ZOOM : 1; // factor de escala de texto/márgenes
  const MARGIN = Math.round(60 * ts), HEADER_H = Math.round(88 * ts), scale = currentZoom;
  const cw = Math.round(sheet.matL * scale) + MARGIN * 2;
  const ch = Math.round(sheet.matW * scale) + MARGIN * 2 + HEADER_H;
  canvas.width = cw; canvas.height = ch;

  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, cw, ch);

  // ── Cabecera ────────────────────────────────────────────────────
  ctx.fillStyle = '#1A1916'; ctx.fillRect(0, 0, cw, HEADER_H);
  ctx.fillStyle = '#E84B1C'; ctx.fillRect(0, HEADER_H - Math.round(3*ts), cw, Math.round(3*ts));
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold ${Math.round(14*ts)}px "IBM Plex Mono",monospace`;
  ctx.fillText('JNVCut', Math.round(16*ts), Math.round(21*ts));
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = `${Math.round(9*ts)}px "IBM Plex Mono",monospace`;
  ctx.fillText('DIAGRAMA DE CORTE', Math.round(70*ts), Math.round(21*ts));
  if (projectName) {
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = `${Math.round(8*ts)}px "IBM Plex Mono",monospace`;
    let pnLabel = projectName;
    while (ctx.measureText(pnLabel).width + 5 > Math.round(200*ts) && pnLabel.length > 1) pnLabel = pnLabel.slice(0,-1);
    ctx.fillText(pnLabel, Math.round(16*ts), Math.round(33*ts));
  }
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `500 ${Math.round(12*ts)}px "IBM Plex Sans",sans-serif`;
  ctx.fillText(presetName, Math.round(16*ts), Math.round(48*ts));
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = `${Math.round(10*ts)}px "IBM Plex Mono",monospace`;
  ctx.fillText(`Lámina ${sheetIdx+1} / ${optimized.length}  ·  Kerf ${kerf} mm`, Math.round(16*ts), Math.round(64*ts));

  const d  = new Date();
  const ds = d.toLocaleDateString('es-PE') + ' ' + d.toLocaleTimeString('es-PE', {hour:'2-digit', minute:'2-digit'});
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = `${Math.round(9*ts)}px "IBM Plex Mono",monospace`;
  ctx.fillText(ds, cw - ctx.measureText(ds).width - Math.round(14*ts), Math.round(80*ts));

  // Stats (esquina superior derecha)
  const matArea  = sheet.matL * sheet.matW;
  const usedArea = sheet.placed.reduce((s, p) => s + p.rw * p.rh, 0);
  const usePct   = Math.round(usedArea / matArea * 100);
  const sx = cw - Math.round(190*ts);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = `${Math.round(9*ts)}px "IBM Plex Mono",monospace`;
  ctx.fillText('PLANCHA', sx, Math.round(20*ts));
  ctx.fillStyle = '#fff';
  ctx.font = `600 ${Math.round(10*ts)}px "IBM Plex Mono",monospace`;
  ctx.fillText(`${fmt(sheet.matL)}×${fmt(sheet.matW)} ${u}`, sx, Math.round(33*ts));
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = `${Math.round(9*ts)}px "IBM Plex Mono",monospace`;
  ctx.fillText('USO / SOBRANTE', sx, Math.round(50*ts));
  ctx.fillStyle = '#5BA85A';
  ctx.font = `600 ${Math.round(12*ts)}px "IBM Plex Mono",monospace`;
  ctx.fillText(`${usePct}%`, sx, Math.round(64*ts));
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = `${Math.round(10*ts)}px "IBM Plex Mono",monospace`;
  ctx.fillText(` / ${100-usePct}%`, sx + Math.round(26*ts), Math.round(64*ts));
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = `${Math.round(9*ts)}px "IBM Plex Mono",monospace`;
  ctx.fillText(`${sheet.placed.length} piezas`, sx, Math.round(80*ts));

  const ox = MARGIN, oy = HEADER_H + Math.round(MARGIN / 2);

  // ── Material: fondo + cuadrícula ────────────────────────────────
  ctx.fillStyle = '#F9F8F5'; ctx.fillRect(ox, oy, sheet.matL * scale, sheet.matW * scale);
  ctx.strokeStyle = '#E5E2DB'; ctx.lineWidth = 0.5;
  const gs  = sheet.matL > 2000 ? 200 : 100;
  const gsv = sheet.matW > 2000 ? 200 : 100;
  for (let x = 0; x <= sheet.matL; x += gs)  { ctx.beginPath(); ctx.moveTo(ox + x*scale, oy); ctx.lineTo(ox + x*scale, oy + sheet.matW*scale); ctx.stroke(); }
  for (let y = 0; y <= sheet.matW; y += gsv) { ctx.beginPath(); ctx.moveTo(ox, oy + y*scale); ctx.lineTo(ox + sheet.matL*scale, oy + y*scale); ctx.stroke(); }
  ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 2; ctx.strokeRect(ox, oy, sheet.matL*scale, sheet.matW*scale);

  // ── Piezas principales ──────────────────────────────────────────
  sheet.placed.forEach(p => {
    const px = ox + p.x*scale, py = oy + p.y*scale, pw = p.rw*scale, ph = p.rh*scale;
    const col = pieceDisplayColor(p);
    ctx.fillStyle = hexRgba(col, 0.18); ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.strokeRect(px, py, pw, ph);
    ctx.fillStyle = col; ctx.fillRect(px, py, pw, Math.min(Math.round(5*ts), ph));
    if (pw > Math.round(30*ts) && ph > Math.round(22*ts)) {
      const fs = Math.max(Math.round(8*ts), Math.min(Math.round(11*ts), pw/7, ph/4));
      ctx.fillStyle = '#1A1916';
      ctx.font = `600 ${fs}px "IBM Plex Sans",sans-serif`;
      let lbl = p.name;
      while (ctx.measureText(lbl).width + Math.round(7*ts) > pw && lbl.length > 1) lbl = lbl.slice(0,-1);
      if (lbl !== p.name) lbl += '…';
      ctx.fillText(lbl, px + Math.round(4*ts), py + fs + Math.round(7*ts));
      if (p.tag && ph > fs + Math.round(18*ts)) {
        const tfs = Math.max(Math.round(7*ts), fs - Math.round(ts));
        ctx.fillStyle = col;
        ctx.font = `500 ${tfs}px "IBM Plex Mono",monospace`;
        let tlbl = p.tag;
        while (ctx.measureText(tlbl).width + Math.round(5*ts) > pw && tlbl.length > 1) tlbl = tlbl.slice(0,-1);
        if (tlbl !== p.tag) tlbl += '…';
        ctx.fillText(tlbl, px + Math.round(4*ts), py + fs + Math.round(7*ts) + tfs + Math.round(3*ts));
      }
      // ── Dimensiones L/A en dos líneas al fondo ──
      if (pw > Math.round(20*ts)) {
        const dfs   = Math.max(Math.round(7*ts), Math.min(Math.round(9*ts), pw / 7, ph / 6));
        const lineH = dfs + Math.round(3*ts);
        const rot   = p.rotated ? ' ↻' : '';
        ctx.font      = `${dfs}px "IBM Plex Mono",monospace`;
        ctx.fillStyle = 'rgba(0,0,0,0.42)';
        const lLine = `L: ${fmt(p.rw)} ${u}${rot}`;
        const aLine = `A: ${fmt(p.rh)} ${u}`;
        const headerUsed = fs + Math.round(9*ts) + (p.tag ? (Math.max(Math.round(7*ts), fs - Math.round(ts)) + Math.round(3*ts)) : 0);
        const space = ph - headerUsed - Math.round(6*ts);
        if (space >= lineH * 2) {
          ctx.fillText(lLine, px + Math.round(4*ts), py + ph - lineH - Math.round(2*ts));
          ctx.fillText(aLine, px + Math.round(4*ts), py + ph - Math.round(2*ts));
        } else if (space >= lineH) {
          ctx.fillText(`${fmt(p.rw)}×${fmt(p.rh)} ${u}${rot}`, px + Math.round(4*ts), py + ph - Math.round(2*ts));
        }
      }
    }
  });

  // ── Sugerencias (bordes discontinuos) ───────────────────────────
  if (sheet.suggestions && sheet.suggestions.length) {
    sheet.suggestions.forEach(s => {
      const px = ox + s.x*scale, py = oy + s.y*scale, pw = s.rw*scale, ph = s.rh*scale;
      ctx.fillStyle = 'rgba(100,100,100,0.07)'; ctx.fillRect(px, py, pw, ph);
      ctx.strokeStyle = '#888'; ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]); ctx.strokeRect(px, py, pw, ph); ctx.setLineDash([]);
      if (pw > Math.round(28*ts) && ph > Math.round(18*ts)) {
        const fs = Math.max(Math.round(8*ts), Math.min(Math.round(10*ts), pw/8, ph/4));
        ctx.fillStyle = '#666';
        ctx.font = `500 ${fs}px "IBM Plex Sans",sans-serif`;
        let lbl = s.name;
        while (ctx.measureText(lbl).width + Math.round(6*ts) > pw && lbl.length > 1) lbl = lbl.slice(0,-1);
        if (lbl !== s.name) lbl += '…';
        ctx.fillText(lbl, px + Math.round(4*ts), py + fs + Math.round(5*ts));
        if (ph > fs + Math.round(16*ts)) {
          ctx.fillStyle = 'rgba(0,0,0,0.28)';
          ctx.font = `${Math.max(Math.round(7*ts), fs - Math.round(ts))}px "IBM Plex Mono",monospace`;
          const dimTxt = `${fmt(s.rw)}×${fmt(s.rh)}${s.rotated ? ' ↻' : ''} ${u}`;
          if (ctx.measureText(dimTxt).width + Math.round(5*ts) < pw) ctx.fillText(dimTxt, px + Math.round(4*ts), py + ph - Math.round(4*ts));
        }
      }
    });
  }

  // ── Reglas ──────────────────────────────────────────────────────
  const step  = sheet.matL > 2000 ? 200 : sheet.matL > 1000 ? 100 : 50;
  const stepV = sheet.matW > 2000 ? 200 : sheet.matW > 1000 ? 100 : 50;
  ctx.strokeStyle = '#888'; ctx.lineWidth = 1;
  for (let x = 0; x <= sheet.matL; x += step) {
    const rpx = ox + x*scale;
    ctx.beginPath(); ctx.moveTo(rpx, oy + sheet.matW*scale); ctx.lineTo(rpx, oy + sheet.matW*scale + Math.round(7*ts)); ctx.stroke();
    ctx.fillStyle = '#555';
    ctx.font = `${Math.round(9*ts)}px "IBM Plex Mono",monospace`;
    const lbl = fmt(x);
    ctx.fillText(lbl, rpx - ctx.measureText(lbl).width/2, oy + sheet.matW*scale + Math.round(18*ts));
  }
  ctx.fillStyle = '#888';
  ctx.font = `${Math.round(8*ts)}px "IBM Plex Mono",monospace`;
  ctx.fillText(u, ox + sheet.matL*scale + Math.round(3*ts), oy + sheet.matW*scale + Math.round(18*ts));
  for (let y = 0; y <= sheet.matW; y += stepV) {
    const rpy = oy + y*scale;
    ctx.beginPath(); ctx.moveTo(ox - Math.round(7*ts), rpy); ctx.lineTo(ox, rpy); ctx.stroke();
    const lbl = fmt(y);
    ctx.fillStyle = '#555';
    ctx.font = `${Math.round(9*ts)}px "IBM Plex Mono",monospace`;
    ctx.save(); ctx.translate(ox - Math.round(18*ts), rpy + ctx.measureText(lbl).width/2); ctx.rotate(-Math.PI/2); ctx.fillText(lbl, 0, 0); ctx.restore();
  }

  // ── Sincronizar canvas de medición (solo en pantalla) ────────────
  if (!isExport) {
    const mc = document.getElementById('measureCanvas');
    mc.width = cw; mc.height = ch;
    mc.style.display = measureMode ? 'block' : 'none';
    if (measureMode) { const mctx = mc.getContext('2d'); mctx.clearRect(0, 0, cw, ch); }
  }
}

// ── Lista de piezas al pie del export ────────────────────────────
// La tabla ocupa máx. 75 % del ancho del canvas, centrada, simulando márgenes A4.
function _appendPieceList(tc, canvasWidth, startY, ts) {
  if (!pieces.length) return startY;
  const u = unitLabel();
  const MARGIN_V  = Math.round(20 * ts);
  const PAD       = Math.round(16 * ts);
  const ROW_H     = Math.round(22 * ts);
  const HDR_ROW_H = Math.round(28 * ts);
  const FS        = Math.round(9  * ts);
  const FS_HDR    = Math.round(8  * ts);
  const FS_TITLE  = Math.round(11 * ts);
  const TITLE_H   = Math.round(40 * ts);

  // Tabla centrada al 75 % del ancho (simula márgenes de impresión A4)
  const TABLE_W = Math.round(canvasWidth * 0.75);
  const TABLE_X = Math.round((canvasWidth - TABLE_W) / 2);

  startY += MARGIN_V;

  // ── Barra de título (ancho completo del canvas) ──────────────────
  tc.fillStyle = '#1A1916';
  tc.fillRect(0, startY, canvasWidth, TITLE_H);
  tc.fillStyle = '#E84B1C';
  tc.fillRect(0, startY + TITLE_H - Math.round(3*ts), canvasWidth, Math.round(3*ts));
  tc.fillStyle = '#FFFFFF';
  tc.font = `bold ${FS_TITLE}px "IBM Plex Mono",monospace`;
  tc.fillText('LISTA DE PIEZAS A CORTAR', TABLE_X, startY + Math.round(26*ts));
  const totalPcs = pieces.reduce((s, p) => s + (p.qty || 1), 0);
  tc.fillStyle = 'rgba(255,255,255,0.4)';
  tc.font = `${FS}px "IBM Plex Mono",monospace`;
  const subtitle = `${pieces.length} tipo${pieces.length !== 1 ? 's' : ''} · ${totalPcs} pzas. total`;
  tc.fillText(subtitle, TABLE_X + TABLE_W - tc.measureText(subtitle).width, startY + Math.round(26*ts));

  startY += TITLE_H + Math.round(8*ts);

  // ── Definición de columnas (relativas al TABLE_X / TABLE_W) ─────
  const TW = TABLE_W;
  const TX = TABLE_X;
  const cols = [
    { label: 'NOMBRE',        x: TX + PAD,                          w: Math.round(TW * 0.30) - PAD },
    { label: `LARGO (${u})`,  x: TX + Math.round(TW * 0.31),        w: Math.round(TW * 0.13) },
    { label: `ANCHO (${u})`,  x: TX + Math.round(TW * 0.45),        w: Math.round(TW * 0.13) },
    { label: 'CANT.',         x: TX + Math.round(TW * 0.59),        w: Math.round(TW * 0.09) },
    { label: 'GRUPO',         x: TX + Math.round(TW * 0.69),        w: Math.round(TW * 0.16) },
    { label: 'ETIQUETA',      x: TX + Math.round(TW * 0.86),        w: Math.round(TW * 0.13) - PAD },
  ];

  // ── Fila de encabezado ──────────────────────────────────────────
  tc.fillStyle = '#F0EDE8';
  tc.fillRect(TX, startY, TW, HDR_ROW_H);
  tc.strokeStyle = '#CCC8BF';
  tc.lineWidth = Math.round(ts);
  tc.strokeRect(TX, startY, TW, HDR_ROW_H);
  tc.fillStyle = '#666';
  tc.font = `600 ${FS_HDR}px "IBM Plex Mono",monospace`;
  cols.forEach(col => tc.fillText(col.label, col.x, startY + Math.round(18*ts)));
  startY += HDR_ROW_H;

  // ── Filas de datos ──────────────────────────────────────────────
  pieces.forEach((p, i) => {
    tc.fillStyle = i % 2 === 0 ? '#FFFFFF' : '#F7F5F2';
    tc.fillRect(TX, startY, TW, ROW_H);
    // Barra de color al borde izquierdo de la tabla
    tc.fillStyle = p.color || '#888';
    tc.fillRect(TX, startY, Math.round(4*ts), ROW_H);
    // Línea divisora
    tc.strokeStyle = '#E5E2DB';
    tc.lineWidth = 0.5;
    tc.beginPath(); tc.moveTo(TX, startY + ROW_H); tc.lineTo(TX + TW, startY + ROW_H); tc.stroke();

    const textY = startY + Math.round(14*ts);
    tc.fillStyle = '#1A1916';
    tc.font = `${FS}px "IBM Plex Sans",sans-serif`;

    const cells = [
      { text: p.name  || '',      col: cols[0] },
      { text: fmt(p.length),      col: cols[1] },
      { text: fmt(p.width),       col: cols[2] },
      { text: String(p.qty || 1), col: cols[3] },
      { text: p.group || '—',     col: cols[4] },
      { text: p.tag   || '—',     col: cols[5] },
    ];
    cells.forEach(cell => {
      let txt = cell.text;
      const maxW = cell.col.w;
      while (tc.measureText(txt).width > maxW && txt.length > 1) txt = txt.slice(0, -1);
      if (txt !== cell.text) txt = txt.slice(0, -1) + '…';
      tc.fillText(txt, cell.col.x, textY);
    });
    startY += ROW_H;
  });

  return startY;
}

// ── Exportar (alta calidad ≈ 300 DPI) ────────────────────────────
const EXPORT_ZOOM = 3.0; // factor mínimo de exportación

function _renderHighRes(idx) {
  const sheet = optimized[idx];
  if (!sheet) return null;
  const origZoom = currentZoom;
  const ts = EXPORT_ZOOM;
  currentZoom = Math.max(origZoom, 0.6) * ts;
  drawSheet(sheet, idx, true); // isExport = true → texto escalado
  const canvas = document.getElementById('cutCanvas');

  // Calcular altura necesaria para la lista de piezas
  const ROW_H     = Math.round(22 * ts);
  const HDR_ROW_H = Math.round(28 * ts);
  const TITLE_H   = Math.round(40 * ts);
  const MARGIN_V  = Math.round(16 * ts);
  const pieceListH = pieces.length > 0
    ? MARGIN_V + TITLE_H + Math.round(8*ts) + HDR_ROW_H + pieces.length * ROW_H + Math.round(24*ts)
    : 0;

  const tmp = document.createElement('canvas');
  tmp.width  = canvas.width;
  tmp.height = canvas.height + pieceListH;
  const tc = tmp.getContext('2d');
  tc.fillStyle = 'white'; tc.fillRect(0, 0, tmp.width, tmp.height);
  tc.drawImage(canvas, 0, 0);

  if (pieces.length > 0) _appendPieceList(tc, tmp.width, canvas.height, ts);

  currentZoom = origZoom;
  drawSheet(sheet, idx); // restaurar vista en pantalla
  return tmp;
}

function downloadImage(fmt2) {
  if (document.getElementById('canvasInner').style.display === 'none') { notify('Genera la optimización primero'); return; }
  const idx  = currentSheetIdx || 0;
  const name = sanitizedProjectName();
  const filename = `${name}_lamina${idx+1}.${fmt2}`;
  const tmp  = _renderHighRes(idx);
  if (!tmp) return;
  const link = document.createElement('a');
  link.download = filename;
  link.href = tmp.toDataURL('image/jpeg', 0.96);
  link.click();
  notify(`Descargando ${filename}`);
}

function downloadPDF() {
  if (document.getElementById('canvasInner').style.display === 'none') { notify('Genera la optimización primero'); return; }
  const idx = currentSheetIdx || 0;
  const tmp = _renderHighRes(idx);
  if (!tmp) return;
  const imgData = tmp.toDataURL('image/jpeg', 0.96);
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>JNVCut - Lámina ${idx+1}</title>
<style>@page{margin:10mm;size:A4 portrait;}*{margin:0;padding:0;box-sizing:border-box;}body{background:#fff;}img{display:block;width:100%;height:auto;page-break-inside:avoid;}@media print{body{margin:0;}}</style>
</head><body><img src="${imgData}"><script>window.addEventListener('load',function(){setTimeout(function(){window.print();},300);});<\/script></body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, '_blank');
  if (!win) { URL.revokeObjectURL(url); notify('Permite las ventanas emergentes para exportar PDF'); return; }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  notify(`Abriendo PDF para lámina ${idx+1}…`);
}
