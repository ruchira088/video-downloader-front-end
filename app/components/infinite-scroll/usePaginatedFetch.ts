import { type DependencyList, useEffect, useRef, useState } from "react"

interface PaginatedFetch {
  readonly isLoading: boolean
  readonly hasMore: boolean
  readonly loadMore: () => void
}

interface PaginatedFetchOptions {
  readonly pageSize: number
  // When any of these change, pagination resets to page 0 and re-fetches.
  readonly resetDeps?: DependencyList
}

/**
 * Encapsulates the infinite-scroll pagination control shared across pages:
 * page-number state, loading/has-more tracking, per-page de-duplication and the
 * `results.length < pageSize => hasMore = false` rule.
 *
 * The caller owns its accumulated data: `onResults` receives each fetched page
 * (and its page number) and is responsible for appending/merging it into state.
 * This keeps the hook agnostic to per-page bookkeeping (id de-duplication,
 * immutable maps, async per-item enrichment, etc.).
 */
export function usePaginatedFetch<T>(
  fetchPage: (pageNumber: number, signal: AbortSignal) => Promise<T[]>,
  onResults: (results: T[], pageNumber: number) => void | Promise<void>,
  options: PaginatedFetchOptions
): PaginatedFetch {
  const { pageSize, resetDeps = [] } = options

  const [pageNumber, setPageNumber] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const isLoadingRef = useRef(false)
  const hasMoreRef = useRef(true)
  const fetchedPages = useRef(new Set<number>())
  const abortController = useRef(new AbortController())

  // Hold the latest callbacks in refs so the effects below don't need them as
  // dependencies (which would re-trigger fetching on every render).
  const fetchPageRef = useRef(fetchPage)
  const onResultsRef = useRef(onResults)
  fetchPageRef.current = fetchPage
  onResultsRef.current = onResults

  const setLoading = (value: boolean) => {
    isLoadingRef.current = value
    setIsLoading(value)
  }

  const loadPage = async (page: number) => {
    if (fetchedPages.current.has(page)) return
    fetchedPages.current.add(page)
    setLoading(true)

    try {
      const results = await fetchPageRef.current(page, abortController.current.signal)

      if (results.length < pageSize) {
        hasMoreRef.current = false
        setHasMore(false)
      }

      await onResultsRef.current(results, page)
    } finally {
      setLoading(false)
    }
  }

  // Initial load, and reset whenever the reset dependencies change.
  useEffect(() => {
    abortController.current = new AbortController()
    fetchedPages.current = new Set<number>()
    hasMoreRef.current = true
    setHasMore(true)
    setLoading(false)

    if (pageNumber === 0) {
      loadPage(0)
    } else {
      setPageNumber(0)
    }
  }, resetDeps)

  // Load the next page whenever the page number advances.
  useEffect(() => {
    loadPage(pageNumber)
  }, [pageNumber])

  const loadMore = () => {
    if (!isLoadingRef.current && hasMoreRef.current) {
      setPageNumber(page => page + 1)
    }
  }

  return { isLoading, hasMore, loadMore }
}
