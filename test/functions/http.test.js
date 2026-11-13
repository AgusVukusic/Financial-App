// @vitest-environment node
import { createRequire } from 'node:module';
import path from 'node:path';
import { describe, it, expect, vi } from 'vitest';

// Resolver desde functions/ para usar la misma copia de firebase-functions que http.js
const requireFn = createRequire(path.resolve(__dirname, '../../functions/http.js'));
const { createHttpHandler } = requireFn('./http.js');
const { HttpsError } = requireFn('firebase-functions/v2/https');

const decoded = { uid: 'alice', email: 'a@x.com', email_verified: true };

const setup = (handlers) => {
  const verifyIdToken = vi.fn(async (token) => {
    if (token !== 'good') throw new Error('bad token');
    return decoded;
  });
  const logger = { error: vi.fn() };
  const handle = createHttpHandler({ handlers, verifyIdToken, logger });
  return { handle, verifyIdToken, logger };
};

const post = (fn, extra = {}) => ({ method: 'POST', fn, authorization: 'Bearer good', body: { data: { a: 1 } }, ...extra });

describe('createHttpHandler', () => {
  it('pasa auth verificado y data al handler y envuelve el resultado', async () => {
    const echo = vi.fn(async (request) => ({ got: request }));
    const { handle, verifyIdToken } = setup({ echo });

    const res = await handle(post('echo'));

    expect(verifyIdToken).toHaveBeenCalledWith('good');
    expect(echo).toHaveBeenCalledWith({ auth: { uid: 'alice', token: decoded }, data: { a: 1 } });
    expect(res).toEqual({ status: 200, body: { result: { got: { auth: { uid: 'alice', token: decoded }, data: { a: 1 } } } } });
  });

  it('sin Authorization llama al handler con auth null', async () => {
    const echo = vi.fn(async (request) => request.auth);
    const { handle, verifyIdToken } = setup({ echo });

    const res = await handle(post('echo', { authorization: undefined }));

    expect(verifyIdToken).not.toHaveBeenCalled();
    expect(res).toEqual({ status: 200, body: { result: null } });
  });

  it('token inválido o mal formado → 401 unauthenticated sin llamar al handler', async () => {
    const echo = vi.fn();
    const { handle } = setup({ echo });

    for (const authorization of ['Bearer bad', 'Basic xyz']) {
      const res = await handle(post('echo', { authorization }));
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('unauthenticated');
    }
    expect(echo).not.toHaveBeenCalled();
  });

  it('mapea HttpsError a su status HTTP con código y mensaje', async () => {
    const { handle } = setup({
      fail: async () => {
        throw new HttpsError('failed-precondition', 'La cuenta tiene movimientos.');
      },
    });

    const res = await handle(post('fail'));

    expect(res).toEqual({
      status: 400,
      body: { error: { code: 'failed-precondition', message: 'La cuenta tiene movimientos.' } },
    });
  });

  it('errores inesperados → 500 internal sin filtrar detalles', async () => {
    const { handle, logger } = setup({
      boom: async () => {
        throw new Error('secreto interno');
      },
    });

    const res = await handle(post('boom'));

    expect(res).toEqual({ status: 500, body: { error: { code: 'internal', message: 'Error interno.' } } });
    expect(logger.error).toHaveBeenCalled();
  });

  it('rechaza funciones inexistentes o heredadas y métodos distintos de POST', async () => {
    const { handle } = setup({ echo: vi.fn() });

    expect((await handle(post('nope'))).status).toBe(404);
    expect((await handle(post('constructor'))).status).toBe(404);
    expect((await handle(post('__proto__'))).status).toBe(404);
    expect((await handle(post('echo', { method: 'GET' }))).status).toBe(405);
  });
});
