export interface Configuration {
    readonly apiService: string
    readonly safeMode: boolean
}

export const CONFIGURATION: Configuration = {
    apiService: "https://localhost",
    safeMode: false
}
