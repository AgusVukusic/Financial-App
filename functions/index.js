const { initializeApp } = require('firebase-admin/app');
const { setGlobalOptions } = require('firebase-functions/v2');

// Inicializar la app de Admin SDK
initializeApp();

// Configuración global para V2
setGlobalOptions({
  region: process.env.VITE_FIREBASE_FUNCTIONS_REGION || 'southamerica-east1',
  maxInstances: 10,
});

// Exportar funciones
exports.activateBetaUser = require('./auth/activateBetaUser').activateBetaUser;

const accounts = require('./finance/accounts');
exports.createAccount = accounts.createAccount;
exports.updateAccount = accounts.updateAccount;
exports.deleteAccount = accounts.deleteAccount;

const transactions = require('./finance/transactions');
exports.createTransaction = transactions.createTransaction;
exports.voidTransaction = transactions.voidTransaction;
exports.replaceTransaction = transactions.replaceTransaction;

const budgets = require('./finance/budgets');
exports.setBudget = budgets.setBudget;

const subscriptions = require('./finance/subscriptions');
exports.createSubscription = subscriptions.createSubscription;
exports.updateSubscription = subscriptions.updateSubscription;
exports.deleteSubscription = subscriptions.deleteSubscription;
exports.paySubscription = subscriptions.paySubscription;
