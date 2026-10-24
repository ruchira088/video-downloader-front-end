import React, {useEffect, useState} from "react"
import {Video} from "~/models/Video"
import {LoadableComponent} from "~/components/hoc/loading/LoadableComponent"
import {fetchVideoById, fetchVideoSnapshotsByVideoId} from "~/services/video/VideoService"
import VideoWatch from "./watch/VideoWatch"
import {Snapshot} from "~/models/Snapshot"
import {useNavigate, useSearchParams} from "react-router"
import {Button} from "@mui/material"
import {None, Option, Some} from "~/types/Option"
import type {Route} from "./+types/VideoPage"
import {Duration} from "luxon"
import { reportError } from "~/services/ErrorReporting"
import { httpStatusCode } from "~/services/http/HttpClient"

import styles from "./VideoPage.module.scss"

type LoadFailure = "not-found" | "error"

const VideoPage = (props: Route.ComponentProps) => {
  const [queryParams] = useSearchParams()
  const videoId = props.params.videoId
  const [video, setVideo] = useState<Option<Video>>(None.of())
  const [videoSnapshots, setVideoSnapshots] = useState<Snapshot[]>([])
  const [loadFailure, setLoadFailure] = useState<Option<LoadFailure>>(None.of())
  // Bumped by Retry to rerun the fetch for the same `videoId`.
  const [attempt, setAttempt] = useState(0)
  const navigate = useNavigate()

  const timestamp: Duration = Duration.fromObject({
    seconds: Option.fromNullable(queryParams.get("timestamp"))
      .map((value) => Number.parseInt(value, 10))
      // Luxon throws on NaN, so a malformed link (?timestamp=abc) would otherwise crash the page.
      .filter((seconds) => Number.isFinite(seconds) && seconds >= 0)
      .getOrElse(() => 0)
  })

  useEffect(() => {
    let cancelled = false

    // Clearing the previous video's data is part of starting the fetch for a new `videoId`, not a
    // render the effect could have avoided — without it the old video shows while the new one loads.
    // oxlint-disable-next-line react/set-state-in-effect
    setVideo(None.of())
    setVideoSnapshots([])
    setLoadFailure(None.of())

    const fetchVideo = async () => {
      try {
        const video = await fetchVideoById(videoId)

        if (!cancelled) {
          setVideo(Some.of(video))
        }
      } catch (error) {
        if (!cancelled) {
          // A 404 is a bad link, not a failure; anything else is worth a report and a retry.
          const isNotFound = !httpStatusCode(error).filter(status => status === 404).isEmpty()
          setLoadFailure(Some.of(isNotFound ? "not-found" : "error"))

          if (!isNotFound) {
            reportError("Failed to load video", error)
          }
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
        reportError("Failed to load video snapshots", error)
      }
    }

    void fetchVideo()
    void fetchVideoSnapshots()

    return () => {
      cancelled = true
    }
  }, [videoId, attempt])

  const failure = loadFailure.toDefined()

  if (failure !== undefined) {
    return (
      <div className={styles.errorContainer}>
        <p>{failure === "error" ? "Unable to load video" : "Video not found"}</p>
        {failure === "error" && <Button onClick={() => setAttempt(current => current + 1)}>Retry</Button>}
        <Button onClick={() => void navigate("/")}>Back to Videos</Button>
      </div>
    )
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
