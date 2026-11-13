// Servidor local que imita las funciones /api de Vercel contra los emuladores de Firebase.
// Uso: `npm run emulators` en una terminal, `npm run dev:api` en otra, y Vite con
// VITE_API_TRANSPORT=http (vite.config.js redirige /api a este puerto).
import http from 'node:http';
import { createRequire } from 'node:module';

process.env.FIREBASE_PROJECT_ID ??= 'financial-app-beta';
process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';

const require = createRequire(import.meta.url);
const { createDefaultHttpHandler } = require('../functions/http.js');
const handle = createDefaultHttpHandler();
const PORT = Number(process.env.API_PORT || 5002);

const send = (res, status, payload) => {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(payload));
};

http
  .createServer(async (req, res) => {
    const match = /^\/api\/([^/?]+)/.exec(req.url);
    if (!match) return send(res, 404, { error: { code: 'not-found', message: 'Ruta inexistente.' } });

    let raw = '';
    for await (const chunk of req) raw += chunk;
    let body;
    try {
      body = raw ? JSON.parse(raw) : undefined;
    } catch {
      return send(res, 400, { error: { code: 'invalid-argument', message: 'JSON inválido.' } });
    }

    const { status, body: payload } = await handle({
      method: req.method,
      fn: decodeURIComponent(match[1]),
      authorization: req.headers.authorization,
      body,
    });
    send(res, status, payload);
  })
  .listen(PORT, () => console.log(`API local (emuladores) en http://127.0.0.1:${PORT}/api`));
