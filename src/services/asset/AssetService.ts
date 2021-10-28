import { configuration } from "services/Configuration"
import { imageMappings } from "services/sanitize/SanitizationService"
import FileResource from "models/FileResource"

export type AssetUrl = string

const assetUrl = (fileResource: FileResource): AssetUrl =>
  `${configuration.apiService}/assets/${fileResource.type}/id/${fileResource.id}`

export const videoUrl = assetUrl

export const imageUrl = (fileResource: FileResource, safeMode: boolean): AssetUrl =>
  safeMode ? imageMappings(fileResource.id) : assetUrl(fileResource)
