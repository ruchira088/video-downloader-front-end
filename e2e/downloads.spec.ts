import { expect, test } from "@playwright/test"

// How long the stream must stay up after connecting before the page counts as settled.
const SETTLE_MS = 5_000

test.describe("Downloads", () => {
  test("the scheduled-videos list renders and the live-update stream stays connected", async ({ page }) => {
    const listResponse = page.waitForResponse(response => {
      const url = new URL(response.url())
      return url.pathname === "/schedule/search" && url.searchParams.get("page-number") === "0"
    })
    const streamResponse = page.waitForResponse(response => new URL(response.url()).pathname === "/schedule/updates")

    await page.goto("/downloading")
    await expect(page).toHaveTitle("Downloading Videos")

    const list = await listResponse
    expect(list.status()).toBe(200)
    const scheduledCount = ((await list.json()) as { results: unknown[] }).results.length

    if (scheduledCount === 0) {
      await expect(page.getByText("Nothing is downloading")).toBeVisible()
    } else {
      await expect(page.getByRole("button", { name: "Delete scheduled video" }).first()).toBeVisible()
    }

    await expect(page.getByRole("button", { name: "Retry All" })).toBeVisible()

    const stream = await streamResponse
    expect(stream.status()).toBe(200)
    expect(stream.headers()["content-type"]).toContain("text/event-stream")

    // The banner only appears once the stream drops, so give it time to fail before asserting.
    await page.waitForTimeout(SETTLE_MS)

    await expect(page.getByText("Live updates interrupted. Reconnecting…")).toHaveCount(0)
    await expect(page.getByText("Live updates stopped.")).toHaveCount(0)
  })
})
