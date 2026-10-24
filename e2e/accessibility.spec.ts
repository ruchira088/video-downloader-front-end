import AxeBuilder from "@axe-core/playwright"
import { expect, type Page, test } from "@playwright/test"
import { expectSignedIn, videoLinks } from "./helpers.ts"

// The WCAG 2.1 A and AA rules the October 2026 audit fixed the app against.
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]

const expectNoViolations = async (page: Page) => {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()

  // Rule ids and the offending selectors, not the whole report: enough to find each one.
  const violations = results.violations.map(violation => ({
    rule: violation.id,
    impact: violation.impact,
    targets: violation.nodes.map(node => node.target.join(" ")),
  }))

  expect(violations).toEqual([])
}

// `firstRequest` is the API call each page loads its content with; the scan waits for it so it
// covers the loaded page rather than the spinner. (Not `networkidle`: the downloads page holds an
// event stream open, so the network never goes idle.)
const PAGES = [
  { path: "/", firstRequest: "/videos/search" },
  { path: "/downloading", firstRequest: "/schedule/search" },
  { path: "/playlists", firstRequest: "/playlists" },
  { path: "/history", firstRequest: "/videos/history" },
  { path: "/information", firstRequest: "/service/info" },
]

const waitForRequest = (page: Page, pathname: string) =>
  page.waitForResponse(response => new URL(response.url()).pathname === pathname)

test.describe("Accessibility", () => {
  // The body fades between theme colours once the saved theme loads; mid-fade, axe measures
  // contrast against a colour that is on its way out. Reduced motion makes the change instant.
  test.use({ contextOptions: { reducedMotion: "reduce" } })

  for (const { path, firstRequest } of PAGES) {
    test(`${path} has no WCAG A/AA violations`, async ({ page }) => {
      const loaded = waitForRequest(page, firstRequest)
      await page.goto(path)
      await expectSignedIn(page)
      expect((await loaded).ok()).toBe(true)

      await expectNoViolations(page)
    })
  }

  test("a video page has no WCAG A/AA violations", async ({ page }) => {
    const loaded = waitForRequest(page, "/videos/search")
    await page.goto("/")
    await expectSignedIn(page)
    await loaded
    // The response lands before React renders the cards; wait for the list (or its empty state).
    await expect(videoLinks(page).first().or(page.getByText("No videos found"))).toBeVisible()

    const count = await videoLinks(page).count()
    test.skip(count === 0, "The account has no videos to open")

    await videoLinks(page).first().click()
    await expect(page.locator("video")).toBeVisible()

    await expectNoViolations(page)
  })
})
