// ── Catálogo de materiales ────────────────────────────────────────
// g: grupo, n: nombre, l: largo (mm), w: ancho (mm), t: espesor (mm)
const MATERIALS = [
  {g:"Melamina",n:"Melamina estándar 18mm",l:2440,w:2150,t:18},
  {g:"Melamina",n:"Melamina estándar 15mm",l:2440,w:2150,t:15},
  {g:"Melamina",n:"Melamina estándar 12mm",l:2440,w:2150,t:12},
  {g:"Melamina",n:"Melamina estándar 8mm", l:2440,w:2150,t:8},
  {g:"Melamina",n:"Melamina grande 18mm (2.15×2.75m)",l:2750,w:2150,t:18},
  {g:"MDF",n:"MDF 18mm",l:2440,w:1830,t:18},
  {g:"MDF",n:"MDF 15mm",l:2440,w:1830,t:15},
  {g:"MDF",n:"MDF 12mm",l:2440,w:1830,t:12},
  {g:"MDF",n:"MDF 9mm", l:2440,w:1830,t:9},
  {g:"MDF",n:"MDF 5.5mm",l:2440,w:1830,t:5.5},
  {g:"MDF",n:"MDF 3mm", l:2440,w:1830,t:3},
  {g:"Triplay",n:"Triplay lupuna 4mm", l:2440,w:1220,t:4},
  {g:"Triplay",n:"Triplay lupuna 6mm", l:2440,w:1220,t:6},
  {g:"Triplay",n:"Triplay lupuna 9mm", l:2440,w:1220,t:9},
  {g:"Triplay",n:"Triplay lupuna 12mm",l:2440,w:1220,t:12},
  {g:"Triplay",n:"Triplay lupuna 18mm",l:2440,w:1220,t:18},
  {g:"Drywall",n:"Drywall estándar 12.7mm",        l:2440,w:1220,t:12.7},
  {g:"Drywall",n:"Drywall resistente humedad 12.7mm",l:2440,w:1220,t:12.7},
  {g:"Drywall",n:"Drywall resistente fuego 15.9mm", l:2440,w:1220,t:15.9},
  {g:"Drywall",n:"Drywall 9.5mm",l:2440,w:1220,t:9.5},
  {g:"OSB",n:"OSB 9mm", l:2440,w:1220,t:9},
  {g:"OSB",n:"OSB 11mm",l:2440,w:1220,t:11},
  {g:"OSB",n:"OSB 15mm",l:2440,w:1220,t:15},
  {g:"Aglomerado",n:"Aglomerado 15mm",l:2440,w:1830,t:15},
  {g:"Aglomerado",n:"Aglomerado 18mm",l:2440,w:1830,t:18},
  {g:"Fenólico",n:"Fenólico 12mm",l:2440,w:1220,t:12},
  {g:"Fenólico",n:"Fenólico 18mm",l:2440,w:1220,t:18},
  {g:"Vidrio",n:"Vidrio float 4mm",     l:2440,w:1830,t:4},
  {g:"Vidrio",n:"Vidrio float 6mm",     l:2440,w:1830,t:6},
  {g:"Vidrio",n:"Vidrio templado 10mm", l:2440,w:1220,t:10},
  {g:"Policarbonato",n:"Policarbonato alveolar 6mm",l:6000,w:2100,t:6},
  {g:"Policarbonato",n:"Policarbonato sólido 4mm",  l:3050,w:2050,t:4},
  {g:"Acero",n:"Plancha LAF 0.9mm",l:2440,w:1220,t:0.9},
  {g:"Acero",n:"Plancha LAF 1.2mm",l:2440,w:1220,t:1.2},
  {g:"Acero",n:"Plancha LAF 2mm",  l:2440,w:1220,t:2},
  {g:"Aluminio",n:"Plancha aluminio 1mm",l:2440,w:1220,t:1},
  {g:"Aluminio",n:"Plancha aluminio 2mm",l:2440,w:1220,t:2},
  {g:"Personalizado",n:"Medida personalizada",l:null,w:null,t:null},
];

function getMaterialGroup() {
  const idx = document.getElementById('matPreset').value;
  if (idx === '') return '';
  return MATERIALS[+idx]?.g || '';
}

function buildMaterialSelect() {
  const sel = document.getElementById('matPreset');
  let html = '<option value="">— Seleccionar plancha —</option>';
  let lastG = '';
  MATERIALS.forEach((m, i) => {
    if (m.g !== lastG) { if (lastG) html += '</optgroup>'; html += `<optgroup label="${m.g}">`; lastG = m.g; }
    html += `<option value="${i}">${m.n}</option>`;
  });
  html += '</optgroup>';
  sel.innerHTML = html;
}

function applyPreset() {
  const idx = document.getElementById('matPreset').value;
  if (idx === '') return;
  const m = MATERIALS[+idx];
  const custom = m.l === null;
  ['matLength','matWidth','matThick'].forEach(id => {
    const el = document.getElementById(id); el.readOnly = !custom;
  });
  document.getElementById('matLength').value = custom ? '' : m.l;
  document.getElementById('matWidth').value  = custom ? '' : m.w;
  document.getElementById('matThick').value  = custom ? '' : m.t;
}
