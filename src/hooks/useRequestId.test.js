import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Evita inicializar Firebase real: solo se necesita el generador de IDs.
vi.mock('../services/api', () => ({ newRequestId: () => globalThis.crypto.randomUUID() }));

import { useRequestId } from './useRequestId';

describe('useRequestId', () => {
  it('devuelve el mismo ID mientras el contenido no cambia (reintento tras error)', () => {
    const { result } = renderHook(() => useRequestId());
    const first = result.current.getId({ amount: 10, accountId: 'a' });
    expect(result.current.getId({ amount: 10, accountId: 'a' })).toBe(first);
  });

  it('genera un ID nuevo si el usuario cambia algo', () => {
    const { result } = renderHook(() => useRequestId());
    const first = result.current.getId({ amount: 10 });
    expect(result.current.getId({ amount: 11 })).not.toBe(first);
  });

  it('reset() descarta el ID tras una acción exitosa', () => {
    const { result } = renderHook(() => useRequestId());
    const first = result.current.getId({ amount: 10 });
    result.current.reset();
    expect(result.current.getId({ amount: 10 })).not.toBe(first);
  });

  it('el ID cumple el formato que acepta el servidor (sin guion bajo)', () => {
    const { result } = renderHook(() => useRequestId());
    expect(result.current.getId({ a: 1 })).toMatch(/^[A-Za-z0-9-]{8,64}$/);
  });
});
