import React, { useEffect, useState } from "react"
import loadableComponent from "~/components/hoc/loading/loadableComponent"
import { metadata } from "~/services/video/VideoService"
import VideoMetadataCard from "~/components/video/video-metadata-card/VideoMetadataCard"
import { type VideoMetadata } from "~/models/VideoMetadata"
import { None, Option } from "~/types/Option"

const Preview = ({ url }: { url: string }) => {
  const [showPreview, setShowPreview] = useState(false)
  const [maybeVideoMetadata, setMaybeVideoMetadata] = useState<Option<VideoMetadata>>(None.of())

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (url.trim().length !== 0) {
        setShowPreview(true)
        metadata(url).then((result) => setMaybeVideoMetadata(Option.fromNullable(result)))
      }
    }, 500)

    setShowPreview(false)
    setMaybeVideoMetadata(None.of())

    return () => clearTimeout(timeoutId)
  }, [url])

  return (
    <div className="preview">
      {showPreview &&
        loadableComponent(
          VideoMetadataCard,
          maybeVideoMetadata.map((videoMetadata) => ({ ...videoMetadata, disableSnapshots: true }))
        )}
    </div>
  )
}

export default Preview
