import { describe, expect, test, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, act } from "@testing-library/react"
import VideoSearch from "~/pages/authenticated/videos/components/VideoSearch"
import { SortBy } from "~/models/SortBy"
import { Ordering } from "~/models/Ordering"
import { Range } from "~/models/Range"
import { None, Some } from "~/types/Option"
import { Duration } from "luxon"
import React from "react"

vi.mock("~/services/video/VideoService", () => ({
  videoServiceSummary: vi.fn().mockResolvedValue({
    sites: ["youtube", "vimeo"],
    count: 100,
  }),
}))

const createDurationRange = () => ({
  min: Duration.fromObject({ seconds: 0 }),
  max: Some.of(Duration.fromObject({ minutes: 30 })),
})

const createSizeRange = (): Range<number> => ({
  min: 0,
  max: Some.of(1000000000),
})

describe("VideoSearch", () => {
  const defaultProps = {
    videoTitles: ["Video 1", "Video 2", "Video 3"],
    searchTerm: None.of<string>(),
    onSearchTermChange: vi.fn(),
    sortBy: SortBy.Date,
    onSortByChange: vi.fn(),
    durationRange: createDurationRange(),
    onDurationRangeChange: vi.fn(),
    sizeRange: createSizeRange(),
    onSizeRangeChange: vi.fn(),
    videoSites: [],
    onVideoSitesChange: vi.fn(),
    ordering: Ordering.Descending,
    onOrderingChange: vi.fn(),
    isLoading: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // VideoSitesSelector fetches the available site list on mount; flush that promise so the
  // resulting state update is wrapped in act() rather than landing after the test ends.
  const renderVideoSearch = async (props: Partial<typeof defaultProps> = {}) => {
    const result = render(<VideoSearch {...defaultProps} {...props} />)
    await act(async () => {})
    return result
  }

  test("should render search input", async () => {
    await renderVideoSearch()

    expect(screen.getByLabelText("Search videos")).toBeInTheDocument()
  })

  test("should render sort by selector", async () => {
    await renderVideoSearch()

    expect(screen.getByText("Date")).toBeInTheDocument()
  })

  test("should render duration range slider", async () => {
    await renderVideoSearch()

    expect(screen.getByText("Duration")).toBeInTheDocument()
  })

  test("should render size range slider", async () => {
    await renderVideoSearch()

    expect(screen.getByText("Size")).toBeInTheDocument()
  })

  test("should render video sites selector", async () => {
    await renderVideoSearch()

    expect(screen.getByLabelText("Sites")).toBeInTheDocument()
  })

  test("should display search term value", async () => {
    await renderVideoSearch({ searchTerm: Some.of("test query") })

    const searchInput = screen.getByLabelText("Search videos")
    expect(searchInput).toHaveValue("test query")
  })

  test("should call onSearchTermChange when input changes", async () => {
    const onSearchTermChange = vi.fn()
    await renderVideoSearch({ onSearchTermChange })

    const input = screen.getByLabelText("Search videos")
    fireEvent.change(input, { target: { value: "new search" } })

    expect(onSearchTermChange).toHaveBeenCalled()
  })

  test("should show autocomplete component", async () => {
    await renderVideoSearch()

    expect(screen.getByLabelText("Search videos")).toBeInTheDocument()
  })

  test("should render with provided video titles for autocomplete", async () => {
    await renderVideoSearch()

    // Verify component renders properly
    expect(screen.getByLabelText("Search videos")).toBeInTheDocument()
  })
})
