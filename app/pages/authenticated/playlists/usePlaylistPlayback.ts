import { useEffect, useRef, useState } from "react"
import { Video } from "~/models/Video"
import { None, Option, Some } from "~/types/Option"

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
 *
 * The playing video is tracked by id, not by queue position: reordering the playlist or
 * removing an earlier video shifts positions, and the player must stay on the same video.
 */
export const usePlaylistPlayback = (videos: Video[]) => {
  const [playingVideoId, setPlayingVideoId] = useState<Option<string>>(None.of())
  const [isShuffled, setIsShuffled] = useState(false)
  const [shuffledVideos, setShuffledVideos] = useState<Video[]>([])

  const displayedVideos = isShuffled ? shuffledVideos : videos

  // None when stopped, or when the playing video is no longer in the queue.
  const playingIndex: Option<number> = playingVideoId
    .map(videoId => indexOfVideo(displayedVideos, videoId))
    .filter(index => index !== -1)

  const isPlaying = !playingIndex.isEmpty()
  const currentIndex = playingIndex.getOrElse(() => 0)
  const currentlyPlayingVideoId: Option<string> = playingIndex.flatMap(() => playingVideoId)

  // videoAdded/videoRemoved run after a queued request resolves, through the callbacks of the
  // render in which the user clicked, so they read the queue as it is now from here instead.
  const latest = useRef({ isShuffled, displayedVideos, playingVideoId })
  useEffect(() => {
    latest.current = { isShuffled, displayedVideos, playingVideoId }
  })

  const playFromIndex = (index: number) =>
    setPlayingVideoId(Option.fromNullable(displayedVideos[index]).map(video => video.videoMetadata.id))

  const play = () => playFromIndex(0)

  const playVideo = (videoId: string) => {
    if (indexOfVideo(displayedVideos, videoId) !== -1) {
      setPlayingVideoId(Some.of(videoId))
    }
  }

  // Past the last video there is nothing at currentIndex + 1, so playback stops.
  const next = () => playFromIndex(currentIndex + 1)

  const previous = () => {
    if (currentIndex > 0) {
      playFromIndex(currentIndex - 1)
    }
  }

  const close = () => setPlayingVideoId(None.of())

  const toggleShuffle = () => {
    setIsShuffled(!isShuffled)
    setShuffledVideos(isShuffled ? [] : shuffleArray(videos))
  }

  // The shuffled queue is a snapshot, so playlist membership changes have to be mirrored
  // into it by hand; the unshuffled queue is `videos` itself and needs nothing.
  const videoRemoved = (videoId: string) => {
    const { isShuffled, displayedVideos, playingVideoId } = latest.current

    if (isShuffled) {
      setShuffledVideos(prev => prev.filter(video => video.videoMetadata.id !== videoId))
    }

    // Removing the playing video moves on to the one after it, or stops at the end of the queue.
    if (playingVideoId.toNullable() === videoId) {
      setPlayingVideoId(
        Option.fromNullable(displayedVideos[indexOfVideo(displayedVideos, videoId) + 1])
          .map(video => video.videoMetadata.id)
      )
    }
  }

  const videoAdded = (video: Video) => {
    if (latest.current.isShuffled) {
      setShuffledVideos(prev =>
        indexOfVideo(prev, video.videoMetadata.id) === -1 ? [...prev, video] : prev
      )
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
    setCurrentIndex: playFromIndex,
    videoRemoved,
    videoAdded
  }
}
