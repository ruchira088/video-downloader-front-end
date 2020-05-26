import React from "react"
import {Card} from "@material-ui/core"
import Video from "services/models/Video";
import VideoMetadataCard from "./VideoMetadataCard";

export default (video: Video) => (
    <Card>
        <VideoMetadataCard {...video.videoMetadata}/>
    </Card>
)
