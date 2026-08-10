import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"
import { NotificationProvider, useNotification } from "~/providers/NotificationProvider"

const TestConsumer = () => {
  const { notifySuccess, notifyError } = useNotification()

  return (
    <div>
      <span data-testid="child">Child content</span>
      <button onClick={() => notifySuccess("Playlist saved")}>Succeed</button>
      <button onClick={() => notifyError("Failed to save the playlist", new Error("boom"))}>Fail</button>
    </div>
  )
}

describe("NotificationProvider", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  test("should render children", () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>
    )

    expect(screen.getByTestId("child")).toBeInTheDocument()
  })

  test("should show nothing until something is notified", () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>
    )

    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  test("should surface a success notification", async () => {
    const user = userEvent.setup()

    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>
    )

    await user.click(screen.getByRole("button", { name: "Succeed" }))

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Playlist saved")
    })
  })

  test("should surface an error notification and log the underlying error", async () => {
    const user = userEvent.setup()

    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>
    )

    await user.click(screen.getByRole("button", { name: "Fail" }))

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Failed to save the playlist")
    })

    // The snackbar stays free of stack traces, so the error itself goes to the console.
    expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to save the playlist", new Error("boom"))
  })

  test("should dismiss a notification when it is closed", async () => {
    const user = userEvent.setup()

    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>
    )

    await user.click(screen.getByRole("button", { name: "Fail" }))

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument()
    })

    await user.click(screen.getByRole("button", { name: /close/i }))

    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    })
  })

  test("should replace the visible notification with the most recent one", async () => {
    const user = userEvent.setup()

    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>
    )

    await user.click(screen.getByRole("button", { name: "Fail" }))
    await user.click(screen.getByRole("button", { name: "Succeed" }))

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Playlist saved")
    })

    expect(screen.queryByText("Failed to save the playlist")).not.toBeInTheDocument()
  })

  test("should fall back to console logging outside a provider", async () => {
    const user = userEvent.setup()

    // Notifications are non-essential feedback: a consumer rendered without the provider
    // must degrade to logging rather than throwing.
    render(<TestConsumer />)

    await user.click(screen.getByRole("button", { name: "Fail" }))

    expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to save the playlist", new Error("boom"))
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })
})
