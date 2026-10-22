import * as Sentry from "@sentry/react"
import { Environment, getEnvironment } from "~/services/Config"
import { Option } from "~/types/Option"

const STAGING_DSN = "https://0c16af37660ae085a000b8b8f9d79a17@o4510770741837824.ingest.us.sentry.io/4510771760791552"

const DSN_MAPPINGS: Record<Environment, string> = {
  [Environment.Development]: "https://3cefa278484696cde7ff9e066525fa87@o4510770741837824.ingest.us.sentry.io/4510771763085312",
  [Environment.Branch]: STAGING_DSN,
  [Environment.Staging]: STAGING_DSN,
  [Environment.Production]: "https://77f336ea08b08c576b93c76458db362f@o4510770741837824.ingest.us.sentry.io/4510771752992768"
}

const ENVIRONMENT_NAMES: Record<Environment, string> = {
  [Environment.Development]: "development",
  [Environment.Branch]: "branch",
  [Environment.Staging]: "staging",
  [Environment.Production]: "production"
}

const TRACES_SAMPLE_RATES: Record<Environment, number> = {
  [Environment.Development]: 1.0,
  [Environment.Branch]: 1.0,
  [Environment.Staging]: 1.0,
  [Environment.Production]: 0.1
}

/**
 * Reduces a logged console argument to what is safe to send to Sentry. Axios errors carry
 * their request config — auth headers and request bodies such as sign-in passwords — so
 * errors keep only their name and message, and any other object is dropped.
 */
export const scrubConsoleArgument = (argument: unknown): unknown => {
  if (argument instanceof Error) {
    return `${argument.name}: ${argument.message}`
  } else if (argument === null || ["string", "number", "boolean", "undefined"].includes(typeof argument)) {
    return argument
  } else {
    return "[redacted]"
  }
}

const scrubConsoleArguments = (data: Record<string, unknown> | undefined): void => {
  if (data !== undefined && Array.isArray(data.arguments)) {
    data.arguments = data.arguments.map(scrubConsoleArgument)
  }
}

/**
 * Drops the query string and fragment from every URL in `text`. Query strings carry search
 * terms and redirect targets, which are personal browsing data rather than diagnostics.
 */
export const stripUrlQueries = (text: string): string => text.replace(/(\/\/[^\s?#]*)[?#]\S*/g, "$1")

const URL_BREADCRUMB_CATEGORIES = ["xhr", "fetch", "navigation"]

const stripUrlQueriesIn = (data: Record<string, unknown> | undefined): void => {
  if (data !== undefined) {
    for (const key of ["url", "from", "to"]) {
      const value = data[key]
      if (typeof value === "string") {
        // Navigation breadcrumbs hold bare paths ("/?search-term=x"), which have no "//".
        data[key] = stripUrlQueries(value).replace(/^(\/[^?#]*)[?#].*$/, "$1")
      }
    }
  }
}

export const beforeSend = (event: Sentry.ErrorEvent): Sentry.ErrorEvent => {
  scrubConsoleArguments(event.extra)

  if (event.request !== undefined) {
    event.request.url = Option.fromNullable(event.request.url).map(stripUrlQueries).toDefined()
    delete event.request.query_string
  }

  return event
}

export const beforeBreadcrumb = (breadcrumb: Sentry.Breadcrumb): Sentry.Breadcrumb => {
  if (breadcrumb.category === "console") {
    scrubConsoleArguments(breadcrumb.data)
  } else if (URL_BREADCRUMB_CATEGORIES.includes(breadcrumb.category ?? "")) {
    stripUrlQueriesIn(breadcrumb.data)
  }
  return breadcrumb
}

type SentrySpan = Parameters<NonNullable<Sentry.BrowserOptions["beforeSendSpan"]>>[0]

/** Request spans are named after, and annotated with, the full request URL. */
export const beforeSendSpan = (span: SentrySpan): SentrySpan => ({
  ...span,
  name: stripUrlQueries(span.name),
  attributes: Object.fromEntries(
    Object.entries(span.attributes)
      .filter(([key]) => !key.endsWith("query") && !key.endsWith("fragment"))
      .map(([key, value]) => [key, typeof value === "string" ? stripUrlQueries(value) : value])
  )
})

let sentryInitialized = false

export const initSentry = () => {
  if (sentryInitialized) {
    return
  }

  const environment: Environment = getEnvironment()
  const dsnOverride: Option<string> =
    Option.fromNullable<string>(import.meta.env.VITE_SENTRY_DSN).filter(dsn => dsn.length > 0)

  // Don't ship local-dev traces/replays to Sentry unless a DSN is explicitly configured
  if (environment === Environment.Development && dsnOverride.isEmpty()) {
    return
  }

  sentryInitialized = true

  Sentry.init({
    dsn: dsnOverride.getOrElse(() => DSN_MAPPINGS[environment]),
    environment: ENVIRONMENT_NAMES[environment],
    integrations: [
      Sentry.browserTracingIntegration(),
      // Handled failures go through reportError; this catches any other error-level logs.
      Sentry.captureConsoleIntegration({ levels: ["error"] })
    ],
    tracesSampleRate: TRACES_SAMPLE_RATES[environment],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    beforeSend,
    beforeBreadcrumb,
    beforeSendSpan
  })

  // Replay is added once its chunk arrives, as Sentry documents for lazy-loading it; the sample
  // rates above still apply. Until then, errors are reported without a replay.
  void import("~/services/SentryReplay")
    .then(({ replayIntegration }) => Sentry.addIntegration(replayIntegration()))
    .catch((error: unknown) => console.warn("Failed to load Sentry session replay", error))
}
