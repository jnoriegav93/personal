// vistas.js — Render de la interfaz + componentes propios (modales/avisos). Mobile-first, dark mode.
import { icono } from './iconos.js';
import {
  estadoTarea, estadoBloque, estadoNivel, estadoAlerta,
  puedeMarcarHoy, nivelDesbloqueado, puntajeTotal, nivelActual, diasRequeridos,
  formatearRestante
} from './logica.js';

const app = () => document.getElementById('app');

// ---------- Utilidades ----------
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// Re-dispara la animacion de entrada de vista (efecto tipo movil).
export const transicionar = () => {
  const el = app();
  el.classList.remove('vista-anim');
  void el.offsetWidth; // forzar reflow
  el.classList.add('vista-anim');
};

// ---------- Componentes base ----------
// Color del progreso segun cuanto se ha llenado: rojo -> naranja -> verde.
const colorPorPorcentaje = (pct) => (pct >= 100 ? 'emerald' : pct >= 67 ? 'lime' : pct >= 34 ? 'orange' : 'rose');

const barraProgreso = (porcentaje, color = 'emerald') => `
  <div class="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
    <div class="h-full rounded-full bg-${color}-500 transition-all duration-500" style="width:${Math.min(100, porcentaje)}%"></div>
  </div>`;

const insignia = (texto, color = 'slate') => `
  <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold
    bg-${color}-100 text-${color}-700 dark:bg-${color}-500/15 dark:text-${color}-300">${texto}</span>`;

const cabecera = ({ titulo, subtitulo = '', volver = null, acciones = '' }) => `
  <header class="sticky top-0 z-20 backdrop-blur bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
    <div class="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
      ${volver ? `<button data-accion="${volver}" class="p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">${icono('flechaIzq', 'w-5 h-5')}</button>` : ''}
      <div class="flex-1 min-w-0">
        <h1 class="text-lg font-bold text-slate-900 dark:text-white truncate">${titulo}</h1>
        ${subtitulo ? `<p class="text-xs text-slate-500 dark:text-slate-400 truncate">${subtitulo}</p>` : ''}
      </div>
      <div class="flex items-center gap-1">${acciones}</div>
    </div>
  </header>`;

const botonAccion = (accion, id, texto, ico, clases) => `
  <button data-accion="${accion}" ${id ? `data-id="${id}"` : ''} class="${clases}">
    ${icono(ico, 'w-4 h-4')} ${texto}
  </button>`;

// Interruptor (switch) estilo gamificado.
const interruptor = (accion, activo, titulo, descripcion, ico, color = 'emerald') => `
  <button data-accion="${accion}" class="w-full flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
    <span class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${activo ? `bg-${color}-100 text-${color}-600 dark:bg-${color}-500/15 dark:text-${color}-400` : 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-400'}">
      ${icono(ico, 'w-5 h-5')}
    </span>
    <span class="flex-1 text-left min-w-0">
      <span class="block font-semibold text-sm text-slate-800 dark:text-slate-100">${titulo}</span>
      <span class="block text-xs text-slate-500 dark:text-slate-400">${descripcion}</span>
    </span>
    <span class="relative w-12 h-7 rounded-full transition-colors shrink-0 ${activo ? `bg-${color}-500` : 'bg-slate-300 dark:bg-slate-600'}">
      <span class="absolute top-1 ${activo ? 'left-6' : 'left-1'} w-5 h-5 rounded-full bg-white shadow transition-all"></span>
    </span>
  </button>`;

// ---------- Pantalla de carga ----------
export const pantallaCarga = () => {
  app().innerHTML = `
    <div class="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center">
      <div class="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/30 animate-pulse">
        ${icono('bolt', 'w-12 h-12 text-white')}
      </div>
      <div>
        <h1 class="text-2xl font-black tracking-tight text-slate-900 dark:text-white">JNV Gamification</h1>
        <p class="mt-2 text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
          <span class="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></span>
          Cargando elementos...
        </p>
      </div>
    </div>`;
};

// ---------- Vista: perfiles ----------
export const vistaPerfiles = (usuarios, acciones) => {
  const lista = usuarios.length
    ? usuarios.map((u) => `
      <li class="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div class="w-11 h-11 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          ${icono('usuario', 'w-6 h-6')}
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-slate-900 dark:text-white truncate">${esc(u.nombre)}</p>
          <p class="text-xs text-slate-500 dark:text-slate-400 truncate">${esc(u.correo) || 'Sin correo'}</p>
        </div>
        <button data-accion="eliminar-usuario" data-id="${u.id}" class="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10" title="Eliminar">
          ${icono('basura', 'w-5 h-5')}
        </button>
        <button data-accion="ingresar" data-id="${u.id}" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold shadow-sm">
          ${icono('ingresar', 'w-4 h-4')} Ingresar
        </button>
      </li>`).join('')
    : `<li class="text-center py-12 text-slate-400 dark:text-slate-500">
         ${icono('usuarios', 'w-12 h-12 mx-auto mb-3 opacity-50')}
         <p class="text-sm">Aun no hay perfiles. Crea el primero.</p>
       </li>`;

  app().innerHTML = `
    ${cabecera({ titulo: 'Perfiles', subtitulo: 'Selecciona o crea tu perfil' })}
    <main class="max-w-3xl mx-auto px-4 py-6 pb-28">
      <ul class="space-y-3">${lista}</ul>
    </main>
    <div class="fixed bottom-0 inset-x-0 p-4 bg-gradient-to-t from-white dark:from-slate-900 to-transparent">
      <div class="max-w-3xl mx-auto">
        <button data-accion="nuevo-perfil" class="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold shadow-lg">
          ${icono('agregar', 'w-5 h-5')} Nuevo perfil
        </button>
      </div>
    </div>`;
  enlazar(acciones);
};

// ---------- Vista: mundos ----------
export const vistaMundos = (usuario, mundos, mapasProgreso, acciones) => {
  const tarjetas = mundos.map((mundo) => {
    const total = puntajeTotal(mundo, mapasProgreso[mundo.id] || {});
    const na = nivelActual(mundo, mapasProgreso[mundo.id] || {});
    return `
      <button data-accion="abrir-mundo" data-id="${mundo.id}" class="group w-full text-left p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-${mundo.color || 'emerald'}-300 transition">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-${mundo.color || 'emerald'}-400 to-${mundo.color || 'emerald'}-600 flex items-center justify-center text-white shadow-lg shrink-0">
            ${icono(mundo.icono || 'globo', 'w-7 h-7')}
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-bold text-slate-900 dark:text-white">${esc(mundo.nombre)}</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">${esc(mundo.descripcion)}</p>
          </div>
        </div>
        <div class="mt-4 flex items-center gap-2">
          ${insignia(`${icono('estrella', 'w-3.5 h-3.5')} ${total} pts`, 'amber')}
          ${insignia(`Nivel ${na}`, mundo.color || 'emerald')}
          ${insignia(`${mundo.niveles.length} niveles`, 'slate')}
        </div>
      </button>`;
  }).join('');

  app().innerHTML = `
    ${cabecera({
      titulo: `Hola, ${esc(usuario.nombre.split(' ')[0])}`,
      subtitulo: 'Elige un mundo para entrenar',
      volver: 'cambiar-perfil',
      acciones: `<button data-accion="salir-perfil" class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300" title="Cambiar perfil">${icono('salir', 'w-5 h-5')}</button>`
    })}
    <main class="max-w-3xl mx-auto px-4 py-6 space-y-4">
      <h2 class="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-2">
        ${icono('globo', 'w-4 h-4')} Mundos
      </h2>
      ${tarjetas}
    </main>`;
  enlazar(acciones);
};

// ---------- Vista: niveles (acordeon, niveles bloqueados tambien desplegables) ----------
export const vistaNiveles = (usuario, mundo, mapaProgreso, nivelAbierto, acciones) => {
  const total = puntajeTotal(mundo, mapaProgreso);
  const naNum = nivelActual(mundo, mapaProgreso);

  const niveles = mundo.niveles.map((nivel, i) => {
    const desbloqueado = nivelDesbloqueado(mundo, i, mapaProgreso);
    const eNivel = estadoNivel(nivel, mapaProgreso);
    const abierto = nivelAbierto === nivel.id;
    const colorNivel = nivel.numero === naNum ? mundo.color || 'emerald' : 'slate';

    const requisitos = nivel.requisitos?.length ? `
      <div class="p-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50/60 dark:bg-slate-900/40">
        <p class="text-xs font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mb-2">
          ${icono('alerta', 'w-4 h-4')} Requisitos para subir de nivel
        </p>
        <ul class="list-disc list-inside space-y-1 text-xs text-slate-600 dark:text-slate-300">
          ${nivel.requisitos.map((r) => `<li>${esc(r)}</li>`).join('')}
        </ul>
      </div>` : '';

    const cuerpo = abierto ? `
      <div class="px-4 pb-4 space-y-3">
        ${nivel.descripcion ? `<p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">${esc(nivel.descripcion)}</p>` : ''}
        ${requisitos}
        ${nivel.bloques.map((bloque) => bloqueHTML(bloque, mapaProgreso, mundo.color || 'emerald', !desbloqueado)).join('')}
      </div>` : '';

    return `
      <section class="rounded-3xl border ${abierto ? 'border-' + colorNivel + '-300 dark:border-' + colorNivel + '-500/40' : 'border-slate-200 dark:border-slate-700'} bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
        <button data-accion="toggle-nivel" data-id="${nivel.id}" class="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50">
          <div class="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${desbloqueado ? `bg-${colorNivel}-100 dark:bg-${colorNivel}-500/15 text-${colorNivel}-600 dark:text-${colorNivel}-400` : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}">
            ${icono(desbloqueado ? (eNivel.completado ? 'trofeo' : 'fuego') : 'candado', 'w-6 h-6')}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-${colorNivel}-600 dark:text-${colorNivel}-400">NIVEL ${nivel.numero}</span>
              ${eNivel.completado ? insignia('Completado', 'emerald') : ''}
              ${!desbloqueado ? insignia('Bloqueado', 'slate') : ''}
            </div>
            <h3 class="font-bold text-slate-900 dark:text-white truncate">${esc(nivel.nombre)}</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">${eNivel.bloquesCompletos} de ${eNivel.totalBloques} bloques · ${eNivel.puntos} pts</p>
          </div>
          ${icono(abierto ? 'flechaArriba' : 'flechaAbajo', 'w-5 h-5 text-slate-400 shrink-0')}
        </button>
        ${cuerpo}
      </section>`;
  }).join('');

  app().innerHTML = `
    ${cabecera({
      titulo: esc(mundo.nombre),
      subtitulo: `${total} pts · Nivel actual ${naNum}`,
      volver: 'volver-mundos',
      acciones: `<button data-accion="config-mundo" class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300" title="Configurar mundo">${icono('config', 'w-5 h-5')}</button>`
    })}
    <main class="max-w-3xl mx-auto px-4 py-6 space-y-4 pb-12">
      <div class="p-4 rounded-3xl bg-gradient-to-br from-${mundo.color || 'emerald'}-500 to-${mundo.color || 'emerald'}-700 text-white shadow-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs uppercase tracking-wide opacity-80">Puntaje total</p>
            <p class="text-3xl font-black">${total}</p>
          </div>
          ${icono('estrella', 'w-10 h-10 opacity-80')}
        </div>
      </div>
      ${niveles}
    </main>`;
  enlazar(acciones);
};

// ---------- Bloque + tareas ----------
const bloqueHTML = (bloque, mapaProgreso, color, bloqueado) => {
  const e = estadoBloque(bloque, mapaProgreso);
  return `
    <div class="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div class="p-3 bg-slate-50 dark:bg-slate-900/50">
        <div class="flex items-center justify-between mb-2">
          <h4 class="font-semibold text-sm text-slate-800 dark:text-slate-100">${esc(bloque.nombre)}</h4>
          ${insignia(`${e.puntos}/${e.necesario}`, e.completado ? 'emerald' : 'slate')}
        </div>
        ${barraProgreso(e.porcentaje, colorPorPorcentaje(e.porcentaje))}
        <p class="mt-1.5 text-xs text-slate-500 dark:text-slate-400">${e.tareasCompletas} de ${e.totalTareas} tareas · ${e.porcentaje}%</p>
      </div>
      <div class="divide-y divide-slate-100 dark:divide-slate-700/60">
        ${bloque.tareas.map((t) => tareaHTML(t, mapaProgreso[t.id], color, bloqueado)).join('')}
      </div>
    </div>`;
};

const tareaHTML = (tarea, progreso, color, bloqueado) => {
  const e = estadoTarea(tarea, progreso);
  const alerta = estadoAlerta(tarea, progreso);

  const estadoIcono = bloqueado
    ? `<span class="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-400 flex items-center justify-center shrink-0">${icono('candado', 'w-5 h-5')}</span>`
    : e.completada
      ? `<span class="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">${icono('checkSolido', 'w-5 h-5')}</span>`
      : `<span class="w-9 h-9 rounded-xl bg-${color}-100 dark:bg-${color}-500/15 text-${color}-600 dark:text-${color}-400 flex items-center justify-center shrink-0">${icono('fuego', 'w-5 h-5')}</span>`;

  const iconoAlerta = (!bloqueado && alerta !== 'ninguno')
    ? `<span class="text-amber-500 animate-pulse" title="${alerta === 'rota' ? 'Racha en riesgo' : 'Por vencer hoy'}">${icono('alerta', 'w-4 h-4')}</span>`
    : '';

  return `
    <div class="p-3 flex items-start gap-3 ${e.completada && !bloqueado ? 'bg-emerald-50/50 dark:bg-emerald-500/5' : ''}">
      ${estadoIcono}
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-1.5">
          <p class="font-medium text-sm text-slate-800 dark:text-slate-100 ${e.completada && !bloqueado ? 'line-through opacity-70' : ''}">${esc(tarea.tarea)}</p>
          ${iconoAlerta}
        </div>
        <div class="flex flex-wrap items-center gap-1.5 mt-1">
          ${insignia(esc(tarea.tipo) || 'Ejercicio', 'slate')}
          <span class="text-xs text-slate-500 dark:text-slate-400">${esc(tarea.series)}</span>
          ${insignia(`+${tarea.puntos_obtenidos} pts`, 'amber')}
        </div>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Tareas realizadas: ${e.hechas} de ${e.requeridas} (${e.porcentaje}% completado)</p>
        <div class="mt-1.5">${barraProgreso(e.porcentaje, colorPorPorcentaje(e.porcentaje))}</div>
      </div>
      <button data-accion="abrir-detalle" data-id="${tarea.id}" class="self-center inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-${color}-500 hover:text-white shrink-0">
        ${icono('info', 'w-4 h-4')} Detalle
      </button>
    </div>`;
};

// ---------- Vista: detalle de tarea ----------
// Video dentro de un desplegable (oculto por defecto). El iframe usa carga
// diferida, asi no se descarga hasta que el usuario abre la seccion.
const youtubeEmbed = (url) => {
  if (!url) return '';
  const m = url.match(/(?:embed\/|v=|youtu\.be\/)([\w-]{11})/);
  if (!m) return '';
  return `
    <details class="group rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <summary class="cursor-pointer select-none list-none flex items-center gap-2 p-4 font-semibold text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50">
        ${icono('play', 'w-5 h-5 text-rose-500')}
        <span class="flex-1">Ver video de ejemplo</span>
        ${icono('flechaAbajo', 'w-5 h-5 text-slate-400 transition-transform group-open:rotate-180')}
      </summary>
      <div class="aspect-video border-t border-slate-200 dark:border-slate-700">
        <iframe class="w-full h-full" loading="lazy" src="https://www.youtube.com/embed/${m[1]}" title="video de ejemplo" frameborder="0" allowfullscreen></iframe>
      </div>
    </details>`;
};

// Imagen con boton para verla en pantalla completa.
const imagenConBoton = (url, alt) => `
  <div class="relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800">
    <img src="${esc(url)}" class="w-full object-cover aspect-[3/2]" alt="${alt}">
    <button data-accion="ver-imagen" data-id="${esc(url)}" class="absolute bottom-2 right-2 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs font-semibold backdrop-blur">
      ${icono('expandir', 'w-4 h-4')} Ver imagen
    </button>
  </div>`;

export const vistaDetalleTarea = (tarea, progreso, opciones, acciones) => {
  const { color = 'emerald', bloqueado = false, numeroNivel = '', modoPrueba = false } = opciones || {};
  const e = estadoTarea(tarea, progreso);
  const marcable = !bloqueado && (modoPrueba || puedeMarcarHoy(tarea, progreso));

  let zonaAccion = '';
  if (bloqueado) {
    zonaAccion = `
      <div class="p-6 rounded-2xl bg-slate-100 dark:bg-slate-700/50 border-2 border-dashed border-slate-300 dark:border-slate-600 text-center">
        ${icono('candado', 'w-10 h-10 mx-auto text-slate-400')}
        <p class="mt-2 font-bold text-slate-600 dark:text-slate-300">Se desbloquea con el nivel ${numeroNivel}</p>
        <p class="text-sm text-slate-400 dark:text-slate-500 mt-1">Completa los niveles anteriores para habilitar este ejercicio.</p>
      </div>`;
  } else if (e.completada) {
    zonaAccion = `
      <div class="p-5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-center">
        ${icono('trofeo', 'w-10 h-10 mx-auto mb-2 text-emerald-600 dark:text-emerald-400')}
        <p class="font-bold text-lg text-emerald-700 dark:text-emerald-300">Ejercicio completado</p>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Lograste las ${e.requeridas} sesiones requeridas.</p>
      </div>`;
  } else if (marcable) {
    zonaAccion = `
      <div class="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
        ${modoPrueba ? `<p class="text-center mb-2">${insignia(`${icono('bolt', 'w-3.5 h-3.5')} Modo de prueba: sin cooldown`, 'amber')}</p>` : ''}
        <p class="text-center text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">Desliza para completar la sesion de hoy</p>
        <div class="relative h-14 rounded-2xl bg-slate-100 dark:bg-slate-700 overflow-hidden select-none">
          <div id="slider-relleno" class="absolute inset-y-0 left-0 bg-${color}-500/30 transition-[width] duration-75" style="width:0%"></div>
          <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span id="slider-texto" class="text-sm font-bold text-${color}-700 dark:text-${color}-300 flex items-center gap-1">
              ${icono('flechaIzq', 'w-4 h-4 rotate-180')} Desliza para completar
            </span>
          </div>
          <input id="slider-input" type="range" min="0" max="100" value="0"
            class="absolute inset-0 w-full h-full opacity-0 cursor-grab active:cursor-grabbing" />
        </div>
      </div>`;
  } else {
    zonaAccion = `
      <div class="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 shadow-sm">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
            ${icono('checkSolido', 'w-6 h-6')}
            <span class="font-bold">Completado</span>
          </div>
          <button data-accion="detalle-anular" data-id="${tarea.id}" class="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-500/40 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center shrink-0" title="Anular sesion de hoy">
            ${icono('cerrar', 'w-5 h-5')}
          </button>
        </div>
        <div class="mt-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          ${icono('reloj', 'w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0')}
          <p>Podras continuar con este ejercicio a partir de las 7am del siguiente dia, en
            <span id="cuenta-regresiva" class="font-bold text-emerald-700 dark:text-emerald-300">--</span></p>
        </div>
      </div>`;
  }

  app().innerHTML = `
    ${cabecera({ titulo: esc(tarea.tarea), subtitulo: esc(tarea.tipo) || 'Ejercicio', volver: 'detalle-volver' })}
    <main class="max-w-3xl mx-auto px-4 py-6 space-y-5 pb-12">
      <div class="grid grid-cols-2 gap-3">
        ${tarea.img_1 ? imagenConBoton(tarea.img_1, 'ejemplo 1') : ''}
        ${tarea.img_2 ? imagenConBoton(tarea.img_2, 'ejemplo 2') : ''}
      </div>
      ${youtubeEmbed(tarea.vid_1)}

      <div class="flex flex-wrap gap-2">
        ${insignia(`Series: ${esc(tarea.series)}`, 'slate')}
        ${insignia(`+${tarea.puntos_obtenidos} pts/dia`, 'amber')}
        ${insignia(`${diasRequeridos(tarea)} dias`, color)}
        ${insignia(`Cooldown: ${esc(tarea.cooldown)}`, 'slate')}
      </div>

      ${tarea.descripcion ? `<p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">${esc(tarea.descripcion)}</p>` : ''}

      <div class="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <p class="text-xs text-slate-500 dark:text-slate-400 mb-2">Tareas realizadas: ${e.hechas} de ${e.requeridas} (${e.porcentaje}% completado)</p>
        ${barraProgreso(e.porcentaje, colorPorPorcentaje(e.porcentaje))}
      </div>

      ${zonaAccion}
    </main>`;
  enlazar(acciones);
};

// ---------- Vista: configuracion del mundo (CRUD) ----------
export const vistaConfigMundo = (mundo, expand, opciones, acciones) => {
  const { tema = 'light', modoPrueba = false } = opciones || {};
  const niveles = mundo.niveles.map((nivel) => {
    const abierto = expand.niveles.has(nivel.id);
    const bloques = abierto ? nivel.bloques.map((bloque) => {
      const bAbierto = expand.bloques.has(`${nivel.id}::${bloque.id}`);
      const tareas = bAbierto ? `
        <div class="pl-3 mt-2 space-y-1.5 border-l-2 border-slate-200 dark:border-slate-700">
          ${botonAccion('config-nueva-tarea', `${nivel.id}::${bloque.id}`, 'Nueva tarea', 'agregar',
            'w-full justify-center inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold border border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-emerald-400 hover:text-emerald-500')}
          ${bloque.tareas.map((tarea) => `
            <div class="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50">
              <span class="text-slate-400">${icono('bolt', 'w-4 h-4')}</span>
              <span class="flex-1 min-w-0 text-sm text-slate-700 dark:text-slate-200 truncate">${esc(tarea.tarea)}</span>
              <button data-accion="config-editar-tarea" data-id="${nivel.id}::${bloque.id}::${tarea.id}" class="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-700">${icono('editar', 'w-4 h-4')}</button>
            </div>`).join('')}
        </div>` : '';
      return `
        <div class="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
          <div class="flex items-center gap-2 p-3">
            <button data-accion="config-toggle-bloque" data-id="${nivel.id}::${bloque.id}" class="text-slate-400 shrink-0">${icono(bAbierto ? 'flechaArriba' : 'flechaAbajo', 'w-5 h-5')}</button>
            <span class="flex-1 min-w-0 font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">${esc(bloque.nombre)}</span>
            ${insignia(`${bloque.tareas.length} tareas`, 'slate')}
            <button data-accion="config-editar-bloque" data-id="${nivel.id}::${bloque.id}" class="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-700">${icono('editar', 'w-4 h-4')}</button>
          </div>
          ${bAbierto ? `<div class="px-3 pb-3">${tareas}</div>` : ''}
        </div>`;
    }).join('') : '';

    return `
      <div class="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
        <div class="flex items-center gap-2 p-4">
          <button data-accion="config-toggle-nivel" data-id="${nivel.id}" class="text-slate-400 shrink-0">${icono(abierto ? 'flechaArriba' : 'flechaAbajo', 'w-5 h-5')}</button>
          <div class="flex-1 min-w-0">
            <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400">NIVEL ${nivel.numero}</span>
            <p class="font-bold text-slate-900 dark:text-white truncate">${esc(nivel.nombre)}</p>
          </div>
          ${insignia(`${nivel.bloques.length} bloques`, 'slate')}
          <button data-accion="config-editar-nivel" data-id="${nivel.id}" class="p-2 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-700">${icono('editar', 'w-5 h-5')}</button>
        </div>
        ${abierto ? `
          <div class="px-4 pb-4 space-y-2.5">
            ${botonAccion('config-nuevo-bloque', nivel.id, 'Nuevo bloque', 'agregar',
              'w-full justify-center inline-flex items-center gap-1 px-3 py-2.5 rounded-xl text-sm font-semibold border border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-emerald-400 hover:text-emerald-500')}
            ${bloques}
          </div>` : ''}
      </div>`;
  }).join('');

  app().innerHTML = `
    ${cabecera({ titulo: 'Configurar mundo', subtitulo: esc(mundo.nombre), volver: 'config-volver' })}
    <main class="max-w-3xl mx-auto px-4 py-6 space-y-5 pb-12">
      <div class="space-y-2">
        ${interruptor('config-toggle-tema', tema === 'dark', 'Modo oscuro', 'Cambia el tema de toda la app', tema === 'dark' ? 'luna' : 'sol', 'violet')}
        ${interruptor('config-toggle-prueba', modoPrueba, 'Modo de prueba', 'Libera el deslizador sin esperar el cooldown', 'bolt', 'amber')}
      </div>

      <div class="grid grid-cols-3 gap-2">
        ${botonAccion('config-importar', null, 'Importar', 'subir', 'justify-center inline-flex items-center gap-1.5 px-3 py-3 rounded-2xl text-xs font-semibold bg-sky-500 hover:bg-sky-600 text-white shadow-sm')}
        ${botonAccion('config-exportar', null, 'Exportar', 'descargar', 'justify-center inline-flex items-center gap-1.5 px-3 py-3 rounded-2xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm')}
        ${botonAccion('config-restaurar', null, 'Restaurar', 'config', 'justify-center inline-flex items-center gap-1.5 px-3 py-3 rounded-2xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-sm')}
      </div>

      <div class="space-y-3">
        ${botonAccion('config-nuevo-nivel', null, 'Nuevo nivel', 'agregar',
          'w-full justify-center inline-flex items-center gap-1.5 px-4 py-3 rounded-2xl text-sm font-bold border-2 border-dashed border-emerald-300 dark:border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10')}
        ${niveles || '<p class="text-center text-sm text-slate-400 py-8">Aun no hay niveles. Crea el primero.</p>'}
      </div>
    </main>`;
  enlazar(acciones);
};

// ============================================================
//  Componentes propios: dialogos, avisos, confirmaciones, toast
// ============================================================
const crearDialogo = (innerHTML, ancho = 'sm:max-w-md') => {
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm opacity-0 transition-opacity duration-200';
  overlay.innerHTML = `<div class="dlg-card w-full ${ancho} bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[92vh] overflow-y-auto translate-y-8 sm:translate-y-0 sm:scale-95 transition-all duration-200">${innerHTML}</div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => {
    overlay.classList.remove('opacity-0');
    const c = overlay.querySelector('.dlg-card');
    c.classList.remove('translate-y-8', 'sm:scale-95');
  });
  return overlay;
};

const cerrarDialogo = (overlay) => {
  overlay.classList.add('opacity-0');
  const c = overlay.querySelector('.dlg-card');
  c.classList.add('translate-y-8', 'sm:scale-95');
  setTimeout(() => overlay.remove(), 200);
};

const ESTILO_TIPO = {
  success: { color: 'emerald', ico: 'checkSolido' },
  error: { color: 'rose', ico: 'cerrar' },
  info: { color: 'sky', ico: 'info' },
  warning: { color: 'amber', ico: 'alerta' }
};

// Aviso con un solo boton (Aceptar).
export const aviso = (titulo, mensaje = '', tipo = 'info') => new Promise((resolver) => {
  const t = ESTILO_TIPO[tipo] || ESTILO_TIPO.info;
  const overlay = crearDialogo(`
    <div class="p-6 text-center">
      <div class="w-14 h-14 mx-auto rounded-2xl bg-${t.color}-100 dark:bg-${t.color}-500/15 text-${t.color}-600 dark:text-${t.color}-400 flex items-center justify-center">${icono(t.ico, 'w-7 h-7')}</div>
      <h3 class="mt-4 text-lg font-bold">${esc(titulo)}</h3>
      ${mensaje ? `<p class="mt-1 text-sm text-slate-500 dark:text-slate-400">${esc(mensaje)}</p>` : ''}
      <button data-ok class="mt-5 w-full py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold">Aceptar</button>
    </div>`);
  overlay.querySelector('[data-ok]').onclick = () => { cerrarDialogo(overlay); resolver(); };
});

// Confirmacion (Confirmar / Cancelar). Resuelve a boolean.
export const confirmar = (titulo, texto = '') => new Promise((resolver) => {
  const overlay = crearDialogo(`
    <div class="p-6 text-center">
      <div class="w-14 h-14 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">${icono('alerta', 'w-7 h-7')}</div>
      <h3 class="mt-4 text-lg font-bold">${esc(titulo)}</h3>
      ${texto ? `<p class="mt-1 text-sm text-slate-500 dark:text-slate-400">${esc(texto)}</p>` : ''}
      <div class="mt-5 grid grid-cols-2 gap-2">
        <button data-no class="py-3 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold">Cancelar</button>
        <button data-si class="py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-semibold">Confirmar</button>
      </div>
    </div>`);
  const fin = (v) => { cerrarDialogo(overlay); resolver(v); };
  overlay.querySelector('[data-si]').onclick = () => fin(true);
  overlay.querySelector('[data-no]').onclick = () => fin(false);
  overlay.addEventListener('click', (ev) => { if (ev.target === overlay) fin(false); });
});

// Toast transitorio (feedback rapido, no requiere accion).
export const toast = (mensaje, tipo = 'success') => {
  const t = ESTILO_TIPO[tipo] || ESTILO_TIPO.success;
  const cont = document.createElement('div');
  cont.className = 'fixed top-4 inset-x-0 z-[60] flex justify-center px-4 pointer-events-none';
  cont.innerHTML = `<div class="caja pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-${t.color}-200 dark:border-${t.color}-500/40 shadow-xl text-sm font-semibold text-slate-800 dark:text-slate-100 -translate-y-6 opacity-0 transition-all duration-200">
    <span class="text-${t.color}-500">${icono(t.ico, 'w-5 h-5')}</span>${esc(mensaje)}</div>`;
  document.body.appendChild(cont);
  const caja = cont.querySelector('.caja');
  requestAnimationFrame(() => caja.classList.remove('-translate-y-6', 'opacity-0'));
  setTimeout(() => {
    caja.classList.add('-translate-y-6', 'opacity-0');
    setTimeout(() => cont.remove(), 200);
  }, 1800);
};

// ---------- Formularios (modales propios) ----------
const campo = (id, etiqueta, valor = '', tipo = 'text') => `
  <label class="block text-left mb-3">
    <span class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">${etiqueta}</span>
    <input id="${id}" type="${tipo}" value="${esc(valor)}"
      class="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm">
  </label>`;

const area = (id, etiqueta, valor = '', filas = 3) => `
  <label class="block text-left mb-3">
    <span class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">${etiqueta}</span>
    <textarea id="${id}" rows="${filas}"
      class="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm">${esc(valor)}</textarea>
  </label>`;

const val = (id) => (document.getElementById(id)?.value ?? '').trim();
const num = (id) => Number(document.getElementById(id)?.value || 0);
const mostrarError = (msg) => {
  const e = document.querySelector('[data-error]');
  if (e) { e.textContent = msg; e.classList.remove('hidden'); }
};

// Base de formulario. `leer` devuelve datos o false (si invalido). Resuelve a
// { accion:'guardar', datos } | { accion:'eliminar' } | null
const dialogoFormulario = ({ titulo, cuerpo, edicion = false, leer, ancho = 'sm:max-w-md' }) =>
  new Promise((resolver) => {
    const overlay = crearDialogo(`
      <div class="p-5">
        <h3 class="text-lg font-bold mb-4">${esc(titulo)}</h3>
        <div>${cuerpo}</div>
        <p data-error class="hidden mb-2 text-sm text-rose-500"></p>
        <div class="flex flex-col gap-2">
          <div class="grid grid-cols-2 gap-2">
            <button data-cancel class="py-3 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold">Cancelar</button>
            <button data-save class="py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold">Guardar</button>
          </div>
          ${edicion ? `<button data-del class="py-3 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold inline-flex items-center justify-center gap-1">${icono('basura', 'w-4 h-4')} Eliminar</button>` : ''}
        </div>
      </div>`, ancho);
    const fin = (v) => { cerrarDialogo(overlay); resolver(v); };
    overlay.querySelector('[data-cancel]').onclick = () => fin(null);
    if (edicion) overlay.querySelector('[data-del]').onclick = () => fin({ accion: 'eliminar' });
    overlay.querySelector('[data-save]').onclick = () => {
      const datos = leer();
      if (datos === false) return;
      fin({ accion: 'guardar', datos });
    };
  });

export const modalNuevoPerfil = () => dialogoFormulario({
  titulo: 'Nuevo perfil',
  cuerpo: campo('m-nombre', 'Nombre') + campo('m-correo', 'Correo', '', 'email'),
  leer: () => {
    if (!val('m-nombre')) { mostrarError('El nombre es obligatorio'); return false; }
    return { nombre: val('m-nombre'), correo: val('m-correo') };
  }
}).then((r) => (r?.accion === 'guardar' ? r.datos : null));

export const modalNivel = (nivel = null) => dialogoFormulario({
  titulo: nivel ? 'Editar nivel' : 'Nuevo nivel',
  edicion: !!nivel,
  cuerpo:
    campo('m-numero', 'Numero de nivel', nivel?.numero ?? '', 'number') +
    campo('m-nombre', 'Nombre', nivel?.nombre ?? '') +
    campo('m-color', 'Color (emerald, sky, rose, amber, violet)', nivel?.color ?? 'emerald') +
    area('m-desc', 'Descripcion', nivel?.descripcion ?? '') +
    area('m-req', 'Requisitos (uno por linea)', (nivel?.requisitos || []).join('\n')),
  leer: () => {
    if (!val('m-nombre')) { mostrarError('El nombre es obligatorio'); return false; }
    return {
      numero: num('m-numero'),
      nombre: val('m-nombre'),
      color: val('m-color') || 'emerald',
      descripcion: val('m-desc'),
      requisitos: val('m-req').split('\n').map((x) => x.trim()).filter(Boolean)
    };
  }
});

export const modalBloque = (bloque = null) => dialogoFormulario({
  titulo: bloque ? 'Editar bloque' : 'Nuevo bloque',
  edicion: !!bloque,
  cuerpo:
    campo('m-nombre', 'Nombre del bloque', bloque?.nombre ?? '') +
    campo('m-puntaje', 'Puntaje necesario', bloque?.puntaje_necesario ?? 0, 'number'),
  leer: () => {
    if (!val('m-nombre')) { mostrarError('El nombre es obligatorio'); return false; }
    return { nombre: val('m-nombre'), puntaje_necesario: num('m-puntaje') };
  }
});

export const modalTarea = (tarea = null) => dialogoFormulario({
  titulo: tarea ? 'Editar tarea' : 'Nueva tarea',
  edicion: !!tarea,
  ancho: 'sm:max-w-lg',
  cuerpo:
    campo('m-tarea', 'Nombre de la tarea', tarea?.tarea ?? '') +
    campo('m-tipo', 'Tipo (Empuje, Traccion, Piernas, Core...)', tarea?.tipo ?? '') +
    `<div class="grid grid-cols-2 gap-2">
      <div>${campo('m-series', 'Series', tarea?.series ?? '3x15')}</div>
      <div>${campo('m-cooldown', 'Cooldown', tarea?.cooldown ?? '07:00 a.m.')}</div>
      <div>${campo('m-obt', 'Puntos por dia', tarea?.puntos_obtenidos ?? 100, 'number')}</div>
      <div>${campo('m-req', 'Puntos requeridos', tarea?.puntos_requeridos ?? 400, 'number')}</div>
    </div>` +
    campo('m-img1', 'Imagen 1 (url)', tarea?.img_1 ?? '') +
    campo('m-img2', 'Imagen 2 (url)', tarea?.img_2 ?? '') +
    campo('m-vid', 'Video YouTube (url)', tarea?.vid_1 ?? '') +
    area('m-desc', 'Descripcion', tarea?.descripcion ?? ''),
  leer: () => {
    if (!val('m-tarea')) { mostrarError('El nombre es obligatorio'); return false; }
    return {
      tarea: val('m-tarea'),
      tipo: val('m-tipo'),
      series: val('m-series'),
      cooldown: val('m-cooldown') || '07:00 a.m.',
      puntos_obtenidos: num('m-obt') || 100,
      puntos_requeridos: num('m-req') || 400,
      img_1: val('m-img1'),
      img_2: val('m-img2'),
      vid_1: val('m-vid'),
      descripcion: val('m-desc')
    };
  }
});

// ---------- Lightbox: ver imagen en pantalla completa ----------
export const lightbox = (url) => {
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4 opacity-0 transition-opacity duration-200';
  overlay.innerHTML = `
    <button data-cerrar class="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center">${icono('cerrar', 'w-6 h-6')}</button>
    <img src="${esc(url)}" class="max-w-full max-h-full rounded-2xl object-contain shadow-2xl" alt="imagen ampliada">`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.remove('opacity-0'));
  const cerrar = () => { overlay.classList.add('opacity-0'); setTimeout(() => overlay.remove(), 200); };
  overlay.querySelector('[data-cerrar]').onclick = cerrar;
  overlay.addEventListener('click', (ev) => { if (ev.target === overlay) cerrar(); });
};

// ---------- Slider: deslizar para completar ----------
export const cablearSlider = (alCompletar) => {
  const input = document.getElementById('slider-input');
  const relleno = document.getElementById('slider-relleno');
  const texto = document.getElementById('slider-texto');
  if (!input) return;
  const pintar = (v) => { if (relleno) relleno.style.width = `${v}%`; };
  input.addEventListener('input', () => pintar(input.value));
  input.addEventListener('change', () => {
    if (Number(input.value) >= 95) {
      pintar(100);
      if (texto) texto.textContent = 'Completado';
      alCompletar();
    } else {
      input.value = 0;
      pintar(0);
    }
  });
};

// ---------- Cuenta regresiva ----------
export const iniciarCuentaRegresiva = (objetivo, alLlegar) => {
  const el = document.getElementById('cuenta-regresiva');
  if (!el || !objetivo) return null;
  const actualizar = () => {
    const restante = objetivo.getTime() - Date.now();
    if (restante <= 0) { el.textContent = 'disponible ahora'; alLlegar?.(); return; }
    el.textContent = formatearRestante(restante).texto;
  };
  actualizar();
  return setInterval(actualizar, 1000);
};

// ---------- Enlazado de eventos (delegacion) ----------
const enlazar = (acciones) => {
  app().querySelectorAll('[data-accion]').forEach((el) => {
    const nombre = el.getAttribute('data-accion');
    if (acciones[nombre]) {
      el.addEventListener('click', () => acciones[nombre](el.getAttribute('data-id')));
    }
  });
};
