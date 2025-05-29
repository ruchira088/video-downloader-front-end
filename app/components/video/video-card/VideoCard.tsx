import React, {type FC} from "react"
import {Video} from "~/models/Video"
import VideoMetadataCard from "../video-metadata-card/VideoMetadataCard"

type VideoCardProps = {
  readonly video: Video
}

const VideoCard: FC<VideoCardProps> =
  props => <VideoMetadataCard videoMetadata={props.video.videoMetadata} />

export default VideoCard
