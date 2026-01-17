import React, { type FC } from "react"
import { Video } from "~/models/Video"
import VideoMetadataCard from "../video-metadata-card/VideoMetadataCard"
import Timestamp from "~/components/timestamp/Timestamp"
import styles from "./VideoCard.module.scss"
import type { DateTime } from "luxon"


type VideoCardProps = {
  readonly video: Video
  readonly lastWatched?: DateTime
}

const VideoCard: FC<VideoCardProps> =
  props =>
    <div className={styles.videoCard}>
      <VideoMetadataCard videoMetadata={props.video.videoMetadata} />
      {props.lastWatched ? (
        <Timestamp timestamp={props.lastWatched} className={styles.videoTimestamp}/>
      ) : (
        <Timestamp timestamp={props.video.createdAt} className={styles.videoTimestamp}/>
      )}
    </div>

export default VideoCard
