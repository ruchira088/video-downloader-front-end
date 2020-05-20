import React from "react"

export interface ApplicationContext {
    safeMode: boolean
}

export const DEFAULT_CONTEXT: ApplicationContext = {
    safeMode: true
}

export default React.createContext<ApplicationContext>(DEFAULT_CONTEXT)
