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

  const { isLoading, hasMore, loadMore, hasError, retry } = usePaginatedFetch<VideoWatchHistory>(
    pageNumber => getVideoHistory(pageNumber, PAGE_SIZE),
    videoHistories => {
      // A video watched more than once appears in several history entries; show it once.
      const newVideoHistories = videoHistories.filter(videoHistory => {
        const videoId = videoHistory.video.videoMetadata.id

        if (videoIds.current.has(videoId)) {
          return false
        }

        videoIds.current.add(videoId)
        return true
      })

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
        isLoading={isLoading}
        hasError={hasError}
        onRetry={retry}
        endMessage={videoWatchHistories.length > 0 ? "No more history" : "Nothing watched yet"}
        className={styles.videoHistoryGallery}
      >
        {
          videoWatchHistories.map(
            (videoWatchHistory) =>
              <div key={videoWatchHistory.video.videoMetadata.id} className={styles.videoHistoryCard}>
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