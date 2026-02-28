/**
 * Extrae horarios de un HTML guardado desde Moovit (o Google Maps).
 *
 * Uso:
 * 1. Abrí la página de la línea en Moovit (ej. línea 120).
 * 2. Guardá la página: Ctrl+S → "Página web, solo HTML" o "Página web completa".
 * 3. Guardá el archivo en scripts/ como moovit-line-120.html (o el nombre que quieras).
 * 4. Ejecutá: node scripts/parse-moovit-html.js scripts/moovit-line-120.html 120
 *
 * El tercer argumento es el id de la línea (120, TEO, etc.) para el JSON.
 * Salida: un objeto schedules que podés pegar en data/lines.json para esa línea.
 *
 * Nota: Moovit puede cambiar el HTML; si no extrae nada, usá el formulario en la app.
 */

const fs = require('fs');
const path = require('path');

const htmlPath = process.argv[2];
const lineId = process.argv[3] || '';

if (!htmlPath || !fs.existsSync(htmlPath)) {
  console.error('Uso: node parse-moovit-html.js <archivo.html> [lineId]');
  console.error('Ejemplo: node parse-moovit-html.js moovit-line-120.html 120');
  process.exit(1);
}

const html = fs.readFileSync(path.resolve(htmlPath), 'utf8');

// Buscar todos los horarios en formato HH:MM o H:MM
const timeRegex = /\b(\d{1,2}:\d{2})\b/g;
const times = [];
let m;
while ((m = timeRegex.exec(html)) !== null) {
  const t = m[1];
  const [h, min] = t.split(':').map(Number);
  if (h >= 0 && h <= 23 && min >= 0 && min <= 59) {
    const normalized = (h < 10 ? '0' : '') + h + ':' + (min < 10 ? '0' : '') + min;
    if (!times.includes(normalized)) times.push(normalized);
  }
}
times.sort();

// Intentar detectar bloques por etiquetas en el HTML (Lunes, Sábado, Domingo, etc.)
const lower = html.toLowerCase();
const hasWeekday = /lun|viernes|weekday|entre semana|días (hábiles|utiles)/i.test(html);
const hasSaturday = /sábado|sabado|saturday/i.test(html);
const hasSunday = /domingo|sunday|feriado/i.test(html);

// Si hay muchos horarios, repartir en weekday / saturday / sunday de forma simple
let weekday = [];
let saturday = [];
let sunday = [];

if (times.length === 0) {
  console.log('No se encontraron horarios en formato HH:MM en el archivo.');
  console.log('Probá guardar la página con "Página web completa" o pegá los horarios en la app.');
  process.exit(0);
}

// Por ahora ponemos todos en weekday; si querés podés editar el JSON a mano
weekday = [...times];
if (times.length > 20) {
  // Reparto muy básico: primeros 2/3 weekday, resto repartido
  const n = times.length;
  weekday = times.slice(0, Math.ceil(n * 0.65));
  saturday = times.slice(0, Math.ceil(n * 0.4));
  sunday = times.length > 5 ? times.filter((_, i) => i % 3 === 0) : times.slice(0, 3);
}

const schedules = {};
if (weekday.length) schedules.weekday = weekday;
if (saturday.length) schedules.saturday = saturday;
if (sunday.length) schedules.sunday = sunday;

const output = lineId
  ? { lineId, schedules }
  : { schedules };

console.log(JSON.stringify(output, null, 2));
console.error('\n---');
console.error('Copiá el objeto "schedules" y pegalo en data/lines.json en la línea con id "' + (lineId || '?') + '".');
console.error('Si los horarios no coinciden con Lunes a viernes / Sábados / Domingos, editá el JSON a mano.');
