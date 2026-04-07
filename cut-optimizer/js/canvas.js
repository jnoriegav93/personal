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
  ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 14px "IBM Plex Mono",monospace'; ctx.fillText('CutOpt', 16, 24);
  ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '9px "IBM Plex Mono",monospace'; ctx.fillText('DIAGRAMA DE CORTE', 70, 24);
  ctx.fillStyle = '#FFFFFF'; ctx.font = '500 12px "IBM Plex Sans",sans-serif'; ctx.fillText(presetName, 16, 44);
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '10px "IBM Plex Mono",monospace';
  ctx.fillText(`Lámina ${sheetIdx+1} / ${optimized.length}  ·  Kerf ${kerf} mm`, 16, 60);

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
    ctx.fillStyle = hexRgba(p.color, 0.18); ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = p.color; ctx.lineWidth = 1.5; ctx.strokeRect(px, py, pw, ph);
    ctx.fillStyle = p.color; ctx.fillRect(px, py, pw, Math.min(5, ph));
    if (pw > 30 && ph > 22) {
      const fs = Math.max(8, Math.min(11, pw/7, ph/4));
      ctx.fillStyle = '#1A1916'; ctx.font = `600 ${fs}px "IBM Plex Sans",sans-serif`;
      let lbl = p.name; while (ctx.measureText(lbl).width + 7 > pw && lbl.length > 1) lbl = lbl.slice(0,-1);
      if (lbl !== p.name) lbl += '…';
      ctx.fillText(lbl, px+4, py+fs+7);
      if (p.tag && ph > fs+18) {
        const tfs = Math.max(7, fs-1); ctx.fillStyle = p.color; ctx.font = `500 ${tfs}px "IBM Plex Mono",monospace`;
        let tlbl = p.tag; while (ctx.measureText(tlbl).width + 5 > pw && tlbl.length > 1) tlbl = tlbl.slice(0,-1);
        if (tlbl !== p.tag) tlbl += '…'; ctx.fillText(tlbl, px+4, py+fs+7+tfs+3);
      }
      if (ph > fs+30) {
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.font = `${Math.max(7,fs-1)}px "IBM Plex Mono",monospace`;
        const dimTxt = `${fmt(p.rw)}×${fmt(p.rh)}${p.rotated ? ' ↻' : ''} ${u}`;
        if (ctx.measureText(dimTxt).width + 5 < pw) ctx.fillText(dimTxt, px+4, py+ph-5);
      }
      // Nombre del grupo (esquina superior derecha)
      if (p.group && pw > 40 && ph > 18) {
        const gfs = Math.max(6, Math.min(8, pw/10));
        ctx.fillStyle = p.color; ctx.font = `500 ${gfs}px "IBM Plex Mono",monospace`;
        const glbl = p.group.length > 12 ? p.group.slice(0,12)+'…' : p.group;
        const gw = ctx.measureText(glbl).width;
        if (gw + 6 < pw) ctx.fillText(glbl, px + pw - gw - 4, py + gfs + 3);
      }
    }
  });

  // ── Sugerencias (bordes discontinuos + cortes) ──────────────────
  if (sheet.suggestions && sheet.suggestions.length) {
    sheet.suggestions.forEach(s => {
      const px = ox + s.x*scale, py = oy + s.y*scale, pw = s.rw*scale, ph = s.rh*scale;
      const cuts = s.cuts || {}; const sCols = cuts.cols || 1, sRows = cuts.rows || 1;
      const cellPW = pw / sCols, cellPH = ph / sRows;

      // Cell fills
      const cellColors = ['rgba(232,75,28,0.07)','rgba(91,168,90,0.07)','rgba(74,144,217,0.07)','rgba(155,109,181,0.07)'];
      for (let r = 0; r < sRows; r++)
        for (let c = 0; c < sCols; c++) {
          ctx.fillStyle = cellColors[(r * sCols + c) % cellColors.length];
          ctx.fillRect(px + c * cellPW, py + r * cellPH, cellPW, cellPH);
        }

      // Outer border dashed
      ctx.strokeStyle = '#888'; ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]); ctx.strokeRect(px, py, pw, ph); ctx.setLineDash([]);

      // Internal cut lines
      if (sCols > 1 || sRows > 1) {
        ctx.strokeStyle = 'rgba(232,75,28,0.55)'; ctx.lineWidth = 0.8;
        ctx.setLineDash([4, 3]);
        for (let c = 1; c < sCols; c++) { const lx = px + c*cellPW; ctx.beginPath(); ctx.moveTo(lx,py); ctx.lineTo(lx,py+ph); ctx.stroke(); }
        for (let r = 1; r < sRows; r++) { const ly = py + r*cellPH; ctx.beginPath(); ctx.moveTo(px,ly); ctx.lineTo(px+pw,ly); ctx.stroke(); }
        ctx.setLineDash([]);

        // Per-cell dimension labels
        if (cellPW > 30 && cellPH > 18) {
          const cfs = Math.max(7, Math.min(9, cellPW/6, cellPH/3));
          ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.font = `${cfs}px "IBM Plex Mono",monospace`;
          ctx.textAlign = 'center';
          const cW = fmt(Math.round(s.rw/sCols)), cH = fmt(Math.round(s.rh/sRows));
          for (let r = 0; r < sRows; r++)
            for (let c = 0; c < sCols; c++)
              ctx.fillText(`${cW}×${cH}`, px + c*cellPW + cellPW/2, py + r*cellPH + cellPH/2 + cfs/2);
          ctx.textAlign = 'left';
        }
      } else if (pw > 28 && ph > 18) {
        // Single piece label
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

// ── Exportar imagen ───────────────────────────────────────────────
function downloadImage(fmt2) {
  const canvas = document.getElementById('cutCanvas');
  if (document.getElementById('canvasInner').style.display === 'none') { notify('Genera la optimización primero'); return; }
  const idx  = currentSheetIdx || 0;
  const sel  = document.getElementById('matPreset');
  const name = (sel.options[sel.selectedIndex]?.text || 'corte').replace(/[^a-z0-9]/gi, '_').slice(0, 40);
  const link = document.createElement('a');
  link.download = `${name}_lamina${idx+1}.${fmt2}`;
  if (fmt2 === 'jpg') {
    const tmp = document.createElement('canvas'); tmp.width = canvas.width; tmp.height = canvas.height;
    const tc = tmp.getContext('2d'); tc.fillStyle = 'white'; tc.fillRect(0, 0, tmp.width, tmp.height); tc.drawImage(canvas, 0, 0);
    link.href = tmp.toDataURL('image/jpeg', 0.95);
  } else { link.href = canvas.toDataURL('image/png'); }
  link.click();
  notify(`Descargando ${name}_lamina${(currentSheetIdx||0)+1}.${fmt2}`);
}
