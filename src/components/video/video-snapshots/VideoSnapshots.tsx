import React from "react";
import { imageUrl } from "services/asset/AssetService";
import { Snapshot } from "models/Snapshot";
import ApplicationContext from "context/ApplicationContext";
import { shortHumanReadableDuration } from "utils/Formatter";
import styles from "./VideoSnapshots.module.css";
import { Grid } from "@material-ui/core";

const VideoSnapshot = (snapshot: Snapshot) => (
  <ApplicationContext.Consumer>
    {({ safeMode }) => (
      <div className={styles.videoSnapshot}>
        {shortHumanReadableDuration(snapshot.videoTimestamp)}
        <img
          src={imageUrl(snapshot.fileResource.id, safeMode)}
          alt="video snapshot"
          className={styles.videoSnapshotImage}
        />
      </div>
    )}
  </ApplicationContext.Consumer>
);

export default ({ snapshots }: { snapshots: Snapshot[] }) => (
  <Grid container spacing={1}>
    {snapshots
      .sort(
        (snapshotA, snapshotB) =>
          snapshotA.videoTimestamp.asMilliseconds() -
          snapshotB.videoTimestamp.asMilliseconds()
      )
      .map((snapshot, index) => (
        <Grid item key={index} xs={2}>
          <VideoSnapshot {...snapshot} />
        </Grid>
      ))}
  </Grid>
);
