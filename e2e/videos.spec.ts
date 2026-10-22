import { expect, type Page, type Response, test } from "@playwright/test"
import { videoLinks } from "./helpers.ts"

// Matches PAGE_SIZE in app/pages/authenticated/videos/Videos.tsx.
const PAGE_SIZE = 50

const isVideoSearchPage = (pageNumber: number) => (response: Response) => {
  const url = new URL(response.url())
  return url.pathname === "/videos/search" && url.searchParams.get("page-number") === String(pageNumber)
}

/** Opens the videos list and returns how many videos its first page held. */
const openVideosList = async (page: Page): Promise<number> => {
  const firstPage = page.waitForResponse(isVideoSearchPage(0))
  await page.goto("/")

  const response = await firstPage
  expect(response.status()).toBe(200)

  const body = (await response.json()) as { results: unknown[] }
  return body.results.length
}

test.describe("Browse videos", () => {
  test("the videos list loads", async ({ page }) => {
    const firstPageSize = await openVideosList(page)

    await expect(page).toHaveTitle("Videos")

    if (firstPageSize === 0) {
      await expect(page.getByText("No videos found")).toBeVisible()
    } else {
      await expect(videoLinks(page)).toHaveCount(firstPageSize)
    }
  })

  test("scrolling to the end of the list loads the next page", async ({ page }) => {
    const firstPageSize = await openVideosList(page)

    test.skip(
      firstPageSize < PAGE_SIZE,
      `The account has ${firstPageSize} video(s), fewer than one page of ${PAGE_SIZE}, so there is no next page to load`
    )

    await expect(videoLinks(page)).toHaveCount(firstPageSize)

    const secondPage = page.waitForResponse(isVideoSearchPage(1))
    await videoLinks(page).last().scrollIntoViewIfNeeded()
    await page.mouse.wheel(0, 10_000)

    expect((await secondPage).status()).toBe(200)
    await expect.poll(() => videoLinks(page).count()).toBeGreaterThan(firstPageSize)
  })

  test("opening a video shows its page", async ({ page }) => {
    const firstPageSize = await openVideosList(page)
    test.skip(firstPageSize === 0, "The account has no videos to open")

    const firstVideo = videoLinks(page).first()
    const href = await firstVideo.getAttribute("href")
    const videoId = decodeURIComponent((href ?? "").replace("/video/", ""))

    const videoResponse = page.waitForResponse(
      response => new URL(response.url()).pathname === `/videos/id/${encodeURIComponent(videoId)}`
    )
    await firstVideo.click()

    await expect(page).toHaveURL(`/video/${encodeURIComponent(videoId)}`)
    expect((await videoResponse).status()).toBe(200)

    await expect(page.locator("video")).toBeVisible()
    await expect(page.getByRole("button", { name: "Delete" })).toBeVisible()
    await expect(page.getByText("Unable to load video")).toHaveCount(0)
  })
})
