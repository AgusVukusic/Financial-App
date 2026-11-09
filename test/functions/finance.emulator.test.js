import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, getDocs, collection } from 'firebase/firestore';
import fs from 'fs';
import { createMockToken, callFn, FUNCTIONS_PROJECT_ID } from './helpers.js';

let testEnv;

const alice = createMockToken('alice');
const bob = createMockToken('bob');
const mallory = createMockToken('mallory'); // autenticada pero sin perfil activo

// withSecurityRulesDisabled resuelve a void: capturamos el resultado en una variable.
const admin = async (fn) => {
  let out;
  await testEnv.withSecurityRulesDisabled(async (ctx) => { out = await fn(ctx.firestore()); });
  return out;
};
const readDoc = async (path) => admin(async (db) => (await getDoc(doc(db, path))).data());
const allDocs = async (col) => admin(async (db) => (await getDocs(collection(db, col))).docs.map((d) => ({ id: d.id, ...d.data() })));

const now = () => new Date('2026-03-10T12:00:00.000Z').toISOString();
let seq = 0;
const rid = () => `req-${Date.now()}-${seq++}`;

async function newAccount(token, overrides = {}) {
  const requestId = rid();
  const res = await callFn('createAccount', token, { requestId, name: 'Banco', type: 'bank', openingBalanceMinor: 100000, ...overrides });
  expect(res.error).toBeUndefined();
  return res.result.accountId;
}

const tx = (token, data) => callFn('createTransaction', token, { requestId: rid(), kind: 'expense', amountMinor: 2500, occurredAt: now(), ...data });

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: FUNCTIONS_PROJECT_ID,
    firestore: { rules: fs.readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  });
  // Calienta el runtime
  const warm = await callFn('createAccount', null, {});
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

describe('guards', () => {
  it('rechaza sin autenticación', async () => {
    const res = await callFn('createAccount', null, { requestId: rid(), name: 'x', type: 'bank' });
    expect(res.error.status).toBe('UNAUTHENTICATED');
  });

  it('rechaza usuarios autenticados sin perfil activo', async () => {
    const res = await callFn('createAccount', mallory, { requestId: rid(), name: 'x', type: 'bank' });
    expect(res.error.status).toBe('PERMISSION_DENIED');
    expect(await allDocs('accounts')).toHaveLength(0);
  });
});

describe('requestId reservado', () => {
  it('rechaza requestId con guion bajo (espacio de nombres del servidor)', async () => {
    const acc = await newAccount(alice);
    for (const requestId of ['void_abcdefgh1', 'abcdefgh_out', 'abcdefgh_in', 'abc defgh12', 'corto']) {
      const t = await tx(alice, { requestId, accountId: acc });
      expect(t.error.status).toBe('INVALID_ARGUMENT');
      const a = await callFn('createAccount', alice, { requestId, name: 'x', type: 'bank' });
      expect(a.error.status).toBe('INVALID_ARGUMENT');
    }
    expect(await allDocs('transactions')).toHaveLength(0);
  });
});

describe('cuentas', () => {
  it('crea una cuenta con saldo en centavos', async () => {
    const id = await newAccount(alice, { openingBalanceMinor: 150050 });
    expect(await readDoc(`accounts/${id}`)).toMatchObject({
      userId: 'alice', name: 'Banco', type: 'bank', currency: 'ARS', openingBalanceMinor: 150050, balanceMinor: 150050, schemaVersion: 1,
    });
  });

  it('es idempotente con el mismo requestId', async () => {
    const requestId = rid();
    const r1 = await callFn('createAccount', alice, { requestId, name: 'A', type: 'cash' });
    const r2 = await callFn('createAccount', alice, { requestId, name: 'A', type: 'cash' });
    expect(r1.result.status).toBe('created');
    expect(r2.result.status).toBe('already_created');
    expect(await allDocs('accounts')).toHaveLength(1);
  });

  it('no permite tomar un requestId de otro usuario', async () => {
    const requestId = rid();
    await callFn('createAccount', alice, { requestId, name: 'A', type: 'cash' });
    const res = await callFn('createAccount', bob, { requestId, name: 'B', type: 'cash' });
    expect(res.error.status).toBe('ALREADY_EXISTS');
  });

  it('ignora balanceMinor enviado por el cliente y valida tipos', async () => {
    const id = await newAccount(alice, { openingBalanceMinor: 500, balanceMinor: 999999 });
    expect((await readDoc(`accounts/${id}`)).balanceMinor).toBe(500);

    const bad1 = await callFn('createAccount', alice, { requestId: rid(), name: 'x', type: 'crypto' });
    const bad2 = await callFn('createAccount', alice, { requestId: rid(), name: 'x', type: 'bank', openingBalanceMinor: 10.5 });
    expect(bad1.error.status).toBe('INVALID_ARGUMENT');
    expect(bad2.error.status).toBe('INVALID_ARGUMENT');
  });

  it('updateAccount solo cambia nombre y tipo, y solo en cuentas propias', async () => {
    const id = await newAccount(alice);
    const ok = await callFn('updateAccount', alice, { accountId: id, name: 'Nuevo', type: 'wallet', balanceMinor: 1 });
    expect(ok.error).toBeUndefined();
    expect(await readDoc(`accounts/${id}`)).toMatchObject({ name: 'Nuevo', type: 'wallet', balanceMinor: 100000 });

    const foreign = await callFn('updateAccount', bob, { accountId: id, name: 'Hack', type: 'bank' });
    expect(foreign.error.status).toBe('NOT_FOUND');
  });

  it('deleteAccount rechaza cuentas con movimientos y borra las vacías', async () => {
    const used = await newAccount(alice);
    const empty = await newAccount(alice);
    await tx(alice, { accountId: used });

    const r1 = await callFn('deleteAccount', alice, { accountId: used });
    expect(r1.error.status).toBe('FAILED_PRECONDITION');

    const r2 = await callFn('deleteAccount', alice, { accountId: empty });
    expect(r2.error).toBeUndefined();
    expect(await readDoc(`accounts/${empty}`)).toBeUndefined();

    const foreign = await callFn('deleteAccount', bob, { accountId: used });
    expect(foreign.error.status).toBe('NOT_FOUND');
  });
});

describe('createTransaction', () => {
  it('gasto resta y ingreso suma, en centavos', async () => {
    const acc = await newAccount(alice, { openingBalanceMinor: 100000 });
    const e = await tx(alice, { accountId: acc, kind: 'expense', amountMinor: 2550, category: 'Comida' });
    const i = await tx(alice, { accountId: acc, kind: 'income', amountMinor: 10000 });
    expect(e.error).toBeUndefined();
    expect((await readDoc(`accounts/${acc}`)).balanceMinor).toBe(100000 - 2550 + 10000);

    expect(await readDoc(`transactions/${e.result.transactionIds[0]}`)).toMatchObject({
      userId: 'alice', accountId: acc, direction: 'OUT', amountMinor: 2550, currency: 'ARS', kind: 'expense', category: 'Comida', schemaVersion: 1,
    });
    expect((await readDoc(`transactions/${i.result.transactionIds[0]}`)).direction).toBe('IN');
  });

  it('reintentar con el mismo requestId no duplica ni altera el saldo', async () => {
    const acc = await newAccount(alice, { openingBalanceMinor: 100000 });
    const requestId = rid();
    const r1 = await tx(alice, { requestId, accountId: acc, amountMinor: 1000 });
    const r2 = await tx(alice, { requestId, accountId: acc, amountMinor: 1000 });
    expect(r1.result.status).toBe('created');
    expect(r2.result.status).toBe('already_created');
    expect(await allDocs('transactions')).toHaveLength(1);
    expect((await readDoc(`accounts/${acc}`)).balanceMinor).toBe(99000);
  });

  it('rechaza cuentas ajenas sin tocar nada', async () => {
    const bobAcc = await newAccount(bob);
    const res = await tx(alice, { accountId: bobAcc });
    expect(res.error.status).toBe('NOT_FOUND');
    expect(await allDocs('transactions')).toHaveLength(0);
    expect((await readDoc(`accounts/${bobAcc}`)).balanceMinor).toBe(100000);
  });

  it('valida el monto y la fecha', async () => {
    const acc = await newAccount(alice);
    for (const amountMinor of [0, -5, 10.5, '100', null]) {
      expect((await tx(alice, { accountId: acc, amountMinor })).error.status).toBe('INVALID_ARGUMENT');
    }
    expect((await tx(alice, { accountId: acc, occurredAt: 'no-es-fecha' })).error.status).toBe('INVALID_ARGUMENT');
    expect((await tx(alice, { accountId: acc, kind: 'refund' })).error.status).toBe('INVALID_ARGUMENT');
  });

  it('transferencia: dos patas con el mismo transferId y saldos consistentes', async () => {
    const a = await newAccount(alice, { openingBalanceMinor: 100000 });
    const b = await newAccount(alice, { openingBalanceMinor: 0 });
    const res = await tx(alice, { kind: 'transfer', accountId: a, toAccountId: b, amountMinor: 30000 });
    expect(res.error).toBeUndefined();
    expect(res.result.transactionIds).toHaveLength(2);

    const [out, inn] = await Promise.all(res.result.transactionIds.map((x) => readDoc(`transactions/${x}`)));
    expect(out).toMatchObject({ direction: 'OUT', accountId: a, kind: 'transfer' });
    expect(inn).toMatchObject({ direction: 'IN', accountId: b, kind: 'transfer' });
    expect(out.transferId).toBe(inn.transferId);
    expect((await readDoc(`accounts/${a}`)).balanceMinor).toBe(70000);
    expect((await readDoc(`accounts/${b}`)).balanceMinor).toBe(30000);
  });

  it('transferencia: rechaza mismo origen/destino y destino ajeno', async () => {
    const a = await newAccount(alice);
    const bobAcc = await newAccount(bob);
    expect((await tx(alice, { kind: 'transfer', accountId: a, toAccountId: a })).error.status).toBe('INVALID_ARGUMENT');
    expect((await tx(alice, { kind: 'transfer', accountId: a, toAccountId: bobAcc })).error.status).toBe('NOT_FOUND');
    expect(await allDocs('transactions')).toHaveLength(0);
  });
});

describe('voidTransaction', () => {
  it('compensa el saldo con un documento de anulación y deja el original intacto', async () => {
    const acc = await newAccount(alice, { openingBalanceMinor: 100000 });
    const created = await tx(alice, { accountId: acc, amountMinor: 4000 });
    const txId = created.result.transactionIds[0];
    const original = await readDoc(`transactions/${txId}`);

    const res = await callFn('voidTransaction', alice, { transactionId: txId });
    expect(res.error).toBeUndefined();
    expect((await readDoc(`accounts/${acc}`)).balanceMinor).toBe(100000);
    expect(await readDoc(`transactions/${txId}`)).toEqual(original);
    expect(await readDoc(`transactions/void_${txId}`)).toMatchObject({
      kind: 'void', direction: 'IN', amountMinor: 4000, voidsTransactionId: txId, accountId: acc,
    });
  });

  it('es idempotente', async () => {
    const acc = await newAccount(alice, { openingBalanceMinor: 100000 });
    const txId = (await tx(alice, { accountId: acc, amountMinor: 4000 })).result.transactionIds[0];
    await callFn('voidTransaction', alice, { transactionId: txId });
    const again = await callFn('voidTransaction', alice, { transactionId: txId });
    expect(again.result.status).toBe('already_voided');
    expect((await readDoc(`accounts/${acc}`)).balanceMinor).toBe(100000);
  });

  it('anula una transferencia completa desde cualquiera de sus patas', async () => {
    const a = await newAccount(alice, { openingBalanceMinor: 100000 });
    const b = await newAccount(alice, { openingBalanceMinor: 5000 });
    const ids = (await tx(alice, { kind: 'transfer', accountId: a, toAccountId: b, amountMinor: 20000 })).result.transactionIds;

    const res = await callFn('voidTransaction', alice, { transactionId: ids[1] });
    expect(res.error).toBeUndefined();
    expect(res.result.voidIds).toHaveLength(2);
    expect((await readDoc(`accounts/${a}`)).balanceMinor).toBe(100000);
    expect((await readDoc(`accounts/${b}`)).balanceMinor).toBe(5000);
  });

  it('no anula anulaciones ni movimientos ajenos', async () => {
    const acc = await newAccount(alice);
    const txId = (await tx(alice, { accountId: acc })).result.transactionIds[0];
    await callFn('voidTransaction', alice, { transactionId: txId });

    const voidOfVoid = await callFn('voidTransaction', alice, { transactionId: `void_${txId}` });
    expect(voidOfVoid.error.status).toBe('FAILED_PRECONDITION');

    const foreign = await callFn('voidTransaction', bob, { transactionId: txId });
    expect(foreign.error.status).toBe('NOT_FOUND');
  });
});
