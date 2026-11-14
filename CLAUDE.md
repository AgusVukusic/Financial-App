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
- CI (`.github/workflows/test.yml`, runs on push/PR to `main` and manually): job `app` (Node 22) = lint + unit tests + build; job `emulators` (Node 20, Java 21) = `test:rules` + `test:functions`. `firebase-tools` is pinned (`npx firebase-tools@15.35.0`) in the npm scripts; bump it together with the emulator cache key in the workflow. Lint has 0 errors; the React-compiler style rules (`set-state-in-effect`, `immutability`, `preserve-manual-memoization`, `only-export-components`) are deliberately set to `warn` in `eslint.config.js` (12 warnings remain).
- Cloud Functions live in `functions/` (CommonJS, Node 20, own `package.json` — run `npm install` there separately). Business logic is transport-agnostic: each module exports plain `async (request)` handlers (`request = { auth: { uid, token } | null, data }`, errors as `HttpsError`), collected in `functions/handlers.js`; `functions/index.js` only wraps them with `onCall`.
- Production backend = Vercel Hobby (free; Firebase stays on Spark, no Cloud Functions deploy). `api/[fn].js` (ESM, default-imports the CommonJS `functions/http.js`) → `functions/http.js` (`createHttpHandler`: POST only, `Object.hasOwn` lookup, `Authorization: Bearer <ID token>` → `verifyIdToken` → `{ auth: { uid, token }, data }`; responses `{ result }` / `{ error: { code, message } }` with the HttpsError HTTP status). Admin SDK init from `FIREBASE_SERVICE_ACCOUNT` (base64 JSON) or, with emulator hosts set, `FIREBASE_PROJECT_ID`. Vercel installs only the root `package.json`, so `firebase-admin`/`firebase-functions` are also root deps (keep `firebase-admin` on ^13 in both package.json files: v14 pulls jwks-rsa 4 → ESM-only jose via `require()`, which crashes on Vercel's runtime with `ERR_REQUIRE_ESM`; reproduce with `node --no-experimental-require-module`); root `engines.node` is 22.x (Vercel), `functions/` stays Node 20. `vercel.json` pins region `gru1` and rewrites non-`/api` paths to the SPA; the PWA has `navigateFallbackDenylist: [/^\/api\//]`.
- Frontend transport: `invokeFn` in `src/services/api.js` uses `fetch('/api/<fn>')` when `VITE_API_TRANSPORT=http`, otherwise `httpsCallable`; both produce errors with `code: 'functions/<code>'`, so `errorMessage()` and `ActivationScreen` work unchanged.
- Env: copy `.env.example` → `.env`; Firebase config is read from `VITE_FIREBASE_*` vars in `src/firebase.js`. Firebase project alias `beta` → `financial-app-beta`; functions region `southamerica-east1`.

## Architecture

React 19 + Vite SPA (PWA), Firebase Auth + Firestore, server logic on Vercel `/api`; UI text is Spanish. Live Beta: https://financial-app-seven-cyan.vercel.app (Vercel project auto-deploys `main`) on Firebase project `financial-app-beta` (Spark plan, Firestore in `southamerica-east1`). Design decisions: `docs/adr/001-*` (financial contract) and `002-*` (activation flow).

**Data flow**: `src/App.jsx` is the root orchestrator — it calls all data hooks (`useUser`, `useBetaAccess`, `useTransactions(month, year, uid)`, `useAccounts`, `useBudgets`, `useSubscriptions`, `useTheme`), holds the selected month and active tab, and passes data/mutators down as props to tab views (Dashboard, Reports, Profile, SubscriptionsManager). No router or global store; navigation is the `activeTab` state rendered through `Layout`. Unauthenticated users see `LandingPage` → `WelcomeScreen` (email/password + email verification).

**Access gate (ADR 002)**: `activateBetaUser` checks the verified-email token against `betaInvites/{lowercased email}` and idempotently creates `users/{uid}`; it trusts only `request.auth`. `useBetaAccess(uid)` watches `users/{uid}`; `App.jsx` shows `ActivationScreen` (auto-calls the function) until the profile is active, and only then passes `activeUid` to the data hooks. Invitations are added by hand in the Firebase console (`betaInvites` is not client-readable).

**Server-authoritative writes (ADR 001)**: `firestore.rules` denies ALL client writes (`accounts`, `transactions`, `budgets`, `subscriptions`, `users`, `betaInvites`; anything else, incl. `groups`, denied by default). Every write goes through a handler in `functions/`. Contract: integer `amountMinor` (cents), `currency: 'ARS'`, `direction: 'IN'|'OUT'`, `occurredAt` Timestamp, server `createdAt`, `schemaVersion: 1`; transactions are immutable.
- Handlers (`functions/finance/`): `createAccount`, `updateAccount` (name/type only), `deleteAccount` (rejects if the account has movements or a linked subscription), `createTransaction` (income | expense | transfer), `voidTransaction`, `replaceTransaction` (atomic edit = void + create; a subscription payment can only be replaced by another expense), `setBudget` (doc `budgets/{uid}`, `limitsMinor: { category: cents }`), `createSubscription`/`updateSubscription`/`deleteSubscription`, `paySubscription` (atomically creates the expense, debits the account, sets `lastPaidAt`). Helpers: `functions/utils/guards.js` (`requireAuth`, `requireActiveUser`, `requireOwned`), `validate.js`, `finance/ledger.js`; void/replace use shared read/apply plan helpers in `finance/transactions.js` (all reads before writes).
- Conventions: client sends `requestId` used as doc ID (idempotent retries; must not contain `_`, reserved for server-derived IDs); ownership (`userId`) is checked inside the Firestore transaction; accounts hold `balanceMinor` (only the server writes it); transfers are two docs `<id>_out`/`<id>_in` sharing `transferId`; a void is doc `void_<id>` (kind `void`, opposite direction, keeps original `occurredAt`) — clients treat original + void as cancelled. Subscriptions: `amountMinor`, `dueDay`, `lastPaidAt`, `accountId` required.

**Frontend data layer**: hooks (`src/hooks/`) read Firestore with `onSnapshot` filtered by `userId == uid` and write only through `src/services/api.js` (`callFn`, `invokeFn`, `newRequestId`, `errorMessage`). Components work in pesos with V1-shaped view models; conversion is isolated in `src/utils/money.js` (`toMinor`/`fromMinor`) and `src/utils/mappers.js` (hides void pairs, merges transfer legs, renames subscription fields). `useRequestId` keeps one idempotency key per user action while the form content is unchanged. Month queries use `occurredAt` with `Date` bounds (string bounds return empty silently); `firestore.indexes.json` has the `transactions(userId, occurredAt)` index.

**Pure logic** lives in `src/utils/` (`calculations.js`, `formatters.js`, `subscriptionUtils.js`, `money.js`, `mappers.js`). Shared UI primitives are in `src/components/ui/` (CSS Modules, import from `components/ui`); toasts via `ToastContext`, confirmations via `contexts/DialogContext`. Design tokens (light/dark, "Panel de taller") live in `src/styles/tokens.css` — use those, not the legacy aliases at the bottom of that file; rules and component guide in `docs/ui-redesign/design-system.md`. `npm run dev` + `/showcase.html` shows every component in both themes (dev only, not in the build).

**Groups are out of the Beta**: `useGroups.js`/`Groups.jsx`/`GroupDetails.jsx` (+ `utils/settlementAlgorithm.js`) remain but are unreachable and have no Firestore rules. Needs its own ADR before returning.

## Local end-to-end run

`npm run emulators`, `npm run dev:api`, then Vite with `VITE_USE_FIREBASE_EMULATORS=true`, `VITE_FIREBASE_PROJECT_ID=financial-app-beta`, `VITE_API_TRANSPORT=http` (no `.env` is committed). Verify the email via `http://127.0.0.1:9099/emulator/v1/projects/financial-app-beta/oobCodes` and create `betaInvites/<email>` in the Firestore emulator. Without `VITE_API_TRANSPORT=http` the frontend uses the Functions emulator instead (first call per function ~20 s cold start).

## Deploying

- Frontend + `/api`: merge to `main` (Vercel builds it). `VITE_*` vars are read at build time — after changing them in Vercel (Settings → Environments → Production), Redeploy. Server env: `FIREBASE_SERVICE_ACCOUNT` (base64 service-account JSON).
- Firestore rules/indexes: `npx firebase-tools@15.35.0 deploy --only firestore:rules,firestore:indexes --project beta`. Never a plain `firebase deploy`: Cloud Functions need the Blaze plan and are not used in production.
- When changing rules or handlers, update `test/firestore.rules.emulator.test.js` / `test/functions/*.emulator.test.js` accordingly.
