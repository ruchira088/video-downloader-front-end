import React, { type FC } from "react"
import { Video } from "~/models/Video"
import VideoMetadataCard from "../video-metadata-card/VideoMetadataCard"
import Timestamp from "~/components/timestamp/Timestamp"


type VideoCardProps = {
  readonly video: Video
}

const VideoCard: FC<VideoCardProps> =
  props =>
    <div>
      <VideoMetadataCard videoMetadata={props.video.videoMetadata} />
      <Timestamp timestamp={props.video.createdAt}/>
    </div>

export default VideoCard
