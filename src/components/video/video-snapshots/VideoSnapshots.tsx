import React from "react"
import { Link } from "react-router-dom"
import { imageUrl } from "services/asset/AssetService"
import { Snapshot } from "models/Snapshot"
import ApplicationContext from "context/ApplicationContext"
import { shortHumanReadableDuration } from "utils/Formatter"
import styles from "./VideoSnapshots.module.css"
import { Grid } from "@mui/material"

const VideoSnapshot = (snapshot: Snapshot) => (
  <ApplicationContext.Consumer>
    {({ safeMode }) => (
      <Link
        to={`/video/${snapshot.videoId}?timestamp=${Math.round(snapshot.videoTimestamp.asSeconds())}`}
        className={styles.videoSnapshot}
      >
        <div className={styles.timestamp}>{shortHumanReadableDuration(snapshot.videoTimestamp)}</div>
        <img
          src={imageUrl(snapshot.fileResource, safeMode)}
          alt="video snapshot"
          className={styles.videoSnapshotImage}
        />
      </Link>
    )}
  </ApplicationContext.Consumer>
)

const VideoSnapshots = ({ snapshots }: { snapshots: Snapshot[] }) => (
  <Grid container spacing={1}>
    {snapshots
      .sort(
        (snapshotA, snapshotB) => snapshotA.videoTimestamp.asMilliseconds() - snapshotB.videoTimestamp.asMilliseconds()
      )
      .map((snapshot, index) => (
        <Grid item key={index} xs={6} sm={4} md={3} lg={2}>
          <VideoSnapshot {...snapshot} />
        </Grid>
      ))}
  </Grid>
)

export default VideoSnapshots