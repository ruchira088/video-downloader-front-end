import React from "react"
import {CONFIGURATION} from "services/Configuration";

export interface ApplicationContext {
    readonly safeMode: boolean
}

export const defaultApplicationContext: ApplicationContext = {
    safeMode: CONFIGURATION.safeMode
}

export default React.createContext<ApplicationContext>(defaultApplicationContext)
