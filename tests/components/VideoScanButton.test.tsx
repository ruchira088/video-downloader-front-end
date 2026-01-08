import { describe, expect, test, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import VideoScanButton from "~/components/scan/VideoScanButton"
import { ScanStatus } from "~/models/VideoScan"

// Mock the video service
vi.mock("~/services/video/VideoService", () => ({
  scanForVideos: vi.fn(),
  fetchVideoScanStatus: vi.fn(),
}))

import { scanForVideos, fetchVideoScanStatus } from "~/services/video/VideoService"

const mockScanForVideos = vi.mocked(scanForVideos)
const mockFetchVideoScanStatus = vi.mocked(fetchVideoScanStatus)

describe("VideoScanButton", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Initial State", () => {
    test("should fetch scan status on mount", async () => {
      mockFetchVideoScanStatus.mockResolvedValue({ scanStatus: ScanStatus.Idle })

      render(<VideoScanButton />)

      await waitFor(() => {
        expect(mockFetchVideoScanStatus).toHaveBeenCalled()
      })
    })

    test("should show 'Scan For Videos' when idle", async () => {
      mockFetchVideoScanStatus.mockResolvedValue({ scanStatus: ScanStatus.Idle })

      render(<VideoScanButton />)

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /scan for videos/i })).toBeInTheDocument()
      })
    })

    test("should be enabled when idle", async () => {
      mockFetchVideoScanStatus.mockResolvedValue({ scanStatus: ScanStatus.Idle })

      render(<VideoScanButton />)

      await waitFor(() => {
        expect(screen.getByRole("button")).not.toBeDisabled()
      })
    })
  })

  describe("Scanning State", () => {
    test("should show 'Scanning...' when in progress", async () => {
      mockFetchVideoScanStatus.mockResolvedValue({ scanStatus: ScanStatus.InProgress })

      render(<VideoScanButton />)

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /scanning/i })).toBeInTheDocument()
      })
    })

    test("should be disabled when scanning", async () => {
      mockFetchVideoScanStatus.mockResolvedValue({ scanStatus: ScanStatus.InProgress })

      render(<VideoScanButton />)

      await waitFor(() => {
        expect(screen.getByRole("button")).toBeDisabled()
      })
    })
  })

  describe("Click Handler", () => {
    test("should call scanForVideos when clicked", async () => {
      const user = userEvent.setup()
      mockFetchVideoScanStatus.mockResolvedValue({ scanStatus: ScanStatus.Idle })
      mockScanForVideos.mockResolvedValue(undefined)

      render(<VideoScanButton />)

      await waitFor(() => {
        expect(screen.getByRole("button")).not.toBeDisabled()
      })

      await user.click(screen.getByRole("button"))

      await waitFor(() => {
        expect(mockScanForVideos).toHaveBeenCalled()
      })
    })

    test("should show scanning state after click", async () => {
      const user = userEvent.setup()
      mockFetchVideoScanStatus.mockResolvedValue({ scanStatus: ScanStatus.Idle })
      mockScanForVideos.mockResolvedValue(undefined)

      render(<VideoScanButton />)

      await waitFor(() => {
        expect(screen.getByRole("button")).not.toBeDisabled()
      })

      await user.click(screen.getByRole("button"))

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /scanning/i })).toBeDisabled()
      })
    })
  })

  describe("className Prop", () => {
    test("should apply className to button", async () => {
      mockFetchVideoScanStatus.mockResolvedValue({ scanStatus: ScanStatus.Idle })

      render(<VideoScanButton className="custom-button" />)

      await waitFor(() => {
        expect(screen.getByRole("button")).toHaveClass("custom-button")
      })
    })
  })

  describe("Different Scan Statuses", () => {
    test("should handle Scheduled status", async () => {
      mockFetchVideoScanStatus.mockResolvedValue({ scanStatus: ScanStatus.Scheduled })

      render(<VideoScanButton />)

      await waitFor(() => {
        // Scheduled is not InProgress, so button should be enabled
        expect(screen.getByRole("button", { name: /scan for videos/i })).not.toBeDisabled()
      })
    })

    test("should handle Error status", async () => {
      mockFetchVideoScanStatus.mockResolvedValue({ scanStatus: ScanStatus.Error })

      render(<VideoScanButton />)

      await waitFor(() => {
        // Error is not InProgress, so button should be enabled
        expect(screen.getByRole("button", { name: /scan for videos/i })).not.toBeDisabled()
      })
    })
  })
})
