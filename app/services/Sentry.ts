import * as Sentry from "@sentry/react"
import { Environment, getEnvironment } from "~/services/Config"

const DSN_MAPPINGS: Record<Environment, string> = {
  [Environment.Development]: "https://3cefa278484696cde7ff9e066525fa87@o4510770741837824.ingest.us.sentry.io/4510771763085312",
  [Environment.Staging]: "https://0c16af37660ae085a000b8b8f9d79a17@o4510770741837824.ingest.us.sentry.io/4510771760791552",
  [Environment.Production]: "https://77f336ea08b08c576b93c76458db362f@o4510770741837824.ingest.us.sentry.io/4510771752992768"
}

const getDsn = () => {
  const environment: Environment = getEnvironment()
  return DSN_MAPPINGS[environment]
}

let sentryInitialized = false

export const initSentry = () => {
  if (sentryInitialized) {
    return
  }
  sentryInitialized = true

  Sentry.init({
    dsn: getDsn(),
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration()
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0
  })
}