import React from "react"
import Video from "services/models/Video";
import VideoMetadataCard from "./VideoMetadataCard";

export default (video: Video) => (
    <VideoMetadataCard {...video.videoMetadata}/>
)
