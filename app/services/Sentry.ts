import * as Sentry from "@sentry/react"
import { Environment, getEnvironment } from "~/services/Config"

const DSN_MAPPINGS: Record<Environment, string> = {
  [Environment.Development]: "https://294ffe65738b62400211626678d54021@o4510770741837824.ingest.us.sentry.io/4510771405455360",
  [Environment.Staging]: "https://294ffe65738b62400211626678d54021@o4510770741837824.ingest.us.sentry.io/4510771405455360",
  [Environment.Production]: "https://294ffe65738b62400211626678d54021@o4510770741837824.ingest.us.sentry.io/4510771405455360"
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