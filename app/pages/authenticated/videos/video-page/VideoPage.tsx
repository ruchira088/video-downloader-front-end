import React, {useEffect, useState} from "react"
import {Video} from "~/models/Video"
import {LoadableComponent} from "~/components/hoc/loading/LoadableComponent"
import {fetchVideoById, fetchVideoSnapshotsByVideoId} from "~/services/video/VideoService"
import VideoWatch from "./watch/VideoWatch"
import {Snapshot} from "~/models/Snapshot"
import {useSearchParams} from "react-router"
import {None, Option, Some} from "~/types/Option"
import type {Route} from "./+types/VideoPage"
import {Duration} from "luxon"

const VideoPage = (props: Route.ComponentProps) => {
  const [queryParams] = useSearchParams()
  const videoId = props.params.videoId
  const [video, setVideo] = useState<Option<Video>>(None.of())
  const [videoSnapshots, setVideoSnapshots] = useState<Snapshot[]>([])

  const timestamp: Duration = Duration.fromObject({
    seconds: Option.fromNullable(queryParams.get("timestamp"))
      .map((value) => Number.parseInt(value, 10))
      .getOrElse(() => 0)
  })

  const fetchVideo = async () => {
    const video = await fetchVideoById(videoId)
    setVideo(Some.of(video))
  }

  const fetchVideoSnapshots = async () => {
    const snapshots = await fetchVideoSnapshotsByVideoId(videoId)
    setVideoSnapshots(snapshots)
  }

  useEffect(() => {
    fetchVideo()
    fetchVideoSnapshots()
  }, [videoId])

  return (
    <LoadableComponent>
      {
        video.map((value) =>
          <VideoWatch
            video={value}
            timestamp={timestamp}
            updateVideo={(video: Video) => setVideo(Some.of(video))} snapshots={videoSnapshots}
          />
        )
      }
    </LoadableComponent>
  )
}

export default VideoPage
