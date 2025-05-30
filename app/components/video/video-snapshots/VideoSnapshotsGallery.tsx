import React, {type FC, useContext} from "react"
import {Link} from "react-router"
import {imageUrl} from "~/services/asset/AssetService"
import {Snapshot} from "~/models/Snapshot"
import {ApplicationContext} from "~/context/ApplicationContext"
import {shortHumanReadableDuration} from "~/utils/Formatter"
import styles from "./VideoSnapshotsGallery.module.css"

type VideoSnapshotProps = {
  readonly snapshot: Snapshot
}

const VideoSnapshot: FC<VideoSnapshotProps> = props => {
  const { safeMode } = useContext(ApplicationContext)

  return (
    <Link
      to={`/video/${props.snapshot.videoId}?timestamp=${Math.round(props.snapshot.videoTimestamp.as("seconds"))}`}
      className={styles.videoSnapshot}
    >
      <div
        className={styles.timestamp}>{shortHumanReadableDuration(props.snapshot.videoTimestamp)}</div>
      <img
        src={imageUrl(props.snapshot.fileResource, safeMode)}
        alt="video snapshot"
        className={styles.videoSnapshotImage}
      />
    </Link>
  )
}

const videoSnapshotSortFn = (snapshotA: Snapshot, snapshotB: Snapshot) =>
  snapshotA.videoTimestamp.toMillis() - snapshotB.videoTimestamp.toMillis()

type VideoSnapshotsProps = {
  readonly snapshots: Snapshot[]
}

const VideoSnapshotsGallery: FC<VideoSnapshotsProps> = props => (
  <div className={styles.videoSnapshotsGallery}>
    {[...props.snapshots].sort(videoSnapshotSortFn).concat(Array(5).fill(null))
      .map((snapshot, index) =>
        <div className={styles.videoSnapshotContainer}>
          {snapshot !== null && <VideoSnapshot snapshot={snapshot} key={index}/>}
        </div>
      )}
  </div>
)

export default VideoSnapshotsGallery