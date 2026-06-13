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

**SPA on React Router 7 framework mode.** `react-router.config.ts` sets `ssr: false`, so this builds as a client-side SPA (the build still runs an SSR pass to prerender `index.html`). Routes are declared explicitly in `app/routes.ts` (not file-based) under two layout groups — `AuthenticatedLayout` and `UnauthenticatedLayout`. `app/root.tsx` wraps the app in `ApplicationConfigurationProvider` and initializes Sentry. Path alias `~/*` maps to `app/*`.

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

## Gotchas

- **MUI / `react-transition-group` ESM resolution (Vite 8 / Vitest 4).** Externalized MUI triggers Node's ESM resolver to reject MUI's directory import of `react-transition-group/TransitionGroupContext`. Both the build and the tests bundle these packages via `ssr.noExternal`; the list lives in one place — `bundled-dependencies.ts` — imported by both `vite.config.ts` and `vitest.config.ts`. A new dependency with the same kind of directory-import problem just gets appended to that array.
- **ESLint:** unused vars/args are errors unless prefixed with `_`; empty `catch` blocks are allowed.
- **Tests** run on jsdom. `tests/setup.ts` mocks `matchMedia`, `ResizeObserver`, and `IntersectionObserver` — it exports `intersectionObserverCallbacks` so tests can fire intersection events to drive infinite scroll. Services are mocked per-suite with `vi.mock`.

## Pull requests

- PR descriptions must be simple and concise — a few plain sentences describing what changed and why; no headings, checklists, or boilerplate.
