import { expect, test as setup } from "@playwright/test"
import { credentials, STORAGE_STATE_PATH } from "./environment.ts"
import { expectSignedIn, signIn } from "./helpers.ts"

// Signs in once through the UI and saves the session (the API's cookie plus the app's
// localStorage marker) for every spec in the "chromium" project to start from.
setup("sign in", async ({ page }) => {
  await page.goto("/sign-in")
  await signIn(page, credentials())

  await expect(page).toHaveURL("/")
  await expectSignedIn(page)

  await page.context().storageState({ path: STORAGE_STATE_PATH })
})
