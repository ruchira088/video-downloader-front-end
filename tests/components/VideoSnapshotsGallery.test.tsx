import { describe, expect, test, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import VideoSnapshotsGallery from "~/components/video/video-snapshots/VideoSnapshotsGallery"
import { createMemoryRouter, RouterProvider } from "react-router"
import React from "react"
import type { Snapshot } from "~/models/Snapshot"
import { buildSnapshot, durationJson } from "../fixtures"
import { withApplicationConfiguration } from "../helpers"

vi.mock("~/services/asset/AssetService", () => ({
  imageUrl: vi.fn((resource, safeMode) =>
    safeMode ? "https://safe.example.com/image.jpg" : `https://example.com/${resource.id}.jpg`
  ),
}))

const renderWithRouter = (snapshots: Snapshot[], safeMode = false) => {
  const router = createMemoryRouter([
    {
      path: "/",
      element: withApplicationConfiguration(<VideoSnapshotsGallery snapshots={snapshots} />, { safeMode }),
    },
  ])

  return render(<RouterProvider router={router} />)
}

describe("VideoSnapshotsGallery", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("should render empty gallery when no snapshots", () => {
    renderWithRouter([])

    expect(screen.queryByAltText("video snapshot")).not.toBeInTheDocument()
  })

  test("should render snapshots", () => {
    renderWithRouter([
      buildSnapshot({ id: "snap-1", videoTimestamp: durationJson(30) }),
      buildSnapshot({ id: "snap-2", videoTimestamp: durationJson(60) }),
    ])

    const images = screen.getAllByAltText("video snapshot")
    expect(images).toHaveLength(2)
  })

  test("should sort snapshots by timestamp", () => {
    renderWithRouter([
      buildSnapshot({ id: "snap-2", videoTimestamp: durationJson(120) }),
      buildSnapshot({ id: "snap-1", videoTimestamp: durationJson(30) }),
      buildSnapshot({ id: "snap-3", videoTimestamp: durationJson(60) }),
    ])

    const timestamps = screen.getAllByText(/\d+:\d+/)
    expect(timestamps[0]).toHaveTextContent("0:30")
    expect(timestamps[1]).toHaveTextContent("1:00")
    expect(timestamps[2]).toHaveTextContent("2:00")
  })

  test("should link to video with timestamp", () => {
    renderWithRouter([buildSnapshot({ id: "snap-1", videoTimestamp: durationJson(90) })])

    const link = screen.getByRole("link")
    expect(link).toHaveAttribute("href", "/video/video-123?timestamp=90")
  })

  test("should display formatted timestamp", () => {
    renderWithRouter([
      buildSnapshot({ id: "snap-1", videoTimestamp: durationJson(65) }),
    ])

    expect(screen.getByText("1:05")).toBeInTheDocument()
  })

  test("should use safe mode image URL when safe mode is enabled", async () => {
    renderWithRouter([buildSnapshot({ id: "snap-1", videoTimestamp: durationJson(30) })], true)

    expect(screen.getByAltText("video snapshot")).toHaveAttribute("src", "https://safe.example.com/image.jpg")
  })
})
