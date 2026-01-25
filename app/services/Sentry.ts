import * as Sentry from "@sentry/react"
import { Environment, getEnvironment } from "~/services/Config"

const SENTRY_CLIENT_ID_MAPPINGS: Record<Environment, string> = {
  [Environment.Development]: "55a77840c28080dfe418bf850b9c8f27e30c57eda550281edede2e627c82ec14",
  [Environment.Staging]: "55a77840c28080dfe418bf850b9c8f27e30c57eda550281edede2e627c82ec14",
  [Environment.Production]: "55a77840c28080dfe418bf850b9c8f27e30c57eda550281edede2e627c82ec14"
}

const getSentryClientId = () => {
  const environment: Environment = getEnvironment()
  return SENTRY_CLIENT_ID_MAPPINGS[environment]
}

let sentryInitialized = false

export const initSentry = () => {
  if (sentryInitialized) {
    return
  }
  sentryInitialized = true

  Sentry.init({
    dsn: getSentryClientId(),
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration()
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0
  })
}