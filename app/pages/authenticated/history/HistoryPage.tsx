import React, {useEffect, useRef, useState} from "react"
import {Link} from "react-router"
import {getVideoHistory} from "~/services/history/HistoryService"
import {VideoWatchHistory} from "~/models/VideoWatchHistory"
import VideoCard from "~/components/video/video-card/VideoCard"

import styles from "./HistoryPage.module.scss"
import InfiniteScroll from "~/components/infinite-scroll/InfiniteScroll"

const PAGE_SIZE = 50

const HistoryPage = () => {
  const [videoWatchHistories, setVideoWatchHistories] = useState<VideoWatchHistory[]>([])
  const [pageNumber, setPageNumber] = useState(0)
  const videoIds = useRef<Set<string>>(new Set())
  const isLoading = useRef(false)
  const hasMore = useRef(true)

  const retrieveVideoHistory = async () => {
    isLoading.current = true

    try {
      const videoHistories: VideoWatchHistory[] = await getVideoHistory(pageNumber, PAGE_SIZE)

      if (videoHistories.length < PAGE_SIZE) {
        hasMore.current = false
      }

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
    } finally {
      isLoading.current = false
    }
  }

  useEffect(() => {
    retrieveVideoHistory()
  }, [pageNumber])

  return (
    <div>
      {/*<Helmet>*/}
      {/*  <title>History</title>*/}
      {/*</Helmet>*/}
      <InfiniteScroll
        loadMore={() => setPageNumber(pageNumber => pageNumber + 1)}
        isLoading={isLoading.current}
        hasMore={hasMore.current}
        className={styles.videoHistoryGallery}
      >
        {
          videoWatchHistories.map(
            (videoWatchHistory, index) =>
              <div key={index} className={styles.videoHistoryCard}>
                <Link to={`/video/${videoWatchHistory.video.videoMetadata.id}`}>
                  <VideoCard video={videoWatchHistory.video}/>
                </Link>
              </div>
          )
        }
      </InfiniteScroll>
    </div>
  )

}

export default HistoryPage