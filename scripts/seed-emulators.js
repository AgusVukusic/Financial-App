// Datos de prueba para revisar la UI contra los emuladores (nunca producción).
// Requiere `npm run emulators` y `npm run dev:api`. Uso: node scripts/seed-emulators.js
// Crea (o reutiliza) el usuario de prueba, lo verifica, lo invita y carga cuentas, movimientos,
// presupuestos y gastos fijos a través de /api, igual que el frontend.
import { randomUUID } from 'node:crypto';

const PROJECT = 'financial-app-beta';
const AUTH = 'http://127.0.0.1:9099';
const FIRESTORE = 'http://127.0.0.1:8080';
const API = 'http://127.0.0.1:5002/api';

// Credenciales solo válidas en el emulador de Auth.
export const TEST_USER = { email: 'ana@prueba.test', password: 'Prueba-1234', displayName: 'ana' };

const json = async (res) => {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${res.status} ${res.url}: ${JSON.stringify(body)}`);
  return body;
};
const post = (url, data, headers = {}) =>
  fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(data) }).then(json);

const idp = (method, data) => post(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:${method}?key=fake`, data);

async function signIn() {
  const creds = { email: TEST_USER.email, password: TEST_USER.password, returnSecureToken: true };
  let session;
  try {
    session = await idp('signInWithPassword', creds);
  } catch {
    session = await idp('signUp', creds);
    await idp('update', { idToken: session.idToken, displayName: TEST_USER.displayName });
  }
  // Verificar el email con privilegios de emulador y pedir un token nuevo que lo refleje.
  await post(`${AUTH}/identitytoolkit.googleapis.com/v1/projects/${PROJECT}/accounts:update`,
    { localId: session.localId, emailVerified: true }, { Authorization: 'Bearer owner' });
  await fetch(`${FIRESTORE}/v1/projects/${PROJECT}/databases/(default)/documents/betaInvites/${TEST_USER.email}`, {
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

async function main() {
  const token = await signIn();
  const call = async (fn, data) => (await post(`${API}/${fn}`, { data }, { Authorization: `Bearer ${token}` })).result;
  const rid = () => randomUUID();

  await call('activateBetaUser', {});

  const account = async (name, type, opening) =>
    (await call('createAccount', { requestId: rid(), name, type, openingBalanceMinor: pesos(opening) })).accountId;
  const mp = await account('Mercado Pago', 'wallet', 215430.75);
  const efectivo = await account('Efectivo', 'cash', 48000);
  const visa = await account('Visa Santander Platinum Internacional', 'credit', 0);
  const ahorro = await account('Ahorros USD (en pesos)', 'bank', 12850000);

  const tx = (kind, accountId, amount, category, description, occurredAt, toAccountId) =>
    call('createTransaction', {
      requestId: rid(), kind, accountId, amountMinor: pesos(amount), category, description, occurredAt,
      ...(toAccountId ? { toAccountId } : {}),
    });

  const today = new Date().getDate();
  const d = (n) => day(Math.max(1, Math.min(n, today)));

  await tx('income', mp, 1850000, 'Ingreso', 'Sueldo', d(1));
  await tx('income', mp, 120000, 'Ingreso', 'Freelance landing page', d(6));
  const expenses = [
    [mp, 45230.5, 'Comida', 'Supermercado Coto', 2],
    [mp, 8900, 'Transporte', 'SUBE', 2],
    [efectivo, 3500, 'Comida', 'Café', 3],
    [visa, 189999, 'Compras', 'Zapatillas', 3],
    [mp, 320000, 'Hogar', 'Alquiler', 4],
    [mp, 27840, 'Servicios', 'Edenor', 5],
    [efectivo, 12000, 'Otros', '', 5],
    [mp, 15600, 'Comida', 'PedidosYa', 6],
    [visa, 64500, 'Compras', 'Regalo de cumpleaños para la abuela Margarita (librería)', 7],
    [mp, 9200, 'Transporte', 'Uber', 8],
    [mp, 38450, 'Comida', 'Verdulería y carnicería', 9],
    [mp, 18990, 'Servicios', 'Internet Fibertel', 10],
    [efectivo, 6000, 'Comida', 'Almuerzo', 10],
    [mp, 52300, 'Hogar', 'Ferretería', 11],
    [mp, 21000, 'Otros', 'Farmacia', 11],
    [mp, 7400, 'Transporte', 'Nafta', 12],
    [visa, 133000, 'Compras', 'Auriculares', 12],
    [mp, 29800, 'Comida', 'Supermercado Día', 13],
  ];
  for (const [acc, amount, category, description, n] of expenses) await tx('expense', acc, amount, category, description, d(n));
  await tx('transfer', mp, 60000, 'Transferencia', 'Retiro cajero', d(4), efectivo);
  await tx('transfer', mp, 200000, 'Transferencia', 'Ahorro del mes', d(8), ahorro);

  // Mes anterior, para probar la navegación entre meses.
  await tx('income', mp, 1700000, 'Ingreso', 'Sueldo', day(1, -1));
  await tx('expense', mp, 310000, 'Hogar', 'Alquiler', day(4, -1));
  await tx('expense', mp, 96000, 'Comida', 'Supermercado', day(15, -1));

  for (const [category, limit] of [['Comida', 180000], ['Compras', 300000], ['Transporte', 60000], ['Hogar', 400000], ['Servicios', 40000]]) {
    await call('setBudget', { category, limitMinor: pesos(limit) });
  }

  const sub = (description, amount, category, dueDay, cycle, accountId) =>
    call('createSubscription', { requestId: rid(), description, amountMinor: pesos(amount), category, dueDay, cycle, accountId });
  await sub('Netflix', 13999, 'Servicios', Math.max(1, today - 2), 'monthly', visa);
  await sub('Spotify', 3299, 'Servicios', Math.min(28, today + 2), 'monthly', visa);
  await sub('Gimnasio', 42000, 'Otros', Math.min(28, today + 9), 'monthly', mp);
  await sub('Expensas', 145000, 'Hogar', 10, 'monthly', mp);
  await sub('Seguro del auto', 380000, 'Transporte', 20, 'yearly', mp);

  console.log('Seed listo.');
}

main().catch((err) => { console.error(err.message); process.exit(1); });
