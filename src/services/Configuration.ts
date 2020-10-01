export interface Configuration {
    readonly apiService: string
    readonly safeMode: boolean
}

export const CONFIGURATION: Configuration = {
    apiService: "https://api.video.home.ruchij.com",
    safeMode: false
}
