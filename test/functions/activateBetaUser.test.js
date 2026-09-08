const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { doc, setDoc, getDoc } = require('firebase/firestore');
const fs = require('fs');

const PROJECT_ID = 'financial-app-beta';
const REGION = 'southamerica-east1';
const PORT = 5001;
const FUNCTION_URL = `http://127.0.0.1:${PORT}/${PROJECT_ID}/${REGION}/activateBetaUser`;

function createMockToken(uid, email, emailVerified) {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64');
  const payload = Buffer.from(JSON.stringify({
    sub: uid,
    user_id: uid,
    email: email,
    email_verified: emailVerified,
    auth_time: Math.floor(Date.now() / 1000)
  })).toString('base64');
  return `${header}.${payload}.signature`;
}

async function callActivateBetaUser(token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ data: {} })
  });
  return response.json();
}

let testEnv;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: fs.readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080
    },
  });

  // Warm the Functions runtime and verify the callable endpoint is ready.
  const readinessResponse = await callActivateBetaUser(null);
  expect(readinessResponse.error?.status).toBe('UNAUTHENTICATED');
}, 30000);

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe('Cloud Function: activateBetaUser', () => {
  it('rejects unauthenticated requests', async () => {
    const res = await callActivateBetaUser(null);
    expect(res.error).toBeDefined();
    expect(res.error.status).toBe('UNAUTHENTICATED');
  });

  it('rejects unverified email', async () => {
    const token = createMockToken('uid1', 'test@test.com', false);
    const res = await callActivateBetaUser(token);
    expect(res.error).toBeDefined();
    expect(res.error.status).toBe('PERMISSION_DENIED');
    expect(res.error.message).toContain('verificar');
  });

  it('rejects verified email not in betaInvites', async () => {
    const token = createMockToken('uid2', 'notinvited@test.com', true);
    const res = await callActivateBetaUser(token);
    expect(res.error).toBeDefined();
    expect(res.error.status).toBe('PERMISSION_DENIED');
    expect(res.error.message).toContain('lista de invitados');
  });

  it('activates user if email is in betaInvites', async () => {
    // Insert invite using admin context
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, 'betaInvites/invited@test.com'), { active: true });
    });

    const token = createMockToken('uid3', ' INVITED@test.com ', true); // should normalize
    const res = await callActivateBetaUser(token);
    expect(res.error).toBeUndefined();
    expect(res.result.status).toBe('activated');

    // Verify user document was created
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      const userDoc = await getDoc(doc(adminDb, 'users/uid3'));
      expect(userDoc.exists()).toBe(true);
      expect(userDoc.data().active).toBe(true);
      expect(userDoc.data().email).toBe('invited@test.com');
    });
  });

  it('returns already_active if called again idempotently', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, 'betaInvites/double@test.com'), { active: true });
    });

    const token = createMockToken('uid4', 'double@test.com', true);
    const res1 = await callActivateBetaUser(token);
    expect(res1.error).toBeUndefined();
    expect(res1.result.status).toBe('activated');

    let profileBeforeRetry;
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const userDoc = await getDoc(doc(context.firestore(), 'users/uid4'));
      profileBeforeRetry = userDoc.data();
    });

    const res2 = await callActivateBetaUser(token);
    expect(res2.error).toBeUndefined();
    expect(res2.result.status).toBe('already_active');

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const userDoc = await getDoc(doc(context.firestore(), 'users/uid4'));
      expect(userDoc.data()).toEqual(profileBeforeRetry);
    });
  });
});
