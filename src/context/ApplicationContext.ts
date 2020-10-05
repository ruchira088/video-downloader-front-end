import React from "react"
import { configuration } from "services/Configuration"

export interface ApplicationContext {
  readonly safeMode: boolean
}

export const DEFAULT_APPLICATION_CONTEXT: ApplicationContext = {
  safeMode: configuration.safeMode,
}

export default React.createContext<ApplicationContext>(DEFAULT_APPLICATION_CONTEXT)
