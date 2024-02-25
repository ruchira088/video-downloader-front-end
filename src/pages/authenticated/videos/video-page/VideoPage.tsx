import React, { useEffect, useState } from "react"
import { Params, useLocation, useParams } from "react-router-dom"
import { Maybe, None, Some } from "monet"
import Video from "models/Video"
import loadableComponent from "components/hoc/loading/loadableComponent"
import { fetchVideoById, fetchVideoSnapshots } from "services/video/VideoService"
import Watch from "./watch/Watch"
import { Snapshot } from "models/Snapshot"
import { Duration, duration } from "moment"
import { Helmet } from "react-helmet"

const VideoPage = () => {
  const params: Readonly<Params> = useParams()
  const videoId = Maybe.fromNull(params.videoId).getOrElse("")
  const queryParams = new URLSearchParams(useLocation().search)
  const [video, setVideo] = useState<Maybe<Video>>(None())
  const [videoSnapshots, setVideoSnapshots] = useState<Snapshot[]>([])

  const timestamp: Duration = duration(
    Maybe.fromFalsy(queryParams.get("timestamp"))
      .map((value) => Number.parseInt(value, 10))
      .getOrElse(0),
    "seconds",
  )

  useEffect(() => {
    fetchVideoById(videoId).then((video) => setVideo(Some(video)))
  }, [videoId])

  useEffect(() => {
    fetchVideoSnapshots(videoId).then((snapshots) => setVideoSnapshots(snapshots))
  }, [videoId])

  return (
    <div className="video-page">
      {loadableComponent(
        ({ title }: { title: string }) => (
          <Helmet>
            <title>{title}</title>
          </Helmet>
        ),
        video.map((value) => value.videoMetadata),
      )}
      {loadableComponent(
        Watch,
        video.map((value) => ({
          ...value,
          timestamp,
          snapshots: videoSnapshots,
          updateVideo: (video) => setVideo(Some(video)),
        })),
      )}
    </div>
  )
}

export default VideoPage
