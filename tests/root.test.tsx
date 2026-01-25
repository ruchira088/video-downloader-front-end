import { describe, expect, test, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { meta, links, Layout, HydrateFallback, ErrorBoundary } from "~/root"
import React from "react"

const mockIsRouteErrorResponse = vi.fn()

vi.mock("react-router", () => ({
  isRouteErrorResponse: (error: any) => mockIsRouteErrorResponse(error),
  Links: () => <link data-testid="links" />,
  Meta: () => <meta data-testid="meta" />,
  Outlet: () => <div data-testid="outlet">Outlet</div>,
  Scripts: () => <script data-testid="scripts" />,
  ScrollRestoration: () => null,
}))

vi.mock("~/providers/ApplicationConfigurationProvider", () => ({
  ApplicationConfigurationProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="provider">{children}</div>
  ),
}))

describe("root", () => {
  describe("meta", () => {
    test("should return correct meta tags", () => {
      const result = meta({} as any)

      expect(result).toContainEqual({ title: "Video Downloader" })
      expect(result).toContainEqual({ name: "description", content: "Download & play videos from various platforms" })
    })
  })

  describe("links", () => {
    test("should return preconnect and stylesheet links", () => {
      const result = links()

      expect(result).toContainEqual({ rel: "preconnect", href: "https://fonts.googleapis.com" })
      expect(result.some(link => "rel" in link && link.rel === "stylesheet")).toBe(true)
    })
  })

  describe("Layout", () => {
    test("should render children within layout structure", () => {
      // Layout renders <html> which can't be a child of <div>, so we just test it renders
      render(
        <Layout>
          <div data-testid="child">Child Content</div>
        </Layout>
      )

      // The Layout should render without error, children should appear
      expect(screen.getByTestId("child")).toBeInTheDocument()
    })
  })

  describe("HydrateFallback", () => {
    test("should render loading indicator", () => {
      render(<HydrateFallback />)

      expect(screen.getByRole("heading", { name: "Video Downloader" })).toBeInTheDocument()
      expect(screen.getByRole("img", { name: "Video Downloader" })).toBeInTheDocument()
    })
  })

  describe("ErrorBoundary", () => {
    const defaultParams = { }

    test("should render generic error message for unknown errors", () => {
      mockIsRouteErrorResponse.mockReturnValue(false)

      render(<ErrorBoundary error={new Error("Test error")} params={defaultParams} />)

      expect(screen.getByText("Oops!")).toBeInTheDocument()
    })

    test("should render 404 message for 404 errors", () => {
      const routeError = { status: 404, statusText: "Not Found" }
      mockIsRouteErrorResponse.mockReturnValue(true)

      render(<ErrorBoundary error={routeError as any} params={defaultParams} />)

      expect(screen.getByText("404")).toBeInTheDocument()
      expect(screen.getByText("The requested page could not be found.")).toBeInTheDocument()
    })

    test("should render error status for other route errors", () => {
      const routeError = { status: 500, statusText: "Internal Server Error" }
      mockIsRouteErrorResponse.mockReturnValue(true)

      render(<ErrorBoundary error={routeError as any} params={defaultParams} />)

      expect(screen.getByText("Error")).toBeInTheDocument()
      expect(screen.getByText("Internal Server Error")).toBeInTheDocument()
    })
  })
})
