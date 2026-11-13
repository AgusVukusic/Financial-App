import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mocks = vi.hoisted(() => ({ auth: { currentUser: null }, httpsCallable: vi.fn() }));
vi.mock('../firebase', () => ({ auth: mocks.auth, functions: {} }));
vi.mock('firebase/functions', () => ({ httpsCallable: mocks.httpsCallable }));

// USE_HTTP se lee al cargar el módulo: se importa después de fijar la variable
const loadApi = async (transport) => {
  vi.stubEnv('VITE_API_TRANSPORT', transport);
  vi.resetModules();
  return import('./api');
};

const jsonResponse = (status, body) => ({ ok: status < 400, status, json: async () => body });

describe('invokeFn / callFn', () => {
  beforeEach(() => {
    mocks.auth.currentUser = { getIdToken: vi.fn().mockResolvedValue('tok') };
    vi.stubGlobal('fetch', vi.fn());
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('modo http: POST /api/<fn> con Bearer y devuelve result', async () => {
    const { invokeFn } = await loadApi('http');
    fetch.mockResolvedValue(jsonResponse(200, { result: { ok: 1 } }));

    await expect(invokeFn('createAccount', { name: 'Caja' })).resolves.toEqual({ ok: 1 });
    expect(fetch).toHaveBeenCalledWith('/api/createAccount', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer tok' },
      body: JSON.stringify({ data: { name: 'Caja' } }),
    });
    expect(mocks.httpsCallable).not.toHaveBeenCalled();
  });

  it('modo http: errores del servidor conservan el formato functions/<código>', async () => {
    const { invokeFn, callFn } = await loadApi('http');
    fetch.mockResolvedValue(jsonResponse(400, { error: { code: 'failed-precondition', message: 'Tiene movimientos.' } }));

    await expect(invokeFn('deleteAccount')).rejects.toMatchObject({
      code: 'functions/failed-precondition',
      message: 'Tiene movimientos.',
    });
    // callFn muestra el mensaje del servidor porque el código es apto para el usuario
    await expect(callFn('deleteAccount')).rejects.toThrow('Tiene movimientos.');
  });

  it('modo http: sin red → functions/unavailable con mensaje genérico en callFn', async () => {
    const { callFn } = await loadApi('http');
    fetch.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(callFn('setBudget')).rejects.toMatchObject({
      code: 'functions/unavailable',
      message: 'No se pudo completar la operación. Intentá de nuevo.',
    });
  });

  it('modo callable: usa httpsCallable y no fetch', async () => {
    const { invokeFn } = await loadApi('');
    mocks.httpsCallable.mockReturnValue(vi.fn().mockResolvedValue({ data: { ok: 2 } }));

    await expect(invokeFn('setBudget', { a: 1 })).resolves.toEqual({ ok: 2 });
    expect(fetch).not.toHaveBeenCalled();
  });
});
