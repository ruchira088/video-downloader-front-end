import React, { useEffect, useState } from "react"
import VideoMetadata from "models/VideoMetadata"
import ApplicationContext from "context/ApplicationContext"
import { thumbnailUrl } from "services/asset/AssetService"
import translate from "services/translation/TranslationService"
import { humanReadableDuration, humanReadableSize, shortHumanReadableDuration } from "utils/Formatter"
import styles from "./VideoMetadataCard.module.css"
import { Maybe, None, Some } from "monet"
import { Snapshot } from "models/Snapshot"
import { fetchVideoSnapshots } from "services/video/VideoService"

export default (metadata: VideoMetadata) => {
  const [snapshots, setSnapshots] = useState<Maybe<Snapshot[]>>(None())
  const [intervalTimeout, setIntervalTimeout] = useState<Maybe<NodeJS.Timeout>>(None())
  const [index, setIndex] = useState<number>(0)

  const initializeSnapshots = (): Promise<Snapshot[]> =>
    snapshots
      .map((values) => Promise.resolve(values))
      .orLazy(() =>
        fetchVideoSnapshots(metadata.id).then((values) => {
          setSnapshots(Some(values))
          return values
        })
      )

  const onMouseOver = () =>
    setIntervalTimeout(
      Some(
        setInterval(() => {
          setIndex((index) => index + 1)
        }, 400)
      )
    )

  const onMouseLeave = () => {
    intervalTimeout.forEach(clearInterval)
    setIntervalTimeout(None())
    setIndex(0)
  }

  useEffect(() => {
    return () => {
      setSnapshots(None())
      intervalTimeout.forEach(clearInterval)
    }
  }, [])

  useEffect(() => {
    intervalTimeout.forEach(initializeSnapshots)
  }, [intervalTimeout])

  const thumbnail = (safeMode: boolean) =>
    thumbnailUrl(
      intervalTimeout
        .flatMap(() => snapshots)
        .filter((values) => values.length > 0)
        .fold(metadata.thumbnail)((values) => values.map((snapshot) => snapshot.fileResource)[index % values.length]),
      safeMode
    )

  return (
    <ApplicationContext.Consumer>
      {({ safeMode }) => (
        <div className={styles.videoMetadataCard}>
          <div className={styles.imageContainer}>
            <img
              onMouseOver={onMouseOver}
              onMouseLeave={onMouseLeave}
              src={thumbnail(safeMode)}
              alt="video thumbnail"
              className={styles.thumbnail}
            />
            <div className={styles.duration}>{shortHumanReadableDuration(metadata.duration)}</div>
          </div>
          <div>
            <div>{translate(metadata.title, safeMode)}</div>
            <div>{humanReadableSize(metadata.size)}</div>
          </div>
        </div>
      )}
    </ApplicationContext.Consumer>
  )
}
