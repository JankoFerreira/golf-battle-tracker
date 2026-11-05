# Golf Battle Tracker

A functional, local-first Golf Battle performance tracker built with **React 19, TypeScript, Vite, Tailwind CSS, Lucide, Recharts, React Router and Dexie (IndexedDB)**.

## Run locally

Requires Node.js 20.19+ or 22.12+ and npm.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Production commands:

```sh
npm test
npm run build
```

`dist/` is the deployable static app. `npm run format` formats the source.

## Project structure

- `src/main.tsx` — application entry and hash routing
- `src/App.tsx` — navigation, layout, notifications and theme
- `src/pages/` — onboarding and all eight application pages
- `src/components.tsx` — shared cards, dialogs, charts and illustrations
- `src/shared.tsx` — filters, stat cards, match table/editor and export helpers
- `src/context.ts` — shared page prop types
- `src/domain.ts` — typed models, validation, ledger calculations and CSV handling
- `src/db.ts` — Dexie schema, initialization, atomic updates and backup restore
- `src/domain.test.ts` — financial/data-integrity regression tests
- `src/style.css` — responsive dark/light styling, with Tailwind integration
- `public/icon.svg` — app icon
- `vite.config.ts` — React, Tailwind, production chunks and offline PWA configuration
- `netlify.toml` — Netlify build and fallback configuration

## First visit

Every browser starts with onboarding. Players can create a fresh profile with their own balance or explicitly load Janko’s supplied history. Other players do not inherit his records automatically.

The historical import contains three summaries, not fabricated chronological matches:

| Course / club | Matches | Verified net profit |
| --- | ---: | ---: |
| Rocky Mountains / editable placeholder | 30 | +675 |
| Snowy Valley / Alaska | 2 | -400 |
| Snowy Valley / White Bear | 2 | +200 |
| Total | 34 | +475 |

The opening balance is 3,600 when loading this history. The +475 is included in performance analytics but **never applied again to the balance**. The two Snowy Valley pairs also stay as summaries because individual prizes and dates are unknown; their known finish order appears in their descriptions. No dates are invented. Only the supplied Rocky Mountains first-place prize (500) is preconfigured. All other prizes remain unknown until explicitly entered. Club levels and Rocky club stats are clearly marked as editable placeholders.

## Working features

- One-tap finish recording once payouts are configured; keyboard keys 1–6
- Last-used course/tier/club, optional notes and focus, strokes, shootout and mistake flags
- Unknown payout prompt, insufficient balance check and undo
- Dashboard, dated match history, course analytics, club garage, bankroll, focus and settings pages
- Course/tier/club creation and editing; deletion guarded against orphaned records
- Edit/delete matches and historical summaries; all following balances derive from the ledger
- Separate reward/correction transactions, editable risk limit and custom milestones
- Course/club/date/tier filtering, coin chart, finish chart, recent 10/20/50 performance and focus comparisons
- JSON backup/restore, match CSV import/export, analytics CSV export
- Dark/light theme, phone navigation and responsive layout
- Offline app shell after the first production load; Web App Manifest for installation

## Data rules

All coin fields are bounded safe integers. Net match profit is `prize - fee`. A stored match snapshots the fee and prize; later tier edits do not rewrite past financial records. Rewards and corrections are distinct transactions. Corrections are signed deltas, not absolute balances.

The ledger sorts dated records by ISO timestamp and then ID; historical aggregates have no fabricated timestamp. Date filters exclude undated aggregates. Coin charts always show the complete bankroll and are labeled accordingly; performance filters do not rewrite the balance ledger. First-place wins and positive coin streaks are intentionally separate metrics. Historical summaries do not participate in streaks or focus analytics.

All mutations and restores are validated and atomic IndexedDB transactions. JSON restore is an explicit full replacement and is idempotent. Match CSV imports skip identical IDs, reject conflicting IDs and validate foreign keys. Import a full JSON backup first when moving a customized course/club catalog to another device. Importing matches changes the balance; do not import already-accounted-for historical results as new matches. New match IDs cannot identify semantic duplicates from outside sources.

Deletion of referenced courses, tiers and clubs is blocked. A club with results cannot be moved to a different course. A minimum sample warning of 20 matches is a usability caution, not a statistical significance claim. Reports do not imply causation or guaranteed gains.

## Privacy and limitations

There is no server, account system, cloud synchronization or shared leaderboard. Each browser/origin owns an independent IndexedDB database. Private browsing, clearing site data, or switching origins can lose access to records. Export JSON backups regularly. Names and seed summaries are bundled with the app; newly entered player records remain on their devices.

The offline service worker is enabled in production, not the Vite development server. Installability varies by browser; on iPhone use Safari → Share → Add to Home Screen. No direct connection to Miniclip or automatic game telemetry is implemented. This is an independent fan tool.

## Netlify deployment

1. Push this project to a GitHub repository.
2. In Netlify, import that repository.
3. Use build command `npm run build` and publish directory `dist` (already configured in `netlify.toml`).
4. Deploy. Hash routing makes navigation safe on static hosts.

No environment variables or backend secrets are needed. HTTPS is required for service-worker offline functionality. Changing the site's URL/origin gives the browser a different data store; transfer a JSON backup when moving hosts.

## Verification

Run `npm test` for the automated accounting and import tests. Browser smoke checks cover history onboarding, payout-required logging, balance updates, undo and summary presentation. Production build runs TypeScript checking before bundling.

Future backend expansion can replace `db.ts` with a repository/synchronization layer and keep the domain models. Account separation, sync conflict rules, and server-side validation should precede any shared cloud deployment.
