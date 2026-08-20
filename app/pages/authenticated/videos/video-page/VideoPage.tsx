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

    // Clearing the previous video's data is part of starting the fetch for a new `videoId`, not a
    // render the effect could have avoided — without it the old video shows while the new one loads.
    // oxlint-disable-next-line react/set-state-in-effect
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

    // Snapshots are supplementary: a failure here leaves the gallery empty rather than
    // taking down a video that loaded perfectly well.
    const fetchVideoSnapshots = async () => {
      try {
        const snapshots = await fetchVideoSnapshotsByVideoId(videoId)

        if (!cancelled) {
          setVideoSnapshots(snapshots)
        }
      } catch (error) {
        console.error("Failed to load video snapshots", error)
      }
    }

    void fetchVideo()
    void fetchVideoSnapshots()

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
