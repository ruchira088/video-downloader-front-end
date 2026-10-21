import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import { Environment } from "~/services/Config"

const mockInit = vi.fn()
const mockGetEnvironment = vi.fn()

vi.mock("@sentry/react", () => ({
  init: (options: unknown) => mockInit(options),
  browserTracingIntegration: () => "browser-tracing-integration",
  replayIntegration: () => "replay-integration",
  captureConsoleIntegration: (options: unknown) => ({ name: "capture-console-integration", options }),
}))

vi.mock("~/services/Config", async () => {
  const actual = await vi.importActual<typeof import("~/services/Config")>("~/services/Config")
  return {
    ...actual,
    getEnvironment: () => mockGetEnvironment(),
  }
})

const loadInitSentry = async () => {
  vi.resetModules()
  const { initSentry } = await import("~/services/Sentry")
  return initSentry
}

describe("initSentry", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  test("should not initialize Sentry in Development without VITE_SENTRY_DSN", async () => {
    mockGetEnvironment.mockReturnValue(Environment.Development)

    const initSentry = await loadInitSentry()
    initSentry()

    expect(mockInit).not.toHaveBeenCalled()
  })

  test("should initialize Sentry in Development when VITE_SENTRY_DSN is set", async () => {
    mockGetEnvironment.mockReturnValue(Environment.Development)
    vi.stubEnv("VITE_SENTRY_DSN", "https://custom@self-hosted.example.com/1")

    const initSentry = await loadInitSentry()
    initSentry()

    expect(mockInit).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        dsn: "https://custom@self-hosted.example.com/1",
        environment: "development",
        tracesSampleRate: 1.0,
      })
    )
  })

  test("should initialize Sentry in Production with a reduced traces sample rate", async () => {
    mockGetEnvironment.mockReturnValue(Environment.Production)

    const initSentry = await loadInitSentry()
    initSentry()

    expect(mockInit).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        dsn: "https://77f336ea08b08c576b93c76458db362f@o4510770741837824.ingest.us.sentry.io/4510771752992768",
        environment: "production",
        tracesSampleRate: 0.1,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
      })
    )
  })

  test("should initialize Sentry in Staging with full trace sampling", async () => {
    mockGetEnvironment.mockReturnValue(Environment.Staging)

    const initSentry = await loadInitSentry()
    initSentry()

    expect(mockInit).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        dsn: "https://0c16af37660ae085a000b8b8f9d79a17@o4510770741837824.ingest.us.sentry.io/4510771760791552",
        environment: "staging",
        tracesSampleRate: 1.0,
      })
    )
  })

  test("should prefer VITE_SENTRY_DSN over the environment DSN mapping", async () => {
    mockGetEnvironment.mockReturnValue(Environment.Production)
    vi.stubEnv("VITE_SENTRY_DSN", "https://override@self-hosted.example.com/2")

    const initSentry = await loadInitSentry()
    initSentry()

    expect(mockInit).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        dsn: "https://override@self-hosted.example.com/2",
        environment: "production",
      })
    )
  })

  test("should report console errors to Sentry, since most handled failures are only logged", async () => {
    mockGetEnvironment.mockReturnValue(Environment.Production)

    const initSentry = await loadInitSentry()
    initSentry()

    expect(mockInit).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        integrations: expect.arrayContaining([
          { name: "capture-console-integration", options: { levels: ["error"] } }
        ]),
      })
    )
  })

  test("should scrub console arguments from events and console breadcrumbs", async () => {
    mockGetEnvironment.mockReturnValue(Environment.Production)

    const initSentry = await loadInitSentry()
    initSentry()

    const { beforeSend, beforeBreadcrumb, beforeSendSpan } = await import("~/services/Sentry")
    expect(mockInit).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ beforeSend, beforeBreadcrumb, beforeSendSpan }))
  })

  test("should only initialize Sentry once", async () => {
    mockGetEnvironment.mockReturnValue(Environment.Production)

    const initSentry = await loadInitSentry()
    initSentry()
    initSentry()

    expect(mockInit).toHaveBeenCalledTimes(1)
  })
})

describe("console argument scrubbing", () => {
  const axiosLikeError = Object.assign(new Error("Request failed with status code 401"), {
    name: "AxiosError",
    config: { headers: { Authorization: "Bearer secret-token" }, data: '{"password":"hunter2"}' },
  })

  test("should reduce errors to their name and message", async () => {
    const { scrubConsoleArgument } = await import("~/services/Sentry")

    expect(scrubConsoleArgument(axiosLikeError)).toBe("AxiosError: Request failed with status code 401")
  })

  test("should keep primitives and redact other objects", async () => {
    const { scrubConsoleArgument } = await import("~/services/Sentry")

    expect(scrubConsoleArgument("Failed to load")).toBe("Failed to load")
    expect(scrubConsoleArgument(42)).toBe(42)
    expect(scrubConsoleArgument(false)).toBe(false)
    expect(scrubConsoleArgument(null)).toBeNull()
    expect(scrubConsoleArgument(undefined)).toBeUndefined()
    expect(scrubConsoleArgument({ password: "hunter2" })).toBe("[redacted]")
  })

  test("should scrub the console arguments attached to an event", async () => {
    const { beforeSend } = await import("~/services/Sentry")

    const event = beforeSend({ type: undefined, extra: { arguments: ["Failed to sign in", axiosLikeError] } })

    expect(event.extra).toEqual({ arguments: ["Failed to sign in", "AxiosError: Request failed with status code 401"] })
  })

  test("should leave events without console arguments untouched", async () => {
    const { beforeSend } = await import("~/services/Sentry")

    expect(beforeSend({ type: undefined, extra: { other: { nested: true } } }).extra).toEqual({ other: { nested: true } })
    expect(beforeSend({ type: undefined }).extra).toBeUndefined()
  })

  test("should scrub console breadcrumbs only", async () => {
    const { beforeBreadcrumb } = await import("~/services/Sentry")

    expect(beforeBreadcrumb({ category: "console", data: { arguments: [axiosLikeError], logger: "console" } }).data)
      .toEqual({ arguments: ["AxiosError: Request failed with status code 401"], logger: "console" })
    expect(beforeBreadcrumb({ category: "xhr", data: { arguments: [{ keep: true }] } }).data)
      .toEqual({ arguments: [{ keep: true }] })
  })
})

describe("URL query scrubbing", () => {
  const searchUrl = "https://api.example.com/videos/search?search-term=private%20words&page-number=0"

  test("should drop query strings and fragments from every URL in a string", async () => {
    const { stripUrlQueries } = await import("~/services/Sentry")

    expect(stripUrlQueries(searchUrl)).toBe("https://api.example.com/videos/search")
    expect(stripUrlQueries(`GET ${searchUrl}`)).toBe("GET https://api.example.com/videos/search")
    expect(stripUrlQueries("https://videos.example.com/video/1#t=30")).toBe("https://videos.example.com/video/1")
    expect(stripUrlQueries("no url here?really")).toBe("no url here?really")
  })

  test("should strip the request URL of an event and drop its query string", async () => {
    const { beforeSend } = await import("~/services/Sentry")

    const event = beforeSend({ type: undefined, request: { url: searchUrl, query_string: "search-term=private" } })

    expect(event.request).toEqual({ url: "https://api.example.com/videos/search" })
  })

  test("should strip URLs in request and navigation breadcrumbs", async () => {
    const { beforeBreadcrumb } = await import("~/services/Sentry")

    expect(beforeBreadcrumb({ category: "xhr", data: { url: searchUrl, method: "GET" } }).data)
      .toEqual({ url: "https://api.example.com/videos/search", method: "GET" })
    expect(beforeBreadcrumb({ category: "fetch", data: { url: searchUrl } }).data)
      .toEqual({ url: "https://api.example.com/videos/search" })
    expect(beforeBreadcrumb({ category: "navigation", data: { from: "/?search-term=private", to: "/sign-in?redirect=%2Fvideo%2F1" } }).data)
      .toEqual({ from: "/", to: "/sign-in" })
  })

  test("should strip URLs from span names and attributes, and drop query attributes", async () => {
    const { beforeSendSpan } = await import("~/services/Sentry")

    const span = beforeSendSpan({
      trace_id: "t",
      span_id: "s",
      name: `GET ${searchUrl}`,
      start_timestamp: 0,
      status: "ok",
      is_segment: false,
      attributes: { "url.full": searchUrl, "http.query": "?search-term=private", "http.method": "GET", "http.status": 200 },
    })

    expect(span.name).toBe("GET https://api.example.com/videos/search")
    expect(span.attributes).toEqual({
      "url.full": "https://api.example.com/videos/search",
      "http.method": "GET",
      "http.status": 200,
    })
  })
})
