import { type RefObject, useEffect } from "react"
import { None, Option, Some } from "~/types/Option"
import { reportError } from "~/services/ErrorReporting"

export const PLAYBACK_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const

export type PlayerShortcut = {
  readonly keys: string
  readonly description: string
}

// Shown to the viewer; keep in step with `actionFor` below.
export const PLAYER_SHORTCUTS: ReadonlyArray<PlayerShortcut> = [
  { keys: "Space / K", description: "Play or pause" },
  { keys: "← / →", description: "Back or forward 5 seconds" },
  { keys: "J / L", description: "Back or forward 10 seconds" },
  { keys: "< / >", description: "Slower or faster" },
  { keys: "M", description: "Mute or unmute" },
  { keys: "F", description: "Full screen" },
]

// Keys pressed here belong to that element: a focused button already answers Space, the native
// player controls already answer Space and the arrows, and a dialog's keys must not reach the video.
const OWNS_ITS_KEYS =
  "input, textarea, select, button, a, video, [contenteditable=''], [contenteditable='true'], [role='dialog'], [role='slider']"

const seekBy = (video: HTMLVideoElement, seconds: number) => {
  const end = Number.isFinite(video.duration) ? video.duration : Number.POSITIVE_INFINITY
  video.currentTime = Math.min(Math.max(video.currentTime + seconds, 0), end)
}

const changeRate = (video: HTMLVideoElement, step: 1 | -1) => {
  const index = PLAYBACK_RATES.findIndex(rate => rate >= video.playbackRate)
  const current = index === -1 ? PLAYBACK_RATES.length - 1 : index
  const next = Math.min(Math.max(current + step, 0), PLAYBACK_RATES.length - 1)
  video.playbackRate = PLAYBACK_RATES[next]
}

const toggleFullscreen = (video: HTMLVideoElement): Promise<void> =>
  document.fullscreenElement == null ? video.requestFullscreen() : document.exitFullscreen()

type PlayerAction = (video: HTMLVideoElement) => unknown

const actionFor = (key: string): Option<PlayerAction> => {
  switch (key) {
    case " ":
    case "k":
      return Some.of<PlayerAction>((video) => video.paused ? video.play() : video.pause())
    case "ArrowLeft":
      return Some.of<PlayerAction>((video) => seekBy(video, -5))
    case "ArrowRight":
      return Some.of<PlayerAction>((video) => seekBy(video, 5))
    case "j":
      return Some.of<PlayerAction>((video) => seekBy(video, -10))
    case "l":
      return Some.of<PlayerAction>((video) => seekBy(video, 10))
    case "<":
      return Some.of<PlayerAction>((video) => changeRate(video, -1))
    case ">":
      return Some.of<PlayerAction>((video) => changeRate(video, 1))
    case "m":
      return Some.of<PlayerAction>((video) => { video.muted = !video.muted })
    case "f":
      return Some.of<PlayerAction>(toggleFullscreen)
    default:
      return None.of()
  }
}

/**
 * YouTube-style keyboard controls for `videoRef`, active anywhere on the page except where the
 * focused element handles the key itself.
 */
export const usePlayerShortcuts = (videoRef: RefObject<HTMLVideoElement | null>) => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) {
        return
      }

      if (event.target instanceof Element && event.target.closest(OWNS_ITS_KEYS) != null) {
        return
      }

      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key

      void actionFor(key).forEach(action =>
        Option.fromNullable(videoRef.current).forEach(video => {
          // Space would otherwise scroll the page as well.
          event.preventDefault()
          const result = action(video)

          if (result instanceof Promise) {
            // play() rejects when autoplay is blocked; fullscreen when the browser refuses it.
            result.catch((error: unknown) => reportError(`Player shortcut "${event.key}" failed`, error))
          }
        })
      )
    }

    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [videoRef])
}
