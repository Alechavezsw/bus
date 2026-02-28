# Horarios Red Tulumén – San Juan

App web para consultar horarios de colectivos de la Red Tulumén (San Juan, Argentina). Los horarios actuales están publicados en Google Maps y OpenStreetMap; esta app permite centralizarlos y consultarlos de forma rápida.

## Cómo ejecutar la app

1. **Servidor local** (recomendado, para que cargue `data/lines.json` sin problemas):
   - Con Node: `npx serve .` y abrir `http://localhost:3000`
   - Con Python 3: `python -m http.server 8000` y abrir `http://localhost:8000`

2. **Abrir el HTML**: si abrís `index.html` directamente en el navegador, el archivo JSON puede no cargarse por restricciones del navegador. Usá un servidor local como arriba.

## Estructura del proyecto

- `index.html` – Página principal (líneas, paradas, búsqueda).
- `styles.css` – Estilos.
- `app.js` – Lógica: carga de datos, búsqueda, pestañas, detalle de horarios.
- `data/lines.json` – Datos de líneas, paradas y horarios (editable).

## Cómo cargar datos reales

Los datos se definen en **`data/lines.json`**. Ahí podés:

1. **Completar a mano**: copiando horarios desde Google Maps o OpenStreetMap y pegándolos en `schedules` de cada línea.
2. **Agregar más líneas**: duplicando el objeto de una línea en `lines` y cambiando `id`, `name`, `shortName`, `description`, `stops` y `schedules`.

Formato de cada línea en `lines.json`:

```json
{
  "id": "1",
  "name": "Línea 1",
  "shortName": "1",
  "color": "#c45a2b",
  "description": "Centro - Rawson",
  "stops": [
    { "id": "1-1", "name": "Terminal Centro", "order": 1 }
  ],
  "schedules": {
    "weekday": ["06:00", "06:30", "07:00"],
    "saturday": ["07:00", "12:00"],
    "sunday": ["08:00", "18:00"]
  }
}
```

- **weekday**: Lunes a viernes.  
- **saturday**: Sábados.  
- **sunday**: Domingos y feriados.

Las paradas se listan en orden (`order`). Los horarios son arrays de strings en formato `"HH:MM"`.

## Dónde están los horarios reales

Red Tulum **no publica GTFS ni API pública** con horarios. Los horarios reales se consultan en:

1. **App oficial Red Tulum** – [redtulum.gob.ar/app](https://www.redtulum.gob.ar/app) y app móvil (iOS/Android): planificador, horarios y tiempo real.
2. **Moovit** – [moovitapp.com (San Juan)](https://moovitapp.com/san_juan-6137): por cada línea hay “Ver recorrido” con mapa y horarios. En esta app, al abrir una línea aparece el botón «Ver recorrido en Moovit» que lleva ahí.
3. **Google Maps** – Buscando la línea o parada suele mostrar horarios si están cargados.

Para **pedir datos abiertos** (GTFS) al gobierno de San Juan: proyectostic@sanjuan.gob.ar (Área TIC, Red Tulum).

## Cómo cargar horarios reales en esta app

Cuando tengas los horarios (por ejemplo copiando desde Moovit o la app Red Tulum), editá `data/lines.json`. En cada línea hay un objeto `"schedules"`. Completalo así:

```json
"schedules": {
  "weekday": ["06:00", "06:30", "07:00", "07:30", "12:00", "18:00"],
  "saturday": ["07:00", "12:00", "18:00"],
  "sunday": ["08:00", "12:00", "18:00"]
}
```

- **weekday**: Lunes a viernes.  
- **saturday**: Sábados.  
- **sunday**: Domingos y feriados.  

Las horas van en formato `"HH:MM"`. Si una línea no tiene servicio un día, podés usar `[]` o omitir esa clave. Después de guardar, volvé a hacer `npm run build` y recargá la app (o subí de nuevo a Vercel).

## Otras fuentes

- **Google Maps**: buscar la línea o parada y revisar la sección de horarios.
- **OpenStreetMap**: en [overpass-turbo.eu](https://overpass-turbo.eu) se pueden consultar rutas y paradas si están mapeadas.

## Cómo subir la app (deploy)

1. **Generar la carpeta para publicar:** `npm run build` (crea la carpeta `dist/`).

2. **Netlify** (https://app.netlify.com):
   - Opción A: Arrastrá la carpeta `dist/` a [Netlify Drop](https://app.netlify.com/drop).
   - Opción B: Conectá tu repositorio de GitHub/GitLab; Netlify usará `netlify.toml` y publicará `dist/` automáticamente en cada push.

3. **Vercel** (https://vercel.com):
   - Importá el proyecto desde GitHub (o subí la carpeta).
   - Vercel detecta `vercel.json` y publica la carpeta `dist/` tras hacer `npm run build`.

4. **GitHub Pages:** Subí el contenido de `dist/` a la rama `gh-pages` o a la carpeta `docs` del repo y activá Pages en la configuración del repositorio.

Después de subir, vas a tener una URL pública (por ejemplo `https://tu-sitio.netlify.app` o `https://horarios-bus.vercel.app`).
