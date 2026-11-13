// Función serverless de Vercel: POST /api/<nombre> → handler de functions/handlers.js.
// Toda la lógica (auth, errores) vive en functions/http.js; esto solo adapta req/res.
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
// Ruta estática: Vercel la rastrea para incluir functions/ en el bundle
const { createDefaultHttpHandler } = require('../functions/http.js');

let handle; // una inicialización del Admin SDK por instancia (se reutiliza en invocaciones "warm")

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    handle ??= createDefaultHttpHandler();
  } catch (error) {
    console.error('No se pudo inicializar el backend:', error);
    return res.status(500).json({ error: { code: 'internal', message: 'Error interno.' } });
  }

  let body;
  try {
    body = req.body; // Vercel parsea JSON y lanza si viene mal formado
  } catch {
    return res.status(400).json({ error: { code: 'invalid-argument', message: 'JSON inválido.' } });
  }

  const { status, body: payload } = await handle({
    method: req.method,
    fn: req.query.fn,
    authorization: req.headers.authorization,
    body,
  });
  return res.status(status).json(payload);
}
