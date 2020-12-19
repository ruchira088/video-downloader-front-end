import React, {useEffect, useRef} from "react"
import ApplicationContext from "context/ApplicationContext"
import Video from "models/Video"
import { imageUrl, videoUrl } from "services/asset/AssetService"
import { Snapshot } from "models/Snapshot"
import translate from "services/translation/TranslationService"
import VideoSnapshots from "components/video/video-snapshots/VideoSnapshots"
import styles from "./Watch.module.css"
import EditableLabel from "components/editable-label/EditableLabel"
import { updateVideoTitle } from "services/video/VideoService"
import {Duration} from "moment";
import {Maybe} from "monet";

export default (
  video: Video & { snapshots: Snapshot[] } & {
    timestamp: Duration,
    updateVideo: (video: Video) => void
  }
) => {
  const videoPlayer = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    Maybe.fromNull(videoPlayer.current).forEach(videoElement => {
      videoElement.currentTime = video.timestamp.asSeconds()
    })
  })

  const onUpdateVideoTitle: (title: string) => Promise<void> = (title) =>
    updateVideoTitle(video.videoMetadata.id, title).then(video.updateVideo)

  return (
    <ApplicationContext.Consumer>
      {({ safeMode }) => (
        <div className={styles.watch}>
          <div className={styles.title}>
            <EditableLabel
              textValue={translate(video.videoMetadata.title, safeMode)}
              onUpdateText={onUpdateVideoTitle}
            />
          </div>
          <video
            ref={videoPlayer}
            controls
            preload="auto"
            poster={imageUrl(video.videoMetadata.thumbnail.id, safeMode)}
            className={styles.video}
          >
            <source src={videoUrl(video.fileResource.id)} type={video.fileResource.mediaType} />
          </video>
          <VideoSnapshots snapshots={video.snapshots} />
        </div>
      )}
    </ApplicationContext.Consumer>
  )
}
