import { describe, expect, test } from "vitest"
import { render, screen } from "@testing-library/react"
import VideoSiteCard from "~/components/video/video-site-card/VideoSiteCard"

describe("VideoSiteCard", () => {
  describe("known video sites", () => {
    const knownSites = [
      "pornhub",
      "spankbang",
      "pornone",
      "eporner",
      "xfreehd",
      "xhamster",
      "youtube",
      "xnxx",
      "youporn",
      "xvideos"
    ]

    test.each(knownSites)("should render logo image for %s", (site) => {
      render(<VideoSiteCard videoSite={site} />)
      const img = screen.getByRole("img", { name: `${site} logo` })
      expect(img).toBeInTheDocument()
    })
  })

  describe("unknown video sites", () => {
    test("should render site name text for unknown site", () => {
      render(<VideoSiteCard videoSite="unknownsite" />)
      expect(screen.getByText("unknownsite")).toBeInTheDocument()
    })

    test("should not render an image for unknown site", () => {
      render(<VideoSiteCard videoSite="unknownsite" />)
      expect(screen.queryByRole("img")).not.toBeInTheDocument()
    })

    test("should handle empty string as video site", () => {
      const { container } = render(<VideoSiteCard videoSite="" />)
      // Empty string renders a div with empty text
      expect(container.textContent).toBe("")
    })

    test("should handle site name with special characters", () => {
      render(<VideoSiteCard videoSite="my-custom-site" />)
      expect(screen.getByText("my-custom-site")).toBeInTheDocument()
    })
  })
})
