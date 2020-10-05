import React from "react";
import Video from "models/Video";
import VideoMetadataCard from "../video-metadata-card/VideoMetadataCard";

export default (video: Video) => <VideoMetadataCard {...video.videoMetadata} />;
