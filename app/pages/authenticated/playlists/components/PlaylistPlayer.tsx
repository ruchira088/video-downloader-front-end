import React, { type FC, useRef, useEffect } from "react"
import { IconButton } from "@mui/material"
import Close from "@mui/icons-material/Close"
import SkipPrevious from "@mui/icons-material/SkipPrevious"
import SkipNext from "@mui/icons-material/SkipNext"
import Shuffle from "@mui/icons-material/Shuffle"
import { Video } from "~/models/Video"
import { imageUrl, videoUrl } from "~/services/asset/AssetService"
import { useApplicationConfiguration } from "~/providers/ApplicationConfigurationProvider"
import { translate } from "~/services/sanitize/SanitizationService"
import { shortHumanReadableDuration } from "~/utils/Formatter"

import styles from "./PlaylistPlayer.module.scss"

type PlaylistPlayerProps = {
  readonly videos: Video[]
  readonly currentIndex: number
  readonly onNext: () => void
  readonly onPrevious: () => void
  readonly onClose: () => void
  readonly onIndexChange: (index: number) => void
  readonly isShuffled: boolean
  readonly onShuffle: () => void
}

const PlaylistPlayer: FC<PlaylistPlayerProps> = ({
  videos,
  currentIndex,
  onNext,
  onPrevious,
  onClose,
  onIndexChange,
  isShuffled,
  onShuffle
}) => {
  const { safeMode } = useApplicationConfiguration()
  const videoRef = useRef<HTMLVideoElement>(null)
  const currentVideo = videos[currentIndex]

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load()
      videoRef.current.play().catch(() => {})
    }
  }, [currentIndex])

  if (!currentVideo) return null

  const title = translate(currentVideo.videoMetadata.title, safeMode)
  const thumbnailUrl = imageUrl(currentVideo.videoMetadata.thumbnail, safeMode)
  const videoSource = videoUrl(currentVideo.fileResource)

  const upNextVideos = videos.slice(currentIndex + 1, currentIndex + 4)

  const handleVideoEnded = () => {
    onNext()
  }

  return (
    <div className={styles.playerOverlay}>
      <div className={styles.playerContainer}>
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <span className={styles.position}>
              {currentIndex + 1} / {videos.length}
            </span>
            <h3 className={styles.title}>{title}</h3>
          </div>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </div>

        <div className={styles.videoSection}>
          <video
            ref={videoRef}
            controls
            autoPlay
            poster={thumbnailUrl}
            className={styles.video}
            onEnded={handleVideoEnded}
          >
            <source src={videoSource} />
          </video>
        </div>

        <div className={styles.controls}>
          <IconButton
            onClick={onPrevious}
            disabled={currentIndex === 0}
            size="large"
          >
            <SkipPrevious fontSize="large" />
          </IconButton>
          <IconButton
            onClick={onShuffle}
            size="large"
            color={isShuffled ? "primary" : "default"}
            className={isShuffled ? styles.shuffleActive : ""}
          >
            <Shuffle fontSize="large" />
          </IconButton>
          <IconButton
            onClick={onNext}
            disabled={currentIndex >= videos.length - 1}
            size="large"
          >
            <SkipNext fontSize="large" />
          </IconButton>
        </div>

        {upNextVideos.length > 0 && (
          <div className={styles.upNext}>
            <h4 className={styles.upNextTitle}>Up Next</h4>
            <div className={styles.upNextList}>
              {upNextVideos.map((video, idx) => {
                const videoTitle = translate(video.videoMetadata.title, safeMode)
                const videoThumbnail = imageUrl(video.videoMetadata.thumbnail, safeMode)
                const actualIndex = currentIndex + 1 + idx

                return (
                  <div
                    key={video.videoMetadata.id}
                    className={styles.upNextItem}
                    onClick={() => onIndexChange(actualIndex)}
                  >
                    <div className={styles.upNextThumbnail}>
                      <img src={videoThumbnail} alt={videoTitle} />
                      <span className={styles.upNextDuration}>
                        {shortHumanReadableDuration(video.videoMetadata.duration)}
                      </span>
                    </div>
                    <div className={styles.upNextInfo}>
                      <span className={styles.upNextItemTitle}>{videoTitle}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PlaylistPlayer
