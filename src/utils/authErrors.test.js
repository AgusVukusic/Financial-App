import { describe, it, expect } from 'vitest';
import { authErrorMessage } from './authErrors';

describe('authErrorMessage', () => {
  it.each([
    ['auth/invalid-credential', 'El correo o la contraseña no coinciden.'],
    ['auth/user-not-found', 'El correo o la contraseña no coinciden.'],
    ['auth/wrong-password', 'El correo o la contraseña no coinciden.'],
    ['auth/email-already-in-use', 'Ese correo ya tiene una cuenta. Probá ingresar.'],
    ['auth/weak-password', 'La contraseña tiene que tener al menos 6 caracteres.'],
    ['auth/invalid-email', 'Revisá el correo: no parece válido.'],
    ['auth/network-request-failed', 'Sin conexión. Revisá internet y probá de nuevo.'],
    ['auth/too-many-requests', 'Demasiados intentos. Esperá unos minutos y probá de nuevo.'],
    ['auth/user-disabled', 'Esta cuenta está deshabilitada.'],
  ])('%s', (code, expected) => {
    expect(authErrorMessage({ code, message: 'Firebase: Error (' + code + ').' })).toBe(expected);
  });

  it('usa el texto genérico para códigos desconocidos o sin código, sin filtrar err.message', () => {
    const generic = 'No pudimos completar la operación. Probá de nuevo.';
    expect(authErrorMessage({ code: 'auth/algo-raro', message: 'Firebase: Error' })).toBe(generic);
    expect(authErrorMessage(new Error('boom'))).toBe(generic);
    expect(authErrorMessage(undefined)).toBe(generic);
    expect(authErrorMessage(null)).toBe(generic);
    expect(authErrorMessage({ code: 'toString' })).toBe(generic);
  });
});
