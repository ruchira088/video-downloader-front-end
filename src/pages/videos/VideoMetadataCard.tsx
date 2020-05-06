import React from "react"
import VideoMetadata from "../../services/models/VideoMetadata";

export default (videoMetadata: VideoMetadata) => (
    <div className="vide-metadata-card">
        { videoMetadata.duration }
    </div>
)
