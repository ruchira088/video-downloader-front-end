import { useCallback, type DependencyList, useEffect, useRef, useState } from "react"

interface PaginatedFetch {
  readonly isLoading: boolean
  readonly hasMore: boolean
  readonly loadMore: () => void
  // True when the last attempted page failed. The page stays retryable via `retry`.
  readonly hasError: boolean
  readonly retry: () => void
}

interface PaginatedFetchOptions {
  readonly pageSize: number
  // When any of these change, pagination resets to page 0 and re-fetches.
  readonly resetDeps?: DependencyList
}

// Covers both DOMException AbortError and axios CanceledError.
const isAbortError = (error: unknown): boolean =>
  (error instanceof DOMException && error.name === "AbortError") ||
  (error instanceof Error && error.name === "CanceledError")

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
  const [hasError, setHasError] = useState(false)

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

  const setLoading = useCallback((value: boolean) => {
    isLoadingRef.current = value
    setIsLoading(value)
  }, [])

  const loadPage = useCallback(async (page: number) => {
    if (fetchedPages.current.has(page)) return

    // Capture the controller and page set used for this request so that, after
    // the await, a reset (which replaces both) can be detected.
    const controller = abortController.current
    const pages = fetchedPages.current
    pages.add(page)
    setLoading(true)
    setHasError(false)

    try {
      const results = await fetchPageRef.current(page, controller.signal)

      // A reset or unmount aborted this request while it was in flight; its
      // results belong to a stale query, so drop them.
      if (controller.signal.aborted) return

      if (results.length < pageSize) {
        hasMoreRef.current = false
        setHasMore(false)
      }

      await onResultsRef.current(results, page)
    } catch (error) {
      // Forget the page so a failed fetch can be retried.
      pages.delete(page)

      if (!isAbortError(error)) {
        console.error(error)

        // Surfaced so the caller can offer a retry. Without one the list silently stalls:
        // the sentinel may already be in view, and IntersectionObserver only fires on a
        // transition, so nothing will ask for this page again.
        if (controller === abortController.current) {
          setHasError(true)
        }
      }
    } finally {
      // Only the request owning the current controller may flip the loading
      // state; an aborted/stale request must not clobber a newer request's.
      if (controller === abortController.current) {
        setLoading(false)
      }
    }
  }, [pageSize, setLoading])

  // Initial load, and reset whenever the reset dependencies change.
  //
  // `resetDeps` is supplied by the caller, so it cannot be an array literal here and the
  // dependencies cannot be verified statically — the same limitation applies to any hook that
  // forwards a DependencyList. The effect deliberately re-runs only on the caller's reset keys;
  // `loadPage` and `setLoading` are stable (useCallback) and the setState calls below are
  // guarded by the abort-controller identity check, so they cannot chain updates.
  /* oxlint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    abortController.current.abort()
    const controller = new AbortController()
    abortController.current = controller
    fetchedPages.current = new Set<number>()
    hasMoreRef.current = true
    setHasMore(true)
    setLoading(false)
    setHasError(false)

    if (pageNumber === 0) {
      void loadPage(0)
    } else {
      setPageNumber(0)
    }

    return () => controller.abort()
  }, resetDeps)
  /* oxlint-enable react-hooks/exhaustive-deps */

  // Load the next page whenever the page number advances.
  useEffect(() => {
    void loadPage(pageNumber)
  }, [pageNumber, loadPage])

  const loadMore = () => {
    if (!isLoadingRef.current && hasMoreRef.current) {
      setPageNumber(page => page + 1)
    }
  }

  // Re-attempts the page that failed; `loadPage` forgot it, so this is not a no-op.
  const retry = useCallback(() => {
    if (!isLoadingRef.current) {
      void loadPage(pageNumber)
    }
  }, [loadPage, pageNumber])

  return { isLoading, hasMore, loadMore, hasError, retry }
}
