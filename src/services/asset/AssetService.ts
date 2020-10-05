import { configuration } from "services/Configuration"
import { imageMappings } from "services/sanitize/SanitizationService"
import FileResource from "models/FileResource"

export type AssetUrl = string

const assetUrl = (id: string): AssetUrl => `${configuration.apiService}/assets/id/${id}`

const isFileResource = (input: FileResource | string): input is FileResource => (input as FileResource).id !== undefined

export const thumbnailUrl = (input: FileResource | string, safeMode: boolean): string =>
  isFileResource(input)
    ? safeMode
      ? imageMappings(input.id)
      : assetUrl(input.id)
    : safeMode
    ? imageMappings(input)
    : input

export const videoUrl = assetUrl

export const imageUrl = (id: string, safeMode: boolean): AssetUrl => (safeMode ? imageMappings(id) : assetUrl(id))
