export interface Configuration {
    apiService: string
    safeMode: boolean
}

const configuration: Configuration = {
    apiService: "http://localhost:8000",
    safeMode: true
}

export default configuration
