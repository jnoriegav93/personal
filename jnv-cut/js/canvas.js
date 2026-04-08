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
function drawSheet(sheet, sheetIdx) {
  const canvas = document.getElementById('cutCanvas');
  const ctx    = canvas.getContext('2d');
  const kerf   = parseFloat(document.getElementById('kerf').value) || 0;
  const presetSel  = document.getElementById('matPreset');
  const presetName = presetSel.options[presetSel.selectedIndex]?.text || 'Material';
  const u = unitLabel();

  const MARGIN = 60, HEADER_H = 88, scale = currentZoom;
  const cw = Math.round(sheet.matL * scale) + MARGIN * 2;
  const ch = Math.round(sheet.matW * scale) + MARGIN * 2 + HEADER_H;
  canvas.width = cw; canvas.height = ch;

  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, cw, ch);

  // ── Cabecera ────────────────────────────────────────────────────
  ctx.fillStyle = '#1A1916'; ctx.fillRect(0, 0, cw, HEADER_H);
  ctx.fillStyle = '#E84B1C'; ctx.fillRect(0, HEADER_H - 3, cw, 3);
  ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 14px "IBM Plex Mono",monospace'; ctx.fillText('JNVCut', 16, 21);
  ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '9px "IBM Plex Mono",monospace'; ctx.fillText('DIAGRAMA DE CORTE', 70, 21);
  if (projectName) {
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '8px "IBM Plex Mono",monospace';
    let pnLabel = projectName; while (ctx.measureText(pnLabel).width + 5 > 200 && pnLabel.length > 1) pnLabel = pnLabel.slice(0,-1);
    ctx.fillText(pnLabel, 16, 33);
  }
  ctx.fillStyle = '#FFFFFF'; ctx.font = '500 12px "IBM Plex Sans",sans-serif'; ctx.fillText(presetName, 16, 48);
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '10px "IBM Plex Mono",monospace';
  ctx.fillText(`Lámina ${sheetIdx+1} / ${optimized.length}  ·  Kerf ${kerf} mm`, 16, 64);

  const d  = new Date();
  const ds = d.toLocaleDateString('es-PE') + ' ' + d.toLocaleTimeString('es-PE', {hour:'2-digit', minute:'2-digit'});
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '9px "IBM Plex Mono",monospace';
  ctx.fillText(ds, cw - ctx.measureText(ds).width - 14, 80);

  // Stats (esquina superior derecha)
  const matArea  = sheet.matL * sheet.matW;
  const usedArea = sheet.placed.reduce((s, p) => s + p.rw * p.rh, 0);
  const usePct   = Math.round(usedArea / matArea * 100);
  const sx = cw - 190;
  ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '9px "IBM Plex Mono",monospace'; ctx.fillText('PLANCHA', sx, 20);
  ctx.fillStyle = '#fff'; ctx.font = '600 10px "IBM Plex Mono",monospace'; ctx.fillText(`${fmt(sheet.matL)}×${fmt(sheet.matW)} ${u}`, sx, 33);
  ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '9px "IBM Plex Mono",monospace'; ctx.fillText('USO / SOBRANTE', sx, 50);
  ctx.fillStyle = '#5BA85A'; ctx.font = '600 12px "IBM Plex Mono",monospace'; ctx.fillText(`${usePct}%`, sx, 64);
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '10px "IBM Plex Mono",monospace'; ctx.fillText(` / ${100-usePct}%`, sx + 26, 64);
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.font = '9px "IBM Plex Mono",monospace'; ctx.fillText(`${sheet.placed.length} piezas`, sx, 80);

  const ox = MARGIN, oy = HEADER_H + MARGIN / 2;

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
    ctx.fillStyle = col; ctx.fillRect(px, py, pw, Math.min(5, ph));
    if (pw > 30 && ph > 22) {
      const fs = Math.max(8, Math.min(11, pw/7, ph/4));
      ctx.fillStyle = '#1A1916'; ctx.font = `600 ${fs}px "IBM Plex Sans",sans-serif`;
      let lbl = p.name; while (ctx.measureText(lbl).width + 7 > pw && lbl.length > 1) lbl = lbl.slice(0,-1);
      if (lbl !== p.name) lbl += '…';
      ctx.fillText(lbl, px+4, py+fs+7);
      if (p.tag && ph > fs+18) {
        const tfs = Math.max(7, fs-1); ctx.fillStyle = col; ctx.font = `500 ${tfs}px "IBM Plex Mono",monospace`;
        let tlbl = p.tag; while (ctx.measureText(tlbl).width + 5 > pw && tlbl.length > 1) tlbl = tlbl.slice(0,-1);
        if (tlbl !== p.tag) tlbl += '…'; ctx.fillText(tlbl, px+4, py+fs+7+tfs+3);
      }
      // ── Dimensiones L/A en dos líneas al fondo ──
      if (pw > 20) {
        const dfs   = Math.max(7, Math.min(9, pw / 7, ph / 6));
        const lineH = dfs + 3;
        const rot   = p.rotated ? ' ↻' : '';
        ctx.font      = `${dfs}px "IBM Plex Mono",monospace`;
        ctx.fillStyle = 'rgba(0,0,0,0.42)';
        const lLine = `L: ${fmt(p.rw)} ${u}${rot}`;
        const aLine = `A: ${fmt(p.rh)} ${u}`;
        const headerUsed = fs + 9 + (p.tag ? (Math.max(7, fs - 1) + 3) : 0);
        const space = ph - headerUsed - 6;
        if (space >= lineH * 2) {
          ctx.fillText(lLine, px + 4, py + ph - lineH - 2);
          ctx.fillText(aLine, px + 4, py + ph - 2);
        } else if (space >= lineH) {
          ctx.fillText(`${fmt(p.rw)}×${fmt(p.rh)} ${u}${rot}`, px + 4, py + ph - 2);
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
      if (pw > 28 && ph > 18) {
        const fs = Math.max(8, Math.min(10, pw/8, ph/4));
        ctx.fillStyle = '#666'; ctx.font = `500 ${fs}px "IBM Plex Sans",sans-serif`;
        let lbl = s.name; while (ctx.measureText(lbl).width + 6 > pw && lbl.length > 1) lbl = lbl.slice(0,-1);
        if (lbl !== s.name) lbl += '…'; ctx.fillText(lbl, px+4, py+fs+5);
        if (ph > fs+16) {
          ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.font = `${Math.max(7,fs-1)}px "IBM Plex Mono",monospace`;
          const dimTxt = `${fmt(s.rw)}×${fmt(s.rh)}${s.rotated ? ' ↻' : ''} ${u}`;
          if (ctx.measureText(dimTxt).width + 5 < pw) ctx.fillText(dimTxt, px+4, py+ph-4);
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
    ctx.beginPath(); ctx.moveTo(rpx, oy + sheet.matW*scale); ctx.lineTo(rpx, oy + sheet.matW*scale + 7); ctx.stroke();
    ctx.fillStyle = '#555'; ctx.font = '9px "IBM Plex Mono",monospace';
    const lbl = fmt(x); ctx.fillText(lbl, rpx - ctx.measureText(lbl).width/2, oy + sheet.matW*scale + 18);
  }
  ctx.fillStyle = '#888'; ctx.font = '8px "IBM Plex Mono",monospace';
  ctx.fillText(u, ox + sheet.matL*scale + 3, oy + sheet.matW*scale + 18);
  for (let y = 0; y <= sheet.matW; y += stepV) {
    const rpy = oy + y*scale;
    ctx.beginPath(); ctx.moveTo(ox-7, rpy); ctx.lineTo(ox, rpy); ctx.stroke();
    const lbl = fmt(y); ctx.fillStyle = '#555'; ctx.font = '9px "IBM Plex Mono",monospace';
    ctx.save(); ctx.translate(ox-18, rpy + ctx.measureText(lbl).width/2); ctx.rotate(-Math.PI/2); ctx.fillText(lbl, 0, 0); ctx.restore();
  }

  // ── Sincronizar canvas de medición ──────────────────────────────
  const mc = document.getElementById('measureCanvas');
  mc.width = cw; mc.height = ch;
  mc.style.display = measureMode ? 'block' : 'none';
  if (measureMode) { const mctx = mc.getContext('2d'); mctx.clearRect(0, 0, cw, ch); }
}

// ── Exportar (alta calidad ≈ 300 DPI) ────────────────────────────
const EXPORT_ZOOM = 3.0; // factor mínimo de exportación

function _renderHighRes(idx) {
  const sheet = optimized[idx];
  if (!sheet) return null;
  const origZoom = currentZoom;
  currentZoom = Math.max(origZoom, 0.6) * EXPORT_ZOOM;
  drawSheet(sheet, idx);
  const canvas = document.getElementById('cutCanvas');
  const tmp = document.createElement('canvas');
  tmp.width = canvas.width; tmp.height = canvas.height;
  const tc = tmp.getContext('2d');
  tc.fillStyle = 'white'; tc.fillRect(0, 0, tmp.width, tmp.height);
  tc.drawImage(canvas, 0, 0);
  currentZoom = origZoom;
  drawSheet(sheet, idx); // restaurar
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
  const html = `<!DOCTYPE html><html><head><title>JNVCut - Lámina ${idx+1}</title>
<style>@page{margin:0;size:auto;}*{margin:0;padding:0;box-sizing:border-box;}body{background:#fff;}img{display:block;width:100%;height:auto;}@media print{body{margin:0;}img{max-width:100%;page-break-inside:avoid;}}</style>
</head><body><img src="${imgData}"><script>window.addEventListener('load',function(){setTimeout(function(){window.print();},300);});<\/script></body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, '_blank');
  if (!win) { URL.revokeObjectURL(url); notify('Permite las ventanas emergentes para exportar PDF'); return; }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  notify(`Abriendo PDF para lámina ${idx+1}…`);
}
