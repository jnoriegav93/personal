# JNV Gamification — Entrenamiento

PWA para gamificar tu progreso de entrenamiento: mundos → niveles → bloques → tareas, con puntos, rachas y desbloqueo de niveles. Sin backend: todo vive en el navegador (IndexedDB) con import/export en JSON.

## Stack

- JavaScript vanilla (módulos ES), arrow functions, funciones en español.
- TailwindCSS (Play CDN) + modo claro/oscuro por clase.
- SweetAlert2 para modales/confirmaciones.
- Heroicons (outline) en línea como SVG (`js/iconos.js`).
- IndexedDB como base de datos local (`js/db.js`).
- PWA instalable y offline (`manifest.webmanifest` + `sw.js`).

## Estructura

```
client/
  index.html              # shell + carga de CDNs
  manifest.webmanifest    # PWA
  sw.js                   # service worker (offline)
  assets/logo.svg         # logo / icono
  data/carga_inicial.json # mundo "Entrenamiento" (semilla)
  js/
    app.js      # orquestador + flujo + export/import
    db.js       # IndexedDB (usuarios, mundos, progreso)
    logica.js   # puntaje, días por tarea, niveles, rachas
    vistas.js   # render (Tailwind) + modales
    iconos.js   # Heroicons inline
```

## Cómo correrlo

La PWA requiere servirse por HTTP (no abrir el archivo directo, por los módulos ES / fetch / service worker):

```bash
npx serve client
# o
python -m http.server 8000 --directory client
```

Luego abre la URL que indique (ej. http://localhost:3000).

## Reglas de juego

- **Puntos** = `puntaje_base × nivel`. Una tarea de nivel inferior hecha estando en un nivel superior vale proporcionalmente menos (la mitad, el tercio, etc.).
- **Días por tarea** = `puntos_requeridos ÷ puntos_obtenidos` (ej. 400 ÷ 100 = 4 días → "0 de 4").
- **Check ()**: se marca una vez por día (respeta el `cooldown`). Al día siguiente, tras el cooldown, se puede volver a marcar.
- **Racha**: si te saltas un día aparece el ícono de alerta. La racha **se conserva** (no se pierde el avance), solo avisa.
- **Modal de alerta** (3 botones):
  - *Lo voy a terminar ahora* → marca la tarea hoy y salva la racha.
  - *Ya salí a correr* → comodín: registra actividad alterna y conserva la racha.
  - *No lo haré* → no hace nada (la racha se conserva igual).
- **Niveles**: el nivel N+1 se desbloquea cuando todos los bloques del nivel N alcanzan su `puntaje_necesario`.

## Configuración del mundo

Dentro de un mundo, el botón ⚙ permite:
- **Exportar JSON**: descarga config + progreso del usuario.
- **Importar JSON**: carga config/progreso desde un archivo.
- **Restaurar original**: vuelve a la semilla `carga_inicial.json` (no borra progreso).

## Editar el contenido

Edita `data/carga_inicial.json` para agregar mundos, niveles, bloques o tareas. Cada tarea soporta: `tarea`, `descripcion`, `tipo`, `img_1`, `img_2`, `vid_1` (YouTube), `series`, `puntos_obtenidos`, `puntos_requeridos`, `cooldown`. Las imágenes/videos son placeholders: reemplázalos por los reales.
