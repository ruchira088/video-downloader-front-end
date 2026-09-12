import { describe, expect, test, vi, afterEach } from "vitest"
import { act, renderHook } from "@testing-library/react"
import { usePlaylistPlayback } from "~/pages/authenticated/playlists/usePlaylistPlayback"
import { buildVideo } from "../fixtures"
import type { Video } from "~/models/Video"

const video = (id: string) => buildVideo({ id, videoMetadata: { id } })

const videos = [video("a"), video("b"), video("c")]

const ids = (list: Video[]) => list.map(v => v.videoMetadata.id)

/** Makes shuffleArray's Fisher–Yates walk deterministic: always swap with index 0. */
const pinShuffle = () => vi.spyOn(Math, "random").mockReturnValue(0)

const renderPlayback = (initial: Video[] = videos) =>
  renderHook(({ list }) => usePlaylistPlayback(list), { initialProps: { list: initial } })

describe("usePlaylistPlayback", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test("should start stopped at the top of the playlist order", () => {
    const { result } = renderPlayback()

    expect(result.current.isPlaying).toBe(false)
    expect(result.current.isShuffled).toBe(false)
    expect(result.current.currentIndex).toBe(0)
    expect(ids(result.current.displayedVideos)).toEqual(["a", "b", "c"])
    expect(result.current.currentlyPlayingVideoId.isEmpty()).toBe(true)
  })

  test("should play from the first video", () => {
    const { result } = renderPlayback()

    act(() => result.current.play())

    expect(result.current.isPlaying).toBe(true)
    expect(result.current.currentIndex).toBe(0)
    expect(result.current.currentlyPlayingVideoId.toNullable()).toBe("a")
  })

  test("should not start playing an empty playlist", () => {
    const { result } = renderPlayback([])

    act(() => result.current.play())

    expect(result.current.isPlaying).toBe(false)
  })

  test("should play a specific video by id and ignore unknown ids", () => {
    const { result } = renderPlayback()

    act(() => result.current.playVideo("b"))

    expect(result.current.isPlaying).toBe(true)
    expect(result.current.currentlyPlayingVideoId.toNullable()).toBe("b")

    act(() => result.current.playVideo("missing"))

    expect(result.current.currentlyPlayingVideoId.toNullable()).toBe("b")
  })

  test("should step forward and stop after the last video", () => {
    const { result } = renderPlayback()

    act(() => result.current.playVideo("b"))
    act(() => result.current.next())

    expect(result.current.currentIndex).toBe(2)
    expect(result.current.isPlaying).toBe(true)

    act(() => result.current.next())

    expect(result.current.isPlaying).toBe(false)
    expect(result.current.currentlyPlayingVideoId.isEmpty()).toBe(true)
  })

  test("should step backward and stay put at the first video", () => {
    const { result } = renderPlayback()

    act(() => result.current.playVideo("b"))
    act(() => result.current.previous())

    expect(result.current.currentIndex).toBe(0)

    act(() => result.current.previous())

    expect(result.current.currentIndex).toBe(0)
    expect(result.current.isPlaying).toBe(true)
  })

  test("should close the player", () => {
    const { result } = renderPlayback()

    act(() => result.current.play())
    act(() => result.current.close())

    expect(result.current.isPlaying).toBe(false)
  })

  test("should reorder the play queue when shuffled and restore it when unshuffled", () => {
    pinShuffle()
    const { result } = renderPlayback()

    act(() => result.current.toggleShuffle())

    expect(result.current.isShuffled).toBe(true)
    expect(ids(result.current.displayedVideos)).toEqual(["b", "c", "a"])

    act(() => result.current.toggleShuffle())

    expect(result.current.isShuffled).toBe(false)
    expect(ids(result.current.displayedVideos)).toEqual(["a", "b", "c"])
  })

  test("should follow the playing video into its shuffled position", () => {
    pinShuffle()
    const { result } = renderPlayback()

    act(() => result.current.playVideo("a"))
    act(() => result.current.toggleShuffle())

    expect(result.current.currentIndex).toBe(2)
    expect(result.current.currentlyPlayingVideoId.toNullable()).toBe("a")

    act(() => result.current.toggleShuffle())

    expect(result.current.currentIndex).toBe(0)
    expect(result.current.currentlyPlayingVideoId.toNullable()).toBe("a")
  })

  test("should reset to the top when shuffling while stopped", () => {
    pinShuffle()
    const { result } = renderPlayback()

    act(() => result.current.playVideo("c"))
    act(() => result.current.close())
    act(() => result.current.toggleShuffle())

    expect(result.current.currentIndex).toBe(0)
  })

  test("should drop a removed video from the shuffled queue", () => {
    pinShuffle()
    const { result } = renderPlayback()

    act(() => result.current.toggleShuffle())
    act(() => result.current.videoRemoved("c"))

    expect(ids(result.current.displayedVideos)).toEqual(["b", "a"])
  })

  test("should append an added video to the shuffled queue", () => {
    pinShuffle()
    const { result } = renderPlayback()

    act(() => result.current.toggleShuffle())
    act(() => result.current.videoAdded(video("d")))

    expect(ids(result.current.displayedVideos)).toEqual(["b", "c", "a", "d"])
  })

  test("should leave the queue to the playlist order when not shuffled", () => {
    const { result, rerender } = renderPlayback()

    act(() => result.current.videoRemoved("c"))
    act(() => result.current.videoAdded(video("d")))

    expect(ids(result.current.displayedVideos)).toEqual(["a", "b", "c"])

    rerender({ list: [video("a"), video("d")] })

    expect(ids(result.current.displayedVideos)).toEqual(["a", "d"])
  })
})
