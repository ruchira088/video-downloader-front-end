import React, { useEffect, useState } from "react"
import { Video } from "~/models/Video"
import loadableComponent from "~/components/hoc/loading/loadableComponent"
import { fetchVideoById, fetchVideoSnapshots } from "~/services/video/VideoService"
import Watch from "./watch/Watch"
import { Snapshot } from "~/models/Snapshot"
import { useSearchParams } from "react-router"
import { None, Option, Some } from "~/types/Option"
import type { Route } from "./+types/VideoPage"
import { Duration } from "luxon"

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

  useEffect(() => {
    fetchVideoById(videoId).then((video) => setVideo(Some.of(video)))
  }, [videoId])

  useEffect(() => {
    fetchVideoSnapshots(videoId).then((snapshots) => setVideoSnapshots(snapshots))
  }, [videoId])

  return (
    <div className="video-page">
      {/*{loadableComponent(*/}
      {/*  ({ title }: { title: string }) => (*/}
      {/*    <Helmet>*/}
      {/*      <title>{title}</title>*/}
      {/*    </Helmet>*/}
      {/*  ),*/}
      {/*  video.map((value) => value.videoMetadata),*/}
      {/*)}*/}
      {loadableComponent(
        Watch,
        video.map((value) => ({
          ...value,
          timestamp,
          snapshots: videoSnapshots,
          updateVideo: (video: Video) => setVideo(Some.of(video)),
        })),
      )}
    </div>
  )
}

export default VideoPage
