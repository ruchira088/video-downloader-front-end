import { describe, expect, test, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import ThemeSwitch from "~/components/quick-settings/switches/ThemeSwitch"
import { Theme } from "~/models/ApplicationConfiguration"
import { ApplicationConfigurationContext } from "~/providers/ApplicationConfigurationProvider"
import { Some } from "~/types/Option"
import React from "react"

const renderWithContext = (theme: Theme, setTheme = vi.fn()) => {
  const contextValue = {
    safeMode: false,
    theme,
    setSafeMode: vi.fn(),
    setTheme,
  }

  return {
    ...render(
      <ApplicationConfigurationContext.Provider value={Some.of(contextValue)}>
        <ThemeSwitch />
      </ApplicationConfigurationContext.Provider>
    ),
    setTheme,
  }
}

describe("ThemeSwitch", () => {
  test("should render with 'Dark Mode' label", () => {
    renderWithContext(Theme.Light)
    expect(screen.getByText("Dark Mode")).toBeInTheDocument()
  })

  test("should call setTheme with Dark when toggled", async () => {
    const user = userEvent.setup()
    const { setTheme } = renderWithContext(Theme.Light)

    const switchControl = screen.getByLabelText("Dark Mode")
    await user.click(switchControl)

    expect(setTheme).toHaveBeenCalledWith(Theme.Dark)
  })

  test("should call setTheme with Light when already Dark", async () => {
    const user = userEvent.setup()
    const { setTheme } = renderWithContext(Theme.Dark)

    const switchControl = screen.getByLabelText("Dark Mode")
    await user.click(switchControl)

    expect(setTheme).toHaveBeenCalledWith(Theme.Light)
  })
})
