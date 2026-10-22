# Project Guide

Guidance for coding agents working with code in this repository. `AGENTS.md` is a symlink to
this file, so both names resolve to the same guidance.

## Commands

Requires Node 24 (`engines.node: ^24.0.0`) and npm.

| Task | Command |
|------|---------|
| Dev server (local API at `api.localhost`) | `npm run start:local` |
| Dev server (no env-var generation) | `npm run start:dev` |
| Type check | `npm run typecheck` |
| Lint / autofix | `npm run lint` / `npm run lint:fix` |
| Tests (watch) | `npm test` |
| Tests (once) | `npm run test:run` |
| Tests + coverage | `npm run test:coverage` |
| Production build | `npm run build` |
| Full CI gate | `npm run ci:checks` (typecheck → lint → test:coverage) |
| End-to-end (Playwright, against staging) | `npm run e2e` / `npm run e2e:ui` |

- **Run a single test file:** `npx vitest run tests/components/VideoCard.test.tsx`
- **Run tests matching a name:** `npx vitest run -t "should reset videos"`
- `npm run typecheck` runs `react-router typegen && tsc` — the typegen step generates `.react-router/types` and `app/+types/*`, which route modules import. Running bare `tsc` will fail on missing generated types.
- `npm run build` (and the `start*` scripts) first run `scripts/env-vars.mjs`, which regenerates `.env` with git branch/commit/timestamp via `simple-git`. Expect `.env` to change after a build.
- Coverage thresholds are enforced in `vitest.config.ts` (statements 98.5, branches 94, functions 97.5, lines 99). They are a ratchet set just under what the suite achieves: raise them when coverage climbs, never lower them to make a build pass.

## Architecture

**SPA on React Router 8 framework mode.** `react-router.config.ts` sets `ssr: false`, so this builds as a client-side SPA (the build still runs an SSR pass to prerender `index.html`). Routes are declared explicitly in `app/routes.ts` (not file-based) under two layout groups — `AuthenticatedLayout` and `UnauthenticatedLayout`. `app/root.tsx` wraps the app in `ApplicationConfigurationProvider` and initializes Sentry. Path alias `~/*` maps to `app/*`.

**Functional `Option`/`Either` types are pervasive and hand-rolled** (`app/types/Option.ts`, `app/types/Either.ts`) — not a library. Nullable values are wrapped with `Option.fromNullable` / `Some.of` / `None.of` and consumed via `.map`/`.fold`/`.flatMap`/`.getOrElse`/`.toNullable`/`.forEach`. Match this style rather than introducing raw null checks.

**All API responses are validated with Zod, then parsed via `zodParse`** (`app/types/Zod.ts`). Models in `app/models/` are Zod schemas (imported from `zod/v4`) that export both the schema and its inferred type under the same name (`export const Video = z.object(...)` + `export type Video = z.infer<typeof Video>`). Domain-specific Zod helpers convert at the boundary:
- `ZodDateTime` → Luxon `DateTime`, `ZodDuration` → Luxon `Duration` (dates/durations are always Luxon, never raw strings/numbers downstream)
- `ZodOptional` → `Option<A>`

**Services** live in `app/services/<domain>/` as thin modules of exported async functions sharing one `axiosClient` (`app/services/http/HttpClient.ts`). The client has a response interceptor that clears the stored auth token on a 401. The API base URL is resolved once at module load by `app/services/ApiConfiguration.ts` in priority order: `?API_URL=` query param → `VITE_API_URL` env → host mapping → inferred `${protocol}//api.${host}`. The one exception to the shared client is `app/services/fallback/FallbackService.ts`, whose own client calls the fallback API (bearer tokens, not cookies), so a 401 from it never triggers the shared client's sign-out; `login` uses it to enrol each user in the fallback in the background. When building request URLs, pass an axios `{ params }` object (it URL-encodes and drops `null`/`undefined`) rather than concatenating query strings — this is the convention across services.

**Auth & local state** use a typed localStorage layer (`app/services/kv-store/KeyValueStore.ts`). The auth token is persisted under a `KeySpace`; `useRedirectOnAuth` (`app/pages/useRedirectOnAuth.ts`) gates the two layouts (redirect to sign-in when unauthenticated, to home when already signed in).

**Signed-in user & admin gating.** `useRedirectOnAuth` returns the `User` from its session check, and `AuthenticatedLayout` provides it through `AuthenticatedUserContext` (`app/providers/AuthenticatedUserProvider.tsx`). Use `useIsAdmin()` to hide controls whose endpoints are admin-only on the server (the service summary behind the Sites filter, the Duplicates and Admin tabs). Pausing downloads (`WorkerStatusButton`) and video scans live only on the Admin page, not in the header or on the Downloading page; Retry All stays on the Downloading page because `/schedule/retry-failed` is open to every user (it retries only their own downloads). The context defaults to `None`, so anything outside the layout is treated as a non-admin. Admin-only pages (`/admin`, `/duplicates`) sit under the `AdminLayout` route in `app/routes.ts`, which turns non-admins away before the page mounts.

**Handled errors go through `reportError(operation, error)`** (`app/services/ErrorReporting.ts`), not `console.error`. It logs at warn level and sends a Sentry exception tagged with `operation`. It must not use `console.error`, because Sentry's `captureConsoleIntegration` would report the same failure again. `notifyError` calls it for you. Tests assert on the `console.warn` spy.

**Theme & settings** flow through `ApplicationConfigurationProvider`, which holds an `Option<ApplicationConfiguration>` (`safeMode` + `theme`), persists to localStorage, and drives both the MUI theme (`createTheme` color schemes) and the `data-theme` body attribute. Consume it via the `useApplicationConfiguration()` hook.

**Real-time download progress** uses an `EventSource` stream (`scheduledVideoDownloadStream` in the scheduling service) feeding live updates into the `ScheduledVideos` page. The stream reports its `StreamConnection` (Connected / Reconnecting / Disconnected — the last when the browser gives up, e.g. on a 401); the page shows a banner while not connected and reloads the list from page 0 after any reconnect, since events sent while disconnected are lost.

**Infinite scroll** is centralized in `usePaginatedFetch` (`app/components/infinite-scroll/usePaginatedFetch.ts`) paired with the `InfiniteScroll` component (IntersectionObserver-based). The hook owns page-number/loading/has-more state and per-page de-dup; callers supply `fetchPage` and an `onResults` accumulator. The `results.length < pageSize ⇒ hasMore = false` rule is the shared convention. Because IntersectionObserver only reports transitions, `InfiniteScroll` re-observes its sentinel each time a page settles (loading → idle, more to load, no error), so a sentinel still in view after a short or de-duplicated page asks for the next one. A failed page waits for an explicit `retry`: `loadMore` is a no-op while an error is pending, so scrolling cannot skip past the failed page.

**Styling** is SCSS modules (`*.module.scss`, co-located with components) plus MUI/Emotion.

## Environments & credentials

| Environment | Front-end | API |
|-------------|-----------|-----|
| Production | https://videos.ruchij.com | https://api.video.home.ruchij.com |
| Dev/staging | https://dev.video.dev.ruchij.com | https://api.staging.video.dev.ruchij.com |

- Sign-in credentials are in 1Password, readable via the `op` CLI: `op item list` to find the item (e.g. "Video Downloader - Prod"), then `op item get <id-or-name> --format json --reveal`.
- The APIs allow credentialed CORS requests from localhost, so a local front-end pointed at a remote API (`VITE_API_URL=https://api.video.home.ruchij.com`) can sign in for real.
- The localStorage auth marker is stored under the key `Authentication-Token` (JSON with `expiresAt`/`issuedAt`/`renewals`; the session itself lives in a cookie).

## Verifying changes in a browser

**The committed smoke suite comes first.** `e2e/` holds a `@playwright/test` 1.64 suite (`playwright.config.ts`)
covering sign-in/out with `?redirect=`, the videos list, infinite scroll and video page, the downloads page and its SSE
stream, and a playlist create/add/reorder/delete round trip. `npm run e2e` builds the app with
`VITE_API_URL=https://api.staging.video.dev.ruchij.com` and serves `build/client` through `e2e/static-server.mjs` (SPA
fallback, port 4173) via Playwright's `webServer`. Run it with the "Video Downloader - Dev" 1Password credentials in
`E2E_EMAIL` / `E2E_PASSWORD`, and never write them to a file.

- A `setup` project signs in once through the UI and saves `e2e/.auth/user.json` (gitignored) as `storageState` for the
  specs. `auth.spec.ts` opts out with an empty `storageState`, so its sign-out ends only its own session.
- Locally a server already on port 4173 is reused, even one built against another API; stop it when switching APIs.
  `E2E_API_URL` changes the API, and `E2E_BASE_URL` points the suite at a deployed front-end instead of a local build.
- The staging account had a single video as of October 2026, so the infinite-scroll test skips itself and the playlist
  reorder step is skipped with an annotation. They run once the account has 50+ and 2+ videos respectively.
- Credentials are entered by `enterSecret` in `e2e/helpers.ts`, not `fill()`, because the HTML report records fill
  values and CI uploads it from a public repository. CI also turns off traces, videos and screenshots, which can
  record the session cookie or the email on the sign-in page. Keep both rules when adding specs.
- Playwright writes to `playwright-results/` and `playwright-report/`, not the default `test-results/`, which holds
  Vitest's JUnit output. Vitest excludes `e2e/**`. `npm run lint` and `npm run typecheck` both cover `e2e/`.
- The `End-to-end Tests` CI job runs on branch pushes after `deploy-to-dev`, reading the `E2E_EMAIL` / `E2E_PASSWORD`
  repository secrets, and uploads `playwright-report/` as an artifact.

For a one-off check the suite does not cover, drive the app by hand:

1. `VITE_API_URL=https://api.video.home.ruchij.com npm run build`
2. Serve it with `node e2e/static-server.mjs build/client` (or any static server that falls back to `index.html`).
3. Drive it with Playwright (`@playwright/test`'s bundled `playwright-core` + the Chromium cached under `~/Library/Caches/ms-playwright/`), signing in with the 1Password credentials.
4. To distinguish SPA navigation from hard reloads (e.g. when verifying auth-redirect behavior), count Playwright `page.on("load")` events — an SPA transition fires none.

## Gotchas

- **MUI / `react-transition-group` ESM resolution (Vite 8 / Vitest 5).** Externalized MUI triggers Node's ESM resolver to reject MUI's directory import of `react-transition-group/TransitionGroupContext`. Both the build and the tests bundle these packages via `ssr.noExternal`; the list lives in one place — `bundled-dependencies.ts` — imported by both `vite.config.ts` and `vitest.config.ts`. A new dependency with the same kind of directory-import problem just gets appended to that array. The dev server additionally needs the same list in `ssr.optimizeDeps.include` (in `vite.config.ts`) — without it, the dev SSR module runner inlines the CJS files and fails with `exports is not defined`.
- **Linting is oxlint** (`.oxlintrc.json`), not ESLint — TypeScript 7 ships no JS compiler API, so typescript-eslint cannot run at all. Unused vars/args are errors unless prefixed with `_`; empty `catch` blocks are allowed. `react/jsx-key` and `react/react-in-jsx-scope` are off deliberately (the `Option.map` idiom returns one element rather than a list, and the automatic JSX runtime is in use). Type-aware rules are **on** — `npm run lint` passes `--type-aware`, which runs tsgolint (the tsgo-based type checker) and so needs `oxlint-tsgolint` installed; it costs ~0.7s versus ~0.05s without. `no-floating-promises` is the rule this trips most: `Option.forEach` is typed `Promise<A | void> | A` regardless of whether the callback is async, so deliberate fire-and-forget statements — `Option.forEach(...)`, `navigate(...)`, async loaders in effects — carry an explicit `void` prefix. `typescript/unbound-method` uses `ignoreStatic` and is off for `tests/**`, where `vi.mocked(obj.method)` is the standard mocking idiom. `npm run lint` is currently at **zero errors** — `react/exhaustive-deps` is satisfied everywhere except the reset effect in `usePaginatedFetch`, which forwards a caller-supplied `DependencyList` and so is locally disabled with an explanation. oxlint 1.79 added React Compiler rules to `correctness`; of those, `set-state-in-effect` cannot see through an `await`, so the seven effects that kick off an async load (or deliberately re-measure after one) carry a local `oxlint-disable-next-line` with the reason, and `preserve-manual-memoization` is off because React Compiler is not part of this build.
- **Tests** run on jsdom. `tests/setup.ts` mocks `matchMedia`, `ResizeObserver`, and `IntersectionObserver` — it exports `intersectionObserverCallbacks` so tests can fire intersection events to drive infinite scroll. `tests/helpers.tsx` has `withApplicationConfiguration` (wraps an element in the configuration context, with overrides for `safeMode`/`theme`/setters) and `triggerIntersection` (fires the latest observer) — use these rather than hand-rolling a context value per suite. `tests/fixtures.ts` builds every model from its wire shape through the real Zod schema (`buildVideo`, `videoJson`, …); prefer it to hand-written objects. Services are mocked per-suite with `vi.mock`. Vitest 5 clears every mock before each test automatically, which wipes call history but keeps implementations — so a `mockResolvedValue` set in one test still leaks into the next unless the next sets its own, and a call made at module-import time (e.g. `initSentry` in `app/root.tsx`) is gone before the first test runs; assert on those by `vi.resetModules()` + a dynamic `import()` inside the test, as `tests/root.test.tsx` does.
- **Every commit auto-bumps the patch version** in `package.json` and `package-lock.json` via the checked-in `.githooks/pre-commit` hook (activated by the npm `prepare` script). Version churn in commits is expected; a manually staged version change suppresses the auto-bump.

## Documentation

- **Whenever a dependency version changes, update the README files in the same change.** Both
  `README.md` (Tech Stack table, Prerequisites, AWS Deployment) and `cdk-deploy/README.md`
  (Requirements table) state versions explicitly, so a major upgrade, a Node bump, or a tool swap
  leaves them wrong unless they are edited alongside `package.json`. The same applies to version
  and tooling claims in this file. Take the numbers from what is actually installed
  (`node -p "require('./node_modules/<pkg>/package.json').version"`) rather than from the
  semver range in `package.json`.

## Pull requests

- PR descriptions must be simple and concise — a few plain sentences describing what changed and why; no headings, checklists, or boilerplate.
