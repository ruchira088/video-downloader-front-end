
export interface Configuration {
    readonly apiService: string
    readonly safeMode: boolean
}

export const configuration: Configuration = {
    apiService: `https://api.${window.location.hostname}`,
    safeMode: false
}
