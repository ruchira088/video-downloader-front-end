import React, {useEffect, useState} from "react"
import {Maybe, None} from "monet";
import loadableComponent from "components/hoc/loading/loadableComponent"
import {analyze} from "services/video/VideoService"
import {VideoAnalysisResult} from "models/VideoAnalysisResult";
import VideoMetadataCard from "components/video/video-metadata-card/VideoMetadataCard";

export default ({url}: { url: string }) => {
    const [showPreview, setShowPreview] = useState(false)
    const [videoAnalysisResult, setVideoAnalysisResult] = useState<Maybe<VideoAnalysisResult>>(None())

    useEffect(() => {
        const timeoutId =
            setTimeout(() => {
                if (url.trim().length !== 0) {
                    setShowPreview(true)
                    analyze(url).then(result => setVideoAnalysisResult(Maybe.fromNull(result)))
                }
            }, 500)

        setShowPreview(false)
        setVideoAnalysisResult(None())

        return () => clearTimeout(timeoutId)
    }, [url])

    return (
        <div className="preview">
            { showPreview && loadableComponent(VideoMetadataCard, videoAnalysisResult) }
        </div>
    )
}
