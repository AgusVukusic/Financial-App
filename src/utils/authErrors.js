const GENERIC = 'No pudimos completar la operación. Probá de nuevo.';

const MESSAGES = {
  'auth/invalid-credential': 'El correo o la contraseña no coinciden.',
  'auth/user-not-found': 'El correo o la contraseña no coinciden.',
  'auth/wrong-password': 'El correo o la contraseña no coinciden.',
  'auth/email-already-in-use': 'Ese correo ya tiene una cuenta. Probá ingresar.',
  'auth/weak-password': 'La contraseña tiene que tener al menos 6 caracteres.',
  'auth/invalid-email': 'Revisá el correo: no parece válido.',
  'auth/network-request-failed': 'Sin conexión. Revisá internet y probá de nuevo.',
  'auth/too-many-requests': 'Demasiados intentos. Esperá unos minutos y probá de nuevo.',
  'auth/user-disabled': 'Esta cuenta está deshabilitada.',
};

/** Texto para mostrar a la persona a partir de un error de Firebase Auth. Nunca devuelve `err.message`. */
export const authErrorMessage = (err) => {
  const code = err && typeof err === 'object' ? err.code : undefined;
  return (typeof code === 'string' && Object.hasOwn(MESSAGES, code) && MESSAGES[code]) || GENERIC;
};
