import React from "react"
import configuration from "services/Configuration";

export interface ApplicationContext {
    safeMode: boolean
}

export const DEFAULT_CONTEXT: ApplicationContext = {
    safeMode: configuration.safeMode
}

export default React.createContext<ApplicationContext>(DEFAULT_CONTEXT)
