// Session Replay is the bulk of the Sentry SDK (~125 KB minified). Re-exported from its own
// module so `initSentry` can load it with a dynamic import, keeping it out of the root chunk.
export { replayIntegration } from "@sentry/react"
