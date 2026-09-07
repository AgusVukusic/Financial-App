const { assertFails, assertSucceeds, initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { doc, setDoc, getDoc } = require('firebase/firestore');
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
  });
});
