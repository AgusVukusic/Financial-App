# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Vite dev server
npm run emulators        # Auth (9099) + Firestore + Functions emulators; frontend uses them if VITE_USE_FIREBASE_EMULATORS="true"
npm run dev:api          # local stand-in for Vercel /api (port 5002) against the emulators; Vite proxies /api to it
npm run build            # production build (PWA via vite-plugin-pwa)
npm run lint             # ESLint (flat config, eslint.config.js)
npm test                 # unit tests only (Vitest + jsdom), = test:unit
npm run test:rules       # Firestore rules tests, runs inside Firestore emulator
npm run test:functions   # Cloud Functions tests, runs inside Firestore+Functions emulators
npm run test:all         # all three
npx vitest run src/utils/calculations.test.js   # single test file
npx vitest run -t "test name"                   # single test by name
```

- Tests that need emulators are named `*.emulator.test.js` (`test/firestore.rules.emulator.test.js`, `test/functions/*.emulator.test.js`): `test:unit` excludes that pattern, `test:rules`/`test:functions` run them via `firebase-tools emulators:exec --project beta` (Firestore 8080, Functions 5001, UI 4000). Function tests run serially (`--no-file-parallelism`) because files share one emulator project and each calls `clearFirestore()`. In those tests `withSecurityRulesDisabled` resolves to void — capture results in a variable.
- CI (`.github/workflows/test.yml`, Node 20, runs on push/PR to `main` and manually): job `app` = lint + unit tests + build; job `emulators` = Java 21 + `test:rules` + `test:functions`. `firebase-tools` is pinned (`npx firebase-tools@15.35.0`) in the npm scripts; bump it together with the emulator cache key in the workflow. Lint has 0 errors; the React-compiler style rules (`set-state-in-effect`, `immutability`, `preserve-manual-memoization`, `only-export-components`) are deliberately set to `warn` in `eslint.config.js` (12 warnings remain).
- Cloud Functions live in `functions/` (CommonJS, Node 20, own `package.json` — run `npm install` there separately). Business logic is transport-agnostic: each module exports plain `async (request)` handlers (`request = { auth: { uid, token } | null, data }`, errors as `HttpsError`), collected in `functions/handlers.js`; `functions/index.js` only wraps them with `onCall`.
- Production backend = Vercel Hobby (free; Firebase stays on Spark, no Cloud Functions deploy). `api/[fn].js` (ESM, loads CJS via `createRequire`) → `functions/http.js` (`createHttpHandler`: POST only, `Object.hasOwn` lookup, `Authorization: Bearer <ID token>` → `verifyIdToken` → `{ auth: { uid, token }, data }`; responses `{ result }` / `{ error: { code, message } }` with the HttpsError HTTP status). Admin SDK init from `FIREBASE_SERVICE_ACCOUNT` (base64 JSON) or, with emulator hosts set, `FIREBASE_PROJECT_ID`. Vercel installs only the root `package.json`, so `firebase-admin`/`firebase-functions` are also root deps; root `engines.node` is 22.x (Vercel), `functions/` stays Node 20. `vercel.json` pins region `gru1` and rewrites non-`/api` paths to the SPA; the PWA has `navigateFallbackDenylist: [/^/api//]`.
- Frontend transport: `invokeFn` in `src/services/api.js` uses `fetch('/api/<fn>')` when `VITE_API_TRANSPORT=http`, otherwise `httpsCallable`; both produce errors with `code: 'functions/<code>'`, so `errorMessage()` and `ActivationScreen` work unchanged.
- Env: copy `.env.example` → `.env`; Firebase config is read from `VITE_FIREBASE_*` vars in `src/firebase.js`. Firebase project alias `beta` → `financial-app-beta`; functions region `southamerica-east1`.

## Architecture

React 19 + Vite SPA (PWA), Firebase Auth + Firestore as backend; UI text is Spanish.

**Data flow**: `src/App.jsx` is the root orchestrator — it calls all data hooks (`useUser`, `useTransactions(month, year, uid)`, `useAccounts`, `useBudgets`, `useSubscriptions`, `useTheme`), holds the selected month and active tab, and passes data/mutators down as props to tab views (Dashboard, Reports, Profile, Groups, SubscriptionsManager). There is no router or global store; navigation is the `activeTab` state rendered through `Layout`. Unauthenticated users see `LandingPage` → `WelcomeScreen` (login).

**Hooks (`src/hooks/`)** own all Firestore access: each subscribes with `onSnapshot` filtered by `userId == uid` and exposes CRUD callbacks. Balance-affecting writes (`useTransactions`) use `runTransaction` to update `accounts.currentBalance` atomically alongside the transaction doc. Transactions are queried by ISO `date` string range and sorted locally (date, then `createdAt`) to avoid composite indexes. Groups/shared expenses are in `useGroups` + `components/GroupDetails.jsx`, with debt settlement in `utils/settlementAlgorithm.js`.

**Pure logic** lives in `src/utils/` (`calculations.js`, `formatters.js`, `subscriptionUtils.js`) — this is where unit tests concentrate. Shared UI primitives are in `src/components/ui/` (CSS Modules); toasts via `ToastContext`, confirmations via `contexts/DialogContext`.

Domain conventions (from README):
- Cash accounts are detected by `isCashAccount` (`type === 'cash'` OR name contains `"efectivo"`) for legacy data; cash settlements skip the receiver-confirmation step.
- Dates are stored as local ISO strings at 12:00 to avoid timezone day shifts.

## In-progress migration (branch `feature/production-readiness`) — important

The repo is mid-transition to a "Beta V1" server-authoritative model. See `docs/adr/001-*` and `002-*`:

- **`firestore.rules` already denies ALL client writes** (`accounts`, `transactions`, `budgets`, `subscriptions`, `users`, `betaInvites`; everything else including `groups` is denied by default). The frontend hooks still write directly with the old V1 contract (`amount`, `type`, `date`), so they will fail against these rules until migrated.
- Target contract (ADR 001): writes only through Callable Cloud Functions (Admin SDK); amounts as integer `amountMinor` (cents), `currency: 'ARS'`, `direction: 'IN'|'OUT'`, `occurredAt`, server `createdAt`, `schemaVersion: 1`; transactions are immutable (corrections via compensating transactions). Don't mix V1 and V2 fields — the frontend switch must be atomic.
- Access gate (ADR 002): `activateBetaUser` callable (`functions/auth/activateBetaUser.js`) checks the verified-email auth token against `betaInvites/{normalizedEmail}` and idempotently creates `users/{uid}`. It trusts only `request.auth`, never the payload. Frontend side: `useBetaAccess(uid)` watches `users/{uid}`; `App.jsx` shows `ActivationScreen` (auto-calls the function) until the profile is active, and only then passes `activeUid` to the data hooks.
- Beta scope decision: **Groups are out of the Beta** (tab, route and MigrationButton / resync button removed from the UI; `useGroups.js`/`Groups.jsx`/`GroupDetails.jsx` remain but are unreachable and have no Firestore rules). Needs its own ADR before returning.
- Implemented callables (`functions/finance/`): `createAccount`, `updateAccount` (name/type only), `deleteAccount` (rejects if the account has movements), `createTransaction` (income | expense | transfer), `voidTransaction`. Shared helpers in `functions/utils/guards.js` (`requireAuth`, `requireActiveUser`, `requireOwned`) and `validate.js`. Conventions: client sends `requestId` used as doc ID (idempotent retries); every referenced account/transaction is checked for `userId` ownership inside the Firestore transaction; accounts hold `balanceMinor` (only functions write it); transfers are two docs `<id>_out`/`<id>_in` sharing `transferId`; a void is doc `void_<id>` (kind `void`, opposite direction, keeps original `occurredAt`) — clients must treat original + void as cancelled; edit = void + create.
- Also implemented: `setBudget` (doc `budgets/{uid}` with `limitsMinor: { category: cents }`), `createSubscription`/`updateSubscription`/`deleteSubscription` and `paySubscription` (atomically creates the expense, debits the account and sets `lastPaidAt`; amount/category/account come from the stored subscription). Subscription fields renamed for V2: `amountMinor`, `dueDay` (was `dueDate`), `lastPaidAt` (Timestamp, was `lastPaidDate`), `accountId` required. `requestId` must not contain `_` (server-derived IDs use it). Shared ledger helpers in `functions/finance/ledger.js`.
- `replaceTransaction` (atomic edit = void + create; a subscription payment can only be replaced by another expense). Void/replace logic lives in shared read/apply plan helpers in `functions/finance/transactions.js` (all reads before writes).
- Frontend data layer (done): hooks read Firestore and write only through `src/services/api.js` (`callFn`, `newRequestId`, `errorMessage`). Components still work in pesos with V1-shaped view models; conversion is isolated in `src/utils/money.js` (`toMinor`/`fromMinor`) and `src/utils/mappers.js` (hides void pairs, merges transfer legs, renames subscription fields). `useRequestId` keeps one idempotency key per user action while the form content is unchanged. Month queries use `occurredAt` with `Date` bounds (strings return empty silently).
- Verified end to end in the browser against the emulators (activation, account, expense edit/delete, transfer + void, budget, subscription create + pay). To repeat: `npm run emulators`, then run Vite with `VITE_USE_FIREBASE_EMULATORS=true` and `VITE_FIREBASE_PROJECT_ID=financial-app-beta` (no `.env` is committed); verify the email via `http://127.0.0.1:9099/emulator/v1/projects/financial-app-beta/oobCodes` and create `betaInvites/<email>` in the Firestore emulator. First call to each function in the emulator takes ~20 s (cold start).
- Still TODO: create the Vercel project (env: `FIREBASE_SERVICE_ACCOUNT`, `VITE_FIREBASE_*`, `VITE_API_TRANSPORT=http`), deploy Firestore rules + indexes to `financial-app-beta` (works on Spark), load real `betaInvites`, real-cloud smoke test. Cloud Functions are NOT deployed (would need Blaze). `firestore.indexes.json` has the `transactions(userId, occurredAt)` composite index; budgets rule is `isOwner(budgetId)` (doc ID = uid).
- When changing rules or functions, update `test/firestore.rules.emulator.test.js` / `test/functions/*.emulator.test.js` accordingly.
