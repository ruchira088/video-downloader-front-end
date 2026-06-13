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
      Sentry.replayIntegration()
    ],
    tracesSampleRate: TRACES_SAMPLE_RATES[environment],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0
  })
}
