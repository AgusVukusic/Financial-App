// Chequeo sin navegador: monta cada concepto en jsdom, anota un gasto, paga un fijo y deshace.
// Uso: node docs/ui-redesign/concepts/build.mjs && node docs/ui-redesign/concepts/check.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM, VirtualConsole } from 'jsdom';

const dir = path.dirname(fileURLToPath(import.meta.url));
const file = process.argv[2] || 'concepts.html'; // p. ej. node check.mjs concepts.k1.html
const html = fs.readFileSync(path.join(dir, file), 'utf8').replace(/<link rel="stylesheet"[^>]*>/, '');
const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', (e) => errors.push('jsdomError: ' + (e.detail?.stack || e.message)));
vc.on('error', (...a) => errors.push('console.error: ' + a.join(' ')));
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/', virtualConsole: vc });
const w = dom.window;
w.requestAnimationFrame = (f) => setTimeout(f, 0);
await new Promise((r) => setTimeout(r, 100));

let failed = errors.length > 0;
const report = [];
for (const c of w.CK.concepts) {
  w.document.querySelector(`#tabs [data-id="${c.id}"]`).click();
  await new Promise((r) => setTimeout(r, 50));
  const phones = [...w.document.querySelectorAll('.phone')];
  const stores = w.__ck.stores;
  const before = stores[0].state.balance;
  stores[0].add({ name: 'Café', amount: 3500, cat: 'Comida', acc: 'efectivo' });
  const undo = stores[0].pay(2);
  await new Promise((r) => setTimeout(r, 50));
  const mid = stores[0].state.balance;
  undo();
  await new Promise((r) => setTimeout(r, 50));
  const txt = phones[0].textContent;
  const btns = [...phones[0].querySelectorAll('button')].filter((b) => !b.textContent.trim() && !b.getAttribute('aria-label') && !b.querySelector('[aria-label]')).length;
  const row = { id: c.id, phones: phones.length, balanceDelta: before - mid, hasSaldo: /15\.373\.721|15\.373/.test(txt + phones[0].innerHTML), buttonsSinNombre: btns, info: !!c.info };
  if (phones.length !== 2 || row.balanceDelta !== 3500 + 3299 || btns > 0) failed = true;
  report.push(row);
}
console.table(report);
if (errors.length) { console.log('ERRORES:\n' + errors.join('\n')); }
console.log(failed ? 'FALLÓ' : 'OK');
process.exit(failed ? 1 : 0);
