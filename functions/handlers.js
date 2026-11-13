/**
 * Lógica de negocio independiente del transporte.
 *
 * Cada handler recibe `{ auth: { uid, token } | null, data }` y devuelve un objeto
 * serializable o lanza `HttpsError`. No depende de `onCall`: lo envuelven tanto las
 * Cloud Functions (index.js) como cualquier otro servidor HTTP (p. ej. Vercel), que
 * debe armar `auth` a partir de un ID token de Firebase ya verificado.
 *
 * Requiere que el Admin SDK ya esté inicializado (initializeApp) antes de invocar.
 */
const accounts = require('./finance/accounts');
const transactions = require('./finance/transactions');
const budgets = require('./finance/budgets');
const subscriptions = require('./finance/subscriptions');

module.exports = {
  activateBetaUser: require('./auth/activateBetaUser').activateBetaUser,

  createAccount: accounts.createAccount,
  updateAccount: accounts.updateAccount,
  deleteAccount: accounts.deleteAccount,

  createTransaction: transactions.createTransaction,
  voidTransaction: transactions.voidTransaction,
  replaceTransaction: transactions.replaceTransaction,

  setBudget: budgets.setBudget,

  createSubscription: subscriptions.createSubscription,
  updateSubscription: subscriptions.updateSubscription,
  deleteSubscription: subscriptions.deleteSubscription,
  paySubscription: subscriptions.paySubscription,
};
