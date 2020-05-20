import configuration from "services/Configuration"
import {imageMappings} from "services/sanitize/SanitizationService"

export type AssetUrl = string

export const assetUrl =
    (id: string, safeMode: boolean): AssetUrl =>
        (safeMode) ? imageMappings(id) : `${configuration.apiService}/assets/id/${id}`
