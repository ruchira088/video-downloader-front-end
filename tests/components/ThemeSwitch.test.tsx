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
  test("should render with theme toggle button", () => {
    renderWithContext(Theme.Light)
    expect(screen.getByLabelText("Switch to dark mode")).toBeInTheDocument()
  })

  test("should call setTheme with Dark when clicked in light mode", async () => {
    const user = userEvent.setup()
    const { setTheme } = renderWithContext(Theme.Light)

    const button = screen.getByLabelText("Switch to dark mode")
    await user.click(button)

    expect(setTheme).toHaveBeenCalledWith(Theme.Dark)
  })

  test("should call setTheme with Light when clicked in dark mode", async () => {
    const user = userEvent.setup()
    const { setTheme } = renderWithContext(Theme.Dark)

    const button = screen.getByLabelText("Switch to light mode")
    await user.click(button)

    expect(setTheme).toHaveBeenCalledWith(Theme.Light)
  })
})
