import { type APIRequestContext, expect, type Page, type Response, test } from "@playwright/test"
import { API_URL, STORAGE_STATE_PATH } from "./environment.ts"

const TITLE_PREFIX = "e2e-smoke-"
// Leftovers from an earlier run that died before its cleanup are swept once they are this old,
// so a run never deletes a playlist that a concurrent run is still using.
const STALE_AFTER_MS = 60 * 60 * 1000

type PlaylistJson = {
  readonly id: string
  readonly title: string
  readonly createdAt: string
  readonly videos: ReadonlyArray<{ readonly videoMetadata: { readonly id: string } }>
}

const playlistTitle = `${TITLE_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
let createdPlaylistId: string | undefined

const isPlaylistUpdate = (playlistId: string) => (response: Response) =>
  response.request().method() === "PUT" && new URL(response.url()).pathname === `/playlists/id/${playlistId}`

const videoOrder = async (response: Response): Promise<string[]> =>
  ((await response.json()) as PlaylistJson).videos.map(video => video.videoMetadata.id)

// "Play <title>" on each playlist row, in display order. The main "Play" button has no title.
const rowPlayButtons = (page: Page) => page.getByRole("button", { name: /^Play .+/ })

const deletePlaylists = async (api: APIRequestContext, shouldDelete: (playlist: PlaylistJson) => boolean) => {
  const response = await api.get("/playlists", { params: { pageNumber: 0, pageSize: 100 } })
  const { results } = (await response.json()) as { results: PlaylistJson[] }

  for (const playlist of results.filter(shouldDelete)) {
    await api.delete(`/playlists/id/${encodeURIComponent(playlist.id)}`)
  }
}

test.describe("Playlists", () => {
  // Deletes this run's playlist if the journey failed before deleting it through the UI, plus any
  // stale playlists left by earlier runs. Uses the API directly, so it works whatever the page state.
  test.afterAll(async ({ playwright }) => {
    const api = await playwright.request.newContext({ baseURL: API_URL, storageState: STORAGE_STATE_PATH })

    try {
      await deletePlaylists(
        api,
        playlist =>
          playlist.id === createdPlaylistId ||
          (playlist.title.startsWith(TITLE_PREFIX) && Date.now() - Date.parse(playlist.createdAt) > STALE_AFTER_MS)
      )
    } finally {
      await api.dispose()
    }
  })

  test("create a playlist, add videos, reorder them and delete it", async ({ page }) => {
    await test.step("create a playlist", async () => {
      await page.goto("/playlists")
      await expect(page.getByRole("heading", { name: "Playlists" })).toBeVisible()

      await page.getByRole("button", { name: "New Playlist" }).click()
      const dialog = page.getByRole("dialog", { name: "Create New Playlist" })
      await dialog.getByLabel("Name", { exact: true }).fill(playlistTitle)
      await dialog.getByLabel("Description (optional)").fill("Created by the Playwright smoke suite")

      const created = page.waitForResponse(
        response => response.request().method() === "POST" && new URL(response.url()).pathname === "/playlists"
      )
      await dialog.getByRole("button", { name: "Create" }).click()

      const response = await created
      expect(response.status()).toBe(201)
      createdPlaylistId = ((await response.json()) as PlaylistJson).id

      await expect(dialog).toBeHidden()
      await page.getByRole("link", { name: playlistTitle }).click()
      await expect(page).toHaveURL(`/playlists/${createdPlaylistId}`)
      await expect(page.getByText("No videos in this playlist yet.")).toBeVisible()
    })

    const playlistId = createdPlaylistId ?? ""

    await test.step("add videos", async () => {
      await page.getByRole("button", { name: "Add Videos" }).click()

      const addButtons = page.getByRole("button", { name: /^Add .+ to playlist$/ })
      await expect(addButtons.first()).toBeVisible()

      // Two videos when the account has them, so the reorder step has something to move.
      const toAdd = Math.min(await addButtons.count(), 2)

      for (let added = 1; added <= toAdd; added++) {
        const updated = page.waitForResponse(isPlaylistUpdate(playlistId))
        // An added video drops out of the search results, so the next one is first again.
        await addButtons.first().click()
        expect((await updated).status()).toBe(200)

        await expect(page.getByText(added === 1 ? "1 video" : `${added} videos`, { exact: true })).toBeVisible()
        await expect(rowPlayButtons(page)).toHaveCount(added)
      }

      await page.getByRole("button", { name: "Close", exact: true }).click()
    })

    await test.step("reorder the videos", async () => {
      const rowCount = await rowPlayButtons(page).count()
      if (rowCount < 2) {
        test.info().annotations.push({
          type: "skipped-step",
          description: `Reorder skipped: the account has ${rowCount} video(s) to add, at least 2 are needed`
        })
        return
      }

      const before = await rowPlayButtons(page).evaluateAll(buttons => buttons.map(button => button.ariaLabel))

      // dnd-kit's keyboard sensor: pick up the first row, move it down one place and drop it.
      const updated = page.waitForResponse(isPlaylistUpdate(playlistId))
      const firstHandle = page.locator('[aria-roledescription="sortable"]').first()
      await firstHandle.focus()
      await page.keyboard.press("Space")
      await page.keyboard.press("ArrowDown")
      await page.keyboard.press("Space")

      const response = await updated
      expect(response.status()).toBe(200)
      expect((await videoOrder(response)).length).toBe(rowCount)

      const expected = [before[1], before[0], ...before.slice(2)]
      await expect
        .poll(() => rowPlayButtons(page).evaluateAll(buttons => buttons.map(button => button.ariaLabel)))
        .toEqual(expected)

      // The new order is persisted, not just shown.
      await page.reload()
      await expect
        .poll(() => rowPlayButtons(page).evaluateAll(buttons => buttons.map(button => button.ariaLabel)))
        .toEqual(expected)
    })

    await test.step("delete the playlist", async () => {
      await page.getByRole("button", { name: "Delete playlist" }).click()

      const dialog = page.getByRole("dialog", { name: "Delete Playlist?" })
      await expect(dialog).toContainText(playlistTitle)

      const deleted = page.waitForResponse(
        response => response.request().method() === "DELETE" && new URL(response.url()).pathname === `/playlists/id/${playlistId}`
      )
      await dialog.getByRole("button", { name: "Delete" }).click()
      expect((await deleted).status()).toBe(200)
      createdPlaylistId = undefined

      await expect(page).toHaveURL("/playlists")
      await expect(page.getByRole("heading", { name: "Playlists" })).toBeVisible()
      await expect(page.getByRole("link", { name: playlistTitle })).toHaveCount(0)
    })
  })
})
