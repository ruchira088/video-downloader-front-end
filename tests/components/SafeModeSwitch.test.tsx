import { describe, expect, test, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import SafeModeSwitch from "~/components/quick-settings/switches/SafeModeSwitch"
import React from "react"
import { withApplicationConfiguration } from "../helpers"

const renderWithContext = (safeMode: boolean, setSafeMode = vi.fn()) => ({
  ...render(withApplicationConfiguration(<SafeModeSwitch />, { safeMode, setSafeMode })),
  setSafeMode,
})

describe("SafeModeSwitch", () => {
  test("should render with safe mode toggle button", () => {
    renderWithContext(false)
    expect(screen.getByLabelText("Enable safe mode")).toBeInTheDocument()
  })

  test("should call setSafeMode with true when clicked while disabled", async () => {
    const user = userEvent.setup()
    const { setSafeMode } = renderWithContext(false)

    const button = screen.getByLabelText("Enable safe mode")
    await user.click(button)

    expect(setSafeMode).toHaveBeenCalledWith(true)
  })

  test("should call setSafeMode with false when clicked while enabled", async () => {
    const user = userEvent.setup()
    const { setSafeMode } = renderWithContext(true)

    const button = screen.getByLabelText("Disable safe mode")
    await user.click(button)

    expect(setSafeMode).toHaveBeenCalledWith(false)
  })
})
