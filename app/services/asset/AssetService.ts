import { apiConfiguration } from "~/services/ApiConfiguration"
import { imageMappings } from "~/services/sanitize/SanitizationService"
import { type FileResource, FileResourceType } from "~/models/FileResource"

export type AssetUrl = string

const assetUrl = (fileResource: FileResource<FileResourceType>): AssetUrl =>
  `${apiConfiguration.baseUrl}/assets/${fileResource.type}/id/${fileResource.id}`

export const videoUrl = assetUrl

export const imageUrl = (fileResource: FileResource<FileResourceType>, safeMode: boolean): AssetUrl =>
  safeMode ? imageMappings(fileResource.id) : assetUrl(fileResource)
