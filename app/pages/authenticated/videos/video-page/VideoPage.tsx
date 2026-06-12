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
  const [hasError, setHasError] = useState(false)

  const timestamp: Duration = Duration.fromObject({
    seconds: Option.fromNullable(queryParams.get("timestamp"))
      .map((value) => Number.parseInt(value, 10))
      .getOrElse(() => 0)
  })

  useEffect(() => {
    let cancelled = false

    setVideo(None.of())
    setVideoSnapshots([])
    setHasError(false)

    const fetchVideo = async () => {
      try {
        const video = await fetchVideoById(videoId)

        if (!cancelled) {
          setVideo(Some.of(video))
        }
      } catch {
        if (!cancelled) {
          setHasError(true)
        }
      }
    }

    const fetchVideoSnapshots = async () => {
      try {
        const snapshots = await fetchVideoSnapshotsByVideoId(videoId)

        if (!cancelled) {
          setVideoSnapshots(snapshots)
        }
      } catch {
        if (!cancelled) {
          setHasError(true)
        }
      }
    }

    fetchVideo()
    fetchVideoSnapshots()

    return () => {
      cancelled = true
    }
  }, [videoId])

  if (hasError) {
    return <div>Unable to load video</div>
  }

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
