import React, { type FC, useContext } from "react"
import { imageUrl } from "~/services/asset/AssetService"
import { Snapshot } from "~/models/Snapshot"
import { ApplicationContext } from "~/context/ApplicationContext"
import { shortHumanReadableDuration } from "~/utils/Formatter"
import styles from "./VideoSnapshots.module.css"
import { Grid } from "@mui/material"
import { Link } from "react-router"

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

const VideoSnapshots: FC<VideoSnapshotsProps> = props => (
  <Grid container spacing={1}>
    {[...props.snapshots].sort(videoSnapshotSortFn)
      .map((snapshot, index) => (
        <div key={index}>
          <VideoSnapshot snapshot={snapshot} />
        </div>
      ))}
  </Grid>
)

export default VideoSnapshots