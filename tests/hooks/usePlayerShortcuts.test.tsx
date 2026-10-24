import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import { fireEvent, render } from "@testing-library/react"
import React, { useRef } from "react"
import { usePlayerShortcuts } from "~/pages/authenticated/videos/video-page/watch/usePlayerShortcuts"

type FakeVideo = {
  paused: boolean
  currentTime: number
  duration: number
  playbackRate: number
  muted: boolean
  play: ReturnType<typeof vi.fn>
  pause: ReturnType<typeof vi.fn>
  requestFullscreen: ReturnType<typeof vi.fn>
}

// jsdom has no media playback, so give the element the state and methods the shortcuts drive.
const fakeMedia = (video: HTMLVideoElement): FakeVideo => {
  const state: FakeVideo = {
    paused: true,
    currentTime: 30,
    duration: 100,
    playbackRate: 1,
    muted: false,
    play: vi.fn(() => Promise.resolve()),
    pause: vi.fn(),
    requestFullscreen: vi.fn(() => Promise.resolve()),
  }

  for (const key of Object.keys(state) as Array<keyof FakeVideo>) {
    Object.defineProperty(video, key, {
      configurable: true,
      get: () => state[key],
      set: (value) => { (state as Record<string, unknown>)[key] = value },
    })
  }

  return state
}

const Player = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  usePlayerShortcuts(videoRef)

  return (
    <div>
      <video ref={videoRef} data-testid="video" />
      <input aria-label="Title" />
      <button>Delete</button>
      <div role="dialog"><span data-testid="in-dialog">Dialog</span></div>
    </div>
  )
}

const renderPlayer = () => {
  const view = render(<Player />)
  const media = fakeMedia(view.getByTestId("video") as HTMLVideoElement)
  return { ...view, media }
}

const press = (key: string, options: KeyboardEventInit = {}, target: Element = document.body) =>
  fireEvent.keyDown(target, { key, ...options })

describe("usePlayerShortcuts", () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
  })

  afterEach(() => {
    consoleWarnSpy.mockRestore()
  })

  test.each([" ", "k", "K"])("should play a paused video on %j", (key) => {
    const { media } = renderPlayer()

    press(key)

    expect(media.play).toHaveBeenCalledTimes(1)
  })

  test("should pause a playing video", () => {
    const { media } = renderPlayer()
    media.paused = false

    press("k")

    expect(media.pause).toHaveBeenCalledTimes(1)
  })

  test("should stop Space from also scrolling the page", () => {
    renderPlayer()

    const notCancelled = fireEvent.keyDown(document.body, { key: " " })

    expect(notCancelled).toBe(false)
  })

  test.each([
    ["ArrowLeft", 25],
    ["ArrowRight", 35],
    ["j", 20],
    ["l", 40],
  ])("should seek on %s", (key, expected) => {
    const { media } = renderPlayer()

    press(key)

    expect(media.currentTime).toBe(expected)
  })

  test("should not seek before the start or past the end", () => {
    const { media } = renderPlayer()

    media.currentTime = 3
    press("j")
    expect(media.currentTime).toBe(0)

    media.currentTime = 95
    press("l")
    expect(media.currentTime).toBe(100)
  })

  test("should seek forward freely while the duration is unknown", () => {
    const { media } = renderPlayer()
    media.duration = Number.NaN

    press("l")

    expect(media.currentTime).toBe(40)
  })

  test("should step the playback rate within its limits", () => {
    const { media } = renderPlayer()

    press(">")
    expect(media.playbackRate).toBe(1.25)

    media.playbackRate = 2
    press(">")
    expect(media.playbackRate).toBe(2)

    media.playbackRate = 0.25
    press("<")
    expect(media.playbackRate).toBe(0.25)

    // A rate set elsewhere (e.g. the native menu) snaps to the nearest step from there.
    media.playbackRate = 1.1
    press("<")
    expect(media.playbackRate).toBe(1)

    media.playbackRate = 3
    press("<")
    expect(media.playbackRate).toBe(1.75)
  })

  test("should toggle mute", () => {
    const { media } = renderPlayer()

    press("m")
    expect(media.muted).toBe(true)

    press("m")
    expect(media.muted).toBe(false)
  })

  test("should enter and leave full screen", () => {
    const { media } = renderPlayer()
    const exitFullscreen = vi.fn(() => Promise.resolve())
    Object.defineProperty(document, "exitFullscreen", { configurable: true, value: exitFullscreen })

    press("f")
    expect(media.requestFullscreen).toHaveBeenCalledTimes(1)

    Object.defineProperty(document, "fullscreenElement", { configurable: true, value: document.body })
    press("f")
    expect(exitFullscreen).toHaveBeenCalledTimes(1)

    Object.defineProperty(document, "fullscreenElement", { configurable: true, value: null })
  })

  test("should report a shortcut whose action the browser refuses", async () => {
    const { media } = renderPlayer()
    const error = new DOMException("Autoplay blocked", "NotAllowedError")
    media.play.mockReturnValue(Promise.reject(error))

    press("k")

    await vi.waitFor(() => {
      expect(consoleWarnSpy).toHaveBeenCalledWith('Player shortcut "k" failed', error)
    })
  })

  test("should leave keys aimed at elements that handle them", () => {
    const { media, getByLabelText, getByRole, getByTestId } = renderPlayer()

    press("k", {}, getByLabelText("Title"))
    press(" ", {}, getByRole("button", { name: "Delete" }))
    press(" ", {}, getByTestId("video"))
    press("k", {}, getByTestId("in-dialog"))

    expect(media.play).not.toHaveBeenCalled()
  })

  test("should leave modified keys and other keys alone", () => {
    const { media } = renderPlayer()

    press("k", { ctrlKey: true })
    press("l", { metaKey: true })
    press("f", { altKey: true })
    press("x")

    expect(media.play).not.toHaveBeenCalled()
    expect(media.currentTime).toBe(30)
    expect(media.requestFullscreen).not.toHaveBeenCalled()
  })

  test("should ignore a key another handler already claimed", () => {
    const { media } = renderPlayer()
    const claim = (event: KeyboardEvent) => event.preventDefault()
    document.addEventListener("keydown", claim, { capture: true })

    press("k")

    document.removeEventListener("keydown", claim, { capture: true })
    expect(media.play).not.toHaveBeenCalled()
  })

  test("should stop listening once unmounted", () => {
    const { media, unmount } = renderPlayer()

    unmount()
    press("k")

    expect(media.play).not.toHaveBeenCalled()
  })
})
