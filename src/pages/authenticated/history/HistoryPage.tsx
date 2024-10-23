import React, { useEffect, useState } from "react"
import { Helmet } from "react-helmet"
import { getVideoHistory } from "../../../services/history/HistoryService"
import { VideoWatchHistory } from "../../../models/VideoWatchHistory"
import VideoCard from "../../../components/video/video-card/VideoCard"
import { Link } from "react-router-dom"

const HistoryPage = () => {
  const [videoWatchHistories, setVideoWatchHistories] = useState<VideoWatchHistory[]>([])

  useEffect(() => {
    getVideoHistory(0, 50)
      .then(values => {
        const videoIds = new Set()
        const watchedItems: VideoWatchHistory[] = []

        values.forEach(videoWatchHistory => {
          if (!videoIds.has(videoWatchHistory.video.videoMetadata.id)) {
            videoIds.add(videoWatchHistory.video.videoMetadata.id)
            watchedItems.push(videoWatchHistory)
          }
        })

        setVideoWatchHistories(watchedItems)
      })
  }, [])

  return (
    <div>
      <Helmet>
        <title>History</title>
      </Helmet>
      <div>
        {
          videoWatchHistories.map(
            (videoWatchHistory, index) =>
              <Link to={`/video/${videoWatchHistory.video.videoMetadata.id}`} key={index}>
                <VideoCard {...videoWatchHistory.video}/>
              </Link>
          )
        }
      </div>
    </div>
  )

}

export default HistoryPage