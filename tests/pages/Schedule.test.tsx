import { describe, expect, test, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import Schedule from "~/pages/authenticated/schedule/Schedule"
import React from "react"

vi.mock("~/services/scheduling/SchedulingService", () => ({
  scheduleVideo: vi.fn().mockResolvedValue({
    videoMetadata: { id: "video-123", title: "Test Video" },
    status: "Queued",
  }),
}))

vi.mock("~/components/helmet/Helmet", () => ({
  default: ({ title }: { title: string }) => <title>{title}</title>,
}))

vi.mock("~/components/schedule/preview/Preview", () => ({
  default: ({ url }: { url: string }) => <div data-testid="preview">Preview: {url}</div>,
}))

describe("Schedule", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("should render schedule page with title", () => {
    render(<Schedule />)

    expect(screen.getByLabelText("Website URL")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Schedule Download" })).toBeInTheDocument()
  })

  test("should update input value on change", () => {
    render(<Schedule />)

    const input = screen.getByLabelText("Website URL")
    fireEvent.change(input, { target: { value: "https://example.com/video" } })

    expect(input).toHaveValue("https://example.com/video")
  })

  test("should show preview component with URL", () => {
    render(<Schedule />)

    const input = screen.getByLabelText("Website URL")
    fireEvent.change(input, { target: { value: "https://example.com/video" } })

    expect(screen.getByTestId("preview")).toHaveTextContent("Preview: https://example.com/video")
  })

  test("should call scheduleVideo and clear input on button click", async () => {
    const { scheduleVideo } = await import("~/services/scheduling/SchedulingService")

    render(<Schedule />)

    const input = screen.getByLabelText("Website URL")
    fireEvent.change(input, { target: { value: "https://example.com/video" } })

    const button = screen.getByRole("button", { name: "Schedule Download" })
    fireEvent.click(button)

    await waitFor(() => {
      expect(scheduleVideo).toHaveBeenCalledWith("https://example.com/video")
    })

    await waitFor(() => {
      expect(input).toHaveValue("")
    })
  })

  test("should show progress bar while scheduling", async () => {
    const { scheduleVideo } = await import("~/services/scheduling/SchedulingService")
    let resolveSchedule: () => void
    vi.mocked(scheduleVideo).mockImplementation(() => new Promise(resolve => {
      resolveSchedule = () => resolve({
        videoMetadata: { id: "video-123", title: "Test" },
        status: "Queued",
      })
    }))

    render(<Schedule />)

    const input = screen.getByLabelText("Website URL")
    fireEvent.change(input, { target: { value: "https://example.com/video" } })

    const button = screen.getByRole("button", { name: "Schedule Download" })
    fireEvent.click(button)

    expect(screen.getByRole("progressbar")).toBeInTheDocument()

    resolveSchedule!()

    await waitFor(() => {
      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument()
    })
  })
})
