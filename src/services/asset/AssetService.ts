import configuration from "../Configuration";

export const assetUrl =
    (id: string): string => `${configuration.apiService}/assets/id/${id}`
