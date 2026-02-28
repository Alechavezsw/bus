# Scripts para horarios

## ¿Por qué no se puede scrapear desde la app?

- **Google Maps y Moovit** prohíben el acceso automatizado en sus términos de uso. Hacer requests desde nuestra app o desde un servidor sería bloqueado y va contra sus reglas.
- **Red Tulum** (redtulum.gob.ar) no publica los horarios en su web: solo enlaza a Moovit. No hay JSON ni tabla de horarios que podamos leer.
- Por eso los horarios hay que cargarlos a mano (formulario en la app) o con el script de abajo usando un HTML que **vos** guardás.

## Opción 1: Formulario en la app (recomendado)

En la app, abrí una línea → "Agregar horarios en esta app" → pegá los horarios que ves en Google Maps o Moovit → Guardar. Se guardan en tu navegador y se ven en la app.

## Opción 2: Extraer desde un HTML guardado

Si guardás la página de Moovit en tu PC, este script intenta sacar los horarios (HH:MM) del archivo. **No hace ningún request a internet**: solo lee el archivo que vos guardaste.

1. Abrí la línea en Moovit (ej. https://moovitapp.com/san_juan-6137/lines/120/...).
2. En el navegador: **Ctrl+S** (o Cmd+S) → guardar como **"Página web, solo HTML"** o **"Página web completa"**.
3. Guardá el archivo en esta carpeta, ej. `moovit-120.html`.
4. En la terminal, desde la raíz del proyecto:
   ```bash
   node scripts/parse-moovit-html.js scripts/moovit-120.html 120
   ```
5. El script imprime un JSON con `schedules`. Copiá ese objeto y pegalo en `data/lines.json` en la línea con `"id": "120"` (en la propiedad `"schedules"`).

**Nota:** Si Moovit cambia cómo muestra los horarios en el HTML, el script puede no encontrar nada. En ese caso usá el formulario de la app.

## Opción 3: Pedir datos abiertos

Podés escribir a **proyectostic@sanjuan.gob.ar** (Red Tulum / Gobierno de San Juan) y pedir que publiquen horarios en formato abierto (GTFS o JSON). Si los publican, se podría conectar la app a esa fuente.
