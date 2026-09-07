const { initializeApp } = require('firebase-admin/app');
const { setGlobalOptions } = require('firebase-functions/v2');

// Inicializar la app de Admin SDK
initializeApp();

// Configuración global para V2
setGlobalOptions({
  region: process.env.VITE_FIREBASE_FUNCTIONS_REGION || 'southamerica-east1',
  maxInstances: 10,
});

// Exportar funciones (skeleton)
// exports.transactions = require('./transactions');
// exports.accounts = require('./accounts');
