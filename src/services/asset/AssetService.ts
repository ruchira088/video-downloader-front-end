import configuration from "services/Configuration"
import {imageMappings} from "services/sanitize/SanitizationService"

export type AssetUrl = string

export const assetUrl =
    (id: string): AssetUrl =>
        configuration.safeMode ?
            imageMappings(id) : `${configuration.apiService}/assets/id/${id}`
