import { expect, type Locator, type Page } from "@playwright/test"
import type { Credentials } from "./environment.ts"

/**
 * Enters a credential without `fill()`, whose step title (`Fill "<value>"`) the HTML report
 * records verbatim, and CI uploads that report from a public repository. Sets the value the way
 * React expects: through the native setter, followed by an `input` event.
 */
const enterSecret = async (input: Locator, value: string): Promise<void> => {
  await input.evaluate((element, secret) => {
    const inputElement = element as HTMLInputElement
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(inputElement, secret)
    inputElement.dispatchEvent(new Event("input", { bubbles: true }))
  }, value)
}

/** Fills in and submits the sign-in form on the current page. */
export const signIn = async (page: Page, { email, password }: Credentials): Promise<void> => {
  const emailField = page.getByLabel("Email")
  // The show/hide toggle is labelled "Show password", so match the field's label exactly.
  const passwordField = page.getByLabel("Password", { exact: true })

  await enterSecret(emailField, email)
  await enterSecret(passwordField, password)
  await expect(emailField).not.toHaveValue("")
  await expect(passwordField).not.toHaveValue("")

  await page.getByRole("button", { name: "Login" }).click()
}

/** The primary navigation is only rendered once the session has been verified. */
export const expectSignedIn = async (page: Page): Promise<void> => {
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Logout" })).toBeVisible()
}

/** Links to individual video pages, e.g. the cards on the videos list. */
export const videoLinks = (page: Page) => page.locator('a[href^="/video/"]')
