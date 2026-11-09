const { assertFails, assertSucceeds, initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { doc, setDoc, getDoc, getDocs, collection, query, where } = require('firebase/firestore');
const fs = require('fs');

let testEnv;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'financial-app-beta',
    firestore: {
      rules: fs.readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe('Firestore Security Rules', () => {
  describe('Unauthenticated users', () => {
    it('cannot read or write accounts', async () => {
      const unauthDb = testEnv.unauthenticatedContext().firestore();
      
      const p1 = assertFails(getDoc(doc(unauthDb, 'accounts/123')));
      const p2 = assertFails(setDoc(doc(unauthDb, 'accounts/123'), { userId: '123' }));
      
      await Promise.all([p1, p2]);
    });
  });

  describe('Authenticated users', () => {
    it('cannot write directly to accounts or transactions', async () => {
      const authDb = testEnv.authenticatedContext('alice').firestore();
      
      const p1 = assertFails(setDoc(doc(authDb, 'accounts/acc1'), { userId: 'alice', amountMinor: 100 }));
      const p2 = assertFails(setDoc(doc(authDb, 'transactions/tx1'), { userId: 'alice', amountMinor: 50 }));
      
      await Promise.all([p1, p2]);
    });

    it('can read their own accounts', async () => {
      const authDbAlice = testEnv.authenticatedContext('alice').firestore();
      const authDbBob = testEnv.authenticatedContext('bob').firestore();

      // Setup data bypassing rules using admin context
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await setDoc(doc(adminDb, 'accounts/accAlice'), { userId: 'alice' });
        await setDoc(doc(adminDb, 'accounts/accBob'), { userId: 'bob' });
      });

      // Alice can read her account
      await assertSucceeds(getDoc(doc(authDbAlice, 'accounts/accAlice')));
      // Alice cannot read Bob's account
      await assertFails(getDoc(doc(authDbAlice, 'accounts/accBob')));
      // Bob can read his account
      await assertSucceeds(getDoc(doc(authDbBob, 'accounts/accBob')));
    });

    it('can read only their own budgets doc (doc ID = uid) and never write it', async () => {
      const authDbAlice = testEnv.authenticatedContext('alice').firestore();

      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await setDoc(doc(adminDb, 'budgets/alice'), { Comida: 10000 });
        await setDoc(doc(adminDb, 'budgets/bob'), { Comida: 20000 });
      });

      await assertSucceeds(getDoc(doc(authDbAlice, 'budgets/alice')));
      await assertFails(getDoc(doc(authDbAlice, 'budgets/bob')));
      await assertFails(setDoc(doc(authDbAlice, 'budgets/alice'), { Comida: 1 }));
    });

    it('can query their own transactions by userId but not other users', async () => {
      const authDbAlice = testEnv.authenticatedContext('alice').firestore();

      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await setDoc(doc(adminDb, 'transactions/t1'), { userId: 'alice', amountMinor: 100 });
        await setDoc(doc(adminDb, 'transactions/t2'), { userId: 'bob', amountMinor: 200 });
      });

      const txs = collection(authDbAlice, 'transactions');
      await assertSucceeds(getDocs(query(txs, where('userId', '==', 'alice'))));
      await assertFails(getDocs(query(txs, where('userId', '==', 'bob'))));
      await assertFails(getDocs(txs)); // sin filtro: las reglas no pueden garantizar propiedad
    });

    it('cannot read or write betaInvites', async () => {
      const authDb = testEnv.authenticatedContext('alice').firestore();
      await assertFails(getDoc(doc(authDb, 'betaInvites/test@test.com')));
      await assertFails(setDoc(doc(authDb, 'betaInvites/test@test.com'), { active: true }));
    });

    it('can read own user profile but cannot write it', async () => {
      const authDbAlice = testEnv.authenticatedContext('alice').firestore();

      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await setDoc(doc(adminDb, 'users/alice'), { active: true });
        await setDoc(doc(adminDb, 'users/bob'), { active: true });
      });

      await assertSucceeds(getDoc(doc(authDbAlice, 'users/alice')));
      await assertFails(getDoc(doc(authDbAlice, 'users/bob')));
      await assertFails(setDoc(doc(authDbAlice, 'users/alice'), { active: false }));
    });
  });
});