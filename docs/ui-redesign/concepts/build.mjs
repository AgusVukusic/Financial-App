// Une common.* + k*.css + k*.js + host.html en concepts.html (un solo archivo publicable).
// Uso: node docs/ui-redesign/concepts/build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const read = (f) => fs.readFileSync(path.join(dir, f), 'utf8');
// --only=k1 arma una página con ese único concepto en concepts.k1.html (para trabajar en paralelo sin pisarse).
const only = (process.argv.find((a) => a.startsWith('--only=')) || '').split('=')[1];
const ks = fs.readdirSync(dir).filter((f) => /^k\d+\.js$/.test(f) && (!only || f === only + '.js')).sort();
const outName = only ? `concepts.${only}.html` : 'concepts.html';
const css = [read('common.css'), ...ks.map((f) => (fs.existsSync(path.join(dir, f.replace('.js', '.css'))) ? read(f.replace('.js', '.css')) : ''))].join('\n');
const js = [read('common.js'), ...ks.map(read)].join('\n');

// Google Fonts: cada concepto declara sus familias en un comentario `/* fonts: Familia:wght@400;700|Otra */` al inicio de su .js
const fams = new Set(['Geist:wght@400;500;600;700']);
for (const f of ks) {
  const m = read(f).match(/\/\*\s*fonts:\s*([^*]+?)\s*\*\//);
  if (m) m[1].split('|').forEach((x) => fams.add(x.trim()));
}
const fonts = 'https://fonts.googleapis.com/css2?' + [...fams].map((f) => 'family=' + f.replace(/ /g, '+')).join('&') + '&display=swap';

const out = read('host.html').replace('/*FONTS*/', fonts).replace('/*CSS*/', css).replace('/*JS*/', () => js);
fs.writeFileSync(path.join(dir, outName), out);
console.log(outName, (out.length / 1024).toFixed(0) + ' KB', 'conceptos:', ks.join(', '));
