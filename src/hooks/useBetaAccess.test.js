import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  onSnapshot: vi.fn(),
  httpsCallable: vi.fn(),
  auth: { currentUser: null },
}));

vi.mock('../firebase', () => ({ auth: mocks.auth, db: {}, functions: {} }));
vi.mock('firebase/firestore', () => ({
  doc: (_db, ...path) => path.join('/'),
  onSnapshot: mocks.onSnapshot,
}));
vi.mock('firebase/functions', () => ({ httpsCallable: mocks.httpsCallable }));

import { useBetaAccess } from './useBetaAccess';

const snap = (data) => ({ exists: () => data !== null, data: () => data });

describe('useBetaAccess', () => {
  let emit;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.onSnapshot.mockImplementation((_ref, onNext, onError) => {
      emit = { next: onNext, error: onError };
      return vi.fn();
    });
  });

  it('devuelve signed-out sin uid y no se suscribe', () => {
    const { result } = renderHook(() => useBetaAccess(undefined));
    expect(result.current.status).toBe('signed-out');
    expect(mocks.onSnapshot).not.toHaveBeenCalled();
  });

  it('pasa de checking a active cuando el perfil está activo', () => {
    const { result } = renderHook(() => useBetaAccess('alice'));
    expect(result.current.status).toBe('checking');
    expect(mocks.onSnapshot.mock.calls[0][0]).toBe('users/alice');
    act(() => emit.next(snap({ active: true })));
    expect(result.current.status).toBe('active');
  });

  it('marca inactive si el perfil no existe', () => {
    const { result } = renderHook(() => useBetaAccess('bob'));
    act(() => emit.next(snap(null)));
    expect(result.current.status).toBe('inactive');
  });

  it('marca error si falla la lectura del perfil', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useBetaAccess('bob'));
    act(() => emit.error(new Error('boom')));
    expect(result.current.status).toBe('error');
  });

  it('activate refresca el token y llama a activateBetaUser', async () => {
    const getIdToken = vi.fn().mockResolvedValue('t');
    mocks.auth.currentUser = { getIdToken };
    const callable = vi.fn().mockResolvedValue({ data: { status: 'activated' } });
    mocks.httpsCallable.mockReturnValue(callable);

    const { result } = renderHook(() => useBetaAccess('alice'));
    const data = await result.current.activate();

    expect(getIdToken).toHaveBeenCalledWith(true);
    expect(mocks.httpsCallable).toHaveBeenCalledWith({}, 'activateBetaUser');
    expect(data).toEqual({ status: 'activated' });
  });
});
