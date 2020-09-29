import React from "react"
import {CONFIGURATION} from "services/Configuration";

export interface ApplicationContext {
    readonly safeMode: boolean
}

export const DEFAULT_APPLICATION_CONTEXT: ApplicationContext = {
    safeMode: CONFIGURATION.safeMode
}

export default React.createContext<ApplicationContext>(DEFAULT_APPLICATION_CONTEXT)
