import React, {type FC, type ReactNode, useContext, useEffect, useState} from "react"
import classNames from "classnames"
import {VideoMetadata} from "~/models/VideoMetadata"
import {ApplicationContext} from "~/context/ApplicationContext"
import {imageUrl} from "~/services/asset/AssetService"
import translate from "~/services/translation/TranslationService"
import {humanReadableSize, shortHumanReadableDuration} from "~/utils/Formatter"
import styles from "./VideoMetadataCard.module.css"
import {Snapshot} from "~/models/Snapshot"
import {fetchVideoSnapshotsByVideoId} from "~/services/video/VideoService"
import VideoSiteCard from "../video-site-card/VideoSiteCard"
import {None, Option, Some} from "~/types/Option"
import {type FileResource, FileResourceType} from "~/models/FileResource"

type VideoMetadataCardProps = {
  readonly videoMetadata: VideoMetadata
  readonly disableSnapshots?: boolean
  readonly enableSourceLink?: boolean
  readonly classNames?: string
  readonly children?: ReactNode
}

const VideoMetadataCard: FC<VideoMetadataCardProps> = props => {
  const [maybeSnapshots, setMaybeSnapshots] = useState<Option<Snapshot[]>>(None.of())
  const [maybeIntervalTimeout, setMaybeIntervalTimeout] = useState<Option<NodeJS.Timeout>>(None.of())
  const [index, setIndex] = useState<number>(0)
  const {safeMode} = useContext(ApplicationContext)

  const initializeSnapshots = (): Promise<Snapshot[]> =>
    maybeSnapshots
      .map((values) => Promise.resolve(values))
      .getOrElse(() =>
        fetchVideoSnapshotsByVideoId(props.videoMetadata.id).then((values) => {
          setMaybeSnapshots(Some.of(values))
          return values
        })
      )

  const onMouseOver = () => {
    if (!Option.fromNullable(props.disableSnapshots).getOrElse(() => false)) {
      setMaybeIntervalTimeout(
        Some.of(setInterval(() => setIndex((index) => index + 1), 400)
        )
      )
    }
  }

  const onMouseLeave = () => {
    maybeIntervalTimeout.forEach(clearInterval)
    setMaybeIntervalTimeout(None.of())
    setIndex(0)
  }

  useEffect(() => {
    return () => {
      setMaybeSnapshots(None.of())
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
        .fold<FileResource<FileResourceType.Thumbnail | FileResourceType.Snapshot>>(
          () => props.videoMetadata.thumbnail,
          (values) => values.map((snapshot) => snapshot.fileResource)[index % values.length]
        ),
      safeMode
    )

  return (
    <div className={classNames(styles.videoMetadataCard, props.classNames)}>
      <div className={styles.imageContainer}>
        { props.children }
        {
          props.enableSourceLink &&
          <a href={props.videoMetadata.url} target="_blank" className={styles.videoSiteUrl}>
            <VideoSiteCard videoSite={props.videoMetadata.videoSite}/>
          </a>
        }
        {!props.enableSourceLink && <VideoSiteCard videoSite={props.videoMetadata.videoSite}/>}
        <img
          onMouseOver={onMouseOver}
          onMouseLeave={onMouseLeave}
          src={thumbnail(safeMode)}
          alt="video thumbnail"
          className={styles.thumbnail}
        />
        <div className={styles.size}>{humanReadableSize(props.videoMetadata.size)}</div>
        <div className={styles.duration}>{shortHumanReadableDuration(props.videoMetadata.duration)}</div>
      </div>
      <div className={styles.videoTitle}>{translate(trimTitle(props.videoMetadata.title), safeMode)}</div>
    </div>
  )
}

const trimTitle =
  (title: string): string =>  {
    const textLimit = 35
    const lastTerminatingSpace = title.indexOf(" ", textLimit)

    if (lastTerminatingSpace === -1) {
      return title.substring(0, textLimit)
    } else {
      return title.substring(0, lastTerminatingSpace)
    }
}

export default VideoMetadataCard