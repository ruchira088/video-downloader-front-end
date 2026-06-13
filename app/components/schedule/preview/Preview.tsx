import React, {type FC, useEffect, useState} from "react"
import {Typography} from "@mui/material"
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
  const [hasError, setHasError] = useState(false)

  const isEmptyUrl = props.url.trim().length === 0

  useEffect(() => {
    let cancelled = false

    const timeoutId = setTimeout(() => {
      if (!isEmptyUrl) {
        metadata(props.url)
          .then((result) => {
            if (!cancelled) {
              setMaybeVideoMetadata(Option.fromNullable(result))
            }
          })
          .catch(() => {
            if (!cancelled) {
              setHasError(true)
            }
          })
      }
    }, 500)

    setMaybeVideoMetadata(None.of())
    setHasError(false)

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [props.url])

  return (
    <div>
      {
        !isEmptyUrl && (
          hasError ?
            <Typography color="error">Unable to load video preview</Typography> :
            <LoadableComponent>
              {
                maybeVideoMetadata.map((videoMetadata) =>
                  <VideoMetadataCard videoMetadata={videoMetadata} disableSnapshots={true}/>
                )
              }
            </LoadableComponent>
        )
      }
    </div>
  )
}

export default Preview
