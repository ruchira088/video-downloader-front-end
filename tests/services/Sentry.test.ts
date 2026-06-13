import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import { Environment } from "~/services/Config"

const mockInit = vi.fn()
const mockGetEnvironment = vi.fn()

vi.mock("@sentry/react", () => ({
  init: (options: unknown) => mockInit(options),
  browserTracingIntegration: () => "browser-tracing-integration",
  replayIntegration: () => "replay-integration",
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

  test("should only initialize Sentry once", async () => {
    mockGetEnvironment.mockReturnValue(Environment.Production)

    const initSentry = await loadInitSentry()
    initSentry()
    initSentry()

    expect(mockInit).toHaveBeenCalledTimes(1)
  })
})
