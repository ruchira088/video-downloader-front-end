import React, { useEffect, useState } from "react"
import { useParams, useLocation } from "react-router-dom"
import { Maybe, None, Some } from "monet"
import Video from "models/Video"
import loadableComponent from "components/hoc/loading/loadableComponent"
import { fetchVideoById, fetchVideoSnapshots } from "services/video/VideoService"
import Watch from "./watch/Watch"
import { Snapshot } from "models/Snapshot"
import {Duration, duration} from "moment";

export default () => {
  const { videoId }: { videoId: string } = useParams()
  const queryParams = new URLSearchParams(useLocation().search)
  const [video, setVideo] = useState<Maybe<Video>>(None())
  const [videoSnapshots, setVideoSnapshots] = useState<Snapshot[]>([])

  const timestamp: Duration =
    duration(
        Maybe.fromFalsy(queryParams.get("timestamp")).map(value => Number.parseInt(value, 10)).getOrElse(0),
        "seconds"
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
        Watch,
        video.map((value) => ({
          ...value,
          timestamp,
          snapshots: videoSnapshots,
          updateVideo: (video) => setVideo(Some(video)),
        }))
      )}
    </div>
  )
}
