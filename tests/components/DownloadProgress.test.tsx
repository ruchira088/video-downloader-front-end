import { describe, expect, test } from "vitest"
import { render, screen } from "@testing-library/react"
import DownloadProgress from "~/pages/authenticated/downloading/download-progress-bar/DownloadProgress"
import { SchedulingStatus } from "~/models/SchedulingStatus"
import React from "react"

describe("DownloadProgress", () => {
  test("should render progress with percentage when values are valid", () => {
    render(
      <DownloadProgress
        completeValue={1000}
        currentValue={500}
        schedulingStatus={SchedulingStatus.Active}
      />
    )

    expect(screen.getByText("50 %")).toBeInTheDocument()
  })

  test("should render progress with determinate value", () => {
    render(
      <DownloadProgress
        completeValue={1000}
        currentValue={250}
        schedulingStatus={SchedulingStatus.Active}
      />
    )

    expect(screen.getByText("25 %")).toBeInTheDocument()
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "25")
  })

  test("should render human readable sizes", () => {
    render(
      <DownloadProgress
        completeValue={1024000000}
        currentValue={512000000}
        schedulingStatus={SchedulingStatus.Active}
      />
    )

    expect(screen.getByText(/512/)).toBeInTheDocument()
    expect(screen.getByText(/1\.02/)).toBeInTheDocument()
  })

  test("should show indeterminate progress when status is Active but no percentage", () => {
    render(
      <DownloadProgress
        completeValue={0}
        currentValue={0}
        schedulingStatus={SchedulingStatus.Active}
      />
    )

    const progressbar = screen.getByRole("progressbar")
    expect(progressbar).not.toHaveAttribute("aria-valuenow")
  })

  test("should not show progress bar when not active and no percentage", () => {
    render(
      <DownloadProgress
        completeValue={0}
        currentValue={0}
        schedulingStatus={SchedulingStatus.Queued}
      />
    )

    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument()
  })

  test("should not show percentage when currentValue is 0", () => {
    render(
      <DownloadProgress
        completeValue={1000}
        currentValue={0}
        schedulingStatus={SchedulingStatus.Active}
      />
    )

    expect(screen.queryByText("%")).not.toBeInTheDocument()
  })

  test("should handle large file sizes", () => {
    render(
      <DownloadProgress
        completeValue={10000000000}
        currentValue={5000000000}
        schedulingStatus={SchedulingStatus.Active}
      />
    )

    expect(screen.getByText("50 %")).toBeInTheDocument()
    expect(screen.getByText(/5\.00GB/)).toBeInTheDocument()
  })

  test("should round percentage to 2 decimal places", () => {
    render(
      <DownloadProgress
        completeValue={300}
        currentValue={100}
        schedulingStatus={SchedulingStatus.Active}
      />
    )

    expect(screen.getByText("33.33 %")).toBeInTheDocument()
  })

  test("should show determinate progress bar for various statuses when percentage is available", () => {
    const statuses = [SchedulingStatus.Paused, SchedulingStatus.Error, SchedulingStatus.Stale]

    statuses.forEach(status => {
      const { unmount } = render(
        <DownloadProgress
          completeValue={1000}
          currentValue={500}
          schedulingStatus={status}
        />
      )

      expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "50")
      unmount()
    })
  })
})
