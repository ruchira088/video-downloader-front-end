import { expect, test } from "@playwright/test"
import { credentials } from "./environment.ts"
import { expectSignedIn, signIn } from "./helpers.ts"

// These journeys sign in and out themselves, so they start without the shared session. Signing
// out here ends only this context's session, not the one the other specs reuse.
test.use({ storageState: { cookies: [], origins: [] } })

test.describe("Sign in / sign out", () => {
  test("a protected page redirects to sign-in and returns there after signing in", async ({ page }) => {
    await page.goto("/playlists")

    await expect(page).toHaveURL(/\/sign-in\?redirect=%2Fplaylists$/)
    await expect(page.getByRole("button", { name: "Login" })).toBeVisible()

    await signIn(page, credentials())

    await expect(page).toHaveURL("/playlists")
    await expect(page.getByRole("heading", { name: "Playlists" })).toBeVisible()
    await expectSignedIn(page)
  })

  test("signing out returns to sign-in and protected pages require signing in again", async ({ page }) => {
    await page.goto("/sign-in")
    await signIn(page, credentials())
    await expect(page).toHaveURL("/")
    await expectSignedIn(page)

    await page.getByRole("button", { name: "Logout" }).click()

    await expect(page).toHaveURL("/sign-in")
    await expect(page.getByRole("button", { name: "Login" })).toBeVisible()

    await page.goto("/downloading")
    await expect(page).toHaveURL(/\/sign-in\?redirect=%2Fdownloading$/)
  })

  test("a wrong password shows an error and stays on sign-in", async ({ page }) => {
    await page.goto("/sign-in")
    await signIn(page, { email: credentials().email, password: `wrong-${Date.now()}` })

    await expect(page.getByText("Invalid email or password. Please try again.")).toBeVisible()
    await expect(page).toHaveURL("/sign-in")
  })
})
