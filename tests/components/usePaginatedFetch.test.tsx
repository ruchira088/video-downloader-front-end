import { describe, expect, test, vi, afterEach } from "vitest"
import { act, renderHook, waitFor } from "@testing-library/react"
import { usePaginatedFetch } from "~/components/infinite-scroll/usePaginatedFetch"

type Deferred<T> = {
  readonly promise: Promise<T>
  readonly resolve: (value: T) => void
  readonly reject: (error: unknown) => void
}

const deferred = <T,>(): Deferred<T> => {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  return { promise, resolve, reject }
}

type Request = {
  readonly page: number
  readonly signal: AbortSignal
  readonly result: Deferred<string[]>
}

const deferredFetchPage = (requests: Request[]) =>
  vi.fn((page: number, signal: AbortSignal) => {
    const result = deferred<string[]>()
    requests.push({ page, signal, result })
    return result.promise
  })

describe("usePaginatedFetch", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test("should fetch page 0 once on mount and pass results to onResults", async () => {
    const fetchPage = vi.fn().mockResolvedValue(["a", "b"])
    const onResults = vi.fn()

    const { result } = renderHook(() => usePaginatedFetch(fetchPage, onResults, { pageSize: 2 }))

    await waitFor(() => expect(onResults).toHaveBeenCalledWith(["a", "b"], 0))

    // Both mount effects attempt page 0; per-page de-dup keeps it to one fetch
    expect(fetchPage).toHaveBeenCalledTimes(1)
    expect(result.current.hasMore).toBe(true)
    expect(result.current.isLoading).toBe(false)
  })

  test("should set hasMore to false when a page is shorter than pageSize", async () => {
    const fetchPage = vi.fn().mockResolvedValue(["only-one"])
    const onResults = vi.fn()

    const { result } = renderHook(() => usePaginatedFetch(fetchPage, onResults, { pageSize: 2 }))

    await waitFor(() => expect(result.current.hasMore).toBe(false))
    expect(onResults).toHaveBeenCalledWith(["only-one"], 0)
  })

  test("should fetch the next page when loadMore is called", async () => {
    const fetchPage = vi.fn().mockResolvedValue(["a", "b"])
    const onResults = vi.fn()

    const { result } = renderHook(() => usePaginatedFetch(fetchPage, onResults, { pageSize: 2 }))

    await waitFor(() => expect(onResults).toHaveBeenCalledWith(["a", "b"], 0))

    act(() => result.current.loadMore())

    await waitFor(() => expect(onResults).toHaveBeenCalledWith(["a", "b"], 1))
    expect(fetchPage).toHaveBeenCalledTimes(2)
  })

  test("should abort the in-flight request when resetDeps change and drop its stale results", async () => {
    const requests: Request[] = []
    const fetchPage = deferredFetchPage(requests)
    const onResults = vi.fn()

    const { rerender } = renderHook(
      ({ term }) => usePaginatedFetch(fetchPage, onResults, { pageSize: 2, resetDeps: [term] }),
      { initialProps: { term: "first" } }
    )

    expect(requests).toHaveLength(1)
    expect(requests[0].signal.aborted).toBe(false)

    rerender({ term: "second" })

    expect(requests[0].signal.aborted).toBe(true)
    expect(requests).toHaveLength(2)
    expect(requests[1].signal.aborted).toBe(false)

    // The new query's response arrives first...
    await act(async () => requests[1].result.resolve(["new-1", "new-2"]))
    // ...and the slow stale response resolves afterwards
    await act(async () => requests[0].result.resolve(["stale-1", "stale-2"]))

    expect(onResults).toHaveBeenCalledTimes(1)
    expect(onResults).toHaveBeenCalledWith(["new-1", "new-2"], 0)
  })

  test("should abort the in-flight request on unmount and not call onResults afterwards", async () => {
    const requests: Request[] = []
    const fetchPage = deferredFetchPage(requests)
    const onResults = vi.fn()

    const { unmount } = renderHook(() => usePaginatedFetch(fetchPage, onResults, { pageSize: 2 }))

    expect(requests).toHaveLength(1)

    unmount()

    expect(requests[0].signal.aborted).toBe(true)

    await act(async () => requests[0].result.resolve(["late-1", "late-2"]))

    expect(onResults).not.toHaveBeenCalled()
  })

  test("should log a failed fetch, leave it retryable and retry it on reset", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const error = new Error("network down")
    const fetchPage = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue(["a", "b"])
    const onResults = vi.fn()

    const { result, rerender } = renderHook(
      ({ term }) => usePaginatedFetch(fetchPage, onResults, { pageSize: 2, resetDeps: [term] }),
      { initialProps: { term: "first" } }
    )

    await waitFor(() => expect(consoleError).toHaveBeenCalledWith(error))
    expect(onResults).not.toHaveBeenCalled()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.hasMore).toBe(true)

    // The failed page is not poisoned: a reset fetches page 0 again
    rerender({ term: "second" })

    await waitFor(() => expect(onResults).toHaveBeenCalledWith(["a", "b"], 0))
    expect(fetchPage).toHaveBeenCalledTimes(2)
  })

  test.each([
    ["AbortError", new DOMException("The operation was aborted", "AbortError")],
    ["CanceledError", Object.assign(new Error("canceled"), { name: "CanceledError" })]
  ])("should swallow %s rejections without logging", async (_name, abortError) => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const fetchPage = vi.fn().mockRejectedValue(abortError)
    const onResults = vi.fn()

    renderHook(() => usePaginatedFetch(fetchPage, onResults, { pageSize: 2 }))

    // Flush the rejected fetch
    await act(async () => undefined)

    expect(onResults).not.toHaveBeenCalled()
    expect(consoleError).not.toHaveBeenCalled()
  })
})
