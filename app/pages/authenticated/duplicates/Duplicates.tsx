import React, { useRef, useState } from "react"
import { Link } from "react-router"
import { Button } from "@mui/material"
import { deleteVideo, fetchDuplicateVideos, fetchVideoById } from "~/services/video/VideoService"
import { Video } from "~/models/Video"
import { None, Option, Some } from "~/types/Option"
import VideoCard from "~/components/video/video-card/VideoCard"
import Helmet from "~/components/helmet/Helmet"
import InfiniteScroll from "~/components/infinite-scroll/InfiniteScroll"
import { usePaginatedFetch } from "~/components/infinite-scroll/usePaginatedFetch"
import { useNotification } from "~/providers/NotificationProvider"

import styles from "./Duplicates.module.scss"

const PAGE_SIZE = 25

type DuplicateGroupEntry = {
  readonly groupId: string
  readonly videos: Video[]
}

const Duplicates = () => {
  const { notifyError } = useNotification()
  const [groups, setGroups] = useState<DuplicateGroupEntry[]>([])
  const loadedGroupIds = useRef(new Set<string>())

  // The duplicates endpoint returns ids only, so each video costs a request. Cache the in-flight
  // request (not just the result) so a video appearing in more than one group of the same page
  // is fetched once rather than once per group.
  const videoRequests = useRef(new Map<string, Promise<Option<Video>>>())

  const loadVideo = (videoId: string): Promise<Option<Video>> =>
    Option.fromNullable(videoRequests.current.get(videoId)).getOrElse(() => {
      const request: Promise<Option<Video>> = fetchVideoById(videoId)
        .then((video) => Some.of(video))
        .catch((error: unknown) => {
          console.error(`Failed to load duplicate video ${videoId}`, error)
          // Failures are not cached, so a later page or retry can fetch the video again.
          videoRequests.current.delete(videoId)
          return None.of<Video>()
        })

      videoRequests.current.set(videoId, request)

      return request
    })

  const { isLoading, hasMore, loadMore, hasError, retry } = usePaginatedFetch(
    async page => Object.entries(await fetchDuplicateVideos(page, PAGE_SIZE)),
    async groupEntries => {
      const unseenEntries = groupEntries.filter(([groupId]) => !loadedGroupIds.current.has(groupId))
      unseenEntries.forEach(([groupId]) => loadedGroupIds.current.add(groupId))

      const newGroups: DuplicateGroupEntry[] = await Promise.all(
        unseenEntries.map(async ([groupId, duplicates]) => {
          const videos = await Promise.all(
            duplicates.map(duplicate => loadVideo(duplicate.videoId))
          )
          return { groupId, videos: videos.flatMap(video => video.toList()) }
        })
      )

      // A group needs at least two members to be a duplicate; one that lost videos to failed
      // fetches is not worth showing. Previously a single bad id rejected the whole page.
      const populatedGroups = newGroups.filter(group => group.videos.length > 1)

      if (populatedGroups.length > 0) {
        setGroups(prev => prev.concat(populatedGroups))
      }
    },
    { pageSize: PAGE_SIZE }
  )

  const onDeleteVideo = async (videoId: string) => {
    try {
      await deleteVideo(videoId, true)
    } catch (error) {
      notifyError("Failed to delete the video", error)
      return
    }

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
        isLoading={isLoading}
        hasError={hasError}
        onRetry={retry}
        endMessage={groups.length > 0 ? "No more duplicates" : undefined}
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
