import configuration from "services/Configuration";

export const assetUrl =
    (id: string): string => `${configuration.apiService}/assets/id/${id}`
