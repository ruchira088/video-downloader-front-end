import { describe, expect, test } from "vitest"
import { render, screen } from "@testing-library/react"
import React from "react"
import VideoSiteChip from "~/components/video/video-site-chip/VideoSiteChip"

const faviconOf = (container: HTMLElement) => container.querySelector("img")

describe("VideoSiteChip", () => {
  test("should show the site's favicon next to its name", () => {
    const { container } = render(<VideoSiteChip videoSite="youtube" />)

    expect(screen.getByText("youtube")).toBeInTheDocument()
    expect(faviconOf(container)).toHaveAttribute("src", expect.stringContaining("youtube"))
  })

  test("should treat the favicon as decorative, since the label names the site", () => {
    const { container } = render(<VideoSiteChip videoSite="eporner" />)

    expect(faviconOf(container)).toHaveAttribute("alt", "")
  })

  test("should match site names regardless of case", () => {
    const { container } = render(<VideoSiteChip videoSite="YouTube" />)

    expect(screen.getByText("YouTube")).toBeInTheDocument()
    expect(faviconOf(container)).toHaveAttribute("src", expect.stringContaining("youtube"))
  })

  test("should reuse the xhamster favicon for its xhamster2 extractor", () => {
    const { container } = render(<VideoSiteChip videoSite="xhamster2" />)

    expect(faviconOf(container)).toHaveAttribute("src", expect.stringContaining("xhamster"))
  })

  test("should show a computer icon for local videos", () => {
    const { container } = render(<VideoSiteChip videoSite="local" />)

    expect(screen.getByTestId("ComputerIcon")).toBeInTheDocument()
    expect(faviconOf(container)).not.toBeInTheDocument()
  })

  test("should show just the name for a site without a favicon", () => {
    const { container } = render(<VideoSiteChip videoSite="vimeo" />)

    expect(screen.getByText("vimeo")).toBeInTheDocument()
    expect(faviconOf(container)).not.toBeInTheDocument()
    expect(container.querySelector("svg")).not.toBeInTheDocument()
  })
})
