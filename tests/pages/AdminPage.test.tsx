import { describe, expect, test, vi } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"
import { createMemoryRouter, RouterProvider } from "react-router"
import AdminLayout from "~/pages/authenticated/admin/AdminLayout"
import AdminPage from "~/pages/authenticated/admin/AdminPage"
import { Role } from "~/models/User"
import { queueIncompleteDownloads, videoServiceSummary } from "~/services/video/VideoService"
import { buildVideo } from "../fixtures"
import { withAuthenticatedUser, withNotifications } from "../helpers"
import { Duration } from "luxon"

vi.mock("~/services/video/VideoService", () => ({
  videoServiceSummary: vi.fn(),
  queueIncompleteDownloads: vi.fn(),
}))

vi.mock("~/components/scan/VideoScanButton", () => ({
  default: () => <button type="button">Scan For Videos</button>,
}))

vi.mock("~/components/worker-status/WorkerStatusButton", () => ({
  default: () => <button type="button">Pause Downloads</button>,
}))

const summary = {
  videoCount: 42,
  totalSize: 5_000_000_000,
  totalDuration: Duration.fromObject({ hours: 3 }),
  sites: ["youtube", "vimeo"],
}

const renderAdmin = (role: Role = Role.Admin, notifications: Parameters<typeof withNotifications>[1] = {}) =>
  render(
    withNotifications(
      withAuthenticatedUser(
        <RouterProvider
          router={createMemoryRouter(
            [
              {
                element: <AdminLayout />,
                children: [
                  { path: "/admin", element: <AdminPage /> },
                  { path: "/duplicates", element: <div>Duplicates page</div> },
                ],
              },
            ],
            { initialEntries: ["/admin"] }
          )}
        />,
        role
      ),
      notifications
    )
  )

describe("AdminLayout", () => {
  test("should turn non-admins away without calling admin-only endpoints", () => {
    renderAdmin(Role.User)

    expect(screen.getByText("This page is only available to administrators.")).toBeInTheDocument()
    expect(videoServiceSummary).not.toHaveBeenCalled()
  })
})

describe("AdminPage", () => {
  test("should show the library summary", async () => {
    vi.mocked(videoServiceSummary).mockResolvedValue(summary)
    renderAdmin()

    const library = screen.getByRole("region", { name: "Library" })
    expect(await within(library).findByText("42")).toBeInTheDocument()
    expect(within(library).getByText("youtube")).toBeInTheDocument()
    expect(within(library).getByText("vimeo")).toBeInTheDocument()
  })

  test("should say so when the library summary cannot be loaded", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {})
    vi.mocked(videoServiceSummary).mockRejectedValue(new Error("boom"))
    renderAdmin()

    expect(await screen.findByText("Unable to load the library summary.")).toBeInTheDocument()
  })

  test("should offer the worker, scan and duplicates controls", () => {
    vi.mocked(videoServiceSummary).mockReturnValue(new Promise(() => {}))
    renderAdmin()

    expect(screen.getByRole("button", { name: "Pause Downloads" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Scan For Videos" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Review Duplicates" })).toHaveAttribute("href", "/duplicates")
  })

  test("should only re-queue incomplete downloads after confirmation", async () => {
    const user = userEvent.setup()
    const notifySuccess = vi.fn()
    vi.mocked(videoServiceSummary).mockReturnValue(new Promise(() => {}))
    vi.mocked(queueIncompleteDownloads).mockResolvedValue([buildVideo(), buildVideo()])
    renderAdmin(Role.Admin, { notifySuccess })

    await user.click(screen.getByRole("button", { name: "Re-queue Incomplete Downloads" }))
    expect(queueIncompleteDownloads).not.toHaveBeenCalled()

    const dialog = screen.getByRole("dialog")
    await user.click(within(dialog).getByRole("button", { name: "Re-queue" }))

    await waitFor(() => expect(notifySuccess).toHaveBeenCalledWith("Re-queued 2 videos"))
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  test("should leave the downloads alone when the confirmation is cancelled", async () => {
    const user = userEvent.setup()
    vi.mocked(videoServiceSummary).mockReturnValue(new Promise(() => {}))
    renderAdmin()

    await user.click(screen.getByRole("button", { name: "Re-queue Incomplete Downloads" }))
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel" }))

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(queueIncompleteDownloads).not.toHaveBeenCalled()
  })

  test("should report a failed re-queue", async () => {
    const user = userEvent.setup()
    const notifyError = vi.fn()
    const error = new Error("forbidden")
    vi.mocked(videoServiceSummary).mockReturnValue(new Promise(() => {}))
    vi.mocked(queueIncompleteDownloads).mockRejectedValue(error)
    renderAdmin(Role.Admin, { notifyError })

    await user.click(screen.getByRole("button", { name: "Re-queue Incomplete Downloads" }))
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Re-queue" }))

    await waitFor(() => expect(notifyError).toHaveBeenCalledWith("Failed to re-queue incomplete downloads", error))
  })

  test("should use the singular for a single re-queued video", async () => {
    const user = userEvent.setup()
    const notifySuccess = vi.fn()
    vi.mocked(videoServiceSummary).mockReturnValue(new Promise(() => {}))
    vi.mocked(queueIncompleteDownloads).mockResolvedValue([buildVideo()])
    renderAdmin(Role.Admin, { notifySuccess })

    await user.click(screen.getByRole("button", { name: "Re-queue Incomplete Downloads" }))
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Re-queue" }))

    await waitFor(() => expect(notifySuccess).toHaveBeenCalledWith("Re-queued 1 video"))
  })
})
