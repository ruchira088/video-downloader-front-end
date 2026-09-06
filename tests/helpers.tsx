/**
 * Shared rendering helpers for component and page tests.
 */
import React, { type ReactElement } from "react"
import { act } from "@testing-library/react"
import { vi } from "vitest"
import { Theme } from "~/models/ApplicationConfiguration"
import { ApplicationConfigurationContext } from "~/providers/ApplicationConfigurationProvider"
import { Some } from "~/types/Option"
import { intersectionObserverCallbacks } from "./setup"

/**
 * Wraps `element` in an application-configuration context: light theme and safe mode off
 * unless overridden, with no-op setters that a test can replace to assert on.
 */
export const withApplicationConfiguration = (
  element: ReactElement,
  overrides: Partial<ApplicationConfigurationContext> = {}
): ReactElement => (
  <ApplicationConfigurationContext.Provider
    value={Some.of({ safeMode: false, theme: Theme.Light, setSafeMode: vi.fn(), setTheme: vi.fn(), ...overrides })}
  >
    {element}
  </ApplicationConfigurationContext.Provider>
)

/** Fires the most recently created IntersectionObserver as if its sentinel had scrolled into view. */
export const triggerIntersection = async (): Promise<void> => {
  const callback = intersectionObserverCallbacks[intersectionObserverCallbacks.length - 1]

  await act(async () => {
    callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver)
  })
}
