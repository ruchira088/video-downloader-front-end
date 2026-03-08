import React, { useEffect, useRef, useState } from "react"
import { Link } from "react-router"
import { Button } from "@mui/material"
import { deleteVideo, fetchDuplicateVideos, fetchVideoById } from "~/services/video/VideoService"
import { Video } from "~/models/Video"
import type { DuplicateVideoGroups } from "~/models/DuplicateVideo"
import VideoCard from "~/components/video/video-card/VideoCard"
import Helmet from "~/components/helmet/Helmet"
import InfiniteScroll from "~/components/infinite-scroll/InfiniteScroll"

import styles from "./Duplicates.module.scss"

const PAGE_SIZE = 25

type DuplicateGroupEntry = {
  readonly groupId: string
  readonly videos: Video[]
}

const Duplicates = () => {
  const [groups, setGroups] = useState<DuplicateGroupEntry[]>([])
  const [pageNumber, setPageNumber] = useState(0)
  const isLoading = useRef(false)
  const hasMore = useRef(true)
  const fetchedPages = useRef(new Set<number>())

  const loadDuplicates = async (page: number) => {
    if (fetchedPages.current.has(page)) return
    fetchedPages.current.add(page)
    isLoading.current = true

    try {
      const duplicateGroups: DuplicateVideoGroups = await fetchDuplicateVideos(page, PAGE_SIZE)
      const groupEntries = Object.entries(duplicateGroups)

      if (groupEntries.length < PAGE_SIZE) {
        hasMore.current = false
      }

      const newGroups: DuplicateGroupEntry[] = await Promise.all(
        groupEntries.map(async ([groupId, duplicates]) => {
          const videos = await Promise.all(
            duplicates.map(duplicate => fetchVideoById(duplicate.videoId))
          )
          return { groupId, videos }
        })
      )

      if (newGroups.length > 0) {
        setGroups(prev => prev.concat(newGroups))
      }
    } finally {
      isLoading.current = false
    }
  }

  useEffect(() => {
    loadDuplicates(pageNumber)
  }, [pageNumber])

  const loadMore = () => {
    if (!isLoading.current && hasMore.current) {
      setPageNumber(prev => prev + 1)
    }
  }

  const onDeleteVideo = async (videoId: string) => {
    await deleteVideo(videoId, true)

    setGroups(prev =>
      prev
        .map(group => ({
          ...group,
          videos: group.videos.filter(v => v.videoMetadata.id !== videoId)
        }))
        .filter(group => group.videos.length > 1)
    )
  }

  return (
    <div className={styles.duplicatesPage}>
      <Helmet title="Duplicates" />

      {groups.length === 0 && !isLoading.current && (
        <div className={styles.emptyState}>No duplicate videos found</div>
      )}

      <InfiniteScroll
        loadMore={loadMore}
        hasMore={hasMore.current}
        className={styles.duplicateGroups}
      >
        {groups.map(group => (
          <div key={group.groupId} className={styles.duplicateGroup}>
            <div className={styles.groupHeader}>
              {group.videos.length} duplicate videos
            </div>
            <div className={styles.groupVideos}>
              {group.videos.map((video) => (
                <div key={video.videoMetadata.id} className={styles.videoCard}>
                  <Link to={`/video/${video.videoMetadata.id}`}>
                    <VideoCard video={video} />
                  </Link>
                  <Button
                    color="error"
                    variant="contained"
                    size="small"
                    className={styles.deleteButton}
                    onClick={() => onDeleteVideo(video.videoMetadata.id)}
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </InfiniteScroll>

    </div>
  )
}

export default Duplicates
