// Datos de peor caso para revisar la UI contra los emuladores (nunca producción). Complementa a seed-emulators.js.
// Requiere `npm run emulators` y `npm run dev:api`. Uso: node scripts/seed-worstcase.js
// Crea dos usuarios que entran por /api, igual que el frontend (así valen los mismos límites del servidor):
//   - peor@prueba.test: los valores más largos, más grandes y más raros que el servidor acepta de verdad.
//   - vacio@prueba.test: activado y sin nada cargado (estados vacíos).
// "Demo" vs "Peor caso" = entrar con ana@prueba.test (seed-emulators.js) o con peor@prueba.test.
import { randomUUID } from 'node:crypto';

const PROJECT = 'financial-app-beta';
const AUTH = 'http://127.0.0.1:9099';
const FIRESTORE = 'http://127.0.0.1:8080';
const API = 'http://127.0.0.1:5002/api';

// Credenciales solo válidas en el emulador de Auth.
export const WORST_USER = { email: 'peor@prueba.test', password: 'Prueba-1234', displayName: 'peor' };
export const EMPTY_USER = { email: 'vacio@prueba.test', password: 'Prueba-1234', displayName: 'vacio' };

const json = async (res) => {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${res.status} ${res.url}: ${JSON.stringify(body)}`);
  return body;
};
const post = (url, data, headers = {}) =>
  fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(data) }).then(json);
const idp = (method, data) => post(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:${method}?key=fake`, data);

async function signIn(user) {
  const creds = { email: user.email, password: user.password, returnSecureToken: true };
  let session;
  try {
    session = await idp('signInWithPassword', creds);
  } catch {
    session = await idp('signUp', creds);
    await idp('update', { idToken: session.idToken, displayName: user.displayName });
  }
  await post(`${AUTH}/identitytoolkit.googleapis.com/v1/projects/${PROJECT}/accounts:update`,
    { localId: session.localId, emailVerified: true }, { Authorization: 'Bearer owner' });
  await fetch(`${FIRESTORE}/v1/projects/${PROJECT}/databases/(default)/documents/betaInvites/${user.email}`, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { invitedBy: { stringValue: 'seed' } } }),
  }).then(json);
  return (await idp('signInWithPassword', creds)).idToken;
}

const day = (d, monthOffset = 0) => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + monthOffset, d, 12).toISOString();
};
const pesos = (n) => Math.round(n * 100);

// Límites del servidor (functions/finance): cuenta 40, descripción de movimiento 200, gasto fijo 80.
const LONG_DESC_200 =
  'Compra grande del mes en el mayorista por pedido de toda la familia: harina, aceite, yerba, arroz, fideos, galletitas, detergente, lavandina, papel higiénico y cosas para la casa de Mar del Plata';
const URL_DESC = 'https://www.mercadolibre.com.ar/MLA-1234567890-zapatillas-running-hombre-talle-42-_JM#position=1&search_layout=grid';

async function seedWorst() {
  const token = await signIn(WORST_USER);
  const call = async (fn, data) => (await post(`${API}/${fn}`, { data }, { Authorization: `Bearer ${token}` })).result;
  const rid = () => randomUUID();
  await call('activateBetaUser', {});

  const account = async (name, type, opening) =>
    (await call('createAccount', { requestId: rid(), name, type, openingBalanceMinor: pesos(opening) })).accountId;
  // 40 caracteres justos, un saldo de 12 cifras, una letra sola, un emoji y una tarjeta sin saldo.
  const largo = await account('Caja de Ahorro Banco Provincia Bs. As.', 'bank', 123456789012.34);
  const letra = await account('X', 'cash', 0.01);
  const emoji = await account('Efectivo 💵 (billetera chica)', 'wallet', 1500);
  const tarjeta = await account('Visa Santander Platinum Internacional', 'credit', 0);

  const tx = (kind, accountId, amount, category, description, occurredAt, toAccountId) =>
    call('createTransaction', {
      requestId: rid(), kind, accountId, amountMinor: pesos(amount), category, description, occurredAt,
      ...(toAccountId ? { toAccountId } : {}),
    });
  const today = new Date().getDate();
  const d = (n) => day(Math.max(1, Math.min(n, today)));

  await tx('income', largo, 987654321.99, 'Ingreso', 'Sueldo, aguinaldo y retroactivo del convenio colectivo de trabajo', d(1));
  await tx('expense', largo, 99999999.99, 'Hogar', LONG_DESC_200, d(2));
  await tx('expense', tarjeta, 1250000.5, 'Compras', URL_DESC, d(2));
  await tx('expense', letra, 0.01, 'Otros', 'a', d(3));
  await tx('expense', emoji, 850, 'Comida', 'Empanadas 🥟🥟 para la cena de los chicos', d(3));
  await tx('expense', tarjeta, 15000, 'Servicios', '', d(4));
  await tx('transfer', largo, 300000, 'Transferencia', 'Pasaje a la cuenta de la casa para el pago de expensas extraordinarias', d(4), emoji);
  // Más de una pantalla de movimientos, con montos de muy distinto largo.
  for (let i = 0; i < 40; i += 1) {
    const amount = [12, 1250, 48999.9, 1250000.75, 25000000][i % 5];
    await tx('expense', i % 2 ? largo : emoji, amount, ['Comida', 'Transporte', 'Compras', 'Hogar', 'Servicios', 'Otros'][i % 6], `Gasto de prueba ${i + 1}`, d(5 + (i % 8)));
  }
  await tx('income', largo, 1700000, 'Ingreso', 'Sueldo', day(1, -1));
  await tx('expense', largo, 310000, 'Hogar', 'Alquiler', day(4, -1));

  // Topes: uno ínfimo (siempre superado), uno gigante (nunca se toca) y uno a punto de saltar.
  await call('setBudget', { category: 'Comida', limitMinor: pesos(1) });
  await call('setBudget', { category: 'Hogar', limitMinor: pesos(999999999.99) });
  await call('setBudget', { category: 'Compras', limitMinor: pesos(1260000) });
  await call('setBudget', { category: 'Transporte', limitMinor: pesos(60000) });

  const sub = (description, amount, category, dueDay, cycle, accountId) =>
    call('createSubscription', { requestId: rid(), description, amountMinor: pesos(amount), category, dueDay, cycle, accountId });
  await sub('Seguro integral del hogar: robo, incendio, cristales y responsabilidad civil', 99999999.99, 'Hogar', 31, 'yearly', largo);
  await sub('Gym', 0.5, 'Otros', 1, 'monthly', letra);
  await sub('Netflix + Spotify + Disney+ + HBO Max + Paramount+ + Star+ (paquete familiar)', 78999.99, 'Entretenimiento', Math.max(1, today - 3), 'monthly', tarjeta);
  await sub('Expensas', 145000, 'Hogar', today, 'monthly', emoji);
  await sub('Internet', 18990, 'Servicios', Math.min(28, today + 1), 'monthly', largo);

  console.log('Peor caso listo (peor@prueba.test).');
}

async function seedEmpty() {
  const token = await signIn(EMPTY_USER);
  await post(`${API}/activateBetaUser`, { data: {} }, { Authorization: `Bearer ${token}` });
  console.log('Usuario vacío listo (vacio@prueba.test).');
}

seedWorst().then(seedEmpty).catch((err) => { console.error(err.message); process.exit(1); });
