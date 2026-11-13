#!/usr/bin/env node
// Genera un manifest.json dentro de cada carpeta de archivos del estudio:
//   demos/ y plugins/        → lista de archivos .js
//   proyectos/, projects/ y project_examples/ → lista de archivos .json (proyectos guardados)
// El estudio lee ese manifest.json primero y así no necesita preguntarle nada a la API de GitHub.
// Uso a mano (sin Actions):  node .github/scripts/gen-manifests.js
// Solo toca carpetas que ya existen; no crea carpetas nuevas. Sin dependencias.
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..', '..');
const GROUPS = [
  { dir: 'demos', ext: /\.js$/i },
  { dir: 'plugins', ext: /\.js$/i },
  { dir: 'kits/bootleg', ext: /\.js$/i },
  { dir: 'genres', ext: /\.json$/i },
  { dir: 'presets', ext: /\.json$/i },
  { dir: 'projects', ext: /\.json$/i },
  { dir: 'project_examples', ext: /\.json$/i },
];
let changed = 0;
for (const g of GROUPS) {
  const d = path.join(root, g.dir);
  if (!fs.existsSync(d) || !fs.statSync(d).isDirectory()) continue;
  const names = fs.readdirSync(d, { withFileTypes: true })
    .filter(e => e.isFile() && g.ext.test(e.name) && e.name.toLowerCase() !== 'manifest.json')
    .map(e => e.name)
    .sort((a, b) => a.localeCompare(b, 'en'));
  const out = JSON.stringify(names, null, 2) + '\n';
  const f = path.join(d, 'manifest.json');
  const prev = fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null;
  if (prev !== out) { fs.writeFileSync(f, out); changed++; console.log('actualizado', g.dir + '/manifest.json', '(' + names.length + ' archivos)'); }
  else console.log('sin cambios', g.dir + '/manifest.json');
}
console.log(changed ? 'Manifests actualizados: ' + changed : 'Todo al día.');
