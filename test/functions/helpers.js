const PROJECT_ID = 'financial-app-beta';
const REGION = 'southamerica-east1';
const PORT = 5001;

export function createMockToken(uid, email = `${uid}@test.com`, emailVerified = true) {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64');
  const payload = Buffer.from(JSON.stringify({
    sub: uid,
    user_id: uid,
    email,
    email_verified: emailVerified,
    auth_time: Math.floor(Date.now() / 1000),
  })).toString('base64');
  return `${header}.${payload}.signature`;
}

/** Llama a una Callable del emulador. Devuelve { result } o { error: { status, message } }. */
export async function callFn(name, token, data = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`http://127.0.0.1:${PORT}/${PROJECT_ID}/${REGION}/${name}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ data }),
  });
  return res.json();
}

export const FUNCTIONS_PROJECT_ID = PROJECT_ID;
