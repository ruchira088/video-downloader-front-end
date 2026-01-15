import { describe, expect, test, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import VideoSitesSelector from "~/pages/authenticated/videos/components/VideoSitesSelector"
import React from "react"

vi.mock("~/services/video/VideoService", () => ({
  videoServiceSummary: vi.fn().mockResolvedValue({
    sites: ["youtube", "vimeo", "dailymotion"],
    count: 100,
  }),
}))

describe("VideoSitesSelector", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("should render with label", async () => {
    render(<VideoSitesSelector videoSites={[]} onChange={vi.fn()} />)

    expect(screen.getByLabelText("Sites")).toBeInTheDocument()
  })

  test("should fetch available video sites on mount", async () => {
    const { videoServiceSummary } = await import("~/services/video/VideoService")

    render(<VideoSitesSelector videoSites={[]} onChange={vi.fn()} />)

    await waitFor(() => {
      expect(videoServiceSummary).toHaveBeenCalled()
    })
  })

  test("should display selected sites as chips", async () => {
    render(<VideoSitesSelector videoSites={["youtube", "vimeo"]} onChange={vi.fn()} />)

    expect(screen.getByText("youtube")).toBeInTheDocument()
    expect(screen.getByText("vimeo")).toBeInTheDocument()
  })

  test("should show available sites in dropdown", async () => {
    render(<VideoSitesSelector videoSites={[]} onChange={vi.fn()} />)

    await waitFor(() => {
      fireEvent.mouseDown(screen.getByRole("combobox"))
    })

    await waitFor(() => {
      expect(screen.getByText("youtube")).toBeInTheDocument()
      expect(screen.getByText("vimeo")).toBeInTheDocument()
      expect(screen.getByText("dailymotion")).toBeInTheDocument()
    })
  })

  test("should call onChange when site is selected", async () => {
    const onChange = vi.fn()
    render(<VideoSitesSelector videoSites={[]} onChange={onChange} />)

    await waitFor(() => {
      fireEvent.mouseDown(screen.getByRole("combobox"))
    })

    await waitFor(() => {
      const youtubeOption = screen.getByText("youtube")
      fireEvent.click(youtubeOption)
    })

    expect(onChange).toHaveBeenCalled()
  })

  test("should apply custom className", () => {
    const { container } = render(
      <VideoSitesSelector videoSites={[]} onChange={vi.fn()} className="custom-class" />
    )

    expect(container.querySelector(".custom-class")).toBeInTheDocument()
  })

  test("should check selected sites in dropdown", async () => {
    render(<VideoSitesSelector videoSites={["youtube"]} onChange={vi.fn()} />)

    await waitFor(() => {
      fireEvent.mouseDown(screen.getByRole("combobox"))
    })

    await waitFor(() => {
      const checkboxes = screen.getAllByRole("checkbox")
      const youtubeCheckbox = checkboxes.find(cb => cb.closest(".MuiMenuItem-root")?.textContent?.includes("youtube"))
      expect(youtubeCheckbox).toBeChecked()
    })
  })
})
