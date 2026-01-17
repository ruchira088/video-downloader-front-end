import { describe, expect, test, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import SafeModeSwitch from "~/components/quick-settings/switches/SafeModeSwitch"
import { Theme } from "~/models/ApplicationConfiguration"
import { ApplicationConfigurationContext } from "~/providers/ApplicationConfigurationProvider"
import { Some } from "~/types/Option"
import React from "react"

const renderWithContext = (safeMode: boolean, setSafeMode = vi.fn()) => {
  const contextValue = {
    safeMode,
    theme: Theme.Light,
    setSafeMode,
    setTheme: vi.fn(),
  }

  return {
    ...render(
      <ApplicationConfigurationContext.Provider value={Some.of(contextValue)}>
        <SafeModeSwitch />
      </ApplicationConfigurationContext.Provider>
    ),
    setSafeMode,
  }
}

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
