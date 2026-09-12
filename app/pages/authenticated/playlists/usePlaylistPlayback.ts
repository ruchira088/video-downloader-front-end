import { useState } from "react"
import { Video } from "~/models/Video"
import { None, Option } from "~/types/Option"

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

const indexOfVideo = (videos: Video[], videoId: string) =>
  videos.findIndex(video => video.videoMetadata.id === videoId)

/**
 * The playlist player's state: what is playing, where in the queue it is, and whether the
 * queue is the playlist order or a shuffle of it.
 *
 * `videos` is the playlist order. The queue the player walks is `displayedVideos`, which is
 * only the same list when unshuffled — anything tying a playlist card to the player must go
 * via video id, which is why `currentlyPlayingVideoId` is exposed rather than an index.
 */
export const usePlaylistPlayback = (videos: Video[]) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isShuffled, setIsShuffled] = useState(false)
  const [shuffledVideos, setShuffledVideos] = useState<Video[]>([])

  const displayedVideos = isShuffled ? shuffledVideos : videos

  const currentlyPlayingVideoId: Option<string> = isPlaying
    ? Option.fromNullable(displayedVideos[currentIndex]).map(video => video.videoMetadata.id)
    : None.of()

  const playFromIndex = (index: number) => {
    setCurrentIndex(index)
    setIsPlaying(true)
  }

  const play = () => {
    if (displayedVideos.length > 0) {
      playFromIndex(0)
    }
  }

  const playVideo = (videoId: string) => {
    const index = indexOfVideo(displayedVideos, videoId)

    if (index !== -1) {
      playFromIndex(index)
    }
  }

  const next = () => {
    if (currentIndex < displayedVideos.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      setIsPlaying(false)
    }
  }

  const previous = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }

  const close = () => setIsPlaying(false)

  const toggleShuffle = () => {
    const nextPlaybackOrder = isShuffled ? videos : shuffleArray(videos)

    setIsShuffled(!isShuffled)
    setShuffledVideos(isShuffled ? [] : nextPlaybackOrder)

    // Toggling shuffle re-indexes the playback order, so follow the video that is
    // playing into its new position instead of jumping back to the top.
    setCurrentIndex(
      currentlyPlayingVideoId
        .map(videoId => indexOfVideo(nextPlaybackOrder, videoId))
        .filter(index => index !== -1)
        .getOrElse(() => 0)
    )
  }

  // The shuffled queue is a snapshot, so playlist membership changes have to be mirrored
  // into it by hand; the unshuffled queue is `videos` itself and needs nothing.
  const videoRemoved = (videoId: string) => {
    if (isShuffled) {
      setShuffledVideos(prev => prev.filter(video => video.videoMetadata.id !== videoId))
    }
  }

  const videoAdded = (video: Video) => {
    if (isShuffled) {
      setShuffledVideos(prev => [...prev, video])
    }
  }

  return {
    isPlaying,
    currentIndex,
    isShuffled,
    displayedVideos,
    currentlyPlayingVideoId,
    play,
    playVideo,
    next,
    previous,
    close,
    toggleShuffle,
    setCurrentIndex,
    videoRemoved,
    videoAdded
  }
}
