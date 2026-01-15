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
  test("should render with 'Safe Mode' label", () => {
    renderWithContext(false)
    expect(screen.getByText("Safe Mode")).toBeInTheDocument()
  })

  test("should call setSafeMode with true when toggled on", async () => {
    const user = userEvent.setup()
    const { setSafeMode } = renderWithContext(false)

    const switchControl = screen.getByLabelText("Safe Mode")
    await user.click(switchControl)

    expect(setSafeMode).toHaveBeenCalledWith(true)
  })

  test("should call setSafeMode with false when toggled off", async () => {
    const user = userEvent.setup()
    const { setSafeMode } = renderWithContext(true)

    const switchControl = screen.getByLabelText("Safe Mode")
    await user.click(switchControl)

    expect(setSafeMode).toHaveBeenCalledWith(false)
  })
})
