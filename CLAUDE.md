# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

- **Run a single test file:** `npx vitest run tests/components/VideoCard.test.tsx`
- **Run tests matching a name:** `npx vitest run -t "should reset videos"`
- `npm run typecheck` runs `react-router typegen && tsc` — the typegen step generates `.react-router/types` and `app/+types/*`, which route modules import. Running bare `tsc` will fail on missing generated types.
- `npm run build` (and the `start*` scripts) first run `scripts/env-vars.mjs`, which regenerates `.env` with git branch/commit/timestamp via `simple-git`. Expect `.env` to change after a build.
- Coverage thresholds are enforced (statements/lines/branches 60, functions 55); some hard-to-test files are excluded in `vitest.config.ts`.

## Architecture

**SPA on React Router 8 framework mode.** `react-router.config.ts` sets `ssr: false`, so this builds as a client-side SPA (the build still runs an SSR pass to prerender `index.html`). Routes are declared explicitly in `app/routes.ts` (not file-based) under two layout groups — `AuthenticatedLayout` and `UnauthenticatedLayout`. `app/root.tsx` wraps the app in `ApplicationConfigurationProvider` and initializes Sentry. Path alias `~/*` maps to `app/*`.

**Functional `Option`/`Either` types are pervasive and hand-rolled** (`app/types/Option.ts`, `app/types/Either.ts`) — not a library. Nullable values are wrapped with `Option.fromNullable` / `Some.of` / `None.of` and consumed via `.map`/`.fold`/`.flatMap`/`.getOrElse`/`.toNullable`/`.forEach`. Match this style rather than introducing raw null checks.

**All API responses are validated with Zod, then parsed via `zodParse`** (`app/types/Zod.ts`). Models in `app/models/` are Zod schemas (imported from `zod/v4`) that export both the schema and its inferred type under the same name (`export const Video = z.object(...)` + `export type Video = z.infer<typeof Video>`). Domain-specific Zod helpers convert at the boundary:
- `ZodDateTime` → Luxon `DateTime`, `ZodDuration` → Luxon `Duration` (dates/durations are always Luxon, never raw strings/numbers downstream)
- `ZodOptional` → `Option<A>`

**Services** live in `app/services/<domain>/` as thin modules of exported async functions sharing one `axiosClient` (`app/services/http/HttpClient.ts`). The client has a response interceptor that clears the stored auth token on a 401. The API base URL is resolved once at module load by `app/services/ApiConfiguration.ts` in priority order: `?API_URL=` query param → `VITE_API_URL` env → host mapping → inferred `${protocol}//api.${host}`. When building request URLs, pass an axios `{ params }` object (it URL-encodes and drops `null`/`undefined`) rather than concatenating query strings — this is the convention across services.

**Auth & local state** use a typed localStorage layer (`app/services/kv-store/KeyValueStore.ts`). The auth token is persisted under a `KeySpace`; `useRedirectOnAuth` (`app/pages/useRedirectOnAuth.ts`) gates the two layouts (redirect to sign-in when unauthenticated, to home when already signed in).

**Theme & settings** flow through `ApplicationConfigurationProvider`, which holds an `Option<ApplicationConfiguration>` (`safeMode` + `theme`), persists to localStorage, and drives both the MUI theme (`createTheme` color schemes) and the `data-theme` body attribute. Consume it via the `useApplicationConfiguration()` hook.

**Real-time download progress** uses an `EventSource` stream (`scheduledVideoDownloadStream` in the scheduling service) feeding live updates into the `ScheduledVideos` page.

**Infinite scroll** is centralized in `usePaginatedFetch` (`app/components/infinite-scroll/usePaginatedFetch.ts`) paired with the `InfiniteScroll` component (IntersectionObserver-based). The hook owns page-number/loading/has-more state and per-page de-dup; callers supply `fetchPage` and an `onResults` accumulator. The `results.length < pageSize ⇒ hasMore = false` rule is the shared convention.

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

To verify a change end-to-end, build the app against a real API and drive it with headless Chromium:

1. `VITE_API_URL=https://api.video.home.ruchij.com npm run build`
2. Serve `build/client` with any static server that falls back to `index.html` for unknown paths (SPA routing).
3. Drive it with Playwright (`playwright-core` + the Chromium cached under `~/Library/Caches/ms-playwright/`), signing in with the 1Password credentials.
4. To distinguish SPA navigation from hard reloads (e.g. when verifying auth-redirect behavior), count Playwright `page.on("load")` events — an SPA transition fires none.

## Gotchas

- **MUI / `react-transition-group` ESM resolution (Vite 8 / Vitest 4).** Externalized MUI triggers Node's ESM resolver to reject MUI's directory import of `react-transition-group/TransitionGroupContext`. Both the build and the tests bundle these packages via `ssr.noExternal`; the list lives in one place — `bundled-dependencies.ts` — imported by both `vite.config.ts` and `vitest.config.ts`. A new dependency with the same kind of directory-import problem just gets appended to that array. The dev server additionally needs the same list in `ssr.optimizeDeps.include` (in `vite.config.ts`) — without it, the dev SSR module runner inlines the CJS files and fails with `exports is not defined`.
- **Linting is oxlint** (`.oxlintrc.json`), not ESLint — TypeScript 7 ships no JS compiler API, so typescript-eslint cannot run at all. Unused vars/args are errors unless prefixed with `_`; empty `catch` blocks are allowed. `react/jsx-key` and `react/react-in-jsx-scope` are off deliberately (the `Option.map` idiom returns one element rather than a list, and the automatic JSX runtime is in use). Type-aware rules are **on** — `npm run lint` passes `--type-aware`, which runs tsgolint (the tsgo-based type checker) and so needs `oxlint-tsgolint` installed; it costs ~0.7s versus ~0.05s without. `no-floating-promises` is the rule this trips most: `Option.forEach` is typed `Promise<A | void> | A` regardless of whether the callback is async, so deliberate fire-and-forget statements — `Option.forEach(...)`, `navigate(...)`, async loaders in effects — carry an explicit `void` prefix. `typescript/unbound-method` uses `ignoreStatic` and is off for `tests/**`, where `vi.mocked(obj.method)` is the standard mocking idiom. `npm run lint` is currently at **zero findings** — `react/exhaustive-deps` is satisfied everywhere except the reset effect in `usePaginatedFetch`, which forwards a caller-supplied `DependencyList` and so is locally disabled with an explanation.
- **Tests** run on jsdom. `tests/setup.ts` mocks `matchMedia`, `ResizeObserver`, and `IntersectionObserver` — it exports `intersectionObserverCallbacks` so tests can fire intersection events to drive infinite scroll. Services are mocked per-suite with `vi.mock`.
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
