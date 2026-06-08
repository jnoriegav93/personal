// app.js — Orquestador principal de la aplicacion.
import * as db from './db.js';
import * as ui from './vistas.js';
import { estadoTarea, puedeMarcarHoy, hoyClave, proximaApertura, nivelDesbloqueado } from './logica.js';

const RUTA_CONFIG = './data/carga_inicial.json';

const estado = {
  usuario: null,
  mundoBase: null,    // config cargada (carga_inicial)
  mundoActual: null,  // mundo abierto
  mapaProgreso: {},   // { tareaId: registroProgreso }
  nivelAbierto: null,
  tareaDetalle: null, // tareaId en vista detalle
  expand: { niveles: new Set(), bloques: new Set() }, // expandidos en config
  timer: null,        // cuenta regresiva
  tema: 'light',
  modoPrueba: false   // libera el slider sin cooldown
};

const limpiarTimer = () => { if (estado.timer) { clearInterval(estado.timer); estado.timer = null; } };

// ---------- Tema (claro/oscuro) ----------
// Tailwind alterna estilos por la clase 'dark' en <html>: no se requiere re-render.
const aplicarTema = (tema) => {
  estado.tema = tema;
  document.documentElement.classList.toggle('dark', tema === 'dark');
  localStorage.setItem('jnv_tema', tema);
};

const alternarTema = () => aplicarTema(estado.tema === 'dark' ? 'light' : 'dark');

const alternarModoPrueba = () => {
  estado.modoPrueba = !estado.modoPrueba;
  localStorage.setItem('jnv_modo_prueba', estado.modoPrueba ? '1' : '0');
};

// ---------- Carga inicial / seed ----------
const cargarConfigInicial = async () => {
  const resp = await fetch(RUTA_CONFIG);
  if (!resp.ok) throw new Error('No se pudo cargar la configuracion inicial');
  return resp.json();
};

const obtenerConfigMundo = async (usuarioId, mundoSemilla) => {
  let guardado = await db.obtenerMundo(usuarioId, mundoSemilla.id);
  if (!guardado) {
    await db.guardarMundo(usuarioId, mundoSemilla);
    guardado = await db.obtenerMundo(usuarioId, mundoSemilla.id);
  }
  return guardado;
};

const cargarMapaProgreso = async (usuarioId) => {
  const registros = await db.listarProgresoUsuario(usuarioId);
  const mapa = {};
  registros.forEach((r) => { mapa[r.tareaId] = r; });
  return mapa;
};

const guardarMundoActual = () => db.guardarMundo(estado.usuario.id, estado.mundoActual);

// ---------- Navegacion (con transicion tipo movil) ----------
const irAPerfiles = async () => {
  limpiarTimer();
  estado.tareaDetalle = null;
  const usuarios = await db.listarUsuarios();
  ui.vistaPerfiles(usuarios, accionesPerfiles);
  ui.transicionar();
};

const irAMundos = async () => {
  limpiarTimer();
  estado.tareaDetalle = null;
  const config = estado.mundoBase;
  await Promise.all(config.mundos.map((m) => obtenerConfigMundo(estado.usuario.id, m)));
  const mapa = await cargarMapaProgreso(estado.usuario.id);
  const mapas = {};
  config.mundos.forEach((m) => { mapas[m.id] = mapa; });
  ui.vistaMundos(estado.usuario, config.mundos, mapas, accionesMundos);
  ui.transicionar();
};

const irANiveles = async (mundoId) => {
  limpiarTimer();
  estado.tareaDetalle = null;
  const semilla = estado.mundoBase.mundos.find((m) => m.id === mundoId);
  estado.mundoActual = await obtenerConfigMundo(estado.usuario.id, semilla);
  estado.mapaProgreso = await cargarMapaProgreso(estado.usuario.id);
  renderNiveles();
  ui.transicionar();
};

// Re-render de niveles sin transicion (toggles internos del acordeon).
const renderNiveles = () => {
  limpiarTimer();
  ui.vistaNiveles(estado.usuario, estado.mundoActual, estado.mapaProgreso, estado.nivelAbierto, accionesNiveles);
};

// ---------- Buscar elementos en el mundo actual ----------
const buscarTarea = (tareaId) => {
  for (const nivel of estado.mundoActual.niveles) {
    for (const bloque of nivel.bloques) {
      const t = bloque.tareas.find((x) => x.id === tareaId);
      if (t) return t;
    }
  }
  return null;
};

// Devuelve { nivel, indice } del nivel que contiene la tarea.
const infoNivelTarea = (tareaId) => {
  for (let i = 0; i < estado.mundoActual.niveles.length; i += 1) {
    const nivel = estado.mundoActual.niveles[i];
    if (nivel.bloques.some((b) => b.tareas.some((t) => t.id === tareaId))) return { nivel, indice: i };
  }
  return null;
};

const colorMundo = () => estado.mundoActual?.color || 'emerald';

// ---------- Vista detalle de tarea ----------
const abrirDetalle = (tareaId) => {
  estado.tareaDetalle = tareaId;
  renderDetalle();
  ui.transicionar();
};

const renderDetalle = () => {
  limpiarTimer();
  const tarea = buscarTarea(estado.tareaDetalle);
  const progreso = estado.mapaProgreso[estado.tareaDetalle];
  const info = infoNivelTarea(estado.tareaDetalle);
  const bloqueado = info ? !nivelDesbloqueado(estado.mundoActual, info.indice, estado.mapaProgreso) : false;

  ui.vistaDetalleTarea(tarea, progreso, { color: colorMundo(), bloqueado, numeroNivel: info?.nivel.numero, modoPrueba: estado.modoPrueba }, accionesDetalle);

  if (bloqueado) return; // slider bloqueado por nivel
  if (estado.modoPrueba || puedeMarcarHoy(tarea, progreso)) {
    ui.cablearSlider(() => completarSesion(tarea.id));
  } else {
    const objetivo = proximaApertura(tarea, progreso);
    if (objetivo) estado.timer = ui.iniciarCuentaRegresiva(objetivo, () => renderDetalle());
  }
};

const registrarMarca = async (tareaId) => {
  const previo = estado.mapaProgreso[tareaId] || { marcas: [] };
  const marcas = [...(previo.marcas || []), hoyClave()];
  await db.guardarProgreso(estado.usuario.id, tareaId, { marcas, actualizado: new Date().toISOString() });
  estado.mapaProgreso = await cargarMapaProgreso(estado.usuario.id);
};

const completarSesion = async (tareaId) => {
  const tarea = buscarTarea(tareaId);
  const e0 = estadoTarea(tarea, estado.mapaProgreso[tareaId]);
  if (e0.completada) return; // ya alcanzo las sesiones requeridas
  if (!estado.modoPrueba && !puedeMarcarHoy(tarea, estado.mapaProgreso[tareaId])) return;
  await registrarMarca(tareaId);
  const e = estadoTarea(tarea, estado.mapaProgreso[tareaId]);
  ui.toast(e.completada ? `Ejercicio completado! +${tarea.puntos_obtenidos}` : `Sesion de hoy +${tarea.puntos_obtenidos}`);
  renderDetalle();
};

const anularSesion = async (tareaId) => {
  const ok = await ui.confirmar('Anular la sesion de hoy?', 'Se quitara la marca de hoy de este ejercicio.');
  if (!ok) return;
  const previo = estado.mapaProgreso[tareaId] || { marcas: [] };
  const marcas = (previo.marcas || []).filter((d) => d !== hoyClave());
  await db.guardarProgreso(estado.usuario.id, tareaId, { marcas, actualizado: new Date().toISOString() });
  estado.mapaProgreso = await cargarMapaProgreso(estado.usuario.id);
  ui.toast('Sesion anulada', 'info');
  renderDetalle();
};

// ---------- Configuracion del mundo (vista CRUD) ----------
const abrirConfig = () => {
  limpiarTimer();
  estado.tareaDetalle = null;
  renderConfig();
  ui.transicionar();
};

// Re-render de config sin transicion (toggles / CRUD).
const renderConfig = () => ui.vistaConfigMundo(
  estado.mundoActual, estado.expand,
  { tema: estado.tema, modoPrueba: estado.modoPrueba },
  accionesConfig
);

const genId = (prefijo) => `${prefijo}-${(crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2, 7))}`;

const ubicarNivel = (nivelId) => estado.mundoActual.niveles.find((n) => n.id === nivelId);
const ubicarBloque = (nivelId, bloqueId) => ubicarNivel(nivelId)?.bloques.find((b) => b.id === bloqueId);

const guardarYRenderConfig = async () => { await guardarMundoActual(); renderConfig(); };

// --- Niveles ---
const nuevoNivel = async () => {
  const r = await ui.modalNivel(null);
  if (r?.accion !== 'guardar') return;
  estado.mundoActual.niveles.push({
    id: genId('nivel'),
    numero: r.datos.numero || estado.mundoActual.niveles.length + 1,
    nombre: r.datos.nombre,
    color: r.datos.color,
    descripcion: r.datos.descripcion,
    requisitos: r.datos.requisitos,
    bloques: []
  });
  await guardarYRenderConfig();
};

const editarNivel = async (nivelId) => {
  const nivel = ubicarNivel(nivelId);
  const r = await ui.modalNivel(nivel);
  if (!r) return;
  if (r.accion === 'eliminar') {
    const detalle = nivel.bloques.length
      ? `Este nivel tiene ${nivel.bloques.length} bloque(s) con sus tareas. Se eliminara TODA esa secuencia.`
      : 'Se eliminara este nivel.';
    if (!(await ui.confirmar('Eliminar nivel?', detalle))) return;
    estado.mundoActual.niveles = estado.mundoActual.niveles.filter((n) => n.id !== nivelId);
  } else {
    Object.assign(nivel, {
      numero: r.datos.numero || nivel.numero,
      nombre: r.datos.nombre,
      color: r.datos.color,
      descripcion: r.datos.descripcion,
      requisitos: r.datos.requisitos
    });
  }
  await guardarYRenderConfig();
};

// --- Bloques ---
const nuevoBloque = async (nivelId) => {
  const r = await ui.modalBloque(null);
  if (r?.accion !== 'guardar') return;
  ubicarNivel(nivelId).bloques.push({
    id: genId('bloque'),
    nombre: r.datos.nombre,
    puntaje_necesario: r.datos.puntaje_necesario,
    tareas: []
  });
  await guardarYRenderConfig();
};

const editarBloque = async (compuesto) => {
  const [nivelId, bloqueId] = compuesto.split('::');
  const nivel = ubicarNivel(nivelId);
  const bloque = ubicarBloque(nivelId, bloqueId);
  const r = await ui.modalBloque(bloque);
  if (!r) return;
  if (r.accion === 'eliminar') {
    const detalle = bloque.tareas.length
      ? `Este bloque tiene ${bloque.tareas.length} tarea(s). Se eliminara TODA esa secuencia.`
      : 'Se eliminara este bloque.';
    if (!(await ui.confirmar('Eliminar bloque?', detalle))) return;
    nivel.bloques = nivel.bloques.filter((b) => b.id !== bloqueId);
  } else {
    Object.assign(bloque, { nombre: r.datos.nombre, puntaje_necesario: r.datos.puntaje_necesario });
  }
  await guardarYRenderConfig();
};

// --- Tareas ---
const nuevaTarea = async (compuesto) => {
  const [nivelId, bloqueId] = compuesto.split('::');
  const r = await ui.modalTarea(null);
  if (r?.accion !== 'guardar') return;
  ubicarBloque(nivelId, bloqueId).tareas.push({ id: genId('tarea'), ...r.datos });
  await guardarYRenderConfig();
};

const editarTarea = async (compuesto) => {
  const [nivelId, bloqueId, tareaId] = compuesto.split('::');
  const bloque = ubicarBloque(nivelId, bloqueId);
  const tarea = bloque.tareas.find((t) => t.id === tareaId);
  const r = await ui.modalTarea(tarea);
  if (!r) return;
  if (r.accion === 'eliminar') {
    if (!(await ui.confirmar('Eliminar tarea?', 'Se eliminara esta tarea.'))) return;
    bloque.tareas = bloque.tareas.filter((t) => t.id !== tareaId);
  } else {
    Object.assign(tarea, r.datos);
  }
  await guardarYRenderConfig();
};

// ---------- Export / import / restaurar ----------
const exportarConfig = async () => {
  const datos = {
    version: estado.mundoBase.version,
    usuario: { nombre: estado.usuario.nombre, correo: estado.usuario.correo },
    mundo: estado.mundoActual,
    progreso: await db.listarProgresoUsuario(estado.usuario.id)
  };
  const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `jnv_${estado.usuario.nombre}_${estado.mundoActual.id}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

const importarConfig = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.onchange = async () => {
    const archivo = input.files[0];
    if (!archivo) return;
    try {
      const datos = JSON.parse(await archivo.text());
      if (datos.mundo) {
        await db.guardarMundo(estado.usuario.id, datos.mundo);
        estado.mundoActual = await db.obtenerMundo(estado.usuario.id, datos.mundo.id);
      }
      if (Array.isArray(datos.progreso)) {
        await Promise.all(datos.progreso.map((p) =>
          db.guardarProgreso(estado.usuario.id, p.tareaId, { marcas: p.marcas, actualizado: p.actualizado })));
        estado.mapaProgreso = await cargarMapaProgreso(estado.usuario.id);
      }
      ui.toast('Configuracion importada');
      renderConfig();
    } catch (e) {
      ui.aviso('Archivo invalido', 'No se pudo leer el JSON seleccionado.', 'error');
    }
  };
  input.click();
};

const restaurarConfig = async () => {
  const ok = await ui.confirmar('Restaurar configuracion original?', 'Se sobrescribira la config del mundo (no borra tu progreso).');
  if (!ok) return;
  const semilla = estado.mundoBase.mundos.find((m) => m.id === estado.mundoActual.id);
  await db.guardarMundo(estado.usuario.id, semilla);
  estado.mundoActual = await db.obtenerMundo(estado.usuario.id, semilla.id);
  ui.toast('Configuracion restaurada');
  renderConfig();
};

// ---------- Mapas de acciones ----------
const accionesPerfiles = {
  ingresar: async (id) => {
    estado.usuario = await db.obtenerUsuario(Number(id));
    localStorage.setItem('jnv_usuario', id);
    await irAMundos();
  },
  'nuevo-perfil': async () => {
    const datos = await ui.modalNuevoPerfil();
    if (!datos) return;
    const id = await db.crearUsuario(datos);
    estado.usuario = await db.obtenerUsuario(id);
    localStorage.setItem('jnv_usuario', String(id));
    ui.toast('Perfil creado');
    await irAMundos();
  },
  'eliminar-usuario': async (id) => {
    const ok = await ui.confirmar('Eliminar este perfil?', 'Se borrara el perfil (el progreso quedara huerfano).');
    if (!ok) return;
    await db.eliminarUsuario(Number(id));
    await irAPerfiles();
  }
};

const accionesMundos = {
  'abrir-mundo': (id) => irANiveles(id),
  'cambiar-perfil': () => { estado.usuario = null; irAPerfiles(); },
  'salir-perfil': () => { estado.usuario = null; localStorage.removeItem('jnv_usuario'); irAPerfiles(); }
};

const accionesNiveles = {
  'volver-mundos': () => { estado.nivelAbierto = null; irAMundos(); },
  'config-mundo': abrirConfig,
  'toggle-nivel': (id) => {
    estado.nivelAbierto = estado.nivelAbierto === id ? null : id;
    renderNiveles();
  },
  'abrir-detalle': (id) => abrirDetalle(id)
};

const accionesDetalle = {
  'detalle-volver': () => { estado.tareaDetalle = null; renderNiveles(); ui.transicionar(); },
  'detalle-anular': (id) => anularSesion(id),
  'ver-imagen': (url) => ui.lightbox(url)
};

const accionesConfig = {
  'config-toggle-tema': () => { alternarTema(); renderConfig(); },
  'config-toggle-prueba': () => { alternarModoPrueba(); renderConfig(); },
  'config-volver': () => { irANiveles(estado.mundoActual.id); },
  'config-importar': importarConfig,
  'config-exportar': exportarConfig,
  'config-restaurar': restaurarConfig,
  'config-nuevo-nivel': nuevoNivel,
  'config-editar-nivel': editarNivel,
  'config-toggle-nivel': (id) => { alternarSet(estado.expand.niveles, id); renderConfig(); },
  'config-nuevo-bloque': nuevoBloque,
  'config-editar-bloque': editarBloque,
  'config-toggle-bloque': (id) => { alternarSet(estado.expand.bloques, id); renderConfig(); },
  'config-nueva-tarea': nuevaTarea,
  'config-editar-tarea': editarTarea
};

const alternarSet = (conjunto, valor) => {
  if (conjunto.has(valor)) conjunto.delete(valor); else conjunto.add(valor);
};

// ---------- Arranque ----------
const iniciar = async () => {
  aplicarTema(localStorage.getItem('jnv_tema') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  estado.modoPrueba = localStorage.getItem('jnv_modo_prueba') === '1';
  ui.pantallaCarga();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  try {
    await db.abrirBD();
    estado.mundoBase = await cargarConfigInicial();
    await new Promise((r) => setTimeout(r, 600));
    await irAPerfiles();
  } catch (e) {
    document.getElementById('app').innerHTML =
      `<div class="min-h-screen flex items-center justify-center p-6 text-center text-rose-500">
        <div><p class="font-bold">Error al iniciar</p><p class="text-sm mt-1">${e.message}</p>
        <p class="text-xs mt-3 text-slate-500">Debes servir la app por http (no abrir el archivo directo). Ej: <code>npx serve client</code></p></div>
      </div>`;
  }
};

iniciar();
