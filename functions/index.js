const { initializeApp } = require('firebase-admin/app');
const { setGlobalOptions } = require('firebase-functions/v2');
const { onCall } = require('firebase-functions/v2/https');
const handlers = require('./handlers');

// Inicializar la app de Admin SDK
initializeApp();

// Configuración global para V2
setGlobalOptions({
  region: process.env.VITE_FIREBASE_FUNCTIONS_REGION || 'southamerica-east1',
  maxInstances: 10,
});

// Cada handler se expone como Callable con el mismo nombre (onCall arma request.auth/request.data)
for (const [name, handler] of Object.entries(handlers)) {
  exports[name] = onCall(handler);
}
