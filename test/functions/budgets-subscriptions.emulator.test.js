import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, getDocs, collection } from 'firebase/firestore';
import fs from 'fs';
import { createMockToken, callFn, FUNCTIONS_PROJECT_ID } from './helpers.js';

let testEnv;

const alice = createMockToken('alice');
const bob = createMockToken('bob');
const mallory = createMockToken('mallory'); // sin perfil activo

// withSecurityRulesDisabled resuelve a void: capturamos el resultado en una variable.
const admin = async (fn) => {
  let out;
  await testEnv.withSecurityRulesDisabled(async (ctx) => { out = await fn(ctx.firestore()); });
  return out;
};
const readDoc = (path) => admin(async (db) => (await getDoc(doc(db, path))).data());
const allDocs = (col) => admin(async (db) => (await getDocs(collection(db, col))).docs.map((d) => ({ id: d.id, ...d.data() })));

const now = () => new Date('2026-03-10T12:00:00.000Z').toISOString();
let seq = 0;
const rid = () => `req-${Date.now()}-${seq++}`;

async function newAccount(token, openingBalanceMinor = 100000) {
  const res = await callFn('createAccount', token, { requestId: rid(), name: 'Banco', type: 'bank', openingBalanceMinor });
  expect(res.error).toBeUndefined();
  return res.result.accountId;
}

const subData = (accountId, overrides = {}) => ({
  requestId: rid(), description: 'Netflix', amountMinor: 450000, category: 'Entretenimiento', dueDay: 5, cycle: 'monthly', accountId, ...overrides,
});

async function newSub(token, accountId, overrides) {
  const res = await callFn('createSubscription', token, subData(accountId, overrides));
  expect(res.error).toBeUndefined();
  return res.result.subscriptionId;
}

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: FUNCTIONS_PROJECT_ID,
    firestore: { rules: fs.readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  });
  const warm = await callFn('setBudget', null, {});
  expect(warm.error?.status).toBe('UNAUTHENTICATED');
}, 30000);

afterAll(async () => { await testEnv.cleanup(); });

beforeEach(async () => {
  await testEnv.clearFirestore();
  await admin(async (db) => {
    await setDoc(doc(db, 'users/alice'), { active: true });
    await setDoc(doc(db, 'users/bob'), { active: true });
  });
});

describe('setBudget', () => {
  it('guarda límites en centavos dentro de budgets/{uid} y conserva los otros', async () => {
    expect((await callFn('setBudget', alice, { category: 'Comida', limitMinor: 5000000 })).error).toBeUndefined();
    expect((await callFn('setBudget', alice, { category: 'Transporte', limitMinor: 1200000 })).error).toBeUndefined();
    expect((await callFn('setBudget', alice, { category: 'Comida', limitMinor: 6000000 })).error).toBeUndefined();

    expect(await readDoc('budgets/alice')).toMatchObject({
      userId: 'alice', currency: 'ARS', schemaVersion: 1, limitsMinor: { Comida: 6000000, Transporte: 1200000 },
    });
    expect(await readDoc('budgets/bob')).toBeUndefined();
  });

  it('valida categoría y monto', async () => {
    for (const category of ['', 'a.b', 'a/b', 'x'.repeat(41), 123, undefined]) {
      expect((await callFn('setBudget', alice, { category, limitMinor: 100 })).error.status).toBe('INVALID_ARGUMENT');
    }
    for (const limitMinor of [-1, 1.5, '100', null]) {
      expect((await callFn('setBudget', alice, { category: 'Comida', limitMinor })).error.status).toBe('INVALID_ARGUMENT');
    }
    expect(await readDoc('budgets/alice')).toBeUndefined();
  });

  it('exige perfil activo', async () => {
    expect((await callFn('setBudget', mallory, { category: 'Comida', limitMinor: 100 })).error.status).toBe('PERMISSION_DENIED');
  });
});

describe('suscripciones (gastos fijos)', () => {
  it('crea con montos en centavos y es idempotente', async () => {
    const acc = await newAccount(alice);
    const data = subData(acc);
    const r1 = await callFn('createSubscription', alice, data);
    const r2 = await callFn('createSubscription', alice, data);
    expect(r1.result.status).toBe('created');
    expect(r2.result.status).toBe('already_created');
    expect(await allDocs('subscriptions')).toHaveLength(1);
    expect(await readDoc(`subscriptions/${data.requestId}`)).toMatchObject({
      userId: 'alice', amountMinor: 450000, currency: 'ARS', dueDay: 5, cycle: 'monthly', accountId: acc, lastPaidAt: null, schemaVersion: 1,
    });
  });

  it('rechaza cuentas ajenas y datos inválidos', async () => {
    const bobAcc = await newAccount(bob);
    const acc = await newAccount(alice);
    expect((await callFn('createSubscription', alice, subData(bobAcc))).error.status).toBe('NOT_FOUND');
    for (const bad of [{ dueDay: 0 }, { dueDay: 32 }, { cycle: 'weekly' }, { amountMinor: 0 }, { amountMinor: 9.5 }, { description: '' }]) {
      expect((await callFn('createSubscription', alice, subData(acc, bad))).error.status).toBe('INVALID_ARGUMENT');
    }
    expect(await allDocs('subscriptions')).toHaveLength(0);
  });

  it('update solo toca campos editables y solo en gastos propios', async () => {
    const acc = await newAccount(alice);
    const id = await newSub(alice, acc);
    const ok = await callFn('updateSubscription', alice, { ...subData(acc, { description: 'HBO' }), subscriptionId: id, lastPaidAt: '2030-01-01' });
    expect(ok.error).toBeUndefined();
    expect(await readDoc(`subscriptions/${id}`)).toMatchObject({ description: 'HBO', lastPaidAt: null, userId: 'alice' });

    const foreign = await callFn('updateSubscription', bob, { ...subData(await newAccount(bob)), subscriptionId: id });
    expect(foreign.error.status).toBe('NOT_FOUND');
  });

  it('delete borra el propio y no el ajeno', async () => {
    const acc = await newAccount(alice);
    const id = await newSub(alice, acc);
    expect((await callFn('deleteSubscription', bob, { subscriptionId: id })).error.status).toBe('NOT_FOUND');
    expect((await callFn('deleteSubscription', alice, { subscriptionId: id })).error).toBeUndefined();
    expect(await readDoc(`subscriptions/${id}`)).toBeUndefined();
  });
});

describe('integridad con cuentas y presupuestos', () => {
  it('deleteAccount rechaza cuentas usadas por un gasto fijo', async () => {
    const acc = await newAccount(alice);
    const id = await newSub(alice, acc);
    expect((await callFn('deleteAccount', alice, { accountId: acc })).error.status).toBe('FAILED_PRECONDITION');
    await callFn('deleteSubscription', alice, { subscriptionId: id });
    expect((await callFn('deleteAccount', alice, { accountId: acc })).error).toBeUndefined();
  });

  it('setBudget no deja saltar el tope con nombres heredados de Object', async () => {
    for (let i = 0; i < 50; i++) {
      expect((await callFn('setBudget', alice, { category: `Cat ${i}`, limitMinor: 1 })).error).toBeUndefined();
    }
    expect((await callFn('setBudget', alice, { category: 'constructor', limitMinor: 1 })).error.status).toBe('RESOURCE_EXHAUSTED');
    expect((await callFn('setBudget', alice, { category: 'Cat 3', limitMinor: 2 })).error).toBeUndefined();
  });
});

describe('paySubscription', () => {
  it('crea el gasto, descuenta el saldo y marca lastPaidAt en una operación', async () => {
    const acc = await newAccount(alice, 1000000);
    const id = await newSub(alice, acc, { amountMinor: 450000 });
    const requestId = rid();

    const res = await callFn('paySubscription', alice, { subscriptionId: id, requestId, occurredAt: now() });
    expect(res.error).toBeUndefined();
    expect(await readDoc(`transactions/${requestId}`)).toMatchObject({
      userId: 'alice', kind: 'expense', direction: 'OUT', accountId: acc, amountMinor: 450000, category: 'Entretenimiento', subscriptionId: id,
    });
    expect((await readDoc(`accounts/${acc}`)).balanceMinor).toBe(550000);
    expect((await readDoc(`subscriptions/${id}`)).lastPaidAt.toDate().toISOString()).toBe(now());
  });

  it('reintentar con el mismo requestId no cobra dos veces', async () => {
    const acc = await newAccount(alice, 1000000);
    const id = await newSub(alice, acc, { amountMinor: 450000 });
    const requestId = rid();
    await callFn('paySubscription', alice, { subscriptionId: id, requestId, occurredAt: now() });
    const again = await callFn('paySubscription', alice, { subscriptionId: id, requestId, occurredAt: now() });
    expect(again.result.status).toBe('already_created');
    expect((await readDoc(`accounts/${acc}`)).balanceMinor).toBe(550000);
    expect(await allDocs('transactions')).toHaveLength(1);
  });

  it('anular el pago restaura el saldo y lastPaidAt (pago -> anulación -> estado original)', async () => {
    const acc = await newAccount(alice, 1000000);
    const id = await newSub(alice, acc, { amountMinor: 450000 });
    const requestId = rid();
    await callFn('paySubscription', alice, { subscriptionId: id, requestId, occurredAt: now() });

    const res = await callFn('voidTransaction', alice, { transactionId: requestId });
    expect(res.error).toBeUndefined();
    expect((await readDoc(`accounts/${acc}`)).balanceMinor).toBe(1000000);
    expect((await readDoc(`subscriptions/${id}`)).lastPaidAt).toBeNull();
  });

  it('anular un pago viejo no pisa un pago más reciente, y un pago atrasado no retrocede lastPaidAt', async () => {
    const acc = await newAccount(alice, 1000000);
    const id = await newSub(alice, acc, { amountMinor: 1000 });
    const older = rid();
    const newer = rid();
    const oldIso = '2026-02-10T12:00:00.000Z';
    await callFn('paySubscription', alice, { subscriptionId: id, requestId: older, occurredAt: oldIso });
    await callFn('paySubscription', alice, { subscriptionId: id, requestId: newer, occurredAt: now() });

    // pago atrasado (enero): no mueve lastPaidAt hacia atrás
    await callFn('paySubscription', alice, { subscriptionId: id, requestId: rid(), occurredAt: '2026-01-10T12:00:00.000Z' });
    expect((await readDoc(`subscriptions/${id}`)).lastPaidAt.toDate().toISOString()).toBe(now());

    // anular el pago de febrero (no es el último): lastPaidAt queda en marzo
    await callFn('voidTransaction', alice, { transactionId: older });
    expect((await readDoc(`subscriptions/${id}`)).lastPaidAt.toDate().toISOString()).toBe(now());

    // anular el de marzo: vuelve al valor previo que registró ese pago (febrero)
    await callFn('voidTransaction', alice, { transactionId: newer });
    expect((await readDoc(`subscriptions/${id}`)).lastPaidAt.toDate().toISOString()).toBe(oldIso);
  });

  it('no paga gastos fijos ajenos ni reusa requestId de otro movimiento', async () => {
    const acc = await newAccount(alice, 1000000);
    const id = await newSub(alice, acc);
    const foreign = await callFn('paySubscription', bob, { subscriptionId: id, requestId: rid(), occurredAt: now() });
    expect(foreign.error.status).toBe('NOT_FOUND');

    const other = await callFn('createTransaction', alice, { requestId: 'req-existing-1', kind: 'expense', accountId: acc, amountMinor: 100, occurredAt: now() });
    expect(other.error).toBeUndefined();
    const clash = await callFn('paySubscription', alice, { subscriptionId: id, requestId: 'req-existing-1', occurredAt: now() });
    expect(clash.error.status).toBe('ALREADY_EXISTS');
    expect((await readDoc(`accounts/${acc}`)).balanceMinor).toBe(999900);
  });
});

describe('replaceTransaction sobre pagos de gastos fijos', () => {
  const replacePay = (token, transactionId, data) =>
    callFn('replaceTransaction', token, { requestId: rid(), kind: 'expense', occurredAt: now(), transactionId, ...data });

  it('conserva subscriptionId y previousLastPaidAt, y mueve lastPaidAt a la nueva fecha', async () => {
    const acc = await newAccount(alice, 1000000);
    const id = await newSub(alice, acc, { amountMinor: 450000 });
    const payId = rid();
    await callFn('paySubscription', alice, { subscriptionId: id, requestId: payId, occurredAt: '2026-03-05T12:00:00.000Z' });

    const newDate = '2026-03-08T12:00:00.000Z';
    const res = await replacePay(alice, payId, { accountId: acc, amountMinor: 500000, occurredAt: newDate });
    expect(res.error).toBeUndefined();

    expect((await readDoc(`accounts/${acc}`)).balanceMinor).toBe(500000);
    expect(await readDoc(`transactions/${res.result.transactionIds[0]}`)).toMatchObject({
      subscriptionId: id, previousLastPaidAt: null, amountMinor: 500000, replacesTransactionId: payId,
    });
    expect((await readDoc(`subscriptions/${id}`)).lastPaidAt.toDate().toISOString()).toBe(newDate);

    // Anular el pago reemplazante vuelve el gasto fijo a "nunca pagado"
    await callFn('voidTransaction', alice, { transactionId: res.result.transactionIds[0] });
    expect((await readDoc(`subscriptions/${id}`)).lastPaidAt).toBeNull();
    expect((await readDoc(`accounts/${acc}`)).balanceMinor).toBe(1000000);
  });

  it('un pago de gasto fijo no puede convertirse en transferencia o ingreso', async () => {
    const acc = await newAccount(alice, 1000000);
    const other = await newAccount(alice, 0);
    const id = await newSub(alice, acc);
    const payId = rid();
    await callFn('paySubscription', alice, { subscriptionId: id, requestId: payId, occurredAt: now() });

    const toTransfer = await replacePay(alice, payId, { kind: 'transfer', accountId: acc, toAccountId: other, amountMinor: 100 });
    const toIncome = await replacePay(alice, payId, { kind: 'income', accountId: acc, amountMinor: 100 });
    expect(toTransfer.error.status).toBe('FAILED_PRECONDITION');
    expect(toIncome.error.status).toBe('FAILED_PRECONDITION');
    expect(await readDoc(`transactions/void_${payId}`)).toBeUndefined();
  });
});
