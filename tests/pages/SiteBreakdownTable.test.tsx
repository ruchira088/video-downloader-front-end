import { describe, expect, test } from "vitest"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"
import SiteBreakdownTable from "~/pages/authenticated/admin/SiteBreakdownTable"
import { buildVideoSiteSummary, durationJson } from "../fixtures"

const siteBreakdown = [
  buildVideoSiteSummary({
    site: "eporner",
    videoCount: 20,
    totalSize: 3_000_000_000,
    totalDuration: durationJson(30 * 3600),
    watchTime: durationJson(1800),
  }),
  buildVideoSiteSummary({
    site: "youtube",
    videoCount: 5,
    totalSize: 9_000_000_000,
    totalDuration: durationJson(2 * 3600),
    watchTime: durationJson(10 * 3600),
  }),
  buildVideoSiteSummary({
    site: "xvideos",
    videoCount: 40,
    totalSize: 1_000_000_000,
    totalDuration: durationJson(50 * 3600),
    watchTime: durationJson(0),
  }),
]

const siteOrder = () =>
  screen
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).getAllByRole("cell")[0].textContent)

describe("SiteBreakdownTable", () => {
  test("should list every site with its totals", () => {
    render(<SiteBreakdownTable siteBreakdown={siteBreakdown} />)

    const youtube = screen.getAllByRole("row").find((row) => row.textContent?.includes("youtube"))!
    expect(within(youtube).getAllByRole("cell").map((cell) => cell.textContent)).toEqual([
      "youtube",
      "5",
      "9.00GB",
      "2 h",
      "10 h",
    ])
  })

  test("should sort by video count, largest first, by default", () => {
    render(<SiteBreakdownTable siteBreakdown={siteBreakdown} />)

    expect(siteOrder()).toEqual(["xvideos", "eporner", "youtube"])
    expect(screen.getByRole("columnheader", { name: /videos/i })).toHaveAttribute("aria-sort", "descending")
  })

  test("should sort a numeric column largest first, then reverse on a second click", async () => {
    const user = userEvent.setup()
    render(<SiteBreakdownTable siteBreakdown={siteBreakdown} />)

    await user.click(screen.getByRole("button", { name: "Watch time" }))
    expect(siteOrder()).toEqual(["youtube", "eporner", "xvideos"])

    await user.click(screen.getByRole("button", { name: "Watch time" }))
    expect(siteOrder()).toEqual(["xvideos", "eporner", "youtube"])
  })

  test("should sort sites alphabetically when the Site column is chosen, then reverse", async () => {
    const user = userEvent.setup()
    render(<SiteBreakdownTable siteBreakdown={siteBreakdown} />)

    await user.click(screen.getByRole("button", { name: "Site" }))
    expect(siteOrder()).toEqual(["eporner", "xvideos", "youtube"])
    expect(screen.getByRole("columnheader", { name: /site/i })).toHaveAttribute("aria-sort", "ascending")

    await user.click(screen.getByRole("button", { name: "Site" }))
    expect(siteOrder()).toEqual(["youtube", "xvideos", "eporner"])
  })

  test.each([
    ["Size", ["youtube", "eporner", "xvideos"]],
    ["Duration", ["xvideos", "eporner", "youtube"]],
  ])("should sort by %s", async (column, expected) => {
    const user = userEvent.setup()
    render(<SiteBreakdownTable siteBreakdown={siteBreakdown} />)

    await user.click(screen.getByRole("button", { name: column }))
    expect(siteOrder()).toEqual(expected)
  })

  test("should label each cell for the stacked phone layout", () => {
    render(<SiteBreakdownTable siteBreakdown={siteBreakdown} />)

    const [firstRow] = screen.getAllByRole("row").slice(1)
    expect(within(firstRow).getAllByRole("cell").map((cell) => cell.getAttribute("data-label"))).toEqual([
      "Site",
      "Videos",
      "Size",
      "Duration",
      "Watch time",
    ])
  })
})
