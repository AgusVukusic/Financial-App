# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Vite dev server
npm run emulators        # Auth (9099) + Firestore + Functions emulators; frontend uses them if VITE_USE_FIREBASE_EMULATORS="true"
npm run build            # production build (PWA via vite-plugin-pwa)
npm run lint             # ESLint (flat config, eslint.config.js)
npm test                 # unit tests only (Vitest + jsdom), = test:unit
npm run test:rules       # Firestore rules tests, runs inside Firestore emulator
npm run test:functions   # Cloud Functions tests, runs inside Firestore+Functions emulators
npm run test:all         # all three
npx vitest run src/utils/calculations.test.js   # single test file
npx vitest run -t "test name"                   # single test by name
```

- `test:rules` / `test:functions` use `firebase-tools emulators:exec --project beta` (ports: Firestore 8080, Functions 5001, UI 4000). They are excluded from `test:unit` because they need the emulators; don't run those files with plain `vitest`.
- CI (`.github/workflows/test.yml`, Node 20) only runs unit tests on push/PR to `main`.
- Cloud Functions live in `functions/` (CommonJS, Node 20, own `package.json` — run `npm install` there separately).
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
- When changing rules or functions, update `test/firestore.rules.test.js` / `test/functions/*.test.js` accordingly.
