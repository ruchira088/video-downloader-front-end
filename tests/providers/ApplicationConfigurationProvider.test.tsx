import { describe, expect, test, vi, beforeEach } from "vitest"
import { render, screen, waitFor, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  ApplicationConfigurationProvider,
  useApplicationConfiguration,
} from "~/providers/ApplicationConfigurationProvider"
import { Theme } from "~/models/ApplicationConfiguration"
import React from "react"

vi.mock("~/services/config/ConfigurationService", () => ({
  localStorageConfigurationService: {
    getApplicationConfiguration: vi.fn(),
    getDefaultApplicationConfiguration: vi.fn(),
    setApplicationConfiguration: vi.fn(),
  },
}))

import { localStorageConfigurationService } from "~/services/config/ConfigurationService"

const mockGetApplicationConfiguration = vi.mocked(localStorageConfigurationService.getApplicationConfiguration)
const mockGetDefaultApplicationConfiguration = vi.mocked(localStorageConfigurationService.getDefaultApplicationConfiguration)
const mockSetApplicationConfiguration = vi.mocked(localStorageConfigurationService.setApplicationConfiguration)

const TestConsumer = () => {
  const { safeMode, theme, setSafeMode, setTheme } = useApplicationConfiguration()

  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="safeMode">{safeMode ? "true" : "false"}</span>
      <button onClick={() => setTheme(theme === Theme.Light ? Theme.Dark : Theme.Light)}>
        Toggle Theme
      </button>
      <button onClick={() => setSafeMode(!safeMode)}>Toggle Safe Mode</button>
    </div>
  )
}

describe("ApplicationConfigurationProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.body.removeAttribute("data-theme")
  })

  test("should render children after loading config", async () => {
    mockGetApplicationConfiguration.mockResolvedValue({
      isEmpty: () => true,
      fold: (onNone: () => any) => onNone(),
    } as any)
    mockGetDefaultApplicationConfiguration.mockResolvedValue({
      theme: Theme.Light,
      safeMode: false,
    })

    render(
      <ApplicationConfigurationProvider>
        <div data-testid="child">Child Content</div>
      </ApplicationConfigurationProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId("child")).toBeInTheDocument()
    })
  })

  test("should not render children while loading", () => {
    mockGetApplicationConfiguration.mockImplementation(() => new Promise(() => {}))

    const { container } = render(
      <ApplicationConfigurationProvider>
        <div data-testid="child">Child Content</div>
      </ApplicationConfigurationProvider>
    )

    expect(screen.queryByTestId("child")).not.toBeInTheDocument()
  })

  test("should load default config when no saved config exists", async () => {
    mockGetApplicationConfiguration.mockResolvedValue({
      isEmpty: () => true,
      fold: (onNone: () => any) => onNone(),
    } as any)
    mockGetDefaultApplicationConfiguration.mockResolvedValue({
      theme: Theme.Dark,
      safeMode: true,
    })

    render(
      <ApplicationConfigurationProvider>
        <TestConsumer />
      </ApplicationConfigurationProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId("theme")).toHaveTextContent("dark")
      expect(screen.getByTestId("safeMode")).toHaveTextContent("true")
    })
  })

  test("should load saved config when it exists", async () => {
    mockGetApplicationConfiguration.mockResolvedValue({
      isEmpty: () => false,
      fold: (_: any, onSome: (v: any) => any) =>
        onSome(Promise.resolve({ theme: Theme.Light, safeMode: false })),
    } as any)

    render(
      <ApplicationConfigurationProvider>
        <TestConsumer />
      </ApplicationConfigurationProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId("theme")).toHaveTextContent("light")
    })
  })

  test("should set data-theme attribute on body", async () => {
    mockGetApplicationConfiguration.mockResolvedValue({
      isEmpty: () => true,
      fold: (onNone: () => any) => onNone(),
    } as any)
    mockGetDefaultApplicationConfiguration.mockResolvedValue({
      theme: Theme.Dark,
      safeMode: false,
    })

    render(
      <ApplicationConfigurationProvider>
        <TestConsumer />
      </ApplicationConfigurationProvider>
    )

    await waitFor(() => {
      expect(document.body.getAttribute("data-theme")).toBe("dark")
    })
  })

  test("should persist config changes to storage", async () => {
    const user = userEvent.setup()
    mockGetApplicationConfiguration.mockResolvedValue({
      isEmpty: () => true,
      fold: (onNone: () => any) => onNone(),
    } as any)
    mockGetDefaultApplicationConfiguration.mockResolvedValue({
      theme: Theme.Light,
      safeMode: false,
    })
    mockSetApplicationConfiguration.mockResolvedValue(undefined)

    render(
      <ApplicationConfigurationProvider>
        <TestConsumer />
      </ApplicationConfigurationProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId("theme")).toHaveTextContent("light")
    })

    await user.click(screen.getByText("Toggle Theme"))

    await waitFor(() => {
      expect(mockSetApplicationConfiguration).toHaveBeenCalled()
    })
  })
})

describe("useApplicationConfiguration", () => {
  test("should throw error when used outside provider", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})

    expect(() => {
      render(<TestConsumer />)
    }).toThrow("ApplicationConfigurationContext is not initialized")

    consoleError.mockRestore()
  })
})
