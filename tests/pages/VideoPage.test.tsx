import { describe, expect, test, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router"
import { Duration } from "luxon"
import React from "react"
import { buildVideo } from "../fixtures"
import type { Video } from "~/models/Video"

vi.mock("~/services/video/VideoService", () => ({
  fetchVideoById: vi.fn(),
  fetchVideoSnapshotsByVideoId: vi.fn(),
}))

// VideoWatch is a heavy child (player, dialogs, sanitization); stub it and surface
// the props VideoPage passes so we can assert on them.
vi.mock("~/pages/authenticated/videos/video-page/watch/VideoWatch", () => ({
  default: (props: {
    video: { videoMetadata: { title: string } }
    timestamp: Duration
    snapshots: unknown[]
    updateVideo: (video: unknown) => void
  }) => (
    <div data-testid="video-watch">
      <span data-testid="title">{props.video.videoMetadata.title}</span>
      <span data-testid="timestamp-seconds">{props.timestamp.as("seconds")}</span>
      <span data-testid="snapshot-count">{props.snapshots.length}</span>
      <button
        onClick={() =>
          props.updateVideo({
            ...props.video,
            videoMetadata: { ...props.video.videoMetadata, title: "Renamed Video" },
          })
        }
      >
        Rename
      </button>
    </div>
  ),
}))

import { fetchVideoById, fetchVideoSnapshotsByVideoId } from "~/services/video/VideoService"
import VideoPage from "~/pages/authenticated/videos/video-page/VideoPage"

const mockFetchVideoById = vi.mocked(fetchVideoById)
const mockFetchVideoSnapshots = vi.mocked(fetchVideoSnapshotsByVideoId)

// VideoPage reads its videoId from `props.params` (a route module prop), so pass it directly.
const renderVideoPage = (videoId: string, initialEntry: string) =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <VideoPage {...({ params: { videoId } } as any)} />
    </MemoryRouter>
  )

describe("VideoPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchVideoSnapshots.mockResolvedValue([])
  })

  test("shows the loading indicator until the video resolves", async () => {
    mockFetchVideoById.mockReturnValue(new Promise(() => {})) // never resolves
    mockFetchVideoSnapshots.mockReturnValue(new Promise(() => {}))

    renderVideoPage("video-123", "/video/video-123")

    expect(screen.getByRole("progressbar")).toBeInTheDocument()
    expect(screen.queryByTestId("video-watch")).not.toBeInTheDocument()
  })

  test("fetches the video and snapshots, then renders VideoWatch", async () => {
    mockFetchVideoById.mockResolvedValue(buildVideo({ id: "video-123", title: "My Video" }))
    mockFetchVideoSnapshots.mockResolvedValue([{} as never, {} as never])

    renderVideoPage("video-123", "/video/video-123")

    await waitFor(() => {
      expect(screen.getByTestId("video-watch")).toBeInTheDocument()
    })

    expect(mockFetchVideoById).toHaveBeenCalledWith("video-123")
    expect(mockFetchVideoSnapshots).toHaveBeenCalledWith("video-123")
    expect(screen.getByTestId("title")).toHaveTextContent("My Video")
    expect(screen.getByTestId("snapshot-count")).toHaveTextContent("2")
  })

  test("shows an error message instead of the spinner when the video fetch fails", async () => {
    mockFetchVideoById.mockRejectedValue(new Error("not found"))

    renderVideoPage("missing-video", "/video/missing-video")

    await waitFor(() => {
      expect(screen.getByText("Unable to load video")).toBeInTheDocument()
    })

    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument()
    expect(screen.queryByTestId("video-watch")).not.toBeInTheDocument()
  })

  test("still renders the video when only the snapshots fetch fails", async () => {
    mockFetchVideoById.mockResolvedValue(buildVideo({ id: "video-123", title: "My Video" }))
    mockFetchVideoSnapshots.mockRejectedValue(new Error("snapshots failed"))

    renderVideoPage("video-123", "/video/video-123")

    await waitFor(() => {
      expect(screen.getByTestId("video-watch")).toBeInTheDocument()
    })

    // Snapshots are supplementary, so their failure must not take down a video that loaded.
    expect(screen.getByTestId("title")).toHaveTextContent("My Video")
    expect(screen.getByTestId("snapshot-count")).toHaveTextContent("0")
    expect(screen.queryByText("Unable to load video")).not.toBeInTheDocument()
  })

  test("resets and shows fresh data when the videoId changes", async () => {
    mockFetchVideoById.mockResolvedValue(buildVideo({ id: "video-a", title: "Video A" }))

    const { rerender } = renderVideoPage("video-a", "/video/video-a")

    await waitFor(() => {
      expect(screen.getByTestId("title")).toHaveTextContent("Video A")
    })

    // Navigate to video B while its fetch is still pending: the page must drop
    // video A and show the loading indicator again.
    let resolveVideoB: (video: Video) => void
    mockFetchVideoById.mockReturnValue(
      new Promise((resolve) => {
        resolveVideoB = resolve
      })
    )

    rerender(
      <MemoryRouter initialEntries={["/video/video-b"]}>
        <VideoPage {...({ params: { videoId: "video-b" } } as any)} />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.queryByTestId("video-watch")).not.toBeInTheDocument()
    })
    expect(screen.getByRole("progressbar")).toBeInTheDocument()

    resolveVideoB!(buildVideo({ id: "video-b", title: "Video B" }))

    await waitFor(() => {
      expect(screen.getByTestId("title")).toHaveTextContent("Video B")
    })
    expect(mockFetchVideoById).toHaveBeenLastCalledWith("video-b")
    expect(mockFetchVideoSnapshots).toHaveBeenLastCalledWith("video-b")
  })

  test("parses the timestamp query parameter", async () => {
    mockFetchVideoById.mockResolvedValue(buildVideo({ id: "video-123", title: "My Video" }))

    renderVideoPage("video-123", "/video/video-123?timestamp=90")

    await waitFor(() => {
      expect(screen.getByTestId("timestamp-seconds")).toHaveTextContent("90")
    })
  })

  test("defaults the timestamp to 0 when the query parameter is absent", async () => {
    mockFetchVideoById.mockResolvedValue(buildVideo({ id: "video-123", title: "My Video" }))

    renderVideoPage("video-123", "/video/video-123")

    await waitFor(() => {
      expect(screen.getByTestId("timestamp-seconds")).toHaveTextContent("0")
    })
  })
  test("renders an updated video from the child without refetching it", async () => {
    // VideoWatch edits the title in place, so the page has to adopt the video it hands back
    // rather than waiting for a fresh fetch.
    const user = userEvent.setup()
    mockFetchVideoById.mockResolvedValue(buildVideo({ id: "video-123", title: "My Video" }))

    renderVideoPage("video-123", "/video/video-123")

    await waitFor(() => {
      expect(screen.getByTestId("title")).toHaveTextContent("My Video")
    })

    await user.click(screen.getByRole("button", { name: "Rename" }))

    expect(screen.getByTestId("title")).toHaveTextContent("Renamed Video")
    expect(mockFetchVideoById).toHaveBeenCalledTimes(1)
  })
})
