import React, { useRef, useState } from "react"
import { Link } from "react-router"
import { getVideoHistory } from "~/services/history/HistoryService"
import { VideoWatchHistory } from "~/models/VideoWatchHistory"
import VideoCard from "~/components/video/video-card/VideoCard"
import Helmet from "~/components/helmet/Helmet"

import styles from "./HistoryPage.module.scss"
import InfiniteScroll from "~/components/infinite-scroll/InfiniteScroll"
import { usePaginatedFetch } from "~/components/infinite-scroll/usePaginatedFetch"

const PAGE_SIZE = 50

const HistoryPage = () => {
  const [videoWatchHistories, setVideoWatchHistories] = useState<VideoWatchHistory[]>([])
  const videoIds = useRef<Set<string>>(new Set())

  const { hasMore, loadMore } = usePaginatedFetch<VideoWatchHistory>(
    pageNumber => getVideoHistory(pageNumber, PAGE_SIZE),
    videoHistories => {
      const newVideoHistories = videoHistories.reduce<VideoWatchHistory[]>(
        (videos, videoHistory) => {
          if (!videoIds.current.has(videoHistory.video.videoMetadata.id)) {
            videoIds.current.add(videoHistory.video.videoMetadata.id)
            return videos.concat(videoHistory)
          } else {
            return videos
          }
        },
        []
      )

      setVideoWatchHistories(videoWatchHistories => videoWatchHistories.concat(newVideoHistories))
    },
    { pageSize: PAGE_SIZE }
  )

  return (
    <div className={styles.historyPage}>
      <Helmet title="History"/>
      <InfiniteScroll
        loadMore={loadMore}
        hasMore={hasMore}
        className={styles.videoHistoryGallery}
      >
        {
          videoWatchHistories.map(
            (videoWatchHistory, index) =>
              <div key={index} className={styles.videoHistoryCard}>
                  <Link to={`/video/${videoWatchHistory.video.videoMetadata.id}`}>
                    <VideoCard video={videoWatchHistory.video} lastWatched={videoWatchHistory.lastUpdatedAt}/>
                  </Link>
              </div>
          )
        }
      </InfiniteScroll>
    </div>
  )

}

export default HistoryPage