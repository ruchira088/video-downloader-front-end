import React, { useRef, useState } from "react"
import { Link } from "react-router"
import { Button } from "@mui/material"
import { deleteVideo, fetchDuplicateVideos, fetchVideoById } from "~/services/video/VideoService"
import { Video } from "~/models/Video"
import VideoCard from "~/components/video/video-card/VideoCard"
import Helmet from "~/components/helmet/Helmet"
import InfiniteScroll from "~/components/infinite-scroll/InfiniteScroll"
import { usePaginatedFetch } from "~/components/infinite-scroll/usePaginatedFetch"

import styles from "./Duplicates.module.scss"

const PAGE_SIZE = 25

type DuplicateGroupEntry = {
  readonly groupId: string
  readonly videos: Video[]
}

const Duplicates = () => {
  const [groups, setGroups] = useState<DuplicateGroupEntry[]>([])
  const loadedGroupIds = useRef(new Set<string>())

  const { isLoading, hasMore, loadMore } = usePaginatedFetch(
    async page => Object.entries(await fetchDuplicateVideos(page, PAGE_SIZE)),
    async groupEntries => {
      const unseenEntries = groupEntries.filter(([groupId]) => !loadedGroupIds.current.has(groupId))
      unseenEntries.forEach(([groupId]) => loadedGroupIds.current.add(groupId))

      const newGroups: DuplicateGroupEntry[] = await Promise.all(
        unseenEntries.map(async ([groupId, duplicates]) => {
          const videos = await Promise.all(
            duplicates.map(duplicate => fetchVideoById(duplicate.videoId))
          )
          return { groupId, videos }
        })
      )

      if (newGroups.length > 0) {
        setGroups(prev => prev.concat(newGroups))
      }
    },
    { pageSize: PAGE_SIZE }
  )

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

      {groups.length === 0 && !isLoading && (
        <div className={styles.emptyState}>No duplicate videos found</div>
      )}

      <InfiniteScroll
        loadMore={loadMore}
        hasMore={hasMore}
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
