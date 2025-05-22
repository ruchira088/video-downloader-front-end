import React from "react"
import {Video} from "~/models/Video"
import VideoMetadataCard from "../video-metadata-card/VideoMetadataCard"

const VideoCard = (video: Video) => <VideoMetadataCard {...video.videoMetadata} />

export default VideoCard
