import React, { useEffect, useState } from "react"
import { Maybe, None } from "monet"
import loadableComponent from "components/hoc/loading/loadableComponent"
import { metadata } from "services/video/VideoService"
import VideoMetadataCard from "components/video/video-metadata-card/VideoMetadataCard"
import VideoMetadata from "models/VideoMetadata"

export default ({ url }: { url: string }) => {
  const [showPreview, setShowPreview] = useState(false)
  const [maybeVideoMetadata, setMaybeVideoMetadata] = useState<Maybe<VideoMetadata>>(None())

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (url.trim().length !== 0) {
        setShowPreview(true)
        metadata(url).then((result) => setMaybeVideoMetadata(Maybe.fromNull(result)))
      }
    }, 500)

    setShowPreview(false)
    setMaybeVideoMetadata(None())

    return () => clearTimeout(timeoutId)
  }, [url])

  return (
    <div className="preview">
      { showPreview &&
        loadableComponent(
          VideoMetadataCard,
          maybeVideoMetadata.map(videoMetadata => ({...videoMetadata, disableSnapshots: true}))
        )
      }
    </div>
  )
}
