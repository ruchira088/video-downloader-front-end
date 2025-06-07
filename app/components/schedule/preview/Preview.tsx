import React, {type FC, useEffect, useState} from "react"
import {LoadableComponent} from "~/components/hoc/loading/LoadableComponent"
import VideoMetadataCard from "~/components/video/video-metadata-card/VideoMetadataCard"
import {type VideoMetadata} from "~/models/VideoMetadata"
import {None, Option} from "~/types/Option"
import {metadata} from "~/services/video/VideoService"

type PreviewProps = {
  readonly url: string
}

const Preview: FC<PreviewProps> = props => {
  const [maybeVideoMetadata, setMaybeVideoMetadata] = useState<Option<VideoMetadata>>(None.of())

  const isEmptyUrl = props.url.trim().length === 0

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!isEmptyUrl) {
        metadata(props.url).then((result) => setMaybeVideoMetadata(Option.fromNullable(result)))
      }
    }, 500)

    setMaybeVideoMetadata(None.of())

    return () => clearTimeout(timeoutId)
  }, [props.url])

  return (
    <div>
      {
        !isEmptyUrl &&
        <LoadableComponent>
          {
            maybeVideoMetadata.map((videoMetadata) =>
              <VideoMetadataCard videoMetadata={videoMetadata} disableSnapshots={true}/>
            )
          }
        </LoadableComponent>
      }
    </div>
  )
}

export default Preview
