import { describe, expect, test, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { DateTime, Duration } from "luxon"
import { FileResourceType } from "~/models/FileResource"
import React from "react"

vi.mock("~/services/video/VideoService", () => ({
  fetchVideoById: vi.fn(),
  fetchVideoSnapshotsByVideoId: vi.fn(),
}))

// VideoWatch is a heavy child (player, dialogs, sanitization); stub it and surface
// the props VideoPage passes so we can assert on them.
vi.mock("~/pages/authenticated/videos/video-page/watch/VideoWatch", () => ({
  default: (props: { video: { videoMetadata: { title: string } }; timestamp: Duration; snapshots: unknown[] }) => (
    <div data-testid="video-watch">
      <span data-testid="title">{props.video.videoMetadata.title}</span>
      <span data-testid="timestamp-seconds">{props.timestamp.as("seconds")}</span>
      <span data-testid="snapshot-count">{props.snapshots.length}</span>
    </div>
  ),
}))

import { fetchVideoById, fetchVideoSnapshotsByVideoId } from "~/services/video/VideoService"
import VideoPage from "~/pages/authenticated/videos/video-page/VideoPage"

const mockFetchVideoById = vi.mocked(fetchVideoById)
const mockFetchVideoSnapshots = vi.mocked(fetchVideoSnapshotsByVideoId)

const buildVideo = (id: string, title: string) => ({
  videoMetadata: {
    url: `https://example.com/video/${id}`,
    id,
    videoSite: "youtube",
    title,
    duration: Duration.fromObject({ minutes: 5 }),
    size: 1024,
    thumbnail: {
      id: `thumb-${id}`,
      type: FileResourceType.Thumbnail as const,
      createdAt: DateTime.now(),
      path: "/path/to/thumb",
      mediaType: "image/jpeg",
      size: 1024,
    },
  },
  fileResource: {
    id: `file-${id}`,
    type: FileResourceType.Video as const,
    createdAt: DateTime.now(),
    path: "/path/to/video",
    mediaType: "video/mp4",
    size: 1024,
  },
  createdAt: DateTime.now(),
  watchTime: Duration.fromObject({ minutes: 2 }),
})

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
    mockFetchVideoById.mockResolvedValue(buildVideo("video-123", "My Video"))
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

  test("parses the timestamp query parameter", async () => {
    mockFetchVideoById.mockResolvedValue(buildVideo("video-123", "My Video"))

    renderVideoPage("video-123", "/video/video-123?timestamp=90")

    await waitFor(() => {
      expect(screen.getByTestId("timestamp-seconds")).toHaveTextContent("90")
    })
  })

  test("defaults the timestamp to 0 when the query parameter is absent", async () => {
    mockFetchVideoById.mockResolvedValue(buildVideo("video-123", "My Video"))

    renderVideoPage("video-123", "/video/video-123")

    await waitFor(() => {
      expect(screen.getByTestId("timestamp-seconds")).toHaveTextContent("0")
    })
  })
})
