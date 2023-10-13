import React, { useEffect, useState } from "react"
import VideoMetadata from "models/VideoMetadata"
import ApplicationContext from "context/ApplicationContext"
import { imageUrl } from "services/asset/AssetService"
import translate from "services/translation/TranslationService"
import { humanReadableSize, shortHumanReadableDuration } from "utils/Formatter"
import styles from "./VideoMetadataCard.module.css"
import { Maybe, None, Some } from "monet"
import { Snapshot } from "models/Snapshot"
import { fetchVideoSnapshots } from "services/video/VideoService"
import VideoSiteCard from "../video-site-card/VideoSiteCard";

const VideoMetadataCard = (metadata: VideoMetadata & { disableSnapshots?: boolean }) => {
  const [maybeSnapshots, setMaybeSnapshots] = useState<Maybe<Snapshot[]>>(None())
  const [maybeIntervalTimeout, setMaybeIntervalTimeout] = useState<Maybe<NodeJS.Timeout>>(None())
  const [index, setIndex] = useState<number>(0)

  const initializeSnapshots = (): Promise<Snapshot[]> =>
    maybeSnapshots
      .map((values) => Promise.resolve(values))
      .orLazy(() =>
        fetchVideoSnapshots(metadata.id).then((values) => {
          setMaybeSnapshots(Some(values))
          return values
        })
      )

  const onMouseOver = () => {
    if (!Maybe.fromNull(metadata.disableSnapshots).getOrElse(false)) {
      setMaybeIntervalTimeout(
        Some(
          setInterval(() => {
            setIndex((index) => index + 1)
          }, 400)
        )
      )
    }
  }

  const onMouseLeave = () => {
    maybeIntervalTimeout.forEach(clearInterval)
    setMaybeIntervalTimeout(None())
    setIndex(0)
  }

  useEffect(() => {
    return () => {
      setMaybeSnapshots(None())
      maybeIntervalTimeout.forEach(clearInterval)
    }
  }, [])

  useEffect(() => {
    maybeIntervalTimeout.forEach(initializeSnapshots)
  }, [maybeIntervalTimeout])

  const thumbnail = (safeMode: boolean) =>
    imageUrl(
      maybeIntervalTimeout
        .flatMap(() => maybeSnapshots)
        .filter((values) => values.length > 0)
        .fold(metadata.thumbnail)((values) => values.map((snapshot) => snapshot.fileResource)[index % values.length]),
      safeMode
    )

  return (
    <ApplicationContext.Consumer>
      {({ safeMode }) => (
        <div className={styles.videoMetadataCard}>
          <div className={styles.imageContainer}>
            <VideoSiteCard videoSite={metadata.videoSite}/>
            <img
              onMouseOver={onMouseOver}
              onMouseLeave={onMouseLeave}
              src={thumbnail(safeMode)}
              alt="video thumbnail"
              className={styles.thumbnail}
            />
            <div className={styles.size}>{humanReadableSize(metadata.size)}</div>
            <div className={styles.duration}>{shortHumanReadableDuration(metadata.duration)}</div>
          </div>
          <div className={styles.videoTitle}>{translate(metadata.title, safeMode)}</div>
        </div>
      )}
    </ApplicationContext.Consumer>
  )
}

export default VideoMetadataCard